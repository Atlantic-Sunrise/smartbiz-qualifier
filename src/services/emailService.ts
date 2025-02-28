
import { supabase } from "@/integrations/supabase/client";

export interface QualificationSummaryEmailData {
  email: string;
  businessName: string;
  score: number;
  summary: string;
  insights: string[];
  recommendations: string[];
  keyNeed?: string;
}

export interface QualificationData {
  businessName: string;
  score: number;
  summary: string;
  insights: string[];
  recommendations: string[];
  industry: string;
  annualRevenue?: string;
  createdAt: string;
  keyNeed?: string;
}

export interface MultipleQualificationsSummaryEmailData {
  email: string;
  qualifications: QualificationData[];
  includeDetails?: boolean;
}

export async function sendQualificationSummary(data: QualificationSummaryEmailData) {
  try {
    console.log("Sending single qualification summary", {
      email: data.email,
      business: data.businessName
    });
    
    const response = await supabase.functions.invoke('send-qualification-summary', {
      body: data,
    });
    
    if (response.error) {
      console.error("Error from Edge Function:", response.error);
      throw new Error(response.error.message || 'Failed to send email');
    }
    
    console.log("Email function response:", response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error sending qualification summary email:', error);
    throw error;
  }
}

export async function sendMultipleQualificationsSummary(data: MultipleQualificationsSummaryEmailData) {
  try {
    console.log("Sending qualifications summary email", {
      email: data.email,
      qualificationCount: data.qualifications.length,
      includeDetails: data.includeDetails
    });
    
    // Make sure we have valid data
    if (!data.email) {
      throw new Error("Email address is required");
    }
    
    if (!data.qualifications || data.qualifications.length === 0) {
      throw new Error("No qualifications data provided");
    }
    
    const response = await supabase.functions.invoke('send-all-qualifications-summary', {
      body: data,
    });
    
    if (response.error) {
      console.error("Error from Edge Function:", response.error);
      throw new Error(response.error.message || 'Failed to send email');
    }
    
    console.log("Email function response:", response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error sending multiple qualifications summary email:', error);
    throw error;
  }
}
