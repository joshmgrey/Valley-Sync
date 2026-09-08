# ---------------------------------------------------------------------------
# Global
# ---------------------------------------------------------------------------

variable "aws_region" {
  description = "AWS region for all resources. Must match the region in versions.tf backend."
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Name prefix applied to every resource."
  type        = string
  default     = "valley-sync"
}

# ---------------------------------------------------------------------------
# Networking
# ---------------------------------------------------------------------------

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones to spread subnets across (ALB requires >= 2)."
  type        = number
  default     = 2
}

# ---------------------------------------------------------------------------
# DNS / TLS
# ---------------------------------------------------------------------------

variable "domain_name" {
  description = "Root domain with an existing Route53 public hosted zone, e.g. example.com."
  type        = string
}

variable "subdomain" {
  description = "Subdomain label the app is served at. `app` => app.<domain_name>."
  type        = string
  default     = "app"
}

# ---------------------------------------------------------------------------
# Compute (ECS Fargate)
# ---------------------------------------------------------------------------

variable "container_cpu" {
  description = "Fargate task CPU units (512 = 0.5 vCPU)."
  type        = number
  default     = 512
}

variable "container_memory" {
  description = "Fargate task memory in MiB."
  type        = number
  default     = 1024
}

variable "container_port" {
  description = "Port the Node server listens on inside the container."
  type        = number
  default     = 3000
}

variable "desired_count" {
  description = "Number of app tasks. Keep at 1: Socket.io rooms and the rate limiter are per-process (no Redis adapter)."
  type        = number
  default     = 1

  validation {
    condition     = var.desired_count == 1
    error_message = "desired_count must stay 1 until a Socket.io Redis adapter is added; see deploy/terraform/README.md."
  }
}

variable "image_tag" {
  description = "ECR image tag to deploy. CI overrides this with the git SHA on every merge to main."
  type        = string
  default     = "bootstrap"
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention for the app log group."
  type        = number
  default     = 14
}

# ---------------------------------------------------------------------------
# Database (RDS PostgreSQL)
# ---------------------------------------------------------------------------

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GiB."
  type        = number
  default     = 20
}

variable "db_engine_version" {
  description = "PostgreSQL major version."
  type        = string
  default     = "16"
}

variable "db_name" {
  description = "Initial database name."
  type        = string
  default     = "valley_sync"
}

variable "db_username" {
  description = "Master username. The password is generated and stored in SSM, never set here."
  type        = string
  default     = "valley"
}

variable "db_deletion_protection" {
  description = "Block accidental deletion of the RDS instance."
  type        = bool
  default     = true
}

variable "db_skip_final_snapshot" {
  description = "Skip the final snapshot on destroy. Leave false for real environments; flip to true for throwaway test stacks."
  type        = bool
  default     = false
}

# ---------------------------------------------------------------------------
# Application secrets (values live in terraform.tfvars, which is gitignored)
# ---------------------------------------------------------------------------

variable "auth_secret" {
  description = "Auth.js AUTH_SECRET (openssl rand -base64 32)."
  type        = string
  sensitive   = true
}

variable "auth_github_id" {
  description = "GitHub OAuth app client ID for the production callback URL."
  type        = string
  sensitive   = true
}

variable "auth_github_secret" {
  description = "GitHub OAuth app client secret."
  type        = string
  sensitive   = true
}
