# CreatorOS Go-Live Checklist

Do not market CreatorOS as customer-ready until every required item is checked with evidence.

## Product and brand

- [ ] Final product/company owner identified
- [ ] Production domain active with HTTPS
- [ ] Final logo, favicon, metadata, and social preview image
- [ ] Support and privacy addresses monitored
- [ ] Placeholder text and demo claims removed from production mode
- [ ] Mobile, tablet, keyboard, and accessibility review completed

## Legal and trust

- [ ] Privacy Policy professionally reviewed
- [ ] Terms of Service professionally reviewed
- [ ] Community Guidelines and Acceptable Use Policy published
- [ ] Refund/cancellation policy published before accepting payment
- [ ] Copyright/DMCA contact and process established
- [ ] Data retention and backup-deletion periods documented
- [ ] Minimum age and launch territories confirmed
- [ ] AI/data-training position documented, even if AI is disabled

## Authentication and accounts

- [ ] Supabase production project configured
- [ ] Email verification and reliable SMTP configured
- [ ] Passwordless email tested
- [ ] Every enabled social sign-in tested with new and returning users
- [ ] OAuth redirect allowlists contain only expected domains
- [ ] Session expiration and sign-out tested
- [ ] Account export tested and private
- [ ] Account deletion tested end to end
- [ ] Social publishing tokens revoked on deletion/disconnect

## Data security

- [ ] RLS reviewed with at least two separate test accounts
- [ ] Private projects cannot be accessed by non-members
- [ ] Private messages cannot be read by other customers
- [ ] Moderation reports are staff-only
- [ ] Service-role key exists only in Vercel environment variables
- [ ] Token encryption key generated and backed up securely
- [ ] Logs do not include access or refresh tokens
- [ ] Dependency and secret scans pass
- [ ] Database backup and restoration tested
- [ ] Incident response owner and procedure assigned

## Community safety

- [ ] Report flow tested
- [ ] Blocking/muting policy decided
- [ ] Admin users explicitly allowlisted
- [ ] Moderation response expectations documented
- [ ] Spam/rate limits configured
- [ ] File/content validation tested
- [ ] Turnstile or equivalent abuse protection actively verified on public forms
- [ ] Staff audit trail and escalation path established

## Payments

- [ ] Stripe business account activated
- [ ] Products/prices match website copy
- [ ] Checkout success and cancel paths tested
- [ ] Webhook signature validation tested
- [ ] Subscription upgrades, downgrades, cancellation, and failed payment tested
- [ ] Customer portal tested
- [ ] Tax obligations reviewed
- [ ] Refund workflow tested
- [ ] Production features are enforced server-side by subscription state

## Email

- [ ] Sending domain authenticated
- [ ] From/reply-to/support addresses correct
- [ ] Auth and notification messages render on major mail clients
- [ ] Bounce/complaint handling configured
- [ ] Unsubscribe behavior added where legally required
- [ ] Publishing and billing failure notifications tested

## Publishing integrations

For each enabled provider:

- [ ] Developer app owned by CreatorOS business/owner
- [ ] Privacy, Terms, deletion, and support URLs added
- [ ] Production callback URL exact
- [ ] Minimum required scopes only
- [ ] Provider approval/access confirmed
- [ ] New connection, token refresh, disconnect, and reconnect tested
- [ ] Test post succeeds
- [ ] Failure response is understandable
- [ ] Rate limits handled
- [ ] Duplicate post protection tested
- [ ] Scheduled post behavior tested
- [ ] Customer can cancel queued content

## Vercel

- [ ] Git-connected Pages production project
- [ ] Preview and production secrets separated
- [ ] Pages Functions endpoints tested
- [ ] Security headers verified
- [ ] Supabase Storage binding and public media domain active
- [ ] Supabase Storage retention/deletion rules active
- [ ] Cron worker deployed and monitored
- [ ] Rollback procedure tested
- [ ] Analytics/error monitoring configured

## Final release decision

- [ ] Release owner signs off
- [ ] Security reviewer signs off
- [ ] Legal reviewer signs off
- [ ] Support owner signs off
- [ ] Disposable-customer end-to-end test passes
- [ ] No critical or high-severity open defects
- [ ] Public status/incident communication plan ready
