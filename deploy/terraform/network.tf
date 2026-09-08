# network.tf
#
# VPC and routing. Added in a later commit.
#
# Holds:
#   - aws_vpc                         (var.vpc_cidr)
#   - aws_internet_gateway
#   - aws_subnet.public   x az_count  (ALB + the Fargate task; has a default route to the IGW)
#   - aws_subnet.private  x az_count  (RDS only; no internet route)
#   - aws_route_table.public + routes + associations
#   - aws_route_table.private + associations
#   - locals for the app FQDN (https://<subdomain>.<domain_name>)
#
# No NAT gateway: the single Fargate task runs in a public subnet with a public
# IP and is firewalled to ALB-only ingress by its security group. Saves ~$32/mo.
