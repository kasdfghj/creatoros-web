# CreatorOS Website

CreatorOS is a website-only community and project operating system for independent creators. This repository is configured for Vercel hosting with Supabase authentication, database, realtime features, and media storage.

## Included

- Public homepage and community discovery
- Google, Discord, GitHub, Facebook, X, and passwordless email sign-in through Supabase Auth
- Creator onboarding and profiles
- Mission Control and project workspaces
- Community feed, follows, comments, saved projects, opportunities, and events
- Direct messages and notifications
- YouTube, Instagram, TikTok, and X publishing connection flows
- Stripe subscriptions and customer portal routes
- Resend transactional email route
- Account export and deletion
- Moderation and admin routes
- Vercel Functions and Vercel Cron configuration

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The frontend works in demo mode before credentials are added. Protected customer features become live after Supabase and the relevant providers are configured.

## Deploy

1. Import this GitHub repository into Vercel.
2. Keep the detected Vite settings: build command `npm run build`, output directory `dist`.
3. Add the variables listed in `.env.example` to Vercel Project Settings.
4. Create a Supabase project and run `supabase/schema.sql` in the SQL Editor.
5. Add the Vercel production URL to Supabase Auth redirect URLs.
6. Redeploy after environment variables are saved.

See `VERCEL_DEPLOYMENT.md` and `CUSTOMER_RELEASE_SETUP.md`.
