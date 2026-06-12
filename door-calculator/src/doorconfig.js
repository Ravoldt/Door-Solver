export const DEFAULT_SETTINGS = {
  stileWidth: 5,
  stileThickness: 1.75,
  topRailWidth: 5,
  middleRailWidth: 6.25,
  bottomRailWidth: 9,
  heightToMiddleRail: 36,
  grooveDepth: 1.5,
  tongueLength: 1.5,
  verticalPanelClearance: 0.875,
  horizontalPanelClearance: 0.5,
};

export const STYLE_REQUIRED_SETTINGS = {
  "1 Panel": [
    "stileWidth",
    "stileThickness",
    "topRailWidth",
    "bottomRailWidth",
    "grooveDepth",
    "tongueLength",
    "verticalPanelClearance",
    "horizontalPanelClearance",
  ],
  "2 Panel": [
    "stileWidth",
    "stileThickness",
    "topRailWidth",
    "middleRailWidth",
    "bottomRailWidth",
    "heightToMiddleRail",
    "grooveDepth",
    "tongueLength",
    "verticalPanelClearance",
    "horizontalPanelClearance",
  ],
  "3 Panel": [
    "stileWidth",
    "stileThickness",
    "topRailWidth",
    "middleRailWidth",
    "bottomRailWidth",
    "grooveDepth",
    "tongueLength",
    "verticalPanelClearance",
    "horizontalPanelClearance",
  ],
};

export const DOOR_STYLES = [
  { id: "1 Panel", label: "1 Panel" },
  { id: "2 Panel", label: "2 Panel" },
  { id: "3 Panel", label: "3 Panel" },
];

export const TOOLING_PROFILES = {
  shaker: {
    name: "Shaker (Square)",
    outsideTrim: 0.125,
    profileTrim: 0.0625,
  },
  ovolo: {
    name: "Ovolo (Bead)",
    outsideTrim: 0.125,
    profileTrim: 0.03125,
  }
};

/**
 * Computes coordinate-based geometry of all door components (stiles, rails, panels)
 * for a door of given width and height under specific settings and door type.
 * Useful for drawing scaled SVG representations.
 */
export const getDoorGeometry = (width, height, settings, doorType) => {
  const activeSettings = { ...DEFAULT_SETTINGS, ...settings };
  const {
    stileWidth,
    topRailWidth,
    middleRailWidth,
    bottomRailWidth,
    heightToMiddleRail,
  } = activeSettings;

  const geometry = {
    width,
    height,
    stiles: [],
    rails: [],
    panels: [],
  };

  const innerWidth = width - 2 * stileWidth;

  // Left Stile
  geometry.stiles.push({
    id: "left-stile",
    x: 0,
    y: 0,
    width: stileWidth,
    height: height,
    label: "Left Stile",
  });

  // Right Stile
  geometry.stiles.push({
    id: "right-stile",
    x: width - stileWidth,
    y: 0,
    width: stileWidth,
    height: height,
    label: "Right Stile",
  });

  // Top Rail
  geometry.rails.push({
    id: "top-rail",
    x: stileWidth,
    y: 0,
    width: innerWidth,
    height: topRailWidth,
    label: "Top Rail",
  });

  // Bottom Rail
  geometry.rails.push({
    id: "bottom-rail",
    x: stileWidth,
    y: height - bottomRailWidth,
    width: innerWidth,
    height: bottomRailWidth,
    label: "Bottom Rail",
  });

  if (doorType === "1 Panel") {
    geometry.panels.push({
      id: "panel-1",
      x: stileWidth,
      y: topRailWidth,
      width: innerWidth,
      height: height - topRailWidth - bottomRailWidth,
      label: "Panel",
    });
  } else if (doorType === "2 Panel") {
    const midYCenter = height - heightToMiddleRail;
    const midY = midYCenter - middleRailWidth / 2;

    // Middle Rail
    geometry.rails.push({
      id: "middle-rail-1",
      x: stileWidth,
      y: midY,
      width: innerWidth,
      height: middleRailWidth,
      label: "Middle Rail",
    });

    // Upper Panel
    geometry.panels.push({
      id: "panel-upper",
      x: stileWidth,
      y: topRailWidth,
      width: innerWidth,
      height: Math.max(0, midY - topRailWidth),
      label: "Upper Panel",
    });

    // Lower Panel
    geometry.panels.push({
      id: "panel-lower",
      x: stileWidth,
      y: midY + middleRailWidth,
      width: innerWidth,
      height: Math.max(0, (height - bottomRailWidth) - (midY + middleRailWidth)),
      label: "Lower Panel",
    });
  } else if (doorType === "3 Panel") {
    const availableSpace = height - topRailWidth - bottomRailWidth - 2 * middleRailWidth;
    const panelHeight = Math.max(0, availableSpace / 3);

    const midY1 = topRailWidth + panelHeight;
    const midY2 = midY1 + middleRailWidth + panelHeight;

    // First Middle Rail
    geometry.rails.push({
      id: "middle-rail-1",
      x: stileWidth,
      y: midY1,
      width: innerWidth,
      height: middleRailWidth,
      label: "Middle Rail 1",
    });

    // Second Middle Rail
    geometry.rails.push({
      id: "middle-rail-2",
      x: stileWidth,
      y: midY2,
      width: innerWidth,
      height: middleRailWidth,
      label: "Middle Rail 2",
    });

    // Upper Panel
    geometry.panels.push({
      id: "panel-upper",
      x: stileWidth,
      y: topRailWidth,
      width: innerWidth,
      height: panelHeight,
      label: "Upper Panel",
    });

    // Middle Panel
    geometry.panels.push({
      id: "panel-middle",
      x: stileWidth,
      y: midY1 + middleRailWidth,
      width: innerWidth,
      height: panelHeight,
      label: "Middle Panel",
    });

    // Lower Panel
    geometry.panels.push({
      id: "panel-lower",
      x: stileWidth,
      y: midY2 + middleRailWidth,
      width: innerWidth,
      height: panelHeight,
      label: "Lower Panel",
    });
  }

  return geometry;
};
