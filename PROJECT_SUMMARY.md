# ICWT - Project Summary (Updated)

> **Note**: This document reflects the actual current state of the codebase as of the last update.
> For the authoritative history, use `git log --oneline`. This doc is a reference snapshot — not a source of truth.

---

## Platform Overview

**In Culture We Trust (ICWT)** is a premium private membership platform for Rance's music industry community based in Inglewood, CA. Think SoHo House meets music industry — exclusive access, studio booking, collaborative investment projects, events, and networking.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 13 (App Router) + TypeScript |
| Styling | Tailwind CSS + Cormorant Garamond typography |
| Database | Supabase PostgreSQL with RLS |
| Auth | Supabase Email/Password |
| Payments | Stripe (with bypass mode for testing) |
| Calendar | Google Calendar API integration |
| Icons | Lucide React |
| UI Components | shadcn/ui |
| Notifications | Sonner (Toast) |
| Deployment | Netlify |

---

## What's Actually Built (Current State)

### Authentication
- Signup with tier selection (Creator, Professional, Executive)
- Auto-profile + membership record creation on signup
- Login, logout, forgot password, reset password
- Auth-protected routes, session management

### Landing Page
- Full marketing page with hero, features, philosophy, pricing tiers
- Waitlist email capture (Supabase)
- Leadership photos, studio images, testimonials

### Member Dashboard
- Overview stats, upcoming events, studio booking preview, Pool preview
- Sidebar nav (desktop) + drawer menu (mobile)
- Notifications bell with real-time badge

### Events
- Browsable event list with search + type filtering
- Event detail pages with flyer thumbnails, agenda, instructor bio
- RSVP with guest count, spot tracking, cancel RSVP
- External RSVP and share functionality

### Member Directory
- Search by name/role/location
- Filter by membership tier
- Member profile detail pages
- Connect + message actions

### The Pool (Collaborative Projects)
- Project listing with funding progress bars
- Project detail pages with investment flows
- E-sign investment flow
- Project creation (submit new projects)
- Admin approval workflow
- Investment earnings tracking

### Studio Booking
- Booking calendar interface
- Tier-based monthly hour allocations
- Timezone handling
- Google Calendar sync (API integration)
- Booking cancellation
- Admin attendance management

### Messaging
- Direct messages between members
- Thread view per user (`/messages/[userId]`)
- Messages inbox

### Notifications
- Unified notifications system
- Bell badge with unread count
- Notifications page (member + admin)

### Search
- Global search page (`/dashboard/search`)

### Resources
- Filterable resource library
- Admin resource management

### Settings
- Profile editing (name, role, location, bio)

### Checkout / Payments
- Stripe checkout flow
- Checkout success page
- Stripe webhook handler
- Bypass mode for demo/testing

### Admin Panel
- Overview stats (members by tier, events, revenue)
- Member management (search, filter, suspend, tier changes) — service role backed
- Event management (create, edit, view attendance)
- Event detail view with RSVP management
- Pool project approval
- Resource management
- Notifications management
- Admin setup page

### API Routes
- `/api/checkout` — Stripe session creation
- `/api/webhooks/stripe` — Stripe webhook handler
- `/api/cancel-booking` — Studio booking cancellation
- `/api/google-calendar/auth` — OAuth initiation
- `/api/google-calendar/callback` — OAuth callback
- `/api/google-calendar/sync-booking` — Calendar event sync
- `/api/admin/members` — Member management (service role)
- `/api/admin/setup` — Admin setup

---

## Design System

- **Background**: Stone-950
- **Text**: Stone-100
- **Accent**: Amber-600
- **Typography**: Cormorant (serif display) + Inter (sans body)
- **Borders**: 1px stone-800/900
- **Buttons**: Rectangular, no border-radius
- **Cards**: Border-only, minimal fill

---

## File Structure (Actual)

```
/app
├── page.tsx                        Landing
├── layout.tsx
├── not-found.tsx
├── checkout/
│   ├── page.tsx
│   └── success/page.tsx
├── auth/
│   ├── login/, signup/, forgot-password/, reset-password/, callback/
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── events/[id]/, directory/[id]/
│   ├── messages/[userId]/
│   ├── the-pool/projects/[id]/, projects/new/
│   ├── studio/, resources/, settings/
│   ├── notifications/, search/
├── admin/
│   ├── page.tsx, layout.tsx
│   ├── members/, events/[id]/
│   ├── pool/, resources/, notifications/, setup/
└── api/
    ├── checkout/, webhooks/stripe/
    ├── cancel-booking/
    └── google-calendar/auth, callback, sync-booking/
```

---

## Commit History

34 commits. Key milestones:
- Phase 1: Core platform (auth, landing, dashboard, events, directory, pool, admin)
- Phase 2: Studio booking, messaging, investments, search, notifications
- Stripe payment infrastructure + bypass mode
- Google Calendar integration
- Design system overhaul (Cormorant typography, full visual refresh)
- Admin hardening (service role, RLS fixes, dropdown fixes)
- Demo/beta readiness passes

For full history: `git log --oneline`
