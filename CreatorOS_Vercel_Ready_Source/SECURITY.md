# CreatorOS Security Notes

## Security boundaries

- Browser code receives only public build variables and the Supabase anon key.
- Vercel Functions validate Supabase bearer tokens before protected actions.
- Supabase Row Level Security controls customer-level database access.
- The Supabase service-role key is server-only.
- Social publishing tokens are encrypted with AES-GCM before storage.
- OAuth state values expire and are deleted after use.
- Billing webhooks validate Stripe signatures.
- Admin endpoints require a valid customer identity plus server-side UUID allowlisting.
- Supabase publishing media uploads are size/type constrained by the server endpoint.

## Required operational controls

Before launch, add or verify:

- Vercel Firewall/rate limits for auth-adjacent and write endpoints
- Active Turnstile verification on public abuse-prone forms
- Centralized error monitoring with secret/token redaction
- Database point-in-time recovery or scheduled backups
- Security contact and incident response procedure
- Key rotation procedure
- Dependency, secret, and static-code scanning in CI
- Media malware/content validation appropriate to accepted file types
- Staff access review and least privilege

## Secret handling

Never place these in frontend variables, source files, screenshots, support tickets, or chat:

- Supabase service-role key
- `TOKEN_ENCRYPTION_KEY`
- `CRON_SECRET`
- Social provider client secrets
- Stripe secret and webhook secret
- Resend API key
- Connected-customer access/refresh tokens

## Reporting

Replace the placeholder support email with an actively monitored security/privacy contact before public release. Define acknowledgement and remediation targets appropriate to the severity of the report.
