# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Public Visitors / Contractors / Customers**: Cabinetmakers, contractors, and homeowners configuring custom doors with fractional dimensions, visual style selections, and submitting quote requests or sharing design snapshots.
- **Shop Staff / Technicians**: Manufacturing specialists at Trim Choice who review incoming customer submissions, import them as active shop jobs, verify cutting parameters, generate precise cut lists, and produce itemized quotes.
- **Shop Administrators**: Managers maintaining price books, material markups, labor/machining rates, production presets, and user permissions.

## Product Purpose

Door Solver (Trim Choice Door Part Calculator) provides precision woodworking calculation, visual real-time door geometry previewing, and an end-to-end workflow from customer design submission to shop cut lists and quotes. Success means zero calculation errors in the woodshop, seamless handover from customer spec to shop cut dimensions, and fast, accurate job estimating.

## Positioning

Unlike generic cabinet quoting tools or static spreadsheets, Door Solver bridges customer-facing visual door design with deep woodworking shop-floor manufacturing logic—separating public design specifications from internal production parameters (groove depth, tongue length, panel clearance, tooling allowances, price books).

## Operating Context

- **Shop Floor & Office**: Dusty, high-utility woodworking shop environment mixed with clean desktop estimating and customer mobile/tablet interactions.
- **Dimensional System**: Precise fractional inches (1/16", 1/32" tolerances) and standard woodworking nomenclature (stiles, rails, center panels, profile cutters, cope & stick, miter joints, slab, glass inserts).
- **Output Formats**: Real-time interactive SVG previews, printable production cut lists (grouped by material and part), customer-facing spec PDFs, and itemized pricing quotes.

## Capabilities and Constraints

- **Dynamic Visual Door Generator**: Parametric 2D SVG rendering for standard Shaker, Raised Panel, Flat Panel, Slab, Glass, and Multi-panel configurations with customizable rail/stile widths.
- **Manufacturing Engine**: Automated calculations for cut stiles, rails, and center panels accounting for groove depths, tongue clearances, and panel expansion.
- **Multi-Role Security & Workflow**: Supabase authentication with Google/role-based access (`public`, `pending`, `staff`, `admin`), separating customer design tokens from shop-only cut lists and pricing formulas.
- **Tech Stack**: React 19, Tailwind CSS 4, Vite, Supabase (`@supabase/supabase-js`), Vitest, `pdf-lib`, `html2canvas-pro`, `lucide-react`.

## Brand Commitments

- **Name**: Door Solver / Trim Choice Door Part Calculator.
- **Voice**: Clean, professional, industrial-grade, practical, and highly legible for craftsmen and contractors.

## Evidence on Hand

- Core calculation engine and validation rules in [`door-calculator/src/calculations.js`](file:///c:/Users/johnn/doorpartcalculator/door-calculator/src/calculations.js) and [`door-calculator/src/validation.js`](file:///c:/Users/johnn/doorpartcalculator/door-calculator/src/validation.js).
- Test suites in [`door-calculator/src/__tests__/`](file:///c:/Users/johnn/doorpartcalculator/door-calculator/src/__tests__/).
- Architecture and security roadmap in [`next_steps.md`](file:///c:/Users/johnn/doorpartcalculator/next_steps.md).
- Reference spec sheets in [`referenceSheets/`](file:///c:/Users/johnn/doorpartcalculator/referenceSheets/).

## Product Principles

1. **Fractional Precision First**: Woodworking math must be rigorously exact with zero tolerance for floating-point rounding errors or ambiguous cut sizes.
2. **Clear Separation of Public & Production Truth**: Public users configure aesthetic dimensions; the internal engine independently applies manufacturing rules and proprietary pricing.
3. **High-Legibility High-Utility UI**: Clean, high-contrast layouts tailored for fast data entry, quick scanning on job sites, and clutter-free shop cut-sheet printing.
4. **Resilient Data Integrity**: Versioned quotes, immutable design snapshots, and audit trails ensure past quotes and production runs remain reproducible.

## Accessibility & Inclusion

- Keyboard-navigable fractional dimension inputs with quick fraction pickers.
- High-contrast visual representations suitable for workshop tablets and bright shop environments.
