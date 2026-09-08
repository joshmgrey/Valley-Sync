# Outputs are added alongside the resources that produce them, in later commits:
#
#   alb.tf  -> alb_dns_name
#   dns.tf  -> app_url
#   ecr.tf  -> ecr_repository_url
#   ecs.tf  -> ecs_cluster_name, ecs_service_name, migrate_task_definition_arn
#   rds.tf  -> rds_endpoint (sensitive)
#
# CI reads these to build/push the image, run the migrate task, and roll the
# service. Keep this file as the single place to see everything CI depends on.
