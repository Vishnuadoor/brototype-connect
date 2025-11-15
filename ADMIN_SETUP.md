# Admin/Manager Setup Guide

## How to Create a Manager Account

Since the database automatically creates student accounts by default, you need to manually upgrade an account to manager/admin role using the Cloud Dashboard.

### Steps:

1. **Open Cloud Dashboard**
   - Desktop: Click "Cloud" tool button at the top of the preview
   - Mobile: Tap the widgets icon in bottom-right (Chat mode) → Cloud

2. **Navigate to Database**
   - Click on "Database" tab
   - Select "Tables" from the sidebar

3. **Access Profiles Table**
   - Find and click on the "profiles" table
   - You'll see all registered users

4. **Update User Role**
   - Find the user you want to promote to manager/admin
   - Click on their row to edit
   - Change the "role" field from `student` to either:
     - `manager` - Can view and manage all complaints
     - `admin` - Full access (same as manager for now)
   - Save the changes

5. **Sign Out and Sign In**
   - The user needs to sign out and sign back in
   - They will now be redirected to the Manager Dashboard automatically

### Manager Dashboard Features

Once promoted, managers can:
- ✅ View ALL student complaints (not just their own)
- ✅ Filter by status, priority, hub, and search
- ✅ Update complaint status (New → Acknowledged → In Progress → Resolved → Closed)
- ✅ Assign complaints to themselves or other managers
- ✅ View complaint details and communicate with students
- ✅ See dashboard statistics

### URL Access

- **Student Dashboard**: `/dashboard`
- **Manager Dashboard**: `/manager/dashboard`

The system automatically redirects users to the correct dashboard based on their role.
