# Workforce360 — Final Vercel Build

A clean workforce management application for NAJCO. Includes separate Admin and Foreman portals, Employees, Projects, Maintenance, foreman credentials and WhatsApp sharing, individual/bulk attendance, project locking, reports/exports, profile settings and light/dark mode.

**AI support and chat have been removed completely. No AI account or API key is needed.**

This package contains source code only. There are no saved employees, projects, maintenance records, foremen, attendance, admin credentials or uploaded profile images. A new database starts empty. Later deployments preserve records you enter; there is no automatic recurring data reset.

## Technology

- Next.js 16 / React, with server-side route handlers on Vercel.
- PostgreSQL through Neon, using its serverless HTTPS driver.
- Profile images stored privately in the same database; no separate file-storage service is required.
- Qatar time, separate `/admin` and `/foreman` logins, one administrator.

This is the Vercel-compatible version. Do not upload the old Cloudflare/Sites deployment archive to Vercel.

## 1. Extract and upload to GitHub

1. Extract `Workforce360-Vercel-Final.zip` on your computer.
2. Create a new private GitHub repository, for example `workforce360`.
3. Upload the **contents** of the extracted folder. `package.json`, `package-lock.json`, `app`, `components`, `database` and `vercel.json` must be at the repository root.
4. Include `.env.example` and the other supplied configuration files. Do not upload a real `.env` containing secrets.
5. Commit the files. If you use GitHub's upload page and encounter a file-count limit, upload folders in batches or use GitHub Desktop to publish the extracted folder.

The package intentionally excludes `node_modules`, compiled output, local databases and private keys. Vercel installs dependencies and builds the application.

## 2. Create the empty PostgreSQL database

1. Sign in at https://console.neon.tech and create a **new** project/database for Workforce360.
2. Open the database's SQL Editor.
3. Open the included `database/schema.sql`, paste the complete content into the SQL Editor, and run it once.
4. Copy the database connection string from Neon's Connect panel. Keep its SSL parameters. This is your `DATABASE_URL`.

The SQL creates three empty tables. It does not insert accounts or example data. It is safe to run again and does not delete future records.

You may alternatively add Neon through Vercel Marketplace, connect it to the Vercel project, and run the same schema in Neon's SQL Editor. Ensure the resulting connection string is available under the exact name `DATABASE_URL`.

## 3. Prepare two private keys

Create **two different random secrets**, preferably 64 hexadecimal characters each:

- `WORKFORCE360_SECRET`: encrypts login sessions and foreman credentials. Keep this stable after you start using the app.
- `WORKFORCE360_SETUP_KEY`: protects initial administrator registration and administrator recovery. Store it in your password manager and do not give it to foremen.

With Node.js installed on your own computer, run this command twice and save each output separately:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Do not use the variable names themselves, placeholder text or example passwords as the values.

## 4. Import into Vercel

1. Sign in at https://vercel.com and choose **Add New → Project**.
2. Import the GitHub repository you created.
3. Select **Next.js** as the framework preset.
4. Set Root Directory to the folder containing `package.json` (normally the repository root).
5. Use Node.js **22.x**. Build command: `npm run build`. Install command: `npm ci`. Leave Output Directory at the Next.js default; do not enter `dist` or `out`.
6. Add these environment variables for Production before deploying:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | The complete Neon connection string |
| `WORKFORCE360_SECRET` | Your first random secret |
| `WORKFORCE360_SETUP_KEY` | Your second random secret |

7. Click **Deploy** and wait for Ready.

Keep secrets server-side. Never add a `NEXT_PUBLIC_` prefix to these variables. If using Preview deployments, connect them to a separate test database rather than the production database.

## 5. Create your new administrator

1. Open `https://YOUR-PROJECT.vercel.app/admin`.
2. Select **Sign up**.
3. Enter the administrator email, password, password confirmation and your owner setup key.
4. Submit, then sign in with the new email/password.
5. Create Employees, Projects, Maintenance and Foremen.
6. Use **Create User** to create foreman credentials. The username is the Foreman Code.
7. Share `https://YOUR-PROJECT.vercel.app/foreman` with your foremen.

There are no default credentials. Sign-up allows only the first administrator. The setup key is needed for registration/recovery, not ordinary login.

## 6. Recovery and profile images

Vercel does not supply the original ChatGPT owner identity. This version uses the private owner setup/recovery key instead. On Forgot password, enter the administrator email and that key. The existing clearly labelled demonstration inbox presents a single-use reset link; **no real email is sent**. A live email-sending service is not configured in this package.

Profile images are limited to 3 MB in this Vercel version to stay within the platform's request-body limit. PNG, JPG and WebP are supported. Access remains restricted to the appropriate signed-in account.

## 7. Custom domain and future updates

After the Vercel deployment works, open Project Settings → Domains, add your domain/subdomain, and apply the exact DNS records Vercel displays. Do not copy guessed DNS records.

Push later changes to the production Git branch to redeploy. Keep the same Production database and secrets to preserve records and access.

## If something fails

| Message / symptom | Action |
| --- | --- |
| Database is not connected | Check `DATABASE_URL`, then redeploy |
| Table/relation does not exist | Run `database/schema.sql` in the database used by that connection string |
| Owner setup is not configured | Add `WORKFORCE360_SETUP_KEY` (at least 32 characters), then redeploy |
| Setup/recovery key is incorrect | Enter the exact private setup key; it is different from your login password |
| Authentication is unavailable | Set `WORKFORCE360_SECRET` to the saved random secret (at least 32 characters), then redeploy |
| Wrong portal | Admin uses `/admin`; foreman uses `/foreman` |
| Build cannot find package.json | Correct the repository Root Directory |
| New environment variables do not take effect | Redeploy after saving them |

## Local development and validation

Install Node.js 22+, copy `.env.example` to `.env.local`, and set the three variables using a separate development database. Run the schema there before launching.

```sh
npm ci
npm test
npm run build
npm run dev
```

Verification performed for this package: production Next.js build and TypeScript validation; actual application API handlers tested against embedded PostgreSQL (PGlite), including empty registration, setup-key enforcement, login-attempt upserts, roles, attendance, overnight reports, file storage, recovery and concurrent update protection. No live Neon/Vercel deployment has been performed for this package.

AI charges are removed. Vercel and database hosting remain separate services with their own plans and usage limits. Choose a Vercel plan suitable for company/commercial use.

Official references:
- https://vercel.com/docs/frameworks/full-stack/nextjs
- https://vercel.com/docs/postgres
- https://vercel.com/docs/functions/limitations
- https://github.com/neondatabase/serverless
