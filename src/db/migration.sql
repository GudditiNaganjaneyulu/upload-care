-- Enable UUID extension
create extension if not exists "uuid-ossp";

create table if not exists uploads (
  id uuid primary key default uuid_generate_v4(),
  file_name text not null,
  file_path text not null unique,
  mime_type text,
  size int,
  status text default 'pending' check (status in ('pending','uploaded','failed')),
  public_url text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- auto update timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
   new.updated_at = now();
   return new;
end;
$$ language plpgsql;

create trigger set_updated_at
before update on uploads
for each row
execute procedure update_updated_at_column();