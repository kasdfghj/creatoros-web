# CreatorOS v1.0 RC1 Release Notes

## Website-only release direction

CreatorOS is packaged exclusively as a hosted browser application. There is no Electron runtime, downloadable customer executable, Lovable dependency, or Discord requirement.

## Added for RC1

- Vercel Functions backend
- Supabase multi-user authentication/data model
- Google, Discord, GitHub, Facebook, X, and email sign-in surface
- Creator profiles, projects, feed, collaboration, events, notifications, and direct messages
- Publishing Connections center
- Publishing Studio for YouTube, Instagram, TikTok, and X
- AES-GCM encrypted publishing-token storage
- Supabase Storage media-upload route
- Scheduled-publishing queue and Cron Worker
- Stripe Checkout, subscriptions, webhook synchronization, and billing portal
- Resend email endpoint
- Account data export and deletion
- Moderation reports and server-protected admin console
- Vercel security headers and SPA routing
- Production setup, integration matrix, security notes, and go-live checklist
- Release structure and obvious-secret scanner

## Release gates still owned by the operator

RC1 becomes publicly operable only after the owner configures the production domain, Supabase, Vercel, Supabase Storage, Stripe, email service, social developer applications, provider approvals, legal policies, support procedures, and monitoring.

## Validation completed

- TypeScript check
- Vite production build
- Vercel/Functions local startup
- Public health and nested-route smoke tests
- Protected API authentication-boundary checks
- Node syntax validation for server functions and scheduler
- Production dependency audit
- Release structure and obvious-secret scan
- ZIP integrity validation
