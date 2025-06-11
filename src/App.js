// src/App.js
import React, { useState } from 'react';

export default function App() {
  const [topic, setTopic] = useState('');
  const [article, setArticle] = useState(null); // Stores structured article data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // IMPORTANT: This URL points to your deployed Cloudflare Worker backend.
  // We've confirmed this URL: https://artgenbackend.worksbeyondworks.workers.dev/
  const API_ENDPOINT = 'https://artgenbackend.worksbeyondworks.workers.dev/generate-article';

  const handleGenerateArticle = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please enter a topic to generate an article.");
      return;
    }

    // This check is no longer strictly needed if API_ENDPOINT is hardcoded correctly.
    // However, it's good practice for initial setup
    if (API_ENDPOINT.includes('YOUR_CLOUDFLARE_WORKER_URL')) {
      setError("Error: API_ENDPOINT is still a placeholder. Please update App.js with your actual Cloudflare Worker URL.");
      return;
    }

    setLoading(true);
    setError(null);
    setArticle(null);

    try {
      // Make a POST request to your Cloudflare Worker backend
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: topic }),
      });

      if (!response.ok) {
        // If the backend returns an error, parse and display it
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setArticle(data); // Set the structured article data
      console.log("Generated Article:", data); // Log the full structure for debugging

    } catch (err) {
      console.error("Error generating article:", err);
      setError(`Failed to generate article: ${err.message}. Please try again or with a different topic.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-inter p-4 sm:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-indigo-400 mb-4">
          ArticleGenius AI
        </h1>
        <p className="text-lg sm:text-xl text-gray-300">
          Generate compelling articles with AI and relevant images.
        </p>
      </header>

      <form onSubmit={handleGenerateArticle} className="w-full max-w-2xl mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., The Future of AI, Benefits of Healthy Eating, Space Exploration"
            className="flex-grow p-4 rounded-xl bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 text-white placeholder-gray-400 shadow-lg"
            disabled={loading}
          />
          <button
            type="submit"
            className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            Generate Article
          </button>
        </div>
      </form>

      {error && (
        <div className="text-red-500 text-lg font-medium p-4 bg-red-900 bg-opacity-30 rounded-lg shadow-md max-w-xl text-center mb-8">
          {error}
        </div>
      )}

      {article && (
        <div className="w-full max-w-4xl bg-gray-800 rounded-xl shadow-2xl p-6 sm:p-10 prose prose-invert max-w-none">
          {article.title && (
            <h2 className="text-3xl sm:text-4xl font-bold text-indigo-400 mb-6 border-b border-gray-700 pb-4">
              {article.title}
            </h2>
          )}
          {article.sections.map((section, index) => (
            <div key={index} className="mb-8">
              {section.heading && (
                <h3 className="text-2xl sm:text-3xl font-semibold text-gray-200 mb-4">
                  {section.heading}
                </h3>
              )}
              {section.content.map((block, blockIndex) => (
                <React.Fragment key={blockIndex}>
                  {block.type === 'text' && (
                    <p className="text-gray-300 leading-relaxed mb-4">
                      {block.value}
                    </p>
                  )}
                  {block.type === 'image' && (
                    <div className="my-6 text-center">
                      <img
                        src={block.url}
                        alt={block.caption || `Image for ${section.heading || article.title}`}
                        className="rounded-lg shadow-lg mx-auto w-full max-h-96 object-cover object-center"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://placehold.co/800x450/374151/D1D5DB?text=Image+Not+Available`;
                        }}
                      />
                      {block.caption && (
                        <p className="text-sm text-gray-400 mt-2">
                          {block.caption}
                        </p>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      )}

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} ArticleGenius AI. All rights reserved.</p>
        <p>Powered by <a href="https://gemini.google.com/ai" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Gemini AI</a> and <a href="https://pixabay.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Pixabay</a></p>
      </footer>
    </div>
  );
}
