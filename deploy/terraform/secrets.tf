# secrets.tf
#
# Runtime configuration, stored in SSM Parameter Store and injected into the
# ECS task definition as `secrets` (resolved at task start by the execution
# role in iam.tf). The three real secrets come from terraform.tfvars, which is
# gitignored; everything else is derived.
#
# The composed DATABASE_URL parameter lives in rds.tf, next to the instance
# whose endpoint it depends on.

resource "random_password" "db" {
  length = 32
  # URL-safe alphabet only: this value goes straight into DATABASE_URL with no
  # percent-encoding.
  special          = true
  override_special = "-_"
}

locals {
  ssm_prefix = "/${var.project}"
}

resource "aws_ssm_parameter" "auth_secret" {
  name  = "${local.ssm_prefix}/AUTH_SECRET"
  type  = "SecureString"
  value = var.auth_secret
}

resource "aws_ssm_parameter" "auth_github_id" {
  name  = "${local.ssm_prefix}/AUTH_GITHUB_ID"
  type  = "SecureString"
  value = var.auth_github_id
}

resource "aws_ssm_parameter" "auth_github_secret" {
  name  = "${local.ssm_prefix}/AUTH_GITHUB_SECRET"
  type  = "SecureString"
  value = var.auth_github_secret
}

# Non-secret, but injected the same way to keep one config path.
resource "aws_ssm_parameter" "auth_url" {
  name  = "${local.ssm_prefix}/AUTH_URL"
  type  = "String"
  value = local.app_url
}

resource "aws_ssm_parameter" "app_url" {
  name  = "${local.ssm_prefix}/NEXT_PUBLIC_APP_URL"
  type  = "String"
  value = local.app_url
}
