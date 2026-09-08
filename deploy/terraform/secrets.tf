# secrets.tf
#
# Configuration injected into the task definition. Added in a later commit.
#
# Holds:
#   - random_password.db                       (RDS master password)
#   - aws_ssm_parameter (SecureString): AUTH_SECRET, AUTH_GITHUB_ID,
#       AUTH_GITHUB_SECRET, DATABASE_URL
#   - aws_ssm_parameter (String): AUTH_URL, NEXT_PUBLIC_APP_URL
#
# DATABASE_URL is composed from the RDS endpoint + random_password with
# ?sslmode=require. The ECS execution role (iam.tf) is granted ssm:GetParameters
# on exactly these parameter ARNs.
