
import { Check, AlertTriangle } from "lucide-react";

interface InsightsListProps {
  insights: string[];
}

export function InsightsList({ insights }: InsightsListProps) {
  return (
    <div>
      <h3 className="flex items-center text-lg font-semibold mb-2">
        <AlertTriangle className="mr-2 h-5 w-5 text-blue-500" />
        Key Insights
      </h3>
      <ul className="space-y-2">
        {insights.map((insight, index) => (
          <li key={index} className="flex items-start">
            <Check className="mr-2 h-4 w-4 mt-1 text-green-500 flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-300">{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
