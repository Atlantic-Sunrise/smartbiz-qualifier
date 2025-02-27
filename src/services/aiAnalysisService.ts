
import { BusinessFormData } from "@/constants/businessFormConstants";
import { supabase } from "@/integrations/supabase/client";
import { FirecrawlService } from '@/utils/FirecrawlService';

export async function analyzeBusinessLead(data: BusinessFormData) {
  // Get the user's business profile
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  let websiteData = "";
  if (data.website) {
    try {
      console.log('Starting website crawl for:', data.website);
      const crawlResult = await FirecrawlService.crawlWebsite(data.website);
      if (crawlResult.success && crawlResult.data) {
        websiteData = `Website Analysis:
          Found Content: ${JSON.stringify(crawlResult.data).substring(0, 1500)}`;
      }
    } catch (error) {
      console.error('Error crawling website:', error);
      websiteData = "Note: Website analysis failed or was unavailable.";
    }
  }

  // Prepare the input for analysis
  const analysisInput = {
    businessProfile: {
      company: profile?.company_name,
      industry: profile?.industry,
      size: profile?.employee_count,
      revenue: profile?.annual_revenue,
      services: profile?.business_services
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

  try {
    // Call the Edge Function that will handle the API key securely
    const { data: result, error } = await supabase.functions.invoke(
      'analyze-lead', 
      { body: analysisInput }
    );

    if (error) {
      console.error("Error calling analyze-lead function:", error);
      throw new Error("AI service unavailable. Please try again later.");
    }

    return result;
  } catch (error) {
    console.error("Error with AI Analysis:", error);
    throw new Error("AI service unavailable. Please try again later.");
  }
}
