# CreatorOS Customer Release Setup

## Required accounts

- GitHub repository: `kasdfghj/creatoros-web`
- Vercel project
- Supabase project
- A domain you control before public platform review
- Stripe account for paid plans
- Resend account and verified sending domain
- Developer applications for Google/YouTube, Meta/Instagram, TikTok, and X

## Activation order

1. Deploy the repository to Vercel.
2. Create Supabase and run `supabase/schema.sql`.
3. Add Supabase variables to Vercel and redeploy.
4. Enable customer sign-in providers in Supabase.
5. Test onboarding, projects, discovery, messages, reporting, export, and deletion.
6. Add Stripe in test mode and verify webhooks.
7. Verify an email domain and test transactional email.
8. Create social publishing apps and complete provider review.
9. Connect test accounts and perform private/unlisted test posts.
10. Complete legal, support, moderation, monitoring, backup, and incident-response checks before public launch.

## Secrets

Never commit real secrets. Store them only in Vercel environment variables and the relevant provider dashboards. `VITE_` variables are public by design; all other keys must remain server-side.

## Demo mode

The website contains realistic demo data so the user experience can be reviewed before production credentials are active. Demo mode must remain clearly labeled and must never claim that an external account is connected when it is not.
