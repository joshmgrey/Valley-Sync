# ecs.tf
#
# One Fargate service, one task (see deploy/terraform/README.md for why it is
# not scaled or made sticky). Runs in the public subnets with a public IP so it
# can reach ECR / SSM / api.github.com without a NAT gateway; inbound is locked
# to the ALB security group.

resource "aws_ecs_cluster" "main" {
  name = var.project
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.project}"
  retention_in_days = var.log_retention_days
}

# --- Task security group ----------------------------------------------

resource "aws_security_group" "ecs" {
  name_prefix = "${var.project}-ecs-"
  description = "Fargate task: ingress from the ALB only, all egress"
  vpc_id      = aws_vpc.main.id

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = "${var.project}-ecs" }
}

resource "aws_vpc_security_group_ingress_rule" "ecs_from_alb" {
  security_group_id            = aws_security_group.ecs.id
  description                  = "App port from the ALB"
  ip_protocol                  = "tcp"
  from_port                    = var.container_port
  to_port                      = var.container_port
  referenced_security_group_id = aws_security_group.alb.id
}

resource "aws_vpc_security_group_egress_rule" "ecs_all" {
  security_group_id = aws_security_group.ecs.id
  description       = "All outbound (ECR, SSM, RDS, GitHub OAuth)"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

# The rule declared-but-not-populated in rds.tf: only the task may reach 5432.
resource "aws_vpc_security_group_ingress_rule" "rds_from_ecs" {
  security_group_id            = aws_security_group.rds.id
  description                  = "Postgres from the Fargate task"
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  referenced_security_group_id = aws_security_group.ecs.id
}

# --- Task definitions ------------------------------------------------

locals {
  image = "${aws_ecr_repository.app.repository_url}:${var.image_tag}"

  # Container-level health check (ECS needs its own; the Dockerfile HEALTHCHECK
  # only helps `docker run`).
  healthcheck_cmd = "node -e \"fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\""

  app_secrets = [
    { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.database_url.arn },
    { name = "AUTH_SECRET", valueFrom = aws_ssm_parameter.auth_secret.arn },
    { name = "AUTH_GITHUB_ID", valueFrom = aws_ssm_parameter.auth_github_id.arn },
    { name = "AUTH_GITHUB_SECRET", valueFrom = aws_ssm_parameter.auth_github_secret.arn },
    { name = "AUTH_URL", valueFrom = aws_ssm_parameter.auth_url.arn },
    { name = "NEXT_PUBLIC_APP_URL", valueFrom = aws_ssm_parameter.app_url.arn },
  ]

  log_configuration = {
    logDriver = "awslogs"
    options = {
      "awslogs-group"         = aws_cloudwatch_log_group.app.name
      "awslogs-region"        = var.aws_region
      "awslogs-stream-prefix" = "ecs"
    }
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = var.project
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([
    {
      name        = var.project
      image       = local.image
      essential   = true
      stopTimeout = 25

      portMappings = [
        { containerPort = var.container_port, protocol = "tcp" },
      ]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = tostring(var.container_port) },
        # Auth.js v5 trusts X-Forwarded-* from the ALB for the callback URL.
        { name = "AUTH_TRUST_HOST", value = "true" },
      ]

      secrets = local.app_secrets

      logConfiguration = local.log_configuration

      healthCheck = {
        command     = ["CMD-SHELL", local.healthcheck_cmd]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    },
  ])
}

# One-off task. CI runs this with `aws ecs run-task` and waits for exit code 0
# BEFORE rolling the app service, so migrations never race a running task.
# `prisma migrate deploy` also takes a Postgres advisory lock.
resource "aws_ecs_task_definition" "migrate" {
  family                   = "${var.project}-migrate"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([
    {
      name      = "migrate"
      image     = local.image
      essential = true
      command   = ["npx", "prisma", "migrate", "deploy"]

      secrets = [
        { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.database_url.arn },
      ]

      logConfiguration = merge(local.log_configuration, {
        options = merge(local.log_configuration.options, { "awslogs-stream-prefix" = "migrate" })
      })
    },
  ])
}

# --- Service -------------------------------------------------------

resource "aws_ecs_service" "app" {
  name            = var.project
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  enable_execute_command = true

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = var.project
    container_port   = var.container_port
  }

  health_check_grace_period_seconds = 90

  # desired_count = 1, so this stops the old task only once the new one is
  # healthy: a brief two-task overlap, no downtime. Set to 0/100 for a clean
  # single-node handoff with a short gap instead.
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  wait_for_steady_state = var.wait_for_steady_state

  depends_on = [aws_lb_listener.https]
}

# --- Outputs (CI: run-task + roll the service) ---------------------

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.app.name
}

output "migrate_task_definition_arn" {
  value = aws_ecs_task_definition.migrate.arn
}

output "ecs_task_security_group_id" {
  value = aws_security_group.ecs.id
}
