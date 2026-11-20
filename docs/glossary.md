# Glossary

| Term                            | Definition                                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Organization**                | A tenant. Every tenant-owned row carries `organization_id`; users never see another organization's data. Seeded examples: Riverside Hospitality, Northline Fitness. |
| **Membership**                  | A user's role within one organization (planned, AO-007). Today each user belongs to one organization via `users.organization_id`.                                   |
| **Facility / site**             | A physical location such as a hotel or club, with code, name, address, time zone and active flag (FR-01). Implemented.                                              |
| **Area**                        | A building, floor or zone inside a facility; up to three nesting levels (AO-013).                                                                                   |
| **Asset**                       | A maintainable item (HVAC unit, pump, generator) with an organization-unique code, criticality and status (FR-02).                                                  |
| **Criticality**                 | How severe an asset failure is for operations; drives triage priority.                                                                                              |
| **Work order (WO)**             | A unit of maintenance work, corrective (from a request) or preventive (from a schedule). Has a unique code such as `WO-000123`.                                     |
| **Corrective maintenance**      | Work triggered by a reported fault.                                                                                                                                 |
| **Preventive maintenance (PM)** | Recurring work generated from a template and schedule (FR-06).                                                                                                      |
| **Template**                    | Reusable PM definition: checklist, expected minutes, default priority. Edits affect future work only.                                                               |
| **Schedule**                    | Recurrence (daily, weekly, monthly) binding a template to an asset, with local start and next-due dates.                                                            |
| **Occurrence**                  | One due date of a schedule; unique per `(schedule_id, occurrence_date)` so generation is idempotent.                                                                |
| **Triage**                      | Manager review of a new request: validate, prioritise, prepare for assignment (`OPEN → TRIAGED`).                                                                   |
| **Assignee**                    | The technician responsible for executing a work order.                                                                                                              |
| **First response**              | The first accepted technician action (`ASSIGNED → IN_PROGRESS`); stops the response SLA clock. Assignment alone does not.                                           |
| **Resolution**                  | Completion of the work (`COMPLETED`); stops the resolution SLA clock. Closure happens afterwards.                                                                   |
| **Closure**                     | Final verification (`COMPLETED → CLOSED`) by a manager or by requester acceptance, per organization policy. Closed orders are read-only.                            |
| **Follow-up order**             | A new work order linked to a closed one via `parent_order_id`; used instead of reopening.                                                                           |
| **Checklist item**              | A step on a work order; required items must be completed before `COMPLETED`.                                                                                        |
| **Labor entry**                 | Immutable record of minutes worked with a captured hourly-rate snapshot; corrections are new entries.                                                               |
| **SLA policy**                  | Response and resolution targets in minutes per priority, optionally per facility.                                                                                   |
| **SLA budget**                  | Time between `reported_at` and a due time. **At risk** = 80 % consumed; **breached** = past due.                                                                    |
| **Basis points (bp)**           | Integer hundredths of a percent; 10 000 bp = 100 %. Used for ratios to avoid floats.                                                                                |
| **Minor units**                 | Integer smallest currency unit (cents). All money is stored and computed in minor units.                                                                            |
| **Stock ledger**                | Append-only `stock_movements` log of `RECEIPT`, `ISSUE`, `RETURN`, `ADJUSTMENT`; balances are derived and updated in the same transaction.                          |
| **Issue**                       | Moving parts from stock to a work order; the moment stock is consumed (not at request time).                                                                        |
| **Reorder point**               | Stock level at or below which a part is flagged as low stock.                                                                                                       |
| **Approval threshold**          | Organization setting (`approval_threshold_minor`); repair estimates above it need manager approval (FR-08).                                                         |
| **Self-approval**               | Approving or verifying one's own request or work; forbidden.                                                                                                        |
| **Audit event**                 | Append-only record of who did what to which entity, written in the same transaction as the change.                                                                  |
| **Pending route**               | API endpoint in the contract that returns `501 NOT_IMPLEMENTED` with its backlog ticket until built.                                                                |
| **Tenant isolation**            | Guarantee that a user from organization A cannot read or change organization B's records; foreign ids return 404.                                                   |
