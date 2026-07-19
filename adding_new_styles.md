# How to Add a New Door Style

This guide details the step-by-step process of adding a new door style to the Door Parts List Calculator. 

Adding a new door style requires updating the configuration, layout geometry (for SVG rendering), calculation logic (for the cut lists), validations, and workspace preview annotations.

---

## Step 1: Register the Style in Config

The styles are configured in [doorconfig.js]

### 1. Update `DOOR_STYLES`
Add the new door style definition to the `DOOR_STYLES` array.
```javascript
export const DOOR_STYLES = [
  { id: "1 Panel", label: "1 Panel" },
  { id: "2 Panel", label: "2 Panel" },
  { id: "3 Panel", label: "3 Panel" },
  { id: "New Door Style", label: "New Door Style" }, // <-- Add here
];
```

### 2. Update `STYLE_REQUIRED_SETTINGS`
Configure which setting inputs are shown to the user when they select the new style.
```javascript
export const STYLE_REQUIRED_SETTINGS = {
  // ... existing styles
  "New Door Style": [
    "stileWidth",
    "stileThickness",
    "topRailWidth",
    "lockRailWidth",        // Include if it has a center lock rail
    "intermediateRailWidth", // Include if it has intermediate rails
    "bottomRailWidth",
    "heightToLockRail",     // Include if it uses lock height
    "grooveDepth",
    "tongueLength",
    "verticalPanelClearance",
    "horizontalPanelClearance",
  ],
};
```

### 3. Add Custom Settings (Optional)
If your door style requires entirely new setting inputs (e.g., custom stile count, double rails, special spacing offsets), add them to:
- `DEFAULT_SETTINGS` in [doorconfig.js]
- `SETTING_DESCRIPTIONS` in [SettingsWorkspace.jsx]
- `SETTING_GROUPS` in [SettingsWorkspace.jsx]
- `normalizeSettings` in [App.jsx]

---

## Step 2: Define Blueprint Geometry for SVG Rendering

The visual layout preview is coordinate-based and calculated in the `getDoorGeometry` function inside [doorconfig.js].

Add a new `else if` branch for your style name under `getDoorGeometry`:
```javascript
export const getDoorGeometry = (width, height, settings, doorType) => {
  // ...
  const geometry = {
    width,
    height,
    stiles: [],
    rails: [],
    panels: [],
  };
  
  // Left and Right stiles are pre-calculated for all doors.
  // Add rails and panels specific to your door:
  if (doorType === "New Door Style") {
    // 1. Rails
    geometry.rails.push({
      id: "top-rail",
      x: stileWidth,
      y: 0,
      width: innerWidth,
      height: topRailWidth,
      label: "Top Rail",
    });
    
    // Add any middle or intermediate rails...
    
    geometry.rails.push({
      id: "bottom-rail",
      x: stileWidth,
      y: height - bottomRailWidth,
      width: innerWidth,
      height: bottomRailWidth,
      label: "Bottom Rail",
    });

    // 2. Panels
    geometry.panels.push({
      id: "panel-1",
      x: stileWidth,
      y: topRailWidth,
      width: innerWidth,
      height: height - topRailWidth - bottomRailWidth, // Modify as needed
      label: "Panel 1",
    });
  }
  
  return geometry;
};
```
*Note: Make sure your part IDs align with expectations, especially `left-stile`, `top-rail`, and `bottom-rail` as they are referenced for dimensioning.*

---

## Step 3: Implement Cut-List Calculations

The physical sizes of door components are calculated in [calculations.js]

Add a new calculator handler inside the `styleCalculators` map within `calculateData`:
```javascript
const styleCalculators = {
  // ... existing styles
  "New Door Style": (door) => {
    const qty = Number(door.qty) || 0;
    const width = roundDimension(door.width);
    const height = roundDimension(door.height);
    const nominalStileWidth = roundDimension(configStileWidth);
    const cutStileWidth = roundDimension(getTrimmedWidth(nominalStileWidth, 1, 1));
    const cutTopRailWidth = roundDimension(getTrimmedWidth(topRailWidth, 1, 1));
    const cutBottomRailWidth = roundDimension(getTrimmedWidth(bottomRailWidth, 1, 1));
    const stileThickness = roundDimension(configStileThickness);

    // 1. Stiles (Add left/right stile)
    const stileLength = roundDimension(height + (activeProfile.outsideTrim * 2));
    addGroupedItem(
      stilesMap,
      buildKey(stileThickness, cutStileWidth, stileLength),
      { thickness: stileThickness, width: cutStileWidth, length: stileLength },
      qty * 2,
    );

    // 2. Rails (Top & Bottom rails, intermediate rails)
    const railLength = roundDimension(width - (nominalStileWidth * 2) + (tongueLength * 2));
    addGroupedItem(
      railsMap,
      buildKey(stileThickness, cutTopRailWidth, railLength),
      { thickness: stileThickness, width: cutTopRailWidth, length: railLength },
      qty,
    );
    addGroupedItem(
      bottomRailsMap,
      buildKey(stileThickness, cutBottomRailWidth, railLength),
      { thickness: stileThickness, width: cutBottomRailWidth, length: railLength },
      qty,
    );

    // 3. Panels
    const panelWidth = roundDimension(
      width - (nominalStileWidth * 2) + (grooveDepth * 2) - horizontalPanelClearance,
    );
    const panelHeightAllowance = (grooveDepth * 2) - verticalPanelClearance;
    const panelHeight = roundDimension(height - topRailWidth - bottomRailWidth + panelHeightAllowance);
    
    // Call addPanelItem with a group name ("all", "upper", "middle", "lower", or custom)
    addPanelItem("all", panelWidth, panelHeight, "", qty);
  },
};
```

---

## Step 4: Add Geometry Validations

To prevent users from entering invalid door configurations (e.g. rails overlapping each other, stiles wider than the door itself), add validation logic in [validation.js]

Under the `validateDoor` function, add a block checking the style constraint:
```javascript
export const validateDoor = (door, settings, doorType) => {
  // ... existing validations
  
  if (doorType === "New Door Style") {
    // Add custom logic, pushing issues to error/warning arrays
    const topWidth = Number(topRailWidth) || 0;
    const botWidth = Number(bottomRailWidth) || 0;
    
    if (topWidth + botWidth >= height) {
      errors.push({
        field: "topRailWidth",
        message: "Rails combined width cannot exceed the overall door height.",
      });
    }
  }
  
  return { errors, warnings };
};
```

---

## Step 5: Adjust Settings Layout Annotations

In [SettingsWorkspace.jsx], the interactive blueprint layout determines where dimension annotations sit.

### 1. Vertical Dimension Sizing
Ensure the side annotations stack offsets are computed correctly for the style. Update the `innerVertW` selection code block:
```javascript
  if (doorType === "New Door Style") {
    innerVertW = Math.max(innerVertW, getBoxWidth("Top\nRail", formatInputDimension(activeSettings.topRailWidth)));
    // ... add any other middle/custom rail dimensions that need vertical measurements
  }
```

### 2. Dimension Lines Rendering
Make sure the SVG preview displays dimension labels correctly. In the component return:
- For rail widths, assign the correct settings keys:
  ```javascript
  // Inside geometry.rails.map()
  let activeField = "";
  if (r.id === "top-rail") activeField = "topRailWidth";
  if (r.id === "bottom-rail") activeField = "bottomRailWidth";
  if (r.id.startsWith("middle-rail")) activeField = doorType === "2 Panel" ? "lockRailWidth" : "intermediateRailWidth";
  // Add logic for custom rail identifiers if relevant...
  ```
- If your style needs extra dimensions (such as custom center spacing), render a `<DimensionLine />` explicitly inside the SVG tag, filtering for the style:
  ```javascript
  {doorType === "New Door Style" && (
    <DimensionLine
      x1={0}
      y1={0}
      x2={0}
      y2={activeSettings.someCustomSetting}
      offsetX={innerVertOffsetX}
      offsetY={0}
      value={`${formatInputDimension(activeSettings.someCustomSetting)}`}
      labelText={"Custom\nSetting"}
      fieldName="someCustomSetting"
      focusedField={focusedField}
      onClick={handlePillClick}
    />
  )}
  ```

---

## Step 6: Test the Implementation

After adding the code, verify the style selections:
1. Load the UI and confirm the new style appears in the "Door Style" horizontally scrolling cards layout.
2. Select it and ensure the rendering thumbnail in [MiniDoorStyleSvg.jsx]displays properly.
3. Open **Settings** to verify:
   - Only relevant settings are displayed in the side panel.
   - Clickable dimension line pills match up with setting inputs correctly.
   - Adjusting settings changes the visual geometry properly.
4. Input door sizes, view the resulting cut list table, and check print output to verify the stiles, rails, and panels are dimensioned accurately.
