
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
    const data: MultipleQualificationsSummaryEmailData = await req.json();
    const { email, qualifications } = data;

    console.log(`Received request to send summary to: ${email}`);
    console.log(`Number of qualifications: ${qualifications?.length || 0}`);

    if (!email) {
      throw new Error("Email is required");
    }

    if (!qualifications || qualifications.length === 0) {
      throw new Error("No qualifications data provided");
    }

    // Verify Resend API Key
    const apiKey = Deno.env.get("RESEND_API_KEY");
    console.log(`Resend API Key present: ${Boolean(apiKey)}`);
    
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    console.log("Attempting to send email via Resend");
    
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
          
          <div class="footer">
            <p>This report was generated automatically by the Lead Qualification Tool.</p>
          </div>
        </body>
      </html>
    `;
    
    // Send the email using Resend
    try {
      const emailResponse = await resend.emails.send({
        from: "Lead Qualifier <onboarding@resend.dev>",
        to: [email],
        subject: "Lead Qualification Summary Report",
        html: htmlContent,
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
