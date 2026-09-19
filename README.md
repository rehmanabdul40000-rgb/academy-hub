# Academy Hub

Academy Hub is a Student & Fee Management System for academies, tuition centers, and educational institutes.

## Project status

**Current architecture: browser localStorage.**

The experimental Supabase/PostgreSQL scalable database and multi-user layer is intentionally NOT part of the active application. The stable local-storage version is the source of truth for the current project.

> Important: localStorage is browser/device specific. Data created on localhost will not automatically appear on the Vercel deployment, and Vercel data will not automatically appear on another computer.

## Project identity

- GitHub repository: `rehmanabdul40000-rgb/academy-hub`
- Main branch: `main`
- Local URL: `http://localhost:3000`
- Production target: Vercel
- Storage: browser localStorage
- Framework: React + TanStack Start + TanStack Router
- Styling: Tailwind CSS / shadcn-style components
- Icons: Lucide
- Excel: ExcelJS
- Do NOT modify the old `tuition-tide-pro` project.

## Main navigation

- Dashboard
- All Students
- Male Students
- Female Students
- Morning Shift
- Evening Shift
- Add Student
- Shift Management
- Users & Permissions
- Change Password
- Settings

The four segment sections are intentional and must be preserved:
1. Male Students
2. Female Students
3. Morning Shift
4. Evening Shift

## Dashboard

- Dynamic greeting based on local time
- Admin Display Name in greeting/profile
- Current time
- Total student statistics
- Fee collection summary
- Paid / Partial / Pending information
- Outstanding fee information
- Recent students
- Gender summary
- Quick payment collection
- Saved At information

Greeting schedule:
- 5:00 AM–11:59 AM: Good morning
- 12:00 PM–4:59 PM: Good afternoon
- 5:00 PM–8:59 PM: Good evening
- 9:00 PM–4:59 AM: Good night

## Student management

All Students supports:
- Search
- Filtering
- Gender filter
- View
- Edit
- Delete
- Recently Deleted
- Restore
- Collect Payment
- Fee/status information
- Saved At

Student fields:
- Student ID — manual
- Full Name — required
- Gender — required; Male or Female
- Phone — optional
- Course/Class — optional
- Date Joined — optional
- Shift — optional
- Class Time — auto-filled from shift but editable
- Total Fees
- Amount Paid at Enrollment — optional/blank allowed
- Remaining Fees — calculated
- Payment Status — automatic
- Notes
- Saved At

Blank optional fields must remain valid.

## Gender and shift sections

Male Students and Female Students provide the same important student actions as All Students.

Morning Shift and Evening Shift provide shift-based student lists.

Each segment supports the relevant:
- View
- Edit
- Delete
- Collect Payment
- Search/filter
- Excel export

## Shift Management

- Create/manage shifts
- Morning Shift
- Evening Shift
- From/to timing
- Assign students to shifts
- Automatic Class Time based on selected shift
- Class Time remains manually editable
- Blank shift is allowed

The student form's Shift dropdown is intentionally limited to:
- Morning Shift
- Evening Shift

Do not replace these with timing text in the dropdown.

## Fee management

- Total Fees
- Amount Paid
- Remaining Fees
- Automatic Paid / Partial / Pending status
- Collect Payment
- Payment validation
- Payment history
- Receipt / print
- Outstanding students
- Fee reports
- Duplicate-submit protection
- Enrollment payment history when applicable

## Excel

Excel export includes:
- Students
- Fee Summary
- Fee Analytics
- Payment History
- Male Students
- Female Students

Export contains:
- Academy name
- Academic session
- Admin display name
- Currency label
- Generated date/time
- Total enrolled students
- Student ID
- Gender immediately after Student ID
- Student details
- Fee information
- Payment/status information

Formatting requirements:
- Professional workbook formatting
- Centered/middle-aligned content
- Course names kept readable on one line where possible
- Section-specific exports
- Disabled sections are excluded from relevant exports

Settings also provides Excel/CSV student import.

Supported import formats:
- .xlsx
- .csv

## Settings

Settings include:
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

Settings persist in browser localStorage.

Admin password:
- Hidden by default
- Eye icon for show/hide
- Can be changed from Change Password

Admin Display Name is used by the greeting, profile, receipts, and Excel output.

## Theme

The application has:
- Dark theme
- Light theme

The current Light theme was intentionally changed to a dark charcoal/dark-slate palette for readability.

There are also quick Light/Dark controls in the top header.

Theme requirements:
- Keep all text readable
- Keep cards and inputs readable
- Keep borders visible
- Keep navigation understandable
- Avoid low-contrast text
- Do not remove the finalized charcoal/dark-slate look without the user's request

## Workspace section controls

Settings can enable/disable workspace sections.

This controls visibility/availability of sections such as:
- Dashboard
- All Students
- Male Students
- Female Students
- Morning Shift
- Evening Shift
- Add Student
- Shift Management
- Users & Permissions
- Change Password
- Settings

Do not remove these controls.

## Users & Permissions

The application includes a Users & Permissions area.

Permission categories:
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

The current permission system is application/UI level for the local-storage architecture. It is not a server-backed multi-user authorization system.

## Change Password

The Change Password section is available for changing the admin password used by the local application.

## Backup and restore

The application provides:
- Workspace backup
- Workspace restore
- Recently Deleted
- Restore deleted records
- Excel backup/export

Because data is localStorage based, regular backups are strongly recommended.


## Academy Hub Agent / Voice Output

The project now includes a browser-based agent voice output layer.

- Agent messages can be spoken aloud using the browser Speech Synthesis API.
- Voice is enabled by default.
- The top workspace header has a speaker button to turn agent voice on/off.
- Voice preference is saved in localStorage.
- Successful student actions currently announce confirmation aloud, including:
  - Student added
  - Student updated
  - Payment recorded
  - Student deleted
- The voice layer is intentionally local/browser based and does not require an external AI API key.
- Future agent commands can reuse speakAgentMessage() for spoken confirmations.


### Agent commands currently supported

The floating **Academy Hub Agent** can currently:
- Open Dashboard, All Students, Add Student, Settings, Male Students, Female Students, Morning Shift, and Evening Shift.
- Report total, paid, partial, pending/unpaid, male, and female student counts.
- Speak its confirmation/reply aloud through the browser Speech Synthesis API when Agent Voice is enabled.

The Agent button and Agent Voice toggle are part of the stable local/browser release. No external AI API key is required for this phase.

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

Some Vite/TanStack informational warnings may appear. A warning about route exports or tsconfig paths is not automatically an application failure.

## Vercel deployment

### Recommended GitHub method

1. Make sure the latest code is on GitHub `main`.
2. Open Vercel.
3. Select **Add New → Project**.
4. Import the GitHub repository `rehmanabdul40000-rgb/academy-hub`.
5. Keep the repository root as the project root.
6. Let Vercel detect the React/TanStack/Vite project.
7. Deploy.

If Vercel asks for an environment variable for the initial admin password, use:

```text
VITE_DEFAULT_ADMIN_PASSWORD=your-initial-password
```

The existing intended initial credentials are:
- Username: `admin`
- Initial password: `123`

Change the password after first login.

If Vercel is already connected to GitHub, future deployments can be:

```bash
git add .
git commit -m "update Academy Hub"
git push origin main
```

## Important localStorage warning

Vercel hosting does NOT make localStorage shared.

Current architecture:

```text
Localhost browser
      |
      +-- localStorage data

Vercel browser
      |
      +-- separate localStorage data
```

So this release is intended for a single browser/device workflow. Shared localhost/Vercel data synchronization is not enabled.

## Safe Git workflow

Before changing code:

```bash
git status
git pull origin main
```

Run locally:

```bash
npm run dev
```

After testing:

```bash
git status
git add .
git commit -m "describe the change"
git push origin main
```

Avoid destructive Git operations unless explicitly requested.

## Testing checklist

Test all of the following before production:
- Login
- Dashboard
- Dynamic greeting
- Add Student
- Required Student ID
- Required Full Name
- Required Gender
- Optional Phone
- Optional Course/Class
- Optional Date Joined
- Blank Shift
- Morning Shift
- Evening Shift
- Automatic Class Time
- Editable Class Time
- Total Fees
- Blank Amount Paid
- Remaining Fees
- Payment Status
- Collect Payment
- Payment History
- Receipt/Print
- Search
- Gender filter
- Male Students
- Female Students
- Morning Shift
- Evening Shift
- View Student
- Edit Student
- Delete Student
- Recently Deleted
- Restore
- Excel export
- Excel/CSV import
- Settings save/persistence
- Admin Display Name
- Admin Username
- Password show/hide
- Change Password
- Users & Permissions
- Workspace section toggles
- Dark theme
- Charcoal/dark-slate Light theme
- Quick theme buttons
- Workspace backup
- Workspace restore

## Rules for future AI assistants

1. Work ONLY in `rehmanabdul40000-rgb/academy-hub`.
2. Never modify `tuition-tide-pro`.
3. Treat browser localStorage as the current data architecture.
4. Do NOT reintroduce Supabase/PostgreSQL/scalable-data code unless the user explicitly requests a new database phase.
5. Do NOT add server-backed multi-user assumptions to this release.
6. Preserve Male Students, Female Students, Morning Shift, and Evening Shift.
7. Keep optional student fields optional.
8. Keep blank Shift allowed.
9. Keep Shift choices limited to Morning Shift and Evening Shift.
10. Keep Class Time automatically assigned but manually editable.
11. Preserve fee calculations and payment history.
12. Preserve Excel export/import.
13. Preserve backup/restore and Recently Deleted.
14. Preserve Users & Permissions.
15. Preserve Dark and charcoal/dark-slate Light themes.
16. Keep text and controls readable.
17. Preserve Admin Display Name usage across greeting/profile/receipts/Excel.
18. Keep passwords hidden by default.
19. Never place secrets in source code, README, screenshots, or chat.
20. Test locally before production deployment.
21. Prefer small, isolated commits.
22. Do not perform destructive Git operations unless explicitly instructed.

## Future database plan

A shared cloud database can be added later as a separate project phase.

If that happens, the future design should explicitly support:
- Shared data between localhost and Vercel
- Server-side pagination
- Indexed search
- Bulk import
- Authentication
- Database-backed roles and permissions
- Multi-tenant workspace isolation
- Proper server-side authorization
- Backups
- Capacity planning based on actual database limits

That future phase should NOT be mixed into this stable localStorage release.

## Final project description

Academy Hub is a polished local/browser Student & Fee Management System with student directory, gender and shift sections, fee collection, payment history, receipts, Excel export/import, dashboard analytics, settings, backup/restore, Recently Deleted, Users & Permissions, Change Password, workspace section controls, and Dark/charcoal themes.

The stable release intentionally prioritizes reliability and simple local operation over shared cloud storage.
