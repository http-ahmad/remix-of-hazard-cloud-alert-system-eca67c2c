import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface ZeroResetInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  allowNegative?: boolean;
  className?: string;
}

/**
 * Input component with a safe zero reset button
 * Allows setting values to exactly 0 without validation issues
 */
const ZeroResetInput: React.FC<ZeroResetInputProps> = ({
  value,
  onChange,
  min = 0,
  max,
  step = 0.1,
  unit,
  allowNegative = false,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Allow empty, zero, or negative sign during typing
    if (val === '' || val === '0' || (allowNegative && val === '-')) {
      onChange(0);
      return;
    }
    
    const num = parseFloat(val);
    if (!isNaN(num)) {
      // Apply min/max constraints
      let constrainedValue = num;
      if (!allowNegative && constrainedValue < 0) constrainedValue = 0;
      if (min !== undefined && constrainedValue < min) constrainedValue = min;
      if (max !== undefined && constrainedValue > max) constrainedValue = max;
      onChange(constrainedValue);
    }
  };

  const handleReset = () => {
    onChange(allowNegative ? 0 : Math.max(0, min ?? 0));
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="relative flex-1">
        <Input
          type="number"
          step={step}
          min={allowNegative ? undefined : min}
          max={max}
          value={value}
          onChange={handleChange}
          className="pr-8"
        />
        {unit && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {unit}
          </span>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={handleReset}
        title="Reset to zero"
      >
        <RotateCcw className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default ZeroResetInput;
