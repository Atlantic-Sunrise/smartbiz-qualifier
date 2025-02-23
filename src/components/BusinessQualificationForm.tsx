
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mic, MicOff, Image as ImageIcon } from "lucide-react";
import * as fal from "@fal-ai/serverless-client";
import { useConversation } from "@11labs/react";

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

interface FalImageResponse {
  images: Array<{
    url: string;
  }>;
}

export function BusinessQualificationForm({ onResults }: { onResults: (data: any) => void }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BusinessFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentField, setCurrentField] = useState<keyof BusinessFormData | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { toast } = useToast();
  
  const conversation = useConversation({
    overrides: {
      tts: {
        voiceId: "EXAVITQu4vr4xnSDxMaL" // Using Sarah's voice
      }
    }
  });
  
  const industry = watch("industry");

  const generateBusinessImage = async (industry: string) => {
    if (!industry) return;
    
    setIsGeneratingImage(true);
    try {
      fal.config({
        credentials: localStorage.getItem('fal_api_key')
      });

      const result = await fal.subscribe("stable-diffusion-xl-v1", {
        input: {
          prompt: `A professional, modern business illustration representing the ${industry} industry, corporate style, minimalist, clean design, business concept`,
          negative_prompt: "text, words, logos, watermark",
          num_inference_steps: 30,
          guidance_scale: 7.5
        }
      }) as FalImageResponse;

      if (result.images?.[0]?.url) {
        setGeneratedImage(result.images[0].url);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate industry image. Please check your API key.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  useEffect(() => {
    if (industry && industry.length > 2) {
      generateBusinessImage(industry);
    }
  }, [industry]);

  const questions = {
    companyName: "What is your company name?",
    industry: "What industry are you in?",
    employeeCount: "How many employees do you have?",
    annualRevenue: "What is your annual revenue?",
    website: "What is your website address? You can skip this if you don't have one.",
    challenges: "What are your main business challenges?"
  };

  useEffect(() => {
    if (!window.localStorage.getItem('eleven_labs_key')) {
      toast({
        title: "ElevenLabs API Key Required",
        description: "Please add your ElevenLabs API key in the settings to enable voice interaction.",
        variant: "destructive",
      });
    }
  }, []);

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

      const result = await fal.subscribe("fal-ai/text-generation-base", {
        input: {
          prompt: prompt
        },
      }) as { response: string };

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
    <Card className="w-full max-w-2xl mx-auto p-6 backdrop-blur-sm bg-white/30 dark:bg-black/30 border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-lg animate-fadeIn">
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

      {generatedImage && (
        <div className="mb-6 relative rounded-lg overflow-hidden">
          <img 
            src={generatedImage} 
            alt="Industry visualization" 
            className="w-full h-48 object-cover rounded-lg"
          />
          {isGeneratingImage && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          )}
        </div>
      )}

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
