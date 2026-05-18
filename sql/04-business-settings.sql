-- ============================================================
-- 04-business-settings.sql
-- Tabla de configuración global del negocio.
-- Solo debe existir UN registro (id = 1).
-- ============================================================

create table if not exists business_settings (
  id            int primary key default 1 check (id = 1), -- singleton
  name          text not null default 'Casa Hidalgo',
  email         text not null default 'hola@casahidalgo.mx',
  address       text not null default 'Hidalgo 47B, Centro Histórico, 76000 Querétaro, Qro.',
  whatsapp      text not null default '442 285 5151',
  open_time     text not null default '09:00',   -- "HH:MM"
  close_time    text not null default '18:00',   -- "HH:MM"
  open_days     text[] not null default array['mon','tue','wed','thu','fri'],
  maps_embed    text default null,               -- src del iframe de Google Maps
  updated_at    timestamptz not null default now()
);

-- Insertar el registro inicial si no existe
insert into business_settings (id) values (1)
on conflict (id) do nothing;

-- Trigger para actualizar updated_at automáticamente
create or replace function update_business_settings_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_business_settings_updated_at on business_settings;
create trigger trg_business_settings_updated_at
  before update on business_settings
  for each row execute function update_business_settings_timestamp();

-- RLS: solo admins pueden leer/escribir
alter table business_settings enable row level security;

create policy "admins can manage business_settings"
  on business_settings for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'staff')
    )
  );

-- Lectura pública (para mostrar en landing)
create policy "public can read business_settings"
  on business_settings for select
  using (true);
