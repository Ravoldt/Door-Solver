import { useEffect, useMemo, useState } from "react";
import { ChevronDown, FileText, FolderOpen, Plus, Printer, Save, SlidersHorizontal, Trash2 } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { calculateData } from "./calculations";
import CutListDocument from "./components/CutListDocument";
import DimensionInput from "./components/DimensionInput";
import DoorCard from "./components/DoorCard";
import { parseFraction } from "./utils";
import { DEFAULT_SETTINGS, STYLE_REQUIRED_SETTINGS, DOOR_STYLES } from "./doorconfig";

export const PREDEFINED_SPECIES = [
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
    middleRailWidth: parseDimension(loadedSettings.middleRailWidth, DEFAULT_SETTINGS.middleRailWidth),
    bottomRailWidth: parseDimension(loadedSettings.bottomRailWidth, DEFAULT_SETTINGS.bottomRailWidth),
    heightToMiddleRail: parseDimension(loadedSettings.heightToMiddleRail, DEFAULT_SETTINGS.heightToMiddleRail),
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
const settingsPanelClassName =
  "p-4 bg-white rounded-sm border border-stone-900";
const dimensionInputClassName =
  "w-full p-1 mt-1 border border-stone-900 rounded-sm focus:border-[#00A69C] outline-none";

const SETTING_GROUPS = [
  {
    title: "Stiles",
    fields: [
      { name: "stileWidth", label: "Stile Width" },
      { name: "stileThickness", label: "Stile Thickness" },
    ],
  },
  {
    title: "Rails",
    fields: [
      { name: "topRailWidth", label: "Top Rail Width" },
      { name: "middleRailWidth", label: "Middle Rail Width" },
      { name: "bottomRailWidth", label: "Bottom Rail Width" },
      { name: "heightToMiddleRail", label: "Height to Middle Rail" },
    ],
  },
  {
    title: "Joinery",
    fields: [
      { name: "grooveDepth", label: "Groove Depth" },
      { name: "tongueLength", label: "Tongue Length" },
      { name: "verticalPanelClearance", label: "Vertical Panel Clearance" },
      { name: "horizontalPanelClearance", label: "Horizontal Panel Clearance" },
    ],
  },
];

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
  const [isSpeciesDropdownOpen, setIsSpeciesDropdownOpen] = useState(false);

  const species = selectedSpecies === "Custom" ? customText : selectedSpecies;
  const [profile, setProfile] = useState(() => {
    return localStorage.getItem("door_calculator_profile") ?? "Shaker";
  });
  const [finish, setFinish] = useState(() => {
    return localStorage.getItem("door_calculator_finish") ?? "Paint";
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

  const data = useMemo(() => calculateData(doors, settings, doorType, profile), [doors, settings, doorType, profile]);

  const updateSetting = (field, value) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }));
  };

  const handleSave = () => {
    const stateToSave = {
      jobName,
      doorType,
      doors,
      settings,
      species,
      profile,
      finish,
      appVersion: "1.0",
    };

    const blob = new Blob([JSON.stringify(stateToSave, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${jobName.replace(/ /g, "_") || "door_job"}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleLoad = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const loadedState = JSON.parse(loadEvent.target.result);
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
      } catch (error) {
        console.error("Failed to load or parse file:", error);
        toast.error("Failed to load file. It may be corrupted.");
      }
    };

    reader.readAsText(file);
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
    if (window.confirm("Are you sure you want to clear all door sizes and reset all settings?")) {
      setDoors([createDoor()]);
      setSettings(DEFAULT_SETTINGS);
      setJobName("Job Name");
      setDoorType("2 Panel");
      setSelectedSpecies("Poplar");
      setCustomText("");
      setProfile("Shaker");
      setFinish("Stain");
      toast.success("Calculator reset successfully");
    }
  };

  const updateDoor = (id, field, value) => {
    setDoors((currentDoors) =>
      currentDoors.map((door) => {
        if (door.id !== id) {
          return door;
        }

        return { ...door, [field]: value };
      }),
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 md:p-8 font-sans print:p-0 print:bg-white print:min-h-0">
      <Toaster position="top-right" />

      {/* Input specifications: hidden in print mode */}
      <div className="max-w-4xl mx-auto space-y-6 mb-8 print:hidden">
        {/* Main Settings Card */}
        <div className="bg-white rounded-sm shadow-sm p-6 border border-stone-900">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <FileText className="text-[#00A69C]" /> Door Parts List Calculator
          </h2>

          {/* Job Name */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-stone-900 uppercase mb-2">Job Name</label>
            <input
              className={inputLineClassName}
              value={jobName}
              onChange={(event) => setJobName(event.target.value)}
            />
          </div>

          {/* Door Style - Horizontally scrolling list */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-stone-900 uppercase mb-3">Door Style / Material</label>
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
                    {/* SVG Sketch Placeholder */}
                    <div className={`aspect-square w-full rounded border flex flex-col items-center justify-center mb-3 transition-colors ${isSelected
                      ? "border-teal-300 bg-teal-50/50"
                      : "border-dashed border-stone-300 bg-stone-100"
                      }`}>
                      <div className={`w-8 border-b-2 mb-1.5 ${isSelected ? "border-[#00A69C]" : "border-stone-400"}`}></div>
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">SVG Sketch</span>
                    </div>

                    <div className="flex items-center justify-between">
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

          {/* Species, Profile and Finish row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Species Selection */}
            <div className="relative">
              <label className="block text-xs font-semibold text-stone-900 uppercase mb-2">
                Wood Species
              </label>

              <div className="relative flex items-center border-b-2 border-stone-900 focus-within:border-[#00A69C] bg-transparent">
                {/* Hybrid Input */}
                <input
                  type="text"
                  value={selectedSpecies === "Custom" ? customText : selectedSpecies}
                  onChange={(e) => setCustomText(e.target.value)}
                  readOnly={selectedSpecies !== "Custom"}
                  // If it's a preset, clicking the input opens the menu. If custom, let them click to type.
                  onClick={() => {
                    if (selectedSpecies !== "Custom") setIsSpeciesDropdownOpen(!isSpeciesDropdownOpen);
                  }}
                  className={`w-full py-1.5 pl-0 pr-8 text-lg bg-transparent text-stone-900 focus:outline-none 
                    ${selectedSpecies !== "Custom" ? "cursor-pointer" : "cursor-text"}`}
                  placeholder={selectedSpecies === "Custom" ? "Enter custom species..." : ""}
                />

                {/* Toggle Arrow */}
                <button
                  type="button"
                  onClick={() => setIsSpeciesDropdownOpen(!isSpeciesDropdownOpen)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-900 hover:text-[#00A69C] focus:outline-none"
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              {/* Wide Dropdown Menu */}
              {isSpeciesDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsSpeciesDropdownOpen(false)}
                  />
                  <ul className="absolute left-0 top-full z-20 mt-1 max-h-60 w-full overflow-auto border border-stone-900 bg-white shadow-lg rounded-sm">
                    {[...PREDEFINED_SPECIES, "Custom"].map((option) => (
                      <li
                        key={option}
                        onClick={() => {
                          setSelectedSpecies(option);
                          setIsSpeciesDropdownOpen(false);
                          if (option !== "Custom") {
                            setCustomText(""); // Clear custom text if they switch back to a preset
                          }
                        }}
                        className={`cursor-pointer px-4 py-2 hover:bg-teal-50 hover:text-teal-700
                          ${selectedSpecies === option ? "bg-stone-100 font-bold" : "text-stone-850"}
                        `}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

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

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={addDoor}
              className={primaryButtonClassName}
            >
              <Plus size={18} /> Add New Door
            </button>

            <button
              type="button"
              className={secondaryButtonClassName}
              aria-expanded={isSettingsOpen}
              onClick={() => setIsSettingsOpen((currentValue) => !currentValue)}
            >
              <SlidersHorizontal size={18} /> Settings
              <ChevronDown
                size={16}
                className={`transition-transform ${isSettingsOpen ? "rotate-180" : ""}`}
              />
            </button>

            <input
              type="file"
              id="loadFile"
              className="hidden"
              onChange={handleLoad}
              accept=".json"
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
              <Printer size={18} /> Print Cut List
            </button>

            <button
              onClick={handleClearAll}
              className={dangerButtonClassName}
            >
              <Trash2 size={18} /> Clear All
            </button>
          </div>

          {isSettingsOpen && (
            <div className={`mt-4 space-y-5 ${settingsPanelClassName}`}>
              {SETTING_GROUPS.map((group) => {
                const availableFields = group.fields.filter(
                  (field) => STYLE_REQUIRED_SETTINGS[doorType]?.includes(field.name)
                );

                if (availableFields.length === 0) {
                  return null;
                }

                return (
                  <section key={group.title}>
                    <h3 className="mb-3 border-b border-stone-900 pb-1 text-xs font-bold uppercase text-stone-900">
                      {group.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {availableFields.map((field) => (
                        <div key={field.name}>
                          <label className="block text-[10px] font-bold text-stone-900 uppercase">
                            {field.label}
                          </label>
                          <DimensionInput
                            className={dimensionInputClassName}
                            value={settings[field.name]}
                            onChange={(value) => updateSetting(field.name, value)}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* Door Size Stack */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-900 pb-2">
            <h3 className="font-bold text-stone-900">Door Sizes</h3>
            <span className="text-xs bg-stone-100 border border-stone-900 px-2 py-0.5 rounded-sm font-semibold text-stone-900">
              Total Added: {doors.length}
            </span>
          </div>

          <div className="space-y-4">
            {doors.map((door, index) => (
              <DoorCard
                key={door.id}
                door={door}
                index={index}
                onUpdate={updateDoor}
                onRemove={removeDoor}
              />
            ))}
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
    </div>
  );
};

export default App;
