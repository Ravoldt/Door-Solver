import { roundDimension } from "./utils";

const buildKey = (...values) =>
  values
    .map((value) => (Number.isFinite(Number(value)) ? roundDimension(value) : value))
    .join("|");

const addGroupedItem = (map, key, item, qty) => {
  if (!qty) {
    return;
  }

  if (map.has(key)) {
    map.get(key).qty += qty;
    return;
  }

  map.set(key, { ...item, qty });
};

const mapToList = (map) => Array.from(map.values());

export const calculateData = (doors, settings, doorType) => {
  const sideRailsMap = new Map();
  const topStilesMap = new Map();
  const midStilesMap = new Map();
  const botStilesMap = new Map();
  const panelSection1Map = new Map();
  const panelSection2Map = new Map();
  const doorSummariesMap = new Map();

  const stileWidth = roundDimension(settings.stileWidth);
  const stileThickness = roundDimension(settings.stileThickness);
  const topRailWidth = roundDimension(settings.topRailWidth);
  const middleRailWidth = roundDimension(settings.middleRailWidth);
  const bottomRailWidth = roundDimension(settings.bottomRailWidth);
  const midStileCenter = roundDimension(settings.midStileCenter);
  const grooveDepth = roundDimension(settings.grooveDepth);
  const tongueLength = roundDimension(settings.tongueLength);
  const verticalPanelClearance = roundDimension(settings.verticalPanelClearance);
  const horizontalPanelClearance = roundDimension(settings.horizontalPanelClearance);
  const panelHeightAllowance = roundDimension((grooveDepth * 2) - verticalPanelClearance);

  const panelCalculators = {
    "1 Panel": (height, panelWidth, qty) => {
      const panelHeight = roundDimension(height - topRailWidth - bottomRailWidth + panelHeightAllowance);
      addGroupedItem(
        panelSection1Map,
        buildKey(panelWidth, panelHeight, "all"),
        { width: panelWidth, height: panelHeight, label: "" },
        qty,
      );
    },
    "2 Panel": (height, panelWidth, qty) => {
      const lowerPanelHeight = roundDimension(
        midStileCenter - bottomRailWidth - (middleRailWidth / 2) + panelHeightAllowance,
      );
      const upperPanelHeight = roundDimension(
        height - midStileCenter - topRailWidth - (middleRailWidth / 2) + panelHeightAllowance,
      );

      addGroupedItem(
        panelSection1Map,
        buildKey(panelWidth, upperPanelHeight, "upper"),
        { width: panelWidth, height: upperPanelHeight, label: "(Upper)" },
        qty,
      );

      addGroupedItem(
        panelSection2Map,
        buildKey(panelWidth, lowerPanelHeight, "lower"),
        { width: panelWidth, height: lowerPanelHeight, label: "(Lower)" },
        qty,
      );
    },
    "3 Panel": (height, panelWidth, qty) => {
      const availableSpace = height - topRailWidth - bottomRailWidth - (2 * middleRailWidth);
      const panelHeight = roundDimension((availableSpace / 3) + panelHeightAllowance);

      addGroupedItem(
        panelSection1Map,
        buildKey(panelWidth, panelHeight, "all"),
        { width: panelWidth, height: panelHeight, label: "(All)" },
        qty * 3,
      );
    },
  };

  doors.forEach((door) => {
    const qty = Number(door.qty) || 0;
    const width = roundDimension(door.width);
    const height = roundDimension(door.height);
    const useGlobalSideRail = door.useGlobalSideRail !== false;
    const railWidth = roundDimension(useGlobalSideRail ? stileWidth : door.stileWidth);
    const railThickness = roundDimension(useGlobalSideRail ? stileThickness : door.stileThickness);

    const railLength = roundDimension(height + 0.25);
    addGroupedItem(
      sideRailsMap,
      buildKey(railThickness, railWidth, railLength),
      { thickness: railThickness, width: railWidth, length: railLength },
      qty * 2,
    );

    const stileLength = roundDimension(width - (railWidth * 2) + (tongueLength * 2));
    addGroupedItem(
      topStilesMap,
      buildKey(railThickness, topRailWidth, stileLength),
      { thickness: railThickness, width: topRailWidth, length: stileLength },
      qty,
    );

    if (doorType !== "1 Panel") {
      addGroupedItem(
        midStilesMap,
        buildKey(railThickness, middleRailWidth, stileLength),
        { thickness: railThickness, width: middleRailWidth, length: stileLength },
        doorType === "3 Panel" ? qty * 2 : qty,
      );
    }

    addGroupedItem(
      botStilesMap,
      buildKey(railThickness, bottomRailWidth, stileLength),
      { thickness: railThickness, width: bottomRailWidth, length: stileLength },
      qty,
    );

    const panelWidth = roundDimension(
      width - (railWidth * 2) + (grooveDepth * 2) - horizontalPanelClearance,
    );

    const calculatePanels = panelCalculators[doorType];
    if (calculatePanels) {
      calculatePanels(height, panelWidth, qty);
    }

    addGroupedItem(
      doorSummariesMap,
      buildKey(width, height),
      { width, height },
      qty,
    );
  });

  return {
    sideRails: mapToList(sideRailsMap),
    topStiles: mapToList(topStilesMap),
    midStiles: mapToList(midStilesMap),
    botStiles: mapToList(botStilesMap),
    panelSection1: mapToList(panelSection1Map),
    panelSection2: mapToList(panelSection2Map),
    doorSummaries: mapToList(doorSummariesMap),
  };
};
