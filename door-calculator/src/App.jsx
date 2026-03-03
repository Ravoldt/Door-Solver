import React, { useState } from 'react';
import { Printer, Plus, Trash2, FileText } from 'lucide-react';

const App = () => {
  // --- State Management ---
  const [doorType, setDoorType] = useState("2 Panel");
  const [jobName, setJobName] = useState("H. B. C. Leamington");
  const [doors, setDoors] = useState([
    { id: 1, width: 36, height: 96, qty: 1, midStileCenter: 36, useGlobalSideRail: true, sideRailWidth: "", sideRailThickness: "" },
  ]);

  // Global Settings (Adjustable)
  const [settings, setSettings] = useState({
    sideRailWidth: "5 1/8",
    sideRailThickness: "1 3/4",
    topStileWidth: 5.125,
    midStileWidth: 6.25,
    botStileWidth: 9.125,
    panelWidthOffset: 7.5,
    endStileLengthOffset: 7
  });

  // --- Helper: Decimal to Fraction ---
  const toFraction = (decimal) => {
    if (!decimal || isNaN(decimal)) return "";
    // Handle floating point precision issues
    decimal = Math.round(decimal * 1000) / 1000;
    const whole = Math.floor(decimal);
    const frac = decimal - whole;
    
    if (frac === 0) return `${whole}"`;
    
    const tolerance = 0.01;
    let fractionStr = "";
    if (Math.abs(frac - 0.125) < tolerance) fractionStr = "1/8";
    else if (Math.abs(frac - 0.25) < tolerance) fractionStr = "1/4";
    else if (Math.abs(frac - 0.375) < tolerance) fractionStr = "3/8";
    else if (Math.abs(frac - 0.5) < tolerance) fractionStr = "1/2";
    else if (Math.abs(frac - 0.625) < tolerance) fractionStr = "5/8";
    else if (Math.abs(frac - 0.75) < tolerance) fractionStr = "3/4";
    else if (Math.abs(frac - 0.875) < tolerance) fractionStr = "7/8";
    else fractionStr = frac.toFixed(3); // fallback

    if (whole === 0) return `${fractionStr}"`;
    return `${whole} ${fractionStr}"`;
  };

  // --- Logic Calculations ---
  const calculateData = () => {
    let sideRailsMap = {};
    let topStilesMap = {};
    let midStilesMap = {};
    let botStilesMap = {};
    let panelSection1 = []; // Upper / All
    let panelSection2 = []; // Lower (only used for 2 panel)
    let doorSummaries = [];

    doors.forEach(door => {
      // Parse inputs to numbers (handle empty strings as 0 for calcs)
      const qty = parseFloat(door.qty) || 0;
      const width = parseFloat(door.width) || 0;
      const height = parseFloat(door.height) || 0;
      const midStileCenter = parseFloat(door.midStileCenter) || 0;

      // Determine Side Rail Dims (Global vs Local)
      const useGlobal = door.useGlobalSideRail !== false; // Default true
      const srWidth = useGlobal ? settings.sideRailWidth : door.sideRailWidth;
      const srThickness = useGlobal ? settings.sideRailThickness : door.sideRailThickness;

      // 1. Side Rails
      const railLength = height + 0.25;
      const railSize = `${srThickness} x ${srWidth} x ${toFraction(railLength)}`;
      if (!sideRailsMap[railSize]) sideRailsMap[railSize] = 0;
      sideRailsMap[railSize] += (qty * 2);


      // 2. End Stiles (1 Top, 1 Bot per door. Mid depends on style)
      const stileLength = width - settings.endStileLengthOffset;
      const stileLengthFraction = toFraction(stileLength);
      
      const topSize = `${srThickness} x ${toFraction(settings.topStileWidth)} x ${stileLengthFraction}`;
      if (!topStilesMap[topSize]) topStilesMap[topSize] = 0;
      topStilesMap[topSize] += qty;

      if (doorType !== "1 Panel") {
        const midQty = doorType === "3 Panel" ? qty * 2 : qty;
        const midSize = `${srThickness} x ${toFraction(settings.midStileWidth)} x ${stileLengthFraction}`;
        if (!midStilesMap[midSize]) midStilesMap[midSize] = 0;
        midStilesMap[midSize] += midQty;
      }

      const botSize = `${srThickness} x ${toFraction(settings.botStileWidth)} x ${stileLengthFraction}`;
      if (!botStilesMap[botSize]) botStilesMap[botSize] = 0;
      botStilesMap[botSize] += qty;

      // 3. Panels
      const pWidth = width - settings.panelWidthOffset;
      
      if (doorType === "1 Panel") {
        const pHeight = height - settings.topStileWidth - settings.botStileWidth + 2;
        panelSection1.push({ qty: qty, size: `${toFraction(pWidth)} x ${toFraction(pHeight)}`, label: "" });
      } 
      else if (doorType === "2 Panel") {
        const pHeightLower = midStileCenter - settings.botStileWidth - (settings.midStileWidth / 2) + 2;
        const pHeightUpper = height - midStileCenter - settings.topStileWidth - (settings.midStileWidth / 2) + 2;
        panelSection1.push({ qty: qty, size: `${toFraction(pWidth)} x ${toFraction(pHeightUpper)}`, label: "(Upper)" });
        panelSection2.push({ qty: qty, size: `${toFraction(pWidth)} x ${toFraction(pHeightLower)}`, label: "(Lower)" });
      } 
      else if (doorType === "3 Panel") {
        const availableSpace = height - settings.topStileWidth - settings.botStileWidth - (2 * settings.midStileWidth);
        const pHeight = (availableSpace / 3) + 2;
        panelSection1.push({ qty: qty * 3, size: `${toFraction(pWidth)} x ${toFraction(pHeight)}`, label: "(All)" });
      }

      doorSummaries.push({ qty: qty, size: `${width} x ${height}"` });
    });

    // Format the grouped side rails into an array sorted by length
    const sideRails = Object.keys(sideRailsMap).map(size => ({
        qty: sideRailsMap[size],
        size: size
      }));

  const topStiles = Object.keys(topStilesMap).map(size => ({ qty: topStilesMap[size], size }));
  const midStiles = Object.keys(midStilesMap).map(size => ({ qty: midStilesMap[size], size }));
  const botStiles = Object.keys(botStilesMap).map(size => ({ qty: botStilesMap[size], size }));

    return { sideRails, topStiles, midStiles, botStiles, panelSection1, panelSection2, doorSummaries };
  };

  const data = calculateData();

  const addDoor = () => {
    setDoors([...doors, { id: Date.now(), width: 36, height: 96, qty: 1, midStileCenter: 36, useGlobalSideRail: true, sideRailWidth: "", sideRailThickness: "" }]);
  };

  const removeDoor = (id) => {
    setDoors(doors.filter(d => d.id !== id));
  };

  const updateDoor = (id, field, val) => {
    setDoors(doors.map(d => d.id === id ? { ...d, [field]: val } : d));
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      {/* Configuration Panel - Hidden on Print */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6 mb-8 print:hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="text-blue-600" /> Door Specification Input
          </h2>
          <button 
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <Printer size={18} /> Print Cut-List
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase">Job Name</label>
            <input 
              className="w-full border-b-2 border-gray-200 focus:border-blue-500 outline-none py-1 text-lg"
              value={jobName} 
              onChange={e => setJobName(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase">Door Style / Material</label>
            <select 
              className="w-full border-b-2 border-gray-200 focus:border-blue-500 outline-none py-1 text-lg bg-transparent cursor-pointer"
              value={doorType} 
              onChange={e => setDoorType(e.target.value)} 
            >
              <option value="1 Panel">1 Panel</option>
              <option value="2 Panel">2 Panel</option>
              <option value="3 Panel">3 Panel</option>
            </select>
          </div>
        </div>

        {/* Global Side Rail Settings */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Global Side Rail Width</label>
            <input type="text" className="w-full p-1 mt-1 border rounded" value={settings.sideRailWidth} onChange={e => setSettings({...settings, sideRailWidth: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Global Side Rail Thickness</label>
            <input type="text" className="w-full p-1 mt-1 border rounded" value={settings.sideRailThickness} onChange={e => setSettings({...settings, sideRailThickness: e.target.value})} />
          </div>
        </div>

        {/* Stile Width Settings */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Top Stile Width (in)</label>
            <input type="number" step="0.125" className="w-full p-1 mt-1 border rounded" value={settings.topStileWidth} onChange={e => setSettings({...settings, topStileWidth: parseFloat(e.target.value) || 0})} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Mid Stile Width (in)</label>
            <input type="number" step="0.125" className="w-full p-1 mt-1 border rounded" value={settings.midStileWidth} onChange={e => setSettings({...settings, midStileWidth: parseFloat(e.target.value) || 0})} disabled={doorType === "1 Panel"} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Bottom Stile Width (in)</label>
            <input type="number" step="0.125" className="w-full p-1 mt-1 border rounded" value={settings.botStileWidth} onChange={e => setSettings({...settings, botStileWidth: parseFloat(e.target.value) || 0})} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-gray-700 border-b pb-2">Door List</h3>
          {doors.map((door, idx) => (
            <div key={door.id} className={`grid ${doorType === "2 Panel" ? "grid-cols-6" : "grid-cols-5"} ${!door.useGlobalSideRail ? "lg:grid-cols-8" : ""} gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-200`}>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Qty</label>
                <input type="number" className="w-full p-1 border rounded" value={door.qty} onChange={e => updateDoor(door.id, 'qty', e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Width (in)</label>
                <input type="number" className="w-full p-1 border rounded" value={door.width} onChange={e => updateDoor(door.id, 'width', e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Height (in)</label>
                <input type="number" className="w-full p-1 border rounded" value={door.height} onChange={e => updateDoor(door.id, 'height', e.target.value)} />
              </div>
              
              {/* Only show Mid-Stile center if 2 Panel is selected */}
              {doorType === "2 Panel" && (
                <div>
                  <label className="block text-[10px] font-bold text-blue-500 uppercase">Mid-Stile Center (in)</label>
                  <input type="number" className="w-full p-1 border rounded border-blue-300" value={door.midStileCenter} onChange={e => updateDoor(door.id, 'midStileCenter', e.target.value)} />
                </div>
              )}
              
              <div className="flex flex-col justify-end h-full">
                <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-gray-500 uppercase mb-2">
                  <input type="checkbox" checked={door.useGlobalSideRail !== false} onChange={e => updateDoor(door.id, 'useGlobalSideRail', e.target.checked)} />
                  Use Global Rails
                </label>
              </div>

              {!door.useGlobalSideRail && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-orange-500 uppercase">Rail Width</label>
                    <input type="text" className="w-full p-1 border rounded border-orange-300" value={door.sideRailWidth} onChange={e => updateDoor(door.id, 'sideRailWidth', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-orange-500 uppercase">Thickness</label>
                    <input type="text" className="w-full p-1 border rounded border-orange-300" value={door.sideRailThickness} onChange={e => updateDoor(door.id, 'sideRailThickness', e.target.value)} />
                  </div>
                </>
              )}

              <button onClick={() => removeDoor(door.id)} className="text-red-500 hover:bg-red-50 p-2 rounded self-center justify-self-center">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button 
            onClick={addDoor}
            className="flex items-center gap-2 text-blue-600 font-medium hover:underline py-2"
          >
            <Plus size={18} /> Add Another Door Size
          </button>
        </div>
      </div>

      {/* Printable Document Area */}
      <div className="max-w-[8.5in] mx-auto bg-white p-[0.5in] shadow-2xl print:shadow-none print:p-0 min-h-[11in] flex flex-col">
        {/* Header */}
        <div className="mb-6 border-b-4 border-black pb-2">
          <h1 className="text-2xl font-black uppercase tracking-tighter">{jobName}</h1>
          <div className="text-lg border-2 border-black px-3 py-1 mt-2 inline-block font-bold bg-gray-100">
            {doorType} Door
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-2 gap-8 flex-grow">
          
          {/* Left Column: Side Rails & Panels */}
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
                  {data.sideRails.map((row, i) => (
                    <tr key={i}>
                      <td className="border border-black p-2 text-center font-bold">{row.qty}</td>
                      <td className="border border-black p-2 text-center">{row.size}</td>
                    </tr>
                  ))}
                  {[...Array(3)].map((_, i) => (
                    <tr key={`empty-${i}`}><td className="border border-black p-4"></td><td className="border border-black"></td></tr>
                  ))}
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
                  {data.panelSection1.map((row, i) => (
                    <tr key={i}>
                      <td className="border border-black p-2 text-center font-bold">{row.qty}</td>
                      <td className="border border-black p-2 text-center">{row.size} <span className="text-[10px] text-gray-500">{row.label}</span></td>
                    </tr>
                  ))}
                  
                  {doorType === "2 Panel" && (
                    <>
                      <tr className="bg-gray-50 h-2"><td colSpan="2" className="border border-black"></td></tr>
                      {data.panelSection2.map((row, i) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-center font-bold">{row.qty}</td>
                          <td className="border border-black p-2 text-center">{row.size} <span className="text-[10px] text-gray-500">{row.label}</span></td>
                        </tr>
                      ))}
                    </>
                  )}
                  
                   {[...Array(4)].map((_, i) => (
                    <tr key={`empty-panel-${i}`}><td className="border border-black p-4"></td><td className="border border-black"></td></tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          {/* Right Column: End Stiles & Door Sizes */}
          <div className="space-y-6">
            <section>
              <table className="w-full border-collapse border-2 border-black">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-black p-1 w-12 text-sm">Qty.</th>
                    <th className="border border-black p-1 text-sm">End Style Sizes</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Top Stiles */}
                  {data.topStiles.map((row, i) => (
                    <tr key={`top-${i}`}>
                      <td className="border border-black p-2 text-center font-bold">{row.qty}</td>
                      <td className="border border-black p-2 text-center">{row.size} <span className="text-[10px] text-gray-400 block sm:inline">(Top)</span></td>
                    </tr>
                  ))}
                  
                  {/* Mid Stiles Break & Loop */}
                  {doorType !== "1 Panel" && (
                    <>
                      <tr className="bg-gray-200 h-2"><td colSpan="2" className="border border-black"></td></tr>
                      {data.midStiles.map((row, i) => (
                        <tr key={`mid-${i}`}>
                          <td className="border border-black p-2 text-center font-bold">{row.qty}</td>
                          <td className="border border-black p-2 text-center">{row.size} <span className="text-[10px] text-gray-400 block sm:inline">(Mid)</span></td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Bot Stiles Break & Loop */}
                  <tr className="bg-gray-200 h-2"><td colSpan="2" className="border border-black"></td></tr>
                  {data.botStiles.map((row, i) => (
                    <tr key={`bot-${i}`}>
                      <td className="border border-black p-2 text-center font-bold">{row.qty}</td>
                      <td className="border border-black p-2 text-center">{row.size} <span className="text-[10px] text-gray-400 block sm:inline">(Bot)</span></td>
                    </tr>
                  ))}

                  {/* Padding Rows */}
                  {[...Array(5)].map((_, i) => (
                    <tr key={`empty-stile-${i}`}><td className="border border-black p-4"></td><td className="border border-black"></td></tr>
                  ))}
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
                  {data.doorSummaries.map((row, i) => (
                    <tr key={i}>
                      <td className="border border-black p-2 text-center font-bold">{row.qty}</td>
                      <td className="border border-black p-2 text-center font-black text-lg">{row.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-right italic text-sm font-bold border-t border-dashed border-gray-400 pt-2">
                Back of page Diagram
              </div>
            </section>
          </div>

        </div>
        
        {/* Footer Note */}
        <div className="mt-8 text-[10px] text-gray-400 border-t pt-2 flex justify-between">
          <span>Generated via HBC Door System</span>
          <span>Date: {new Date().toLocaleDateString()}</span>
        </div>
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
};

export default App;