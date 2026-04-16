# NyumbaHub - Property Management Platform

A property management web app built for East African landlords and property managers. Built with React, TypeScript, Vite, Tailwind CSS, shadcn/ui, and Supabase.

## Architecture

- **Frontend**: React 18 + TypeScript, Vite build tool, Tailwind CSS, shadcn/ui components
- **Backend/Auth/DB**: Supabase (PostgreSQL with Row Level Security, Supabase Auth)
- **Data Fetching**: TanStack Query (React Query v5)
- **Routing**: React Router DOM v6
- **Charts**: Recharts

## Key Directories

- `src/pages/` - Route-level page components (Landing, Login, Signup)
- `src/pages/dashboard/` - Landlord/manager dashboard (Overview, Properties, Tenants, Payments, Invoices, Maintenance, Messages, Vacancies, Reports, Settings)
- `src/pages/tenant/` - Tenant portal (TenantOverview, TenantRent, TenantMaintenance, TenantMessages, TenantProfile, TenantNotLinked)
- `src/components/` - Layout components (DashboardLayout, DashboardSidebar, TenantLayout, TenantRoute, ProtectedRoute)
- `src/hooks/` - Custom React hooks for Supabase data fetching
- `src/contexts/` - AuthContext
- `src/integrations/supabase/` - Supabase client + TypeScript types
- `supabase/migrations/` - Database schema migrations

## Environment Variables

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon/public key

## Development

```bash
npm run dev   # Start dev server on port 5000 (configured in vite.config.ts)
npm run build # Build for production
```

## Routing

### Landlord Portal: `/dashboard/*`
Protected by `ProtectedRoute` (session check only). Routes: Overview, Properties, Tenants, Payments, Invoices, Maintenance, Messages, Vacancies, Reports, Settings.

### Tenant Portal: `/tenant/*`
Protected by `TenantRoute` which:
1. Shows loading spinner while auth/tenant queries load
2. Redirects to `/login` if not authenticated
3. Renders `TenantNotLinked` inline (not a redirect) if no tenant record linked to the user
4. Otherwise renders `TenantLayout` with `<Outlet />` for nested routes

Routes: Overview, Rent, Maintenance, Messages, Profile.

## Auth Flow

- Login detects role: checks if `tenants.user_id = userId` → routes to `/tenant` or `/dashboard`
- Signup auto-links tenant by email: `linkTenantByEmail()` calls `UPDATE tenants SET user_id = ? WHERE email = ? AND user_id IS NULL`
- `TenantRoute` renders `TenantNotLinked` (with instructions) when user isn't linked to any tenant record

## Implemented Feature Phases

### Phase 1 — Auth & RLS Fixes
- `ResetPassword` page (`/reset-password`) — handles Supabase PASSWORD_RECOVERY event
- `EmailConfirmed` page (`/email-confirmed`) — confirms email + links tenant by email + redirects
- SQL migration: `supabase/migrations/20260408_rls_fixes_and_triggers.sql` (run manually in Supabase SQL Editor)
  - Payment INSERT/DELETE RLS policies for property owners
  - Lease INSERT/UPDATE/DELETE RLS policies
  - Unit status auto-sync trigger (occupied/vacant based on tenant assignment)
  - Invoice payment sync trigger (marks invoice paid when payment confirmed)
  - `mark_overdue_invoices()` function + immediate run

### Phase 2 — Dark Mode & Lease Alerts
- `ThemeProvider` wraps entire app; toggles `dark` class on `<html>`; persists to `nyumbahub-theme` in localStorage
- Dark mode toggle button in `DashboardSidebar` header (Sun/Moon icon)
- Lease expiry alerts on Overview — flags leases expiring within 30 days
- Dismissible alert banners for overdue invoices and expiring leases

### Phase 3 — File & Photo Uploads
- `FileUpload` component — drag-and-drop, click-to-browse, Supabase Storage upload, preview with remove
- Photo attachment in Maintenance request creation (uploaded to `documents/maintenance/`)
- Stored as public URL appended to description; displayed as inline image in maintenance cards

### Phase 4 — Onboarding Wizard
- `OnboardingWizard` — 4-step wizard: Add Property → Add Unit → Add Tenant → Create Invoice
- Shown on Overview to landlords with 0 properties
- Can be dismissed (stored in `nyumbahub-onboarding-dismissed` localStorage key)
- Skippable per step; success state with confirmation

### Phase 5 — Search, Filters, Pagination, Receipts & Bulk Actions

#### Properties
- Search by name, address, city; filter by property type; pagination (12/page)

#### Invoices
- Search by invoice #, tenant, property; filter by status; pagination (20/page)
- Bulk select → Mark Paid / Delete (with confirmation)
- Download invoice as printable HTML (Ctrl+P to PDF)
- CSV export of filtered invoices

#### Payments
- Search by tenant, property, ref; filter by method + status; pagination (20/page)
- Printable HTML receipt per payment (with M-Pesa ref, amount, tenant, property, date)
- CSV export of filtered payments

#### Maintenance
- Search by title, tenant, property; filter by status + priority; pagination (18/page, card grid)
- Photo shown inline in card if attached

### Landlord Dashboard (existing)
- **Properties**: Add/edit/delete property + inline unit management (add/edit/delete units, occupancy bar)
- **Tenants**: Add/edit/delete; clickable row opens Sheet with unit, lease, invoices, payment history, lease creation; Share Access dialog with copy link + mailto invite
- **Payments**: Record payment (links to invoice), CSV export; M-Pesa, bank, cash, international
- **Invoices**: Create, update status (badge dropdown), delete, bulk generate for all active tenants
- **Maintenance**: View/create requests, update status (open → assigned → in_progress → resolved → closed)
- **Messages**: Compose messages to linked tenants; realtime updates; read receipts
- **Vacancies**: Create/toggle vacancy listings for vacant units
- **Reports**: 6-month collection bar chart, invoice status pie chart, summary KPIs, CSV export
- **Overview**: KPI cards (properties, units, tenants, revenue), monthly collection progress, overdue alert, occupancy chart, recent payments

### Tenant Portal
- **My Home**: KPI cards (balance due, last payment, lease info), unit details, overdue alert, quick action links
- **My Rent**: Invoice list (with status badges), payment history
- **Maintenance**: Submit requests, track status
- **Messages**: Compose messages to landlord (via `property.owner_id`), view history, auto mark-read on open
- **My Profile**: Update phone/email/emergency contact; view rental details (property, unit, address, move-in date)

## Hooks

### Landlord hooks
- `useProperties` / `useCreateProperty` / `useUpdateProperty` / `useDeleteProperty`
- `useUnits` / `useCreateUnit` / `useUpdateUnit` / `useDeleteUnit` / `useUpdateUnitStatus`
- `useTenants` / `useCreateTenant` / `useUpdateTenant` / `useDeleteTenant`
- `useLeases` / `useCreateLease` / `useUpdateLeaseStatus`
- `useInvoices` / `useCreateInvoice` / `useUpdateInvoiceStatus` / `useDeleteInvoice` / `useBulkCreateInvoices`
- `usePayments` / `useRecordPayment` / `useDeletePayment`
- `useMaintenanceRequests` / `useCreateMaintenanceRequest` / `useUpdateMaintenanceStatus`
- `useMessages` / `useSendMessage` / `useMarkMessageRead`
- `useListings` / `useCreateListing` / `useToggleListing`

### Tenant hooks (in `useTenantRecord.ts`)
- `useTenantRecord` — fetches linked tenant + unit + property (incl. `owner_id`) + leases
- `useMyInvoices(tenantId)`
- `useMyPayments(tenantId)`
- `useMyMaintenance(tenantId)`
- `useMyMessages(userId)`
- `useSendTenantMessage`
- `useSubmitMaintenance`
- `useUpdateTenantProfile`
- `linkTenantByEmail(userId, email)` — called on signup to auto-link

## Currency & Payment Methods

- Currency: KES throughout
- Payment methods: `mpesa`, `bank_equity`, `bank_kcb`, `bank_coop`, `cash`, `international_transfer`
