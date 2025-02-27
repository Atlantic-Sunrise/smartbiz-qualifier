
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
            <td style="border: 1px solid #ddd; padding: 12px;">${q.businessName}</td>
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
  const header = "Company Name,Industry,Revenue,Score,Date Qualified\n";
  
  // Create CSV rows
  const rows = qualifications.map(q => {
    const companyName = q.businessName ? q.businessName.replace(/,/g, ' ') : 'N/A'; // Replace commas to avoid CSV issues
    const industry = (q.industry || 'N/A').replace(/,/g, ' ');
    const revenue = (q.annualRevenue || 'N/A').replace(/,/g, ' ');
    const score = q.score || 0;
    let date;
    try {
      date = q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'N/A';
    } catch (e) {
      date = 'N/A';
    }
    
    return `"${companyName}","${industry}","${revenue}",${score},"${date}"`;
  }).join('\n');
  
  return header + rows;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Edge function invoked: send-all-qualifications-summary");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Parsing request body");
    
    // Get the request body
    const body = await req.text();
    console.log("Request body:", body);
    
    let data: MultipleQualificationsSummaryEmailData;
    try {
      data = JSON.parse(body);
    } catch (e) {
      console.error("Error parsing JSON:", e);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON in request body" }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 400,
        }
      );
    }
    
    const { email, qualifications } = data;
    
    console.log(`Received request to send summary to: ${email}`);
    console.log(`Number of qualifications: ${qualifications?.length || 0}`);

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 400,
        }
      );
    }

    if (!qualifications || qualifications.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No qualifications data provided" }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 400,
        }
      );
    }

    // Verify Resend API Key
    const apiKey = Deno.env.get("RESEND_API_KEY");
    console.log(`Resend API Key present: ${Boolean(apiKey)}`);
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY environment variable is not set" }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 500,
        }
      );
    }

    console.log("Creating email content");
    
    try {
      // Create CSV data for attachment
      const csvData = createCSV(qualifications);
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Create the HTML email content
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
              .summary {
                margin-bottom: 30px;
              }
              .download-note {
                margin-top: 20px;
                padding: 12px;
                background-color: #f9f9f9;
                border-left: 4px solid #4f46e5;
              }
              .footer {
                margin-top: 40px;
                font-size: 14px;
                color: #6b7280;
                border-top: 1px solid #e5e7eb;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <h1>Lead Qualification Summary Report</h1>
            
            <div class="summary">
              <p>You have ${qualifications.length} qualified lead${qualifications.length !== 1 ? 's' : ''}.</p>
            </div>
            
            <h2>All Leads Overview</h2>
            ${createQualificationsTable(qualifications)}
            
            <div class="download-note">
              <p>A CSV file with this data is attached to this email for your convenience. You can import it directly into your CRM or other tools.</p>
            </div>
            
            <div class="footer">
              <p>This report was generated automatically by the Lead Qualification Tool.</p>
            </div>
          </body>
        </html>
      `;
      
      console.log("Attempting to send email via Resend");
      
      // Send the email using Resend
      const emailResponse = await resend.emails.send({
        from: "Lead Qualifier <onboarding@resend.dev>",
        to: [email],
        subject: "Lead Qualification Summary Report",
        html: htmlContent,
        attachments: [
          {
            filename: `lead_qualifications_${currentDate}.csv`,
            content: Buffer.from(csvData).toString('base64'),
          },
        ],
      });
      
      console.log("Email sent successfully:", emailResponse);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email sent successfully", 
          data: emailResponse 
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 200,
        }
      );
    } catch (emailError) {
      console.error("Resend email error:", emailError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to send email: ${emailError.message || "Unknown error"}` 
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
          status: 500,
        }
      );
    }
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

serve(handler);
