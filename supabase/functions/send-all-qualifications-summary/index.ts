
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
  createdAt: string;
}

interface MultipleQualificationsSummaryEmailData {
  email: string;
  qualifications: QualificationData[];
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
    
    // Send the email using Resend
    try {
      const emailResponse = await resend.emails.send({
        from: "Lead Qualifier <onboarding@resend.dev>",
        to: [email],
        subject: "Lead Qualification Summary Report - All Leads",
        html: `<h1>Your Lead Qualification Summary</h1><p>You have ${qualifications.length} qualified leads.</p>`,
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
