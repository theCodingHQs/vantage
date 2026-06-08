# Getting Started with Vantage

Welcome to Vantage! This guide covers your first 15 minutes setting up and customizing your freelance workspace.

---

## 1. Quick Local Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env` using `.env.example`.
3. Push schemas:
   ```bash
   npx drizzle-kit push
   ```
4. Start dev server:
   ```bash
   npm run dev
   ```

---

## 2. Walkthrough: Onboarding Wizard

When you register your first account, Vantage redirects you to `/onboarding`:

1. **Step 1: Business Profile**: Input your brand name, timezone, and select your currency (USD, EUR, GBP, CAD, AUD).
2. **Step 2: Service Selection**: Pick your freelance category. This pre-populates default tags.
3. **Step 3: First CRM Contact**: Enter your first client name and email address. Vantage automatically generates a client profile and links a project to it.
4. **Step 4: Hourly Rate**: Input your base rate (e.g. $75/hr).
5. **Step 5: Completion**: Finalize setup. Confetti will fire and redirect you to the main dashboard.
