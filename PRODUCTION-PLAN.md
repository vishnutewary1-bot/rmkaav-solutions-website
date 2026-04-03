# RMKAAV Solutions — Production Deployment Plan

## Overview

**Website:** rmkaav.com
**Type:** Single-page marketing website for a digital marketing agency
**Stack:** HTML5, CSS3, Vanilla JS (static site)
**Hosting:** Vercel
**Database:** Firebase Firestore (form submissions + newsletter subscribers)
**CMS:** Decap CMS (visual content editor at /admin)
**Spam Protection:** Google reCAPTCHA v3
**Email:** EmailJS (kept for email notifications, Firebase stores the data)
**Domain:** rmkaav.com (purchased, needs DNS configuration)
**Social Media:** Profiles not yet created — use placeholders

---

## Architecture Diagram

```
                    +------------------+
                    |   rmkaav.com     |
                    |   (Vercel)       |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
     +--------v--+   +------v------+  +----v-------+
     | index.html |   | /admin      |  | config.js  |
     | style.css  |   | (Decap CMS) |  | (runtime)  |
     | script.js  |   +------+------+  +----+-------+
     +--------+---+          |              |
              |              |              |
    +---------v---------+    |    +---------v---------+
    |                   |    |    |                   |
    |  Firebase         |    |    |  EmailJS          |
    |  Firestore DB     |    |    |  (email delivery) |
    |  - contacts       |    |    +-------------------+
    |  - newsletter     |    |
    |  - submissions    |    |    +-------------------+
    +-------------------+    |    |  reCAPTCHA v3     |
                             |    |  (spam scoring)   |
                    +--------v--+ +-------------------+
                    | GitHub     |
                    | Repository |
                    | (content)  |
                    +------------+
```

---

## Phase 1: Firebase Setup & Data Storage

### 1.1 Create Firebase Project

**Manual steps (you do this):**

1. Go to https://console.firebase.google.com
2. Click "Create a project" → Name: `rmkaav-solutions`
3. Disable Google Analytics (not needed, we'll add our own later if needed)
4. Once created, go to **Build → Firestore Database**
5. Click "Create database" → Start in **Production mode**
6. Select region: `asia-south1` (Mumbai — closest to your users)

### 1.2 Get Firebase Config

1. In Firebase Console → Project Settings (gear icon) → General
2. Scroll to "Your apps" → Click **Web** (</> icon)
3. Register app: nickname `rmkaav-web`
4. Copy the `firebaseConfig` object — it looks like:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "rmkaav-solutions.firebaseapp.com",
     projectId: "rmkaav-solutions",
     storageBucket: "rmkaav-solutions.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```
5. These values go into `config.js`

### 1.3 Firestore Security Rules

Set these in Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Contact form submissions — anyone can create, nobody can read/update/delete from client
    match /contacts/{document} {
      allow create: if request.resource.data.keys().hasAll(['name', 'email', 'service', 'timestamp'])
                    && request.resource.data.name is string
                    && request.resource.data.email is string
                    && request.resource.data.name.size() > 0
                    && request.resource.data.name.size() < 200
                    && request.resource.data.email.size() > 0
                    && request.resource.data.email.size() < 200;
      allow read, update, delete: if false;
    }

    // Newsletter subscribers — anyone can create, nobody can read/update/delete from client
    match /newsletter/{document} {
      allow create: if request.resource.data.keys().hasAll(['email', 'timestamp'])
                    && request.resource.data.email is string
                    && request.resource.data.email.size() > 0
                    && request.resource.data.email.size() < 200;
      allow read, update, delete: if false;
    }

    // Block everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Note:** You can still view all data from the Firebase Console dashboard — these rules only restrict client-side (browser) access.

### 1.4 Code Changes — Firebase Integration

**New file:** `firebase-config.js`
- Firebase SDK initialization
- Firestore helper functions: `saveContact()`, `saveSubscriber()`

**Modify:** `index.html`
- Add Firebase SDK CDN scripts (modular v9+ compat)

**Modify:** `script.js`
- Contact form: save to Firestore FIRST, then send EmailJS as notification
- Newsletter: save to Firestore FIRST, then send EmailJS as notification
- If Firestore save succeeds but EmailJS fails → still show success (data is safe)
- If Firestore save fails → show error (data would be lost)

**Modify:** `config.js`
- Add Firebase config values

### 1.5 Firestore Collections Structure

**`contacts` collection:**
```json
{
  "name": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "phone": "+91 9876543210",
  "service": "smm",
  "budget": "25-50k",
  "message": "I need help with Instagram marketing",
  "timestamp": "2026-04-03T10:30:00Z",
  "source": "contact-form",
  "status": "new"
}
```

**`newsletter` collection:**
```json
{
  "email": "subscriber@example.com",
  "timestamp": "2026-04-03T10:30:00Z",
  "source": "footer-newsletter",
  "status": "active"
}
```

---

## Phase 2: reCAPTCHA v3 Integration

### 2.1 Get reCAPTCHA Keys

**Manual steps (you do this):**

1. Go to https://www.google.com/recaptcha/admin
2. Register a new site:
   - Label: `rmkaav.com`
   - reCAPTCHA type: **v3**
   - Domains: `rmkaav.com`, `localhost` (for testing)
3. Copy **Site Key** (goes in frontend) and **Secret Key** (for server-side verification later)

### 2.2 Code Changes

**Modify:** `index.html`
- Add reCAPTCHA v3 script tag

**Modify:** `config.js`
- Add `RECAPTCHA_SITE_KEY`

**Modify:** `script.js`
- Before form submit: call `grecaptcha.execute()` to get a token
- Include token in Firestore document for manual review
- reCAPTCHA v3 scores from 0.0 (bot) to 1.0 (human)
- Reject submissions with score below 0.5

**Note:** Full server-side verification requires a backend (Vercel serverless function). For now, we'll use client-side scoring + honeypot as a practical compromise. The reCAPTCHA token is stored in Firestore for later server-side verification if you add a backend.

### 2.3 Honeypot Field (Additional Layer)

- Add a hidden input field in the contact form (`<input name="website" style="display:none">`)
- If this field has a value on submit → it's a bot → silently reject

---

## Phase 3: Content Management with Decap CMS

### 3.1 How Decap CMS Works

- Decap CMS (formerly Netlify CMS) provides a visual editor at `yoursite.com/admin`
- It reads/writes content as files in your GitHub repository
- Content is stored as JSON/Markdown files in a `/content` folder
- Your site reads these JSON files and renders them dynamically
- **No database needed for content** — it's all in Git

### 3.2 Content Files to Create

```
/content/
├── services.json        — 3 service cards
├── portfolio.json       — 6 portfolio case studies
├── pricing-smm.json     — 3 SMM pricing tiers
├── pricing-ai.json      — 3 AI pricing tiers
├── pricing-web.json     — 3 Web pricing tiers
├── testimonials.json    — 5 testimonials
├── faq.json             — 6 FAQ items
├── stats.json           — Hero stats (projects, clients, growth)
└── site-settings.json   — Phone, email, address, company name
```

### 3.3 Admin Panel Setup

**New files:**
- `admin/index.html` — Decap CMS admin page
- `admin/config.yml` — CMS configuration (defines content structure)

**CMS config.yml defines:**
- GitHub repo connection (OAuth via GitHub)
- Content collections (services, portfolio, pricing, etc.)
- Field types for each collection (text, number, image, select, etc.)
- Editorial workflow (draft → review → publish)

### 3.4 Code Changes

**Modify:** `script.js`
- Add content loading functions that fetch JSON from `/content/*.json`
- Render content dynamically instead of reading from hardcoded HTML
- Fallback to hardcoded content if JSON files fail to load

**Modify:** `index.html`
- Replace hardcoded content sections with placeholder containers
- Content populated by JS from JSON files on page load

### 3.5 GitHub OAuth for CMS

**Manual steps (you do this):**

1. Go to GitHub → Settings → Developer Settings → OAuth Apps
2. Create new OAuth app:
   - App name: `RMKAAV CMS`
   - Homepage URL: `https://rmkaav.com`
   - Callback URL: `https://api.netlify.com/auth/done` (Decap uses this even on Vercel)
3. Copy Client ID and Client Secret
4. Set up an OAuth proxy (needed for GitHub auth from the browser)

---

## Phase 4: Vercel Deployment

### 4.1 Vercel Setup

**Manual steps (you do this):**

1. Create account at https://vercel.com (sign in with GitHub)
2. Click "New Project" → Import your GitHub repository
3. Framework preset: **Other** (static site)
4. Build command: (leave empty — no build step needed)
5. Output directory: `.` (root)
6. Deploy

### 4.2 Domain Configuration

1. In Vercel Dashboard → Project → Settings → Domains
2. Add `rmkaav.com`
3. Vercel will give you DNS records to add:
   - `A` record → `76.76.21.21`
   - `CNAME` for `www` → `cname.vercel-dns.com`
4. Go to your domain registrar and add these DNS records
5. SSL/HTTPS is automatic on Vercel

### 4.3 Environment Variables (Optional)

If you want to keep Firebase config out of source:
1. Vercel Dashboard → Settings → Environment Variables
2. Add each Firebase config value
3. However, since this is a static site (no build step), env vars won't work without a build tool
4. **For now:** Keep credentials in `config.js` (they're client-side Firebase keys, designed to be public)

### 4.4 Vercel Project Config

**New file:** `vercel.json`
```json
{
  "rewrites": [
    { "source": "/admin", "destination": "/admin/index.html" },
    { "source": "/admin/(.*)", "destination": "/admin/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

---

## Phase 5: Missing Assets & Final Polish

### 5.1 Favicon

- Create using https://realfavicongenerator.net
- Upload the RMKAAV logo or a text-based icon
- Place generated files in root: `favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png`

### 5.2 OG Image

- Create a 1200x630px image using Canva or Figma
- Include: RMKAAV logo, tagline, brand colors
- Save as `og-image.jpg` in root directory

### 5.3 Social Media Placeholders

- Keep `#` links for now
- Add a comment in HTML: `<!-- TODO: Replace with actual social media URLs -->`
- Social profiles to create later: Instagram, LinkedIn, Twitter/X, Facebook

### 5.4 Google Analytics

**Modify:** `index.html`
- Add Google Analytics 4 (GA4) script tag in `<head>`
- Track: page views, form submissions, CTA clicks

**Modify:** `config.js`
- Add `GA_MEASUREMENT_ID`

---

## Implementation Order

| Step | What | Depends On | Effort |
|------|------|------------|--------|
| **1** | Firebase project setup | Nothing (manual) | 15 min |
| **2** | Firebase code integration | Step 1 config values | 2 hrs |
| **3** | reCAPTCHA setup | Nothing (manual) | 10 min |
| **4** | reCAPTCHA + honeypot code | Step 3 site key | 1 hr |
| **5** | Content JSON extraction | Nothing | 2 hrs |
| **6** | Dynamic content rendering | Step 5 | 3 hrs |
| **7** | Decap CMS admin panel | Step 5+6 + GitHub OAuth | 2 hrs |
| **8** | Create favicon + OG image | Nothing (manual/design) | 30 min |
| **9** | Vercel deployment config | Nothing | 30 min |
| **10** | Push to GitHub | All code steps | 15 min |
| **11** | Deploy to Vercel | Step 10 + Vercel account | 15 min |
| **12** | Configure domain DNS | Step 11 + domain registrar | 30 min |
| **13** | Test everything end-to-end | All steps | 1 hr |
| **14** | Google Analytics setup | Step 11 (needs live site) | 30 min |

**Total estimated effort:**
- **Your manual setup tasks:** ~2 hours (Firebase, reCAPTCHA, Vercel, DNS, assets)
- **Code implementation:** ~10 hours
- **Testing & fixes:** ~2 hours

---

## Files to Create/Modify

### New Files
```
firebase-config.js          — Firebase SDK init + helper functions
admin/index.html            — Decap CMS admin page
admin/config.yml            — CMS content schema
content/services.json       — Service cards data
content/portfolio.json      — Portfolio case studies data
content/pricing-smm.json    — SMM pricing tiers
content/pricing-ai.json     — AI pricing tiers
content/pricing-web.json    — Web pricing tiers
content/testimonials.json   — Testimonials data
content/faq.json            — FAQ items data
content/stats.json          — Hero stats data
content/site-settings.json  — Company contact info
vercel.json                 — Vercel routing & headers config
og-image.jpg                — Social sharing image (you create)
favicon.ico                 — Browser tab icon (you create)
favicon-32x32.png           — Browser tab icon (you create)
```

### Modified Files
```
index.html     — Firebase SDK, reCAPTCHA, GA4, honeypot field, dynamic content containers
script.js      — Firebase writes, reCAPTCHA flow, dynamic content rendering, GA events
config.js      — Firebase config, reCAPTCHA key, GA ID
style.css      — Honeypot field hiding, minor admin link styling
```

---

## What You Need to Provide/Do Before I Start Coding

1. **Create Firebase project** → Give me the `firebaseConfig` object
2. **Register reCAPTCHA v3** → Give me the Site Key
3. **Create Vercel account** → Connect your GitHub repo
4. **Create GitHub OAuth app** → Give me the Client ID (for Decap CMS)
5. **Create favicon + OG image** → Drop the files into the project folder

---

## Post-Launch Checklist

- [ ] Verify contact form saves to Firestore AND sends email
- [ ] Verify newsletter saves to Firestore AND sends email
- [ ] Check Firebase Console for test submissions
- [ ] Verify reCAPTCHA is scoring (check token in Firestore docs)
- [ ] Test CMS at rmkaav.com/admin — login with GitHub, edit content
- [ ] Verify OG image shows correctly (use https://opengraph.xyz)
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Check Google PageSpeed score (aim for 90+)
- [ ] Verify SSL certificate is active (green padlock)
- [ ] Submit sitemap to Google Search Console
