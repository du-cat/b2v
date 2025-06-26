import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ChevronRight, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { getProviderById } from '../../config/integrationsConfig';
import { IntegrationService } from '../../services/integrationService';
import { useStoreStore } from '../../store/storeStore';
import toast from 'react-hot-toast';

// Import wizard step components
import { IntroStep } from './wizard-steps/IntroStep';
import { OAuthStep } from './wizard-steps/OAuthStep';
import { CredentialsStep } from './wizard-steps/CredentialsStep';
import { WebhookStep } from './wizard-steps/WebhookStep';
import { TestConnectionStep } from './wizard-steps/TestConnectionStep';
import { CompleteStep } from './wizard-steps/CompleteStep';
import { DownloadStep } from './wizard-steps/DownloadStep';
import { SyncConfigStep } from './wizard-steps/SyncConfigStep';
import { MerchantSelectStep } from './wizard-steps/MerchantSelectStep';
import { AccountSelectStep } from './wizard-steps/AccountSelectStep';
import { RestaurantSelectStep } from './wizard-steps/RestaurantSelectStep';
import { SFTPConfigStep } from './wizard-steps/SFTPConfigStep';

// Step component mapping
const stepComponents: Record<string, React.ComponentType<any>> = {
  IntroStep,
  OAuthStep,
  CredentialsStep,
  WebhookStep,
  TestConnectionStep,
  CompleteStep,
  DownloadStep,
  SyncConfigStep,
  MerchantSelectStep,
  AccountSelectStep,
  RestaurantSelectStep,
  SFTPConfigStep
};

export function IntegrationWizard() {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const currentStore = useStoreStore(state => state.currentStore);
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get provider configuration
  const provider = providerId ? getProviderById(providerId) : undefined;
  
  // Handle close
  const handleClose = () => {
    navigate('/integrations');
  };
  
  // Handle next step
  const handleNext = async (data?: Record<string, any>) => {
    // Update step data with new data
    const updatedStepData = {
      ...stepData,
      ...data
    };
    setStepData(updatedStepData);
    
    // If this is the last step, complete the wizard
    if (currentStepIndex === provider?.steps.length - 1) {
      await handleComplete(updatedStepData);
      return;
    }
    
    // Move to the next step
    setCurrentStepIndex(prev => prev + 1);
  };
  
  // Handle previous step
  const handlePrevious = () => {
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  };
  
  // Handle wizard completion
  const handleComplete = async (data: Record<string, any>) => {
    if (!provider || !currentStore) return;
    
    setIsSubmitting(true);
    
    try {
      // Connect to the provider
      const result = await IntegrationService.connect(
        currentStore.id,
        provider.id,
        data.credentials || data
      );
      
      if (!result.success) {
        toast.error(`Failed to connect to ${provider.label}: ${result.message}`);
        setIsSubmitting(false);
        return;
      }
      
      // Show success message
      toast.success(`Successfully connected to ${provider.label}`);
      
      // Navigate back to integrations page
      navigate('/integrations');
    } catch (error) {
      console.error(`Failed to complete ${provider.label} integration:`, error);
      toast.error(`Failed to connect to ${provider.label}: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If provider not found, show error
  if (!provider) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Provider Not Found</CardTitle>
            <CardDescription>
              The requested integration provider was not found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/integrations')}>
              Back to Integrations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Get current step
  const currentStep = provider.steps[currentStepIndex];
  const StepComponent = stepComponents[currentStep.component];
  
  // If step component not found, show error
  if (!StepComponent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Step Component Not Found</CardTitle>
            <CardDescription>
              The component for this step was not found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleClose}>
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle>{provider.label} Integration</CardTitle>
          <CardDescription>
            {currentStep.title}
          </CardDescription>
          
          {/* Step indicator */}
          <div className="flex items-center mt-4">
            {provider.steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div 
                  className={`flex items-center justify-center h-8 w-8 rounded-full ${
                    index < currentStepIndex 
                      ? 'bg-teal-100 text-teal-600' 
                      : index === currentStepIndex 
                        ? 'bg-teal-600 text-white' 
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {index < provider.steps.length - 1 && (
                  <div 
                    className={`h-1 w-10 ${
                      index < currentStepIndex ? 'bg-teal-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <p className="text-slate-600 mb-6">{currentStep.description}</p>
            
            {/* Render the current step component */}
            <StepComponent
              provider={provider}
              stepData={stepData}
              onNext={handleNext}
              {...currentStep.props}
            />
          </motion.div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0 || isSubmitting}
            >
              Back
            </Button>
            
            {currentStep.component !== 'OAuthStep' && 
             currentStep.component !== 'TestConnectionStep' && 
             currentStep.component !== 'CompleteStep' && (
              <Button
                onClick={() => handleNext()}
                disabled={isSubmitting}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                {currentStepIndex === provider.steps.length - 1 ? 'Complete' : 'Next'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}