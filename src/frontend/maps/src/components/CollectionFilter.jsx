import React from 'react';
import './CollectionFilter.css';

function CollectionFilter({ collections, selectedCollections, setSelectedCollections }) {
  const handleCollectionChange = (collectionId) => {
    if (selectedCollections.includes(collectionId)) {
      setSelectedCollections(selectedCollections.filter(id => id !== collectionId));
    } else {
      setSelectedCollections([...selectedCollections, collectionId]);
    }
  };

  const handleSelectAll = () => {
    const allCollectionIds = collections.map(collection => collection.id);
    setSelectedCollections(allCollectionIds);
  };

  const handleSelectNone = () => {
    setSelectedCollections([]);
  };

  if (!collections || collections.length === 0) {
    return null;
  }

  return (
    <div className="collection-filter">
      <h3>Collections</h3>
      <div className="collection-actions">
        <button type="button" onClick={handleSelectAll} className="collection-action-button">
          Select All
        </button>
        <button type="button" onClick={handleSelectNone} className="collection-action-button">
          Clear
        </button>
      </div>
      <div className="collection-list">
        {collections.map(collection => (
          <label key={collection.id} className="collection-item">
            <input
              type="checkbox"
              checked={selectedCollections.includes(collection.id)}
              onChange={() => handleCollectionChange(collection.id)}
            />
            <span className="collection-name">{collection.name}</span>
            {collection.item_count && (
              <span className="collection-count">({collection.item_count})</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

export default CollectionFilter; 