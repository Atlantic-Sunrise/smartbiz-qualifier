
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

    // Create HTML lists for insights and recommendations
    const insightsHtml = insights.map(insight => `<li style="margin-bottom: 8px;">${insight}</li>`).join("");
    const recommendationsHtml = recommendations.map(rec => `<li style="margin-bottom: 8px;">${rec}</li>`).join("");

    // Get the qualification status based on score
    const getQualificationStatus = (score: number) => {
      if (score >= 80) return { text: "High Potential", color: "#22c55e" };
      if (score >= 60) return { text: "Medium Potential", color: "#eab308" };
      return { text: "Low Potential", color: "#ef4444" };
    };
    
    const status = getQualificationStatus(score);

    // Format the email HTML with a clean, professional design
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
            max-width: 650px; 
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
          }
          .content {
            padding: 30px;
          }
          .score-card {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin-bottom: 25px;
            border: 1px solid #e2e8f0;
          }
          .score-value { 
            font-size: 48px; 
            font-weight: bold;
            color: ${status.color};
            margin: 0;
          }
          .score-label {
            font-size: 18px;
            color: #64748b;
            margin: 0;
          }
          .status-badge {
            display: inline-block;
            background-color: ${status.color}25;
            color: ${status.color};
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 14px;
            font-weight: 500;
            margin-top: 10px;
          }
          .summary-card {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            border: 1px solid #e2e8f0;
          }
          .summary-title {
            font-size: 18px;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 10px;
            color: #1e293b;
          }
          .summary-text {
            margin: 0;
            color: #475569;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #1e293b;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 10px;
          }
          .insights-list, .recommendations-list {
            margin: 0;
            padding: 0 0 0 20px;
            color: #475569;
          }
          .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .results-table th, .results-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          .results-table th {
            background-color: #f1f5f9;
            font-weight: 600;
            color: #334155;
          }
          .results-table tr:last-child td {
            border-bottom: none;
          }
          .footer {
            text-align: center;
            padding: 20px 30px;
            color: #64748b;
            font-size: 13px;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Lead Qualification Summary</h1>
            <p>for ${businessName}</p>
          </div>
          
          <div class="content">
            <div class="score-card">
              <p class="score-label">Qualification Score</p>
              <p class="score-value">${score}<span style="font-size: 24px; color: #94a3b8;">/100</span></p>
              <div class="status-badge">${status.text}</div>
            </div>
            
            <div class="summary-card">
              <h3 class="summary-title">Executive Summary</h3>
              <p class="summary-text">${summary}</p>
            </div>
            
            <div class="section">
              <h3 class="section-title">Full Qualification Results</h3>
              <table class="results-table">
                <tr>
                  <th>Category</th>
                  <th>Details</th>
                </tr>
                <tr>
                  <td><strong>Business Name</strong></td>
                  <td>${businessName}</td>
                </tr>
                <tr>
                  <td><strong>Qualification Score</strong></td>
                  <td>${score}/100 (${status.text})</td>
                </tr>
                <tr>
                  <td><strong>Summary</strong></td>
                  <td>${summary}</td>
                </tr>
              </table>
            </div>
            
            <div class="section">
              <h3 class="section-title">Key Insights</h3>
              <ul class="insights-list">
                ${insightsHtml}
              </ul>
            </div>
            
            <div class="section">
              <h3 class="section-title">Recommendations</h3>
              <ul class="recommendations-list">
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
