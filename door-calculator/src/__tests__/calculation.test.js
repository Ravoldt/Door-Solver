import { describe, it, expect } from "vitest";
import { calculateShopParts } from "../lib/calculationEngine";
import { DEFAULT_PRODUCTION_PRESETS } from "../lib/dataModels";

describe("Authoritative Shop Parts Calculation Engine", () => {
  it("calculates 1-Panel Shaker door correctly", () => {
    const doors = [
      {
        id: "d1",
        qty: 1,
        width: 36,
        height: 96,
        visualProportions: {
          stileWidth: 5,
          topRailWidth: 5,
          bottomRailWidth: 9,
        },
      },
    ];

    const result = calculateShopParts(doors, DEFAULT_PRODUCTION_PRESETS, "1 Panel", "Shaker");

    // Stiles: 2 qty, length = 96 + (0.125 * 2) = 96.25, width = 5 + 0.125 + 0.0625 = 5.1875
    expect(result.stiles.length).toBe(1);
    expect(result.stiles[0].qty).toBe(2);
    expect(result.stiles[0].length).toBe(96.25);
    expect(result.stiles[0].width).toBe(5.1875);

    // Rails: Top rail width = 5 + 0.125 + 0.0625 = 5.1875, length = 36 - 10 + 3 = 29
    expect(result.rails.length).toBe(1);
    expect(result.rails[0].qty).toBe(1);
    expect(result.rails[0].length).toBe(29);
    expect(result.rails[0].width).toBe(5.1875);

    // Bottom Rail: width = 9 + 0.125 + 0.0625 = 9.1875, length = 29
    expect(result.bottomRails.length).toBe(1);
    expect(result.bottomRails[0].length).toBe(29);
    expect(result.bottomRails[0].width).toBe(9.1875);

    // Panel: Width = 36 - 10 + 3 - 0.5 = 28.5
    expect(result.panels.length).toBe(1);
    expect(result.panels[0].items[0].width).toBe(28.5);
  });

  it("calculates 2-Panel Shaker door with lock rail and upper/lower panels", () => {
    const doors = [
      {
        id: "d2",
        qty: 2,
        width: 36,
        height: 96,
        visualProportions: {
          stileWidth: 5,
          topRailWidth: 5,
          lockRailWidth: 6.25,
          bottomRailWidth: 9,
          heightToLockRail: 36,
        },
      },
    ];

    const result = calculateShopParts(doors, DEFAULT_PRODUCTION_PRESETS, "2 Panel", "Shaker");

    // 2 doors => 4 stiles
    expect(result.stiles[0].qty).toBe(4);
    expect(result.stiles[0].length).toBe(96.25);

    // Lock rail: inside cut = 6.25 + 2 * 0.0625 = 6.375
    expect(result.middleRails.length).toBe(1);
    expect(result.middleRails[0].qty).toBe(2);
    expect(result.middleRails[0].width).toBe(6.375);
    expect(result.middleRails[0].length).toBe(29);

    // Panels: Upper and lower
    const upperGroup = result.panels.find((p) => p.section === "upper");
    const lowerGroup = result.panels.find((p) => p.section === "lower");
    expect(upperGroup).toBeDefined();
    expect(lowerGroup).toBeDefined();
    expect(upperGroup.items[0].qty).toBe(2);
    expect(lowerGroup.items[0].qty).toBe(2);
  });

  it("applies Ovolo tooling rules accurately", () => {
    const doors = [
      {
        id: "d3",
        qty: 1,
        width: 36,
        height: 96,
        visualProportions: {
          stileWidth: 5,
          topRailWidth: 5,
          lockRailWidth: 6.25,
          bottomRailWidth: 9,
          heightToLockRail: 36,
        },
      },
    ];

    const result = calculateShopParts(doors, DEFAULT_PRODUCTION_PRESETS, "2 Panel", "Ovolo");

    // Stile width with Ovolo: nominal 5 + outsideTrim(0.125) + profileTrim(0.03125) = 5.15625
    expect(result.stiles[0].width).toBe(5.15625);
    expect(result.stiles[0].length).toBe(96.25);
  });
});
