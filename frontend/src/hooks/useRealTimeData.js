import { useState, useEffect } from 'react';
import { getAllComplaints, getAlerts, getCityMetrics } from '../utils/firestoreService';

// Single hook that subscribes to all real-time data streams
export const useRealTimeData = () => {
  const [complaints, setComplaints] = useState([]);
  const [alerts, setAlerts]         = useState([]);
  const [metrics, setMetrics]       = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    let loaded = { complaints: false, alerts: false, metrics: false };

    const checkLoaded = () => {
      if (loaded.complaints && loaded.alerts && loaded.metrics) setLoading(false);
    };

    const unsubComplaints = getAllComplaints((data) => {
      setComplaints(data);
      loaded.complaints = true;
      checkLoaded();
    });

    const unsubAlerts = getAlerts((data) => {
      setAlerts(data);
      loaded.alerts = true;
      checkLoaded();
    });

    const unsubMetrics = getCityMetrics((data) => {
      setMetrics(data);
      loaded.metrics = true;
      checkLoaded();
    });

    return () => { unsubComplaints(); unsubAlerts(); unsubMetrics(); };
  }, []);

  return { complaints, alerts, metrics, loading };
};
