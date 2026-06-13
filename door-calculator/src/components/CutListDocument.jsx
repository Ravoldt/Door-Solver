import { Fragment } from "react";
import { toFraction } from "../utils";

const printBorderClassName = "border-stone-900";
const tableClassName = `w-full border-collapse border-2 ${printBorderClassName}`;
const cellClassName = `border ${printBorderClassName}`;
const headerRowClassName = "bg-stone-200";
const dividerRowClassName = "bg-stone-200 h-2";

const renderEmptyRows = (count, prefix) =>
  Array.from({ length: count }, (_, index) => (
    <tr key={`${prefix}-${index}`}>
      <td className={`${cellClassName} p-4`}></td>
      <td className={cellClassName}></td>
    </tr>
  ));

const renderFraction = (str) => {
  if (!str) return "";
  const [base, superText] = str.split("|");
  if (!superText) return base;
  const cleanBase = base.replace(/"$/, "");
  return (
    <span>
      {cleanBase}
      <sup className="text-[10px] font-normal text-stone-500 leading-none">{superText}</sup>"
    </span>
  );
};

const formatLumberSize = (row) => (
  <span>
    {renderFraction(toFraction(row.thickness))} x {renderFraction(toFraction(row.width))} x {renderFraction(toFraction(row.length))}
  </span>
);
const formatPanelSize = (row) => (
  <span>
    {renderFraction(toFraction(row.width))} x {renderFraction(toFraction(row.height))}
  </span>
);
const formatDoorSize = (row) => (
  <span>
    {renderFraction(toFraction(row.width))} x {renderFraction(toFraction(row.height))}
  </span>
);

const computeLayout = (data, doorType) => {
  const sCount = data.stiles.length;
  const pGroups = data.panels;
  const pCount = pGroups.reduce((sum, g) => sum + g.items.length, 0);
  const rCount = data.rails.length;
  const mCount = doorType !== "1 Panel" ? data.middleRails.length : 0;
  const bCount = data.bottomRails.length;
  const dCount = data.doorSummaries.length;

  const ROW_H = 37;
  const HEADER_H = 30;
  const DIVIDER_H = 8;
  const TABLE_BORDER_H = 5;
  const GAP_H = 24;
  const DOOR_ROW_H = 44;
  const NOTES_BOX_H = 120;
  const PAGE_CONTENT_LIMIT = 800;

  const getStilesHeight = (emptyCount) => {
    if (sCount === 0 && emptyCount === 0) return 0;
    return HEADER_H + sCount * ROW_H + emptyCount * ROW_H + TABLE_BORDER_H;
  };

  const getPanelsHeight = (emptyCount) => {
    if (pCount === 0 && emptyCount === 0) return 0;
    const dividerCount = Math.max(0, pGroups.length - 1);
    return HEADER_H + pCount * ROW_H + dividerCount * DIVIDER_H + emptyCount * ROW_H + TABLE_BORDER_H;
  };

  const getRailsHeight = (emptyCount) => {
    const hasRails = rCount > 0 || mCount > 0 || bCount > 0 || emptyCount > 0;
    if (!hasRails) return 0;
    
    let height = HEADER_H;
    height += rCount * ROW_H;
    
    if (doorType !== "1 Panel") {
      height += DIVIDER_H;
      height += mCount * ROW_H;
    }
    
    height += DIVIDER_H;
    height += bCount * ROW_H;
    
    height += emptyCount * ROW_H;
    height += TABLE_BORDER_H;
    return height;
  };

  const doorSizesHeight = HEADER_H + dCount * DOOR_ROW_H + TABLE_BORDER_H;
  const notesHeight = NOTES_BOX_H;

  const maxStiles = 3;
  const maxPanels = Math.max(0, 4 - pCount);
  const maxRails = 5;

  const states = [];
  for (let s = 0; s <= maxStiles; s++) {
    for (let p = 0; p <= maxPanels; p++) {
      for (let r = 0; r <= maxRails; r++) {
        states.push({ s, p, r });
      }
    }
  }
  states.sort((a, b) => (b.s + b.p + b.r) - (a.s + a.p + a.r));

  const options = [
    { name: "all_page_1", doorSizesPage: 1, notesPage: 1 },
    { name: "notes_page_2", doorSizesPage: 1, notesPage: 2 },
    { name: "both_page_2", doorSizesPage: 2, notesPage: 2 }
  ];

  for (const option of options) {
    for (const state of states) {
      const { s, p, r } = state;
      const sHeight = getStilesHeight(s);
      const pHeight = getPanelsHeight(p);
      const rHeight = getRailsHeight(r);

      const col1Base = sHeight + pHeight + (sHeight > 0 && pHeight > 0 ? GAP_H : 0);
      const col2Base = rHeight;

      let col1Height = col1Base;
      let col2Height = col2Base;
      let doorSizesCol = null;
      let notesCol = null;

      if (option.doorSizesPage === 1 && option.notesPage === 1) {
        if (col1Base <= col2Base) {
          doorSizesCol = 1;
          notesCol = 2;
          col1Height = col1Base + (col1Base > 0 ? GAP_H : 0) + doorSizesHeight;
          col2Height = col2Base + (col2Base > 0 ? GAP_H : 0) + notesHeight;
        } else {
          doorSizesCol = 2;
          notesCol = 1;
          col1Height = col1Base + (col1Base > 0 ? GAP_H : 0) + notesHeight;
          col2Height = col2Base + (col2Base > 0 ? GAP_H : 0) + doorSizesHeight;
        }
      } else if (option.doorSizesPage === 1 && option.notesPage === 2) {
        if (col1Base <= col2Base) {
          doorSizesCol = 1;
          col1Height = col1Base + (col1Base > 0 ? GAP_H : 0) + doorSizesHeight;
        } else {
          doorSizesCol = 2;
          col2Height = col2Base + (col2Base > 0 ? GAP_H : 0) + doorSizesHeight;
        }
      }

      if (Math.max(col1Height, col2Height) <= PAGE_CONTENT_LIMIT) {
        return {
          doorSizesPage: option.doorSizesPage,
          notesPage: option.notesPage,
          doorSizesCol,
          notesCol,
          emptyStiles: s,
          emptyPanels: p,
          emptyRails: r
        };
      }
    }
  }

  return {
    doorSizesPage: 2,
    notesPage: 2,
    doorSizesCol: 1,
    notesCol: 2,
    emptyStiles: 0,
    emptyPanels: 0,
    emptyRails: 0
  };
};

const CutListDocument = ({ data, doorType, jobName, species, profile, finish }) => {
  const totalQty = data.doorSummaries.reduce((sum, d) => sum + d.qty, 0);
  const styleName = (doorType || "")
    .replace(/\b1\b/gi, "one")
    .replace(/\b2\b/gi, "two")
    .replace(/\b3\b/gi, "three")
    .replace(/\b4\b/gi, "four");

  const toTitleCase = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formattedFinish = finish ? `${toTitleCase(finish)} Grade` : "";
  const formattedSpecies = toTitleCase(species);
  const formattedStyle = `${toTitleCase(styleName)} ${toTitleCase(profile)}`;

  const subtitle = `Qty: ${totalQty} | Finish: ${formattedFinish} | Species: ${formattedSpecies} | Style: ${formattedStyle}`;

  const layout = computeLayout(data, doorType);
  const hasPage2 = layout.doorSizesPage === 2 || layout.notesPage === 2;

  const renderDoorSizesBox = () => (
    <section>
      <table className={tableClassName}>
        <thead>
          <tr className="bg-stone-900 text-white">
            <th className={`${cellClassName} p-1 w-12 text-sm`}>Qty.</th>
            <th className={`${cellClassName} p-1 text-sm uppercase tracking-widest`}>Door Size</th>
          </tr>
        </thead>
        <tbody>
          {data.doorSummaries.map((row, index) => (
            <tr key={`door-summary-${index}`}>
              <td className={`${cellClassName} p-2 text-center font-bold`}>{row.qty}</td>
              <td className={`${cellClassName} p-2 text-center font-black text-lg`}>{formatDoorSize(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );

  const renderNotesBox = () => (
    <div className="h-[120px] flex flex-col">
      <span className="text-sm font-bold uppercase tracking-wider text-stone-900">Notes</span>
      <div className="flex-grow"></div>
    </div>
  );

  const renderHeader = (pageNum) => (
    <div className={`mb-6 border-b-4 ${printBorderClassName} pb-2 flex justify-between items-end`}>
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tighter mb-1">{jobName}</h1>
        <div className="text-sm font-bold tracking-wider text-stone-700">
          {subtitle}
        </div>
      </div>
      {hasPage2 && (
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500 pb-1">
          Page {pageNum} of 2
        </span>
      )}
    </div>
  );

  const renderFooter = () => (
    <div className={`mt-auto text-[10px] text-stone-500 border-t ${printBorderClassName} pt-2 flex justify-between`}>
      <span>Generated via doorsolver.app</span>
      <span>Date: {new Date().toLocaleDateString()}</span>
    </div>
  );

  const pageClassName = (isFirst) => `
    w-[8.5in] h-[11in] p-[0.5in] box-border bg-white shadow-2xl flex flex-col 
    print:shadow-none print:w-full print:h-[10in] print:min-h-[10in] print:p-0 print:mx-0 print:my-0
    ${isFirst && hasPage2 ? "break-after-page print:break-after-page" : ""}
  `.trim().replace(/\s+/g, " ");

  return (
    <div className="flex flex-col items-center gap-8 print:gap-0 print:block w-full">
      {/* PAGE 1 */}
      <div className={pageClassName(true)}>
        {renderHeader(1)}

        <div className="grid grid-cols-2 gap-8 flex-grow">
          {/* Column 1 (Left) */}
          <div className="space-y-6">
            <section>
              <table className={tableClassName}>
                <thead>
                  <tr className={headerRowClassName}>
                    <th className={`${cellClassName} p-1 w-12 text-sm`}>Qty.</th>
                    <th className={`${cellClassName} p-1 text-sm`}>Stiles</th>
                  </tr>
                </thead>
                <tbody>
                  {data.stiles.map((row, index) => (
                    <tr key={`side-rail-${index}`}>
                      <td className={`${cellClassName} p-2 text-center font-bold`}>{row.qty}</td>
                      <td className={`${cellClassName} p-2 text-center`}>{formatLumberSize(row)}</td>
                    </tr>
                  ))}
                  {renderEmptyRows(layout.emptyStiles, "empty-side-rail")}
                </tbody>
              </table>
            </section>

            <section>
              <table className={tableClassName}>
                <thead>
                  <tr className={headerRowClassName}>
                    <th className={`${cellClassName} p-1 w-12 text-sm`}>Qty.</th>
                    <th className={`${cellClassName} p-1 text-sm`}>Panels {doorType === "2 Panel" && "(Upper / Lower)"}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.panels.map((group, groupIndex) => (
                    <Fragment key={group.section}>
                      {groupIndex > 0 && (
                        <tr className="bg-stone-100 h-2">
                          <td colSpan="2" className={cellClassName}></td>
                        </tr>
                      )}
                      {group.items.map((row, index) => (
                        <tr key={`${group.section}-${index}`}>
                          <td className={`${cellClassName} p-2 text-center font-bold`}>{row.qty}</td>
                          <td className={`${cellClassName} p-2 text-center`}>
                            {formatPanelSize(row)}{" "}
                            {row.label && <span className="text-[10px] text-stone-600">{row.label}</span>}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                  {renderEmptyRows(layout.emptyPanels, "empty-panel")}
                </tbody>
              </table>
            </section>

            {layout.doorSizesPage === 1 && layout.doorSizesCol === 1 && renderDoorSizesBox()}
            {layout.notesPage === 1 && layout.notesCol === 1 && renderNotesBox()}
          </div>

          {/* Column 2 (Right) */}
          <div className="space-y-6">
            <section>
              <table className={tableClassName}>
                <thead>
                  <tr className={headerRowClassName}>
                    <th className={`${cellClassName} p-1 w-12 text-sm`}>Qty.</th>
                    <th className={`${cellClassName} p-1 text-sm`}>Rails</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rails.map((row, index) => (
                    <tr key={`top-stile-${index}`}>
                      <td className={`${cellClassName} p-2 text-center font-bold`}>{row.qty}</td>
                      <td className={`${cellClassName} p-2 text-center`}>
                        {formatLumberSize(row)}{" "}
                        <span className="text-[10px] text-stone-500 block sm:inline">(Top)</span>
                      </td>
                    </tr>
                  ))}

                  {doorType !== "1 Panel" && (
                    <>
                      <tr className={dividerRowClassName}>
                        <td colSpan="2" className={cellClassName}></td>
                      </tr>
                      {data.middleRails.map((row, index) => (
                        <tr key={`mid-stile-${index}`}>
                          <td className={`${cellClassName} p-2 text-center font-bold`}>{row.qty}</td>
                          <td className={`${cellClassName} p-2 text-center`}>
                            {formatLumberSize(row)}{" "}
                            <span className="text-[10px] text-stone-500 block sm:inline">(Mid)</span>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}

                  <tr className={dividerRowClassName}>
                    <td colSpan="2" className={cellClassName}></td>
                  </tr>
                  {data.bottomRails.map((row, index) => (
                    <tr key={`bot-stile-${index}`}>
                      <td className={`${cellClassName} p-2 text-center font-bold`}>{row.qty}</td>
                      <td className={`${cellClassName} p-2 text-center`}>
                        {formatLumberSize(row)}{" "}
                        <span className="text-[10px] text-stone-500 block sm:inline">(Bot)</span>
                      </td>
                    </tr>
                  ))}

                  {renderEmptyRows(layout.emptyRails, "empty-stile")}
                </tbody>
              </table>
            </section>

            {layout.doorSizesPage === 1 && layout.doorSizesCol === 2 && renderDoorSizesBox()}
            {layout.notesPage === 1 && layout.notesCol === 2 && renderNotesBox()}
          </div>
        </div>

        {renderFooter()}
      </div>

      {/* PAGE 2 */}
      {hasPage2 && (
        <div className={pageClassName(false)}>
          {renderHeader(2)}

          <div className="grid grid-cols-2 gap-8 flex-grow">
            {/* Column 1 (Left) */}
            <div className="space-y-6">
              {layout.doorSizesPage === 2 && renderDoorSizesBox()}
            </div>

            {/* Column 2 (Right) */}
            <div className="space-y-6">
              {layout.notesPage === 2 && renderNotesBox()}
            </div>
          </div>

          {renderFooter()}
        </div>
      )}

      <style>{`
        @media print {
          body {
            background: white;
            padding: 0;
            margin: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .shadow-2xl { box-shadow: none; }
          @page { size: letter portrait; margin: 0.5in; }
          .break-after-page {
            break-after: page !important;
            page-break-after: always !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CutListDocument;
