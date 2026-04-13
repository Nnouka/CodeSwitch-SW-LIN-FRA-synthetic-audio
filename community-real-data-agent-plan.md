# Community-Sourced Real Data: Agent Implementation Plan

Date: April 13, 2026  
Target domain: French-Swahili-Lingala code-switch speech collection  
Delivery style: Vite + React + TypeScript frontend, deployed on S3 + CloudFront, DNS via Route 53 on lilics.yinyangr.com, provisioned by CloudFormation.

## 1. Objective

Build a production-ready community data collection platform where contributors can:
- read clear consent and participation instructions,
- record/upload code-switched speech samples,
- submit metadata (language mix, location, context tags),
- receive quality feedback,
- and complete sessions safely on mobile and desktop.

Build an internal "agent" workflow that helps with:
- prompt generation for eliciting natural code-switch speech,
- automated first-pass quality checks,
- moderation triage,
- and dataset packaging readiness flags.

## 2. Scope

In scope:
- Public web app hosted on CloudFront + S3.
- Custom domain lilics.yinyangr.com via Route 53 alias record.
- Infrastructure-as-code in CloudFormation.
- Upload flow to S3 via pre-signed URLs.
- Contributor session flow with consent + metadata.
- Basic reviewer console (can be v1 lightweight route inside same React app).
- Agent services for prompting and quality checks.

Out of scope (v1):
- Native mobile app.
- Real-time human moderation chat.
- Full MLOps retraining pipeline.

## 3. High-Level Architecture

Frontend and edge:
- Vite + React + TypeScript SPA.
- S3 bucket for static assets.
- CloudFront distribution for global CDN + HTTPS.
- ACM certificate in us-east-1 for CloudFront TLS.
- Route 53 hosted zone record: lilics.yinyangr.com -> CloudFront.

API and logic:
- API Gateway (HTTP API).
- Lambda functions for consent/session/upload/agent checks.
- Optional Cognito for authenticated reviewer roles.
- DynamoDB for session state and submission metadata.
- S3 data bucket for raw audio uploads.

Agent layer:
- Prompt Agent: chooses prompt packs by contributor profile/language comfort.
- QC Agent: runs audio sanity checks (duration, clipping, silence, SNR proxy).
- Moderation Agent: flags risky/toxic/PII content for reviewer queue.

Observability and ops:
- CloudWatch logs and alarms.
- CloudFront access logs to S3.
- Dead-letter queue (SQS) for async processing failures (optional but recommended).

## 4. User Flows

## 4.1 Contributor Flow

1. Landing page at lilics.yinyangr.com.
2. Consent form (required) with language options.
3. Prompt selection (agent-curated pack).
4. Audio recording or upload.
5. Metadata form:
   - languages used,
   - rough location (optional coarse region),
   - topic category,
   - speaking style (formal/informal).
6. Client requests pre-signed upload URL.
7. Browser uploads audio directly to S3.
8. Backend stores submission record in DynamoDB.
9. QC agent returns pass/warn/fail with actionable tips.
10. Contributor confirms submission.

## 4.2 Reviewer Flow

1. Reviewer logs in (Cognito group: reviewer/admin).
2. Sees queue of flagged/unchecked submissions.
3. Listens to sample + reviews transcript/metadata.
4. Approves, rejects, or requests re-collection tag.
5. Status updates stored in DynamoDB.

## 5. Data Model (v1)

DynamoDB tables:
- `ContributorSessions`
  - pk: sessionId
  - consentAcceptedAt
  - locale
  - deviceInfo
- `Submissions`
  - pk: submissionId
  - sessionId
  - s3ObjectKey
  - promptId
  - langMix
  - topicTag
  - qcStatus
  - moderationStatus
  - createdAt
- `Prompts`
  - pk: promptId
  - text
  - languageHints
  - targetSwitchProfile
  - active

S3 layout:
- `s3://lilics-raw-audio-{env}/raw/{yyyy}/{mm}/{dd}/{submissionId}.wav`
- `s3://lilics-web-{env}/` for frontend build artifacts.
- `s3://lilics-logs-{env}/` for CloudFront and app logs.

## 6. CloudFormation Stack Design

Use one root stack with nested stacks for clarity.

Root stack:
- Parameters:
  - ProjectName (default: lilics)
  - Environment (dev/stage/prod)
  - DomainName (default: lilics.yinyangr.com)
  - HostedZoneName (default: yinyangr.com)
  - EnableCognito (true/false)
- Outputs:
  - CloudFrontDomainName
  - WebsiteURL
  - ApiUrl

Nested stack A: Storage
- S3 website bucket (private, OAC-only access).
- S3 raw audio bucket (private, SSE enabled).
- S3 logs bucket.
- Bucket policies with least privilege.
- Lifecycle rules for logs and optional raw archival tiers.

Nested stack B: CDN + DNS
- CloudFront distribution with OAC.
- Alternate domain names includes lilics.yinyangr.com.
- ACM certificate ARN parameter (issued in us-east-1).
- Route 53 A/AAAA alias records.
- Security headers policy (HSTS, X-Content-Type-Options, etc.).

Nested stack C: API
- API Gateway HTTP API.
- Lambda functions:
  - `CreateSessionFn`
  - `GetPromptPackFn`
  - `CreateUploadUrlFn`
  - `FinalizeSubmissionFn`
  - `RunQcFn`
  - `ModerationTriageFn`
- IAM roles and policies scoped per function.
- DynamoDB tables.
- Optional SQS queue for async QC.

Nested stack D: Auth (optional for v1 contributors, recommended for reviewers)
- Cognito user pool.
- App client.
- User groups: reviewer, admin.
- API authorizer wiring.

## 7. Frontend Implementation Plan (Vite + React + TypeScript)

## 7.1 App Structure

```text
src/
  app/
    router.tsx
    providers/
  features/
    consent/
    prompts/
    recorder/
    metadata/
    submission/
    reviewer/
  services/
    apiClient.ts
    upload.ts
  components/
    ui/
    forms/
  utils/
    audio/
    validation/
```

## 7.2 Key Screens

- `/` landing + project purpose.
- `/consent` consent and eligibility.
- `/collect` recorder/upload + prompt + metadata.
- `/thank-you` completion status.
- `/review` reviewer queue (auth required).

## 7.3 Recorder Requirements

- Browser MediaRecorder API support.
- Preferred output wav or high-bitrate webm/ogg (convert server-side if needed).
- Display duration and basic waveform.
- Enforce min/max duration constraints.
- Local replay before upload.

## 7.4 Frontend Security

- No AWS credentials in client.
- Use short-lived pre-signed URLs only.
- Validate file type and size before upload.
- CSRF and origin checks on API.

## 8. Agent Implementation Plan

Agent services run as Lambda functions behind API.

## 8.1 Prompt Agent

Inputs:
- contributor locale,
- prior completion history,
- target switch intensity.

Logic:
- select prompts from `Prompts` table by domain and target switch profile,
- diversify by topic,
- avoid repeating recent prompts in same session.

Output:
- ordered prompt pack with language guidance.

## 8.2 QC Agent

Checks (fast pass):
- duration bounds,
- silence ratio,
- clipping ratio,
- low-volume warning,
- format validation.

Checks (extended pass, async):
- ASR back-transcription confidence proxy,
- rough language ID proportions,
- potential non-speech or music contamination.

Output:
- `pass | warn | fail` + structured reasons.

## 8.3 Moderation Agent

Checks:
- profanity/hate heuristics,
- PII cues (phone numbers, names when disallowed),
- policy-sensitive topics for manual review.

Output:
- moderation label and reviewer priority score.

## 9. Deployment Plan (CloudFormation First)

## 9.1 Environments

- `dev`: internal testing.
- `stage`: UAT and pilot contributors.
- `prod`: public collection.

## 9.2 CI/CD Outline

1. Push to repository main branch.
2. Build frontend (`npm ci && npm run build`).
3. Package Lambda artifacts.
4. Deploy CloudFormation stack update.
5. Sync frontend dist to S3 web bucket.
6. Invalidate CloudFront cache.
7. Smoke test domain + upload API.

## 9.3 Rollback

- Keep previous CloudFormation stack revision.
- Keep previous frontend artifact bundle with versioned S3 prefixes.
- Route rollback by changing CloudFront origin path to prior artifact prefix if needed.

## 10. Security and Compliance

- TLS everywhere (CloudFront + API Gateway).
- S3 encryption at rest (SSE-S3 or SSE-KMS for prod).
- IAM least privilege for all Lambda roles.
- Explicit consent recording before any upload token issuance.
- Data retention policy documented and enforced.
- Optional pseudonymous contributor IDs only.

## 11. Operational Metrics

Product metrics:
- completed submissions/day,
- drop-off by step,
- average clip duration,
- accepted-to-rejected ratio.

Quality metrics:
- QC pass rate,
- moderation flag rate,
- reviewer turnaround time.

System metrics:
- API latency p95,
- Lambda error rate,
- CloudFront 4xx/5xx rate.

## 12. Delivery Timeline (8 Weeks)

Week 1:
- finalize requirements, consent language, prompt schema, architecture decisions.

Week 2:
- scaffold Vite+React+TS app and base CloudFormation stacks.

Week 3:
- implement consent/session/upload flow + pre-signed URL backend.

Week 4:
- implement prompt agent and metadata capture.

Week 5:
- implement QC agent and reviewer queue v1.

Week 6:
- implement moderation triage + observability/alarms.

Week 7:
- stage pilot with 20-50 contributors, fix UX and quality pain points.

Week 8:
- production hardening, runbook, launch.

## 13. CloudFormation Template Backlog (Concrete)

Required templates to create:
- `infra/root.yaml`
- `infra/storage.yaml`
- `infra/cdn-dns.yaml`
- `infra/api.yaml`
- `infra/auth.yaml` (optional toggle)

Required parameter files:
- `infra/params/dev.json`
- `infra/params/stage.json`
- `infra/params/prod.json`

## 14. Immediate Next Actions

1. Confirm whether contributors need login (anonymous vs lightweight account).
2. Confirm legal consent text and data retention window.
3. Approve stack split (root + 4 nested templates).
4. Start implementation with Week 2 deliverables:
   - Vite+React+TS scaffold,
   - initial CloudFormation for S3 + CloudFront + Route 53 on lilics.yinyangr.com.
