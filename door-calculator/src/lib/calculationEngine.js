/**
 * Authoritative Parts & Cut List Calculation Engine
 * 
 * Computes exact cut sizes for stiles, rails, lock rails, intermediate rails,
 * and panels under specified production presets and tooling profiles.
 */

import { roundDimension } from "../utils";
import { DEFAULT_PRODUCTION_PRESETS } from "./dataModels";

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
  },
};

const buildKey = (...values) =>
  values
    .map((val) => (Number.isFinite(Number(val)) ? roundDimension(val) : val))
    .join("|");

const addGroupedItem = (map, key, item, qty) => {
  if (!qty) return;
  if (map.has(key)) {
    map.get(key).qty += qty;
    return;
  }
  map.set(key, { ...item, qty });
};

const mapToList = (map) => Array.from(map.values());

/**
 * Calculates authoritative shop cut lists for doors.
 *
 * @param {Array} doors - List of door objects with width, height, qty, settings/proportions
 * @param {Object} productionPresets - Internal manufacturing presets (grooveDepth, tongueLength, clearances)
 * @param {string} doorType - "1 Panel" | "2 Panel" | "3 Panel"
 * @param {string} profile - "Shaker" | "Ovolo"
 * @returns {Object} Calculated cut list tables for stiles, rails, middleRails, bottomRails, panels, doorSummaries
 */
export const calculateShopParts = (doors = [], productionPresets = {}, doorType = "2 Panel", profile = "Shaker") => {
  const stilesMap = new Map();
  const railsMap = new Map();
  const middleRailsMap = new Map();
  const bottomRailsMap = new Map();
  const panelGroupsMap = new Map();
  const doorSummariesMap = new Map();

  const activePresets = { ...DEFAULT_PRODUCTION_PRESETS, ...productionPresets };
  const profileKey = (profile || "shaker").toLowerCase();
  const activeProfile = TOOLING_PROFILES[profileKey] || TOOLING_PROFILES.shaker;

  const getTrimmedWidth = (baseWidth, outsideEdges, insideEdges) => {
    const trim = outsideEdges * activeProfile.outsideTrim + insideEdges * activeProfile.profileTrim;
    return baseWidth + trim;
  };

  const getActiveDoorSettings = (door) => {
    const doorProportions = door.visualProportions || door.settings || {};
    const stileThickness = door.settings?.stileThickness ?? activePresets.stileThickness ?? 1.75;
    
    let grooveDepth = door.settings?.grooveDepth ?? activePresets.grooveDepth ?? 1.5;
    let tongueLength = door.settings?.tongueLength ?? activePresets.tongueLength ?? 1.5;

    // Specific rule for Ovolo profile
    if (profile === "Ovolo" || profileKey === "ovolo") {
      grooveDepth = 1.5;
      tongueLength = 1.5;
    }

    return {
      stileWidth: parseFloat(doorProportions.stileWidth ?? 5),
      stileThickness: parseFloat(stileThickness),
      topRailWidth: parseFloat(doorProportions.topRailWidth ?? 5),
      lockRailWidth: parseFloat(doorProportions.lockRailWidth ?? 6.25),
      intermediateRailWidth: parseFloat(doorProportions.intermediateRailWidth ?? 5),
      bottomRailWidth: parseFloat(doorProportions.bottomRailWidth ?? 9),
      heightToLockRail: parseFloat(doorProportions.heightToLockRail ?? 36),
      grooveDepth: parseFloat(grooveDepth),
      tongueLength: parseFloat(tongueLength),
      verticalPanelClearance: parseFloat(activePresets.verticalPanelClearance ?? 0.875),
      horizontalPanelClearance: parseFloat(activePresets.horizontalPanelClearance ?? 0.5),
    };
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
      qty
    );
  };

  const styleCalculators = {
    "1 Panel": (door) => {
      const active = getActiveDoorSettings(door);
      const qty = Number(door.qty) || 0;
      const width = roundDimension(door.width);
      const height = roundDimension(door.height);
      const nominalStileWidth = roundDimension(active.stileWidth);
      const cutStileWidth = roundDimension(getTrimmedWidth(nominalStileWidth, 1, 1));
      const cutTopRailWidth = roundDimension(getTrimmedWidth(active.topRailWidth, 1, 1));
      const cutBottomRailWidth = roundDimension(getTrimmedWidth(active.bottomRailWidth, 1, 1));
      const stileThickness = roundDimension(active.stileThickness);

      const stileLength = roundDimension(height + activeProfile.outsideTrim * 2);
      addGroupedItem(
        stilesMap,
        buildKey(stileThickness, cutStileWidth, stileLength),
        { thickness: stileThickness, width: cutStileWidth, length: stileLength },
        qty * 2
      );

      const railLength = roundDimension(width - nominalStileWidth * 2 + active.tongueLength * 2);
      addGroupedItem(
        railsMap,
        buildKey(stileThickness, cutTopRailWidth, railLength),
        { thickness: stileThickness, width: cutTopRailWidth, length: railLength },
        qty
      );

      addGroupedItem(
        bottomRailsMap,
        buildKey(stileThickness, cutBottomRailWidth, railLength),
        { thickness: stileThickness, width: cutBottomRailWidth, length: railLength },
        qty
      );

      const panelWidth = roundDimension(
        width - nominalStileWidth * 2 + active.grooveDepth * 2 - active.horizontalPanelClearance
      );
      const panelHeightAllowance = active.grooveDepth * 2 - active.verticalPanelClearance;
      const panelHeight = roundDimension(
        height - active.topRailWidth - active.bottomRailWidth + panelHeightAllowance
      );
      addPanelItem("all", panelWidth, panelHeight, "", qty);
    },
    "2 Panel": (door) => {
      const active = getActiveDoorSettings(door);
      const qty = Number(door.qty) || 0;
      const width = roundDimension(door.width);
      const height = roundDimension(door.height);
      const nominalStileWidth = roundDimension(active.stileWidth);
      const cutStileWidth = roundDimension(getTrimmedWidth(nominalStileWidth, 1, 1));
      const cutTopRailWidth = roundDimension(getTrimmedWidth(active.topRailWidth, 1, 1));
      const cutLockRailWidth = roundDimension(getTrimmedWidth(active.lockRailWidth, 0, 2));
      const cutBottomRailWidth = roundDimension(getTrimmedWidth(active.bottomRailWidth, 1, 1));
      const stileThickness = roundDimension(active.stileThickness);

      const stileLength = roundDimension(height + activeProfile.outsideTrim * 2);
      addGroupedItem(
        stilesMap,
        buildKey(stileThickness, cutStileWidth, stileLength),
        { thickness: stileThickness, width: cutStileWidth, length: stileLength },
        qty * 2
      );

      const railLength = roundDimension(width - nominalStileWidth * 2 + active.tongueLength * 2);
      addGroupedItem(
        railsMap,
        buildKey(stileThickness, cutTopRailWidth, railLength),
        { thickness: stileThickness, width: cutTopRailWidth, length: railLength },
        qty
      );

      addGroupedItem(
        middleRailsMap,
        buildKey(stileThickness, cutLockRailWidth, railLength),
        { thickness: stileThickness, width: cutLockRailWidth, length: railLength },
        qty
      );

      addGroupedItem(
        bottomRailsMap,
        buildKey(stileThickness, cutBottomRailWidth, railLength),
        { thickness: stileThickness, width: cutBottomRailWidth, length: railLength },
        qty
      );

      const panelWidth = roundDimension(
        width - nominalStileWidth * 2 + active.grooveDepth * 2 - active.horizontalPanelClearance
      );
      const panelHeightAllowance = active.grooveDepth * 2 - active.verticalPanelClearance;
      const lowerPanelHeight = roundDimension(
        active.heightToLockRail - active.bottomRailWidth - active.lockRailWidth / 2 + panelHeightAllowance
      );
      const upperPanelHeight = roundDimension(
        height - active.heightToLockRail - active.topRailWidth - active.lockRailWidth / 2 + panelHeightAllowance
      );

      addPanelItem("upper", panelWidth, upperPanelHeight, "(Upper)", qty);
      addPanelItem("lower", panelWidth, lowerPanelHeight, "(Lower)", qty);
    },
    "3 Panel": (door) => {
      const active = getActiveDoorSettings(door);
      const qty = Number(door.qty) || 0;
      const width = roundDimension(door.width);
      const height = roundDimension(door.height);
      const nominalStileWidth = roundDimension(active.stileWidth);
      const cutStileWidth = roundDimension(getTrimmedWidth(nominalStileWidth, 1, 1));
      const cutTopRailWidth = roundDimension(getTrimmedWidth(active.topRailWidth, 1, 1));
      const cutIntermediateRailWidth = roundDimension(getTrimmedWidth(active.intermediateRailWidth, 0, 2));
      const cutBottomRailWidth = roundDimension(getTrimmedWidth(active.bottomRailWidth, 1, 1));
      const stileThickness = roundDimension(active.stileThickness);

      const stileLength = roundDimension(height + activeProfile.outsideTrim * 2);
      addGroupedItem(
        stilesMap,
        buildKey(stileThickness, cutStileWidth, stileLength),
        { thickness: stileThickness, width: cutStileWidth, length: stileLength },
        qty * 2
      );

      const railLength = roundDimension(width - nominalStileWidth * 2 + active.tongueLength * 2);
      addGroupedItem(
        railsMap,
        buildKey(stileThickness, cutTopRailWidth, railLength),
        { thickness: stileThickness, width: cutTopRailWidth, length: railLength },
        qty
      );

      addGroupedItem(
        middleRailsMap,
        buildKey(stileThickness, cutIntermediateRailWidth, railLength),
        { thickness: stileThickness, width: cutIntermediateRailWidth, length: railLength },
        qty * 2
      );

      addGroupedItem(
        bottomRailsMap,
        buildKey(stileThickness, cutBottomRailWidth, railLength),
        { thickness: stileThickness, width: cutBottomRailWidth, length: railLength },
        qty
      );

      const panelWidth = roundDimension(
        width - nominalStileWidth * 2 + active.grooveDepth * 2 - active.horizontalPanelClearance
      );
      const panelHeightAllowance = active.grooveDepth * 2 - active.verticalPanelClearance;
      const availableSpace =
        height - active.topRailWidth - active.bottomRailWidth - 2 * active.intermediateRailWidth;
      const panelHeight = roundDimension(availableSpace / 3 + panelHeightAllowance);

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
      qty
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
    panels,
    doorSummaries: mapToList(doorSummariesMap),
    totalDoors: doors.reduce((acc, d) => acc + (parseInt(d.qty, 10) || 0), 0),
  };
};
