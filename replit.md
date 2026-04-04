# NyumbaHub - Property Management Platform

A property management web app built for East African landlords and property managers. Built with React, TypeScript, Vite, Tailwind CSS, shadcn/ui, and Supabase.

## Architecture

- **Frontend**: React 18 + TypeScript, Vite build tool, Tailwind CSS, shadcn/ui components
- **Backend/Auth/DB**: Supabase (PostgreSQL with Row Level Security, Supabase Auth)
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form + Zod validation

## Key Directories

- `src/pages/` - Route-level page components (Landing, Login, Signup, dashboard pages)
- `src/pages/dashboard/` - Authenticated dashboard views (Overview, Properties, Tenants, Payments, Invoices, Maintenance, Messages, Vacancies, Reports, Settings)
- `src/components/` - Reusable UI components including shadcn/ui primitives
- `src/hooks/` - Custom React hooks for data fetching via Supabase
- `src/contexts/` - React Context providers (AuthContext)
- `src/integrations/supabase/` - Supabase client and auto-generated TypeScript types
- `supabase/migrations/` - Database schema migrations

## Environment Variables

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon/public key

## Development

```bash
npm run dev   # Start dev server on port 5000
npm run build # Build for production
```

## Features

- Property and unit management
- Tenant management and leases
- Rent invoicing and payment tracking (M-Pesa, bank transfers, cash)
- Maintenance request tracking
- Internal messaging
- Vacancy listings with shareable tokens
- Financial reports
- Role-based access (admin, landlord, manager, accountant, viewer, tenant)
- SMS notifications via Africa's Talking
