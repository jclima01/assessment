import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalItems: 0,
    itemsPerPage: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async ({ page = 1, q = searchQuery, signal } = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      if (q !== searchQuery) {
        setSearchQuery(q);
      }

      const params = new URLSearchParams();
      if (q) params.append('q', q);
      params.append('page', page);
      params.append('limit', 10);

      const url = `http://localhost:3001/api/items?${params.toString()}`;

      const res = await fetch(url, { signal });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch items: ${res.status} ${res.statusText}`);
      }

      let data = await res.json();

      if (Array.isArray(data)) {
        data = {
          items: data,
          pagination: {
            currentPage: 1,
            totalItems: data.length,
            itemsPerPage: 10,
            totalPages: Math.max(1, Math.ceil(data.length / 10)),
            hasNextPage: false,
            hasPrevPage: false
          }
        };
      }

      const responseData = data;


      const items = Array.isArray(responseData.items) ? responseData.items : [];
      setItems(items);

      const pagination = responseData.pagination || {};
      const currentPage = Math.max(1, parseInt(pagination.currentPage, 10) || 1);
      const itemsPerPage = Math.max(1, parseInt(pagination.itemsPerPage, 10) || 10);
      const totalItems = Math.max(0, parseInt(pagination.totalItems, 10) || items.length);
      const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

      const newPagination = {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      };

      setPagination(newPagination);

      return responseData;
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);
  return (
    <DataContext.Provider value={{
      items,
      fetchItems,
      isLoading,
      error,
      pagination,
      searchQuery,
      setSearchQuery
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);