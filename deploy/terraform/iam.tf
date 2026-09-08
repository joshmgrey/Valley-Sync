# iam.tf
#
# Runtime IAM roles for ECS. Added in a later commit.
# (The CI deploy role and GitHub OIDC provider live in ./bootstrap, not here.)
#
# Holds:
#   - aws_iam_role.ecs_execution   + AmazonECSTaskExecutionRolePolicy
#       + inline policy: ssm:GetParameters / kms:Decrypt scoped to the
#         secrets.tf parameter ARNs
#   - aws_iam_role.ecs_task        (app runtime identity; CloudWatch only,
#         DB access is by password not IAM)
