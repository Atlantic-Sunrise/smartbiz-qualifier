
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BusinessFormData } from "@/constants/businessFormConstants";
import { supabase } from "@/integrations/supabase/client";

export async function analyzeBusinessLead(data: BusinessFormData) {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    throw new Error("Gemini API key not found");
  }

  // Get the user's business profile
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  const genAI = new GoogleGenerativeAI(apiKey);
  // Updated to use the current model name
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
    
    Consider factors like industry alignment, business size compatibility, potential synergies between our services and their needs, and whether we can address their challenges.
    
    Provide a JSON response with this exact format:
    {
      "score": number between 0-100,
      "summary": "brief qualification summary",
      "insights": ["insight1", "insight2", "insight3"],
      "recommendations": ["rec1", "rec2", "rec3"]
    }`;

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
}
