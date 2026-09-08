output "state_bucket_name" {
  description = "Set this as `bucket` in ../versions.tf backend."
  value       = aws_s3_bucket.state.id
}

output "lock_table_name" {
  description = "Set this as `dynamodb_table` in ../versions.tf backend."
  value       = aws_dynamodb_table.lock.name
}

output "ci_role_arn" {
  description = "Add as the AWS_ROLE_ARN repo variable in GitHub Actions."
  value       = aws_iam_role.ci.arn
}

output "region" {
  value = var.aws_region
}
