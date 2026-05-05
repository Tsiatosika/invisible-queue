import { useState, useEffect } from 'react'

export function useLocation() {
  const [location, setLocation] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorMsg('Géolocalisation non supportée par ce navigateur')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLoading(false)
      },
      (error) => {
        // Si refus ou erreur, on met une position par défaut (Antananarivo)
        setLocation({
          latitude: -18.9137,
          longitude: 47.5361,
        })
        setErrorMsg('Position par défaut utilisée (Antananarivo)')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }, [])

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const isNearby = (queueLat, queueLon, radiusMeters = 500) => {
    if (!location) return false
    const distance = getDistance(
      location.latitude,
      location.longitude,
      queueLat,
      queueLon
    )
    return distance <= radiusMeters
  }

  return { location, errorMsg, loading, isNearby, getDistance }
}