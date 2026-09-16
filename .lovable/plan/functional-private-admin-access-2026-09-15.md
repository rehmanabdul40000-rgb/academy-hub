# Functional Private Admin Access

## What will change

- Connect the existing username/password form to Lovable Cloud authentication for one private administrator.
- Create and persist the administrator account securely from encrypted credentials; credentials never appear in the interface or source code.
- Move the sign-in screen to `/login`, redirect successful sign-ins to `/dashboard`, and keep sessions across refreshes.
- Protect Dashboard, Students, Add Student, and Settings behind one shared access gate.
- Wire navigation and logout so signing out clears cached private state and returns to Login.
- Preserve the dark glass login design while refining loading, validation, error, focus, and transition states.

## Pages and flow

- `/` redirects to Dashboard when signed in, otherwise Login.
- `/login` shows the existing premium login screen and redirects active sessions to Dashboard.
- `/dashboard`, `/students`, `/add-student`, and `/settings` share the protected Academy Hub shell.
- Incorrect credentials show only “Invalid username or password.”

## Security and data

- Store only the chosen username in the administrator profile.
- Store the password only in encrypted project secrets and the managed authentication system.
- Validate protected access both through the authenticated session and the protected route layout.
- Disable public account registration; this remains a single-administrator system.

## Verification

- Test incorrect and correct credentials, protected redirects, all four navigation destinations, refresh persistence, logout, and direct Dashboard access after logout.
- Check desktop and mobile login presentation and browser errors.
