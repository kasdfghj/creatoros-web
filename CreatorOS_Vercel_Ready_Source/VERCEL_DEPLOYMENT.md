# Deploy CreatorOS to Vercel

## Import the repository

1. In Vercel, choose **Add New → Project**.
2. Import `kasdfghj/creatoros-web` from GitHub.
3. Vercel should detect Vite automatically.
4. Confirm:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
5. Deploy once to obtain the initial `vercel.app` address.

## Configure environment variables

Copy every required value from `.env.example` into **Project Settings → Environment Variables**. Browser-safe values begin with `VITE_`. All other values are server-only and must never be exposed in frontend code.

Set `SITE_URL` and `VITE_SITE_URL` to the final production URL. When you later attach a custom domain, update both values and the OAuth callback URLs.

## Supabase

Create a Supabase project, run `supabase/schema.sql`, then add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

In Supabase Authentication URL Configuration, set the Site URL to the Vercel production URL and add allowed redirect URLs for production and previews as appropriate.

## OAuth callback URLs for publishing connections

- YouTube: `https://YOUR_DOMAIN/api/social/youtube/callback`
- Instagram: `https://YOUR_DOMAIN/api/social/instagram/callback`
- TikTok: `https://YOUR_DOMAIN/api/social/tiktok/callback`
- X: `https://YOUR_DOMAIN/api/social/x/callback`

Customer sign-in providers are configured separately inside Supabase Auth.

## Stripe webhook

Create a Stripe webhook endpoint at:

`https://YOUR_DOMAIN/api/stripe/webhook`

Subscribe to Checkout Session completion and customer subscription lifecycle events, then add the webhook signing secret as `STRIPE_WEBHOOK_SECRET`.

## Scheduled publishing

`vercel.json` calls `/api/cron/publish`. Set `CRON_SECRET` in Vercel so scheduled requests are authenticated. Adjust the cron frequency to match the Vercel plan and the publishing service level you offer customers.

## Redeploy

After variables are configured, redeploy from the Vercel dashboard. Verify `/api/health`, sign-in, profile creation, project creation, messages, billing test mode, and provider connection states before inviting customers.
