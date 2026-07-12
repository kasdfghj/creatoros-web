import { requireUser } from '../../_shared/auth.js'
import { insert } from '../../_shared/db.js'
import { failure,json,readJson } from '../../_shared/http.js'
export async function onRequestPost({request,env}){const auth=await requireUser(request,env);if(auth.response)return auth.response;const body=await readJson(request).catch(()=>({}));if(!body.target_type||!body.target_id||!body.reason)return failure('Target and report reason are required.');const report=await insert(env,'moderation_reports',{reporter_id:auth.user.id,target_type:body.target_type,target_id:body.target_id,reason:body.reason,details:body.details||'',status:'open'});return json({ok:true,report_id:report.id})}
