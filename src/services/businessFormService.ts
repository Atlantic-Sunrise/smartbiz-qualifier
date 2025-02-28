
import { supabase } from "@/integrations/supabase/client";
import { BusinessFormData } from "@/constants/businessFormConstants";
import { analyzeBusinessLead } from "./aiAnalysisService";

export async function submitBusinessForm(data: BusinessFormData) {
  // Get current authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('User authentication error:', userError);
    throw new Error("User not authenticated");
  }
  
  // Log the user ID to ensure it's correct
  console.log('Current authenticated user ID:', user.id);
  
  try {
    // Call API to analyze business lead
    const analysis = await analyzeBusinessLead(data);
    
    // Extract the key need from the data
    const keyNeed = extractKeyNeed({
      qualification_summary: analysis.summary,
      qualification_insights: analysis.insights,
      qualification_recommendations: analysis.recommendations,
      challenges: data.challenges
    });
    
    // Create the qualification data object with user_id clearly set
    const qualificationData = {
      user_id: user.id, // Explicitly set user_id to current authenticated user
      company_name: data.companyName,
      industry: data.industry,
      employee_count: data.employeeCount,
      annual_revenue: data.annualRevenue,
      website: data.website,
      challenges: data.challenges,
      qualification_score: analysis.score,
      qualification_summary: analysis.summary,
      qualification_insights: analysis.insights,
      qualification_recommendations: analysis.recommendations,
      key_need: keyNeed
    };
    
    console.log('Saving qualification data for user:', user.id);
    console.log('Qualification data:', qualificationData);
    
    // Insert the business data and qualification results
    const { data: savedData, error: storageError } = await supabase
      .from('business_qualifications')
      .insert(qualificationData)
      .select()
      .single();

    if (storageError) {
      console.error('Error saving form data:', storageError);
      throw new Error('Failed to save form data: ' + storageError.message);
    }

    console.log('Successfully saved qualification data with ID:', savedData.id);
    console.log('User ID saved in record:', savedData.user_id);
    
    // Double-check that the saved user_id matches the current user
    if (savedData.user_id !== user.id) {
      console.error('User ID mismatch in saved data!', {
        currentUserId: user.id,
        savedUserId: savedData.user_id
      });
    }
    
    return analysis;
  } catch (error) {
    console.error('Error in submitBusinessForm:', error);
    throw error;
  }
}

// Function to extract the key need from qualification data
function extractKeyNeed(qualification: any): string {
  // Common business need categories
  const needKeywords: Record<string, string[]> = {
    "growth": ["growth", "scale", "expand", "acquisition", "customer", "revenue", "sales", "market share"],
    "marketing": ["marketing", "branding", "advertising", "visibility", "promotion", "awareness"],
    "finance": ["finance", "funding", "cash flow", "investment", "budget", "cost", "profit", "pricing"],
    "operations": ["operations", "efficiency", "process", "workflow", "productivity", "logistics"],
    "talent": ["talent", "hiring", "recruitment", "staff", "employee", "retention", "team", "workforce"],
    "technology": ["technology", "digital", "software", "automation", "integration", "infrastructure", "IT"],
    "competition": ["competition", "competitive", "market", "industry", "disruption"],
    "innovation": ["innovation", "product", "development", "R&D", "creative", "design"],
    "compliance": ["compliance", "regulation", "legal", "policy", "standard"],
    "strategy": ["strategy", "planning", "direction", "vision", "mission", "pivot"]
  };

  // Combine all text data for analysis
  const text = (qualification.qualification_summary || "") + " " + 
               (qualification.qualification_insights || []).join(" ") + " " + 
               (qualification.qualification_recommendations || []).join(" ") + " " +
               (qualification.challenges || "");
  const lowerText = text.toLowerCase();
  
  // Find which category has the most keyword matches
  let bestCategory = "growth"; // Default
  let highestMatches = 0;
  
  for (const [category, keywords] of Object.entries(needKeywords)) {
    const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matches > highestMatches) {
      highestMatches = matches;
      bestCategory = category;
    }
  }
  
  return bestCategory.charAt(0).toUpperCase() + bestCategory.slice(1);
}

// Function to fetch previous qualifications
export async function fetchQualifications() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('User authentication error:', userError);
    throw new Error("User not authenticated");
  }
  
  console.log('Fetching qualifications for user ID:', user.id);
  
  const { data, error } = await supabase
    .from('business_qualifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching qualifications:', error);
    throw new Error('Failed to fetch qualifications');
  }
  
  console.log(`Found ${data?.length || 0} qualifications for user:`, user.id);
  return data;
}

// Function to delete a qualification
export async function deleteQualification(id: string) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('User authentication error:', userError);
    throw new Error("User not authenticated");
  }
  
  console.log(`Deleting qualification ID: ${id} for user ID: ${user.id}`);
  
  const { error } = await supabase
    .from('business_qualifications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Ensure users can only delete their own records
    
  if (error) {
    console.error('Error deleting qualification:', error);
    throw new Error('Failed to delete qualification');
  }
  
  console.log(`Successfully deleted qualification ID: ${id}`);
  return true;
}
