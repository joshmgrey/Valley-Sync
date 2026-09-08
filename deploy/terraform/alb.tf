# alb.tf
#
# Public entry point. Added in a later commit.
#
# Holds:
#   - aws_security_group.alb       (ingress 80 + 443 from 0.0.0.0/0)
#   - aws_lb                       (application, internet-facing, public subnets,
#                                   idle_timeout = 3600 to hold WebSockets open)
#   - aws_lb_target_group          (target_type = ip, HTTP:container_port,
#                                   health check GET /healthz, deregistration_delay 30)
#   - aws_lb_listener :80          (redirect to 443)
#   - aws_lb_listener :443         (ACM cert from dns.tf, forward to target group)
#   - output "alb_dns_name"
#
# WebSockets: the ALB upgrades HTTP/1.1 to the target automatically; no extra
# listener config. Single task (desired_count = 1) means no sticky sessions.
