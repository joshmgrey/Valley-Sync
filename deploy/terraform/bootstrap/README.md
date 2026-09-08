# Bootstrap — one-time setup

Creates the things that must exist **before** `terraform init` can run in the
parent directory:

| Resource | Purpose |
|---|---|
| S3 bucket `valley-sync-tfstate` | Terraform remote state |
| DynamoDB table `valley-sync-tflock` | State locking |
| IAM OIDC provider for GitHub Actions | Keyless CI auth |
| IAM role `valley-sync-github-actions` | Role CI assumes to run Terraform + push images + roll ECS |

This module keeps its own **local** state (`deploy/terraform/bootstrap/terraform.tfstate`).
It cannot use the S3 backend because it is what creates that backend.

## Run it

```bash
cd deploy/terraform/bootstrap
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: github_org, github_repo, aws_region

terraform init
terraform plan
terraform apply
```

You need AWS credentials with permission to create S3 / DynamoDB / IAM resources
in your shell (e.g. `aws sso login`, or an admin access key exported as
`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`). This is the only step that needs
human AWS credentials — everything after runs through the CI role.

## After apply

1. Note the outputs:

   ```bash
   terraform output
   ```

2. If `state_bucket_name` / `lock_table_name` differ from the defaults, update the
   `backend "s3"` block in [`../versions.tf`](../versions.tf) to match.

3. In the GitHub repo, set the Actions Variables and Secrets listed in
   [`../README.md`](../README.md#3-github-repo-configuration) — `AWS_ROLE_ARN`
   comes from the `ci_role_arn` output here, `AWS_REGION` from `region`.

4. Continue with [`../README.md`](../README.md) for the first `terraform apply`
   of the application stack.

## Teardown

Do this **last**, after `terraform destroy` in the parent directory.

```bash
# empty the versioned state bucket first (all versions), then:
terraform destroy
```

`prevent_destroy` is set on the bucket — remove it from `main.tf` before the
destroy will succeed.
