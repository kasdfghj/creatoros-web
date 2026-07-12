-- CreatorOS Community Web App v0.5
-- Run this file once in the Supabase SQL Editor for a new project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null default 'CreatorOS Member',
  avatar_url text,
  headline text not null default '',
  bio text not null default '',
  location text not null default '',
  disciplines text[] not null default '{}',
  skills text[] not null default '{}',
  availability text not null default 'Available' check (availability in ('Available','Limited','Not available')),
  collaboration_preference text not null default 'Both' check (collaboration_preference in ('Paid','Collaboration','Both')),
  remote_preference text not null default 'Both' check (remote_preference in ('Local','Remote','Both')),
  links jsonb not null default '{}'::jsonb,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  slug text not null unique,
  type text not null,
  stage text not null default 'Idea',
  summary text not null default '',
  goal text not null default '',
  progress integer not null default 0 check (progress between 0 and 100),
  cover_url text,
  visibility text not null default 'public' check (visibility in ('public','private')),
  collaboration_type text not null default 'Collaboration' check (collaboration_type in ('Paid','Collaboration','Both')),
  location_mode text not null default 'Both' check (location_mode in ('Local','Remote','Both')),
  location text not null default 'Remote',
  target_date date,
  roles_needed text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'Collaborator',
  status text not null default 'active' check (status in ('invited','active','removed')),
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.updates (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  media_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.update_likes (
  update_id uuid not null references public.updates(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (update_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null references public.updates(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collaboration_posts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null check (char_length(title) between 1 and 150),
  role_needed text not null,
  description text not null,
  compensation text not null default 'Collaboration' check (compensation in ('Paid','Collaboration','Negotiable')),
  location_mode text not null default 'Both' check (location_mode in ('Local','Remote','Both')),
  location text not null default 'Remote',
  status text not null default 'open' check (status in ('open','filled','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collaboration_applications (
  id uuid primary key default gen_random_uuid(),
  collaboration_post_id uuid not null references public.collaboration_posts(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 3000),
  status text not null default 'submitted' check (status in ('submitted','reviewing','accepted','declined','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collaboration_post_id, applicant_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.saved_projects (
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  start_at timestamptz not null,
  end_at timestamptz,
  location text not null default 'Online',
  is_virtual boolean not null default true,
  virtual_url text,
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists projects_owner_idx on public.projects(owner_id);
create index if not exists projects_visibility_created_idx on public.projects(visibility, created_at desc);
create index if not exists updates_created_idx on public.updates(created_at desc);
create index if not exists updates_project_idx on public.updates(project_id);
create index if not exists collaboration_status_created_idx on public.collaboration_posts(status, created_at desc);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
  safe_username text;
begin
  base_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'preferred_username', split_part(coalesce(new.email, 'creator'), '@', 1), 'creator'), '[^a-zA-Z0-9_]', '', 'g'));
  if char_length(base_username) < 3 then base_username := 'creator'; end if;
  safe_username := left(base_username, 22) || '_' || substr(replace(new.id::text, '-', ''), 1, 6);

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    safe_username,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, 'CreatorOS Member'), '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.project_accessible(project_uuid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = project_uuid
      and (p.visibility = 'public' or p.owner_id = auth.uid() or exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.user_id = auth.uid() and pm.status = 'active'
      ))
  );
$$;

create or replace function public.can_manage_project(project_uuid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = project_uuid and (
      p.owner_id = auth.uid() or exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.user_id = auth.uid() and pm.status = 'active'
      )
    )
  );
$$;

-- Computed public counts used by the UI.
create or replace view public.profile_public_stats as
select p.id,
  (select count(*)::int from public.follows f where f.following_id = p.id) as followers_count,
  (select count(*)::int from public.projects pr where pr.owner_id = p.id and pr.visibility = 'public') as projects_count
from public.profiles p;

create or replace view public.update_public_stats as
select u.id,
  (select count(*)::int from public.update_likes l where l.update_id = u.id) as likes_count,
  (select count(*)::int from public.comments c where c.update_id = u.id) as comments_count
from public.updates u;

-- Enable Row Level Security on every customer data table.
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.updates enable row level security;
alter table public.update_likes enable row level security;
alter table public.comments enable row level security;
alter table public.collaboration_posts enable row level security;
alter table public.collaboration_applications enable row level security;
alter table public.follows enable row level security;
alter table public.saved_projects enable row level security;
alter table public.community_events enable row level security;
alter table public.notifications enable row level security;

-- Profiles: public discovery, self-managed writes.
create policy "profiles are publicly readable" on public.profiles for select using (true);
create policy "users update their own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Projects: public directory plus private owner/member access.
create policy "public or participating projects are readable" on public.projects for select using (visibility = 'public' or owner_id = auth.uid() or public.can_manage_project(id));
create policy "users create their own projects" on public.projects for insert with check (owner_id = auth.uid());
create policy "owners update projects" on public.projects for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners delete projects" on public.projects for delete using (owner_id = auth.uid());

create policy "project memberships visible to participants" on public.project_members for select using (user_id = auth.uid() or public.can_manage_project(project_id));
create policy "owners manage project memberships" on public.project_members for all using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())) with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

-- Updates and comments: readable when the related project is readable.
create policy "accessible updates are readable" on public.updates for select using (project_id is null or public.project_accessible(project_id) or author_id = auth.uid());
create policy "members create updates" on public.updates for insert with check (author_id = auth.uid() and (project_id is null or public.can_manage_project(project_id)));
create policy "authors update their updates" on public.updates for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "authors delete their updates" on public.updates for delete using (author_id = auth.uid());

create policy "likes are publicly readable" on public.update_likes for select using (true);
create policy "users create their likes" on public.update_likes for insert with check (user_id = auth.uid());
create policy "users delete their likes" on public.update_likes for delete using (user_id = auth.uid());

create policy "comments on readable updates are readable" on public.comments for select using (exists (select 1 from public.updates u where u.id = update_id and (u.project_id is null or public.project_accessible(u.project_id))));
create policy "users create comments" on public.comments for insert with check (author_id = auth.uid());
create policy "authors update comments" on public.comments for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "authors delete comments" on public.comments for delete using (author_id = auth.uid());

-- Collaboration listings and applications.
create policy "open collaborations are publicly readable" on public.collaboration_posts for select using (status = 'open' or creator_id = auth.uid());
create policy "users create their listings" on public.collaboration_posts for insert with check (creator_id = auth.uid() and (project_id is null or public.can_manage_project(project_id)));
create policy "creators update listings" on public.collaboration_posts for update using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy "creators delete listings" on public.collaboration_posts for delete using (creator_id = auth.uid());

create policy "applications visible to applicant and listing owner" on public.collaboration_applications for select using (
  applicant_id = auth.uid() or exists (select 1 from public.collaboration_posts cp where cp.id = collaboration_post_id and cp.creator_id = auth.uid())
);
create policy "users submit their own applications" on public.collaboration_applications for insert with check (applicant_id = auth.uid());
create policy "applicants or listing owners update application" on public.collaboration_applications for update using (
  applicant_id = auth.uid() or exists (select 1 from public.collaboration_posts cp where cp.id = collaboration_post_id and cp.creator_id = auth.uid())
);
create policy "applicants withdraw application" on public.collaboration_applications for delete using (applicant_id = auth.uid());

-- Social graph and saves.
create policy "follows are publicly readable" on public.follows for select using (true);
create policy "users manage following" on public.follows for insert with check (follower_id = auth.uid());
create policy "users unfollow" on public.follows for delete using (follower_id = auth.uid());

create policy "users read their saved projects" on public.saved_projects for select using (user_id = auth.uid());
create policy "users save projects" on public.saved_projects for insert with check (user_id = auth.uid());
create policy "users remove saved projects" on public.saved_projects for delete using (user_id = auth.uid());

-- Events and notifications.
create policy "public events are readable" on public.community_events for select using (visibility = 'public' or creator_id = auth.uid());
create policy "users create events" on public.community_events for insert with check (creator_id = auth.uid());
create policy "hosts update events" on public.community_events for update using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy "hosts delete events" on public.community_events for delete using (creator_id = auth.uid());

create policy "users read notifications" on public.notifications for select using (user_id = auth.uid());
create policy "users update notifications" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users delete notifications" on public.notifications for delete using (user_id = auth.uid());

-- Updated-at triggers.
do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','projects','updates','comments','collaboration_posts','collaboration_applications','community_events']
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

-- Public media bucket. Upload objects under a user-id folder, e.g. <auth.uid()>/avatar.jpg.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('creator-media', 'creator-media', true, 15728640, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "creator media is publicly readable" on storage.objects for select using (bucket_id = 'creator-media');
create policy "users upload to their media folder" on storage.objects for insert to authenticated with check (bucket_id = 'creator-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users update their media" on storage.objects for update to authenticated using (bucket_id = 'creator-media' and owner_id = auth.uid()::text) with check (bucket_id = 'creator-media' and owner_id = auth.uid()::text);
create policy "users delete their media" on storage.objects for delete to authenticated using (bucket_id = 'creator-media' and owner_id = auth.uid()::text);

-- Realtime publication for community surfaces. Safe to rerun.
do $$ begin
  alter publication supabase_realtime add table public.updates;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.collaboration_posts;
exception when duplicate_object then null;
end $$;

-- CreatorOS v1.0 release services -------------------------------------------------

create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('youtube','instagram','tiktok','x')),
  account_id text,
  account_name text,
  encrypted_tokens text not null,
  token_scopes text[] not null default '{}',
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','expired','revoked','error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.oauth_states (
  state text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  code_verifier text,
  redirect_path text not null default '/app/integrations',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  caption text not null,
  media_url text,
  providers text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','processing','published','partial','failed','scheduled')),
  results jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.publication_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  payload jsonb not null,
  scheduled_for timestamptz not null,
  status text not null default 'queued' check (status in ('queued','processing','complete','failed','cancelled')),
  attempts integer not null default 0,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  subject text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  attachment_url text,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.billing_customers (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text unique,
  plan text not null default 'free',
  status text not null default 'inactive',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text not null,
  target_id text not null,
  reason text not null,
  details text not null default '',
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deletion_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email_hash text,
  requested_at timestamptz not null default now()
);

create index if not exists social_connections_user_idx on public.social_connections(user_id);
create index if not exists publication_jobs_due_idx on public.publication_jobs(status, scheduled_for);
create index if not exists publications_user_created_idx on public.publications(user_id, created_at desc);
create index if not exists conversation_members_user_idx on public.conversation_members(user_id);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index if not exists moderation_reports_status_created_idx on public.moderation_reports(status, created_at desc);

create or replace function public.is_conversation_member(conversation_uuid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.conversation_members cm where cm.conversation_id = conversation_uuid and cm.user_id = auth.uid());
$$;

alter table public.social_connections enable row level security;
alter table public.oauth_states enable row level security;
alter table public.publications enable row level security;
alter table public.publication_jobs enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.webhook_events enable row level security;
alter table public.moderation_reports enable row level security;
alter table public.deletion_audit enable row level security;

-- Sensitive token, OAuth-state, billing-customer, webhook and deletion tables intentionally have no browser policies.
-- They are accessed only by Cloudflare Functions using the service-role key.

create policy "users read their publications" on public.publications for select using (user_id = auth.uid());
create policy "users delete draft publications" on public.publications for delete using (user_id = auth.uid() and status = 'draft');
create policy "users read their scheduled jobs" on public.publication_jobs for select using (user_id = auth.uid());
create policy "users cancel queued jobs" on public.publication_jobs for update using (user_id = auth.uid() and status = 'queued') with check (user_id = auth.uid());

create policy "members read conversations" on public.conversations for select using (public.is_conversation_member(id));
create policy "users create conversations" on public.conversations for insert with check (created_by = auth.uid());
create policy "conversation creators update" on public.conversations for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "members read membership" on public.conversation_members for select using (user_id = auth.uid() or public.is_conversation_member(conversation_id));
create policy "conversation creators add members" on public.conversation_members for insert with check (exists(select 1 from public.conversations c where c.id=conversation_id and c.created_by=auth.uid()));
create policy "members update own read state" on public.conversation_members for update using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "members read messages" on public.messages for select using (public.is_conversation_member(conversation_id));
create policy "members send messages" on public.messages for insert with check (sender_id=auth.uid() and public.is_conversation_member(conversation_id));
create policy "senders edit messages" on public.messages for update using (sender_id=auth.uid()) with check (sender_id=auth.uid());

create policy "users read own subscription" on public.subscriptions for select using (user_id=auth.uid());
create policy "users read own reports" on public.moderation_reports for select using (reporter_id=auth.uid());

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('account-exports','account-exports',false,52428800,array['application/json'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- Service role creates exports. Customers access only short-lived signed URLs returned by the export function.

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('project-media','project-media',false,1073741824,array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime','audio/mpeg','audio/wav','application/pdf'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "users upload project media" on storage.objects for insert to authenticated with check (bucket_id='project-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "users read their project media" on storage.objects for select to authenticated using (bucket_id='project-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "users update their project media" on storage.objects for update to authenticated using (bucket_id='project-media' and owner_id=auth.uid()::text) with check (bucket_id='project-media' and owner_id=auth.uid()::text);
create policy "users delete their project media" on storage.objects for delete to authenticated using (bucket_id='project-media' and owner_id=auth.uid()::text);

do $$ begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end $$;

-- Updated-at triggers for release tables.
do $$
declare table_name text;
begin
  foreach table_name in array array['social_connections','publications','publication_jobs','conversations','subscriptions','moderation_reports']
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

-- Vercel release: public media used only for cross-platform publishing.
-- Uploads are performed through the authenticated Vercel API with the service role key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('publishing-media', 'publishing-media', true, 536870912, array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
