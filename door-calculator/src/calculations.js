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
  const doorSummaries = [];

  const sideRailWidth = roundDimension(settings.sideRailWidth);
  const sideRailThickness = roundDimension(settings.sideRailThickness);
  const topStileWidth = roundDimension(settings.topStileWidth);
  const midStileWidth = roundDimension(settings.midStileWidth);
  const botStileWidth = roundDimension(settings.botStileWidth);
  const panelWidthOffset = roundDimension(settings.panelWidthOffset);
  const endStileLengthOffset = roundDimension(settings.endStileLengthOffset);

  doors.forEach((door) => {
    const qty = Number(door.qty) || 0;
    const width = roundDimension(door.width);
    const height = roundDimension(door.height);
    const midStileCenter = roundDimension(door.midStileCenter);
    const useGlobalSideRail = door.useGlobalSideRail !== false;
    const railWidth = roundDimension(useGlobalSideRail ? sideRailWidth : door.sideRailWidth);
    const railThickness = roundDimension(useGlobalSideRail ? sideRailThickness : door.sideRailThickness);

    const railLength = roundDimension(height + 0.25);
    addGroupedItem(
      sideRailsMap,
      buildKey(railThickness, railWidth, railLength),
      { thickness: railThickness, width: railWidth, length: railLength },
      qty * 2,
    );

    const stileLength = roundDimension(width - endStileLengthOffset);
    addGroupedItem(
      topStilesMap,
      buildKey(railThickness, topStileWidth, stileLength),
      { thickness: railThickness, width: topStileWidth, length: stileLength },
      qty,
    );

    if (doorType !== "1 Panel") {
      addGroupedItem(
        midStilesMap,
        buildKey(railThickness, midStileWidth, stileLength),
        { thickness: railThickness, width: midStileWidth, length: stileLength },
        doorType === "3 Panel" ? qty * 2 : qty,
      );
    }

    addGroupedItem(
      botStilesMap,
      buildKey(railThickness, botStileWidth, stileLength),
      { thickness: railThickness, width: botStileWidth, length: stileLength },
      qty,
    );

    const panelWidth = roundDimension(width - panelWidthOffset);

    if (doorType === "1 Panel") {
      const panelHeight = roundDimension(height - topStileWidth - botStileWidth + 2);
      addGroupedItem(
        panelSection1Map,
        buildKey(panelWidth, panelHeight, "all"),
        { width: panelWidth, height: panelHeight, label: "" },
        qty,
      );
    } else if (doorType === "2 Panel") {
      const lowerPanelHeight = roundDimension(midStileCenter - botStileWidth - (midStileWidth / 2) + 2);
      const upperPanelHeight = roundDimension(height - midStileCenter - topStileWidth - (midStileWidth / 2) + 2);

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
    } else if (doorType === "3 Panel") {
      const availableSpace = height - topStileWidth - botStileWidth - (2 * midStileWidth);
      const panelHeight = roundDimension((availableSpace / 3) + 2);

      addGroupedItem(
        panelSection1Map,
        buildKey(panelWidth, panelHeight, "all"),
        { width: panelWidth, height: panelHeight, label: "(All)" },
        qty * 3,
      );
    }

    doorSummaries.push({ qty, width, height });
  });

  return {
    sideRails: mapToList(sideRailsMap),
    topStiles: mapToList(topStilesMap),
    midStiles: mapToList(midStilesMap),
    botStiles: mapToList(botStilesMap),
    panelSection1: mapToList(panelSection1Map),
    panelSection2: mapToList(panelSection2Map),
    doorSummaries,
  };
};
