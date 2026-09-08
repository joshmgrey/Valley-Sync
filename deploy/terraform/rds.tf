# rds.tf
#
# PostgreSQL. Smallest instance, single-AZ, not publicly accessible, only in
# the private subnets. The ingress rule that lets the ECS task reach 5432 is
# defined in ecs.tf (it references the task security group), so this file only
# declares the empty RDS security group.

resource "aws_db_subnet_group" "main" {
  name       = var.project
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_parameter_group" "main" {
  name   = "${var.project}-pg${var.db_engine_version}"
  family = "postgres${var.db_engine_version}"

  parameter {
    name         = "rds.force_ssl"
    value        = "1"
    apply_method = "immediate" # rds.force_ssl is a dynamic parameter
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.project}-rds-"
  description = "Postgres. Ingress only from the ECS task SG (rule in ecs.tf)."
  vpc_id      = aws_vpc.main.id

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = "${var.project}-rds" }
}

resource "aws_db_instance" "main" {
  identifier     = var.project
  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  allocated_storage = var.db_allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  multi_az               = false
  publicly_accessible    = false
  network_type           = "IPV4"

  backup_retention_period    = 7
  auto_minor_version_upgrade = true
  apply_immediately          = true # small app, no HA to protect from a restart

  deletion_protection       = var.db_deletion_protection
  skip_final_snapshot       = var.db_skip_final_snapshot
  final_snapshot_identifier = var.db_skip_final_snapshot ? null : "${var.project}-final"
}

# Full connection string the app and the migrate task consume. Composed here
# because it needs the instance endpoint. sslmode=require pairs with
# rds.force_ssl above.
resource "aws_ssm_parameter" "database_url" {
  name  = "${local.ssm_prefix}/DATABASE_URL"
  type  = "SecureString"
  value = "postgresql://${var.db_username}:${random_password.db.result}@${aws_db_instance.main.endpoint}/${var.db_name}?sslmode=require"
}

output "rds_endpoint" {
  description = "RDS host:port."
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}
