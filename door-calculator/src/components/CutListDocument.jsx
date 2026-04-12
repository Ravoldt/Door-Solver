import { toFraction } from "../utils";

const renderEmptyRows = (count, prefix) =>
  Array.from({ length: count }, (_, index) => (
    <tr key={`${prefix}-${index}`}>
      <td className="border border-black p-4"></td>
      <td className="border border-black"></td>
    </tr>
  ));

const formatLumberSize = (row) => `${toFraction(row.thickness)} x ${toFraction(row.width)} x ${toFraction(row.length)}`;
const formatPanelSize = (row) => `${toFraction(row.width)} x ${toFraction(row.height)}`;
const formatDoorSize = (row) => `${toFraction(row.width)} x ${toFraction(row.height)}`;

const CutListDocument = ({ data, doorType, jobName }) => (
  <div className="max-w-[8.5in] mx-auto bg-white p-[0.5in] shadow-2xl print:shadow-none print:p-0 min-h-[11in] flex flex-col">
    <div className="mb-6 border-b-4 border-black pb-2">
      <h1 className="text-2xl font-black uppercase tracking-tighter">{jobName}</h1>
      <div className="text-lg border-2 border-black px-3 py-1 mt-2 inline-block font-bold bg-gray-100">
        {doorType} Door
      </div>
    </div>

    <div className="grid grid-cols-2 gap-8 flex-grow">
      <div className="space-y-6">
        <section>
          <table className="w-full border-collapse border-2 border-black">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-1 w-12 text-sm">Qty.</th>
                <th className="border border-black p-1 text-sm">Side Rail Sizes</th>
              </tr>
            </thead>
            <tbody>
              {data.sideRails.map((row, index) => (
                <tr key={`side-rail-${index}`}>
                  <td className="border border-black p-2 text-center font-bold">{row.qty}</td>
                  <td className="border border-black p-2 text-center">{formatLumberSize(row)}</td>
                </tr>
              ))}
              {renderEmptyRows(3, "empty-side-rail")}
            </tbody>
          </table>
        </section>

        <section>
          <table className="w-full border-collapse border-2 border-black">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-1 w-12 text-sm">Qty.</th>
                <th className="border border-black p-1 text-sm">Panel Sizes {doorType === "2 Panel" && "(Upper / Lower)"}</th>
              </tr>
            </thead>
            <tbody>
              {data.panelSection1.map((row, index) => (
                <tr key={`panel-1-${index}`}>
                  <td className="border border-black p-2 text-center font-bold">{row.qty}</td>
                  <td className="border border-black p-2 text-center">
                    {formatPanelSize(row)}{" "}
                    {row.label && <span className="text-[10px] text-gray-500">{row.label}</span>}
                  </td>
                </tr>
              ))}

              {doorType === "2 Panel" && (
                <>
                  <tr className="bg-gray-50 h-2">
                    <td colSpan="2" className="border border-black"></td>
                  </tr>
                  {data.panelSection2.map((row, index) => (
                    <tr key={`panel-2-${index}`}>
                      <td className="border border-black p-2 text-center font-bold">{row.qty}</td>
                      <td className="border border-black p-2 text-center">
                        {formatPanelSize(row)}{" "}
                        {row.label && <span className="text-[10px] text-gray-500">{row.label}</span>}
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {renderEmptyRows(4, "empty-panel")}
            </tbody>
          </table>
        </section>
      </div>

      <div className="space-y-6">
        <section>
          <table className="w-full border-collapse border-2 border-black">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-1 w-12 text-sm">Qty.</th>
                <th className="border border-black p-1 text-sm">End Stile Sizes</th>
              </tr>
            </thead>
            <tbody>
              {data.topStiles.map((row, index) => (
                <tr key={`top-stile-${index}`}>
                  <td className="border border-black p-2 text-center font-bold">{row.qty}</td>
                  <td className="border border-black p-2 text-center">
                    {formatLumberSize(row)}{" "}
                    <span className="text-[10px] text-gray-400 block sm:inline">(Top)</span>
                  </td>
                </tr>
              ))}

              {doorType !== "1 Panel" && (
                <>
                  <tr className="bg-gray-200 h-2">
                    <td colSpan="2" className="border border-black"></td>
                  </tr>
                  {data.midStiles.map((row, index) => (
                    <tr key={`mid-stile-${index}`}>
                      <td className="border border-black p-2 text-center font-bold">{row.qty}</td>
                      <td className="border border-black p-2 text-center">
                        {formatLumberSize(row)}{" "}
                        <span className="text-[10px] text-gray-400 block sm:inline">(Mid)</span>
                      </td>
                    </tr>
                  ))}
                </>
              )}

              <tr className="bg-gray-200 h-2">
                <td colSpan="2" className="border border-black"></td>
              </tr>
              {data.botStiles.map((row, index) => (
                <tr key={`bot-stile-${index}`}>
                  <td className="border border-black p-2 text-center font-bold">{row.qty}</td>
                  <td className="border border-black p-2 text-center">
                    {formatLumberSize(row)}{" "}
                    <span className="text-[10px] text-gray-400 block sm:inline">(Bot)</span>
                  </td>
                </tr>
              ))}

              {renderEmptyRows(5, "empty-stile")}
            </tbody>
          </table>
        </section>

        <section className="mt-auto">
          <table className="w-full border-collapse border-2 border-black">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="border border-black p-1 w-12 text-sm">Qty.</th>
                <th className="border border-black p-1 text-sm uppercase tracking-widest">Door Size</th>
              </tr>
            </thead>
            <tbody>
              {data.doorSummaries.map((row, index) => (
                <tr key={`door-summary-${index}`}>
                  <td className="border border-black p-2 text-center font-bold">{row.qty}</td>
                  <td className="border border-black p-2 text-center font-black text-lg">{formatDoorSize(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-right italic text-sm font-bold border-t border-dashed border-gray-400 pt-2">
            Notes
          </div>
        </section>
      </div>
    </div>

    <div className="mt-8 text-[10px] text-gray-400 border-t pt-2 flex justify-between">
      <span>Generated via Door Part Calculator</span>
      <span>Date: {new Date().toLocaleDateString()}</span>
    </div>

    <style>{`
      @media print {
        body { background: white; padding: 0; }
        .shadow-2xl { box-shadow: none; }
        @page { margin: 0.5in; }
      }
    `}</style>
  </div>
);

export default CutListDocument;
