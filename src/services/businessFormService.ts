
import { supabase } from "@/integrations/supabase/client";
import { BusinessFormData } from "@/constants/businessFormConstants";
import { analyzeBusinessLead } from "./aiAnalysisService";

export async function submitBusinessForm(data: BusinessFormData) {
  const user = (await supabase.auth.getUser()).data.user;
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const analysis = await analyzeBusinessLead(data);
  
  const { error: storageError } = await supabase
    .from('business_qualifications')
    .insert({
      user_id: user.id,
      company_name: data.companyName,
      industry: data.industry,
      employee_count: data.employeeCount,
      annual_revenue: data.annualRevenue,
      website: data.website,
      challenges: data.challenges
    });

  if (storageError) {
    throw new Error('Failed to save form data');
  }

  return analysis;
}
