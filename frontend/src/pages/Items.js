import React, { useEffect, useState, useCallback, memo } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import './Items.css';

const Row = memo(({ data, index, style }) => {
  const item = data[index];
  if (!item) return null;
  
  return (
    <Link 
      to={`/items/${item.id}`}
      style={style} 
      className="item-card"
    >
      <h3>{item.name}</h3>
      <div className="item-meta">
        <span className="price">${item.price?.toFixed(2) || '0.00'}</span>
        <span className="category">{item.category || 'No category'}</span>
      </div>
    </Link>
  );
});

function Items() {
  const {
    items = [],
    fetchItems,
    isLoading = false,
    error = null,
    pagination = {
      currentPage: 1,
      totalItems: 0,
      itemsPerPage: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false
    },
    searchQuery = '',
    setSearchQuery
  } = useData();

  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  const baseUrl = isDevelopment ? 'http://localhost:3001' : '';

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== searchQuery) {
        fetchItems({ 
          page: 1, 
          q: searchTerm,
          signal: null
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, searchQuery, fetchItems]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        await fetchItems({
          page: pagination.currentPage,
          q: searchQuery || '',
          signal: controller.signal
        });
      } catch (err) {
        if (err.name !== 'AbortError' && isMounted) {
          console.error('Error fetching items:', err);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [pagination.currentPage, searchQuery, fetchItems]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchItems({
      page: newPage,
      q: searchQuery
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  if (isLoading && !items.length) {
    return <div className="loading">Loading items...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="items-container">
      <h1>Items List</h1>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      {error ? (
        <div className="error">Error: {error}</div>
      ) : (
        <>
          {items.length === 0 ? (
            <div className="no-results">No items found</div>
          ) : (
            <div className="items-list" style={{ height: '60vh', width: '100%' }}>
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height}
                    itemCount={items.length}
                    itemSize={150}
                    width={width}
                    overscanCount={5}
                  >
                    {({ index, style }) => <Row data={items} index={index} style={style} />}
                  </List>
                )}
              </AutoSizer>
            </div>
          )}
          {(pagination.totalPages > 1 || pagination.totalItems > 0) && (
            <div className="pagination" style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage || isLoading}
                className="pagination-button"
                style={{
                  padding: '5px 10px',
                  margin: '0 5px',
                  cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed',
                  opacity: pagination.hasPrevPage ? 1 : 0.5
                }}
              >
                Previous
              </button>

              <span className="pagination-info" style={{ margin: '0 10px' }}>
                Page {pagination.currentPage} of {pagination.totalPages} (Total: {pagination.totalItems} items)
              </span>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage || isLoading}
                className="pagination-button"
                style={{
                  padding: '5px 10px',
                  margin: '0 5px',
                  cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
                  opacity: pagination.hasNextPage ? 1 : 0.5
                }}
              >
                Next
              </button>

            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Items;