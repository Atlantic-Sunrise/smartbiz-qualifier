
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QualificationSummaryEmailData {
  email: string;
  businessName: string;
  score: number;
  summary: string;
  insights: string[];
  recommendations: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the request body
    const emailData: QualificationSummaryEmailData = await req.json();
    const { email, businessName, score, summary, insights, recommendations } = emailData;

    if (!email) {
      throw new Error("Email is required");
    }

    // Create HTML table for insights and recommendations
    const insightsHtml = insights.map(insight => `<tr><td>${insight}</td></tr>`).join("");
    const recommendationsHtml = recommendations.map(rec => `<tr><td>${rec}</td></tr>`).join("");

    // Format the email HTML
    const emailHtml = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .score { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
          .score-value { 
            font-size: 42px; 
            color: ${score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444'};
          }
          .summary { margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          table, th, td { border: 1px solid #e5e7eb; }
          th { background-color: #f3f4f6; padding: 10px; text-align: left; }
          td { padding: 10px; }
          .section-title { font-size: 18px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Business Lead Qualification Summary</h1>
            <p>For: ${businessName}</p>
          </div>
          
          <div class="score">
            Qualification Score: <span class="score-value">${score}</span>/100
          </div>
          
          <div class="summary">
            <strong>Summary:</strong> ${summary}
          </div>
          
          <div>
            <p class="section-title">Key Insights:</p>
            <table>
              <thead>
                <tr>
                  <th>Insights</th>
                </tr>
              </thead>
              <tbody>
                ${insightsHtml}
              </tbody>
            </table>
            
            <p class="section-title">Recommendations:</p>
            <table>
              <thead>
                <tr>
                  <th>Recommendations</th>
                </tr>
              </thead>
              <tbody>
                ${recommendationsHtml}
              </tbody>
            </table>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center;">
            This is an automated summary from Business Lead Qualifier. 
            Please do not reply to this email.
          </p>
        </div>
      </body>
    </html>
    `;

    // Send the email using Supabase Edge Function
    const { error } = await supabaseClient.auth.admin.sendRawEmail({
      email,
      subject: `Lead Qualification Summary: ${businessName}`,
      body: emailHtml,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-qualification-summary function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send qualification summary email",
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 500,
      }
    );
  }
};

serve(handler);
