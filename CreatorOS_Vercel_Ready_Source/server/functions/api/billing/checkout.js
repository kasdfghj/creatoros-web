import { requireUser } from '../../_shared/auth.js'
import { db } from '../../_shared/db.js'
import { failure, json, readJson } from '../../_shared/http.js'

async function stripe(env, path, params) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, { method:'POST', headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'Content-Type':'application/x-www-form-urlencoded'}, body:params })
  if(!response.ok) throw new Error(await response.text())
  return response.json()
}

export async function onRequestPost({request,env}){
  const auth=await requireUser(request,env); if(auth.response)return auth.response
  if(!env.STRIPE_SECRET_KEY)return failure('Stripe is not configured.',503)
  const body=await readJson(request).catch(()=>({})); const plan=body.plan
  const price=plan==='pro_annual'?env.STRIPE_PRICE_PRO_ANNUAL:env.STRIPE_PRICE_PRO_MONTHLY
  if(!price)return failure('The selected Stripe price is not configured.',503)
  let rows=await db(env,`billing_customers?user_id=eq.${auth.user.id}&select=stripe_customer_id`); let customerId=rows?.[0]?.stripe_customer_id
  if(!customerId){const p=new URLSearchParams({email:auth.user.email||'', 'metadata[user_id]':auth.user.id});const customer=await stripe(env,'customers',p);customerId=customer.id;await db(env,'billing_customers?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:auth.user.id,stripe_customer_id:customerId})})}
  const success=`${env.SITE_URL.replace(/\/$/,'')}/app/billing?checkout=success`; const cancel=`${env.SITE_URL.replace(/\/$/,'')}/app/billing?checkout=cancelled`
  const p=new URLSearchParams({mode:'subscription',customer:customerId,success_url:success,cancel_url:cancel,'line_items[0][price]':price,'line_items[0][quantity]':'1','subscription_data[metadata][user_id]':auth.user.id,'metadata[user_id]':auth.user.id,allow_promotion_codes:'true'})
  try{const session=await stripe(env,'checkout/sessions',p);return json({url:session.url})}catch(error){return failure('Unable to create Stripe Checkout session.',502,error.message)}
}
