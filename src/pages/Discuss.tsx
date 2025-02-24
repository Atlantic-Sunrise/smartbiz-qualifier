
import { useLocation, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { VoiceQualificationDiscussion } from "@/components/VoiceQualificationDiscussion";

export default function Discuss() {
  const [searchParams] = useSearchParams();
  const score = searchParams.get('score');
  const summary = searchParams.get('summary');

  if (!score || !summary) {
    return (
      <div className="container py-12">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">No Results Found</h2>
          <p className="text-gray-600 mb-4">Please qualify a lead first to discuss results.</p>
          <Link to="/">
            <Button variant="outline">Go Back</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const results = {
    score: parseInt(score),
    summary: summary,
    insights: [],
    recommendations: []
  };

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-block mb-8">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Results
          </Button>
        </Link>

        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">Discuss Your Results</h1>
          
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Summary</h2>
            <p className="text-gray-600">{results.summary}</p>
          </div>

          <div className="mb-6">
            <h2 className="font-semibold mb-2">Score</h2>
            <p className="text-gray-600">{results.score} out of 100</p>
          </div>

          <VoiceQualificationDiscussion results={results} />
        </Card>
      </div>
    </div>
  );
}
