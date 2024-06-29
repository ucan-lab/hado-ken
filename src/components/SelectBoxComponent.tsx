import React from 'react';
import Select from 'react-select';

interface SelectBoxProps {
  label: React.ReactNode;
  value: { label: string; value: string } | null;
  options: { label: string; value: string }[];
  onChange: (selectedOption: { label: string; value: string } | null) => void;
}

const SelectBoxComponent: React.FC<SelectBoxProps> = ({ label, value, options, onChange }) => {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 font-bold mb-2">{label}</label>
      <Select
        value={value}
        onChange={onChange}
        options={options}
        className="w-full"
        classNamePrefix="react-select"
        placeholder="-"
        isSearchable
      />
    </div>
  );
};

export default SelectBoxComponent;
