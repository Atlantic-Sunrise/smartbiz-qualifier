
import { Check, Lightbulb } from "lucide-react";

interface RecommendationsListProps {
  recommendations: string[];
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  return (
    <div>
      <h3 className="flex items-center text-lg font-semibold mb-2">
        <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
        Recommendations
      </h3>
      <ul className="space-y-2">
        {recommendations.map((recommendation, index) => (
          <li key={index} className="flex items-start">
            <Check className="mr-2 h-4 w-4 mt-1 text-green-500 flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-300">{recommendation}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
