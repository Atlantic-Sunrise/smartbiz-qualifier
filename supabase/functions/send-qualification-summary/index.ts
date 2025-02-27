import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QualificationSummaryEmailData {
  email: string;
  businessName: string;
  score: number;
  summary: string;
  insights: string[];
  recommendations: string[];
  keyNeed?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: QualificationSummaryEmailData = await req.json();
    const { email, businessName, score, summary, insights, recommendations, keyNeed } = data;

    const scoreColor = score >= 80 ? "#34D399" : score >= 60 ? "#FBBF24" : "#EF4444";
    
    const insightsList = insights
      .map((insight) => `<li style="margin-bottom: 10px;">${insight}</li>`)
      .join("");
      
    const recommendationsList = recommendations
      .map((recommendation) => `<li style="margin-bottom: 10px;">${recommendation}</li>`)
      .join("");

    const emailResponse = await resend.emails.send({
      from: "Qualification App <onboarding@resend.dev>",
      to: [email],
      subject: `Lead Qualification Summary: ${businessName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="margin-bottom: 0;">Lead Qualification Summary</h1>
              <p style="font-size: 18px; margin-top: 5px;">${businessName}</p>
            </div>
            
            <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; width: 120px; height: 120px; line-height: 120px; border-radius: 50%; background-color: ${scoreColor}; color: white; font-size: 36px; font-weight: bold; text-align: center; margin-bottom: 10px;">
                  ${score}
                </div>
                <p style="font-size: 20px; font-weight: bold; margin: 0;">Qualification Score</p>
              </div>
              
              <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-top: 20px;">Summary</h3>
              <p>${summary}</p>
              
              ${keyNeed ? `
              <div style="background-color: #F3E8FF; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #7E22CE;">Key Need: ${keyNeed}</h3>
              </div>
              ` : ''}
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 30px;">
              <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px;">
                <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 10px;">Insights</h3>
                <ul style="padding-left: 20px;">
                  ${insightsList}
                </ul>
              </div>
              
              <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px;">
                <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 10px;">Recommendations</h3>
                <ul style="padding-left: 20px;">
                  ${recommendationsList}
                </ul>
              </div>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px; margin-top: 40px;">
              <p>This is an automated summary generated by your qualification tool.</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-qualification-summary function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
