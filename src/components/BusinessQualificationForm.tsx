
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

  const onSubmit = async (data: BusinessFormData) => {
    setIsLoading(true);
    try {
      const analysis = await analyzeBusinessLead(data);
      onResults(analysis);
    } catch (error) {
      console.error('Error analyzing business:', error);
      toast({
        title: "Error",
        description: "Failed to analyze business. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full p-8 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg animate-fadeIn">
        <VoiceInput onFieldUpdate={setValue} />

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
                  <SelectValue placeholder="Select your industry" />
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
              <Input
                id="challenges"
                {...register("challenges", { required: "Business challenges are required" })}
                className="mt-1"
                placeholder="Describe the main challenges faced by the business"
              />
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
