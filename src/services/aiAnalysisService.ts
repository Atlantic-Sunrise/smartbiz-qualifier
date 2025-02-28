
import { BusinessFormData } from "@/constants/businessFormConstants";
import { supabase } from "@/integrations/supabase/client";
import { FirecrawlService } from '@/utils/FirecrawlService';

export async function analyzeBusinessLead(data: BusinessFormData) {
  try {
    // Get the user's business profile
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      throw new Error("User not authenticated");
    }
    
    console.log('Getting profile for user:', user.id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw new Error("Error fetching user profile");
    }

    console.log('User profile:', profile);

    let websiteData = "";
    if (data.website) {
      try {
        console.log('Starting website crawl for:', data.website);
        const crawlResult = await FirecrawlService.crawlWebsite(data.website);
        if (crawlResult.success && crawlResult.data) {
          websiteData = `Website Analysis:
            Found Content: ${JSON.stringify(crawlResult.data).substring(0, 1500)}`;
          console.log('Website data retrieved successfully');
        }
      } catch (error) {
        console.error('Error crawling website:', error);
        websiteData = "Note: Website analysis failed or was unavailable.";
      }
    }

    // If there's no actual profile, create a minimal usable profile object
    const userProfile = profile || {
      company_name: "Your Company",
      industry: "Technology",
      employee_count: "1-10 employees",
      annual_revenue: "Under $100,000",
      business_services: "Business services"
    };

    // Prepare the input for analysis
    const analysisInput = {
      businessProfile: {
        company: userProfile.company_name,
        industry: userProfile.industry,
        size: userProfile.employee_count,
        revenue: userProfile.annual_revenue,
        services: userProfile.business_services
      },
      leadData: {
        company: data.companyName,
        industry: data.industry,
        employees: data.employeeCount,
        revenue: data.annualRevenue,
        website: data.website,
        challenges: data.challenges
      },
      websiteData: websiteData
    };

    console.log('Sending analysis input to edge function:', JSON.stringify(analysisInput).substring(0, 200) + '...');
    
    // Call the Edge Function that will handle the API key securely
    const { data: result, error } = await supabase.functions.invoke(
      'analyze-lead', 
      { body: analysisInput }
    );

    if (error) {
      console.error("Error calling analyze-lead function:", error);
      throw new Error("AI service unavailable. Please try again later.");
    }

    console.log('Analysis result received:', JSON.stringify(result).substring(0, 200) + '...');
    return result;
  } catch (error) {
    console.error("Error with AI Analysis:", error);
    throw new Error("AI service unavailable. Please try again later.");
  }
}
