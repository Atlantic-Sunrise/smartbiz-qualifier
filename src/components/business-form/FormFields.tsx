
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TOP_INDUSTRIES, EMPLOYEE_RANGES, REVENUE_RANGES } from "@/constants/businessFormConstants";
import { VoiceInput } from "../VoiceInput";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { BusinessFormData } from "@/constants/businessFormConstants";

interface FormFieldsProps {
  register: UseFormRegister<BusinessFormData>;
  errors: FieldErrors<BusinessFormData>;
  onIndustrySelect: (value: string) => void;
  onEmployeeCountSelect: (value: string) => void;
  onRevenueSelect: (value: string) => void;
  handleVoiceInput: (value: string) => void;
}

export function FormFields({
  register,
  errors,
  onIndustrySelect,
  onEmployeeCountSelect,
  onRevenueSelect,
  handleVoiceInput
}: FormFieldsProps) {
  return (
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
          <p className="text-sm text-gray-500 mt-1 mb-2">Type in the field above or use voice input:</p>
          <VoiceInput onFieldUpdate={handleVoiceInput} />
        </div>
        {errors.challenges && (
          <p className="text-red-500 text-sm mt-1">{errors.challenges.message}</p>
        )}
      </div>
    </div>
  );
}
