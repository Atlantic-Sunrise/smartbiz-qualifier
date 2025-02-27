
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QualificationData {
  businessName: string;
  score: number;
  summary: string;
  insights: string[];
  recommendations: string[];
  industry: string;
  createdAt: string;
}

interface MultipleQualificationsSummaryEmailData {
  email: string;
  qualifications: QualificationData[];
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
    const data: MultipleQualificationsSummaryEmailData = await req.json();
    const { email, qualifications } = data;

    if (!email) {
      throw new Error("Email is required");
    }

    if (!qualifications || qualifications.length === 0) {
      throw new Error("No qualifications data provided");
    }

    // Sort qualifications by score (highest to lowest)
    const sortedQualifications = [...qualifications].sort((a, b) => b.score - a.score);
    
    // Generate the HTML for the qualifications table
    const qualificationsTableHtml = sortedQualifications.map(qual => {
      const status = getQualificationStatus(qual.score);
      
      return `
        <tr>
          <td>${qual.businessName}</td>
          <td>${qual.industry}</td>
          <td style="text-align: center;">
            <span style="
              display: inline-block;
              padding: 4px 8px;
              border-radius: 9999px;
              font-weight: 500;
              font-size: 14px;
              background-color: ${status.color}25;
              color: ${status.color};">
              ${qual.score}
            </span>
          </td>
          <td>${formatDate(new Date(qual.createdAt))}</td>
        </tr>
      `;
    }).join("");

    // Get average qualification score
    const averageScore = Math.round(
      sortedQualifications.reduce((sum, qual) => sum + qual.score, 0) / sortedQualifications.length
    );
    
    // Count qualifications by potential (high, medium, low)
    const highPotential = sortedQualifications.filter(qual => qual.score >= 80).length;
    const mediumPotential = sortedQualifications.filter(qual => qual.score >= 60 && qual.score < 80).length;
    const lowPotential = sortedQualifications.filter(qual => qual.score < 60).length;

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
            max-width: 800px; 
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
          .overview-cards {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 25px;
          }
          .overview-card {
            flex: 1;
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            border: 1px solid #e2e8f0;
          }
          .overview-value {
            font-size: 24px;
            font-weight: bold;
            margin: 5px 0;
          }
          .overview-label {
            font-size: 14px;
            color: #64748b;
            margin: 0;
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
          .qualifications-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .qualifications-table th, .qualifications-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          .qualifications-table th {
            background-color: #f1f5f9;
            font-weight: 600;
            color: #334155;
          }
          .qualifications-table tr:hover {
            background-color: #f8fafc;
          }
          .qualifications-table tr:last-child td {
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
          .high { color: #22c55e; }
          .medium { color: #eab308; }
          .low { color: #ef4444; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Lead Qualification Summary Report</h1>
            <p>Overview of All Lead Qualifications</p>
          </div>
          
          <div class="content">
            <div class="overview-cards">
              <div class="overview-card">
                <p class="overview-label">Total Leads</p>
                <p class="overview-value">${sortedQualifications.length}</p>
              </div>
              
              <div class="overview-card">
                <p class="overview-label">Average Score</p>
                <p class="overview-value">${averageScore}/100</p>
              </div>
              
              <div class="overview-card">
                <p class="overview-label">High Potential</p>
                <p class="overview-value" style="color: #22c55e;">${highPotential}</p>
              </div>
              
              <div class="overview-card">
                <p class="overview-label">Medium Potential</p>
                <p class="overview-value" style="color: #eab308;">${mediumPotential}</p>
              </div>
              
              <div class="overview-card">
                <p class="overview-label">Low Potential</p>
                <p class="overview-value" style="color: #ef4444;">${lowPotential}</p>
              </div>
            </div>
            
            <div class="section">
              <h3 class="section-title">All Lead Qualifications</h3>
              <p>Here's a summary of all qualified leads, sorted by qualification score (highest to lowest):</p>
              
              <table class="qualifications-table">
                <thead>
                  <tr>
                    <th>Business Name</th>
                    <th>Industry</th>
                    <th style="text-align: center;">Score</th>
                    <th>Qualified On</th>
                  </tr>
                </thead>
                <tbody>
                  ${qualificationsTableHtml}
                </tbody>
              </table>
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
      subject: "Lead Qualification Summary Report - All Leads",
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
    console.error("Error in send-all-qualifications-summary function:", error);
    
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

// Helper functions
function getQualificationStatus(score: number) {
  if (score >= 80) return { text: "High", color: "#22c55e" };
  if (score >= 60) return { text: "Medium", color: "#eab308" };
  return { text: "Low", color: "#ef4444" };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

serve(handler);
