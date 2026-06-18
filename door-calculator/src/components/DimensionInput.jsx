import { useEffect, useState } from "react";
import { formatInputDimension, parseFraction } from "../utils";

const DimensionInput = ({ value, onChange, className = "", ...props }) => {
  const [draftValue, setDraftValue] = useState(formatInputDimension(value));

  useEffect(() => {
    setDraftValue(formatInputDimension(value));
  }, [value]);

  const commitValue = () => {
    const parsedValue = parseFraction(draftValue);

    if (Number.isNaN(parsedValue)) {
      setDraftValue(formatInputDimension(value));
      return;
    }

    const success = onChange(parsedValue);
    if (success === false) {
      setDraftValue(formatInputDimension(value));
    } else {
      setDraftValue(formatInputDimension(parsedValue));
    }
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
