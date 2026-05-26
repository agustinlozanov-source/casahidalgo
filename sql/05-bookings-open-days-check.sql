-- ============================================================
-- 05-bookings-open-days-check.sql
-- Trigger que impide crear reservas en días no habilitados
-- en business_settings.open_days.
-- ============================================================

create or replace function check_booking_open_day()
returns trigger language plpgsql as $$
declare
  v_open_days text[];
  v_day_key   text;
begin
  -- Leer los días habilitados del singleton
  select open_days into v_open_days
  from business_settings
  where id = 1;

  -- Calcular la clave del día (sun/mon/tue/wed/thu/fri/sat)
  -- to_char con 'Dy' en inglés → Sun, Mon, ...
  -- usamos extract(dow ...) 0=dom,1=lun,...,6=sab
  v_day_key := case extract(dow from (new.starts_at at time zone 'America/Mexico_City'))::int
    when 0 then 'sun'
    when 1 then 'mon'
    when 2 then 'tue'
    when 3 then 'wed'
    when 4 then 'thu'
    when 5 then 'fri'
    when 6 then 'sat'
  end;

  if v_open_days is not null and not (v_day_key = any(v_open_days)) then
    raise exception 'Reservas no disponibles ese día de la semana (%).',
      initcap(to_char(new.starts_at at time zone 'America/Mexico_City', 'TMDay'))
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_bookings_open_day_check on bookings;
create trigger trg_bookings_open_day_check
  before insert on bookings
  for each row execute function check_booking_open_day();
