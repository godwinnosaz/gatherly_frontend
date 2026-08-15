# Gatherly User Guide Gaps

## P0 - Blocks Use
- Full visual guide screenshots were not all captured automatically in this pass because many requested screens require live role accounts, invite emails, and backend records. Use the screenshot checklist in the main guide during a controlled demo-data pass.

## P1 - Confusing or Breaks Important Workflow
- Fellowship Admin can manage approvals and reports but cannot access Finance in the current protected route matrix. Confirm whether this is intended.
- Budgets are visible to all signed-in roles. Confirm backend rules prevent members from creating or acting on requests beyond their intended permissions.
- Attendance is visible to all signed-in roles. Confirm whether every role should create and mark sessions or only view them.
- Onboarding routes still exist (`/onboarding`, `/setup`) but registration-first behavior should not force onboarding. Keep optional setup language clear.

## P2 - Usability Improvements
- CSV importer role names include older values in some validation logic. Align importer roles with current Gatherly roles: pastor, president, secretary, finance_officer, fellowship_admin, unit_head, department_leader, member.
- Settings role labels include some technical phrasing. Consider using plain labels consistently.
- Some pages depend on backend data for useful empty states. Verify empty states with a fresh fellowship.
- Finance categories and accounts must exist before recording transactions; the guide should show the empty state and setup order.

## P3 - Documentation / Polish
- Several source comments mention internal service names. These are not visible to users but can distract future documentation work.
- Add final screenshots at both desktop and 360px mobile for each major guide section.
- Add a short glossary for fellowship, unit, ledger account, request, review, approval, and notification.

## Features Excluded Because Unavailable or Not Fully Verifiable
- Email delivery confirmation beyond backend `email_sent` response.
- Full invite expiry/resend journey unless a pending/expired invite exists.
- End-to-end role workflow screenshots for every role unless test accounts are prepared.
- Public profile screenshots unless public slugs/member public IDs exist.
- Finance grouped charts until grouped report data is available.
