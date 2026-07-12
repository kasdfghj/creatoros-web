import { requireAdmin } from '../../_shared/auth.js'
import { db,update } from '../../_shared/db.js'
import { failure,json,readJson } from '../../_shared/http.js'
export async function onRequestGet({request,env}){const auth=await requireAdmin(request,env);if(auth.response)return auth.response;const reports=await db(env,'moderation_reports?order=created_at.desc&limit=200&select=*')||[];return json({reports})}
export async function onRequestPatch({request,env}){const auth=await requireAdmin(request,env);if(auth.response)return auth.response;const body=await readJson(request).catch(()=>({}));if(!body.id||!['open','reviewing','resolved','dismissed'].includes(body.status))return failure('Report ID and valid status are required.');const report=await update(env,'moderation_reports',`id=eq.${body.id}`,{status:body.status,resolution_notes:body.resolution_notes||null,assigned_to:body.assigned_to||auth.user.id});return json({report})}
