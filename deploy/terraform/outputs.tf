# Outputs are added alongside the resources that produce them.
#
#   network.tf -> vpc_id, public_subnet_ids, private_subnet_ids
#   alb.tf     -> alb_dns_name
#   dns.tf     -> app_url
#   ecr.tf     -> ecr_repository_url
#   ecs.tf     -> ecs_cluster_name, ecs_service_name, migrate_task_definition_arn,
#                 ecs_security_group_id
#   rds.tf     -> rds_endpoint (sensitive)
#
# CI reads these to build/push the image, run the migrate task, and roll the
# service. Keep this file as the single place to see everything CI depends on.

output "vpc_id" {
  description = "ID of the application VPC."
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnets (ALB + Fargate task)."
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnets (RDS)."
  value       = aws_subnet.private[*].id
}
