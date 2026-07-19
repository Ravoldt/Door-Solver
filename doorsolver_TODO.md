# doorsolver.app TODO

A summarized task list based on the UI/UX review and follow-up planning.

---

### SVG architecture
- [ ] Create a shared geometry builder, for example `buildDoorLayout()`.
- [ ] Create a shared SVG renderer, for example `renderDoorSvgString()`.
- [ ] Keep the system split into three layers:
  - [ ] Geometry: pure math, no React or DOM
  - [ ] Rendering: turns geometry into SVG markup
  - [ ] UI: React components, dropdowns, buttons, and previews
- [ ] Use the same renderer for:
  - [ ] In-app per-door previews
  - [ ] Downloadable SVGs
  - [ ] Pre-generated static style-card SVGs
- [ ] Move shared config like `DEFAULT_SETTINGS` out of `App.jsx` into a separate config file so Node scripts can reuse it.

### Static SVG generation script
- [ ] Add a Node script that generates static style preview SVG files.
- [ ] Output the generated files to something like `public/style-previews/`.
- [ ] Use sample door sizes for the static previews.
- [ ] Run the script whenever the preview style or geometry logic changes.

---

## 2. Dimension Validation and Error Handling

### Input-level validation
- [ ] Show a visible error when a dimension cannot be parsed.
- [ ] Do not silently revert invalid input without explanation.
- [ ] Add helper text showing accepted formats where relevant:
  - [ ] `36`
  - [ ] `36.5`
  - [ ] `36 1/2`
  - [ ] `36-1/2`
  - [ ] `36"`
- [ ] Consider keeping the invalid draft value visible until the user fixes it.
- [ ] Prevent print/save when the job has blocking errors.

### Quantity validation
- [ ] Clamp manually typed quantity values.
- [ ] Prevent `0`, negative numbers, decimals, and invalid strings.
- [ ] Add `min="1"` and `step="1"` to the quantity input.
- [ ] Clamp on blur to a positive integer.

### Door/layout validation
- [ ] Add validation rules for impossible geometry.
- [ ] Warn when door width is too small for the selected stile widths.
- [ ] Warn when door height is too small for the selected rail widths.
- [ ] Warn when panel height becomes zero or negative.
- [ ] Warn when rail length becomes zero or negative.
- [ ] Warn when `heightToMiddleRail` makes the middle rail too high or too low.
- [ ] Warn when settings produce suspicious or physically impossible results.
- [ ] Show warnings in the door preview dropdown.
- [ ] Show warnings on the printable cut list if the job is printed anyway.

---

## 3. Settings UI Redesign

### Settings location and naming
- [ ] Replace the generic `Settings` label with something more specific, such as:
  - [ ] Door Defaults
  - [ ] Build Settings
  - [ ] Construction Settings
  - [ ] Cut Settings
  - [ ] Default Part Sizes
- [ ] Move settings out of the main action row if it makes the primary workflow cleaner.
- [ ] Consider a right-side drawer/sheet for settings.
- [ ] Alternatively, keep an inline accordion/card but make the summary clearer.

### How settings apply
- [ ] Decide whether settings apply globally or per door.
- [ ] Make the behavior explicit in the UI.
- [ ] If settings only affect newly added doors, clearly state:
  - [ ] “These settings apply to newly added door sizes.”
- [ ] If existing doors can be updated, add a clear action:
  - [ ] Apply these settings to all existing doors
- [ ] Avoid hidden behavior where settings unexpectedly change old entries.

### Settings reset
- [ ] Add a separate reset button for settings only.
- [ ] Do not make users use `Clear All` just to reset settings.
- [ ] Consider separate actions:
  - [ ] Clear door sizes
  - [ ] Reset settings to defaults
  - [ ] Reset entire job
- [ ] Fix the current default/reset inconsistency where initial finish and reset finish differ.

### Settings layout ideas
- [ ] Group settings into clear sections:
  - [ ] Stiles
  - [ ] Rails
  - [ ] Joinery
  - [ ] Preview
- [ ] Add helper text/tooltips for technical settings:
  - [ ] Stile Width
  - [ ] Stile Thickness
  - [ ] Top Rail Width
  - [ ] Middle Rail Width
  - [ ] Bottom Rail Width
  - [ ] Height to Middle Rail
  - [ ] Groove Depth
  - [ ] Tongue Length
  - [ ] Vertical Panel Clearance
  - [ ] Horizontal Panel Clearance
- [ ] Add a compact settings summary when collapsed, such as:
  - [ ] `Stile 5" · Top 5" · Mid 6 1/4" · Bottom 9"`
- [ ] Consider adding shop presets later:
  - [ ] Standard Shaker Paint
  - [ ] Standard Shaker Stain
  - [ ] Ovolo
  - [ ] Custom

### UI references/libraries to review
- [ ] shadcn/ui
- [ ] Tailwind Plus / Tailwind UI
- [ ] Untitled UI React
- [ ] Preline UI
- [ ] TailAdmin
- [ ] Radix UI
- [ ] Headless UI
- [ ] React Aria, only if more advanced accessibility/custom controls are needed

---

## 4. Door Entry Workflow

### Add-door behavior
- [ ] Keep the current behavior where adding a door copies the previous door size.
- [ ] Consider renaming `Add New Door` to something clearer:
  - [ ] Add Door Size
  - [ ] Add Another Door
  - [ ] Add Next Door
- [ ] Do not add a duplicate button unless the workflow changes.
- [ ] Encourage users to increment quantity instead of creating duplicate same-size doors.

### Door cards
- [ ] Rename each card from `Door Dimensions` to `Door 1`, `Door 2`, etc.
- [ ] Add the hidden scaled preview dropdown to each card.
- [ ] Consider adding a small calculated summary inside the collapsed card.
- [ ] Prevent deleting the last remaining door, or replace it with a reset-to-default behavior.

### Door labels / locations
- [ ] Consider adding an optional door label/location field later.
- [ ] Examples:
  - [ ] Kitchen
  - [ ] Pantry
  - [ ] Closet
  - [ ] Bath 1
- [ ] If added, include labels in a printable door schedule.
- [ ] Keep this secondary if the shop usually works from grouped sizes rather than per-location labels.

---

## 5. Print Layout and Pagination

### Current print output
- [ ] Keep the strong printable cut-list format.
- [ ] Keep grouped tables for:
  - [ ] Stiles
  - [ ] Panels
  - [ ] Rails
  - [ ] Door sizes
- [ ] Keep print-specific CSS and letter portrait setup.

### Pagination improvements
- [ ] Remove empty rows when there is not enough space.
- [ ] Start moving lower-priority categories to page 2 when needed.
- [ ] Move notes and final door sizes first if the main cut-list tables need room.
- [ ] Add page-break handling so tables do not split awkwardly.
- [ ] Add compact mode for larger jobs.
- [ ] Add a warning if the cut list is likely to exceed one page.

### Notes
- [ ] Turn the current printed `Notes` label into a real editable notes field.
- [ ] Add a job-level notes textarea in the input UI.
- [ ] Print notes on the cut list.
- [ ] Move notes to page 2 when space is tight.

### Print metadata
- [ ] Keep the generated date on the printout.
- [ ] Consider adding app version to the printout.
- [ ] Consider making the subtitle more readable:
  - [ ] `Qty: 4 | Finish: Paint Grade | Species: Poplar | Style: Two Panel Shaker`

---

## 6. Save / Load / Export

### Existing save/load behavior
- [ ] Keep JSON save/load for jobs.
- [ ] Rename `Save` to make the behavior clearer:
  - [ ] Download Job File
  - [ ] Save Job JSON
- [ ] Rename `Load` if needed:
  - [ ] Load Job File

### Future exports
- [ ] Add export as PDF.
- [ ] Add export as CSV.
- [ ] Consider exportable SVG preview per door.
- [ ] Consider including generated SVG previews in saved job data only if needed.

---

## 7. Mobile Input Improvements

### Current choice
- [ ] Keep `inputMode="decimal"` for now because the shop users know their sixteenths as decimals.
- [ ] Avoid changing this until higher-priority work is done.

### Future quick-entry toolbar
- [ ] Native mobile web keyboards cannot reliably be customized with a custom symbol row.
- [ ] Build an in-page toolbar instead if needed.
- [ ] Show toolbar only while a dimension field is focused.
- [ ] Pin it near the bottom of the viewport.
- [ ] Consider decimal shortcut chips:
  - [ ] `.125`
  - [ ] `.250`
  - [ ] `.375`
  - [ ] `.500`
  - [ ] `.625`
  - [ ] `.750`
  - [ ] `.875`
- [ ] If fraction mode is added later, consider fraction chips:
  - [ ] `1/8`
  - [ ] `1/4`
  - [ ] `3/8`
  - [ ] `1/2`
  - [ ] `5/8`
  - [ ] `3/4`
  - [ ] `7/8`

---

## 8. Accessibility and Polish

### Dropdowns and controls
- [ ] Improve species dropdown keyboard accessibility.
- [ ] Add Escape-to-close behavior.
- [ ] Add proper combobox/listbox roles if keeping the custom dropdown.
- [ ] Consider using a normal select plus custom text input if simpler.

### Focus and interaction states
- [ ] Make focus states clear on all buttons and inputs.
- [ ] Make preview toggle buttons keyboard accessible.
- [ ] Make settings drawer/dialog accessible if added.

### Code cleanup
- [ ] Remove unused Vite starter CSS if `App.css` is not imported or used.
- [ ] Check any non-standard Tailwind classes such as `text-stone-850`.
- [ ] Replace `Date.now()` door IDs with `crypto.randomUUID()`.
- [ ] Keep calculation logic, geometry logic, and UI rendering separate.

---

## Suggested Implementation Order

### Phase 1: Visual verification and safety
- [ ] Build shared door geometry module.
- [ ] Build SVG renderer.
- [ ] Generate static style SVGs.
- [ ] Add hidden per-door scaled SVG preview.
- [ ] Add validation/warnings for impossible dimensions.

### Phase 2: Settings redesign
- [ ] Move settings into a clearer UI pattern.
- [ ] Rename settings to Door Defaults / Build Settings / similar.
- [ ] Clarify how settings apply to new and existing doors.
- [ ] Add reset-settings-only action.
- [ ] Add helper text/tooltips.

### Phase 3: Print improvements
- [ ] Remove empty rows when space is tight.
- [ ] Improve pagination.
- [ ] Move lower-priority sections to page 2 when needed.
- [ ] Add real notes field.

### Phase 4: Workflow and exports
- [ ] Rename save/load actions.
- [ ] Add PDF export.
- [ ] Add CSV export.
- [ ] Add optional door labels/locations if needed.

### Phase 5: Mobile and advanced polish
- [ ] Add decimal quick-entry toolbar if mobile entry becomes a problem.
- [ ] Improve custom dropdown accessibility.
- [ ] Add shop presets if multiple standard builds are commonly used.
