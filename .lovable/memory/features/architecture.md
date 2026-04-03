---
name: NyumbaHub architecture plan
description: 15-module implementation order, current progress with live backend
type: feature
---
Current state: Lovable Cloud connected. Auth, RBAC, and full DB schema live.
Functional pages: Overview, Properties (with unit CRUD), Tenants, Payments, Invoices, Maintenance, Settings.
Placeholder pages: Messages, Vacancies, Reports.

Next steps:
1. M-Pesa Daraja edge function (STK Push, C2B callbacks)
2. SMS via Africa's Talking edge function
3. Messages page (in-app messaging with realtime)
4. Vacancies/Listings page (public shareable links)
5. Reports page (financial analytics, rent collection charts)
6. PDF invoice generation
7. Tenant self-service portal
8. Multi-currency support
9. Open API layer
