import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { AlertCircle } from 'lucide-react';

interface Field {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
}

interface SFTPConfigStepProps {
  fields: Field[];
  onNext: (data: Record<string, any>) => void;
}

export function SFTPConfigStep({ fields, onNext }: SFTPConfigStepProps) {
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
      
      // Host validation
      if (field.name === 'sftp_host' && formData[field.name]) {
        const hostRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
        if (!hostRegex.test(formData[field.name]) && !formData[field.name].match(/^\d+\.\d+\.\d+\.\d+$/)) {
          newErrors[field.name] = 'Please enter a valid hostname or IP address';
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
    onNext({ sftp_config: formData });
    
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
        <h3 className="font-medium text-blue-800 mb-2">SFTP Configuration</h3>
        <p className="text-blue-700 text-sm">
          Enter your SFTP server details to allow us to securely retrieve data files from your system.
          These credentials will be encrypted and stored securely.
        </p>
      </div>
      
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