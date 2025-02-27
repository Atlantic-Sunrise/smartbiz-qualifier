
import { useState, useEffect, useRef } from "react";
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
import { PageContainer } from "@/components/layout/PageContainer";
import { Camera, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function BusinessProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    industry: '',
    employeeCount: '',
    annualRevenue: '',
    businessServices: '',
    logoUrl: ''
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Fetch profile data directly from Supabase
  useEffect(() => {
    async function fetchProfile() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to view this page.",
          });
          navigate("/auth");
          return;
        }

        // Fetch profile data for this user
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load profile data. Please try again.",
          });
          return;
        }

        console.log("Profile data retrieved:", data);
        setProfile(data);
        
        // Populate form with retrieved data
        setFormData({
          companyName: data.company_name || '',
          jobTitle: data.job_title || '',
          industry: data.industry || '',
          employeeCount: data.employee_count || '',
          annualRevenue: data.annual_revenue || '',
          businessServices: data.business_services || '',
          logoUrl: data.logo_url || ''
        });
      } catch (error) {
        console.error('Error in fetchProfile:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile data",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [navigate, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No user found. Please sign in again.");
      }

      // Prepare data to update
      const profileData = {
        company_name: formData.companyName,
        industry: formData.industry,
        employee_count: formData.employeeCount,
        annual_revenue: formData.annualRevenue,
        business_services: formData.businessServices,
        job_title: formData.jobTitle,
        logo_url: formData.logoUrl,
        updated_at: new Date()
      };

      console.log("Updating profile for user ID:", user.id);
      console.log("Update data:", profileData);

      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      // Refresh profile data
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (fetchError) {
        console.error("Error refreshing profile data:", fetchError);
      } else {
        setProfile(data);
      }

      toast({
        title: "Profile Updated",
        description: "Your business profile has been saved successfully.",
      });
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please upload an image file.",
      });
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Logo image must be less than 2MB.",
      });
      return;
    }

    try {
      setUploadingLogo(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`; // Simplified path without subfolder

      // Upload to Supabase Storage - using the correct bucket name
      console.log("Attempting to upload to bucket 'business-assets'");
      const { data, error: uploadError } = await supabase.storage
        .from('business-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading logo:', uploadError);
        throw uploadError;
      }

      console.log("Upload successful, data:", data);

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('business-assets')
        .getPublicUrl(filePath);

      console.log("Public URL data:", urlData);
      
      // Update form data with the new logo URL
      setFormData(prev => ({ ...prev, logoUrl: urlData.publicUrl }));
      
      toast({
        title: "Logo Uploaded",
        description: "Your business logo has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        variant: "destructive", 
        title: "Upload Failed",
        description: error.message || "There was a problem uploading your logo. Please try again.",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading && !profile) {
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
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="w-full md:w-3/4">
                <Label htmlFor="companyName">Company Name</Label>
                <Input 
                  id="companyName" 
                  name="companyName" 
                  value={formData.companyName}
                  onChange={handleChange}
                  required 
                />
              </div>
              
              <div className="w-full md:w-1/4 flex flex-col items-center">
                <Label htmlFor="logo" className="self-start mb-2">Company Logo</Label>
                <div className="relative group">
                  <Avatar className="h-24 w-24 cursor-pointer border-2 border-gray-200 hover:border-primary">
                    <AvatarImage src={formData.logoUrl} alt={formData.companyName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {formData.companyName ? formData.companyName.substring(0, 2).toUpperCase() : "BL"}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="logo"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                </div>
                <div className="mt-2 text-center">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                    <Upload className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
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
