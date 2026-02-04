# ICWT - Admin Debugging Guide

## Project Status Update Issue

If project approvals are not persisting, this may be caused by:

### 1. Database RLS Policies
Row Level Security policies might be preventing status updates.

### 2. Database Triggers  
Automatic triggers might be reverting status changes.

### 3. Environment Issues
Service role permissions may be missing.

## Solutions Implemented

### Enhanced Update Function
- Uses service role key when available
- Adds `updated_at` timestamp to bypass triggers
- Multiple refetch attempts with delays
- Comprehensive logging for debugging

### Setup Instructions

### Option 1: Use Service Role Key (Recommended)
Add to your `.env.local`:
```bash
# Add service role key for admin operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

To get service role key:
1. Go to Supabase Dashboard → Settings → API
2. Create new service role key
3. Copy the key to your `.env.local`

### Option 2: Check RLS Policies
In Supabase Dashboard → Authentication → Policies, check:
- `pool_projects` table policies
- Ensure service role can update status
- Look for triggers that might revert changes

### Option 3: Check Database Triggers
In Supabase Dashboard → Database → Triggers:
- Look for triggers on `pool_projects` table
- Temporarily disable any status-based triggers

### Debug Mode
The update function now logs:
- Project ID being updated
- New status value
- Which authentication role is being used
- Fetch results with timestamps

Open browser console to see these logs when testing.

### Testing Steps
1. Deploy this update
2. Try approving a project
3. Check browser console logs
4. Wait 5 seconds and check if status persists
5. If still failing, add service role key

## Previous Issues Fixed
- ✅ Added immediate local state updates
- ✅ Added delayed refetching (500ms + 2000ms)
- ✅ Added service role key support
- ✅ Added comprehensive logging
- ✅ Added updated_at field to bypass triggers