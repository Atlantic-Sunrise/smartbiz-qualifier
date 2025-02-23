
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface BusinessFormData {
  companyName: string;
  industry: string;
  employeeCount: string;
  annualRevenue: string;
  website: string;
  challenges: string;
}

export function BusinessQualificationForm({ onResults }: { onResults: (data: any) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<BusinessFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (data: BusinessFormData) => {
    setIsLoading(true);
    try {
      const prompt = `Please analyze this business lead and provide a qualification score (0-100) and detailed insights. 
      Company: ${data.companyName}
      Industry: ${data.industry}
      Employees: ${data.employeeCount}
      Annual Revenue: ${data.annualRevenue}
      Website: ${data.website}
      Main Challenges: ${data.challenges}
      
      Provide the response in this JSON format:
      {
        "score": number,
        "summary": "brief qualification summary",
        "insights": ["insight1", "insight2", "insight3"],
        "recommendations": ["rec1", "rec2", "rec3"]
      }`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('perplexity_api_key')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are an expert business analyst specializing in qualifying sales leads.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
        }),
      });

      const result = await response.json();
      const analysis = JSON.parse(result.choices[0].message.content);
      onResults(analysis);
    } catch (error) {
      console.error('Error analyzing business:', error);
      toast({
        title: "Error",
        description: "Failed to analyze business. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6 backdrop-blur-sm bg-white/30 dark:bg-black/30 border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-lg animate-fadeIn">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              {...register("companyName", { required: "Company name is required" })}
              className="mt-1"
              placeholder="Enter company name"
            />
            {errors.companyName && (
              <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              {...register("industry", { required: "Industry is required" })}
              className="mt-1"
              placeholder="e.g., Technology, Healthcare, Retail"
            />
            {errors.industry && (
              <p className="text-red-500 text-sm mt-1">{errors.industry.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="employeeCount">Number of Employees</Label>
            <Input
              id="employeeCount"
              {...register("employeeCount", { required: "Employee count is required" })}
              className="mt-1"
              placeholder="e.g., 1-10, 11-50, 51-200"
            />
            {errors.employeeCount && (
              <p className="text-red-500 text-sm mt-1">{errors.employeeCount.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="annualRevenue">Annual Revenue</Label>
            <Input
              id="annualRevenue"
              {...register("annualRevenue", { required: "Annual revenue is required" })}
              className="mt-1"
              placeholder="e.g., $100K-$500K, $500K-$1M"
            />
            {errors.annualRevenue && (
              <p className="text-red-500 text-sm mt-1">{errors.annualRevenue.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...register("website")}
              className="mt-1"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <Label htmlFor="challenges">Main Business Challenges</Label>
            <Input
              id="challenges"
              {...register("challenges", { required: "Business challenges are required" })}
              className="mt-1"
              placeholder="Describe the main challenges faced by the business"
            />
            {errors.challenges && (
              <p className="text-red-500 text-sm mt-1">{errors.challenges.message}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white transition-all duration-300"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Qualify Lead"
          )}
        </Button>
      </form>
    </Card>
  );
}
