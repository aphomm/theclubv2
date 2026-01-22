# THE CLUB - Quick Start Guide

## 30-Second Setup

### 1. Get Your Supabase Credentials
1. Go to [supabase.com](https://supabase.com) and create a project
2. Get your API keys from **Settings → API**

### 2. Configure Environment
```bash
# Copy your credentials into .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
STRIPE_SECRET_KEY=optional-for-now
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=optional-for-now
EOF
```

### 3. Run the Project
```bash
# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

Then visit: **http://localhost:3000**

---

## Available Routes

### Public Pages
- `/` - Landing page
- `/auth/signup` - Create account
- `/auth/login` - Sign in
- `/auth/forgot-password` - Reset password

### Member Pages (Protected)
- `/dashboard` - Home dashboard
- `/dashboard/events` - Event listing
- `/dashboard/events/[id]` - Event details with RSVP
- `/dashboard/directory` - Member search
- `/dashboard/the-pool` - Projects overview
- `/dashboard/the-pool/projects` - All projects
- `/dashboard/resources` - Resource library
- `/dashboard/settings` - Profile editing

### Admin Pages (Admin role required)
- `/admin` - Dashboard overview
- `/admin/members` - Member management
- `/admin/events` - Event management

---

## Test Credentials (For Demo)

### Create Test Account
1. Visit http://localhost:3000
2. Click "Apply" → "Sign up"
3. Enter any email, password, select tier
4. Auto-redirects to dashboard

### Access Admin Panel
1. Create an account
2. In Supabase: Edit `users` table
3. Set your `status` to `'admin'`
4. Visit http://localhost:3000/admin

---

## Useful NPM Commands

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build           # Build for production
npm start              # Start production server

# Code quality
npm run lint           # Run ESLint
npm run typecheck      # Check TypeScript types

# Database (via Supabase dashboard)
# All schema already created and deployed
```

---

## Key Features You Can Test

### Landing Page
- ✓ Scroll through all sections
- ✓ Sign up from any membership tier
- ✓ Add email to waitlist (bottom section)

### Authentication
- ✓ Create account with email/password
- ✓ Log in with credentials
- ✓ View profile in dashboard
- ✓ Log out from sidebar

### Dashboard
- ✓ View quick stats
- ✓ See upcoming events
- ✓ Access member directory
- ✓ Browse The Pool projects
- ✓ Edit profile in settings

### Events
- ✓ Browse all events with filters
- ✓ Click event to see details
- ✓ RSVP with guest count
- ✓ View event agenda
- ✓ Cancel RSVP

### Member Directory
- ✓ Search members by name/role/location
- ✓ Filter by membership tier
- ✓ View member profiles
- ✓ Message and Connect (UI only)

### The Pool
- ✓ View active projects
- ✓ See funding progress
- ✓ View project details
- ✓ Track your investments

### Admin Panel (if set as admin)
- ✓ View platform stats
- ✓ Browse all members
- ✓ Manage events
- ✓ Check system status

---

## Deployment Checklist

Before going live:

- [ ] Update `.env.local` with production credentials
- [ ] Set up Stripe keys for payment processing
- [ ] Configure custom domain in Vercel
- [ ] Set up SSL certificate (automatic with Vercel)
- [ ] Configure email service for notifications
- [ ] Seed database with sample data
- [ ] Test complete user flow
- [ ] Set up monitoring/logging

### Deploy to Vercel
```bash
# Push to GitHub
git add .
git commit -m "Initial deployment"
git push origin main

# Then in Vercel:
# 1. Connect GitHub repo
# 2. Set environment variables
# 3. Deploy
```

---

## Database Schema At a Glance

### Core Tables
- `users` - User profiles (50 columns)
- `memberships` - Active subscriptions
- `events` - Club events
- `event_rsvps` - Event signups

### Business Tables
- `pool_projects` - Collaborative projects
- `pool_investments` - Project funding
- `studio_bookings` - Studio reservations

### Additional
- `resources` - Resource library
- `messages` - Direct messaging
- `waitlist` - Pre-launch emails

### Security
✓ All tables have RLS enabled
✓ Automatic timestamp tracking
✓ Foreign key constraints
✓ Unique email constraint on users

---

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### Blank page / No content loading
- Check browser console for errors (F12)
- Verify `.env.local` has correct URLs
- Check network tab - should see successful requests

### Can't log in
- Verify Supabase project is running
- Check user was created in `auth.users` table
- Try creating new account instead

### Events not showing
- Add sample data via SQL (see SETUP_GUIDE.md)
- Check events table has data
- Verify event date >= today

### Admin panel access denied
- Verify user `status` = `'admin'` in Supabase
- Try refreshing page after update
- Check browser console for error

---

## File You Edited

- `.env.local` ← Add your Supabase credentials here

## Files You Should Read

1. `SETUP_GUIDE.md` - Detailed configuration
2. `PROJECT_SUMMARY.md` - Complete feature list
3. `app/page.tsx` - Landing page code
4. `app/dashboard/layout.tsx` - Dashboard structure

---

## Next Steps

1. ✓ Get Supabase credentials
2. ✓ Update `.env.local`
3. ✓ Run `npm run dev`
4. ✓ Test the platform
5. → Add sample data (SQL)
6. → Configure Stripe (Phase 2)
7. → Deploy to Vercel

---

## Support

- **Supabase Help**: https://supabase.com/docs
- **Next.js Help**: https://nextjs.org/docs
- **Tailwind Help**: https://tailwindcss.com/docs

---

## That's It!

Your premium music club platform is ready to go. Visit http://localhost:3000 and start exploring!
