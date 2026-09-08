# dns.tf
#
# TLS certificate and DNS record. Added in a later commit.
#
# Holds:
#   - data.aws_route53_zone                     (existing zone for var.domain_name)
#   - aws_acm_certificate                       (<subdomain>.<domain_name>, DNS validation)
#   - aws_route53_record (validation CNAMEs)
#   - aws_acm_certificate_validation
#   - aws_route53_record (A alias -> ALB)
#   - output "app_url" = https://<subdomain>.<domain_name>
#
# GitHub OAuth callback must be set to:
#   https://<subdomain>.<domain_name>/api/auth/callback/github
