# ecs.tf
#
# The service itself. Added in a later commit.
#
# Holds:
#   - aws_ecs_cluster
#   - aws_cloudwatch_log_group                  (/ecs/<project>, var.log_retention_days)
#   - aws_security_group.ecs                    (ingress container_port from ALB SG only)
#   - aws_ecs_task_definition.app               (image_tag, secrets from SSM,
#                                                AUTH_TRUST_HOST=true, container healthCheck)
#   - aws_ecs_task_definition.migrate           (same image, command = prisma migrate deploy)
#   - aws_ecs_service                           (desired_count, FARGATE, public subnets,
#                                                assign_public_ip, deployment circuit breaker)
#   - outputs: ecs_cluster_name, ecs_service_name, migrate_task_definition_arn,
#              ecs_subnet_ids, ecs_security_group_id  (CI needs these for run-task)
