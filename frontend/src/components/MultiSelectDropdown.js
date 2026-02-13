import { useState, useRef, useEffect } from 'react';
import './MultiSelectDropdown.css';

const MultiSelectDropdown = ({ 
  options, 
  selectedValues, 
  onChange, 
  placeholder = "请选择...",
  label,
  isMultiple = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // 点击外部关闭下拉框
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (value) => {
    if (isMultiple) {
      // 多选模式
      const newSelectedValues = [...selectedValues];
      const index = newSelectedValues.indexOf(value);
      
      if (index > -1) {
        // 如果已选中，则取消选中
        newSelectedValues.splice(index, 1);
      } else {
        // 如果未选中，则添加到选中列表
        newSelectedValues.push(value);
      }
      
      onChange(newSelectedValues);
    } else {
      // 单选模式
      onChange([value]);
      setIsOpen(false); // 单选后自动关闭下拉框
    }
  };

  const removeTag = (value, event) => {
    // 阻止事件冒泡，避免触发下拉框开关
    event.stopPropagation();
    const newSelectedValues = selectedValues.filter(item => item !== value);
    onChange(newSelectedValues);
  };

  const getSelectedLabels = () => {
    return selectedValues.map(value => {
      const option = options.find(opt => opt.value === value);
      return option ? option.label : value;
    });
  };

  return (
    <div className="multi-select-dropdown" ref={dropdownRef}>
      <label>{label}</label>
      <div className="dropdown-header" onClick={toggleDropdown}>
        <div className="selected-items">
          {selectedValues.length === 0 ? (
            <span className="placeholder">{placeholder}</span>
          ) : (
            getSelectedLabels().map((label, index) => (
              <div key={index} className="selected-tag">
                {label}
                {isMultiple && (
                  <span 
                    className="remove-tag" 
                    onClick={(e) => removeTag(selectedValues[index], e)}
                  >
                    ×
                  </span>
                )}
              </div>
            ))
          )}
        </div>
        <div className={`dropdown-arrow ${isOpen ? 'open' : ''}`}></div>
      </div>
      
      {isOpen && (
        <div className="dropdown-options">
          {options.map(option => (
            <div 
              key={option.value} 
              className={`dropdown-option ${selectedValues.includes(option.value) ? 'selected' : ''}`}
              onClick={() => handleOptionClick(option.value)}
            >
              <span className="option-checkbox">
                {selectedValues.includes(option.value) ? '✓' : ''}
              </span>
              <span className="option-label">{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;