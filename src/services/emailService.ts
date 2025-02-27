
import { supabase } from "@/integrations/supabase/client";

export interface QualificationSummaryEmailData {
  email: string;
  businessName: string;
  score: number;
  summary: string;
  insights: string[];
  recommendations: string[];
  keyNeed?: string; // Renamed from challenge to keyNeed
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
  keyNeed?: string; // Renamed from challenge to keyNeed
}

export interface MultipleQualificationsSummaryEmailData {
  email: string;
  qualifications: QualificationData[];
}

export async function sendQualificationSummary(data: QualificationSummaryEmailData) {
  try {
    const response = await supabase.functions.invoke('send-qualification-summary', {
      body: data,
    });
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to send email');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error sending qualification summary email:', error);
    throw error;
  }
}

export async function sendMultipleQualificationsSummary(data: MultipleQualificationsSummaryEmailData) {
  try {
    const response = await supabase.functions.invoke('send-all-qualifications-summary', {
      body: data,
    });
    
    if (response.error) {
      throw new Error(response.error.message || 'Failed to send email');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error sending multiple qualifications summary email:', error);
    throw error;
  }
}
