ACADEMY HUB — PROJECT HANDOFF / AI README
===============================================

Project
-------
Name: Academy Hub
Repository: https://github.com/rehmanabdul40000-rgb/academy-hub
Branch: main
Local project folder:
C:\Users\admin\Downloads\academy-hub-main\academy-hub-main

Purpose
-------
Academy Hub is a Student & Fee Management System for an academy/tuition center.
The current stable architecture is intentionally LOCAL STORAGE based.
The experimental Supabase/PostgreSQL scalable database work was removed from the active application.

IMPORTANT
---------
- Work ONLY in rehmanabdul40000-rgb/academy-hub.
- Do NOT modify the old tuition-tide-pro repository.
- Do NOT re-add the removed scalable/Supabase architecture unless the user explicitly asks for a new database migration.
- Preserve the current charcoal/dark-slate visual theme.
- Preserve all existing student, payment, Excel, settings, permissions and segment features.
- Do not expose secrets/passwords in source code, screenshots, README files or chat.

TECH STACK
----------
- React
- TypeScript
- TanStack Start
- TanStack Router
- Tailwind CSS
- shadcn-style UI components
- Lucide React
- ExcelJS
- Browser localStorage

DATA ARCHITECTURE
-----------------
Current stable data flow:

Browser
  |
  +-- localStorage
       +-- students
       +-- payments
       +-- settings
       +-- deleted/restore records
       +-- users/permissions
       +-- workspace preferences

Important limitation:
- Data is local to the browser/profile.
- Localhost and Vercel do NOT share records automatically.
- Different computers/browsers have separate localStorage.
- Vercel hosting does not turn localStorage into a shared database.
- This is intentional in the current stable version.

LOGIN / ADMIN
------------
Initial admin credentials are controlled by the app's current authentication/settings flow.
Do not hardcode or publish real passwords.
The admin can change the password from Settings / Change Password.

MAIN FEATURES
-------------
1. Dashboard
   - Time-based greeting
   - Admin display name
   - Current time
   - Student totals
   - Fee collection summary
   - Paid / Partial / Pending information
   - Outstanding fees
   - Recent students
   - Gender summary
   - Quick payment

2. Students
   - All Students
   - Add Student
   - View Student
   - Edit Student
   - Delete Student
   - Recently Deleted / Restore
   - Search
   - Status filtering
   - Gender filtering
   - Date Joined
   - Total Fees
   - Amount Paid
   - Remaining Fees
   - Payment Status
   - Notes
   - Saved At

3. Required segment sections
   - Male Students
   - Female Students
   - Morning Shift
   - Evening Shift

   These sections MUST remain available.

4. Student fields
   - Student ID (manual)
   - Full Name
   - Gender (Male/Female)
   - Phone (optional)
   - Course/Class (optional)
   - Date Joined (optional)
   - Shift (optional)
   - Class Time
   - Total Fees
   - Amount Paid at Enrollment (optional/blank allowed)
   - Remaining
   - Payment Status
   - Notes
   - Saved At

5. Shift Management
   - Morning Shift
   - Evening Shift
   - From/To timings
   - Student shift assignment
   - Class Time auto-fills from shift
   - Class Time remains editable
   - Blank shift remains allowed
   - Student shift dropdown should stay limited to Morning Shift and Evening Shift

6. Fees / Payments
   - Collect Payment
   - Payment validation
   - Remaining calculation
   - Paid / Partial / Pending
   - Payment history
   - Receipt/print
   - Outstanding students
   - Fee reports
   - Duplicate-submit protection
   - Enrollment payment is recorded in payment history when enrollment amount is greater than zero

7. Excel
   - Export to Excel
   - Students
   - Fee Summary
   - Fee Analytics
   - Payment History
   - Male Students
   - Female Students
   - Professional headers
   - Academy/session/admin/currency information
   - Generated date/time
   - Centered alignment
   - Course names readable without unnecessary wrapping
   - Section-aware exports
   - Excel/CSV student import

8. Settings
   - Academy / Institution Name
   - Academic Session / Year
   - Currency Symbol / Label
   - Contact Phone / WhatsApp
   - Contact Email
   - Campus / Academy Address
   - Admin Display Name
   - Admin Username
   - Admin Password
   - Save Workspace Settings
   - Backup / Restore
   - Recently Deleted / Restore
   - Import Students
   - Workspace section enable/disable
   - Dark / Light theme

9. Theme
   - Dark theme
   - Light theme is intentionally charcoal/dark-slate rather than white
   - Top header has quick theme buttons
   - Text, cards, inputs and borders must remain readable
   - Do not replace the current theme with white/cream/low-contrast styling without user approval

10. Users & Permissions
   Permission areas:
   - Students View
   - Students Create
   - Students Edit
   - Students Delete
   - Payments
   - Reports
   - Shift Management
   - User Management
   - Settings

11. Change Password
   - Existing Change Password screen must remain available.

LOCAL DEVELOPMENT
-----------------
From the project folder:

git pull origin main
npm install
npm run dev

Open:
http://localhost:3000

If VS Code shows old GitHub Actions workflow errors, first make sure the local branch is aligned with the current origin/main as described below.

LOCAL GIT RECOVERY AFTER THE OLD SCALABLE WORK
----------------------------------------------
The GitHub main branch has already been cleaned of the obsolete scalable/Supabase work.

If the local branch says:
"Your branch and 'origin/main' have diverged"
and shows many local commits plus a few remote commits, do NOT merge blindly.

Recommended safe recovery:
1. If there is any local code you definitely need, copy/back it up first.
2. Browser localStorage data is separate from Git, so resetting Git does not delete the browser's saved student records.
3. Then run:

git fetch origin
git branch backup-before-final-cleanup
git reset --hard origin/main
git clean -fd

4. Restart VS Code terminal.
5. Run:

npm install
npm run dev

The generated routeTree file may change when the dev server starts; that is normal.
Do not manually merge the old divergent branch back into main.

VERCEL DEPLOYMENT
-----------------
The project is already suitable for Vercel and is a TanStack Start application.
Vercel supports TanStack Start directly; it does NOT need to be converted to Next.js.

Recommended GitHub deployment:
1. Make sure local code is clean and tested.
2. Push the desired code to:
   rehmanabdul40000-rgb/academy-hub
   branch main
3. Open Vercel.
4. Select Add New -> Project.
5. Import the GitHub repository.
6. Select:
   rehmanabdul40000-rgb/academy-hub
7. Keep Root Directory as the repository root.
8. Let Vercel detect TanStack Start.
9. Build command should be:
   npm run build
10. Deploy.

If the Vercel project already exists and is connected to this GitHub repository:
- push to main
- Vercel normally creates a new deployment automatically
- open the Vercel project and wait for the build to finish
- open the Production URL and test all major screens

CURRENT VERCEL DATA WARNING
---------------------------
Because the stable app uses browser localStorage:
- Localhost records do not appear on the Vercel site.
- Vercel records do not appear on localhost.
- Each browser/device has its own records.
This is expected.

ENVIRONMENT VARIABLES
---------------------
The stable localStorage version does not need Supabase variables.

If the current app uses VITE_DEFAULT_ADMIN_PASSWORD for first-time provisioning, it may be configured in Vercel Project Settings -> Environment Variables.
Never place a Supabase secret/service-role key in frontend variables or source code.

TEST CHECKLIST BEFORE PRODUCTION
--------------------------------
- Login
- Dashboard
- Add Student
- Edit Student
- Delete / Restore
- Search
- Male Students
- Female Students
- Morning Shift
- Evening Shift
- Shift Management
- Collect Payment
- Payment History
- Receipt / Print
- Excel Export
- Excel / CSV Import
- Settings save/refresh
- Admin display name
- Password show/hide
- Change Password
- Users & Permissions
- Dark theme
- Charcoal Light theme
- Quick theme buttons
- Workspace section enable/disable
- Vercel production URL

KNOWN NON-BLOCKING TANSTACK MESSAGES
------------------------------------
TanStack Router can print messages about route exports not being code-split.
Those messages are optimization warnings, not necessarily application failures.

If the browser itself shows:
"This page didn't load. Something went wrong on our end."
first check the terminal for a real server/build exception, then refresh.
Do not treat every terminal warning as a fatal error.

HANDOFF RULES FOR ANOTHER AI
-----------------------------
- Read this file and README.md before changing the project.
- Preserve localStorage architecture.
- Preserve all existing features.
- Preserve Male/Female/Morning/Evening sections.
- Keep optional student fields optional.
- Keep blank Shift allowed.
- Keep Shift dropdown limited to Morning Shift and Evening Shift.
- Keep Class Time auto-filled but editable.
- Keep admin display name synchronized with greeting/profile/receipts/Excel.
- Keep passwords hidden by default.
- Never ask the user for or expose secret keys.
- Test locally before production deployment.
- Prefer small, isolated changes.
- Do not modify tuition-tide-pro.
- Do not reintroduce Supabase/scalable database code without explicit user approval.
