
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VoiceInput } from "./VoiceInput";
import { analyzeBusinessLead } from "@/services/aiAnalysisService";
import { supabase } from "@/integrations/supabase/client";
import {
  BusinessFormData,
  TOP_INDUSTRIES,
  EMPLOYEE_RANGES,
  REVENUE_RANGES,
} from "@/constants/businessFormConstants";

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
      const analysis = await analyzeBusinessLead(data);
      
      const user = (await supabase.auth.getUser()).data.user;
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const { error: storageError } = await supabase
        .from('business_qualifications')
        .insert({
          user_id: user.id,
          company_name: data.companyName,
          industry: data.industry,
          employee_count: data.employeeCount,
          annual_revenue: data.annualRevenue,
          website: data.website,
          challenges: data.challenges
        });

      if (storageError) {
        console.error('Error storing form data:', storageError);
        toast({
          title: "Error",
          description: "Failed to save form data. Please try again.",
          variant: "destructive",
        });
        return;
      }

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
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                {...register("companyName", { required: "Company name is required" })}
                className="mt-1"
                placeholder="Enter company name"
              />
              {errors.companyName && (
                <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <Select onValueChange={onIndustrySelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {TOP_INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.industry && (
                <p className="text-red-500 text-sm mt-1">{errors.industry.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="employeeCount">Number of Employees</Label>
              <Select onValueChange={onEmployeeCountSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select employee range" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_RANGES.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employeeCount && (
                <p className="text-red-500 text-sm mt-1">{errors.employeeCount.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="annualRevenue">Annual Revenue</Label>
              <Select onValueChange={onRevenueSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select revenue range" />
                </SelectTrigger>
                <SelectContent>
                  {REVENUE_RANGES.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.annualRevenue && (
                <p className="text-red-500 text-sm mt-1">{errors.annualRevenue.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                {...register("website")}
                className="mt-1"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="challenges">Main Business Challenges</Label>
              <div className="space-y-2">
                <textarea
                  id="challenges"
                  {...register("challenges", { required: "Business challenges are required" })}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe the main challenges faced by the business"
                  rows={4}
                />
                <VoiceInput onFieldUpdate={handleVoiceInput} />
              </div>
              {errors.challenges && (
                <p className="text-red-500 text-sm mt-1">{errors.challenges.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white transition-all duration-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Qualify Lead"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
