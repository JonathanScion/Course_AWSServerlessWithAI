import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for CRUD operations
 */
const useCrud = (service, defaultFilters = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState(defaultFilters);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page + 1, // API uses 1-based indexing
        limit: rowsPerPage,
        ...filters
      };
      const response = await service.getAll(params);
      setData(response.data.data || []);
      setTotalCount(response.data.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [service, page, rowsPerPage, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = async (item) => {
    try {
      await service.create(item);
      fetchData(); // Refresh data
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to create item'
      };
    }
  };

  const update = async (id, item) => {
    try {
      await service.update(id, item);
      fetchData(); // Refresh data
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to update item'
      };
    }
  };

  const remove = async (id) => {
    try {
      await service.delete(id);
      fetchData(); // Refresh data
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to delete item'
      };
    }
  };

  const refresh = () => {
    fetchData();
  };

  return {
    data,
    loading,
    error,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    totalCount,
    filters,
    setFilters,
    create,
    update,
    remove,
    refresh
  };
};

export default useCrud;
