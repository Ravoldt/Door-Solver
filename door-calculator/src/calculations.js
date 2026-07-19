import { roundDimension } from "./utils";
import { DEFAULT_SETTINGS, TOOLING_PROFILES } from "./doorconfig";

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

export const calculateData = (doors, settings, doorType, profile) => {
  const stilesMap = new Map();
  const railsMap = new Map();
  const middleRailsMap = new Map();
  const bottomRailsMap = new Map();
  const panelGroupsMap = new Map();
  const doorSummariesMap = new Map();

  const activeProfile = TOOLING_PROFILES[profile?.toLowerCase()] || TOOLING_PROFILES.shaker;

  const getTrimmedWidth = (baseWidth, outsideEdges, insideEdges) => {
    const trim = (outsideEdges * activeProfile.outsideTrim) + (insideEdges * activeProfile.profileTrim);
    return baseWidth + trim;
  };

  const getActiveSettings = (door) => {
    const doorSettings = door.settings || settings;
    const active = { ...DEFAULT_SETTINGS, ...doorSettings };
    if (profile === "Ovolo") {
      active.grooveDepth = 1.5;
      active.tongueLength = 1.5;
    }
    return active;
  };

  const addPanelItem = (sectionName, panelWidth, panelHeight, label, qty) => {
    if (!panelGroupsMap.has(sectionName)) {
      panelGroupsMap.set(sectionName, new Map());
    }
    const sectionMap = panelGroupsMap.get(sectionName);
    addGroupedItem(
      sectionMap,
      buildKey(panelWidth, panelHeight),
      { width: panelWidth, height: panelHeight, label },
      qty,
    );
  };

  const styleCalculators = {
    "1 Panel": (door) => {
      const active = getActiveSettings(door);
      const qty = Number(door.qty) || 0;
      const width = roundDimension(door.width);
      const height = roundDimension(door.height);
      const nominalStileWidth = roundDimension(active.stileWidth);
      const cutStileWidth = roundDimension(getTrimmedWidth(nominalStileWidth, 1, 1));
      const cutTopRailWidth = roundDimension(getTrimmedWidth(active.topRailWidth, 1, 1));
      const cutBottomRailWidth = roundDimension(getTrimmedWidth(active.bottomRailWidth, 1, 1));
      const stileThickness = roundDimension(active.stileThickness);

      const stileLength = roundDimension(height + (activeProfile.outsideTrim * 2));
      addGroupedItem(
        stilesMap,
        buildKey(stileThickness, cutStileWidth, stileLength),
        { thickness: stileThickness, width: cutStileWidth, length: stileLength },
        qty * 2,
      );

      const railLength = roundDimension(width - (nominalStileWidth * 2) + (active.tongueLength * 2));
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

      const panelWidth = roundDimension(
        width - (nominalStileWidth * 2) + (active.grooveDepth * 2) - active.horizontalPanelClearance,
      );
      const panelHeightAllowance = (active.grooveDepth * 2) - active.verticalPanelClearance;
      const panelHeight = roundDimension(height - active.topRailWidth - active.bottomRailWidth + panelHeightAllowance);
      addPanelItem("all", panelWidth, panelHeight, "", qty);
    },
    "2 Panel": (door) => {
      const active = getActiveSettings(door);
      const qty = Number(door.qty) || 0;
      const width = roundDimension(door.width);
      const height = roundDimension(door.height);
      const nominalStileWidth = roundDimension(active.stileWidth);
      const cutStileWidth = roundDimension(getTrimmedWidth(nominalStileWidth, 1, 1));
      const cutTopRailWidth = roundDimension(getTrimmedWidth(active.topRailWidth, 1, 1));
      const cutLockRailWidth = roundDimension(getTrimmedWidth(active.lockRailWidth, 0, 2));
      const cutBottomRailWidth = roundDimension(getTrimmedWidth(active.bottomRailWidth, 1, 1));
      const stileThickness = roundDimension(active.stileThickness);

      const stileLength = roundDimension(height + (activeProfile.outsideTrim * 2));
      addGroupedItem(
        stilesMap,
        buildKey(stileThickness, cutStileWidth, stileLength),
        { thickness: stileThickness, width: cutStileWidth, length: stileLength },
        qty * 2,
      );

      const railLength = roundDimension(width - (nominalStileWidth * 2) + (active.tongueLength * 2));
      addGroupedItem(
        railsMap,
        buildKey(stileThickness, cutTopRailWidth, railLength),
        { thickness: stileThickness, width: cutTopRailWidth, length: railLength },
        qty,
      );

      addGroupedItem(
        middleRailsMap,
        buildKey(stileThickness, cutLockRailWidth, railLength),
        { thickness: stileThickness, width: cutLockRailWidth, length: railLength },
        qty,
      );

      addGroupedItem(
        bottomRailsMap,
        buildKey(stileThickness, cutBottomRailWidth, railLength),
        { thickness: stileThickness, width: cutBottomRailWidth, length: railLength },
        qty,
      );

      const panelWidth = roundDimension(
        width - (nominalStileWidth * 2) + (active.grooveDepth * 2) - active.horizontalPanelClearance,
      );
      const panelHeightAllowance = (active.grooveDepth * 2) - active.verticalPanelClearance;
      const lowerPanelHeight = roundDimension(
        active.heightToLockRail - active.bottomRailWidth - (active.lockRailWidth / 2) + panelHeightAllowance,
      );
      const upperPanelHeight = roundDimension(
        height - active.heightToLockRail - active.topRailWidth - (active.lockRailWidth / 2) + panelHeightAllowance,
      );

      addPanelItem("upper", panelWidth, upperPanelHeight, "(Upper)", qty);
      addPanelItem("lower", panelWidth, lowerPanelHeight, "(Lower)", qty);
    },
    "3 Panel": (door) => {
      const active = getActiveSettings(door);
      const qty = Number(door.qty) || 0;
      const width = roundDimension(door.width);
      const height = roundDimension(door.height);
      const nominalStileWidth = roundDimension(active.stileWidth);
      const cutStileWidth = roundDimension(getTrimmedWidth(nominalStileWidth, 1, 1));
      const cutTopRailWidth = roundDimension(getTrimmedWidth(active.topRailWidth, 1, 1));
      const cutIntermediateRailWidth = roundDimension(getTrimmedWidth(active.intermediateRailWidth, 0, 2));
      const cutBottomRailWidth = roundDimension(getTrimmedWidth(active.bottomRailWidth, 1, 1));
      const stileThickness = roundDimension(active.stileThickness);

      const stileLength = roundDimension(height + (activeProfile.outsideTrim * 2));
      addGroupedItem(
        stilesMap,
        buildKey(stileThickness, cutStileWidth, stileLength),
        { thickness: stileThickness, width: cutStileWidth, length: stileLength },
        qty * 2,
      );

      const railLength = roundDimension(width - (nominalStileWidth * 2) + (active.tongueLength * 2));
      addGroupedItem(
        railsMap,
        buildKey(stileThickness, cutTopRailWidth, railLength),
        { thickness: stileThickness, width: cutTopRailWidth, length: railLength },
        qty,
      );

      addGroupedItem(
        middleRailsMap,
        buildKey(stileThickness, cutIntermediateRailWidth, railLength),
        { thickness: stileThickness, width: cutIntermediateRailWidth, length: railLength },
        qty * 2,
      );

      addGroupedItem(
        bottomRailsMap,
        buildKey(stileThickness, cutBottomRailWidth, railLength),
        { thickness: stileThickness, width: cutBottomRailWidth, length: railLength },
        qty,
      );

      const panelWidth = roundDimension(
        width - (nominalStileWidth * 2) + (active.grooveDepth * 2) - active.horizontalPanelClearance,
      );
      const panelHeightAllowance = (active.grooveDepth * 2) - active.verticalPanelClearance;
      const availableSpace = height - active.topRailWidth - active.bottomRailWidth - (2 * active.intermediateRailWidth);
      const panelHeight = roundDimension((availableSpace / 3) + panelHeightAllowance);

      addPanelItem("all", panelWidth, panelHeight, "(All)", qty * 3);
    },
  };

  doors.forEach((door) => {
    const qty = Number(door.qty) || 0;
    const width = roundDimension(door.width);
    const height = roundDimension(door.height);

    const calculateStyle = styleCalculators[doorType];
    if (calculateStyle) {
      calculateStyle(door);
    }

    addGroupedItem(
      doorSummariesMap,
      buildKey(width, height),
      { width, height },
      qty,
    );
  });

  const sectionOrder = ["all", "upper", "middle", "lower"];
  const panels = Array.from(panelGroupsMap.entries())
    .sort(([a], [b]) => {
      const indexA = sectionOrder.indexOf(a);
      const indexB = sectionOrder.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    })
    .map(([sectionName, sectionMap]) => ({
      section: sectionName,
      items: mapToList(sectionMap),
    }));

  return {
    stiles: mapToList(stilesMap),
    rails: mapToList(railsMap),
    middleRails: mapToList(middleRailsMap),
    bottomRails: mapToList(bottomRailsMap),
    panels: panels,
    doorSummaries: mapToList(doorSummariesMap),
  };
};
