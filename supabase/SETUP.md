# Supabase Setup — One-Time Walkthrough

Once these 6 steps are done, the `/admin` panel goes live.

---

## 1. Create the Supabase project

1. Open **https://supabase.com** in a browser, sign in with `admin@brandbonjour.com`
2. Click **New Project**
3. Fill in:
   - **Name:** `samina-website`
   - **Database password:** click "Generate", **save this somewhere** (LastPass, password manager — you may never need it but you can't recover it later)
   - **Region:** `East US (North Virginia)` (closest to her business)
   - **Pricing plan:** Free
4. Click **Create new project** — wait ~2 minutes for setup

---

## 2. Run the database schema

1. In the Supabase project dashboard, left sidebar → **SQL Editor**
2. Click **New query**
3. Open `supabase/migrations/0001_init.sql` from this repo, copy the entire contents
4. Paste into the SQL Editor
5. Click **Run** (bottom right)
6. Should see `Success. No rows returned.`

This creates all the tables: team_members, content_blocks, content_history, media, communities, closings, reviews, review_submissions, partner_categories, partners, forms, leads.

---

## 3. Disable email confirmation (optional, recommended for dev)

By default, Supabase requires users to click a confirmation link in their email before they can log in. For a small team (just Samina + Umair), this is unnecessary friction.

1. Sidebar → **Authentication** → **Providers** → **Email**
2. Toggle **Confirm email** to **OFF**
3. Click **Save**

(Skip this step if you want to keep email confirmation on.)

---

## 4. Grab the API credentials

1. Sidebar → **Project Settings** → **API**
2. Copy these three values:
   - **Project URL** (top of the page, looks like `https://xxxxxxxx.supabase.co`)
   - **anon public** key (under "Project API Keys")
   - **service_role** key (under "Project API Keys" — **secret**, never commit)

---

## 5. Add credentials to local env

Create `/Users/umairahmad/Downloads/samina-website/.env.local` (already gitignored):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi....
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi....
```

Then restart the dev server: `npm run dev`

---

## 6. Create the first admin account

1. Visit **http://localhost:3008/admin/signup**
2. Enter your email + password (8+ chars)
3. Click **Create Account**
4. You're auto-set as "owner" because you're the first user
5. Visit **http://localhost:3008/admin/login** and sign in

---

## 7. Add credentials to Netlify (for production)

Once local works:

1. **https://app.netlify.com** → samina-bilal-website project
2. **Site settings → Environment variables → Add variable**
3. Add the same 3 keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
4. Trigger a redeploy: **Deploys → Trigger deploy → Deploy site**

---

## You're done with Supabase

The admin shell is live at `/admin`. **Site Editor → Content** is fully usable from here.

---

## 8. Cloudinary (for the Media Library)

The admin **Media Library** uses Cloudinary for uploads, crops, and background removal. Five minutes:

1. Open **https://cloudinary.com** → sign up with `admin@brandbonjour.com`
2. From the dashboard, copy the **Cloud name** (top-right under your account)
3. **Settings → Upload → Add upload preset**
   - **Preset name:** `samina-website-uploads`
   - **Signing Mode:** `Unsigned`
   - **Folder:** `samina-website`
   - **Allowed formats:** `jpg, jpeg, png, webp, avif`
   - **Max file size:** `15 MB` (or whatever feels reasonable)
   - Click **Save**
4. (Optional) Enable **Cloudinary AI background removal** — Settings → Add-ons → "Cloudinary AI Background Removal" → Subscribe to the free tier. Needed for the "Remove background" button on images.
5. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=samina-website-uploads
   ```
6. Restart the dev server. Upload a test image at `/admin/media`.
7. On Netlify: add the same two `NEXT_PUBLIC_CLOUDINARY_*` env vars and trigger a redeploy.

---

## Adding more team members later

Once Supabase is set up:

- The first signup at `/admin/signup` becomes the **owner**
- After that, additional users can be invited via the **Team** section in the admin panel (coming in Phase 7)
- Until Phase 7 ships, additional users can sign up at `/admin/signup` and they'll be added as **editors**

Once you're confident only one signup will happen, the `/admin/signup` route can be removed entirely — invites will work through the Team UI.
