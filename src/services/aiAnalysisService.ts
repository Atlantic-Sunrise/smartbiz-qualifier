
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BusinessFormData } from "@/constants/businessFormConstants";
import { supabase } from "@/integrations/supabase/client";
import { FirecrawlService } from '@/utils/FirecrawlService';

// This should be replaced with your organization's API key in a production environment
const FALLBACK_API_KEY = "AIzaSyDuUVqRJnbP9UZdWONDvnRBzr6xDKN9xRc"; // Demo API key with usage limits

export async function analyzeBusinessLead(data: BusinessFormData) {
  // Try to get user's personal API key first, then fall back to the organization key
  const apiKey = localStorage.getItem('gemini_api_key') || FALLBACK_API_KEY;
  
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

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `As an expert business analyst, analyze this lead in the context of the qualifying business.

    Qualifying Business:
    Company: ${profile?.company_name}
    Industry: ${profile?.industry}
    Size: ${profile?.employee_count}
    Revenue: ${profile?.annual_revenue}
    Services: ${profile?.business_services}
    
    Lead to Qualify:
    Company: ${data.companyName}
    Industry: ${data.industry}
    Employees: ${data.employeeCount}
    Annual Revenue: ${data.annualRevenue}
    Website: ${data.website}
    Main Challenges: ${data.challenges}
    
    ${websiteData}
    
    Consider factors like industry alignment, business size compatibility, potential synergies between our services and their needs, and whether we can address their challenges. Also analyze any relevant information found from their website.
    
    Provide a JSON response with this exact format:
    {
      "score": number between 0-100,
      "summary": "brief qualification summary",
      "insights": ["insight1", "insight2", "insight3"],
      "recommendations": ["rec1", "rec2", "rec3"]
    }`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      return JSON.parse(text);
    } catch (e) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Could not parse AI response");
    }
  } catch (error) {
    console.error("Error with Gemini API:", error);
    throw new Error("AI service unavailable. Please try again later or provide your own API key in settings.");
  }
}
