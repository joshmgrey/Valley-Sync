# iam.tf
#
# Runtime IAM roles for ECS. (The CI deploy role + GitHub OIDC provider live in
# ./bootstrap, not here.)
#
#   ecs_execution — used by the ECS agent to start the task: pull the image
#                   (via the managed policy) and resolve the SSM secrets.
#   ecs_task      — the app's own identity. The app calls no AWS APIs; this only
#                   carries the channel permissions for `aws ecs execute-command`.

data "aws_iam_policy_document" "ecs_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# --- Execution role ------------------------------------------------------

resource "aws_iam_role" "ecs_execution" {
  name               = "${var.project}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "ecs_execution_secrets" {
  statement {
    sid     = "ReadTaskSecrets"
    actions = ["ssm:GetParameters"]
    resources = [
      aws_ssm_parameter.auth_secret.arn,
      aws_ssm_parameter.auth_github_id.arn,
      aws_ssm_parameter.auth_github_secret.arn,
      aws_ssm_parameter.auth_url.arn,
      aws_ssm_parameter.app_url.arn,
      aws_ssm_parameter.database_url.arn,
    ]
  }

  statement {
    sid       = "DecryptTaskSecrets"
    actions   = ["kms:Decrypt"]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["ssm.${var.aws_region}.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name   = "task-secrets"
  role   = aws_iam_role.ecs_execution.id
  policy = data.aws_iam_policy_document.ecs_execution_secrets.json
}

# --- Task role ---------------------------------------------------------

resource "aws_iam_role" "ecs_task" {
  name               = "${var.project}-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}

# Lets `aws ecs execute-command` open a shell into the running task — the only
# way in, since there is no SSH and one task. Requires enable_execute_command
# on the service (ecs.tf).
data "aws_iam_policy_document" "ecs_task_exec" {
  statement {
    sid = "SSMExecChannels"
    actions = [
      "ssmmessages:CreateControlChannel",
      "ssmmessages:CreateDataChannel",
      "ssmmessages:OpenControlChannel",
      "ssmmessages:OpenDataChannel",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "ecs_task_exec" {
  name   = "ecs-exec"
  role   = aws_iam_role.ecs_task.id
  policy = data.aws_iam_policy_document.ecs_task_exec.json
}
