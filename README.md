# Casa Hidalgo

Sistema de reservas para Casa Hidalgo — espacios profesionales en el Centro Histórico de Querétaro.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Auth + RLS) · MercadoPago · Netlify

---

## Estructura

```
casa-hidalgo/
├── app/                          ← Next.js App Router
│   ├── layout.tsx                ← Root layout con fuentes
│   ├── globals.css               ← Tailwind + estilos base
│   ├── page.tsx                  ← Landing público
│   ├── login/page.tsx            ← Login (password + magic link)
│   ├── signup/page.tsx           ← Crear cuenta
│   ├── auth/callback/route.ts    ← Callback para magic link
│   ├── reservar/[spaceId]/       ← Flujo de reserva
│   ├── mis-reservas/             ← Reservas del usuario
│   ├── admin/                    ← Panel admin (placeholder)
│   └── api/                      ← API routes (Fase 3+)
├── components/
│   ├── layout/                   ← NavBar, Hero illustration
│   ├── booking/                  ← SpaceCard, BookingFlow
│   ├── auth/                     ← (vacío, todo está en /app/login)
│   └── ui/                       ← Componentes UI reutilizables
├── lib/
│   ├── supabase/                 ← Clientes Supabase (browser/server/mw)
│   └── utils.ts                  ← Helpers (precios, fechas, formatters)
├── types/
│   └── database.ts               ← Tipos TS del schema de Supabase
├── middleware.ts                 ← Refresh de sesión + protección de rutas
├── .env.example                  ← Plantilla de variables de entorno
├── tailwind.config.ts
├── next.config.mjs
├── netlify.toml
└── package.json
```

---

## Setup local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase
```

Variables mínimas:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

### 3. Correr en local
```bash
npm run dev
# Abre http://localhost:3000
```

---

## Deploy a Netlify

### Primera vez
1. Sube el repo a GitHub
2. En [app.netlify.com](https://app.netlify.com) → **Add new site → Import existing project**
3. Conecta GitHub y selecciona el repo
4. **Build settings:** Netlify detecta automáticamente Next.js
5. **Environment variables** (Site settings → Environment variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://tu-sitio.netlify.app`
6. Deploy

### Configurar Supabase para el dominio
1. Supabase → **Authentication → URL Configuration**
2. **Site URL:** `https://tu-sitio.netlify.app`
3. **Redirect URLs:** `https://tu-sitio.netlify.app/**`

---

## Comandos útiles

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run typecheck  # verificar tipos sin compilar
npm run lint       # ESLint
```

---

## Roadmap

- [x] **Fase 1** — Schema de Supabase con RLS
- [x] **Fase 2** — Frontend con Next.js + auth + reservas
- [ ] **Fase 3** — Integración MercadoPago Checkout Pro
- [ ] **Fase 4** — Webhooks + emails de confirmación
- [ ] **Fase 5** — Panel admin completo
- [ ] **Fase 6** — Reportes y exportes

---

© 2026 Casa Hidalgo. Hecho en Querétaro.
