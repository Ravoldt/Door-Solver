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

const CutListDocument = ({ data, doorType, jobName, species, profile, finish }) => {
  const totalQty = data.doorSummaries.reduce((sum, d) => sum + d.qty, 0);
  const styleName = (doorType || "")
    .replace(/\b1\b/gi, "one")
    .replace(/\b2\b/gi, "two")
    .replace(/\b3\b/gi, "three")
    .replace(/\b4\b/gi, "four");
  const subtitle = `${totalQty} ${(finish || "").toUpperCase()} GRADE ${(species || "").toUpperCase()} ${styleName.toUpperCase()} ${(profile || "").toUpperCase()} STYLE`;

  return (
    <div className="max-w-[8.5in] mx-auto bg-white p-[0.5in] shadow-2xl print:bg-white print:shadow-none print:p-0 min-h-[11in] print:min-h-0 flex flex-col">
      <div className={`mb-6 border-b-4 ${printBorderClassName} pb-2`}>
        <h1 className="text-2xl font-black uppercase tracking-tighter mb-1">{jobName}</h1>
        <div className="text-sm font-bold tracking-wider text-stone-700">
          {subtitle}
        </div>
      </div>

    <div className="grid grid-cols-2 gap-8 flex-grow">
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
              {renderEmptyRows(3, "empty-side-rail")}
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
              {renderEmptyRows(
                Math.max(0, 4 - data.panels.reduce((sum, g) => sum + g.items.length, 0)),
                "empty-panel",
              )}
            </tbody>
          </table>
        </section>
      </div>

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

              {renderEmptyRows(5, "empty-stile")}
            </tbody>
          </table>
        </section>

        <section className="mt-auto">
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
          <div className={`mt-4 text-right italic text-sm font-bold border-t border-dashed ${printBorderClassName} pt-2`}>
            Notes
          </div>
        </section>
      </div>
    </div>

    <div className={`mt-8 text-[10px] text-stone-500 border-t ${printBorderClassName} pt-2 flex justify-between`}>
      <span>Generated via doorsolver.app</span>
      <span>Date: {new Date().toLocaleDateString()}</span>
    </div>

    <style>{`
      @media print {
        body {
          background: white;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .shadow-2xl { box-shadow: none; }
        @page { size: letter portrait; margin: 0.5in; }
      }
    `}</style>
  </div>
  );
};

export default CutListDocument;
