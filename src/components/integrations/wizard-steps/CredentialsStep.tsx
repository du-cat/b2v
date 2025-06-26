import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';

interface Field {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
}

interface CredentialsStepProps {
  fields: Field[];
  onNext: (data: Record<string, any>) => void;
}

export function CredentialsStep({ fields, onNext }: CredentialsStepProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
      
      // IP address validation for fields with "ip" in the name
      if (field.name.includes('ip') && formData[field.name]) {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipRegex.test(formData[field.name])) {
          newErrors[field.name] = 'Please enter a valid IP address';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Process and submit the form data
    onNext({ credentials: formData });
    
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          <Input
            label={field.label}
            name={field.name}
            type={field.type}
            placeholder={field.placeholder}
            value={formData[field.name] || ''}
            onChange={handleChange}
            error={errors[field.name]}
            required={field.required}
          />
        </div>
      ))}
      
      {Object.keys(errors).length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Please fix the following errors:</p>
            <ul className="list-disc list-inside mt-1">
              {Object.values(errors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      <div className="pt-4">
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="w-full"
        >
          Continue
        </Button>
      </div>
    </form>
  );
}