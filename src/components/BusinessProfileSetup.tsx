
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TOP_INDUSTRIES, EMPLOYEE_RANGES, REVENUE_RANGES } from "@/constants/businessFormConstants";

export function BusinessProfileSetup({ onComplete }: { onComplete: () => void }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const profileData = {
      company_name: formData.get('companyName'),
      industry: formData.get('industry'),
      employee_count: formData.get('employeeCount'),
      annual_revenue: formData.get('annualRevenue'),
      main_challenges: formData.get('challenges'),
      job_title: formData.get('jobTitle'),
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your business profile has been saved successfully.",
      });
      
      onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Set Up Your Business Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="companyName">Company Name</Label>
          <Input id="companyName" name="companyName" required />
        </div>

        <div>
          <Label htmlFor="jobTitle">Your Job Title</Label>
          <Input id="jobTitle" name="jobTitle" required />
        </div>

        <div>
          <Label htmlFor="industry">Industry</Label>
          <Select name="industry" required>
            <SelectTrigger>
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {TOP_INDUSTRIES.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="employeeCount">Company Size</Label>
          <Select name="employeeCount" required>
            <SelectTrigger>
              <SelectValue placeholder="Select company size" />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYEE_RANGES.map((range) => (
                <SelectItem key={range} value={range}>
                  {range}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="annualRevenue">Annual Revenue</Label>
          <Select name="annualRevenue" required>
            <SelectTrigger>
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
        </div>

        <div>
          <Label htmlFor="challenges">Main Business Challenges</Label>
          <Input
            id="challenges"
            name="challenges"
            placeholder="What are your main business challenges?"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </Card>
  );
}
