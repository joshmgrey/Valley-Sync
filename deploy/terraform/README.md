# Valley Sync — AWS infrastructure

Terraform that stands up the whole stack on AWS: ECS Fargate (one task) behind an
ALB with HTTPS and WebSocket support, RDS PostgreSQL in private subnets, secrets
in SSM Parameter Store, and an ECR repo for the image.

> Status: **scaffold only.** The resource files (`network.tf`, `alb.tf`,
> `ecs.tf`, `rds.tf`, `iam.tf`, `secrets.tf`, `dns.tf`, `ecr.tf`) are stubs with
> a header describing their contents. They are filled in over the following
> commits. `terraform plan` will not produce a working stack yet.

## Layout

| File | Contents |
|---|---|
| `versions.tf` | Terraform + provider versions, S3 remote state backend |
| `providers.tf` | AWS provider, default tags |
| `variables.tf` | All inputs (see `terraform.tfvars.example`) |
| `outputs.tf` | Values CI consumes (ECR URL, cluster/service, migrate task ARN) |
| `locals.tf` | Derived values (the app FQDN / URL) |
| `network.tf` | VPC, public + private subnets, IGW, routes (no NAT) |
| `ecr.tf` | Image registry + lifecycle policy |
| `secrets.tf` | Generated DB password, SSM parameters (AUTH_*, app URL) |
| `rds.tf` | PostgreSQL instance, subnet group, security group, DATABASE_URL param |
| `iam.tf` | ECS task execution + task roles |
| `alb.tf` | ALB, target group, HTTP→HTTPS + HTTPS listeners, security group |
| `dns.tf` | ACM cert, Route53 validation + alias record |
| `ecs.tf` | Cluster, log group, app + migrate task defs, service |
| `bootstrap/` | One-time: state bucket, lock table, GitHub OIDC role |

## First-time setup

### 1. Bootstrap the backend

See [`bootstrap/README.md`](bootstrap/README.md). Creates the S3 state bucket,
the DynamoDB lock table, and the GitHub Actions OIDC role. Run once, with human
AWS credentials.

### 2. Prerequisites you provide

- A registered domain with a **public Route53 hosted zone** already created.
- A **GitHub OAuth app** whose Authorization callback URL is
  `https://<subdomain>.<domain_name>/api/auth/callback/github`.
  (The URL is compiled into the image via `NEXT_PUBLIC_APP_URL`, so the domain
  must be decided before the first image build — it cannot start on the ALB DNS
  name and move later without a rebuild and a new OAuth app.)
- `AUTH_SECRET`: `openssl rand -base64 32`.

### 3. Configure

```bash
cd deploy/terraform
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars
terraform init      # uses the S3 backend from step 1
terraform plan
```

### 4. First apply (once the resource files exist)

The first apply and image build are ordered by CI (see
`.github/workflows/`), but the manual sequence is:

1. `terraform apply` — creates everything; the task def points at the
   `image_tag` var (default `bootstrap`), which does not exist in ECR yet, so the
   service will not start a healthy task.
2. Build and push an image tagged with that value (or a git SHA) to the ECR repo
   from `terraform output ecr_repository_url`.
3. `terraform apply -var image_tag=<tag>` — task def now resolves; service rolls.
4. Run the migrate task once (CI does this with `aws ecs run-task` against
   `migrate_task_definition_arn`; wait for exit code 0 before rolling the app).

## Key decisions

- **One Fargate task, no sticky sessions.** Socket.io broadcasts and the rate
  limiter are per-process and there is no Redis adapter, so a second task would
  drop cross-node events and multiply the rate limit. `desired_count` is pinned
  to 1 by a variable validation. Going multi-node later means adding
  `@socket.io/redis-adapter` + ElastiCache first.
- **No NAT gateway.** The task runs in a public subnet with a public IP,
  firewalled to ALB-only ingress. Saves ~$32/mo. RDS stays fully private.
- **Migrations** run as a separate one-off ECS task (`prisma migrate deploy`,
  which also takes a Postgres advisory lock), before the app service is rolled.
  Never at container start.

## Teardown

```bash
cd deploy/terraform
terraform destroy
# then, if you want the backend gone too:
cd bootstrap && terraform destroy   # see its README re: prevent_destroy
```

Caveats: set `db_deletion_protection = false` and apply before destroy; the RDS
final snapshot is kept; ECR images are force-deleted with the repo.

## Rough cost

~$55–65/month in us-east-1: ALB ~$17, Fargate 0.5 vCPU/1 GB 24/7 ~$18, RDS
`db.t4g.micro` single-AZ + 20 GB ~$15, the rest (ECR, logs, Route53, transfer)
~$5. Adding a NAT gateway would add ~$32 + data.
