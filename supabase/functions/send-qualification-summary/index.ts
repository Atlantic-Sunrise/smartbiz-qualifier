
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  console.log("Edge function invoked: send-qualification-summary");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Parsing request body");
    
    // Get the request body
    const data: QualificationSummaryEmailData = await req.json();
    const { email, businessName, score, summary, insights, recommendations } = data;

    console.log(`Received request to send summary to: ${email}`);
    console.log(`Business Name: ${businessName}, Score: ${score}`);

    if (!email) {
      throw new Error("Email is required");
    }

    // Verify Resend API Key
    const apiKey = Deno.env.get("RESEND_API_KEY");
    console.log(`Resend API Key present: ${Boolean(apiKey)}`);
    
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    // Get qualification status
    const status = getQualificationStatus(score);

    // Format the insights HTML
    const insightsHtml = insights.map(insight => 
      `<li style="margin-bottom: 10px; display: flex;">
        <span style="color: #22c55e; margin-right: 10px;">✓</span>
        <span>${insight}</span>
      </li>`
    ).join("");

    // Format the recommendations HTML
    const recommendationsHtml = recommendations.map(recommendation => 
      `<li style="margin-bottom: 10px; display: flex;">
        <span style="color: #22c55e; margin-right: 10px;">✓</span>
        <span>${recommendation}</span>
      </li>`
    ).join("");

    // Format the email HTML
    const emailHtml = `
    <html>
      <head>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          .header { 
            background-color: #7c3aed; 
            color: white;
            padding: 25px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-weight: 600;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content {
            padding: 30px;
          }
          .score-section {
            text-align: center;
            margin-bottom: 25px;
          }
          .score-value {
            font-size: 48px;
            font-weight: bold;
            color: ${status.color};
            margin: 5px 0;
          }
          .score-label {
            display: inline-block;
            background-color: ${status.color}25;
            color: ${status.color};
            padding: 5px 15px;
            border-radius: 9999px;
            font-weight: 500;
            font-size: 14px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #1e293b;
            display: flex;
            align-items: center;
          }
          .section-title-icon {
            margin-right: 10px;
            display: inline-block;
            width: 20px;
            height: 20px;
            text-align: center;
            line-height: 20px;
          }
          .summary {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 25px;
            border: 1px solid #e2e8f0;
          }
          .footer {
            text-align: center;
            padding: 20px 30px;
            color: #64748b;
            font-size: 13px;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
          }
          ul {
            padding-left: 0;
            list-style-type: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Lead Qualification Summary</h1>
            <p>${businessName}</p>
          </div>
          
          <div class="content">
            <div class="score-section">
              <div class="score-value">${score}</div>
              <div class="score-max">/100</div>
              <span class="score-label">${status.text} Potential</span>
            </div>
            
            <div class="summary">
              <p>${summary}</p>
            </div>
            
            <div class="section">
              <h3 class="section-title">
                <span class="section-title-icon" style="color: #3b82f6;">ℹ️</span>
                Key Insights
              </h3>
              <ul>
                ${insightsHtml}
              </ul>
            </div>
            
            <div class="section">
              <h3 class="section-title">
                <span class="section-title-icon" style="color: #eab308;">💡</span>
                Recommendations
              </h3>
              <ul>
                ${recommendationsHtml}
              </ul>
            </div>
          </div>
          
          <div class="footer">
            This is an automated summary from your Business Lead Qualification tool.
            Please do not reply to this email.
          </div>
        </div>
      </body>
    </html>
    `;

    console.log("Attempting to send email via Resend");
    
    // Send the email using Resend
    try {
      const emailResponse = await resend.emails.send({
        from: "Lead Qualifier <onboarding@resend.dev>",
        to: [email],
        subject: `Lead Qualification Summary: ${businessName}`,
        html: emailHtml,
      });
      
      console.log("Email sent successfully:", emailResponse);
      
      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully", data: emailResponse }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 200,
        }
      );
    } catch (emailError) {
      console.error("Resend email error:", emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
    }
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

// Helper function to get qualification status
function getQualificationStatus(score: number) {
  if (score >= 80) return { text: "High", color: "#22c55e" };
  if (score >= 60) return { text: "Medium", color: "#eab308" };
  return { text: "Low", color: "#ef4444" };
}

serve(handler);
