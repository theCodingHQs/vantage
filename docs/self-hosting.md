# Self-Hosting Vantage OS

Vantage is 100% open-source and easy to host on your own infrastructure.

---

## 1. Quick Deploy: Railway / Render

1. Create a PostgreSQL database (e.g. Neon, Supabase, or Railway PG).
2. Create a Redis cache instance (e.g. Upstash or Railway Redis).
3. Connect your repository to Railway/Render.
4. Add the required environment variables:
   - `DATABASE_URL`
   - `REDIS_URL`
   - `BETTER_AUTH_SECRET`
   - `RESEND_API_KEY`
   - `APP_URL`
5. Vantage automatically detects the hosting provider and builds the server environment.

---

## 2. Self-Hosting on a Linux VPS (Ubuntu/Nginx)

### Prerequisites

- Node.js v20+
- PostgreSQL v15+
- Redis Server v7+
- PM2 (process manager)

### Installation Steps

1. Clone your repo onto the server:
   ```bash
   git clone https://github.com/yourusername/vantage.git /var/www/vantage
   cd /var/www/vantage
   ```
2. Build the production server bundle:
   ```bash
   npm install
   npm run build
   ```
3. Setup PM2 process configuration `ecosystem.config.cjs`:
   ```javascript
   module.exports = {
     apps: [
       {
         name: 'vantage',
         script: 'dist/server/server.js',
         env: {
           NODE_ENV: 'production',
           DATABASE_URL: 'postgresql://...',
           REDIS_URL: 'redis://...',
           BETTER_AUTH_SECRET: '...',
         },
       },
     ],
   }
   ```
4. Start process:
   ```bash
   pm2 start ecosystem.config.cjs
   ```
5. Configure Nginx to reverse-proxy traffic from port 80/443 to `http://localhost:3000`.
