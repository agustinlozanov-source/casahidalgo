-- ============================================================
-- 06-space-package-days.sql
-- Agrega columna package_days a la tabla spaces.
-- Define cuántos días tiene el paquete multi-día (ej. CoWorking).
-- Default: 5 días.
-- ============================================================

alter table spaces
  add column if not exists package_days int not null default 5
    check (package_days >= 2 and package_days <= 30);

comment on column spaces.package_days is
  'Número de días del paquete multi-día (solo relevante para pricing_model=daily). Default 5.';
