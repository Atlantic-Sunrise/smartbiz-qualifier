
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      businessProfile,
      leadData,
      websiteData
    } = await req.json();

    // Use the shared API key from environment variables
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    
    if (!apiKey) {
      console.error("GEMINI_API_KEY not found in environment variables");
      throw new Error("API key not configured on server");
    }

    console.log("Using shared Gemini API key");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `As an expert business analyst, analyze this lead in the context of the qualifying business.

      Qualifying Business:
      Company: ${businessProfile.company}
      Industry: ${businessProfile.industry}
      Size: ${businessProfile.size}
      Revenue: ${businessProfile.revenue}
      Services: ${businessProfile.services}
      
      Lead to Qualify:
      Company: ${leadData.company}
      Industry: ${leadData.industry}
      Employees: ${leadData.employees}
      Annual Revenue: ${leadData.revenue}
      Website: ${leadData.website}
      Main Challenges: ${leadData.challenges}
      
      ${websiteData}
      
      Consider factors like industry alignment, business size compatibility, potential synergies between our services and their needs, and whether we can address their challenges. Also analyze any relevant information found from their website.
      
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
      return new Response(
        JSON.stringify(JSON.parse(text)),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (e) {
      // Try to extract JSON from text response if direct parsing fails
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return new Response(
          JSON.stringify(JSON.parse(jsonMatch[0])),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Could not parse AI response");
    }
  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "AI service unavailable. Please try again later.",
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
