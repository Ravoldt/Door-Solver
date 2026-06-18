import { useEffect, useMemo, useState } from "react";
import { ChevronDown, FileText, FolderOpen, Plus, Printer, Save, Settings, Trash2 } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { PDFDocument } from "pdf-lib";
import html2canvas from "html2canvas-pro";
import { calculateData } from "./calculations";
import CutListDocument from "./components/CutListDocument";
import DimensionInput from "./components/DimensionInput";
import DoorCard from "./components/DoorCard";
import { parseFraction } from "./utils";
import { DEFAULT_SETTINGS, STYLE_REQUIRED_SETTINGS, DOOR_STYLES, APP_VERSION } from "./doorconfig";
import SettingsWorkspace from "./components/SettingsWorkspace";
import MiniDoorStyleSvg from "./components/MiniDoorStyleSvg";
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

const createDoor = (width = 36, height = 96) => ({
  id: Date.now(),
  width,
  height,
  qty: 1,
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

const normalizeDoor = (door = {}) => {
  const baseDoor = createDoor();

  return {
    id: door.id ?? baseDoor.id,
    qty: Number(door.qty ?? baseDoor.qty) || 0,
    width: parseDimension(door.width, baseDoor.width),
    height: parseDimension(door.height, baseDoor.height),
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
  const [doorType, setDoorType] = useState(() => {
    return localStorage.getItem("door_calculator_doorType") ?? "2 Panel";
  });
  const [jobName, setJobName] = useState(() => {
    return localStorage.getItem("door_calculator_jobName") ?? "Job Name";
  });
  const [selectedSpecies, setSelectedSpecies] = useState(() => {
    const saved = localStorage.getItem("door_calculator_species") ?? "Poplar";
    return PREDEFINED_SPECIES.includes(saved) ? saved : "Custom";
  });
  const [customText, setCustomText] = useState(() => {
    const saved = localStorage.getItem("door_calculator_species") ?? "Poplar";
    return PREDEFINED_SPECIES.includes(saved) ? "" : saved;
  });


  const species = selectedSpecies === "Custom" ? customText : selectedSpecies;
  const [profile, setProfile] = useState(() => {
    return localStorage.getItem("door_calculator_profile") ?? "Shaker";
  });
  const [finish, setFinish] = useState(() => {
    return localStorage.getItem("door_calculator_finish") ?? "Stain";
  });
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("door_calculator_settings");
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [doors, setDoors] = useState(() => {
    try {
      const saved = localStorage.getItem("door_calculator_doors");
      return saved ? JSON.parse(saved) : [createDoor()];
    } catch {
      return [createDoor()];
    }
  });

  useEffect(() => {
    localStorage.setItem("door_calculator_doorType", doorType);
  }, [doorType]);

  useEffect(() => {
    localStorage.setItem("door_calculator_jobName", jobName);
  }, [jobName]);

  useEffect(() => {
    localStorage.setItem("door_calculator_species", species);
  }, [species]);

  useEffect(() => {
    localStorage.setItem("door_calculator_profile", profile);
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("door_calculator_finish", finish);
  }, [finish]);

  useEffect(() => {
    localStorage.setItem("door_calculator_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("door_calculator_doors", JSON.stringify(doors));
  }, [doors]);

  const data = useMemo(() => {
    const effectiveSettings = profile === "Ovolo" ? { ...settings, grooveDepth: 1.5, tongueLength: 1.5 } : settings;
    return calculateData(doors, effectiveSettings, doorType, profile);
  }, [doors, settings, doorType, profile]);

  const doorWarnings = useMemo(() => {
    const effectiveSettings = profile === "Ovolo" ? { ...settings, grooveDepth: 1.5, tongueLength: 1.5 } : settings;
    return doors.map((door) => {
      const { warnings } = validateDoor(door, effectiveSettings, doorType);
      return { id: door.id, warnings };
    });
  }, [doors, settings, doorType, profile]);

  const updateSetting = (field, value, previewDoor) => {
    const proposedSettings = { ...settings, [field]: value };
    const effectiveSettings = profile === "Ovolo" ? { ...proposedSettings, grooveDepth: 1.5, tongueLength: 1.5 } : proposedSettings;

    // Validate against all active doors
    for (let i = 0; i < doors.length; i++) {
      const { errors } = validateDoor(doors[i], effectiveSettings, doorType);
      if (errors.length > 0) {
        toast.error(errors[0].message);
        return false;
      }
    }

    // Validate against preview door if provided
    if (previewDoor) {
      const { errors } = validateDoor(previewDoor, effectiveSettings, doorType);
      if (errors.length > 0) {
        toast.error(errors[0].message);
        return false;
      }
    }

    setSettings(proposedSettings);
    return true;
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

        const normalizedSettings = normalizeSettings(loadedState.settings);
        const normalizedDoors = loadedState.doors.map((door) => normalizeDoor(door));

        // Validate loaded state
        let hasLoadError = false;
        for (const door of normalizedDoors) {
          const { errors } = validateDoor(door, normalizedSettings, loadedState.doorType || doorType);
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
        setSettings(normalizedSettings);
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
      const prevDoor = currentDoors[0];
      const newDoor = prevDoor
        ? createDoor(prevDoor.width, prevDoor.height)
        : createDoor();
      return [newDoor, ...currentDoors];
    });
  };

  const removeDoor = (id) => {
    setDoors((currentDoors) => currentDoors.filter((door) => door.id !== id));
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
              setDoors([createDoor()]);
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
    const effectiveSettings = profile === "Ovolo" ? { ...settings, grooveDepth: 1.5, tongueLength: 1.5 } : settings;
    if (field === "width" || field === "height") {
      const door = doors.find((d) => d.id === id);
      if (door) {
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
        if (door.id !== id) {
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
      <div className="max-w-4xl mx-auto space-y-6 mb-8 print:hidden">
        {/* Main Settings Card */}
        <div className="bg-white rounded-sm shadow-sm p-6 border border-stone-900">
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
                onClick={() => setIsSettingsOpen(true)}
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

          {/* Settings panel has been moved to SettingsWorkspace side drawer & preview modal */}
        </div>

        {/* Door Size Stack */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-900 pb-2">
            <h3 className="font-bold text-stone-900">Door Sizes</h3>
            <span className="text-xs bg-stone-100 border border-stone-900 px-2 py-0.5 rounded-sm font-semibold text-stone-900">
              Unique Doors: {doors.length}
            </span>
          </div>

          <div className="space-y-4">
            {doors.map((door, index) => {
              const warningsObj = doorWarnings.find((w) => w.id === door.id);
              const warnings = warningsObj ? warningsObj.warnings : [];
              return (
                <DoorCard
                  key={door.id}
                  door={door}
                  index={doors.length - index - 1}
                  onUpdate={updateDoor}
                  onRemove={removeDoor}
                  warnings={warnings}
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
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        updateSetting={updateSetting}
        setSettings={setSettings}
        doorType={doorType}
        setDoorType={setDoorType}
        doors={doors}
        species={species}
        updateDoor={updateDoor}
        profile={profile}
      />
    </div>
  );
};

export default App;
