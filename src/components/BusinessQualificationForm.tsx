
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { BusinessFormData } from "@/constants/businessFormConstants";
import { FormFields } from "./business-form/FormFields";
import { SubmitButton } from "./business-form/SubmitButton";
import { submitBusinessForm } from "@/services/businessFormService";

export function BusinessQualificationForm({ onResults }: { onResults: (data: any, businessName: string) => void }) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<BusinessFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const onIndustrySelect = (value: string) => {
    setValue("industry", value);
  };

  const onEmployeeCountSelect = (value: string) => {
    setValue("employeeCount", value);
  };

  const onRevenueSelect = (value: string) => {
    setValue("annualRevenue", value);
  };

  const handleVoiceInput = (value: string) => {
    setValue("challenges", value);
  };

  const onSubmit = async (data: BusinessFormData) => {
    setIsLoading(true);
    try {
      console.log('Submitting business form with data:', data);
      const analysis = await submitBusinessForm(data);
      console.log('Analysis result:', analysis);
      onResults(analysis, data.companyName);
      
      toast({
        title: "Success",
        description: "Form data has been saved successfully.",
      });
    } catch (error: any) {
      console.error('Error processing form:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Card className="w-full p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormFields
            register={register}
            errors={errors}
            onIndustrySelect={onIndustrySelect}
            onEmployeeCountSelect={onEmployeeCountSelect}
            onRevenueSelect={onRevenueSelect}
            handleVoiceInput={handleVoiceInput}
          />
          <SubmitButton isLoading={isLoading} />
        </form>
      </Card>
    </div>
  );
}
