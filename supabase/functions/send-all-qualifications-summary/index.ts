
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  annualRevenue?: string;
  createdAt: string;
}

interface MultipleQualificationsSummaryEmailData {
  email: string;
  qualifications: QualificationData[];
}

// Function to create an HTML table for the qualifications
function createQualificationsTable(qualifications: QualificationData[]): string {
  return `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Company Name</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Industry</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Revenue</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Score</th>
        </tr>
      </thead>
      <tbody>
        ${qualifications.map((q) => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 12px;">${q.businessName || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 12px;">${q.industry || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 12px;">${q.annualRevenue || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold; color: ${
              q.score >= 80 ? '#16a34a' : 
              q.score >= 60 ? '#ca8a04' : '#dc2626'
            };">${q.score}/100</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Function to create CSV data from qualifications
function createCSV(qualifications: QualificationData[]): string {
  // Create CSV header
  const header = "Company Name,Industry,Revenue,Score\n";
  
  // Create CSV rows
  const rows = qualifications.map(q => {
    const companyName = (q.businessName || 'N/A').replace(/,/g, ' '); 
    const industry = (q.industry || 'N/A').replace(/,/g, ' ');
    const revenue = (q.annualRevenue || 'N/A').replace(/,/g, ' ');
    const score = q.score || 0;
    
    return `"${companyName}","${industry}","${revenue}",${score}`;
  }).join('\n');
  
  return header + rows;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const reqJson = await req.json();
    const { email, qualifications } = reqJson as MultipleQualificationsSummaryEmailData;
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (!qualifications || !Array.isArray(qualifications) || qualifications.length === 0) {
      return new Response(
        JSON.stringify({ error: "Valid qualifications data is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Create HTML table and CSV content
    const tableHtml = createQualificationsTable(qualifications);
    const csvContent = createCSV(qualifications);
    
    // Create HTML email content
    const htmlContent = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              color: #4f46e5;
              margin-bottom: 20px;
            }
            h2 {
              color: #4b5563;
              margin-top: 30px;
              margin-bottom: 15px;
            }
          </style>
        </head>
        <body>
          <h1>Lead Qualification Summary Report</h1>
          <p>You have ${qualifications.length} qualified lead${qualifications.length !== 1 ? 's' : ''}.</p>
          <h2>All Leads Overview</h2>
          ${tableHtml}
          <p>A CSV file with this data is attached to this email for your convenience.</p>
        </body>
      </html>
    `;

    // Send email with CSV attachment
    const emailResult = await resend.emails.send({
      from: "Lead Qualifier <onboarding@resend.dev>",
      to: [email],
      subject: "Lead Qualification Summary Report",
      html: htmlContent,
      attachments: [
        {
          filename: "lead_qualifications.csv",
          content: Buffer.from(csvContent).toString("base64")
        }
      ]
    });

    return new Response(
      JSON.stringify({ success: true, data: emailResult }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
    
  } catch (error) {
    console.error("Error sending qualification summary:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process request" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
