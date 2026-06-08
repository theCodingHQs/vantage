# Changelog

All notable changes to the Vantage Freelancer Operating System will be documented in this file.

---

## [1.0.0] — 2026-06-08

### Added
- **Core Engine**: Initial release of Vantage built on TanStack Start (React 19 & Vite).
- **Authentication**: Custom DB-backed session authentication using HttpOnly cookies, fully integrated with SSR layouts.
- **Onboarding Wizard**: 5-step interactive onboarding capturing company branding, currencies, default rates, and initial client imports.
- **Client CRM**: Pipelines, contact lists, and Kanban board columns with native HTML5 drag-and-drop.
- **Projects & Tasks Checklist**: Budget metrics calculators and drag-and-drop task boards.
- **Time Tracker**: Zustand-backed persistent live-timer (survives browser refresh) and client-side CSV exports.
- **Invoicing System**: Professional invoice generator, itemized calculator (discounts, taxes), PDF printer, and manual payment registers.
- **Proposals Builder**: Scope templates and e-signature authorization logs.
- **Client Portals**: Public, secure slug links allowing clients to check tasks, invoices, and participate in async chat feeds.
- **Content Calendar**: Post scheduling month-view calendars.
- **Analytical Reports**: Expense category charts (Pie/Donut), invoice aging reports, and project profit margins.
- **Database & Cache**: Integrations for PostgreSQL (Neon Drizzle ORM) and Redis caching layers.
- **Developer utilities**: JSON workspace backup and GDPR account deletes.
