# Gatherly User Guide

## About Gatherly
Gatherly helps fellowships and churches manage members, units, leaders, finances, budgets, approvals, attendance, events, notifications, reports, and public profiles from one role-based dashboard.

This guide is based on the current React frontend routes, navigation, services, and successful production build verification. Where a flow needs live backend records, invited-user emails, or role accounts that were not available during documentation, the guide marks it as not currently verified instead of inventing steps.

## Screenshot Reference
Use these screenshot names while capturing the final visual set:

1. `01-login.png` - Login page
2. `02-signup.png` - Registration page before submission
3. `03-dashboard-super-admin.png` - First Super Admin dashboard
4. `04-fellowship-profile.png` - Fellowship profile page
5. `05-units-list.png` - Units page
6. `06-unit-create-modal.png` - Create unit modal
7. `07-members-directory.png` - Members directory
8. `08-add-member-modal.png` - Add Member modal
9. `09-member-role-dropdown.png` - Add Member role dropdown
10. `10-member-invite-result.png` - Invite link result
11. `11-csv-import.png` - CSV member import
12. `12-accept-invite.png` - Invitation setup page
13. `13-finance-overview.png` - Finance overview
14. `14-finance-income-modal.png` - Add Income modal
15. `15-finance-expense-modal.png` - Add Expense modal
16. `16-budget-create.png` - Budget request wizard
17. `17-approvals-queue.png` - Approval queue
18. `18-attendance.png` - Attendance page
19. `19-events.png` - Events page
20. `20-notifications.png` - Notification panel
21. `21-profile.png` - Personal profile
22. `22-reports.png` - Reports page
23. `23-mobile-dashboard.png` - Mobile dashboard at 360px
24. `24-mobile-add-member.png` - Mobile Add Member modal at 360px

## Getting Started

### 1. Open Gatherly
Role: Anyone

1. Open the application.
2. Choose **Login** if you already have an account.
3. Choose **Create Account** or **Register** if your fellowship or church is new to Gatherly.

Screenshot: ![Login page](./user-guide/screenshots/01-login.png)

Expected result: Existing users sign in; new fellowships begin by creating an organization account.

Common errors: Wrong email/password, unstable internet, or expired session.

### 2. Registering Your Fellowship
Role: New organization owner

1. Open the registration page.
2. Enter the fellowship/church name.
3. Enter email.
4. Enter password.
5. Confirm password.
6. Submit the form.

Screenshot before submission: ![Registration page](./user-guide/screenshots/02-signup.png)
Screenshot after submission: ![Super Admin dashboard](./user-guide/screenshots/03-dashboard-super-admin.png)

Expected result: The person registering becomes the Super Admin. The email becomes the primary login. The app redirects directly to the dashboard after successful registration. No forced onboarding gate is shown in the current route setup.

Common errors: Email already exists, password mismatch, weak password, or backend validation message.

## Understanding the Dashboard
Role: All signed-in users

1. After login or registration, open `/dashboard`.
2. Use the left sidebar on desktop.
3. Use the bottom navigation on mobile.
4. Use the top header for notifications and profile access.
5. The visible modules depend on your role.

Screenshot: ![Dashboard](./user-guide/screenshots/03-dashboard-super-admin.png)

Expected result: Users see a dashboard suited to their role. The dashboard route is open to all authenticated roles.

## Setting Up Your Fellowship
Role: Super Admin, Fellowship Admin, Pastor where available

1. Open **Settings**.
2. Open **Fellowship Profile** or visit `/dashboard/settings/fellowship-profile`.
3. Review or update organization details: name, ministry type, denomination, location, contact email, contact phone, website, logo, colors, and public profile settings where available.
4. Save changes.
5. Open the public profile using `/public/:slug` when a public slug exists.

Screenshots:
![Fellowship profile](./user-guide/screenshots/04-fellowship-profile.png)
![Public fellowship profile](./user-guide/screenshots/04-public-fellowship-profile.png)

Expected result: Internal fellowship details remain inside the dashboard. Public profile pages should only show intentionally published information.

Common errors: Missing slug, missing public profile data, or save failure.

## Creating Departments and Units
Role: Super Admin, Fellowship Admin, Pastor

1. Open **Units** from the sidebar.
2. Click **Create** or **Add Unit**.
3. Enter a unit name, such as Choir, Media, Ushering, Welfare, or Prayer Unit.
4. Add a description.
5. Assign a leader if the selector is available and a member exists.
6. Save.
7. Use edit/delete actions where shown.

Screenshots:
![Units list](./user-guide/screenshots/05-units-list.png)
![Create unit](./user-guide/screenshots/06-unit-create-modal.png)

Expected result: The new unit appears in the unit list. No raw department identifiers should be shown to normal users.

## Adding Members
Role: Super Admin, Fellowship Admin

### Add a Member Manually

1. Open **Members**.
2. Click **Add Member**.
3. Fill first name, last name, email, phone, and status.
4. Leave **Grant Login Access** off to store a directory-only member.
5. Turn **Grant Login Access** on to create account access.
6. Select the role: Pastor, President, General Secretary, Financial Secretary, Fellowship Admin, Unit Head, Department Leader, or Member.
7. Select a unit when Unit Head or Department Leader is chosen.
8. Submit.

Screenshots:
![Members directory](./user-guide/screenshots/07-members-directory.png)
![Add Member modal](./user-guide/screenshots/08-add-member-modal.png)
![Role dropdown](./user-guide/screenshots/09-member-role-dropdown.png)
![Invite result](./user-guide/screenshots/10-member-invite-result.png)

Expected result: Directory-only members are added without login access. Members with login access receive an invitation or a copy-link fallback.

Common errors: Missing role while granting login access, duplicate email, missing department for unit leadership.

### Import Members from CSV
Role: Super Admin, Fellowship Admin

1. Open **Members**.
2. Click **Import**.
3. Download the template.
4. Prepare columns: `first_name`, `last_name`, `email`, `phone`, `status`, `grant_login_access`, `role`, `department`.
5. Choose the CSV file.
6. Review validation results.
7. Import valid rows.
8. Export invitation links if links are returned.

Screenshot: ![CSV import](./user-guide/screenshots/11-csv-import.png)

Expected result: Valid rows are imported. Invalid rows are reported individually.

### Managing Member Profiles
Role: Super Admin, Fellowship Admin

1. Open **Members**.
2. Select a member.
3. View contact details, role, department, and invitation status.
4. Use edit, activate/deactivate, set login access, change role, resend invite, or delete where available.

Expected result: Deactivate keeps the member record but removes active status. Delete removes the member record where supported.

## Inviting Leaders and Members
Role: Super Admin, Fellowship Admin

1. Add a member with login access.
2. Select a role.
3. Submit the form.
4. If email is sent, tell the user to check their inbox.
5. If email is not sent and a link is shown, copy the invite link and send it safely.
6. Use **Resend Invite** for pending or expired invitations where available.

Expected result: The invited user receives a setup link or the admin sees a copy-link fallback.

## Invitation Account Setup
Role: Invited user

1. Open the invite link.
2. The app supports `/accept-invite?token=...`, `/accept-invite/...`, `/accept-invitation?token=...`, and `/accept-invitation/...`.
3. Review name, email, role, and fellowship.
4. Enter password.
5. Confirm password.
6. Submit.

Screenshot: ![Accept invite](./user-guide/screenshots/12-accept-invite.png)

Expected result: The invited user is signed in and taken to the dashboard. Expired or already accepted links show friendly messages.

## Understanding Roles

### Super Admin
Purpose: Full fellowship administration.
Allowed modules: Dashboard, Members, Units, Attendance, Events, Finance, Budgets, Approvals, Reports, Settings, Profile, Insights.
Cannot perform: Nothing intentionally blocked in the current frontend for core fellowship administration.

### Fellowship Admin
Purpose: Help manage fellowship operations.
Allowed modules: Dashboard, Members, Units, Attendance, Events, Budgets, Approvals, Reports, Settings, Profile, Insights.
Cannot perform: Finance route is not listed for this role in the current protected route.

### Pastor
Purpose: Oversight and leadership.
Allowed modules: Dashboard, Members, Units, Attendance, Events, Finance, Budgets, Approvals, Reports, Settings, Profile, Insights.
Cannot perform: Role behavior may depend on backend permissions.

### President
Purpose: Final approval leader.
Allowed modules: Dashboard, Attendance, Events, Budgets, Approvals, Settings, Profile.
Cannot perform: Members, Units, Finance, Reports, and Insights are hidden or blocked by the current frontend route matrix.

### General Secretary
Purpose: Budget review and administration support.
Allowed modules: Dashboard, Attendance, Events, Budgets, Approvals, Settings, Profile.
Cannot perform: Members, Units, Finance, Reports, and Insights are hidden or blocked by the current frontend route matrix.

### Financial Secretary / Finance Officer
Purpose: Record fellowship income and expenses.
Allowed modules: Dashboard, Attendance, Events, Finance, Budgets, Settings, Profile.
Cannot perform: Members, Units, Approvals, Reports, and Insights are hidden or blocked by the current frontend route matrix.

### Unit Head / Department Leader
Purpose: Unit-level activity and budget requests.
Allowed modules: Dashboard, Attendance, Events, Budgets, Settings, Profile.
Cannot perform: Members, Units, Finance, Approvals, Reports, and Insights are hidden or blocked by the current frontend route matrix.

### Member
Purpose: Basic personal access.
Allowed modules: Dashboard, Attendance, Events, Budgets, Settings, Profile.
Cannot perform: Members, Units, Finance, Approvals, Reports, and Insights are hidden or blocked by the current frontend route matrix.

## Managing Finances
Role: Super Admin, Pastor, Financial Secretary

### Finance Overview

1. Open **Finances**.
2. Review Balance, Money In, and Money Out.
3. Review finance accounts and transaction log.

Screenshot: ![Finance overview](./user-guide/screenshots/13-finance-overview.png)

Expected result: Users see readable account and category names, not long system codes.

### Create a Ledger Account

1. Open **Finances**.
2. In Ledger Accounts, choose **Create Account**.
3. Enter account name.
4. Choose account type.
5. Choose parent account if needed.
6. Select department if applicable.
7. Enter opening balance.
8. Save.

Expected result: The account appears in the ledger tree. These are internal Gatherly ledger accounts, not bank accounts.

### Record Income

1. Click **Add Income**.
2. Select account.
3. Select an income category.
4. Enter amount, date, description, and reference number if available.
5. Submit.

Screenshot: ![Add Income](./user-guide/screenshots/14-finance-income-modal.png)

Expected result: Income is recorded and the summary refreshes.

### Record Expense

1. Click **Add Expense**.
2. Select account.
3. Select an expense category.
4. Enter amount, date, description, and reference number if available.
5. Turn on strict accountability mode if the expense should fail when funds are insufficient.
6. Submit.

Screenshot: ![Add Expense](./user-guide/screenshots/15-finance-expense-modal.png)

Expected result: Expense is recorded and the summary refreshes.

## Creating Budget Requests
Role: All authenticated users can open Budgets; workflow actions depend on role.

1. Open **Budgets**.
2. Click **New Allocation Request**.
3. Enter title, purpose, description, line items, unit, and ledger account.
4. Save draft.
5. Submit for review where available.

Screenshot: ![Budget request](./user-guide/screenshots/16-budget-create.png)

Expected result: Request appears in the budget list with a clear status.

## Reviewing and Approving Budgets
Roles: General Secretary, President, Super Admin, Fellowship Admin, Pastor

Workflow: Unit Head or requester creates request -> General Secretary reviews -> President approves -> Finance Officer records or processes related expense where supported.

1. Secretary opens **Approvals**.
2. Secretary opens submitted request.
3. Secretary adds review comment and forwards/reviews.
4. President opens **Approvals**.
5. President approves or declines.
6. Finance Officer watches notifications and records finance activity if required.

Screenshot: ![Approvals queue](./user-guide/screenshots/17-approvals-queue.png)

Expected timeline: Created, Submitted, Reviewed, Approved.

## Recording Attendance
Role: All authenticated users can open Attendance; creation/marking behavior may depend on backend role rules.

1. Open **Attendance**.
2. Create a session.
3. Select date and details.
4. Mark members present, absent, late, or excused where available.
5. Save.
6. Review summary and member history.

Screenshot: ![Attendance](./user-guide/screenshots/18-attendance.png)

## Creating Events
Role: All users can view; Super Admin, Pastor, and Fellowship Admin can create from the visible permission gate.

1. Open **Events**.
2. Click create where visible.
3. Enter title, type, date, time, location, and description.
4. Save.
5. Use RSVP/check-in on event detail where available.

Screenshot: ![Events](./user-guide/screenshots/19-events.png)

## Notifications and Announcements
Role: Signed-in users

1. Click the bell in the header.
2. Review unread count.
3. Open notification panel.
4. Use **Mark all as read**.
5. Follow links where notifications provide them.
6. View announcements feed where shown on dashboard pages.

Screenshot: ![Notifications](./user-guide/screenshots/20-notifications.png)

Expected result: Budget submissions, reviews, approvals, and other system events appear when the backend sends notifications.

## Profiles and Public Pages

### Personal Profile
Role: Signed-in users

1. Open **My Profile**.
2. Review email, phone, status, role, organization, and assigned roles.

Screenshot: ![Profile](./user-guide/screenshots/21-profile.png)

### Fellowship Public Profile
Role: Public visitor

1. Open `/public/:slug`.
2. View public fellowship details.

### Public Member Profile
Role: Public visitor

1. Open `/people/:id`.
2. View published name, bio, role, and department only.

Private finance data, passwords, access tokens, and internal system identifiers should not be published.

## Reports and Intelligence
Role: Reports are available to Super Admin, Pastor, Fellowship Admin. Insights are available to Super Admin, Pastor, Fellowship Admin.

1. Open **Reports** to view summary, finance, attendance, events, and department reports where backend data exists.
2. Open **Insights** for attendance summary, CSV analysis, finance summary, leadership report, and announcement writing where AI services are configured.

Screenshot: ![Reports](./user-guide/screenshots/22-reports.png)

If AI keys or backend support are unavailable, the page should show an error or empty state rather than fake results.

## Settings and Security
Role: All users can open Settings; management panels depend on role.

1. Open **Settings**.
2. Use roles panel where available.
3. Assign or remove roles only if your role allows it.
4. Open fellowship profile settings where available.

Expected result: Unauthorized users see view-only or hidden controls.

## Mobile Use

1. Open the app at 360px width.
2. Use bottom navigation.
3. Confirm forms and modals fit inside the screen.
4. Scroll inside long modals.

Screenshots:
![Mobile dashboard](./user-guide/screenshots/23-mobile-dashboard.png)
![Mobile Add Member](./user-guide/screenshots/24-mobile-add-member.png)

## Troubleshooting

- Cannot login: check email/password or reset through admin support if reset is unavailable.
- Invite expired: ask Super Admin or Fellowship Admin to resend the invitation.
- No finance categories: ask an admin to create or confirm default categories.
- No ledger account: create a finance account before recording transactions.
- Page is hidden: your role may not have access.
- Reports empty: there may be no records yet.
- AI unavailable: backend AI configuration may be missing.

## Role Access Reference

| Page | URL | Roles |
| --- | --- | --- |
| Login | `/login` | Public |
| Signup | `/signup` | Public |
| Accept Invite | `/accept-invite`, `/accept-invitation` | Public invite link |
| Dashboard | `/dashboard` | All signed-in users |
| Insights | `/dashboard/intelligence` | Super Admin, Pastor, Fellowship Admin |
| Members | `/dashboard/members` | Super Admin, Pastor, Fellowship Admin |
| Units | `/dashboard/units` | Super Admin, Pastor, Fellowship Admin |
| Attendance | `/dashboard/attendance` | All signed-in users |
| Events | `/dashboard/events` | All signed-in users |
| Finance | `/dashboard/finance` | Super Admin, Pastor, Financial Secretary |
| Budgets | `/dashboard/budgets` | All signed-in users |
| Approvals | `/dashboard/approvals` | Super Admin, Pastor, Fellowship Admin, President, General Secretary |
| Reports | `/dashboard/reports` | Super Admin, Pastor, Fellowship Admin |
| Settings | `/dashboard/settings` | All signed-in users |
| My Profile | `/profile`, `/dashboard/profile` | All signed-in users |
| Fellowship Profile | `/settings/fellowship-profile`, `/dashboard/settings/fellowship-profile` | All signed-in users; actions may vary |
| Public Fellowship | `/public/:slug` | Public |
| Public Member | `/people/:id` | Public |
