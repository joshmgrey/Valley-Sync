terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Remote state. These values must match the outputs of ./bootstrap, which
  # creates the bucket and lock table. A backend block cannot reference
  # variables, so they are hardcoded here on purpose.
  #
  # If "valley-sync-tfstate" is already taken (S3 bucket names are global),
  # pick another name in bootstrap/terraform.tfvars and update `bucket` below.
  #
  # First-time init (after bootstrap has been applied):
  #   terraform init
  backend "s3" {
    bucket         = "valley-sync-tfstate"
    key            = "infra/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "valley-sync-tflock"
    encrypt        = true
  }
}
