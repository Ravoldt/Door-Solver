import { useEffect, useState } from "react";
import { formatDecimalInput, parseFraction } from "../utils";

const DimensionInput = ({ value, onChange, className = "", ...props }) => {
  const [draftValue, setDraftValue] = useState(formatDecimalInput(value));

  useEffect(() => {
    setDraftValue(formatDecimalInput(value));
  }, [value]);

  const commitValue = () => {
    const parsedValue = parseFraction(draftValue);

    if (Number.isNaN(parsedValue)) {
      setDraftValue(formatDecimalInput(value));
      return;
    }

    onChange(parsedValue);
    setDraftValue(formatDecimalInput(parsedValue));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      value={draftValue}
      onChange={(event) => setDraftValue(event.target.value)}
      onBlur={commitValue}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      {...props}
    />
  );
};

export default DimensionInput;
