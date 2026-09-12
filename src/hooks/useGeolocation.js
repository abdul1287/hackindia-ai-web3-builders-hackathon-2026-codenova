import { useState, useCallback } from "react";

export function useGeolocation(initialLocation = null) {
  const [location, setLocation] = useState(initialLocation || {
    address: "Sector 62, Noida, Uttar Pradesh",
    lat: 28.6280,
    lng: 77.3649,
    accuracy: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simulated reverse geocoding fallback for hackathon demonstration
  const reverseGeocode = useCallback(async (lat, lng) => {
    // In real scenario, would call Nominatim / Google Maps / Pelias API
    // For fast reliable offline/hackathon experience:
    if (Math.abs(lat - 28.6280) < 0.05 && Math.abs(lng - 77.3649) < 0.05) {
      return "Sector 62, Industrial Area, Noida, UP";
    }
    if (Math.abs(lat - 28.5991) < 0.05 && Math.abs(lng - 77.3610) < 0.05) {
      return "Sector 61, Commercial Hub, Noida, UP";
    }
    return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (Auto-detected Street Location)`;
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
