import { useState, useEffect } from 'react'
import * as Location from 'expo-location'

export function useLocation() {
  const [location, setLocation] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      // Demande la permission de géolocalisation
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setErrorMsg('Permission de géolocalisation refusée')
        setLoading(false)
        return
      }

      // Récupère la position actuelle
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      setLocation(loc.coords)
      setLoading(false)
    })()
  }, [])

  // Calcule la distance en mètres entre deux points GPS
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000 // rayon de la Terre en mètres
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

  // Vérifie si l'utilisateur est dans le rayon d'une file (500m par défaut)
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