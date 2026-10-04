// API Client for TrafficPulse Pattern Analytics

const API_BASE = '/api';

/**
 * Helper to execute fetch requests with error handling
 */
const fetchJson = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP error ${res.status}: ${res.statusText}`);
    }
    const json = await res.json();
    return json;
  } catch (error) {
    console.error(`[API FETCH ERROR] ${url}:`, error.message);
    throw error;
  }
};

/**
 * Convert filter object to query string
 */
const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.area && filters.area !== 'All') params.append('area', filters.area);
  if (filters.vehicleType && filters.vehicleType !== 'All') params.append('vehicleType', filters.vehicleType);
  if (filters.dayOfWeek && filters.dayOfWeek !== 'All') params.append('dayOfWeek', filters.dayOfWeek);
  if (filters.congestionLevel && filters.congestionLevel !== 'All') params.append('congestionLevel', filters.congestionLevel);
  if (filters.dataset_id) params.append('dataset_id', filters.dataset_id);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const trafficApi = {
  // System & Metadata
  getHealth: () => fetchJson(`${API_BASE}/health`),
  getFilters: () => fetchJson(`${API_BASE}/filters`),

  // Dataset Studio
  getDatasets: () => fetchJson(`${API_BASE}/datasets`),
  getActiveDataset: () => fetchJson(`${API_BASE}/datasets/active`),
  activateDataset: (dataset_id) => fetchJson(`${API_BASE}/datasets/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_id })
  }),
  inspectCsv: (formData) => fetchJson(`${API_BASE}/datasets/inspect`, {
    method: 'POST',
    body: formData
  }),
  processDataset: (payload) => fetchJson(`${API_BASE}/datasets/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),

  // Traffic Patterns & Analytics
  getSummary: (filters) => fetchJson(`${API_BASE}/traffic/summary${buildQuery(filters)}`),
  getTrends: (filters) => fetchJson(`${API_BASE}/traffic/trends${buildQuery(filters)}`),
  getHourly: () => fetchJson(`${API_BASE}/traffic/hourly`),
  getDaily: (filters) => fetchJson(`${API_BASE}/traffic/daily${buildQuery(filters)}`),
  getMonthly: (filters) => fetchJson(`${API_BASE}/traffic/monthly${buildQuery(filters)}`),
  getLocations: (filters) => fetchJson(`${API_BASE}/traffic/locations${buildQuery(filters)}`),
  getHotspots: () => fetchJson(`${API_BASE}/traffic/hotspots`),
  getIncidents: (filters) => fetchJson(`${API_BASE}/incidents${buildQuery(filters)}`),
  getVehicles: (filters) => fetchJson(`${API_BASE}/vehicles${buildQuery(filters)}`),
  getInsights: () => fetchJson(`${API_BASE}/insights`)
};
