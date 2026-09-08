# rds.tf
#
# PostgreSQL database. Added in a later commit.
#
# Holds:
#   - aws_db_subnet_group          (private subnets only)
#   - aws_db_parameter_group       (rds.force_ssl = 1)
#   - aws_security_group.rds       (ingress 5432 from the ECS task SG only)
#   - aws_db_instance              (var.db_instance_class, single-AZ, not public,
#                                   storage encrypted, 7-day backups, final snapshot)
#   - output "rds_endpoint" (sensitive)
