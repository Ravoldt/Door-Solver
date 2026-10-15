/**
 * Data Models & Schema Separation for DoorSolver
 * 
 * Strict separation between:
 * 1. Public Design Specification (safe for client, URL, customers)
 * 2. Internal Production Specification (manufacturing clearances, groove/tongue, tooling)
 * 3. Commercial Information (price books, line items, margins, quotes)
 */

export const APP_VERSION = "2.0.0";
export const SCHEMA_VERSION = "1.0.0";

export const USER_ROLES = {
  PUBLIC: "public",
  PENDING: "pending",
  STAFF: "staff",
  ADMIN: "admin",
};

export const JOB_STATUSES = {
  DRAFT: "draft",
  IN_REVIEW: "in_review",
  QUOTED: "quoted",
  IN_PRODUCTION: "in_production",
  COMPLETED: "completed",
  ARCHIVED: "archived",
};

export const QUOTE_STATUSES = {
  DRAFT: "draft",
  SENT: "sent",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  EXPIRED: "expired",
};

export const PREDEFINED_SPECIES = [
  "Poplar",
  "Red Oak",
  "White Oak",
  "Maple",
  "Hickory",
  "Clear Pine",
  "Knotty Pine",
  "Knotty Alder",
  "Cherry",
  "Walnut",
];

export const PREDEFINED_FINISHES = ["Raw", "Primer", "Stain", "Paint"];
export const PREDEFINED_PROFILES = ["Shaker", "Ovolo"];

/**
 * 1. DEFAULT PUBLIC DESIGN SPECIFICATION
 * Contains only visual geometry and customer choices.
 * Never exposes groove depths, tooling offsets, or internal cut formulas.
 */
export const DEFAULT_PUBLIC_SPEC = {
  doorType: "2 Panel",
  jobName: "Custom Door Project",
  species: "Poplar",
  profile: "Shaker",
  finish: "Stain",
  doors: [
    {
      id: "door-1",
      qty: 1,
      width: 36,
      height: 96,
      visualProportions: {
        stileWidth: 5,
        topRailWidth: 5,
        lockRailWidth: 6.25,
        intermediateRailWidth: 5,
        bottomRailWidth: 9,
        heightToLockRail: 36,
      },
    },
  ],
};

/**
 * 2. DEFAULT INTERNAL PRODUCTION PRESETS
 * Manufacturing parameters only accessible by Staff and Admins.
 */
export const DEFAULT_PRODUCTION_PRESETS = {
  grooveDepth: 1.5,
  tongueLength: 1.5,
  verticalPanelClearance: 0.875,
  horizontalPanelClearance: 0.5,
  stileThickness: 1.75,
  outsideTrim: 0.125,
  profileTrimShaker: 0.0625,
  profileTrimOvolo: 0.03125,
  wasteFactorPercent: 10,
  productionNotes: "",
};

/**
 * 3. DEFAULT PRICE BOOK (v1.0.0)
 * Multi-factor commercial pricing rules.
 * All monetary values stored as exact integer cents ($1.00 = 100 cents).
 */
export const DEFAULT_PRICE_BOOK = {
  id: "pb-v1.0.0",
  version: "v1.0.0",
  name: "Standard 2026 Price Book (Trim Choice)",
  status: "published",
  effectiveDate: "2026-01-01T00:00:00.000Z",
  rules: {
    baseStyleRatesCents: {
      "1 Panel": 12000, // $120.00 base per door
      "2 Panel": 14500, // $145.00 base per door
      "3 Panel": 17500, // $175.00 base per door
    },
    speciesSqFtRateCents: {
      Poplar: 650, // $6.50 / sq ft
      "Red Oak": 900,
      "White Oak": 1450,
      Maple: 1100,
      Hickory: 1150,
      "Clear Pine": 750,
      "Knotty Pine": 680,
      "Knotty Alder": 980,
      Cherry: 1600,
      Walnut: 2200,
    },
    profileAddonCents: {
      Shaker: 0,
      Ovolo: 1500, // $15.00 / door
    },
    finishAddonCents: {
      Raw: 0,
      Primer: 3500, // $35.00 / door
      Stain: 6500,  // $65.00 / door
      Paint: 8000,  // $80.00 / door
    },
    prepFeesCents: {
      hingePrep: 1800, // $18.00 per door
      borePrep: 1200,  // $12.00 per door
      oversizeSurcharge: 2500, // $25.00 surcharge for doors > 8ft or > 3ft
    },
    defaultMarkupPercent: 25.0,
    defaultTaxRatePercent: 6.0,
    minimumOrderChargeCents: 15000, // $150.00 min order
  },
};

/**
 * Generates friendly, easily pronounceable/shareable short code (e.g. TC-8492)
 */
export const generateShareCode = () => {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // omitted ambiguous 0/O, 1/I
  let code = "TC-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Generates an unguessable cryptographic token for direct secure URL sharing
 */
export const generateShareToken = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "") + Math.random().toString(36).substring(2, 10);
  }
  return "st_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 12);
};

export const DESIGNER_OPTIONS = {
  DOOR_HANDINGS: [
    "Unknown Handing",
    "Left Hand (LH)",
    "Right Hand (RH)",
    "Left Hand Reverse (LHR)",
    "Right Hand Reverse (RHR)",
  ],
  DOOR_STYLES: ["1 Panel", "2 Panel", "3 Panel"],
  DOOR_TOPS: ["Square", "Roman", "Segmented Arch", "Full Arch"],
  PANEL_SUBSTITUTIONS: ["None", "Top Panel", "All Panels"],
  MATERIALS: [
    "Poplar",
    "Red Oak",
    "White Oak",
    "Maple",
    "Hickory",
    "Clear Pine",
    "Knotty Pine",
    "Knotty Alder",
    "Cherry",
    "Walnut",
    "Custom",
  ],
  PROFILES: ["Shaker", "Ovolo"],
  PANELS: ["Flat", "Raised"],
};

/**
 * Sanitizes a public design object before saving or displaying publicly.
 * Strips out internal cut lists, tooling numbers, manufacturing notes, or customer private data.
 */
export const sanitizePublicDesignSpec = (inputSpec = {}) => {
  const safeDoors = Array.isArray(inputSpec.doors)
    ? inputSpec.doors.map((d, index) => ({
        id: d.id || `door-${index + 1}`,
        qty: Math.max(1, parseInt(d.qty, 10) || 1),
        width: Math.max(12, Math.min(60, parseFloat(d.width) || 30)),
        height: Math.max(24, Math.min(120, parseFloat(d.height) || 80)),
        thickness: d.thickness || "1 3/4",
        visualProportions: {
          stileWidth: parseFloat(d.visualProportions?.stileWidth || d.settings?.stileWidth || 4.5),
          topRailWidth: parseFloat(d.visualProportions?.topRailWidth || d.settings?.topRailWidth || 4.5),
          lockRailWidth: parseFloat(d.visualProportions?.lockRailWidth || d.settings?.lockRailWidth || 5.5),
          intermediateRailWidth: parseFloat(
            d.visualProportions?.intermediateRailWidth || d.settings?.intermediateRailWidth || 5
          ),
          bottomRailWidth: parseFloat(d.visualProportions?.bottomRailWidth || d.settings?.bottomRailWidth || 8.75),
          heightToLockRail: parseFloat(
            d.visualProportions?.heightToLockRail || d.settings?.heightToLockRail || 36
          ),
        },
      }))
    : DEFAULT_PUBLIC_SPEC.doors;

  return {
    schemaVersion: SCHEMA_VERSION,
    doorHanding: inputSpec.doorHanding || "Unknown Handing",
    doorType: ["1 Panel", "2 Panel", "3 Panel"].includes(inputSpec.doorType) ? inputSpec.doorType : "2 Panel",
    doorTop: inputSpec.doorTop || "Square",
    panelSubstitution: inputSpec.panelSubstitution || "None",
    material: inputSpec.material || inputSpec.species || "Poplar",
    profile: inputSpec.profile || "Shaker",
    panel: inputSpec.panel || "Flat",
    jobName: String(inputSpec.jobName || "Custom Door Project").trim().slice(0, 100),
    species: inputSpec.material || inputSpec.species || "Poplar",
    finish: inputSpec.finish || "Raw",
    doors: safeDoors,
  };
};
