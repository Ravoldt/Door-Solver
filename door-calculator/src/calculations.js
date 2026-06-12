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

  const activeSettings = { ...DEFAULT_SETTINGS, ...settings };

  const {
    stileWidth: configStileWidth,
    stileThickness: configStileThickness,
    topRailWidth,
    middleRailWidth,
    bottomRailWidth,
    heightToMiddleRail,
    grooveDepth,
    tongueLength,
    verticalPanelClearance,
    horizontalPanelClearance,
  } = activeSettings;

  const activeProfile = TOOLING_PROFILES[profile?.toLowerCase()] || TOOLING_PROFILES.shaker;

  const getTrimmedWidth = (baseWidth, outsideEdges, insideEdges) => {
    const trim = (outsideEdges * activeProfile.outsideTrim) + (insideEdges * activeProfile.profileTrim);
    return baseWidth + trim;
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
      const qty = Number(door.qty) || 0;
      const width = roundDimension(door.width);
      const height = roundDimension(door.height);
      const nominalStileWidth = roundDimension(configStileWidth);
      const cutStileWidth = roundDimension(getTrimmedWidth(nominalStileWidth, 1, 1));
      const cutTopRailWidth = roundDimension(getTrimmedWidth(topRailWidth, 1, 1));
      const cutBottomRailWidth = roundDimension(getTrimmedWidth(bottomRailWidth, 1, 1));
      const stileThickness = roundDimension(configStileThickness);

      const stileLength = roundDimension(height + (activeProfile.outsideTrim * 2));
      addGroupedItem(
        stilesMap,
        buildKey(stileThickness, cutStileWidth, stileLength),
        { thickness: stileThickness, width: cutStileWidth, length: stileLength },
        qty * 2,
      );

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

      const panelWidth = roundDimension(
        width - (nominalStileWidth * 2) + (grooveDepth * 2) - horizontalPanelClearance,
      );
      const panelHeightAllowance = (grooveDepth * 2) - verticalPanelClearance;
      const panelHeight = roundDimension(height - topRailWidth - bottomRailWidth + panelHeightAllowance);
      addPanelItem("all", panelWidth, panelHeight, "", qty);
    },
    "2 Panel": (door) => {
      const qty = Number(door.qty) || 0;
      const width = roundDimension(door.width);
      const height = roundDimension(door.height);
      const nominalStileWidth = roundDimension(configStileWidth);
      const cutStileWidth = roundDimension(getTrimmedWidth(nominalStileWidth, 1, 1));
      const cutTopRailWidth = roundDimension(getTrimmedWidth(topRailWidth, 1, 1));
      const cutMiddleRailWidth = roundDimension(getTrimmedWidth(middleRailWidth, 0, 2));
      const cutBottomRailWidth = roundDimension(getTrimmedWidth(bottomRailWidth, 1, 1));
      const stileThickness = roundDimension(configStileThickness);

      const stileLength = roundDimension(height + (activeProfile.outsideTrim * 2));
      addGroupedItem(
        stilesMap,
        buildKey(stileThickness, cutStileWidth, stileLength),
        { thickness: stileThickness, width: cutStileWidth, length: stileLength },
        qty * 2,
      );

      const railLength = roundDimension(width - (nominalStileWidth * 2) + (tongueLength * 2));
      addGroupedItem(
        railsMap,
        buildKey(stileThickness, cutTopRailWidth, railLength),
        { thickness: stileThickness, width: cutTopRailWidth, length: railLength },
        qty,
      );

      addGroupedItem(
        middleRailsMap,
        buildKey(stileThickness, cutMiddleRailWidth, railLength),
        { thickness: stileThickness, width: cutMiddleRailWidth, length: railLength },
        qty,
      );

      addGroupedItem(
        bottomRailsMap,
        buildKey(stileThickness, cutBottomRailWidth, railLength),
        { thickness: stileThickness, width: cutBottomRailWidth, length: railLength },
        qty,
      );

      const panelWidth = roundDimension(
        width - (nominalStileWidth * 2) + (grooveDepth * 2) - horizontalPanelClearance,
      );
      const panelHeightAllowance = (grooveDepth * 2) - verticalPanelClearance;
      const lowerPanelHeight = roundDimension(
        heightToMiddleRail - bottomRailWidth - (middleRailWidth / 2) + panelHeightAllowance,
      );
      const upperPanelHeight = roundDimension(
        height - heightToMiddleRail - topRailWidth - (middleRailWidth / 2) + panelHeightAllowance,
      );

      addPanelItem("upper", panelWidth, upperPanelHeight, "(Upper)", qty);
      addPanelItem("lower", panelWidth, lowerPanelHeight, "(Lower)", qty);
    },
    "3 Panel": (door) => {
      const qty = Number(door.qty) || 0;
      const width = roundDimension(door.width);
      const height = roundDimension(door.height);
      const nominalStileWidth = roundDimension(configStileWidth);
      const cutStileWidth = roundDimension(getTrimmedWidth(nominalStileWidth, 1, 1));
      const cutTopRailWidth = roundDimension(getTrimmedWidth(topRailWidth, 1, 1));
      const cutMiddleRailWidth = roundDimension(getTrimmedWidth(middleRailWidth, 0, 2));
      const cutBottomRailWidth = roundDimension(getTrimmedWidth(bottomRailWidth, 1, 1));
      const stileThickness = roundDimension(configStileThickness);

      const stileLength = roundDimension(height + (activeProfile.outsideTrim * 2));
      addGroupedItem(
        stilesMap,
        buildKey(stileThickness, cutStileWidth, stileLength),
        { thickness: stileThickness, width: cutStileWidth, length: stileLength },
        qty * 2,
      );

      const railLength = roundDimension(width - (nominalStileWidth * 2) + (tongueLength * 2));
      addGroupedItem(
        railsMap,
        buildKey(stileThickness, cutTopRailWidth, railLength),
        { thickness: stileThickness, width: cutTopRailWidth, length: railLength },
        qty,
      );

      addGroupedItem(
        middleRailsMap,
        buildKey(stileThickness, cutMiddleRailWidth, railLength),
        { thickness: stileThickness, width: cutMiddleRailWidth, length: railLength },
        qty * 2,
      );

      addGroupedItem(
        bottomRailsMap,
        buildKey(stileThickness, cutBottomRailWidth, railLength),
        { thickness: stileThickness, width: cutBottomRailWidth, length: railLength },
        qty,
      );

      const panelWidth = roundDimension(
        width - (nominalStileWidth * 2) + (grooveDepth * 2) - horizontalPanelClearance,
      );
      const panelHeightAllowance = (grooveDepth * 2) - verticalPanelClearance;
      const availableSpace = height - topRailWidth - bottomRailWidth - (2 * middleRailWidth);
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
