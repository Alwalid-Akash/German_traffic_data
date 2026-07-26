const CATEGORY_LABELS = {
  1: "Fatal injury accident",
  2: "Serious injury accident",
  3: "Minor injury accident",
};

const TYPE_LABELS = {
  1: "Driving accident",
  2: "Turning accident",
  3: "Crossing accident",
  4: "Pedestrian crossing accident",
  5: "Stationary traffic accident",
  6: "Longitudinal traffic accident",
  7: "Other accident",
};

function optionLabel(fieldType, value) {
  if (fieldType === "category-select") {
    return CATEGORY_LABELS[value] ? `${CATEGORY_LABELS[value]} (${value})` : String(value);
  }
  if (fieldType === "type-select") {
    return TYPE_LABELS[value] ? `${TYPE_LABELS[value]} (${value})` : String(value);
  }
  return String(value);
}

export default function SelectField({ field, value, onChange, options, stateOptions }) {
  const lookup = {
    "year-select": options?.years || [],
    "month-select": options?.months || [],
    "category-select": options?.categories || [],
    "type-select": options?.types || [],
  };

  if (field.type === "state-select") {
    const states = options?.states?.length ? options.states : stateOptions || [];
    return (
      <select className="form-select" value={value || ""} onChange={(event) => onChange(event.target.value)} required={field.required}>
        <option value="">Select state</option>
        {states.map((state) => (
          <option key={state.ags} value={state.ags}>
            {state.ags} - {state.name}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "region-select") {
    const regions = options?.regions || [];
    return (
      <select className="form-select" value={value || ""} required={field.required} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select region</option>
        {regions.map((region) => (
          <option key={`${region.level}-${region.ags}`} value={region.name}>
            {region.name} ({region.level})
          </option>
        ))}
      </select>
    );
  }

  const values = lookup[field.type];
  if (!values) return null;

  return (
    <select className="form-select" value={value || ""} onChange={(event) => onChange(event.target.value)} required={field.required}>
      <option value="">Select {field.label.toLowerCase()}</option>
      {values.map((item) => (
        <option key={item} value={item}>
          {optionLabel(field.type, item)}
        </option>
      ))}
    </select>
  );
}
