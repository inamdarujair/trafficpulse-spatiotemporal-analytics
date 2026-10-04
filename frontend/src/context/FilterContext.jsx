import React, { createContext, useContext, useState, useEffect } from 'react';
import { trafficApi } from '../api/trafficApi';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [meta, setMeta] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [datasets, setDatasets] = useState([]);
  const [activeDataset, setActiveDataset] = useState(null);
  const [datasetVersion, setDatasetVersion] = useState(1); // Increment on dataset switch to trigger page refreshes

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    area: 'All',
    vehicleType: 'All',
    dayOfWeek: 'All',
    congestionLevel: 'All'
  });

  // Load datasets list and filter metadata
  const loadWorkspace = async () => {
    setLoadingMeta(true);
    try {
      const [filterRes, datasetsRes] = await Promise.all([
        trafficApi.getFilters(),
        trafficApi.getDatasets().catch(() => ({ success: false, data: [] }))
      ]);

      if (datasetsRes.success && datasetsRes.data) {
        setDatasets(datasetsRes.data);
        const active = datasetsRes.data.find(d => d.is_active) || datasetsRes.data[0];
        setActiveDataset(active || null);
      }

      if (filterRes.success && filterRes.data) {
        setMeta(filterRes.data);
        // Reset and apply dataset date bounds
        if (filterRes.data.dateRange) {
          setFilters({
            startDate: filterRes.data.dateRange.start || '',
            endDate: filterRes.data.dateRange.end || '',
            area: 'All',
            vehicleType: 'All',
            dayOfWeek: 'All',
            congestionLevel: 'All'
          });
        }
      }
    } catch (err) {
      console.error('Failed to load traffic workspace:', err);
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  // Switch active dataset: resets all filters to avoid stale parameters
  const switchActiveDataset = async (dataset_id) => {
    try {
      const res = await trafficApi.activateDataset(dataset_id);
      if (res.success) {
        // Trigger full workspace reload and bump datasetVersion
        await loadWorkspace();
        setDatasetVersion(v => v + 1);
        return { success: true };
      }
      return { success: false, error: res.error || 'Activation failed' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: meta?.dateRange?.start || '',
      endDate: meta?.dateRange?.end || '',
      area: 'All',
      vehicleType: 'All',
      dayOfWeek: 'All',
      congestionLevel: 'All'
    });
  };

  const reloadDatasets = async () => {
    await loadWorkspace();
    setDatasetVersion(v => v + 1);
  };

  return (
    <FilterContext.Provider value={{
      meta,
      loadingMeta,
      datasets,
      activeDataset,
      datasetVersion,
      switchActiveDataset,
      reloadDatasets,
      filters,
      updateFilter,
      resetFilters
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => useContext(FilterContext);
