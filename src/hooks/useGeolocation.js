import { useState, useCallback } from "react";
import { reverseGeocode as apiReverseGeocode } from "../services/api";

export function useGeolocation(initialLocation = null) {
  const [location, setLocation] = useState(initialLocation || {
    address: "Sector 62, Noida, Uttar Pradesh",
    lat: 28.6280,
    lng: 77.3649,
    accuracy: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dynamic reverse geocoding via CivicAI backend Nominatim service
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await apiReverseGeocode(lat, lng);
      if (res.success && res.data) {
        return res.data.formatted_address || res.data.display_name || "Location detected";
      }
    } catch {
      // Fallback
    }
    return "Location detected";
  }, []);

  const detectLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser. Please enter location manually.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const address = await reverseGeocode(latitude, longitude);
        setLocation({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          address,
        });
        setLoading(false);
      },
      (err) => {
        let msg = "Could not retrieve your location.";
        if (err.code === 1) msg = "Location permission denied. Please enter address manually.";
        else if (err.code === 2) msg = "Location position unavailable. Please enter address manually.";
        else if (err.code === 3) msg = "Location request timed out. Please enter address manually.";
        setError(msg);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  }, [reverseGeocode]);

  const setManualAddress = useCallback((addressText, customCoords = null) => {
    setLocation((prev) => ({
      ...prev,
      address: addressText,
      lat: customCoords ? customCoords.lat : prev.lat,
      lng: customCoords ? customCoords.lng : prev.lng,
      isManual: true,
    }));
  }, []);

  return {
    location,
    loading,
    error,
    detectLocation,
    setManualAddress,
    setLocation,
  };
}
