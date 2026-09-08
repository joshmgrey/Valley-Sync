# ecr.tf
#
# Container image registry. CI pushes one immutable tag per commit (the git
# SHA); the ECS task definitions reference it through var.image_tag. No
# "latest" tag — immutable tags mean it could never move anyway, and the task
# def always pins an explicit SHA.

resource "aws_ecr_repository" "app" {
  name                 = var.project
  image_tag_mutability = "IMMUTABLE"
  force_delete         = true # let `terraform destroy` remove the repo with images in it

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images after 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Keep only the 10 most recent tagged images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = { type = "expire" }
      },
    ]
  })
}

output "ecr_repository_url" {
  description = "Push target for CI (docker build/push)."
  value       = aws_ecr_repository.app.repository_url
}
