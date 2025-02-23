
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mic, MicOff } from "lucide-react";
import * as fal from "@fal-ai/serverless-client";
import { useConversation } from "@11labs/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BusinessFormData {
  companyName: string;
  industry: string;
  employeeCount: string;
  annualRevenue: string;
  website: string;
  challenges: string;
}

interface AIResponse {
  response: string;
}

const TOP_INDUSTRIES = [
  "Technology & Software",
  "Retail & E-commerce",
  "Healthcare & Medical",
  "Food & Restaurant",
  "Professional Services",
  "Real Estate",
  "Construction & Contracting",
  "Marketing & Digital Services",
  "Education & Training",
  "Manufacturing & Production"
];

const EMPLOYEE_RANGES = [
  "1-4 employees",
  "5-9 employees",
  "10-19 employees",
  "20-49 employees",
  "50-99 employees",
  "100-249 employees",
  "250-499 employees",
  "500+ employees"
];

const REVENUE_RANGES = [
  "Under $100,000",
  "$100,000 - $499,999",
  "$500,000 - $999,999",
  "$1M - $4.99M",
  "$5M - $9.99M",
  "$10M - $19.99M",
  "$20M - $49.99M",
  "$50M+"
];

const questions: Record<keyof BusinessFormData, string> = {
  companyName: "What is the name of your company?",
  industry: "What industry does your company operate in?",
  employeeCount: "How many employees does your company have?",
  annualRevenue: "What is your company's annual revenue range?",
  website: "What is your company's website address?",
  challenges: "What are the main challenges your business is facing?"
};

export function BusinessQualificationForm({ onResults }: { onResults: (data: any) => void }) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<BusinessFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentField, setCurrentField] = useState<keyof BusinessFormData | null>(null);
  const { toast } = useToast();
  
  const conversation = useConversation({
    overrides: {
      tts: {
        voiceId: "EXAVITQu4vr4xnSDxMaL"
      }
    }
  });

  const onIndustrySelect = (value: string) => {
    setValue("industry", value);
  };

  const onEmployeeCountSelect = (value: string) => {
    setValue("employeeCount", value);
  };

  const onRevenueSelect = (value: string) => {
    setValue("annualRevenue", value);
  };

  const startVoiceInteraction = async () => {
    if (!window.localStorage.getItem('eleven_labs_key')) {
      toast({
        title: "API Key Missing",
        description: "Please add your ElevenLabs API key first",
        variant: "destructive",
      });
      return;
    }

    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Speech Recognition Not Available",
        description: "Your browser doesn't support speech recognition. Please use a Chromium-based browser.",
        variant: "destructive",
      });
      return;
    }

    const fields: (keyof BusinessFormData)[] = ['companyName', 'industry', 'employeeCount', 'annualRevenue', 'website', 'challenges'];
    
    for (const field of fields) {
      setCurrentField(field);
      await askQuestion(questions[field], field);
    }

    setCurrentField(null);
  };

  const askQuestion = async (question: string, field: keyof BusinessFormData) => {
    return new Promise<void>((resolve) => {
      if (!('webkitSpeechRecognition' in window)) {
        resolve();
        return;
      }

      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      conversation.startSession({
        text: question
      });

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
        resolve();
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setValue(field, transcript);
      };

      recognition.start();
    });
  };

  const onSubmit = async (data: BusinessFormData) => {
    setIsLoading(true);
    try {
      fal.config({
        credentials: localStorage.getItem('fal_api_key')
      });

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

      const result = await fal.subscribe("fal-ai/gpt-3.5-turbo", {
        input: {
          prompt: prompt
        },
      }) as AIResponse;

      let analysis;
      try {
        analysis = JSON.parse(result.response);
      } catch (e) {
        const jsonMatch = result.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not parse AI response");
        }
      }

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
    <div className="min-h-screen w-full p-8 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg animate-fadeIn">
        <div className="mb-6">
          <Button 
            type="button" 
            onClick={startVoiceInteraction}
            className="w-full mb-4"
            variant="outline"
            disabled={!('webkitSpeechRecognition' in window)}
          >
            {isListening ? (
              <>
                <Mic className="w-4 h-4 mr-2 animate-pulse text-red-500" />
                Listening...
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Start Voice Interview
              </>
            )}
          </Button>
          {currentField && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              Currently asking about: {currentField}
            </div>
          )}
        </div>

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
              <Select onValueChange={onIndustrySelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {TOP_INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.industry && (
                <p className="text-red-500 text-sm mt-1">{errors.industry.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="employeeCount">Number of Employees</Label>
              <Select onValueChange={onEmployeeCountSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select employee range" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_RANGES.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employeeCount && (
                <p className="text-red-500 text-sm mt-1">{errors.employeeCount.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="annualRevenue">Annual Revenue</Label>
              <Select onValueChange={onRevenueSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select revenue range" />
                </SelectTrigger>
                <SelectContent>
                  {REVENUE_RANGES.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    </div>
  );
}
