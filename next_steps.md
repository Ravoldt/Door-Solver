Yes—Google sign-in plus manually approved roles is a good fit, assuming Trim Choice uses Google Workspace. I’d keep the existing React designer, add Supabase for authentication/database/server functions, and avoid a full rewrite.

## Recommended access model

| User | Access |
|---|---|
| Public visitor | Configure doors, preview them, submit/share a design |
| Pending account | Signed in but awaiting approval |
| Staff | Open submissions, generate parts lists, create quotes |
| Admin | Staff access plus manage users, pricing, presets, and audit history |

Hiding staff buttons in React is not security. Authorization must be enforced by the database and server functions. Supabase supports [Google authentication](https://supabase.com/docs/guides/auth/social-login/auth-google), database-level [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), and authenticated [server functions](https://supabase.com/docs/guides/functions/auth), which covers this combination well.

For a small staff:

1. A person signs in with Google.
2. Their new profile defaults to `pending`.
3. You or another admin change them to `staff` or `admin`.
4. Every private request checks that stored role on the server.

An even tighter option is to pre-approve exact email addresses before their first login. If Trim Choice uses a Workspace domain, verify Google’s `hd` organization claim as an additional check. Google specifically warns that an email’s text/domain should not be treated as the account’s permanent identity; its `sub` claim is the stable identifier. [Google’s OpenID Connect guidance](https://developers.google.com/identity/openid-connect/openid-connect) explains both.

If the company actually operates on Microsoft 365, use Microsoft/Entra sign-in instead. Match the system employees already use.

## Split the product into three kinds of data

DoorSolver currently mixes visible design choices and manufacturing parameters inside `DEFAULT_SETTINGS` in [doorconfig.js](C:/Users/johnn/doorpartcalculator/door-calculator/src/doorconfig.js:3). Separate them before adding the database:

- Public design specification: size, quantity, style, species/material, profile, finish, and visible rail/stile proportions.
- Internal production specification: groove depth, tongue length, panel clearances, tooling allowances, production overrides, and calculated cut dimensions.
- Commercial information: costs, markup, discounts, tax, quote totals, expiration, and price-book version.

That separation matters because the current client directly runs [calculations.js](C:/Users/johnn/doorpartcalculator/door-calculator/src/calculations.js:24) from [App.jsx](C:/Users/johnn/doorpartcalculator/door-calculator/src/App.jsx:193). Anyone loading the site receives that code.

Keep the SVG preview and public geometry in the browser. Move authoritative parts-list and quote calculations into an authenticated server function. The server should validate the submitted design again and use its own production presets—never trust client-calculated parts or prices.

Also, the present PDF save embeds the complete job state in the PDF’s metadata. Once public and internal data diverge, public PDFs must contain only the safe design specification.

## Public sharing workflow

I’d build this flow:

`Configure → Submit/share → Staff inbox → Generate parts → Create quote → Print/send`

When an anonymous visitor selects “Share with Trim Choice”:

- The server saves an immutable, versioned design snapshot.
- It returns an unguessable share link and a friendly submission code.
- The public link shows only the sanitized design.
- Customer contact information is stored separately and is never placed in the URL.
- A logged-in staff member opening the same submission sees “Import as job,” “Generate parts list,” and “Create quote.”
- “Edit this design” creates a new revision rather than silently changing something staff may already be quoting.

Anyone possessing a public link can generally view it, so say that clearly in the UI. The link must never expose pricing, parts, customer contact details, or internal notes.

## Pricing and quote storage

Use database tables resembling:

- `profiles`: account, role, active/disabled state
- `design_submissions`: public design JSON, schema version, share-token hash
- `jobs`: imported submission, status, staff owner, production overrides
- `price_books`: draft/published price versions and effective dates
- `price_rules`: material, style, profile, finish, labor and machining rates
- `quotes` and `quote_items`: frozen calculated output
- `audit_events`: user approval and pricing/quote changes

The admin interface should publish a new price-book version instead of overwriting the old one. Every quote should retain:

- The price-book version used
- Its calculated line items and totals
- The calculation version
- Creator and creation date
- Revision/status history

That ensures a six-month-old quote doesn’t change when today’s material price is updated. Store monetary values as integer cents or an exact decimal type, never floating-point numbers.

Before designing the price tables, get Trim Choice’s actual worksheet/formula. Clarify material cost, waste, labor, machining, markup, discounts, minimum charges, tax, delivery, installation and rounding.

## Important repository issue

The current GitHub repository is public. Before adding customer information, OAuth configuration, pricing logic, or company-only code:

- Either move the entire project into a private company-controlled repository, while leaving the deployed designer publicly accessible; or
- Keep a public designer repository and create a separate private backend repository.

Repository visibility and website accessibility are independent. Existing parts calculations are already present in the public Git history, so treat them as previously exposed; the new authoritative production engine and all pricing should live only in the private backend. Never put a Supabase service key or OAuth secret in a `VITE_*` variable because frontend variables are public.

## How I would phase the work

1. Requirements and business agreement

   Get the hourly rate, billable activities, approval process, ownership of your existing DoorSolver work, ownership of employer-funded changes, hosting costs, maintenance expectations, and source-code account ownership in writing.

2. Calculation safety

   Add automated tests using real, shop-approved examples for every supported door type. These tests protect the working calculator while it is moved server-side.

3. Data-model separation

   Define a versioned public design schema and separate production presets. Incrementally introducing TypeScript or schema validation would be worthwhile here.

4. Backend and access

   Create Supabase development and production projects, Google login, `pending/staff/admin` roles, security rules, and a basic staff-only page.

5. Sharing and staff inbox

   Replace PDF-as-job-transfer with saved submissions, share links/codes and an internal job list. Keep PDF import temporarily for compatibility.

6. Private parts generation

   Move the manufacturing calculation to the server, build the staff production view, and generate the shop PDF there.

7. Quotes and pricing administration

   Add versioned price books, server-side quote calculation, admin editing, quote PDFs, and revision history.

8. Pilot and hardening

   Test with one estimator and one production worker using real jobs. Add backups, logging, access tests, rate limiting, and documented recovery procedures.

## Turn “exactly like TruStile” into requirements

The accessible [TruStile Project Configurator](https://truquote.trustile.com/DoorDesignTool2/DoorDesign) advertises saved projects, printable drawings, door-schedule and DXF exports, budget/pricing requests, and separate Main/Parts/Machining areas. Those are useful workflow clues, but “exactly the same” is much larger than a quote-and-parts MVP.

At the next meeting, have them walk through two real jobs in their TruStile account and identify:

- Must-have for the first usable release
- Useful later
- Not relevant to Trim Choice
- Existing Trim Choice rules TruStile does not support

They should operate their account; you don’t need their credentials.

Finally, start the time log today. Record date, start/end, duration, category, task, related issue/commit and a short result. Include meetings, requirements work, testing, deployment and documentation—not only coding. Ask whether today’s interview/demo and earlier prototype work are billable. Git history is useful evidence, but it isn’t a substitute for a contemporaneous time sheet.