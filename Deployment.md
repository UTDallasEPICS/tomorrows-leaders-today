# Deployment Guide

This document walks you through deploying the **Tomorrow's Leaders Today** grant tracker from scratch.

The stack:

- **Web app** runs on Google Cloud Run (Next.js inside a Docker container)
- **Database** is Neon Postgres
- **Scraper and cleanup** run on a schedule via GitHub Actions
- **Email** sent via Gmail SMTP for magic-link authentication

The total ongoing cost for typical usage is **$0/month** — everything runs on free tiers.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Setup](#2-local-setup)
3. [Set up Neon (Database)](#3-set-up-neon-database)
4. [Generate Authentication Secrets](#4-generate-authentication-secrets)
5. [Set up Gmail for Magic Link Email](#5-set-up-gmail-for-magic-link-email)
6. [Migrate the Schema to Neon](#6-migrate-the-schema-to-neon)
7. [Set up Google Cloud Platform](#7-set-up-google-cloud-platform)
8. [Deploy to Cloud Run](#8-deploy-to-cloud-run)
9. [Set up GitHub Actions (Scrape + Cleanup)](#9-set-up-github-actions-scrape--cleanup)
10. [Important Notes](#10-important-notes)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

Before starting, install:

- [Node.js 20+](https://nodejs.org)
- [pnpm](https://pnpm.io/installation) — `npm install -g pnpm`
- [Git](https://git-scm.com/downloads)
- [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install)
- A code editor like VS Code

You'll also need accounts on:

- [Neon](https://neon.tech) (free)
- [Google Cloud](https://cloud.google.com) (free tier available; requires credit card for verification but won't charge you)
- [GitHub](https://github.com) (assumes the code is already in your GitHub repo)
- A Gmail account for sending verification emails

---

## 2. Local Setup

Clone the repository and install dependencies:

```bash
git clone <your-repo-url>
cd tomorrows-leaders-today
pnpm install
```

Create a `.env` file at the repo root. You'll fill in the values as you go through this guide:

```env
DATABASE_URL=
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODEMAILER_USER=
NODEMAILER_PASS=
```

---

## 3. Set up Neon (Database)

Neon is a serverless Postgres provider with a generous free tier.

1. Go to https://neon.tech and sign up (you can use your Google or GitHub account)
2. Click **Create Project**
3. Pick a name (e.g. `tlt-grants`) and a region. **`AWS us-east-1`** is a safe default; pick whatever is geographically closest to where the app will be deployed
4. Once the project is created, you'll see a **Connection string** on the dashboard. It looks like:

   ```
   postgresql://neondb_owner:npg_xxxxxxxxxxxx@ep-cool-name-12345.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

5. **Copy this string.** You'll use it as `DATABASE_URL`.
6. Paste it into your local `.env`:

   ```env
   DATABASE_URL="postgresql://neondb_owner:npg_xxxxxxxxxxxx@ep-cool-name-12345.us-east-1.aws.neon.tech/neondb?sslmode=require"
   ```

> **Note:** Neon free tier suspends the database when idle. The first request after a period of inactivity will be slow (~2 seconds) as it wakes up. Subsequent requests are fast.

---

## 4. Generate Authentication Secrets

### `BETTER_AUTH_SECRET`

This is used by Better Auth to sign session tokens. It needs to be a long random string.

Generate one by running in your terminal:

```bash
openssl rand -base64 32
```

If `openssl` isn't available (e.g. some Windows setups), use Node.js instead:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Either way, copy the output and paste it into your `.env`:

```env
BETTER_AUTH_SECRET=the_generated_string
```

---

## 5. Set up Gmail for Magic Link Email

The app uses Gmail's SMTP service to send magic-link emails for sign-in. You'll need a dedicated Gmail account or a Gmail "App Password" from your existing account.

### Steps to create the Gmail App Password

1. Sign in to the Gmail account you want to send emails from
2. Go to https://myaccount.google.com/security
3. Under **How you sign in to Google**, click **2-Step Verification** and turn it on (required before App Passwords work)
4. Once 2-Step is on, go to https://myaccount.google.com/apppasswords
5. In the **App name** field, type something descriptive like `TLT Grant Tracker`
6. Click **Create**
7. Google shows a 16-character password formatted like `xxxx xxxx xxxx xxxx`. **Copy it and remove the spaces** so it becomes `xxxxxxxxxxxxxxxx`

### Add to `.env`

```env
NODEMAILER_USER=yourname@gmail.com
NODEMAILER_PASS=xxxxxxxxxxxxxxxx
```

> **Important:** Use the 16-character App Password — not your regular Gmail account password. Regular passwords are rejected by Gmail SMTP.

---

## 6. Migrate the Schema to Neon

Now that `DATABASE_URL` is pointing at Neon in your `.env`, push the Prisma schema to create all the tables:

```bash
pnpm exec prisma migrate deploy
```

If the project doesn't have migration files yet, use:

```bash
pnpm exec prisma db push
```

Verify it worked by checking the Neon dashboard → SQL Editor and running:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

You should see tables like `Grant`, `User`, `Session`, `Verification`, `SystemLog`, etc.

### Test the app locally

```bash
pnpm dev
```

Visit http://localhost:3000, sign in with a magic link to confirm everything works.

---

## 7. Set up Google Cloud Platform

### Create or open a GCP project

1. Go to https://console.cloud.google.com
2. Either create a new project (top dropdown → New Project) or open an existing one
3. Note the **Project ID** — it's the lowercase-with-dashes ID, not the display name

### Install and authenticate gcloud

If you haven't already, install the [gcloud CLI](https://cloud.google.com/sdk/docs/install). Then:

```bash
gcloud auth login
gcloud config set project YOUR-PROJECT-ID
```

Replace `YOUR-PROJECT-ID` with your actual project ID.

### Enable the required APIs

Cloud Run, Cloud Build, Artifact Registry, and Secret Manager all need to be enabled:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

This takes about a minute the first time.

### Store secrets in Secret Manager

We'll store all sensitive env vars (database URL, auth secret, Gmail credentials) as Secret Manager secrets so they're never sitting in plain text on Cloud Run.

> **For Windows users:** PowerShell handles strings differently than Bash. Use **single quotes** with the PowerShell pipe syntax shown below — do NOT use `echo -n` (it stores the literal `-n` as part of the value).

#### PowerShell (Windows)

```powershell
'postgresql://neondb_owner:npg_xxxxx@ep-xxx.aws.neon.tech/neondb?sslmode=require' | gcloud secrets create DATABASE_URL --data-file=-

'your-generated-better-auth-secret' | gcloud secrets create BETTER_AUTH_SECRET --data-file=-

'yourname@gmail.com' | gcloud secrets create NODEMAILER_USER --data-file=-

'xxxxxxxxxxxxxxxx' | gcloud secrets create NODEMAILER_PASS --data-file=-
```

#### Bash (macOS / Linux)

```bash
echo -n "postgresql://neondb_owner:npg_xxxxx@ep-xxx.aws.neon.tech/neondb?sslmode=require" | gcloud secrets create DATABASE_URL --data-file=-

echo -n "your-generated-better-auth-secret" | gcloud secrets create BETTER_AUTH_SECRET --data-file=-

echo -n "yourname@gmail.com" | gcloud secrets create NODEMAILER_USER --data-file=-

echo -n "xxxxxxxxxxxxxxxx" | gcloud secrets create NODEMAILER_PASS --data-file=-
```

### Verify the secrets were stored correctly

For each secret, verify the value is clean (no quotes, no `-n` flag stored):

```bash
gcloud secrets versions access latest --secret=DATABASE_URL
gcloud secrets versions access latest --secret=BETTER_AUTH_SECRET
gcloud secrets versions access latest --secret=NODEMAILER_USER
gcloud secrets versions access latest --secret=NODEMAILER_PASS
```

Each should print just the value with nothing extra. If any of them show extra characters, update with:

```powershell
'corrected-value' | gcloud secrets versions add SECRET_NAME --data-file=-
```

### Grant Cloud Run permission to read the secrets

The Cloud Run service runs as a service account. By default it doesn't have permission to read secrets — you need to grant access for each secret:

```bash
gcloud secrets add-iam-policy-binding DATABASE_URL --member="serviceAccount:YOUR-PROJECT-NUMBER-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding BETTER_AUTH_SECRET --member="serviceAccount:YOUR-PROJECT-NUMBER-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding NODEMAILER_USER --member="serviceAccount:YOUR-PROJECT-NUMBER-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding NODEMAILER_PASS --member="serviceAccount:YOUR-PROJECT-NUMBER-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
```

Find your project number by running:

```bash
gcloud projects describe YOUR-PROJECT-ID --format="value(projectNumber)"
```

It's a 12-digit number that goes before `-compute@developer...`.

---

## 8. Deploy to Cloud Run

We'll connect Cloud Run to your GitHub repo so every push to `main` automatically rebuilds and deploys.

### Connect Cloud Run to GitHub

1. Go to https://console.cloud.google.com/run
2. Click **CREATE SERVICE**
3. Select **Continuously deploy from a repository (source or function)**
4. Click **SET UP WITH CLOUD BUILD**
5. **Repository provider**: GitHub
6. Authorize GCP to access your GitHub account if it prompts you
7. Pick your repo from the dropdown
8. Click **NEXT**

### Configure the build

- **Branch**: `^main$` (the `^` and `$` are regex anchors so it matches `main` exactly)
- **Build type**: Dockerfile
- **Source location**: `/Dockerfile`

Click **SAVE**.

### Configure the service

Back on the main config screen, fill in:

- **Service name**: `tlt-backend` (or whatever)
- **Region**: pick one close to your Neon DB. If Neon is in `aws-us-east-1`, use `us-east1` for lower latency
- **CPU allocation**: select **"CPU is only allocated during request processing"** (much cheaper — the app scales to zero when nobody's using it)
- **Service scaling**: leave as default (min 0, max 100)
- **Ingress**: All (allow internet traffic)
- **Authentication**: **Allow unauthenticated invocations**

### Add the env variables and secrets

Expand the **Container(s), Volumes, Networking, Security** section, then click the **Variables & Secrets** tab.

For each of the four secrets you created in Step 7, click **REFERENCE A SECRET**:

- Name: `DATABASE_URL` → Secret: `DATABASE_URL` → Version: `latest` → Exposed as: Environment variable
- Name: `BETTER_AUTH_SECRET` → Secret: `BETTER_AUTH_SECRET` → Version: `latest` → Exposed as: Environment variable
- Name: `NODEMAILER_USER` → Secret: `NODEMAILER_USER` → Version: `latest` → Exposed as: Environment variable
- Name: `NODEMAILER_PASS` → Secret: `NODEMAILER_PASS` → Version: `latest` → Exposed as: Environment variable

Don't add `BETTER_AUTH_URL` or `NEXT_PUBLIC_APP_URL` yet — you need the deployed URL first.

### Set container port

Still in the Container settings:

- **Container port**: `3000`
- **Memory**: 512 MiB is fine (bump to 1 GiB if you see out-of-memory errors)

### Click CREATE

Cloud Build will pull your repo, build the Docker image, and deploy it. **First build takes 3-8 minutes.**

When it finishes, Cloud Run shows the **Service URL**:

```
https://tlt-backend-PROJECT-NUMBER.us-central1.run.app
```

**Copy this URL.**

### Add the URL-dependent env vars

Now that you have the URL, add the two env vars that needed it:

1. In your Cloud Run service, click **EDIT & DEPLOY NEW REVISION** at the top
2. Go to **Variables & Secrets** tab
3. Click **ADD VARIABLE** twice and fill in:
   - Name: `BETTER_AUTH_URL` → Value: your Cloud Run URL (e.g. `https://tlt-backend-xxxxx.us-central1.run.app`)
   - Name: `NEXT_PUBLIC_APP_URL` → Value: same Cloud Run URL

4. Scroll to the bottom and click **DEPLOY**

Wait ~30 seconds for the new revision to roll out. Now visit your URL and you should see the app live.

### Test the login flow

1. Go to your Cloud Run URL
2. Click **Login**, enter your email
3. Check your inbox for the magic link
4. Click the link — it should sign you in

---

## 9. Set up GitHub Actions (Scrape + Cleanup)

The app uses GitHub Actions to run the scraper weekly and cleanup monthly. These are completely free and don't touch GCP at all — they connect directly to Neon over the internet.

### Confirm the workflow files exist

In your repo, you should have:

- `.github/workflows/scrape.yml`
- `.github/workflows/cleanup.yml`

If they're missing, copy them from this repo's workflow files.

### Add the DATABASE_URL secret to GitHub

1. Go to your repo on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `DATABASE_URL`
5. Value: paste your full Neon connection string (the same `postgresql://...` URL)
6. Click **Add secret**

### Test the scraper manually first

1. Go to the **Actions** tab in your repo
2. In the left sidebar, click **Scrape Grants**
3. Click **Run workflow** (top right) → **Run workflow** to confirm
4. Watch it execute. The first run takes 5-10 minutes
5. Once done, check your Cloud Run app's `/stats` page — you should see grants populated

If something goes wrong, click into the failed step to see the error logs.

### Test the cleanup manually

Same process:

1. Actions tab → **Cleanup Stale Grants** → **Run workflow**
2. Should complete in under a minute (just deletes expired records)

### Schedules

Once verified working manually, the schedules take over automatically:

- **Scrape**: Every **Monday at 09:00 UTC** (~4am Central / 5am Eastern)
- **Cleanup**: First **Monday of each month at 10:00 UTC**

You can change these in the `cron:` lines inside the workflow files. Use https://crontab.guru to test cron expressions.

---

## 10. Important Notes

> ## ⚠️ GitHub Actions and 60-Day Inactivity
>
> **GitHub deactivates scheduled workflows after 60 days of repo inactivity.** If nobody commits to the repo for 60 days straight, the weekly scrape and monthly cleanup will silently stop running.
>
> **To prevent this:**
>
> - Push at least one commit (even an empty one) every couple months
> - Or, if the repo is inactive for long stretches, push an empty commit periodically:
>
>   ```bash
>   git commit --allow-empty -m "keep workflows alive"
>   git push
>   ```
>
> A common pattern is to add this to a calendar reminder, or set up an additional workflow that simply commits "I'm alive" every 30 days. But manual is fine for a low-touch project.

### Other things to know

**Cold starts on Cloud Run**

If the app hasn't been used in a while, the first request takes a few seconds while Cloud Run spins up a container. This is normal and expected for the free tier. Subsequent requests are fast.

**Neon cold starts**

Same idea — the Neon free tier suspends the database when idle. First query after a long idle period takes ~2 seconds. To avoid this, you can upgrade to a paid Neon plan that keeps the DB warm.

**Updating the app**

Just `git push` to `main`. Cloud Build picks up the change and deploys automatically. You can watch the build progress at https://console.cloud.google.com/cloud-build/builds.

**Adding/changing secrets**

To update a secret value:

```bash
# PowerShell
'new-value' | gcloud secrets versions add SECRET_NAME --data-file=-

# Bash
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-
```

Then redeploy the Cloud Run service so it picks up the new version:

```bash
git commit --allow-empty -m "refresh secrets"
git push
```

**Costs**

Everything runs on free tiers as long as usage stays modest:

- Cloud Run free tier: 2 million requests/month, ~180,000 vCPU-seconds. For a small grant tracker this is way more than enough.
- Neon free tier: 0.5 GB storage, autosuspending compute.
- GitHub Actions: 2,000 free minutes/month for private repos. Each scrape uses about 10 minutes, so weekly = ~40 minutes/month.
- Secret Manager: 6 active versions free per secret.

**Monitoring**

- Cloud Run logs: https://console.cloud.google.com/run → click your service → **LOGS** tab
- Cloud Build logs: https://console.cloud.google.com/cloud-build/builds
- GitHub Actions logs: Actions tab on your repo
- The app has a built-in stats page at `/stats` showing recent scrape runs and data health

---

## 11. Troubleshooting

### Build fails with `COPY failed: stat app/node_modules/.prisma: file does not exist`

This is the pnpm Prisma layout issue. Make sure the Dockerfile copies the whole `node_modules` folder rather than cherry-picking `.prisma`. The provided `Dockerfile` already handles this correctly.

### App returns 500 on magic link with `the URL must start with postgresql://`

The `DATABASE_URL` secret has bad data — probably has quotes or the literal `-n` flag baked in. Run:

```bash
gcloud secrets versions access latest --secret=DATABASE_URL
```

If you see quotes or weird characters, recreate the secret using the PowerShell or Bash syntax from Step 7.

### Magic link emails arrive but the link points to localhost

`BETTER_AUTH_URL` isn't set on Cloud Run, or `src/library/auth.ts` doesn't have the `baseURL` config reading from that env var. Verify both, then redeploy.

### Magic link email never arrives, logs show `535-5.7.8 Username and Password not accepted`

The Gmail credentials are wrong. Most likely:

- You used a regular Gmail password instead of an App Password (regular passwords don't work for SMTP)
- The App Password has spaces — remove them before storing
- The secret value has quotes baked in (Windows `echo -n` issue) — recreate it

### Scrape fails on txsmartbuy.gov in GitHub Actions

Puppeteer needs Chrome installed on the runner. Add this step to `scrape.yml` before the scrape step:

```yaml
- name: Install Puppeteer Chrome
  run: pnpm exec puppeteer browsers install chrome
```

### Service account "Permission denied" on a secret

You forgot to grant the service account access. Run:

```bash
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:PROJECT-NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Cloud Run shows the old DATABASE_URL even after updating the secret

The env var is bound to a specific secret version number (e.g. `1`) instead of `latest`. To fix:

1. In Cloud Run console → EDIT & DEPLOY NEW REVISION → Variables & Secrets
2. Find the secret binding and remove it
3. Re-add it with version set to `latest`
4. Deploy

### Scheduled GitHub Action doesn't run on schedule

See [the inactivity note above](#-github-actions-and-60-day-inactivity) — most common cause is the repo being inactive for 60+ days.
