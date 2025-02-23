
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BusinessFormData } from "@/constants/businessFormConstants";

export async function analyzeBusinessLead(data: BusinessFormData) {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    throw new Error("Gemini API key not found");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `As an expert business analyst, analyze this lead and provide a qualification score (0-100) and detailed insights.
    Company: ${data.companyName}
    Industry: ${data.industry}
    Employees: ${data.employeeCount}
    Annual Revenue: ${data.annualRevenue}
    Website: ${data.website}
    Main Challenges: ${data.challenges}
    
    Provide a JSON response with this exact format:
    {
      "score": number between 0-100,
      "summary": "brief qualification summary",
      "insights": ["insight1", "insight2", "insight3"],
      "recommendations": ["rec1", "rec2", "rec3"]
    }`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Could not parse AI response");
  }
}
