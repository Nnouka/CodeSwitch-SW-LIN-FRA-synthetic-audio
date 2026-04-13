# Lilics Web App

Community-sourced speech collection app for French-Swahili-Lingala code-switching data.

## Stack

- Vite + React + TypeScript
- Routing with react-router-dom
- Planned deployment: S3 + CloudFront + Route 53
- Infrastructure templates in `infra/`

## Local Development

1. Install dependencies:
   `npm install`
2. Run dev server:
   `npm run dev`
3. Build for production:
   `npm run build`

Set API endpoint with environment variable if needed:
- `VITE_API_BASE_URL=https://your-api.example.com`

Local mock mode for prompt retrieval:
- Copy `.env.example` to `.env`.
- Keep `VITE_USE_MOCK_TEXT_API=true` to use local JSONL for `GET /prompts/next` behavior.
- Sample file used: `public/mock/prompts.fra-swa-lin.sample.jsonl`.
- Records with `hasAudio: false` are served first.

## Current App Routes

- `/` home
- `/consent` contributor consent
- `/collect` upload and metadata form
- `/thank-you` submission complete
- `/review` reviewer placeholder

## CloudFormation Templates

- `infra/root.yaml` root orchestration
- `infra/storage.yaml` S3 buckets
- `infra/cdn-dns.yaml` CloudFront + Route53 alias
- `infra/api.yaml` API Gateway + Lambda + DynamoDB
- `infra/auth.yaml` optional Cognito resources

Parameter examples:
- `infra/params/dev.json`
- `infra/params/stage.json`
- `infra/params/prod.json`

## Deployment Notes

1. Create/validate ACM certificate in `us-east-1` for `lilics.yinyangr.com`.
2. Package nested templates so `TemplateURL` points to S3 locations.
3. Deploy root stack with environment parameter file.
4. Upload frontend build output to the web bucket and invalidate CloudFront.
