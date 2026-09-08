terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }

  # Local state on purpose: this module creates the S3 bucket and DynamoDB
  # table that every other Terraform run uses as its backend. The resulting
  # terraform.tfstate is gitignored — back it up somewhere safe. It only
  # tracks the backend resources + the CI role, all cheap to recreate.
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "valley-sync"
      ManagedBy = "terraform"
      Component = "bootstrap"
    }
  }
}
