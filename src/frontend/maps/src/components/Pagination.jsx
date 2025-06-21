import './Pagination.css';

const Pagination = ({ currentPage, setCurrentPage, hasMore, isLoading }) => {
  return (
    <div className="pagination">
      <button 
        className="pagination-button"
        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        disabled={currentPage <= 1 || isLoading}
      >
        Previous
      </button>
      <span>Page {currentPage}</span>
      <button 
        className="pagination-button"
        onClick={() => setCurrentPage(prev => prev + 1)}
        disabled={!hasMore || isLoading}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
