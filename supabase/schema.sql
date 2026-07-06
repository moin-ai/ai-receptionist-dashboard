-- Overlay data that GHL doesn't own: the owner's Won/Pending/Lost verdict + notes
-- on each lead (keyed by GHL contact id). GHL stays the source of truth for
-- everything else; this is the only thing we persist.

create table if not exists lead_status (
  location_id   text not null,
  ghl_contact_id text not null,
  status        text not null default 'pending' check (status in ('won','pending','lost')),
  notes         text default '',
  updated_at    timestamptz not null default now(),
  primary key (location_id, ghl_contact_id)
);

alter table lead_status enable row level security;

-- ponytail: single-tenant policy — any authenticated owner can read/write.
-- When we onboard multiple sub-accounts, add a profiles(user_id, location_id)
-- table and scope these policies with: location_id = (select location_id from profiles where user_id = auth.uid())
create policy "authenticated read"  on lead_status for select to authenticated using (true);
create policy "authenticated write" on lead_status for insert to authenticated with check (true);
create policy "authenticated update" on lead_status for update to authenticated using (true);
