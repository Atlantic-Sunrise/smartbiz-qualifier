
import React from "react";

export function PageTitle() {
  return (
    <div className="text-center mb-12 animate-fadeIn">
      <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
        Business Lead Qualifier
      </h1>
      <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto backdrop-blur-sm bg-white/30 dark:bg-black/30 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
        Enter your prospect's business information below for AI-powered analysis and qualification scoring.
      </p>
    </div>
  );
}
