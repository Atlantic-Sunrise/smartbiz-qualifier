
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

// Initialize Resend with API key from environment variable
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handler function for the edge function
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting email function");
    
    // Parse request body
    const data = await req.json();
    const { email, qualifications, includeDetails = false } = data;
    
    console.log(`Email request received for: ${email}`);
    console.log(`Number of qualifications: ${qualifications?.length || 0}`);
    
    if (!email) {
      throw new Error("Email address is required");
    }
    
    if (!qualifications || !Array.isArray(qualifications) || qualifications.length === 0) {
      throw new Error("No qualifications data provided");
    }

    // Generate table rows for each qualification
    const tableRows = qualifications.map((qual) => {
      const scoreColor = qual.score >= 80 ? "#34D399" : qual.score >= 60 ? "#FBBF24" : "#EF4444";
      const createdDate = qual.createdAt ? new Date(qual.createdAt).toLocaleDateString() : "N/A";
      
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${qual.businessName || "Unknown"}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${qual.industry || "Unknown"}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${qual.annualRevenue || "N/A"}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
            <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; background-color: ${scoreColor}; color: white; font-weight: bold;">
              ${qual.score}/100
            </span>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; background-color: #F3F4F6; color: #111827; font-size: 0.875rem;">
              ${qual.keyNeed || "Growth"}
            </span>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${createdDate}</td>
        </tr>
      `;
    }).join("");

    // HTML for summary table
    const qualificationsTable = `
      <div style="margin-bottom: 30px; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; min-width: 600px;">
          <thead>
            <tr style="background-color: #f9fafb; text-align: left;">
              <th style="padding: 12px 10px; border-bottom: 2px solid #ddd;">Company</th>
              <th style="padding: 12px 10px; border-bottom: 2px solid #ddd;">Industry</th>
              <th style="padding: 12px 10px; border-bottom: 2px solid #ddd;">Revenue</th>
              <th style="padding: 12px 10px; border-bottom: 2px solid #ddd;">Score</th>
              <th style="padding: 12px 10px; border-bottom: 2px solid #ddd;">Key Need</th>
              <th style="padding: 12px 10px; border-bottom: 2px solid #ddd;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;

    // Generate detailed reports HTML if requested
    let detailedReportsHtml = "";
    if (includeDetails) {
      detailedReportsHtml = qualifications.map((qual) => {
        const scoreColor = qual.score >= 80 ? "#34D399" : qual.score >= 60 ? "#FBBF24" : "#EF4444";
        const createdDate = qual.createdAt ? new Date(qual.createdAt).toLocaleDateString() : "N/A";
        
        // Safely process insights and recommendations arrays
        const insightsList = Array.isArray(qual.insights) 
          ? qual.insights.map(insight => `<li style="margin-bottom: 8px;">${insight}</li>`).join("")
          : "<li>No insights available</li>";
          
        const recommendationsList = Array.isArray(qual.recommendations)
          ? qual.recommendations.map(rec => `<li style="margin-bottom: 8px;">${rec}</li>`).join("")
          : "<li>No recommendations available</li>";

        return `
          <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <h2 style="margin: 0; font-size: 20px;">${qual.businessName || "Unknown Business"}</h2>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 13px;">${qual.industry || "Unknown"}</span>
                <span style="background-color: ${scoreColor}; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;">${qual.score}/100</span>
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px; color: #666;">
              <div>Date: ${createdDate}</div>
              <div>${qual.annualRevenue ? `Revenue: ${qual.annualRevenue}` : "Revenue: Unknown"}</div>
            </div>
            
            ${qual.keyNeed ? `
            <div style="background-color: #F3E8FF; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #7E22CE; font-size: 16px;">Key Need: ${qual.keyNeed}</h3>
            </div>
            ` : ''}
            
            <div style="margin-bottom: 15px;">
              <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 8px; font-size: 16px;">Summary</h3>
              <p style="margin-top: 8px;">${qual.summary || "No summary available"}</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 8px; font-size: 16px;">Key Insights</h3>
                <ul style="padding-left: 20px; margin-top: 8px;">
                  ${insightsList}
                </ul>
              </div>
              
              <div>
                <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 8px; font-size: 16px;">Recommendations</h3>
                <ul style="padding-left: 20px; margin-top: 8px;">
                  ${recommendationsList}
                </ul>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }

    // Send email using Resend
    console.log("Preparing to send email...");
    const subject = includeDetails 
      ? `Detailed Lead Qualification Reports (${qualifications.length} leads)`
      : `Lead Qualifications Summary (${qualifications.length} leads)`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="margin-bottom: 10px;">${includeDetails ? 'Detailed Lead Qualification Reports' : 'Lead Qualifications Summary'}</h1>
            <p style="font-size: 16px; color: #666;">A summary of all your qualified leads (${qualifications.length} total)</p>
            <p style="font-size: 14px; color: #666; font-style: italic;">[This email was originally intended for ${email}]</p>
          </div>
          
          ${includeDetails ? detailedReportsHtml : qualificationsTable}
          
          <div style="text-align: center; color: #666; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p>This is an automated summary generated by your lead qualification tool.</p>
          </div>
        </body>
      </html>
    `;

    // Send the email through Resend
    console.log("Sending email to verified account (testing mode)");
    const emailResponse = await resend.emails.send({
      from: "Lead Qualifier <onboarding@resend.dev>",
      to: ["myatlanticsunrise@gmail.com"], // Always use the verified email in testing
      subject: `${subject} (for ${email})`,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error in send-all-qualifications-summary function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
