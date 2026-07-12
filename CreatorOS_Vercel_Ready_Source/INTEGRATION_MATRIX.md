# CreatorOS Integration Matrix

| Integration | Customer feature | Required configuration | Production gate |
|---|---|---|---|
| Supabase Auth | Google, Discord, GitHub, Facebook, X, magic-link sign-in | Supabase URL/keys, provider apps, redirect URLs, SMTP | Provider setup and auth testing |
| Supabase Database | Profiles, projects, feed, collaboration, messages, notifications, moderation, billing state | Run `supabase/schema.sql`; RLS enabled | Security review and backup plan |
| Vercel Functions | API, OAuth callbacks, billing, exports, deletion, moderation | Pages deployment and encrypted secrets | Production domain and secrets |
| Supabase Storage | Publishing media uploads | `MEDIA_BUCKET` binding and `MEDIA_PUBLIC_BASE_URL` | Public HTTPS media origin and retention rules |
| Stripe | Pro subscriptions and customer portal | Secret key, price IDs, webhook secret | Live account, products, policies, test matrix |
| Resend | Transactional notifications | API key, verified domain, from/support addresses | Domain verification and deliverability testing |
| YouTube | Video/Short uploads | Google client ID/secret; callback `/api/social/youtube/callback` | OAuth consent configuration and applicable verification |
| Instagram | Image/Reel publishing | Meta app ID/secret; callback `/api/social/instagram/callback`; professional account | Required permissions, account eligibility, app review/access |
| TikTok | Direct post or creator-inbox draft | TikTok client key/secret; callback `/api/social/tiktok/callback` | Content Posting API access and review; approved scopes |
| X | Text and image posts | X client ID/secret; callback `/api/social/x/callback` | Developer access, user-context write scopes, billing/limits as applicable |
| Vercel Cron | Scheduled publishing | Worker secrets and `/api/cron/publish` URL | Cron verification and operational monitoring |
| Turnstile | Abuse protection readiness indicator | Secret/site key and form integration | **Configuration-ready only in this RC; add active widgets/server verification before relying on it** |

## Publishing approval flags

Set these to `true` only after production access is confirmed:

```text
YOUTUBE_APPROVED
INSTAGRAM_APPROVED
TIKTOK_APPROVED
X_APPROVED
```

A configured client ID is not the same as provider approval, and provider approval is not the same as a customer authorizing their account. CreatorOS exposes those states independently.

## OAuth separation

Customer sign-in is handled through Supabase Auth. Publishing connections are handled by Vercel Functions and stored in `social_connections`. A user may sign in with one provider and publish to entirely different accounts.

## Secret ownership

Customer browser:

- Supabase anon/public key only
- No social client secrets
- No Stripe secret
- No service-role key
- No connected-account refresh token

Vercel environment variables:

- Supabase service-role key
- Token encryption key
- Social provider client secrets
- Stripe secret/webhook secret
- Resend API key
- Cron secret
