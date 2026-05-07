---
name: NyumbaHub architecture plan
description: All 15 modules implemented with live backend
type: feature
---
Current state: Lovable Cloud connected. All core modules live.

Completed:
1. Auth & RBAC (signup/login with role selection, user_roles table)
2. Property & unit management (CRUD with landlord RLS)
3. Tenant management with portal linking
4. Invoices (create, bulk generate, status tracking, PDF download)
5. Payments (M-Pesa, bank, cash recording with CSV export)
6. Maintenance request workflow (priority, status transitions)
7. Settings (profile, password)
8. Realtime messaging (landlord ↔ tenant)
9. Vacancy/listing management with shareable tokens
10. Reports (bar/pie charts for collections & invoice status)
11. Tenant self-service portal (overview, rent, maintenance, messages, profile)
12. M-Pesa Daraja edge functions (STK Push + C2B callback) — needs API keys
13. SMS via Africa's Talking edge function — needs API keys
14. PDF invoice generation edge function
15. Multi-currency utility (KES, UGX, TZS, RWF, USD, EUR, GBP)
16. Open API layer edge function (REST, Bearer auth, pagination)
17. PWA configuration (manifest, service worker, icons)

Pending API keys:
- MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, MPESA_SHORTCODE
- AT_API_KEY, AT_USERNAME
