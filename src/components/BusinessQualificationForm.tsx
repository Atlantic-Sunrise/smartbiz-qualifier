
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { BusinessFormData } from "@/constants/businessFormConstants";
import { FormFields } from "./business-form/FormFields";
import { SubmitButton } from "./business-form/SubmitButton";
import { submitBusinessForm } from "@/services/businessFormService";

export function BusinessQualificationForm({ onResults }: { onResults: (data: any) => void }) {
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
      const analysis = await submitBusinessForm(data);
      onResults(analysis);
      
      toast({
        title: "Success",
        description: "Form data has been saved successfully.",
      });
    } catch (error) {
      console.error('Error processing form:', error);
      toast({
        title: "Error",
        description: "Failed to process form. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full p-8 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg animate-fadeIn">
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
