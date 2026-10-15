/**
 * Specialized PDF Document Generator
 * 
 * Generates:
 * 1. Public Customer Spec Sheet PDF (Sanitized visual specifications & door schedule)
 * 2. Shop Cut-List PDF (Internal shop floor cut list & parts calculations)
 * 3. Commercial Quote PDF (Formal itemized commercial proposal with pricing and terms)
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatCents } from "./pricingEngine";
import { toFraction } from "../utils";

/**
 * Clean fraction text converter for PDF text rendering
 */
const fmtFraction = (val) => {
  if (val == null || val === "") return "";
  const frac = toFraction(val);
  if (!frac) return String(val);
  return frac.replace(/\|/g, " ");
};

// ==============================================================================
// 1. PUBLIC ARCHITECTURAL SPEC SHEET PDF
// ==============================================================================
export const generatePublicSpecPdf = async ({
  jobName = "Custom Door Project",
  doorType = "2 Panel",
  species = "Poplar",
  profile = "Shaker",
  finish = "Stain",
  doors = [],
  shareCode = "TC-XXXX",
  proportions = {},
}) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Standard Letter Portrait
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const teal = rgb(0 / 255, 166 / 255, 156 / 255);
  const darkStone = rgb(28 / 255, 25 / 255, 23 / 255);
  const midStone = rgb(120 / 255, 113 / 255, 108 / 255);
  const lightBg = rgb(245 / 255, 245 / 255, 244 / 255);

  let y = height - 50;

  // Header Banner
  page.drawRectangle({
    x: 40,
    y: y - 45,
    width: width - 80,
    height: 60,
    color: lightBg,
  });

  page.drawText("TRIM CHOICE — DOOR DESIGN SPECIFICATION", {
    x: 55,
    y: y - 10,
    size: 14,
    font: fontBold,
    color: teal,
  });

  page.drawText(`Share Code: ${shareCode}   •   Date: ${new Date().toLocaleDateString()}`, {
    x: 55,
    y: y - 30,
    size: 10,
    font: fontRegular,
    color: darkStone,
  });

  y -= 75;

  // Project Info Card
  page.drawText("Project Overview", {
    x: 40,
    y,
    size: 12,
    font: fontBold,
    color: darkStone,
  });
  y -= 18;

  const infoLines = [
    `Project / Job Name: ${jobName}`,
    `Door Style: ${doorType}      |      Species / Material: ${species}`,
    `Tooling Profile: ${profile}      |      Selected Finish: ${finish}`,
  ];

  infoLines.forEach((line) => {
    page.drawText(line, {
      x: 40,
      y,
      size: 10,
      font: fontRegular,
      color: darkStone,
    });
    y -= 16;
  });

  y -= 15;

  // Visible Proportions Box
  page.drawRectangle({
    x: 40,
    y: y - 55,
    width: width - 80,
    height: 70,
    color: rgb(250 / 255, 250 / 255, 249 / 255),
    borderColor: rgb(220 / 255, 215 / 255, 210 / 255),
    borderWidth: 1,
  });

  page.drawText("Nominal Visual Proportions", {
    x: 50,
    y: y + 2,
    size: 10,
    font: fontBold,
    color: darkStone,
  });

  const propText = `Stile Width: ${fmtFraction(proportions.stileWidth || 5)}"   |   Top Rail: ${fmtFraction(proportions.topRailWidth || 5)}"   |   Bottom Rail: ${fmtFraction(proportions.bottomRailWidth || 9)}"${
    doorType === "2 Panel"
      ? `   |   Lock Rail: ${fmtFraction(proportions.lockRailWidth || 6.25)}" (Center: ${fmtFraction(proportions.heightToLockRail || 36)}")`
      : doorType === "3 Panel"
      ? `   |   Intermediate Rails: ${fmtFraction(proportions.intermediateRailWidth || 5)}"`
      : ""
  }`;

  page.drawText(propText, {
    x: 50,
    y: y - 25,
    size: 9,
    font: fontRegular,
    color: midStone,
  });

  y -= 80;

  // Door Schedule Table
  page.drawText("Door Schedule & Quantities", {
    x: 40,
    y,
    size: 12,
    font: fontBold,
    color: darkStone,
  });
  y -= 20;

  // Table Header
  page.drawRectangle({
    x: 40,
    y: y - 6,
    width: width - 80,
    height: 22,
    color: darkStone,
  });

  page.drawText("#", { x: 55, y: y, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Width", { x: 100, y: y, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Height", { x: 180, y: y, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Door Style", { x: 260, y: y, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Quantity", { x: 420, y: y, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Total Sq Ft", { x: 490, y: y, size: 9, font: fontBold, color: rgb(1, 1, 1) });

  y -= 24;

  let totalQty = 0;
  let totalSqFt = 0;

  doors.forEach((door, index) => {
    const qty = parseInt(door.qty, 10) || 1;
    const w = parseFloat(door.width) || 36;
    const h = parseFloat(door.height) || 96;
    const sqFt = ((w * h) / 144) * qty;

    totalQty += qty;
    totalSqFt += sqFt;

    // Alternating row background
    if (index % 2 === 0) {
      page.drawRectangle({
        x: 40,
        y: y - 4,
        width: width - 80,
        height: 18,
        color: lightBg,
      });
    }

    page.drawText(String(index + 1), { x: 55, y, size: 9, font: fontRegular, color: darkStone });
    page.drawText(`${fmtFraction(w)}"`, { x: 100, y, size: 9, font: fontRegular, color: darkStone });
    page.drawText(`${fmtFraction(h)}"`, { x: 180, y, size: 9, font: fontRegular, color: darkStone });
    page.drawText(doorType, { x: 260, y, size: 9, font: fontRegular, color: darkStone });
    page.drawText(String(qty), { x: 440, y, size: 9, font: fontBold, color: darkStone });
    page.drawText(sqFt.toFixed(1) + " sq ft", { x: 490, y, size: 9, font: fontRegular, color: darkStone });

    y -= 20;
  });

  // Table Totals Footer
  page.drawRectangle({
    x: 40,
    y: y - 4,
    width: width - 80,
    height: 20,
    color: rgb(235 / 255, 235 / 255, 230 / 255),
  });

  page.drawText("TOTALS", { x: 55, y: y + 2, size: 9, font: fontBold, color: darkStone });
  page.drawText(`${totalQty} Doors`, { x: 430, y: y + 2, size: 9, font: fontBold, color: teal });
  page.drawText(`${totalSqFt.toFixed(1)} sq ft`, { x: 490, y: y + 2, size: 9, font: fontBold, color: darkStone });

  y -= 60;

  // Disclaimer / Instructions
  page.drawRectangle({
    x: 40,
    y: y - 40,
    width: width - 80,
    height: 50,
    color: rgb(240 / 255, 249 / 255, 248 / 255),
    borderColor: teal,
    borderWidth: 1,
  });

  page.drawText("How to Order with Trim Choice:", {
    x: 50,
    y: y - 4,
    size: 9,
    font: fontBold,
    color: teal,
  });

  page.drawText(
    `Provide Share Code "${shareCode}" to your Trim Choice sales representative or office.`,
    { x: 50, y: y - 18, size: 8.5, font: fontRegular, color: darkStone }
  );

  page.drawText(
    "Note: This is a public design specification. Authoritative cut formulas and pricing are prepared upon order confirmation.",
    { x: 50, y: y - 30, size: 8, font: fontOblique, color: midStone }
  );

  const pdfBytes = await pdfDoc.save();
  downloadBlob(pdfBytes, `TrimChoice_Spec_${shareCode}.pdf`);
};

// ==============================================================================
// 2. COMMERCIAL CUSTOMER QUOTE PDF
// ==============================================================================
export const generateQuotePdf = async ({
  quoteNumber = "QTE-2026-001",
  customerName = "Valued Customer",
  customerEmail = "",
  customerPhone = "",
  jobName = "Custom Door Project",
  doorType = "2 Panel",
  species = "Poplar",
  profile = "Shaker",
  finish = "Stain",
  quoteCalculation = {},
  terms = "Quote valid for 30 days. 50% deposit required upon confirmation.",
  validUntil = "",
}) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const teal = rgb(0 / 255, 166 / 255, 156 / 255);
  const darkStone = rgb(28 / 255, 25 / 255, 23 / 255);
  const lightBg = rgb(245 / 255, 245 / 255, 244 / 255);

  let y = height - 50;

  // Header Title
  page.drawText("TRIM CHOICE MILLWORK & DOORS", {
    x: 40,
    y,
    size: 16,
    font: fontBold,
    color: teal,
  });

  page.drawText("OFFICIAL QUOTE PROPOSAL", {
    x: width - 210,
    y,
    size: 12,
    font: fontBold,
    color: darkStone,
  });

  y -= 25;

  // Quote Metadata
  page.drawText(`Quote #: ${quoteNumber}`, { x: width - 210, y, size: 9, font: fontBold, color: darkStone });
  y -= 14;
  page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: width - 210, y, size: 9, font: fontRegular, color: darkStone });
  y -= 14;
  page.drawText(`Valid Until: ${validUntil || "30 Days"}`, { x: width - 210, y, size: 9, font: fontRegular, color: darkStone });
  y -= 14;
  page.drawText(`Price Book: ${quoteCalculation.priceBookVersion || "v1.0.0"}`, {
    x: width - 210,
    y,
    size: 8,
    font: fontOblique,
    color: rgb(120 / 255, 113 / 255, 108 / 255),
  });

  // Customer Information (Left side)
  const custY = height - 75;
  page.drawText("Prepared For:", { x: 40, y: custY, size: 10, font: fontBold, color: darkStone });
  page.drawText(customerName || "Customer", { x: 40, y: custY - 16, size: 10, font: fontBold, color: teal });
  if (customerEmail) page.drawText(customerEmail, { x: 40, y: custY - 30, size: 9, font: fontRegular, color: darkStone });
  if (customerPhone) page.drawText(customerPhone, { x: 40, y: custY - 44, size: 9, font: fontRegular, color: darkStone });
  page.drawText(`Project: ${jobName}`, { x: 40, y: custY - 58, size: 9, font: fontBold, color: darkStone });

  y = height - 170;

  // Line Items Table Header
  page.drawRectangle({
    x: 40,
    y: y - 6,
    width: width - 80,
    height: 22,
    color: darkStone,
  });

  page.drawText("#", { x: 48, y: y, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Description", { x: 70, y: y, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Qty", { x: 390, y: y, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Unit Price", { x: 440, y: y, size: 9, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Total", { x: 515, y: y, size: 9, font: fontBold, color: rgb(1, 1, 1) });

  y -= 24;

  const items = quoteCalculation.lineItems || [];
  items.forEach((item, index) => {
    if (index % 2 === 0) {
      page.drawRectangle({
        x: 40,
        y: y - 4,
        width: width - 80,
        height: 18,
        color: lightBg,
      });
    }

    page.drawText(String(item.lineNumber || index + 1), { x: 48, y, size: 8.5, font: fontRegular, color: darkStone });
    
    // Shorten long descriptions to avoid overlapping columns
    const safeDesc = String(item.description || "").slice(0, 52);
    page.drawText(safeDesc, { x: 70, y, size: 8.5, font: fontRegular, color: darkStone });
    page.drawText(String(item.qty), { x: 395, y, size: 8.5, font: fontRegular, color: darkStone });
    page.drawText(formatCents(item.unitPriceCents), { x: 440, y, size: 8.5, font: fontRegular, color: darkStone });
    page.drawText(formatCents(item.totalPriceCents), { x: 515, y, size: 8.5, font: fontBold, color: darkStone });

    y -= 20;
  });

  y -= 10;

  // Financial Totals Summary Box
  const totalsBoxWidth = 220;
  const totalsBoxX = width - 40 - totalsBoxWidth;

  page.drawRectangle({
    x: totalsBoxX,
    y: y - 90,
    width: totalsBoxWidth,
    height: 95,
    color: lightBg,
    borderColor: rgb(215 / 255, 210 / 255, 205 / 255),
    borderWidth: 1,
  });

  let totY = y - 16;
  page.drawText("Subtotal:", { x: totalsBoxX + 15, y: totY, size: 9, font: fontRegular, color: darkStone });
  page.drawText(formatCents(quoteCalculation.subtotalCents), {
    x: totalsBoxX + totalsBoxWidth - 75,
    y: totY,
    size: 9,
    font: fontRegular,
    color: darkStone,
  });

  totY -= 16;
  if (quoteCalculation.discountCents > 0) {
    page.drawText("Discount:", { x: totalsBoxX + 15, y: totY, size: 9, font: fontRegular, color: darkStone });
    page.drawText(`-${formatCents(quoteCalculation.discountCents)}`, {
      x: totalsBoxX + totalsBoxWidth - 75,
      y: totY,
      size: 9,
      font: fontRegular,
      color: darkStone,
    });
    totY -= 16;
  }

  page.drawText(`Estimated Tax (${quoteCalculation.taxRatePercent || 6}%):`, {
    x: totalsBoxX + 15,
    y: totY,
    size: 9,
    font: fontRegular,
    color: darkStone,
  });
  page.drawText(formatCents(quoteCalculation.taxCents), {
    x: totalsBoxX + totalsBoxWidth - 75,
    y: totY,
    size: 9,
    font: fontRegular,
    color: darkStone,
  });

  totY -= 20;
  page.drawText("TOTAL PROPOSAL:", { x: totalsBoxX + 15, y: totY, size: 10, font: fontBold, color: teal });
  page.drawText(formatCents(quoteCalculation.totalCents), {
    x: totalsBoxX + totalsBoxWidth - 75,
    y: totY,
    size: 11,
    font: fontBold,
    color: teal,
  });

  y -= 120;

  // Terms & Acceptance Box
  page.drawText("Terms & Conditions:", { x: 40, y, size: 9, font: fontBold, color: darkStone });
  y -= 14;
  page.drawText(terms, { x: 40, y, size: 8, font: fontRegular, color: darkStone });
  y -= 30;

  // Signature lines
  page.drawText("Authorized Signature: ___________________________    Date: ____________", {
    x: 40,
    y,
    size: 9,
    font: fontRegular,
    color: darkStone,
  });

  const pdfBytes = await pdfDoc.save();
  downloadBlob(pdfBytes, `TrimChoice_Quote_${quoteNumber}.pdf`);
};

// ==============================================================================
// 3. SHOP CUT-LIST PDF
// ==============================================================================
export const generateShopCutListPdf = async ({
  jobCode = "JOB-2026-001",
  jobName = "Shop Job",
  doorType = "2 Panel",
  species = "Poplar",
  profile = "Shaker",
  finish = "Stain",
  parts = {},
  notes = "",
}) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const darkStone = rgb(28 / 255, 25 / 255, 23 / 255);
  const teal = rgb(0 / 255, 166 / 255, 156 / 255);
  const lightBg = rgb(245 / 255, 245 / 255, 244 / 255);

  let y = height - 45;

  page.drawText(`TRIM CHOICE SHOP CUT LIST — ${jobCode}`, {
    x: 40,
    y,
    size: 14,
    font: fontBold,
    color: teal,
  });

  y -= 18;
  page.drawText(`Job: ${jobName}   •   Style: ${doorType}   •   Species: ${species}   •   Profile: ${profile}`, {
    x: 40,
    y,
    size: 9.5,
    font: fontRegular,
    color: darkStone,
  });

  y -= 25;

  // 1. Stiles Table
  page.drawText("STILES (CUT DIMENSIONS)", { x: 40, y, size: 10, font: fontBold, color: darkStone });
  y -= 16;
  page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 18, color: darkStone });
  page.drawText("Qty", { x: 50, y, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Dimensions (Thickness x Width x Length)", { x: 120, y, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  y -= 18;

  (parts.stiles || []).forEach((row) => {
    page.drawText(String(row.qty), { x: 50, y, size: 8.5, font: fontBold, color: darkStone });
    page.drawText(`${fmtFraction(row.thickness)}" x ${fmtFraction(row.width)}" x ${fmtFraction(row.length)}"`, {
      x: 120,
      y,
      size: 8.5,
      font: fontRegular,
      color: darkStone,
    });
    y -= 16;
  });

  y -= 10;

  // 2. Rails Table
  page.drawText("RAILS (CUT DIMENSIONS)", { x: 40, y, size: 10, font: fontBold, color: darkStone });
  y -= 16;
  page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 18, color: darkStone });
  page.drawText("Qty", { x: 50, y, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Part Type & Cut Dimensions", { x: 120, y, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  y -= 18;

  // Top Rails
  (parts.rails || []).forEach((row) => {
    page.drawText(String(row.qty), { x: 50, y, size: 8.5, font: fontBold, color: darkStone });
    page.drawText(`Top Rail: ${fmtFraction(row.thickness)}" x ${fmtFraction(row.width)}" x ${fmtFraction(row.length)}"`, {
      x: 120,
      y,
      size: 8.5,
      font: fontRegular,
      color: darkStone,
    });
    y -= 16;
  });

  // Middle / Lock Rails
  (parts.middleRails || []).forEach((row) => {
    page.drawText(String(row.qty), { x: 50, y, size: 8.5, font: fontBold, color: darkStone });
    page.drawText(`Middle/Lock Rail: ${fmtFraction(row.thickness)}" x ${fmtFraction(row.width)}" x ${fmtFraction(row.length)}"`, {
      x: 120,
      y,
      size: 8.5,
      font: fontRegular,
      color: darkStone,
    });
    y -= 16;
  });

  // Bottom Rails
  (parts.bottomRails || []).forEach((row) => {
    page.drawText(String(row.qty), { x: 50, y, size: 8.5, font: fontBold, color: darkStone });
    page.drawText(`Bottom Rail: ${fmtFraction(row.thickness)}" x ${fmtFraction(row.width)}" x ${fmtFraction(row.length)}"`, {
      x: 120,
      y,
      size: 8.5,
      font: fontRegular,
      color: darkStone,
    });
    y -= 16;
  });

  y -= 10;

  // 3. Panels Table
  page.drawText("PANELS (CUT DIMENSIONS)", { x: 40, y, size: 10, font: fontBold, color: darkStone });
  y -= 16;
  page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 18, color: darkStone });
  page.drawText("Qty", { x: 50, y, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Section & Dimensions (Width x Height)", { x: 120, y, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  y -= 18;

  (parts.panels || []).forEach((group) => {
    (group.items || []).forEach((item) => {
      page.drawText(String(item.qty), { x: 50, y, size: 8.5, font: fontBold, color: darkStone });
      page.drawText(`${item.label || group.section} Panel: ${fmtFraction(item.width)}" x ${fmtFraction(item.height)}"`, {
        x: 120,
        y,
        size: 8.5,
        font: fontRegular,
        color: darkStone,
      });
      y -= 16;
    });
  });

  if (notes) {
    y -= 15;
    page.drawText("Production Notes:", { x: 40, y, size: 9, font: fontBold, color: darkStone });
    y -= 14;
    page.drawText(notes, { x: 40, y, size: 8.5, font: fontRegular, color: darkStone });
  }

  const pdfBytes = await pdfDoc.save();
  downloadBlob(pdfBytes, `ShopCutList_${jobCode}.pdf`);
};

const downloadBlob = (bytes, filename) => {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
