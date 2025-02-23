export const TOP_INDUSTRIES = [
  "Technology & Software",
  "Retail & E-commerce", 
  "Healthcare & Medical",
  "Food & Restaurant",
  "Professional Services",
  "Real Estate",
  "Construction & Contracting",
  "Marketing & Digital Services",
  "Education & Training",
  "Manufacturing & Production",
  "Media & Content Creation"
];

export const EMPLOYEE_RANGES = [
  "1-4 employees",
  "5-9 employees",
  "10-19 employees",
  "20-49 employees",
  "50-99 employees",
  "100-249 employees",
  "250-499 employees",
  "500+ employees"
];

export const REVENUE_RANGES = [
  "Under $100,000",
  "$100,000 - $499,999",
  "$500,000 - $999,999",
  "$1M - $4.99M",
  "$5M - $9.99M",
  "$10M - $19.99M",
  "$20M - $49.99M",
  "$50M+"
];

export interface BusinessFormData {
  companyName: string;
  industry: string;
  employeeCount: string;
  annualRevenue: string;
  website: string;
  challenges: string;
}

export const questions: Record<keyof BusinessFormData, string> = {
  companyName: "What is the name of your company?",
  industry: "What industry does your company operate in?",
  employeeCount: "How many employees does your company have?",
  annualRevenue: "What is your company's annual revenue range?",
  website: "What is your company's website address?",
  challenges: "What are the main challenges your business is facing?"
};
