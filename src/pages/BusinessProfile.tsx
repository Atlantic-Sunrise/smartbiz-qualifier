
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useProfile } from "@/context/ProfileContext";
import { PageContainer } from "@/components/layout/PageContainer";

export default function BusinessProfile() {
  const { profile, refreshProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    industry: '',
    employeeCount: '',
    annualRevenue: '',
    businessServices: ''
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Load profile data when component mounts or profile changes
  useEffect(() => {
    if (profile) {
      console.log("Profile loaded:", profile); // Debug log
      setFormData({
        companyName: profile.company_name || '',
        jobTitle: profile.job_title || '',
        industry: profile.industry || '',
        employeeCount: profile.employee_count || '',
        annualRevenue: profile.annual_revenue || '',
        businessServices: profile.business_services || ''
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const profileData = {
      company_name: formData.companyName,
      industry: formData.industry,
      employee_count: formData.employeeCount,
      annual_revenue: formData.annualRevenue,
      business_services: formData.businessServices,
      job_title: formData.jobTitle,
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No user found. Please sign in again.");
      }

      console.log("Updating profile for user ID:", user.id); // Debug log

      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) {
        console.error("Supabase update error:", error); // Debug log
        throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Your business profile has been saved successfully.",
      });
      
      await refreshProfile();
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

  if (!profile) {
    return (
      <PageContainer>
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-40">
            <p className="text-lg">Loading profile data...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Business Profile</h1>
          <p className="text-muted-foreground mt-2">
            Update your business information below
          </p>
        </div>
        <Card className="w-full p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input 
                id="companyName" 
                name="companyName" 
                value={formData.companyName}
                onChange={handleChange}
                required 
              />
            </div>

            <div>
              <Label htmlFor="jobTitle">Your Job Title</Label>
              <Input 
                id="jobTitle" 
                name="jobTitle" 
                value={formData.jobTitle}
                onChange={handleChange}
                required 
              />
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <Select 
                name="industry" 
                value={formData.industry} 
                onValueChange={(value) => handleSelectChange('industry', value)}
              >
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
              <Select 
                name="employeeCount" 
                value={formData.employeeCount}
                onValueChange={(value) => handleSelectChange('employeeCount', value)}
              >
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
              <Select 
                name="annualRevenue" 
                value={formData.annualRevenue}
                onValueChange={(value) => handleSelectChange('annualRevenue', value)}
              >
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
              <Label htmlFor="businessServices">Business Services</Label>
              <Input
                id="businessServices"
                name="businessServices"
                value={formData.businessServices}
                onChange={handleChange}
                placeholder="What services does your business provide?"
                required
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
}
