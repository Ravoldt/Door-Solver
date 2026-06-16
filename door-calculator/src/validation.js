export const validateDoor = (door, settings, doorType) => {
  const errors = [];
  const warnings = [];

  const width = Number(door.width);
  const height = Number(door.height);
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return { errors, warnings };
  }

  const {
    stileWidth,
    topRailWidth,
    bottomRailWidth,
    lockRailWidth,
    heightToLockRail,
  } = settings;

  // 1. Stiles Width validation
  if (stileWidth * 2 >= width) {
    errors.push({
      field: "stileWidth",
      message: `Stile width (${stileWidth}") must be less than half of the door width (${width}"). Both stiles combined (${stileWidth * 2}") cannot exceed or equal the door width.`
    });
  } else if (stileWidth * 3 > width) {
    warnings.push({
      field: "stileWidth",
      message: `Stile width (${stileWidth}") is large for the door width (${width}").`
    });
  }

  // 2. Lock Rail validation (only for 2 Panel doors)
  if (doorType === "2 Panel") {
    const lockWidth = Number(lockRailWidth) || 0;
    const topWidth = Number(topRailWidth) || 0;
    const botWidth = Number(bottomRailWidth) || 0;
    const lockHt = Number(heightToLockRail) || 0;

    // Hard errors:
    if (lockHt <= 0 || lockHt >= height) {
      errors.push({
        field: "heightToLockRail",
        message: `Lock rail height (${lockHt}") must be inside the door height (${height}").`
      });
    } else {
      // Top Rail boundary check
      const topBoundary = height - lockHt - lockWidth / 2;
      if (topBoundary <= topWidth) {
        errors.push({
          field: "heightToLockRail",
          message: `Lock rail touches or clips into the top rail.`
        });
      } else {
        // Distance to top rail
        const distTop = topBoundary - topWidth;
        const minTopWidth = Math.min(lockWidth, topWidth);
        if (distTop < minTopWidth) {
          warnings.push({
            field: "heightToLockRail",
            message: `Distance between lock rail and top rail (${distTop}") is less than the narrower rail width (${minTopWidth}").`
          });
        }
      }

      // Bottom Rail boundary check
      const bottomBoundary = lockHt - lockWidth / 2;
      if (bottomBoundary <= botWidth) {
        errors.push({
          field: "heightToLockRail",
          message: `Lock rail touches or clips into the bottom rail.`
        });
      } else {
        // Distance to bottom rail
        const distBottom = bottomBoundary - botWidth;
        const minBottomWidth = Math.min(lockWidth, botWidth);
        if (distBottom < minBottomWidth) {
          warnings.push({
            field: "heightToLockRail",
            message: `Distance between lock rail and bottom rail (${distBottom}") is less than the narrower rail width (${minBottomWidth}").`
          });
        }
      }
    }
  }

  // 3. Intermediate Rails validation (only for 3 Panel doors)
  if (doorType === "3 Panel") {
    const interWidth = Number(settings.intermediateRailWidth) || 0;
    const topWidth = Number(topRailWidth) || 0;
    const botWidth = Number(bottomRailWidth) || 0;
    const availableSpace = height - topWidth - botWidth - 2 * interWidth;

    if (availableSpace <= 0) {
      errors.push({
        field: "intermediateRailWidth",
        message: `Intermediate rails are too wide or door height is too small. Rail parts clip or overlap.`
      });
    } else {
      const panelHeight = availableSpace / 3;
      const minTopWidth = Math.min(interWidth, topWidth);
      const minBotWidth = Math.min(interWidth, botWidth);
      const minRailWidth = Math.min(minTopWidth, minBotWidth);
      if (panelHeight < minRailWidth) {
        warnings.push({
          field: "intermediateRailWidth",
          message: `Distance between intermediate rails (${panelHeight.toFixed(3)}") is less than the narrower rail width (${minRailWidth}").`
        });
      }
    }
  }

  return { errors, warnings };
};
