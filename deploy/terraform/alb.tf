# alb.tf
#
# Public entry point. Terminates TLS, redirects HTTP->HTTPS, forwards to the
# Fargate task. The ALB upgrades the Socket.io WebSocket automatically (it
# always speaks HTTP/1.1 to targets); idle_timeout is raised well past the
# Socket.io ping interval so quiet connections are not culled.

# --- Security group -----------------------------------------------------

resource "aws_security_group" "alb" {
  name_prefix = "${var.project}-alb-"
  description = "Public ALB: HTTP/HTTPS from anywhere"
  vpc_id      = aws_vpc.main.id

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = "${var.project}-alb" }
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  security_group_id = aws_security_group.alb.id
  description       = "HTTP (redirected to HTTPS)"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  security_group_id = aws_security_group.alb.id
  description       = "HTTPS"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_egress_rule" "alb_to_tasks" {
  security_group_id = aws_security_group.alb.id
  description       = "Forward to the ECS task"
  ip_protocol       = "tcp"
  from_port         = var.container_port
  to_port           = var.container_port
  cidr_ipv4         = var.vpc_cidr
}

# --- Load balancer -----------------------------------------------------

resource "aws_lb" "main" {
  name               = var.project
  load_balancer_type = "application"
  internal           = false
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  idle_timeout               = 3600
  drop_invalid_header_fields = true
  enable_deletion_protection = false
}

resource "aws_lb_target_group" "app" {
  name        = "${var.project}-app"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip" # Fargate awsvpc tasks register by ENI IP

  deregistration_delay = 30 # don't wait 300s on long-lived WebSockets during deploys

  health_check {
    path                = "/healthz"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  # Single task, so no stickiness needed (and Socket.io broadcasts are
  # per-process anyway — see deploy/terraform/README.md).
}

# --- Listeners --------------------------------------------------------

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.main.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# --- DNS record ------------------------------------------------------

resource "aws_route53_record" "app" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.fqdn
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

output "alb_dns_name" {
  description = "ALB hostname (the Route53 record aliases to this)."
  value       = aws_lb.main.dns_name
}
