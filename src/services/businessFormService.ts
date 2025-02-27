
import { supabase } from "@/integrations/supabase/client";
import { BusinessFormData } from "@/constants/businessFormConstants";
import { analyzeBusinessLead } from "./aiAnalysisService";

export async function submitBusinessForm(data: BusinessFormData) {
  const user = (await supabase.auth.getUser()).data.user;
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const analysis = await analyzeBusinessLead(data);
  
  // Insert the business data and qualification results
  const { error: storageError } = await supabase
    .from('business_qualifications')
    .insert({
      user_id: user.id,
      company_name: data.companyName,
      industry: data.industry,
      employee_count: data.employeeCount,
      annual_revenue: data.annualRevenue,
      website: data.website,
      challenges: data.challenges,
      qualification_score: analysis.score,
      qualification_summary: analysis.summary,
      qualification_insights: analysis.insights,
      qualification_recommendations: analysis.recommendations
    });

  if (storageError) {
    console.error('Error saving form data:', storageError);
    throw new Error('Failed to save form data');
  }

  return analysis;
}

// Add a function to fetch previous qualifications
export async function fetchQualifications() {
  const user = (await supabase.auth.getUser()).data.user;
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { data, error } = await supabase
    .from('business_qualifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching qualifications:', error);
    throw new Error('Failed to fetch qualifications');
  }
  
  return data;
}

// Add a function to delete a qualification
export async function deleteQualification(id: string) {
  const user = (await supabase.auth.getUser()).data.user;
  
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { error } = await supabase
    .from('business_qualifications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Ensure users can only delete their own records
    
  if (error) {
    console.error('Error deleting qualification:', error);
    throw new Error('Failed to delete qualification');
  }
  
  return true;
}
