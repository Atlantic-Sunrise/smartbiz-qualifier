
import { supabase } from "@/integrations/supabase/client";

export interface QualificationSummaryEmailData {
  email: string;
  businessName: string;
  score: number;
  summary: string;
  insights: string[];
  recommendations: string[];
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
