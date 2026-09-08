# ecr.tf
#
# Container image registry. Added in a later commit.
#
# Holds:
#   - aws_ecr_repository            (scan on push, immutable tags)
#   - aws_ecr_lifecycle_policy      (expire untagged, keep last N tagged)
#   - output "ecr_repository_url"
