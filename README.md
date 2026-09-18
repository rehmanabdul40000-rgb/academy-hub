# Academy Hub

Academy Hub is a React + TanStack Start student and fee management system designed for small academies, tuition centers, and educational institutes.

The current production architecture is intentionally **local/browser storage based**. The later experimental scalable/Supabase database layer was removed so the project stays on the stable local-storage version.

## Important project identity

- Repository: `rehmanabdul40000-rgb/academy-hub`
- Main branch: `main`
- Local development URL: `http://localhost:3000`
- Deployment target: Vercel
- Data model: browser `localStorage`
- Do **not** treat this version as a shared multi-device database.
- The old repository `tuition-tide-pro` is unrelated and should not be modified.

## Tech stack

- React
- TypeScript
- TanStack Start
- TanStack Router
- Tailwind CSS
- shadcn-style UI components
- Lucide icons
- ExcelJS for Excel export/import
- Browser localStorage for application data

## Main features

### Dashboard

- Dynamic time-based greeting:
  - Good morning: 5:00 AM–11:59 AM
  - Good afternoon: 12:00 PM–4:59 PM
  - Good evening: 5:00 PM–8:59 PM
  - Good night: 9:00 PM–4:59 AM
- Admin display name in greeting/profile area
- Current time display
- Total student statistics
- Fee collection summary
- Paid / partial / unpaid information
- Outstanding fee information
- Recent students
- Gender summary
- Quick payment collection
- Student Saved At information

### Student management

- All Students directory
- Add Student
- View student profile/details
- Edit student
- Delete student
- Recently Deleted / Restore
- Search and filtering
- Gender filtering
- Date Joined
- Total Fees
- Amount Paid
- Remaining Fees
- Automatic payment status
- Notes
- Saved At timestamp

### Student fields

- Student ID (manual)
- Full Name
- Gender (required: Male/Female)
- Phone (optional)
- Course/Class (optional)
- Date Joined (optional)
- Shift (optional)
- Class Time
- Total Fees
- Amount Paid at Enrollment (optional)
- Remaining amount
- Payment Status
- Notes
- Saved At

Optional fields can remain blank.

### Separate student sections

The sidebar contains dedicated sections for:

- Male Students
- Female Students
- Morning Shift
- Evening Shift

These sections are intentionally retained.

### Shift management

- Morning Shift
- Evening Shift
- Shift management screen
- Shift name
- From/to timing
- Student shift assignment
- Automatic class-time assignment from selected shift
- Class time remains editable
- Blank shift is allowed

The student form's shift dropdown is intentionally limited to:

- Morning Shift
- Evening Shift

### Fee management

- Collect Payment
- Payment validation
- Remaining fee calculation
- Paid / Partial / Unpaid status
- Payment history
- Receipt/print workflow
- Outstanding students
- Fee reports
- Duplicate-submit protection

### Excel

The Excel workflow includes:

- Export to Excel
- Students sheet
- Fee Summary
- Fee Analytics
- Payment History
- Male Students sheet
- Female Students sheet
- Professional headers and formatting
- Academy name
- Academic session
- Admin display name
- Currency label
- Generated date/time
- Student totals
- Gender column immediately after Student ID
- Centered/middle-aligned spreadsheet content
- Course names kept readable without unnecessary wrapping
- Section-aware exports

The Settings page also contains Excel/CSV student import.

### Settings

Workspace settings include:

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

The admin password is hidden by default and has an eye icon for show/hide.

Settings persist through browser localStorage.

### Theme system

The application has a workspace theme selector.

Available themes:

- Dark
- Light

The current Light theme was deliberately changed to a dark charcoal/slate visual palette rather than a white/cream theme.

There are also quick theme controls in the top header.

Theme requirements:

- Keep text readable
- Keep cards/inputs readable
- Keep borders visible
- Keep active navigation understandable
- Do not introduce low-contrast white/gray-on-white combinations

### Users & Permissions

The application includes a Users & Permissions area.

Permission categories include:

- Students View
- Students Create
- Students Edit
- Students Delete
- Payments
- Reports
- Shift Management
- User Management
- Settings

The Admin account has full access.

Permissions affect navigation and protected routes/actions in the application.

### Change Password

The application includes a Change Password section connected to the workspace/admin settings flow.

## Data storage

### Current stable architecture

The current stable version stores application data in the browser:

```text
Browser
   |
   +-- Academy Hub localStorage
          |
          +-- students
          +-- payments
          +-- settings
          +-- deleted/restore data
          +-- users/permissions
          +-- workspace preferences
```

This means:

- Data is available in the same browser/profile where it was created.
- Clearing browser storage can remove local application data.
- Another computer/browser does not automatically see the same records.
- Vercel hosting does not turn localStorage into a shared database.
- Do not promise multi-computer synchronization in this version.

A future database project can be added later, but it should be treated as a separate planned architecture rather than mixed into this stable version.

## Local development

Requirements:

- Node.js
- npm
- Git

Install dependencies:

```bash
npm install
```

Start development:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The Vite/TanStack development server may show informational warnings about route exports or tsconfig path handling. Those warnings are not automatically application errors.

## Git workflow

Recommended safe workflow:

```bash
git pull origin main
npm install
npm run dev
```

After local testing:

```bash
git status
git add .
git commit -m "describe the change"
git push origin main
```

## Vercel deployment

Academy Hub is suitable for Vercel deployment as a React/Vite/TanStack application. Vercel supports Vite/React deployments and can automatically detect the framework during project import.

### Recommended method: GitHub integration

1. Push the latest code to the `main` branch.
2. Open Vercel.
3. Select **Add New → Project**.
4. Import the GitHub repository:
   `rehmanabdul40000-rgb/academy-hub`
5. Let Vercel detect the framework.
6. Keep the repository root as the project root.
7. Use the repository's normal build settings unless Vercel asks for an override.
8. Click **Deploy**.

Vercel's Git integration can automatically deploy pushes to the connected production branch and can create preview deployments for branches/PRs.

### For this repository

If the Vercel project is already connected to this GitHub repository, normally the deployment workflow is simply:

```bash
git add .
git commit -m "update Academy Hub"
git push origin main
```

Then open the Vercel project and wait for the deployment to finish.

### Important localStorage warning for Vercel

Because this stable version uses browser localStorage:

- The live Vercel site can be deployed successfully.
- Each browser/device has its own local data.
- Localhost data does not automatically appear on the Vercel site.
- Vercel data does not automatically appear on localhost.
- This is expected for the current architecture.

## Before deploying

Recommended test checklist:

- Login works
- Dashboard opens
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
- Settings save and survive refresh
- Admin display name updates greeting/profile/receipts/export
- Password show/hide works
- Change Password works
- Users & Permissions works
- Dark theme works
- Light theme works
- Quick theme buttons work
- Disabled workspace sections behave correctly
- No accidental changes were made to the old `tuition-tide-pro` project

## Future development notes for another AI/coding assistant

When continuing this project:

1. Work only in `rehmanabdul40000-rgb/academy-hub`.
2. Preserve the four segment sections:
   - Male Students
   - Female Students
   - Morning Shift
   - Evening Shift
3. Preserve the existing localStorage architecture unless the user explicitly asks for a database migration.
4. Do not reintroduce Supabase/scalable-database code just because the repository contains historical references or older commits.
5. Do not remove existing student/payment/export/settings functionality while changing the theme.
6. Keep optional student fields optional.
7. Keep Shift selection limited to Morning Shift and Evening Shift.
8. Keep blank Shift allowed.
9. Class Time should auto-populate from the selected shift but remain editable.
10. Keep admin display name synchronized with greeting, profile, receipts, and Excel output.
11. Keep passwords hidden by default.
12. Do not expose secrets in source code, README files, screenshots, or chat.
13. Test locally before production deployment.
14. Avoid destructive Git history changes unless the user explicitly asks for a rollback.
15. Prefer small, isolated commits with clear messages.

## Project status

The repository currently represents the **stable local-storage Academy Hub version with the finalized charcoal/dark-slate theme work retained**.

The experimental large-scale Supabase/PostgreSQL/multi-user migration has intentionally been removed from the active branch.

This README is the handoff document for future AI assistants and developers.
