import React from 'react';

function ResultsGrid({ results, isLoading }) {
  if (isLoading) {
    return (
      <div className="results-loading">
        <div className="spinner"></div>
        <p>Searching collections...</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="no-results">
        <p>No results found. Try a different search query or image.</p>
      </div>
    );
  }

  return (
    <div className="results-grid">
      {results.map((result, index) => (
        <div key={index} className="result-card">
          <div className="result-image">
            <img 
              src={`/api/images/${result.collection_id}/${result.metadata.path}`} 
              alt={result.metadata.filename || 'Search result'} 
            />
          </div>
          <div className="result-info">
            <h3>{result.metadata.filename || 'Untitled'}</h3>
            <p className="collection-name">{result.metadata.collection}</p>
            <p className="similarity">Similarity: {(result.similarity * 100).toFixed(1)}%</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ResultsGrid; 