import React, { useState } from 'react';

export default function App() {
  const [topic, setTopic] = useState('');
  const [article, setArticle] = useState(null); // Stores structured article data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(''); // State for copy message

  // IMPORTANT: This URL points to your deployed Cloudflare Worker backend.
  // We've confirmed this URL: https://artgenbackend.worksbeyondworks.workers.dev/
  const API_ENDPOINT = 'https://artgenbackend.worksbeyondworks.workers.dev/generate-article';

  const handleGenerateArticle = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please enter a topic to generate an article.");
      return;
    }

    setLoading(true);
    setError(null);
    setArticle(null); // Clear previous article
    setCopySuccess(''); // Clear copy success message

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
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setArticle(data); // Set the structured article data
      console.log("Generated Article:", data);

    } catch (err) {
      console.error("Error generating article:", err);
      setError(`Failed to generate article: ${err.message}. Please try again or with a different topic.`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formats the article object into a Markdown string.
   * @param {Object} articleData The structured article object.
   * @returns {string} The article content formatted as Markdown.
   */
  const formatArticleAsMarkdown = (articleData) => {
    if (!articleData) return '';

    let markdown = `# ${articleData.title || 'Untitled Article'}\n\n`;

    if (articleData.subtitle) {
      markdown += `## ${articleData.subtitle}\n\n`;
    }

    if (articleData.introduction) {
      markdown += `${articleData.introduction}\n\n`;
    }

    articleData.sections.forEach(section => {
      if (section.heading) {
        markdown += `### ${section.heading}\n\n`;
      }
      section.content.forEach(block => {
        if (block.type === 'text') {
          markdown += `${block.value}\n\n`;
        } else if (block.type === 'image' && block.url) {
          markdown += `![${block.caption || 'Image'}](${block.url})\n\n`;
        }
      });
    });

    if (articleData.faq_section && articleData.faq_section.length > 0) {
      markdown += `## Frequently Asked Questions\n\n`;
      articleData.faq_section.forEach(faq => {
        markdown += `* **Q:** ${faq.question}\n`;
        markdown += `  **A:** ${faq.answer}\n\n`;
      });
    }

    if (articleData.conclusion) {
      markdown += `## Conclusion\n\n`;
      markdown += `${articleData.conclusion}\n\n`;
    }

    return markdown;
  };

  /**
   * Handles downloading the generated article as a Markdown file.
   */
  const handleDownloadArticle = () => {
    if (!article) {
      setError("No article to download.");
      return;
    }
    const markdownContent = formatArticleAsMarkdown(article);
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(article.title || 'article').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the object URL
  };

  /**
   * Handles copying the generated article to the clipboard.
   */
  const handleCopyArticle = async () => {
    if (!article) {
      setError("No article to copy.");
      return;
    }
    const markdownContent = formatArticleAsMarkdown(article);
    try {
      // document.execCommand('copy') is generally discouraged and has limited support in modern contexts.
      // navigator.clipboard.writeText is the modern, preferred way.
      await navigator.clipboard.writeText(markdownContent);
      setCopySuccess('Article copied to clipboard!');
      setTimeout(() => setCopySuccess(''), 3000); // Clear message after 3 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopySuccess('Failed to copy article. Please try manually.');
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
          {/* Article Action Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={handleDownloadArticle}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium transition-colors duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Download Article (.md)
            </button>
            <button
              onClick={handleCopyArticle}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium transition-colors duration-300 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Copy Article (Markdown)
            </button>
          </div>
          {copySuccess && (
            <p className="text-green-400 text-center text-sm mb-4">{copySuccess}</p>
          )}

          {/* Article Content Display */}
          {article.title && (
            <h2 className="text-3xl sm:text-4xl font-bold text-indigo-400 mb-2 border-b border-gray-700 pb-4">
              {article.title}
            </h2>
          )}
          {article.subtitle && (
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-300 mb-6">
              {article.subtitle}
            </h3>
          )}

          {article.introduction && (
            <div className="mb-8">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-200 mb-4">Introduction</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                {article.introduction}
              </p>
            </div>
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
                  {/* Handle both text and image blocks within content array */}
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

          {article.faq_section && article.faq_section.length > 0 && (
            <div className="mb-8">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-200 mb-4">Frequently Asked Questions</h3>
              {article.faq_section.map((faq, index) => (
                <div key={`faq-${index}`} className="mb-4">
                  <p className="text-gray-300 leading-relaxed">
                    <strong className="text-indigo-400">Q:</strong> {faq.question}
                  </p>
                  <p className="text-gray-300 leading-relaxed ml-4">
                    <strong className="text-green-400">A:</strong> {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          )}

          {article.conclusion && (
            <div className="mb-8">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-200 mb-4">Conclusion</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                {article.conclusion}
              </p>
            </div>
          )}
        </div>
      )}

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} ArticleGenius AI. All rights reserved.</p>
        <p>Powered by <a href="https://gemini.google.com/ai" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Gemini AI</a> and <a href="https://pixabay.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Pixabay</a></p>
      </footer>
    </div>
  );
}
