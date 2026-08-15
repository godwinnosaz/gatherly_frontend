# Gatherly Frontend Smoke Testing Guide

This guide provides a comprehensive checklist for performing manual and semi-automated smoke tests on the Gatherly React frontend. These tests ensure the structural integrity, visual performance, and API alignment of the 17 critical workflows.

---

## 🚫 Critical Guardrails (What Should NOT Happen)

Before testing individual flows, verify these core security and data isolation rules are never violated:

1. **Network Timeout / Latency Resilience:**
   - **Constraint:** Network latency or temporary timeouts must **NOT** log the user out.
   - **Behavior:** If a request fails due to a network drop (e.g. status 503, 504, or `ECONNREFUSED`), the app must display an error banner or toast notification, but **MUST NOT** wipe the `gatherly_token` from local storage or redirect to `/login`. Only an explicit `401 Unauthorized` or token expiry from the API must trigger session termination.
2. **Strict Multi-Tenant Onboarding Isolation:**
   - **Constraint:** Logging in as a new/different user on the same browser must **NOT** inherit onboarding completion.
   - **Behavior:** Onboarding completion is stored in `localStorage` scoped strictly to the user's `tenant_id` and `user_id` (via key `gatherly_onboarding_complete:${tenant_id}:${user_id}`). A fresh user or different tenant user must see the full onboarding wizard if they haven't onboarded, even on the same device.
3. **Data Integrity for New Organizations:**
   - **Constraint:** A newly registered organization must **NOT** display historical or fake attendance/finance data.
   - **Behavior:** Upon completing onboarding, dashboards, transactions lists, and member tables must start completely blank (or with a single primary admin). No "placeholder" metrics should be fetched.

---

## 📝 Critical Flow Checklists

### 1. Signup (Self-Registration)
* **Goal:** A new leader registers a brand-new organization on Gatherly.
* **Test Steps:**
  1. Navigate to `/signup`.
  2. Enter Organization Name, Admin Full Name, Email Address, and Password.
  3. Click **Create Organization**.
* **Expected UI Behavior:**
  - Standard loading state on the button (disabled + spinner/pulse).
  - Redirects to `/login` with a success toast notification, or redirects directly to `/onboarding` (if automatic login is supported).
* **API Endpoints:**
  - `POST /auth/register` (AuthService.register)
* **Failure Symptoms:**
  - "Email already registered" error not showing when using a duplicate email.
  - Organization name field validation not complaining on empty.

### 2. Onboarding Wizard
* **Goal:** A newly registered organization completes the initial church setup.
* **Test Steps:**
  1. Login as the newly created user and enter the `/onboarding` workspace.
  2. Step 1 (Church Profile): Fill in size, denomination, location. Click Next.
  3. Step 2 (Departments): Create 1-2 initial departments (e.g. Choir, Ushers). Click Next.
  4. Step 3 (Events): Create an initial service/event (e.g. Sunday Service). Click Next.
  5. Step 4 (Invite Leaders): Add 1 leader's email. Click Send Invites.
  6. Click **Complete Setup**.
* **Expected UI Behavior:**
  - Stepper indicators update dynamically at each step.
  - Complete Setup call triggers local state update (`onboarding_completed: true` mapped to `gatherly_onboarding_complete:${tenant_id}:${user_id}`) and redirects to `/dashboard`.
* **API Endpoints:**
  - `POST /onboarding/setup-org`
  - `POST /onboarding/admin-profile`
  - `POST /onboarding/departments`
  - `POST /onboarding/events`
  - `POST /onboarding/import-members`
  - `POST /onboarding/invite-leaders`
  - `POST /onboarding/complete`
* **Failure Symptoms:**
  - Navigating backward wipes entered fields from form state.
  - Page refresh causes wizard state to reset completely to Step 1.

### 3. Dashboard Initialization
* **Goal:** Admin logs in and views their main stats dashboard.
* **Test Steps:**
  1. Navigate to `/dashboard` as an authenticated user.
  2. Review the metric cards (Total Members, Active Attendance, Cash Balance, Active Events).
* **Expected UI Behavior:**
  - Sidebar sidebar is active and highlights "Home".
  - Premium HSL-styled metrics show real counts (e.g., Cash Balance showing standard currency formatting `₦` or `$`).
  - AnimatePresence makes the card entry fade and glide up gracefully.
* **API Endpoints:**
  - `GET /auth/me`
  - `GET /finance/summary`
  - `GET /attendance/summary`
  - `GET /reports/summary`
* **Failure Symptoms:**
  - Dashboards showing generic "Coming Soon" overlays on basic metrics.
  - Negative values or `NaN` showing up on metrics cards due to incomplete response parsing.

### 4. User Login
* **Goal:** An existing leader logs back into their workspace.
* **Test Steps:**
  1. Navigate to `/login`.
  2. Input valid credentials and click **Sign In**.
* **Expected UI Behavior:**
  - Login button displays active spinner state.
  - Stashes the JWT token in `localStorage` under `gatherly_token`.
  - Redirects instantly to `/dashboard` (or `/onboarding` if onboarding was never completed).
* **API Endpoints:**
  - `POST /auth/login` (AuthService.login)
* **Failure Symptoms:**
  - "Invalid credentials" error remains displayed after correcting fields and trying again.
  - Browser back-button takes the user back to the login page without signing them out.

### 5. Session / Auth Refresh
* **Goal:** Session is restored transparently on reload.
* **Test Steps:**
  1. Press `F5` or click Reload on the `/dashboard` page.
* **Expected UI Behavior:**
  - The premium `GatherlyLoadingScreen` briefly pulses.
  - App checks `localStorage.getItem('gatherly_token')`, calls `/auth/me`, and loads the dashboard without forcing the user to sign back in.
* **API Endpoints:**
  - `GET /auth/me` (AuthService.getMe)
* **Failure Symptoms:**
  - Refresh logs the user out even though a valid token exists in local storage.
  - Infinite spinning loader screen due to unhandled catch on token validation error.

### 6. Add Member
* **Goal:** Fellowship admin registers a new member.
* **Test Steps:**
  1. Go to **Members** (`/dashboard/members`).
  2. Click **Add Member**.
  3. Fill in First Name, Last Name, Email, Phone, Status (e.g. Active).
  4. Click **Save Member**.
* **Expected UI Behavior:**
  - Modal slides in cleanly.
  - The member list instantly appends the new member without requiring a manual page refresh.
* **API Endpoints:**
  - `POST /members/create` (MemberService.create)
* **Failure Symptoms:**
  - Status select dropdown defaults to blank and errors out.
  - Member table doesn't update dynamically (requiring hard refresh to see new member).

### 7. Add Member with Role / Leader Invitation
* **Goal:** Admin invites another leader with high privileges.
* **Test Steps:**
  1. Go to **Settings** -> **Team / Leaders** or **Onboarding** step 4.
  2. Enter Leader Email and select a role (e.g. `fellowship_admin`, `pastor`).
  3. Click **Send Invitation**.
* **Expected UI Behavior:**
  - Success message "Invitation email sent successfully."
  - Invitation is listed under "Pending Invites" in invitation logs.
* **API Endpoints:**
  - `POST /onboarding/invite-leaders` (InvitationService.send)
* **Failure Symptoms:**
  - Role dropdown does not list all system roles.
  - Empty email field allows submit, triggering API validation error crash.

### 8. Accept Invite & Leader Registration
* **Goal:** An invited leader completes their profile.
* **Test Steps:**
  1. Open a new browser window/tab and navigate to `/accept-invite?token=VALID_TOKEN`.
  2. Complete Admin Profile form (Name, Password, Confirm Password).
  3. Click **Activate Account**.
* **Expected UI Behavior:**
  - "Validating Invite Code..." loader briefly shows.
  - User details successfully verify. Activating redirects to login.
* **API Endpoints:**
  - `GET /auth/verify-invite/{token}`
  - `POST /auth/accept-invite`
* **Failure Symptoms:**
  - "Token expired" message displays for a freshly generated token.
  - Form allows submitting passwords that do not match the confirmation field.

### 9. Create Attendance Session
* **Goal:** Register an active tracking session for a service.
* **Test Steps:**
  1. Navigate to **Attendance** (`/dashboard/attendance`).
  2. Click **Create Session**.
  3. Select Date, and choose Event/Service from dropdown.
  4. Click **Initialize Session**.
* **Expected UI Behavior:**
  - New session is created and selected in the active session selector.
  - List of eligible members displays immediately.
* **API Endpoints:**
  - `POST /attendance/createSession` (AttendanceService.createSession)
* **Failure Symptoms:**
  - Dropdown lists no events.
  - Future dates cannot be disabled, causing chronological errors.

### 10. Mark Attendance
* **Goal:** Record members present at a session.
* **Test Steps:**
  1. Select a session from the dropdown.
  2. Toggle checkbox or checkmark next to 2-3 members' names.
  3. Click **Save Attendance**.
* **Expected UI Behavior:**
  - Toggle switch animates smoothly.
  - Active count card updates present count. Success toast displays.
* **API Endpoints:**
  - `POST /attendance/mark` (AttendanceService.mark)
* **Failure Symptoms:**
  - Toggle actions are laggy, triggering individual blocking API requests rather than batching.
  - Checking a member and refreshing the page shows them as unmarked.

### 11. Create Finance Account
* **Goal:** Set up a ledger account (e.g. Tithe Fund, Project Account).
* **Test Steps:**
  1. Navigate to **Finances** (`/dashboard/finance`).
  2. Go to **Accounts** tab and click **Create Account**.
  3. Enter Name, Account Type (Asset/Revenue/Expense), and Initial Balance.
  4. Click **Create Ledger**.
* **Expected UI Behavior:**
  - Modal resolves, new account shows in the ledger tree.
* **API Endpoints:**
  - `POST /finance/accounts/create` (FinanceAccountsService.create)
* **Failure Symptoms:**
  - Select Type lists no entries.
  - Initial balance input fails to parse floating point values (e.g., $1000.50).

### 12. Record Income Transaction
* **Goal:** Log church tithes, offerings, or gifts.
* **Test Steps:**
  1. Navigate to **Finances** (`/dashboard/finance`) -> **New Transaction**.
  2. Set transaction type to **Income**.
  3. Enter Amount, select Category (Tithe), select Account (Primary Asset), and enter description.
  4. Click **Save Transaction**.
* **Expected UI Behavior:**
  - Main Cash balance card increments instantly.
  - Income graph or transaction table appends a positive green item.
* **API Endpoints:**
  - `POST /finance/createTransaction` (FinanceService.recordTransaction)
* **Failure Symptoms:**
  - Category list is empty.
  - Record operation doesn't update the cash balance until manual page reload.

### 13. Record Expense Transaction
* **Goal:** Log operations spending (e.g. Utility Bills, Equipment purchase).
* **Test Steps:**
  1. Navigate to **Finances** (`/dashboard/finance`) -> **New Transaction**.
  2. Set transaction type to **Expense**.
  3. Enter Amount, Category (Operations), and Source Account.
  4. Click **Save Transaction**.
* **Expected UI Behavior:**
  - Cash balance card decrements instantly.
  - Transactions log appends a negative red item.
* **API Endpoints:**
  - `POST /finance/createTransaction` (FinanceService.recordTransaction)
* **Failure Symptoms:**
  - Overdrawing an account does not trigger standard modal warning.
  - Expense appears as income in reports due to absolute value mapping bugs.

### 14. Create Budget Request
* **Goal:** Department leader requests funds for a project.
* **Test Steps:**
  1. Navigate to **Budgets** (`/dashboard/budgets`).
  2. Click **Create Request**.
  3. Enter Title (e.g. Media Mic Setup), select Department, enter Amount, and add description.
  4. Click **Save Draft**.
* **Expected UI Behavior:**
  - Budget request appears in requests list with status badge showing "Draft".
* **API Endpoints:**
  - `POST /finance/budgetRequests/create` (BudgetRequestsService.create)
* **Failure Symptoms:**
  - Empty amount input submits as 0 instead of flagging validation error.
  - Cannot select the logged-in user's assigned department.

### 15. Submit / Review / Approve Budget Request
* **Goal:** Submit a budget request for review, and approve it as an authorized administrator.
* **Test Steps:**
  1. Under **Budgets**, select the draft request and click **Submit for Approval**.
  2. Sign out, and sign in as a user with Pastor/Super Admin role.
  3. Navigate to **Approvals** (`/dashboard/approvals`).
  4. Click on the pending request.
  5. Click **Approve**.
* **Expected UI Behavior:**
  - Status transitions: `Draft` -> `Pending Review` -> `Approved` on both user views.
  - Finance accounts update balances if auto-disbursement is active.
* **API Endpoints:**
  - `POST /finance/budgetRequests/submit/{id}`
  - `POST /finance/budgetRequests/review/{id}`
  - `POST /finance/budgetRequests/approve/{id}`
* **Failure Symptoms:**
  - Regular staff users see active "Approve" button actions.
  - State does not update in the UI after clicking approve, giving no visual feedback.

### 16. Notifications Center Loading
* **Goal:** View system alerts (e.g., newly submitted budget requests).
* **Test Steps:**
  1. Click on the notification bell icon in the top header.
  2. Review list of notifications.
  3. Click **Mark all as read**.
* **Expected UI Behavior:**
  - Drops down a list of modern notification card items.
  - Mark all as read clears the red badge count on the bell.
* **API Endpoints:**
  - `GET /notifications` (NotificationService.getAll)
  - `POST /notifications/readAll` (NotificationService.markAllRead)
* **Failure Symptoms:**
  - Dropdown overflows screen on mobile views.
  - Badge persists as a positive number even when no unread messages are in list.

### 17. User Logout
* **Goal:** Safely close a session and secure the device.
* **Test Steps:**
  1. Click **Sign Out** at the bottom of the sidebar.
* **Expected UI Behavior:**
  - Calls logout endpoint, wipes `gatherly_token` and `gatherly_onboarding_complete` from `localStorage`.
  - Redirects instantly to `/login`.
* **API Endpoints:**
  - `POST /auth/logout` (AuthService.logout)
* **Failure Symptoms:**
  - Browser Back button allows viewing dashboards after logging out.
  - LocalStorage token is not destroyed, allowing manual route-typing to bypass auth check.
