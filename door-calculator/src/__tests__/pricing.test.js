import { describe, it, expect } from "vitest";
import { calculateQuote, formatCents, parseDollarsToCents } from "../lib/pricingEngine";
import { DEFAULT_PRICE_BOOK } from "../lib/dataModels";

describe("Commercial Pricing Engine", () => {
  it("formats integer cents into formatted currency strings", () => {
    expect(formatCents(14500)).toBe("$145.00");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(19999)).toBe("$199.99");
  });

  it("parses dollars into integer cents", () => {
    expect(parseDollarsToCents(145.5)).toBe(14550);
    expect(parseDollarsToCents("$120.00")).toBe(12000);
    expect(parseDollarsToCents("")).toBe(0);
  });

  it("calculates multi-factor quote for 2-Panel Poplar door with Stain finish", () => {
    const doors = [{ id: "d1", qty: 1, width: 36, height: 96 }];
    const quote = calculateQuote({
      doors,
      doorType: "2 Panel",
      species: "Poplar",
      profile: "Shaker",
      finish: "Stain",
      priceBook: DEFAULT_PRICE_BOOK,
      prepOptions: { hingePrep: true, borePrep: false },
      markupPercentOverride: 25.0,
      taxRatePercentOverride: 6.0,
    });

    expect(quote.totalDoors).toBe(1);
    expect(quote.lineItems.length).toBeGreaterThanOrEqual(1);
    expect(quote.subtotalCents).toBeGreaterThan(0);
    expect(quote.taxCents).toBeGreaterThan(0);
    expect(quote.totalCents).toBe(quote.subtotalCents - quote.discountCents + quote.taxCents);
  });

  it("enforces minimum order charge when door subtotal is lower than minimum", () => {
    const smallDoor = [{ id: "d-small", qty: 1, width: 14, height: 24 }];
    const quote = calculateQuote({
      doors: smallDoor,
      doorType: "1 Panel",
      species: "Poplar",
      profile: "Shaker",
      finish: "Raw",
      priceBook: DEFAULT_PRICE_BOOK,
      prepOptions: { hingePrep: false, borePrep: false },
    });

    // Minimum order charge in default price book is 15000 ($150.00)
    expect(quote.subtotalCents).toBeGreaterThanOrEqual(15000);
  });
});
