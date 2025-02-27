
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
    const { question, context } = await req.json();

    // Use the shared API key from environment variables
    const apiKey = Deno.env.get("GEMINI_API_KEY") || "";
    
    if (!apiKey) {
      throw new Error("API key not configured on server");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a business lead qualification expert. I'm going to provide you with information 
      about a qualified business lead and then ask you a question about it.
      
      Here is the lead qualification information:
      ${context}
      
      Based on this information, please answer the following question:
      ${question}
      
      Provide a concise, professional response focused on actionable insights. Limit your 
      response to 3-4 sentences.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();
    
    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in answer-question function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate answer",
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
