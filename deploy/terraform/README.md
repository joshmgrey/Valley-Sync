# Valley Sync — AWS infrastructure

Terraform for the whole stack: ECS Fargate (one task) behind an ALB with HTTPS
and WebSocket support, RDS PostgreSQL in private subnets, image in ECR, secrets
in SSM Parameter Store, DNS + TLS via Route53 + ACM.

## Layout

| File | Contents |
|---|---|
| `versions.tf` | Terraform + provider versions, S3 remote-state backend |
| `providers.tf` | AWS provider, default tags |
| `variables.tf` | All inputs (see `terraform.tfvars.example`) |
| `locals.tf` | Derived values — the app FQDN / URL |
| `outputs.tf` | Index comment + network outputs |
| `network.tf` | VPC, 2 public + 2 private subnets, IGW, route tables (no NAT) |
| `ecr.tf` | Image registry + lifecycle policy |
| `secrets.tf` | Generated DB password, SSM parameters (`AUTH_*`, app URL) |
| `rds.tf` | PostgreSQL instance, subnet group, parameter group, SG, `DATABASE_URL` |
| `iam.tf` | ECS execution role (image pull + secret resolution), task role (ECS Exec) |
| `alb.tf` | ALB, target group (`/healthz`), `:80`→`:443` redirect, `:443` HTTPS, SG, DNS alias |
| `dns.tf` | ACM certificate + Route53 DNS validation |
| `ecs.tf` | Cluster, log group, app + migrate task defs, service, task/RDS SG rules |
| `bootstrap/` | One-time, local state: state bucket, lock table, GitHub OIDC provider + CI role |

Outputs live next to the resources that produce them. `terraform output` after a
successful apply: `app_url`, `alb_dns_name`, `ecr_repository_url`,
`ecs_cluster_name`, `ecs_service_name`, `migrate_task_definition_arn`,
`migrate_network_configuration`, `rds_endpoint` (sensitive), `vpc_id`,
`public_subnet_ids`, `private_subnet_ids`.

## First-time setup

### 1. Bootstrap the backend

One-time, with human AWS credentials. See [`bootstrap/README.md`](bootstrap/README.md).
Creates the S3 state bucket, DynamoDB lock table, GitHub OIDC provider, and the
`valley-sync-github-actions` role. Note its outputs.

If you changed `state_bucket_name` / `lock_table_name` from the defaults, update
the `backend "s3"` block in [`versions.tf`](versions.tf) to match (a backend
block can't read variables).

### 2. Things you provide

- A registered domain with a **public Route53 hosted zone** already created.
- `AUTH_SECRET` — `openssl rand -base64 32`.
- A **production GitHub OAuth app** (Settings → Developer settings → OAuth Apps)
  with Authorization callback URL
  `https://<subdomain>.<domain_name>/api/auth/callback/github`.
  This host is compiled into the image (`NEXT_PUBLIC_APP_URL` — client bundle +
  edge middleware CSRF check), so **decide the subdomain now**; you can't start
  on the ALB DNS name and move later without a rebuild and a new OAuth app.

### 3. GitHub repo configuration

Settings → Secrets and variables → Actions:

| Kind | Name | Value |
|---|---|---|
| Variable | `AWS_ROLE_ARN` | `ci_role_arn` from bootstrap |
| Variable | `AWS_REGION` | must match `versions.tf` backend region |
| Variable | `DOMAIN_NAME` | e.g. `example.com` |
| Variable | `SUBDOMAIN` | e.g. `app` |
| Secret | `AUTH_SECRET` | the value from step 2 |
| Secret | `AUTH_GITHUB_ID` | production OAuth app client ID |
| Secret | `AUTH_GITHUB_SECRET` | production OAuth app client secret |

### 4. First apply

`terraform.tfvars` is only needed for running Terraform locally; CI passes the
same values as `TF_VAR_*`. To do the first apply locally:

```bash
cd deploy/terraform
cp terraform.tfvars.example terraform.tfvars   # fill in domain, subdomain, AUTH_*
terraform init

# a. Create the ECR repo so there is somewhere to push.
terraform apply -target=aws_ecr_repository.app

# b. Build + push the first image. NEXT_PUBLIC_APP_URL must equal
#    https://<subdomain>.<domain_name>.
REPO=$(terraform output -raw ecr_repository_url)
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin "${REPO%/*}"
docker build \
  --build-arg NEXT_PUBLIC_APP_URL="https://<subdomain>.<domain_name>" \
  --build-arg DATABASE_URL="postgresql://build:build@localhost:5432/build" \
  -t "$REPO:first" ../..
docker push "$REPO:first"

# c. Full apply. wait_for_steady_state=false because the ACM cert + RDS + ALB
#    take ~10-15 min to create and the service needs the DB before it is healthy.
terraform apply -var="image_tag=first" -var="wait_for_steady_state=false"

# d. Run migrations, then let the service settle.
CLUSTER=$(terraform output -raw ecs_cluster_name)
aws ecs run-task --cluster "$CLUSTER" \
  --task-definition "$(terraform output -raw migrate_task_definition_arn)" \
  --launch-type FARGATE \
  --network-configuration "$(terraform output -raw migrate_network_configuration)"
# wait for it to STOP with exit code 0, then:
aws ecs wait services-stable --cluster "$CLUSTER" --services "$(terraform output -raw ecs_service_name)"
```

After this, every push to `main` runs the same sequence automatically
(`.github/workflows/ci.yml` → `deploy` job).

## Ongoing deploys

The `deploy` job on push to `main`:

1. `terraform apply -target=aws_ecr_repository.app` (no-op after the first)
2. `docker build` + push `:<git-sha>`
3. `terraform apply -var image_tag=<sha> -var wait_for_steady_state=false`
4. `aws ecs run-task` migrate task; **fail the job unless it exits 0**
5. `aws ecs wait services-stable`; **fail unless `PRIMARY` `rolloutState == COMPLETED`**

PRs get `terraform fmt -check`, `validate`, and a `terraform plan` comment.

## Key decisions

- **One Fargate task, no sticky sessions.** Socket.io broadcasts (`io.to(room)`,
  `socket.broadcast`) and the rate limiter are per-process and there is no Redis
  adapter, so a second task would drop cross-node events and multiply the rate
  limit. `desired_count` is pinned to 1 by a variable validation. Multi-node
  later = add `@socket.io/redis-adapter` + ElastiCache first, then relax the
  validation and add ALB stickiness.
- **ALB + WebSockets.** No special configuration — the ALB performs the
  HTTP/1.1 `Upgrade` to the target automatically. `idle_timeout = 3600` keeps
  quiet connections open; `deregistration_delay = 30` stops deploys hanging on
  long-lived sockets (clients auto-reconnect).
- **No NAT gateway.** The task runs in a public subnet with a public IP,
  firewalled to ALB-only ingress. Saves ~$32/mo + data. RDS is never in a public
  subnet and its SG only admits the task SG.
- **Migrations.** A dedicated one-off task (`prisma migrate deploy`, which also
  takes a Postgres advisory lock) — never at container start, and only one per
  deploy, so no race between tasks. It runs right after the `apply` that updates
  the task definitions; with `wait_for_steady_state=false` the new app task and
  the migrate task overlap by a few seconds, so **keep migrations
  backward-compatible** (expand/contract). For strictly-before ordering, add
  `lifecycle { ignore_changes = [task_definition] }` to `aws_ecs_service.app`
  and have CI call `aws ecs update-service` after the migrate step.
- **Rollback.** `deployment_circuit_breaker { rollback = true }` returns the
  service to the last good task set on a failed deploy; CI then fails because the
  `PRIMARY` rollout state is not `COMPLETED`.

## Operations

```bash
# Logs
aws logs tail /ecs/valley-sync --follow

# Shell into the running task (needs enable_execute_command, which is set)
aws ecs execute-command --cluster valley-sync --task <task-id> \
  --container valley-sync --interactive --command /bin/sh

# psql — no public path to RDS; go through the task
aws ecs execute-command ... --command "npx prisma studio"   # or psql "$DATABASE_URL"
```

## Teardown

```bash
cd deploy/terraform
terraform apply -var="db_deletion_protection=false"   # if it was true
terraform destroy -var="image_tag=<any>"

cd bootstrap
# empty the versioned state bucket, remove prevent_destroy from main.tf, then:
terraform destroy
```

Notes: the RDS final snapshot (`valley-sync-final`) is kept unless you also set
`db_skip_final_snapshot=true`; ECR images are force-deleted with the repo; ACM
and Route53 records delete cleanly.

## Rough cost

~$55–65/month in us-east-1: ALB ~$17, Fargate 0.5 vCPU / 1 GB 24/7 ~$18, RDS
`db.t4g.micro` single-AZ + 20 GB gp3 ~$15, rest (ECR, logs, Route53, transfer)
~$5. A NAT gateway would add ~$32 + data.

## Alternative considered: single EC2

A `t4g.small` running Docker + a `postgres:16` container + Caddy (Let's Encrypt),
Terraform-managed, is ~$14–18/month — about a quarter of the above. What you give
up: managed Postgres (PITR, automated patching, one-click Multi-AZ), zero-downtime
rolling deploys and health-based replacement, OS/Docker patching becomes yours,
and compute + data share one EBS volume (a bad box takes the DB with it). It
matches this app's real single-node concurrency model; the Fargate/RDS build
mainly buys database durability and hands-off deploys. Not implemented here.
