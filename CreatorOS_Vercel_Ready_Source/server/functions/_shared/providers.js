export const providerLabels = { youtube: 'YouTube', instagram: 'Instagram', tiktok: 'TikTok', x: 'X' }

export function providerConfig(provider, env) {
  const callback = `${env.SITE_URL.replace(/\/$/, '')}/api/social/${provider}/callback`
  const common = { provider, callback }
  if (provider === 'youtube') return {
    ...common, clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET,
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth', token: 'https://oauth2.googleapis.com/token',
    scopes: ['openid','email','profile','https://www.googleapis.com/auth/youtube.upload','https://www.googleapis.com/auth/youtube.readonly'],
  }
  if (provider === 'instagram') return {
    ...common, clientId: env.META_APP_ID, clientSecret: env.META_APP_SECRET,
    authorize: 'https://www.facebook.com/v25.0/dialog/oauth', token: 'https://graph.facebook.com/v25.0/oauth/access_token',
    scopes: ['instagram_business_basic','instagram_business_content_publish','pages_show_list','pages_read_engagement'],
  }
  if (provider === 'tiktok') return {
    ...common, clientId: env.TIKTOK_CLIENT_KEY, clientSecret: env.TIKTOK_CLIENT_SECRET,
    authorize: 'https://www.tiktok.com/v2/auth/authorize/', token: 'https://open.tiktokapis.com/v2/oauth/token/',
    scopes: ['user.info.basic','video.upload','video.publish'],
  }
  if (provider === 'x') return {
    ...common, clientId: env.X_CLIENT_ID, clientSecret: env.X_CLIENT_SECRET,
    authorize: 'https://x.com/i/oauth2/authorize', token: 'https://api.x.com/2/oauth2/token',
    scopes: ['tweet.read','tweet.write','users.read','offline.access','media.write'],
  }
  throw new Error('Unsupported integration provider.')
}

export function configured(provider, env) {
  try { const config = providerConfig(provider, env); return Boolean(config.clientId && config.clientSecret && env.SITE_URL) } catch { return false }
}
