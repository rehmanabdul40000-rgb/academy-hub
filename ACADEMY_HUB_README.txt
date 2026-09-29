ACADEMY HUB — PROJECT HANDOFF README
========================================

Project
-------
Name: Academy Hub
Repository: rehmanabdul40000-rgb/academy-hub
Branch: main
Old unrelated repository: tuition-tide-pro (DO NOT TOUCH)
Local development URL: http://localhost:3000
Deployment target: Vercel

IMPORTANT ARCHITECTURE
----------------------
The stable Academy Hub version uses browser localStorage.

There is NO active Supabase/PostgreSQL scalable database layer in the stable version.
There is NO active multi-computer/shared-cloud database.
Do not reintroduce scalable/Supabase code unless the owner explicitly asks for a new database migration.

Current data flow:

Browser
  |
  +-- localStorage
       +-- students
       +-- payments
       +-- settings
       +-- deleted/restore data
       +-- users/permissions
       +-- workspace preferences

This means localhost and Vercel do NOT share student records automatically.
Each browser/device has its own localStorage.

TECH STACK
----------
- React
- TypeScript
- TanStack Start
- TanStack Router
- Tailwind CSS
- shadcn-style UI components
- Lucide icons
- ExcelJS
- Browser localStorage

MAIN FEATURES
-------------
Dashboard:
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
- Saved At information

Students:
- All Students
- Add Student
- View Student
- Edit Student
- Delete Student
- Recently Deleted / Restore
- Search
- Status filters
- Gender filters
- Date Joined
- Total Fees
- Amount Paid
- Remaining Fees
- Payment Status
- Notes
- Saved At

Required student field:
- Student ID
- Full Name
- Gender: Male or Female

Optional student fields:
- Phone
- Course/Class
- Date Joined
- Shift
- Class Time
- Amount Paid at Enrollment
- Notes

Shift rules:
- Shift dropdown only has Morning Shift and Evening Shift
- Shift can remain blank
- Class Time is auto-filled from the selected shift
- Class Time can still be edited manually

Separate sections:
- Male Students
- Female Students
- Morning Shift
- Evening Shift

Fee management:
- Collect Payment
- Payment validation
- Remaining fee calculation
- Paid / Partial / Pending status
- Payment history
- Receipt / print workflow
- Outstanding students
- Fee reports
- Duplicate-submit protection
- Enrollment payment is recorded in the student's local payment history when amount paid at enrollment is greater than zero

Excel:
- Export to Excel
- Students sheet
- Fee Summary
- Fee Analytics
- Payment History
- Male Students sheet
- Female Students sheet
- Professional formatting
- Academy name
- Academic session
- Admin display name
- Currency label
- Generated date/time
- Student totals
- Gender immediately after Student ID
- Centered/middle aligned content
- Course names kept readable
- Section-aware exports
- Excel/CSV student import

Settings:
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
- Data Management & Excel Backup
- Workspace Backup & Restore
- Recently Deleted / Restore
- Import Students
- Workspace section enable/disable controls
- Dark / Light theme selection
- Quick theme controls in the top header

Security/UI:
- Admin password hidden by default
- Eye icon for password show/hide
- Admin display name controls greeting/profile/receipts/Excel
- Admin permissions control navigation and protected actions
- Do not place real secrets in source code or README files

THEME
-----
Two theme choices exist:
- Dark
- Light

The Light option was intentionally redesigned as a dark charcoal/slate visual theme instead of white/cream.
The final theme should keep:
- readable text
- visible borders
- readable cards and inputs
- understandable active navigation

LOCAL DEVELOPMENT
-----------------
Requirements:
- Node.js
- npm
- Git

Install:
npm install

Run:
npm run dev

Open:
http://localhost:3000

Build:
npm run build

Important:
The Vite/TanStack console can show informational route-export warnings. Those are not automatically fatal.
If the browser shows "This page didn't load", first stop the dev server, make sure the local branch is clean and synchronized with origin/main, then restart.

GIT WORKFLOW
------------
Safe normal workflow:

git pull origin main
npm install
npm run dev

After testing:

git status
git add .
git commit -m "describe the change"
git push origin main

If local Git history becomes diverged from origin/main and the repository's main branch is confirmed to contain the intended stable version, create a backup branch first, then reset local main to origin/main:

git fetch origin
git branch backup-before-stable-reset
git reset --hard origin/main

This preserves the old local commits on the backup branch while making main match the stable GitHub version.

VERCEL DEPLOYMENT
-----------------
The intended deployment platform is Vercel.

Recommended method:
1. Make sure the final code is pushed to GitHub main.
2. Open Vercel.
3. Open the existing Academy Hub project, or choose Add New -> Project.
4. Import:
   rehmanabdul40000-rgb/academy-hub
5. Keep the project root as the repository root.
6. Let Vercel detect the framework.
7. Build command should be:
   npm run build
8. Deploy.

If the GitHub repository is already connected to the Vercel project, a push to main can automatically trigger a production deployment.

Environment variables:
- The stable localStorage version does not require Supabase variables.
- If using an initial admin password environment variable, the project may use:
  VITE_DEFAULT_ADMIN_PASSWORD
- Never put secret keys in README, source files, screenshots, or chat.

IMPORTANT VERCEL DATA NOTE
--------------------------
Because the stable app uses browser localStorage:
- localhost data is separate from Vercel browser data
- Vercel data is separate from localhost data
- different browsers/devices have separate data
- Vercel hosting does not create a shared database

TEST CHECKLIST BEFORE LIVE DEPLOYMENT
-------------------------------------
- Login works
- Dashboard opens
- All Students opens
- Add Student works
- Edit Student works
- Delete/Restore works
- Search works
- Male Students works
- Female Students works
- Morning Shift works
- Evening Shift works
- Shift Management works
- Collect Payment works
- Remaining fee calculation works
- Payment status updates correctly
- Receipt/print works
- Excel export works
- Excel/CSV import works
- Settings save after refresh
- Admin display name updates greeting/profile/receipts/export
- Password show/hide works
- Change Password works
- Users & Permissions works
- Dark theme works
- Light theme works
- Quick theme buttons work
- Disabled workspace sections behave correctly

FUTURE AI / DEVELOPER HANDOFF RULES
------------------------------------
1. Work only in rehmanabdul40000-rgb/academy-hub.
2. Never modify tuition-tide-pro.
3. Preserve Male Students, Female Students, Morning Shift, and Evening Shift.
4. Preserve the localStorage architecture unless the owner explicitly requests a database migration.
5. Do not reintroduce Supabase/scalable database code just because old commits or historical files exist.
6. Do not remove student, payment, Excel, settings, permissions, or theme functionality when making unrelated changes.
7. Keep optional student fields optional.
8. Keep Shift limited to Morning Shift and Evening Shift.
9. Blank Shift must remain allowed.
10. Class Time should auto-fill from Shift but remain editable.
11. Keep Admin Display Name synchronized across greeting, profile, receipts, and Excel.
12. Keep passwords hidden by default.
13. Never expose secrets.
14. Test locally before production.
15. Prefer small isolated commits.
16. Do not perform destructive Git history operations unless explicitly requested.
17. If a runtime page shows "This page didn't load", inspect the browser/dev-server error before changing working features.
18. Do not replace the stable localStorage architecture with cloud/database code without explicit approval.

CURRENT PROJECT STATUS
----------------------
The intended stable project is the localStorage Academy Hub version with the finalized charcoal/dark-slate theme.

The experimental large-scale Supabase/PostgreSQL/multi-user work is intentionally not part of the stable application.

This TXT file is a handoff document for future AI assistants and developers.
