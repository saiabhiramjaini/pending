#!/usr/bin/env bash
# One-time Google Cloud setup for the CI/CD pipeline. Safe to re-run: it creates only what is
# missing and never overwrites a secret. It does not change your gcloud config.
set -euo pipefail

PROJECT=d6vs-496512
REGION=asia-southeast1 # Same region as the Neon database.
REPO=pending
RUNTIME_SA=pending-api
DEPLOY_SA=github-deployer
POOL=github
PROVIDER=pending
GITHUB_REPO=saiabhiramjaini/pending
ENV_FILE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)/.env"

g() { gcloud --project "$PROJECT" --quiet "$@"; }
runtime_email="$RUNTIME_SA@$PROJECT.iam.gserviceaccount.com"
deploy_email="$DEPLOY_SA@$PROJECT.iam.gserviceaccount.com"
project_number="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"

g services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com \
  iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com cloudresourcemanager.googleapis.com

g artifacts repositories describe "$REPO" --location "$REGION" >/dev/null 2>&1 ||
  g artifacts repositories create "$REPO" --location "$REGION" --repository-format docker

policy="$(mktemp)"
trap 'rm -f "$policy"' EXIT
cat >"$policy" <<'JSON'
[{ "name": "keep-recent", "action": { "type": "Keep" }, "mostRecentVersions": { "keepCount": 5 } },
 { "name": "delete-rest", "action": { "type": "Delete" }, "condition": { "tagState": "any" } }]
JSON
g artifacts repositories set-cleanup-policies "$REPO" --location "$REGION" --policy "$policy" --no-dry-run >/dev/null

for sa in "$RUNTIME_SA" "$DEPLOY_SA"; do
  g iam service-accounts describe "$sa@$PROJECT.iam.gserviceaccount.com" >/dev/null 2>&1 ||
    g iam service-accounts create "$sa"
done

# Values go through stdin so they never appear in arguments or logs.
if ! g secrets describe pending-database-url >/dev/null 2>&1; then
  grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\n' |
    g secrets create pending-database-url --replication-policy automatic --data-file=-
fi
if ! g secrets describe pending-jwt-secret >/dev/null 2>&1; then
  openssl rand -base64 48 | tr -d '\n' |
    g secrets create pending-jwt-secret --replication-policy automatic --data-file=-
fi
for secret in pending-database-url pending-jwt-secret; do
  g secrets add-iam-policy-binding "$secret" --member "serviceAccount:$runtime_email" \
    --role roles/secretmanager.secretAccessor >/dev/null
done

g projects add-iam-policy-binding "$PROJECT" --member "serviceAccount:$deploy_email" \
  --role roles/run.admin --condition=None >/dev/null
g artifacts repositories add-iam-policy-binding "$REPO" --location "$REGION" \
  --member "serviceAccount:$deploy_email" --role roles/artifactregistry.writer >/dev/null
g iam service-accounts add-iam-policy-binding "$runtime_email" \
  --member "serviceAccount:$deploy_email" --role roles/iam.serviceAccountUser >/dev/null

# Lets GitHub Actions deploy without a stored key, only from main of this repo.
g iam workload-identity-pools describe "$POOL" --location global >/dev/null 2>&1 ||
  g iam workload-identity-pools create "$POOL" --location global --display-name GitHub
g iam workload-identity-pools providers describe "$PROVIDER" --location global \
  --workload-identity-pool "$POOL" >/dev/null 2>&1 ||
  g iam workload-identity-pools providers create-oidc "$PROVIDER" --location global \
    --workload-identity-pool "$POOL" --display-name "Pending deploys" \
    --issuer-uri https://token.actions.githubusercontent.com \
    --attribute-mapping 'google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref' \
    --attribute-condition "assertion.repository=='$GITHUB_REPO' && assertion.ref=='refs/heads/main'"
g iam service-accounts add-iam-policy-binding "$deploy_email" --role roles/iam.workloadIdentityUser \
  --member "principalSet://iam.googleapis.com/projects/$project_number/locations/global/workloadIdentityPools/$POOL/attribute.repository/$GITHUB_REPO" >/dev/null

echo "Provider: projects/$project_number/locations/global/workloadIdentityPools/$POOL/providers/$PROVIDER"
echo "Setup complete."
