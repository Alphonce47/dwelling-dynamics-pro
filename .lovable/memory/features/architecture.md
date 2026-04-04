---
name: NyumbaHub architecture plan
description: 15-module implementation order, current progress with live backend
type: feature
---
Current state: Lovable Cloud connected. Auth, RBAC, and full DB schema live.
Functional pages: Overview, Properties (with unit CRUD), Tenants, Payments, Invoices, Maintenance, Settings, Messages (realtime), Vacancies/Listings, Reports.
No placeholder pages remain.

Next steps:
1. M-Pesa Daraja edge function (STK Push, C2B callbacks)
2. SMS via Africa's Talking edge function
3. PDF invoice generation
4. Tenant self-service portal
5. Multi-currency support
6. Open API layer
