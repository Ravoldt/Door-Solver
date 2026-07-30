import { useEffect, useMemo, useState } from "react";
import { ChevronDown, FileText, FolderOpen, Plus, Printer, Save, Settings, Trash2, Zap } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { PDFDocument } from "pdf-lib";
import html2canvas from "html2canvas-pro";
import { calculateData } from "./calculations";
import CutListDocument from "./components/CutListDocument";
import DoorCard from "./components/DoorCard";
import { parseFraction, formatInputDimension } from "./utils";
import { DEFAULT_SETTINGS, DOOR_STYLES, APP_VERSION } from "./doorconfig";
import SettingsWorkspace from "./components/SettingsWorkspace";
import MiniDoorStyleSvg from "./components/MiniDoorStyleSvg";
import MobileQuickAdd from "./components/MobileQuickAdd";
import { validateDoor } from "./validation";

const PREDEFINED_SPECIES = [
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

const parseDimension = (value, fallback = 0) => {
  if (value == null || value === "") {
    return fallback;
  }

  const parsedValue = parseFraction(value);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
};

const createDoor = (width = 36, height = 96, initialSettings = DEFAULT_SETTINGS) => ({
  id: Date.now(),
  width,
  height,
  qty: 1,
  settings: { ...initialSettings },
});

const normalizeSettings = (loadedSettings = {}) => {
  return {
    ...DEFAULT_SETTINGS,
    stileWidth: parseDimension(loadedSettings.stileWidth, DEFAULT_SETTINGS.stileWidth),
    stileThickness: parseDimension(loadedSettings.stileThickness, DEFAULT_SETTINGS.stileThickness),
    topRailWidth: parseDimension(loadedSettings.topRailWidth, DEFAULT_SETTINGS.topRailWidth),
    lockRailWidth: parseDimension(loadedSettings.lockRailWidth ?? loadedSettings.middleRailWidth, DEFAULT_SETTINGS.lockRailWidth),
    intermediateRailWidth: parseDimension(loadedSettings.intermediateRailWidth ?? loadedSettings.middleRailWidth, DEFAULT_SETTINGS.intermediateRailWidth),
    bottomRailWidth: parseDimension(loadedSettings.bottomRailWidth, DEFAULT_SETTINGS.bottomRailWidth),
    heightToLockRail: parseDimension(loadedSettings.heightToLockRail ?? loadedSettings.heightToMiddleRail, DEFAULT_SETTINGS.heightToLockRail),
    grooveDepth: parseDimension(loadedSettings.grooveDepth, DEFAULT_SETTINGS.grooveDepth),
    tongueLength: parseDimension(loadedSettings.tongueLength, DEFAULT_SETTINGS.tongueLength),
    verticalPanelClearance: parseDimension(
      loadedSettings.verticalPanelClearance,
      DEFAULT_SETTINGS.verticalPanelClearance,
    ),
    horizontalPanelClearance: parseDimension(
      loadedSettings.horizontalPanelClearance,
      DEFAULT_SETTINGS.horizontalPanelClearance,
    ),
  };
};

const normalizeDoor = (door = {}, globalSettings = DEFAULT_SETTINGS) => {
  const baseDoor = createDoor(36, 96, globalSettings);

  return {
    id: door.id ?? baseDoor.id,
    qty: Number(door.qty ?? baseDoor.qty) || 0,
    width: parseDimension(door.width, baseDoor.width),
    height: parseDimension(door.height, baseDoor.height),
    settings: door.settings ? normalizeSettings(door.settings) : { ...globalSettings },
  };
};

const secondaryButtonClassName =
  "bg-stone-100 text-stone-900 border border-stone-300 px-4 py-2 rounded-sm flex items-center gap-2 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-500 transition-colors";
const primaryButtonClassName =
  "bg-[#00A69C] text-white border border-[#00A69C] px-4 py-2 rounded-sm flex items-center gap-2 hover:bg-teal-700 hover:border-teal-700 transition-colors";
const dangerButtonClassName =
  "bg-stone-100 text-red-600 border border-stone-300 px-4 py-2 rounded-sm flex items-center gap-2 hover:bg-red-50 hover:text-red-700 hover:border-red-500 transition-colors cursor-pointer";
const inputLineClassName =
  "w-full border-b-2 border-stone-900 focus:border-[#00A69C] outline-none py-1 text-lg bg-transparent";


const App = () => {
  const [doorType, setDoorType] = useState("2 Panel");
  const [jobName, setJobName] = useState("Job Name");
  const [selectedSpecies, setSelectedSpecies] = useState("Poplar");
  const [customText, setCustomText] = useState("");

  const species = selectedSpecies === "Custom" ? customText : selectedSpecies;
  const [profile, setProfile] = useState("Shaker");
  const [finish, setFinish] = useState("Stain");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [activeSettingsDoorId, setActiveSettingsDoorId] = useState(null); // null = closed, 'global' = global settings, door.id = specific door
  const [pendingGlobalCloseConfirm, setPendingGlobalCloseConfirm] = useState(false);
  const [initialGlobalSettings, setInitialGlobalSettings] = useState(null);

  const handleOpenGlobalSettings = () => {
    setInitialGlobalSettings({ ...settings });
    setActiveSettingsDoorId("global");
  };

  const handleOpenDoorSettings = (doorId) => {
    setInitialGlobalSettings(null);
    setActiveSettingsDoorId(doorId);
  };

  // Start with no doors added on initial load / reload
  const [doors, setDoors] = useState([]);

  // Warn user on refresh or tab close if doors exist
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (doors.length > 0) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [doors.length]);

  const [recentDoors, setRecentDoors] = useState(() => {
    try {
      const saved = localStorage.getItem("door_calculator_recent_doors");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addRecentDoorSize = (w, h) => {
    const numericW = Number(w);
    const numericH = Number(h);
    if (!numericW || !numericH) return;

    setRecentDoors((prev) => {
      const filtered = prev.filter((item) => item.width !== numericW || item.height !== numericH);
      const newEntry = {
        width: numericW,
        height: numericH,
        label: `${formatInputDimension(numericW)} × ${formatInputDimension(numericH)}`,
      };
      const updated = [newEntry, ...filtered].slice(0, 8);
      try {
        localStorage.setItem("door_calculator_recent_doors", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save recent doors:", err);
      }
      return updated;
    });
  };

  const handleClearRecentDoors = () => {
    setRecentDoors([]);
    try {
      localStorage.removeItem("door_calculator_recent_doors");
    } catch (err) {
      console.error("Failed to clear recent doors:", err);
    }
  };

  const handleAddQuickDoor = (width, height, qty = 1) => {
    const effectiveSettings = profile === "Ovolo" ? { ...settings, grooveDepth: 1.5, tongueLength: 1.5 } : settings;
    const testDoor = createDoor(width, height, settings);
    testDoor.qty = qty;

    const { errors } = validateDoor(testDoor, effectiveSettings, doorType);
    if (errors.length > 0) {
      toast.error(errors[0].message);
      return false;
    }

    addRecentDoorSize(width, height);

    setDoors((currentDoors) => [
      ...currentDoors,
      { ...testDoor, id: Date.now() },
    ]);
    toast.success(`Added ${qty}x (${formatInputDimension(width)}" × ${formatInputDimension(height)}") door`);
    return true;
  };

  const data = useMemo(() => {
    return calculateData(doors, settings, doorType, profile);
  }, [doors, settings, doorType, profile]);

  const doorWarnings = useMemo(() => {
    return doors.map((door) => {
      const doorSettings = door.settings || settings;
      const effectiveSettings = profile === "Ovolo" ? { ...doorSettings, grooveDepth: 1.5, tongueLength: 1.5 } : doorSettings;
      const { warnings } = validateDoor(door, effectiveSettings, doorType);
      return { id: door.id, warnings };
    });
  }, [doors, settings, doorType, profile]);

  const handleUpdateSetting = (field, value, previewDoor) => {
    if (activeSettingsDoorId === "global") {
      const proposedSettings = { ...settings, [field]: value };
      const effectiveSettings = profile === "Ovolo" ? { ...proposedSettings, grooveDepth: 1.5, tongueLength: 1.5 } : proposedSettings;

      // Validate against preview door if provided
      if (previewDoor) {
        const { errors } = validateDoor(previewDoor, effectiveSettings, doorType);
        if (errors.length > 0) {
          toast.error(errors[0].message);
          return false;
        }
      }

      // Validate against all active doors
      for (let i = 0; i < doors.length; i++) {
        const { errors } = validateDoor(doors[i], effectiveSettings, doorType);
        if (errors.length > 0) {
          toast.error(errors[0].message);
          return false;
        }
      }

      setSettings(proposedSettings);
      return true;
    } else {
      const doorId = activeSettingsDoorId;
      const door = doors.find((d) => String(d.id) === String(doorId));
      if (!door) return false;

      const doorSettings = door.settings || settings;
      const proposedSettings = { ...doorSettings, [field]: value };
      const effectiveSettings = profile === "Ovolo" ? { ...proposedSettings, grooveDepth: 1.5, tongueLength: 1.5 } : proposedSettings;

      // Validate this door
      const { errors } = validateDoor(door, effectiveSettings, doorType);
      if (errors.length > 0) {
        toast.error(errors[0].message);
        return false;
      }

      // Update door-specific settings
      setDoors((prevDoors) =>
        prevDoors.map((d) => {
          if (String(d.id) === String(doorId)) {
            return {
              ...d,
              settings: proposedSettings,
            };
          }
          return d;
        })
      );
      return true;
    }
  };

  const handleSetSettings = (newSettings) => {
    if (activeSettingsDoorId === "global") {
      setSettings(newSettings);
    } else {
      const doorId = activeSettingsDoorId;
      setDoors((prevDoors) =>
        prevDoors.map((d) => {
          if (String(d.id) === String(doorId)) {
            return {
              ...d,
              settings: newSettings,
            };
          }
          return d;
        })
      );
    }
  };

  const handleCloseSettingsWorkspace = () => {
    if (activeSettingsDoorId === "global" && initialGlobalSettings && doors.length > 0) {
      const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialGlobalSettings);
      if (hasChanges) {
        setPendingGlobalCloseConfirm(true);
        return;
      }
    }
    setInitialGlobalSettings(null);
    setActiveSettingsDoorId(null);
  };

  const handleSave = async () => {
    const stateToSave = {
      jobName,
      doorType,
      doors,
      settings,
      species,
      profile,
      finish,
      appVersion: APP_VERSION,
    };

    const toastId = toast.loading("Generating PDF...");

    try {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.setSubject(JSON.stringify(stateToSave));

      const capturePage = async (pageId) => {
        const element = document.getElementById(pageId);
        if (!element) return;

        const hasShadow = element.classList.contains("shadow-2xl");
        if (hasShadow) element.classList.remove("shadow-2xl");

        const canvas = await html2canvas(element, { scale: 2 });

        if (hasShadow) element.classList.add("shadow-2xl");

        const imgData = canvas.toDataURL("image/png");
        const pngImage = await pdfDoc.embedPng(imgData);

        const page = pdfDoc.addPage([612, 792]);
        const { width, height } = pngImage.scaleToFit(612, 792);

        page.drawImage(pngImage, {
          x: (612 - width) / 2,
          y: (792 - height) / 2,
          width,
          height,
        });
      };

      await capturePage("cutlist-page-1");
      await capturePage("cutlist-page-2");

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${jobName.replace(/ /g, "_") || "door_job"}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast.success("PDF saved successfully!", { id: toastId });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Failed to generate PDF.", { id: toastId });
    }
  };

  const handleLoad = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        let loadedStateStr = null;

        if (file.name.toLowerCase().endsWith(".pdf")) {
          const pdfDoc = await PDFDocument.load(loadEvent.target.result);
          loadedStateStr = pdfDoc.getSubject();
          if (!loadedStateStr) {
            toast.error("PDF does not contain readable save data.");
            return;
          }
        } else {
          const decoder = new TextDecoder("utf-8");
          loadedStateStr = decoder.decode(loadEvent.target.result);
        }

        const loadedState = JSON.parse(loadedStateStr);
        const isValidState =
          typeof loadedState.jobName === "string" &&
          typeof loadedState.doorType === "string" &&
          Array.isArray(loadedState.doors) &&
          loadedState.settings &&
          typeof loadedState.settings === "object";

        if (!isValidState) {
          toast.error("Invalid or corrupted save file.");
          return;
        }

        const normalizedGlobalSettings = normalizeSettings(loadedState.settings);
        const normalizedDoors = loadedState.doors.map((door) =>
          normalizeDoor(door, normalizedGlobalSettings)
        );

        // Validate loaded state
        let hasLoadError = false;
        for (const door of normalizedDoors) {
          const doorSettings = door.settings || normalizedGlobalSettings;
          const effectiveSettings = profile === "Ovolo" ? { ...doorSettings, grooveDepth: 1.5, tongueLength: 1.5 } : doorSettings;
          const { errors } = validateDoor(door, effectiveSettings, loadedState.doorType || doorType);
          if (errors.length > 0) {
            toast.error(`Load failed: ${errors[0].message}`);
            hasLoadError = true;
            break;
          }
        }

        if (hasLoadError) {
          return;
        }

        setJobName(loadedState.jobName);
        setDoorType(loadedState.doorType);
        setSettings(normalizedGlobalSettings);
        setDoors(normalizedDoors);
        if (loadedState.species) {
          const loadedSp = loadedState.species;
          if (PREDEFINED_SPECIES.includes(loadedSp)) {
            setSelectedSpecies(loadedSp);
            setCustomText("");
          } else {
            setSelectedSpecies("Custom");
            setCustomText(loadedSp);
          }
        }
        if (loadedState.profile) setProfile(loadedState.profile);
        if (loadedState.finish) setFinish(loadedState.finish);
        toast.success("Job loaded successfully!");
      } catch (error) {
        console.error("Failed to load or parse file:", error);
        toast.error("Failed to load file. It may be corrupted or not a valid save PDF.");
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = null;
  };

  const addDoor = () => {
    setDoors((currentDoors) => {
      const prevDoor = currentDoors[currentDoors.length - 1];
      const w = prevDoor ? prevDoor.width : 36;
      const h = prevDoor ? prevDoor.height : 96;
      addRecentDoorSize(w, h);
      const newDoor = prevDoor
        ? createDoor(prevDoor.width, prevDoor.height, settings)
        : createDoor(36, 96, settings);
      return [...currentDoors, newDoor];
    });
  };

  const removeDoor = (id) => {
    setDoors((currentDoors) => currentDoors.filter((door) => String(door.id) !== String(id)));
  };

  const handleClearAll = () => {
    toast((t) => (
      <div className="flex flex-col gap-2 text-left">
        <div className="flex flex-col gap-0.5">
          <p className="font-bold text-stone-900 text-sm">Are you sure?</p>
          <p className="text-xs text-stone-500 font-medium normal-case leading-relaxed">
            All construction settings and currently added doors will be reset to default values.
          </p>
        </div>
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-stone-100 border border-stone-300 text-stone-700 rounded-sm text-xs font-bold hover:bg-stone-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              setDoors([]);
              setSettings(DEFAULT_SETTINGS);
              setJobName("Job Name");
              setDoorType("2 Panel");
              setSelectedSpecies("Poplar");
              setCustomText("");
              setProfile("Shaker");
              setFinish("Stain");
              toast.success("Calculator reset successfully");
            }}
            className="px-3 py-1 bg-red-600 text-white rounded-sm text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
          >
            Reset All
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: "top-center",
      style: {
        maxWidth: "320px",
        padding: "16px",
      }
    });
  };

  const updateDoor = (id, field, value) => {
    const door = doors.find((d) => d.id === id);
    if (door) {
      const doorSettings = door.settings || settings;
      const effectiveSettings = profile === "Ovolo" ? { ...doorSettings, grooveDepth: 1.5, tongueLength: 1.5 } : doorSettings;
      if (field === "width" || field === "height") {
        const proposedDoor = { ...door, [field]: value };
        const { errors } = validateDoor(proposedDoor, effectiveSettings, doorType);
        if (errors.length > 0) {
          toast.error(errors[0].message);
          return false;
        }
      }
    }

    setDoors((currentDoors) =>
      currentDoors.map((door) => {
        if (String(door.id) !== String(id)) {
          return door;
        }

        return { ...door, [field]: value };
      }),
    );
    return true;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 md:p-8 font-sans print:p-0 print:bg-white print:min-h-0">
      <Toaster position="top-right" />

      {/* Input specifications: hidden in print mode */}
      <div className="max-w-7xl mx-auto space-y-6 mb-8 print:hidden">
        {/* Main Settings Card */}
        <div className="bg-white rounded-sm shadow-sm p-6 border border-stone-900 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="text-[#00A69C]" /> Door Parts List Calculator
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                id="loadFile"
                className="hidden"
                onChange={handleLoad}
                accept=".pdf,.json"
              />
              <label
                htmlFor="loadFile"
                className={`${secondaryButtonClassName} cursor-pointer`}
              >
                <FolderOpen size={18} /> Load
              </label>

              <button
                onClick={handleSave}
                className={secondaryButtonClassName}
              >
                <Save size={18} /> Save
              </button>

              <button
                onClick={() => window.print()}
                className={primaryButtonClassName}
              >
                <Printer size={18} /> Print
              </button>
            </div>
          </div>

          {/* Job Name */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-stone-900 uppercase mb-2">Job Name</label>
            <input
              className={inputLineClassName}
              value={jobName}
              onChange={(event) => setJobName(event.target.value)}
            />
          </div>

          {/* Wood Species - Horizontally scrolling list */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-stone-900 uppercase mb-3">Wood Species</label>
            <div className="flex gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-stone-50">
              {[...PREDEFINED_SPECIES, "Custom"].map((option) => {
                const isSelected = selectedSpecies === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSelectedSpecies(option);
                      if (option !== "Custom") {
                        setCustomText("");
                      }
                    }}
                    className={`flex-none px-4 py-2 text-sm font-semibold rounded-sm border-2 transition-all duration-150 cursor-pointer ${isSelected
                        ? "border-[#00A69C] bg-teal-50/20 text-stone-900 shadow-sm"
                        : "border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-400 hover:bg-stone-100/50"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isSelected ? "text-[#00A69C]" : "text-stone-850"}`}>
                        {option}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[#00A69C]"></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Species Input (shown when "Custom" is selected) */}
            {selectedSpecies === "Custom" && (
              <div className="mt-4 animate-fade-in">
                <label className="block text-[10px] font-bold text-stone-500 uppercase mb-2">Custom Wood Species Name</label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full max-w-md border-b-2 border-stone-900 focus:border-[#00A69C] outline-none py-1.5 text-lg bg-transparent font-semibold"
                  placeholder="e.g. Mahogany, Ash, Birch..."
                />
              </div>
            )}
          </div>

          {/* Door Style - Horizontally scrolling list */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-stone-900 uppercase mb-3">Door Style</label>
            <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-stone-50">
              {DOOR_STYLES.map((style) => {
                const isSelected = doorType === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setDoorType(style.id)}
                    className={`flex-none w-40 p-4 rounded-sm border-2 text-left transition-all duration-200 cursor-pointer ${isSelected
                      ? "border-[#00A69C] bg-teal-50/20 text-stone-900 shadow-sm"
                      : "border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-400 hover:bg-stone-100/50"
                      }`}
                  >
                    {/* Dynamic Scaled SVG Thumbnail */}
                    <div className="w-full mb-3 flex items-center justify-center pointer-events-none">
                      <MiniDoorStyleSvg styleId={style.id} />
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <span className={`text-sm font-bold ${isSelected ? "text-[#00A69C]" : "text-stone-850"}`}>
                        {style.label}
                      </span>
                      {isSelected && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00A69C]"></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profile and Finish row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Profile Selection Toggle */}
            <div>
              <label className="block text-xs font-semibold text-stone-900 uppercase mb-2">Profile</label>
              <div className="flex border border-stone-900 rounded-sm overflow-hidden h-11">
                <button
                  type="button"
                  onClick={() => setProfile("Shaker")}
                  className={`flex-1 font-bold text-sm transition-colors cursor-pointer ${profile === "Shaker"
                    ? "bg-[#00A69C] text-white"
                    : "bg-white text-stone-900 hover:bg-stone-50"
                    }`}
                >
                  Shaker
                </button>
                <button
                  type="button"
                  onClick={() => setProfile("Ovolo")}
                  className={`flex-1 font-bold text-sm border-l border-stone-900 transition-colors cursor-pointer ${profile === "Ovolo"
                    ? "bg-[#00A69C] text-white"
                    : "bg-white text-stone-900 hover:bg-stone-50"
                    }`}
                >
                  Ovolo
                </button>
              </div>
            </div>

            {/* Finish Selection Toggle */}
            <div>
              <label className="block text-xs font-semibold text-stone-900 uppercase mb-2">Finish</label>
              <div className="flex border border-stone-900 rounded-sm overflow-hidden h-11">
                <button
                  type="button"
                  onClick={() => setFinish("Stain")}
                  className={`flex-1 font-bold text-sm transition-colors cursor-pointer ${finish === "Stain"
                    ? "bg-[#00A69C] text-white"
                    : "bg-white text-stone-900 hover:bg-stone-50"
                    }`}
                >
                  Stain
                </button>
                <button
                  type="button"
                  onClick={() => setFinish("Paint")}
                  className={`flex-1 font-bold text-sm border-l border-stone-900 transition-colors cursor-pointer ${finish === "Paint"
                    ? "bg-[#00A69C] text-white"
                    : "bg-white text-stone-900 hover:bg-stone-50"
                    }`}
                >
                  Paint
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={addDoor}
                className={primaryButtonClassName}
              >
                <Plus size={18} /> Add New Door
              </button>

              <button
                type="button"
                onClick={handleOpenGlobalSettings}
                className={`${secondaryButtonClassName} cursor-pointer`}
                title="Configure defaults and preview style"
              >
                <Settings size={18} className="stroke-[2.5]" /> Settings
              </button>
            </div>

            <button
              onClick={handleClearAll}
              className={dangerButtonClassName}
            >
              <Trash2 size={18} /> Clear All
            </button>
          </div>
        </div>

        {/* Mobile Quick Draft Entry Card */}
        <div id="quick-draft-section" className="max-w-4xl mx-auto mb-6">
          <MobileQuickAdd
            onAddDoor={handleAddQuickDoor}
            recentDoors={recentDoors}
            onClearRecentDoors={handleClearRecentDoors}
          />
        </div>

        {/* Door Size Grid */}
        <div id="door-sizes-grid" className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-900 pb-2">
            <h3 className="font-bold text-stone-900">Door Sizes</h3>
            <span className="text-xs bg-stone-100 border border-stone-900 px-2 py-0.5 rounded-sm font-semibold text-stone-900">
              Unique Doors: {doors.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Add New Card */}
            <button
              onClick={addDoor}
              className="flex flex-col items-center justify-between border-2 border-dashed border-[#00A69C] hover:border-teal-700 rounded-2xl bg-[#FAFAFA] hover:bg-teal-50/10 p-6 min-h-[460px] transition-all cursor-pointer group"
            >
              <div className="flex-1 flex items-center justify-center">
                <Plus size={72} className="text-[#00A69C] group-hover:text-teal-700 transition-colors stroke-[2.5]" />
              </div>
              <div className="w-full border-t border-stone-200 pt-4 text-center">
                <span className="text-[#00A69C] group-hover:text-teal-700 font-extrabold tracking-wider text-sm uppercase">
                  Add New
                </span>
              </div>
            </button>

            {/* Door Cards */}
            {doors.map((door, index) => {
              const warningsObj = doorWarnings.find((w) => w.id === door.id);
              const warnings = warningsObj ? warningsObj.warnings : [];
              return (
                <DoorCard
                  key={door.id}
                  door={door}
                  index={index}
                  onUpdate={updateDoor}
                  onRemove={removeDoor}
                  onOpenSettings={handleOpenDoorSettings}
                  warnings={warnings}
                  globalSettings={settings}
                  doorType={doorType}
                  profile={profile}
                />
              );
            })}
          </div>
        </div>
      </div>

      <CutListDocument
        data={data}
        doorType={doorType}
        jobName={jobName}
        species={species}
        profile={profile}
        finish={finish}
      />

      <SettingsWorkspace
        isOpen={activeSettingsDoorId !== null}
        onClose={handleCloseSettingsWorkspace}
        settings={activeSettingsDoorId === "global" ? settings : (doors.find((d) => String(d.id) === String(activeSettingsDoorId))?.settings || settings)}
        updateSetting={handleUpdateSetting}
        setSettings={handleSetSettings}
        doorType={doorType}
        setDoorType={setDoorType}
        doors={doors}
        species={species}
        updateDoor={updateDoor}
        profile={profile}
        editingDoorId={activeSettingsDoorId}
      />

      {/* Warning Confirmation Modal */}
      {pendingGlobalCloseConfirm && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white border border-stone-900 rounded-sm p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              ⚠️ Apply Global Settings
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              You have changed global settings. Would you like to overwrite all existing doors' settings, or only apply these changes to new doors?
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  // Overwrite settings on all doors
                  setDoors((prevDoors) =>
                    prevDoors.map((d) => ({
                      ...d,
                      settings: { ...settings },
                    }))
                  );
                  setPendingGlobalCloseConfirm(false);
                  setInitialGlobalSettings(null);
                  setActiveSettingsDoorId(null);
                  toast.success("Applied changes to all doors.");
                }}
                className="w-full py-2 bg-[#00A69C] text-white font-bold rounded-sm hover:bg-teal-700 transition-colors cursor-pointer text-sm"
              >
                Overwrite All Doors
              </button>
              <button
                onClick={() => {
                  // Keep settings on existing doors, only apply to global settings for new doors
                  setPendingGlobalCloseConfirm(false);
                  setInitialGlobalSettings(null);
                  setActiveSettingsDoorId(null);
                  toast.success("Applied changes to new doors only.");
                }}
                className="w-full py-2 bg-stone-100 border border-stone-300 text-stone-700 font-bold rounded-sm hover:bg-stone-200 transition-colors cursor-pointer text-sm"
              >
                Apply to New Doors Only
              </button>
              <button
                onClick={() => {
                  // Discard changes & Close
                  if (initialGlobalSettings) {
                    setSettings(initialGlobalSettings);
                  }
                  setPendingGlobalCloseConfirm(false);
                  setInitialGlobalSettings(null);
                  setActiveSettingsDoorId(null);
                  toast.success("Changes discarded.");
                }}
                className="w-full py-2 bg-red-50 border border-red-200 text-red-700 font-bold rounded-sm hover:bg-red-100 transition-colors cursor-pointer text-sm"
              >
                Discard Changes & Close
              </button>
              <button
                onClick={() => {
                  // Cancel / Keep editing
                  setPendingGlobalCloseConfirm(false);
                }}
                className="w-full py-2 bg-transparent text-stone-500 font-semibold rounded-sm hover:text-stone-700 transition-colors cursor-pointer text-xs text-center"
              >
                Cancel (Keep Editing)
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Sticky Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-300 py-2 px-6 flex items-center justify-around z-40 sm:hidden shadow-lg">
        <button
          type="button"
          onClick={() => {
            document.getElementById("quick-draft-section")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex flex-col items-center gap-1 text-stone-600 hover:text-[#00A69C] active:text-[#00A69C] cursor-pointer"
        >
          <Zap size={18} />
          <span className="text-[10px] font-bold uppercase">Quick Draft</span>
        </button>

        <button
          type="button"
          onClick={() => {
            document.getElementById("door-sizes-grid")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex flex-col items-center gap-1 text-stone-600 hover:text-[#00A69C] relative cursor-pointer"
        >
          <div className="relative">
            <FileText size={18} />
            {doors.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#00A69C] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {doors.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase">Doors ({doors.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleAddQuickDoor(36, 96, 1)}
          className="flex flex-col items-center justify-center bg-[#00A69C] text-white w-11 h-11 rounded-full shadow-md -mt-5 cursor-pointer active:scale-95 transition-transform"
          title="Quick add 36x96 door"
        >
          <Plus size={22} className="stroke-[3]" />
        </button>

        <button
          type="button"
          onClick={handleOpenGlobalSettings}
          className="flex flex-col items-center gap-1 text-stone-600 hover:text-[#00A69C] cursor-pointer"
        >
          <Settings size={18} />
          <span className="text-[10px] font-bold uppercase">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default App;
