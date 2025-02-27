
// Utility function to extract the key need from qualification data
export function extractKeyNeed(qualification: any): string {
  // Return the stored key_need if it exists
  if (qualification.key_need) {
    return qualification.key_need;
  }
  
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

  // Create a text to analyze from the qualification data
  const text = (qualification.qualification_summary || "") + " " + 
               (qualification.qualification_insights || []).join(" ") + " " + 
               (qualification.qualification_recommendations || []).join(" ");
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
