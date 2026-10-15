---
target: all ui surfaces
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-26T00-23-27Z
slug: door-calculator-src
---
### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Real-time calculations and toast feedback are clear; PDF generation lacks explicit progress state. |
| 2 | Match System / Real World | 4 | Excellent use of woodworking nomenclature (stiles, rails, lock rail, cope & stick, fractional inches). |
| 3 | User Control and Freedom | 3 | Door duplication and job editing work well; lacks undo/redo stack for batch dimension adjustments. |
| 4 | Consistency and Standards | 3 | Dark theme with teal accents is mostly cohesive, but DoorCard has stark white backgrounds and non-standard utility classes. |
| 5 | Error Prevention | 3 | Smart dimension parsing and fraction validation; deleting jobs/quotes lacks modal confirmation guardrails. |
| 6 | Recognition Rather Than Recall | 3 | Real-time SVG diagrams and mini door style illustrations provide immediate visual recognition. |
| 7 | Flexibility and Efficiency | 3 | Mobile Quick Add and one-click quote creation provide great accelerators; lacks keyboard shortcuts for power entry. |
| 8 | Aesthetic and Minimalist Design | 3 | Industrial-grade aesthetic fits the workshop domain; high contrast jarring between dark canvas and white door cards. |
| 9 | Error Recovery | 3 | Clear warning banners on door cards when dimensions exceed structural limits. |
| 10 | Help and Documentation | 2 | Minimal inline contextual guidance for complex rail/stile proportion rules and pricing formulas. |
| **Total** | | **30/40** | **Good** |

### Design Specificity Verdict

**LLM assessment**: Door Solver has strong domain-specific character tailored to woodworking, architectural millwork, and custom cabinetmaking. The parametric 2D SVG door rendering, cut-list grouping by material/part, and fractional inch dimension inputs feel distinctly authored for a cabinet shop. However, the interface suffers from a stylistic disconnect between the sleek dark application shell (`stone-950` / `stone-900`) and the pure white `DoorCard` tiles, along with arbitrary utility classes (`hover:border-teal-755`, `text-stone-550`) that break visual harmony.

**Deterministic scan**: 3 warnings detected by `detect.mjs`:
- `DoorCard.jsx:110`: Gray text on colored background (`text-stone-700 on bg-teal-50`).
- `DoorCard.jsx:119`: Gray text on colored background (`text-stone-550 on bg-red-50`).
- `Navbar.jsx:106`: Contrast warning (`text-stone-950 on bg-teal-400`).

### Overall Impression

Door Solver is a capable, practical, and responsive application with robust calculation logic and workflow integration across customer design, staff shop cut lists, and commercial quotes. Refining the visual hierarchy of the door cards, unifying the dark/light design tokens, and adding keyboard accelerators and visual SVG measurement callouts will elevate it from a functional shop tool to a state-of-the-art product.

### What's Working

1. **Parametric SVG Visualization**: Immediate 2D geometric feedback as users type door dimensions and choose styles.
2. **End-to-End Workflow Continuity**: Seamless transition from customer share tokens to staff jobs, cut lists, and itemized quotes.
3. **Domain Nomenclature & Precision**: Fractional inch inputs and authentic woodshop terms make the tool feel natural to craftsmen.

### Priority Issues

- **[P1] Visual Incoherence & Card Token Drift**: `DoorCard.jsx` uses harsh white card backgrounds with invalid/ad-hoc CSS classes (`text-stone-550`, `hover:border-teal-755`), creating harsh contrast against the dark workspace.
  - *Why it matters*: Distracts the eye, causes visual fatigue in workshop lighting, and undermines the premium feel.
  - *Fix*: Standardize card tokens to match the dark slate/stone design system (`bg-stone-900` with subtle borders and crisp accent badges).
  - *Suggested command*: `/impeccable polish door-calculator/src/components/DoorCard.jsx`

- **[P1] High Cognitive Load in Proportions & Rail Settings**: The Door Settings modal and global proportion controls present a dense wall of numeric fields without visual diagrams showing which input maps to which rail.
  - *Why it matters*: First-time customers and hurried contractors struggle to distinguish lock rail vs intermediate rail positions.
  - *Fix*: Add interactive visual dimension annotations and progressive disclosure directly on the SVG door preview.
  - *Suggested command*: `/impeccable clarify door-calculator/src/components/PublicDesigner.jsx`

- **[P1] Lack of Power User Keyboard Accelerators**: Adding 10+ doors to a job requires multiple clicks and modal toggles rather than rapid keyboard entry (Enter to submit row, Tab to next dimension).
  - *Why it matters*: Shop estimators entering cut lists from paper worksheets experience significant data-entry friction.
  - *Fix*: Implement keyboard navigation, quick bulk-add shortcuts, and batch proportion overrides.
  - *Suggested command*: `/impeccable optimize door-calculator/src/components/JobsWorkspace.jsx`

- **[P2] Destructive Action Safety Guardrails**: Deleting a door, job, or quote executes without an explicit confirmation modal or undo buffer.
  - *Why it matters*: Accidental clicks on workshop touchscreens can erase complex door schedules.
  - *Fix*: Add confirmation dialogs and an undo toast mechanism.
  - *Suggested command*: `/impeccable harden door-calculator/src`

### Persona Red Flags

- **Alex (Power Estimator / Shop Tech)**: Adding 20 cabinet doors requires clicking individual cards. No keyboard shortcut to quickly duplicate or batch-modify stile widths across the entire project. High friction for volume quoting.
- **Jordan (First-Time Homeowner / Contractor)**: Stares at "Lock Rail Height" and "Intermediate Rail Width" without knowing standard architectural heights (36" lock rail). Needs visual helper diagrams on the SVG.
- **Sam (Accessibility / Low Vision)**: Low contrast on `DoorCard` button labels and badge text (`text-stone-550` on `bg-red-50`).

### Minor Observations

- The share code lookup screen is stark when no code has been entered yet; could include a friendly empty state illustration.
- Quote status badges (`draft`, `sent`, `accepted`) could have distinct color cues.

### Questions to Consider

- Should the Public Designer offer a toggle between Dark Mode and Light Shop Sheet view?
- Can we allow interactive dragging or clicking on SVG rails to adjust dimensions directly?
