variable "aws_region" {
  description = "AWS region for the state bucket, lock table, and CI role. Use the same region as the main module."
  type        = string
  default     = "us-east-1"
}

variable "state_bucket_name" {
  description = "Globally-unique S3 bucket name for Terraform remote state. Must match versions.tf backend `bucket` in the parent module."
  type        = string
  default     = "valley-sync-tfstate"
}

variable "lock_table_name" {
  description = "DynamoDB table name for state locking. Must match versions.tf backend `dynamodb_table` in the parent module."
  type        = string
  default     = "valley-sync-tflock"
}

variable "github_org" {
  description = "GitHub org or user that owns the repo (the part before the slash)."
  type        = string
}

variable "github_repo" {
  description = "GitHub repo name (the part after the slash)."
  type        = string
  default     = "valley-sync"
}
