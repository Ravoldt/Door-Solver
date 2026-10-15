/**
 * Multi-Factor Commercial Pricing & Quoting Engine
 * 
 * Computes exact itemized quote totals based on versioned price books.
 * All monetary calculations use exact integer cents to eliminate floating point issues.
 */

import { DEFAULT_PRICE_BOOK } from "./dataModels";

/**
 * Format integer cents into formatted USD currency string (e.g. 14500 -> "$145.00")
 */
export const formatCents = (cents = 0) => {
  const safeCents = Number.isFinite(cents) ? Math.round(cents) : 0;
  const isNegative = safeCents < 0;
  const absDollars = (Math.abs(safeCents) / 100).toFixed(2);
  return `${isNegative ? "-" : ""}$${absDollars}`;
};

/**
 * Parses a dollar string or number into integer cents ($145.50 -> 14550)
 */
export const parseDollarsToCents = (val) => {
  if (val == null || val === "") return 0;
  const clean = String(val).replace(/[^0-9.-]/g, "");
  const num = parseFloat(clean);
  return Number.isNaN(num) ? 0 : Math.round(num * 100);
};

/**
 * Calculates a complete itemized quote from job doors and price book rules.
 *
 * @param {Object} params
 * @param {Array} params.doors - Door items (width, height, qty)
 * @param {string} params.doorType - "1 Panel" | "2 Panel" | "3 Panel"
 * @param {string} params.species - Wood species
 * @param {string} params.profile - "Shaker" | "Ovolo"
 * @param {string} params.finish - "Raw" | "Primer" | "Stain" | "Paint"
 * @param {Object} params.priceBook - Versioned price book object (defaults to DEFAULT_PRICE_BOOK)
 * @param {Object} params.prepOptions - { hingePrep: boolean, borePrep: boolean }
 * @param {Array} params.customItems - Optional manual line items [{ description, qty, unitPriceCents }]
 * @param {number} params.discountCents - Discount in cents
 * @param {number} params.markupPercentOverride - Custom markup %
 * @param {number} params.taxRatePercentOverride - Custom tax %
 * @returns {Object} Complete calculated quote object with line items and exact totals
 */
export const calculateQuote = ({
  doors = [],
  doorType = "2 Panel",
  species = "Poplar",
  profile = "Shaker",
  finish = "Stain",
  priceBook = DEFAULT_PRICE_BOOK,
  prepOptions = { hingePrep: false, borePrep: false },
  customItems = [],
  discountCents = 0,
  markupPercentOverride = null,
  taxRatePercentOverride = null,
} = {}) => {
  const rules = priceBook?.rules || DEFAULT_PRICE_BOOK.rules;
  const baseRate = rules.baseStyleRatesCents?.[doorType] ?? 14500;
  const speciesSqFtRate = rules.speciesSqFtRateCents?.[species] ?? 650;
  const profileAddon = rules.profileAddonCents?.[profile] ?? 0;
  const finishAddon = rules.finishAddonCents?.[finish] ?? 6500;
  const hingePrepFee = prepOptions.hingePrep ? (rules.prepFeesCents?.hingePrep ?? 1800) : 0;
  const borePrepFee = prepOptions.borePrep ? (rules.prepFeesCents?.borePrep ?? 1200) : 0;

  const markupPercent = markupPercentOverride ?? rules.defaultMarkupPercent ?? 25.0;
  const taxRatePercent = taxRatePercentOverride ?? rules.defaultTaxRatePercent ?? 6.0;

  const lineItems = [];
  let lineNumber = 1;
  let runningCostCents = 0;

  // 1. Calculate each door line item
  doors.forEach((door, idx) => {
    const qty = Math.max(1, parseInt(door.qty, 10) || 1);
    const width = parseFloat(door.width) || 36;
    const height = parseFloat(door.height) || 96;
    const sqFt = (width * height) / 144;

    // Lumber material cost
    const materialCostCents = Math.round(sqFt * speciesSqFtRate);

    // Oversize surcharge
    const isOversize = height > 96 || width > 36;
    const oversizeSurcharge = isOversize ? (rules.prepFeesCents?.oversizeSurcharge ?? 2500) : 0;

    // Base door unit price (cost base)
    const unitCostCents =
      baseRate +
      materialCostCents +
      profileAddon +
      finishAddon +
      hingePrepFee +
      borePrepFee +
      oversizeSurcharge;

    // Apply markup
    const markupMultiplier = 1 + markupPercent / 100;
    const unitPriceCents = Math.round(unitCostCents * markupMultiplier);
    const totalPriceCents = unitPriceCents * qty;

    runningCostCents += unitCostCents * qty;

    const descDetails = [
      `${width}"W x ${height}"H ${doorType}`,
      species,
      profile,
      finish !== "Raw" ? `${finish} finish` : null,
      prepOptions.hingePrep ? "Hinged" : null,
      prepOptions.borePrep ? "Bored" : null,
      isOversize ? "Oversize" : null,
    ]
      .filter(Boolean)
      .join(", ");

    lineItems.push({
      lineNumber: lineNumber++,
      itemType: "door",
      description: `Door #${idx + 1}: ${descDetails}`,
      qty,
      unitPriceCents,
      totalPriceCents,
      specData: {
        doorIndex: idx,
        width,
        height,
        sqFt: parseFloat(sqFt.toFixed(2)),
        doorType,
        species,
        profile,
        finish,
        unitCostCents,
      },
    });
  });

  // 2. Add custom line items if any
  customItems.forEach((cItem) => {
    const qty = Math.max(1, parseInt(cItem.qty, 10) || 1);
    const unitPriceCents = Math.round(Number(cItem.unitPriceCents) || 0);
    const totalPriceCents = unitPriceCents * qty;

    lineItems.push({
      lineNumber: lineNumber++,
      itemType: "custom",
      description: cItem.description || "Custom Job Service",
      qty,
      unitPriceCents,
      totalPriceCents,
      specData: {},
    });
  });

  // 3. Totals calculation
  const itemsSubtotalCents = lineItems.reduce((acc, item) => acc + item.totalPriceCents, 0);
  const minOrderCents = rules.minimumOrderChargeCents ?? 15000;

  let finalSubtotalCents = itemsSubtotalCents;
  let minOrderAdjustmentCents = 0;

  if (doors.length > 0 && finalSubtotalCents < minOrderCents) {
    minOrderAdjustmentCents = minOrderCents - finalSubtotalCents;
    finalSubtotalCents = minOrderCents;
    lineItems.push({
      lineNumber: lineNumber++,
      itemType: "custom",
      description: `Minimum Order Adjustment (Min: ${formatCents(minOrderCents)})`,
      qty: 1,
      unitPriceCents: minOrderAdjustmentCents,
      totalPriceCents: minOrderAdjustmentCents,
      specData: { minOrderCents },
    });
  }

  const safeDiscountCents = Math.min(finalSubtotalCents, Math.max(0, Math.round(discountCents)));
  const taxableSubtotalCents = finalSubtotalCents - safeDiscountCents;
  const taxCents = Math.round((taxableSubtotalCents * taxRatePercent) / 100);
  const totalCents = taxableSubtotalCents + taxCents;

  return {
    priceBookId: priceBook.id,
    priceBookVersion: priceBook.version,
    priceBookName: priceBook.name,
    markupPercent,
    taxRatePercent,
    lineItems,
    subtotalCents: finalSubtotalCents,
    discountCents: safeDiscountCents,
    taxCents,
    totalCents,
    totalDoors: doors.reduce((acc, d) => acc + (parseInt(d.qty, 10) || 0), 0),
  };
};
