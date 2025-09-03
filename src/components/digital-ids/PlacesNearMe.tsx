'use client'

import React, { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false }) as any
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

// Custom icons - will be created on client side
let userIcon: any = null
let attractionIcon: any = null

// Initialize icons on client side
const initializeIcons = () => {
  if (typeof window !== 'undefined') {
    const L = require('leaflet')
    
    // Fix for default markers in react-leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    })

    // Custom icons
    userIcon = new L.Icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMwMDc0RkYiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    })

    attractionIcon = new L.Icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjRkY2QjAwIi8+Cjwvc3ZnPg==',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    })
  }
}

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface TouristPlace {
  id: string
  name: string
  type: string
  category: string
  latitude: number
  longitude: number
  distance: number
  tags: Record<string, string>
}

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Simple component to update map center when location changes
const MapUpdater: React.FC<{ location: LocationData | null }> = ({ location }) => {
  useEffect(() => {
    if (typeof window !== 'undefined' && location) {
      // We'll use a different approach - just re-render the map with new center
      // This is handled by the key prop in MapContainer
    }
  }, [location])
  
  return null
}

const PlacesNearMe: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const [places, setPlaces] = useState<TouristPlace[]>([])
  const [filteredPlaces, setFilteredPlaces] = useState<TouristPlace[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isTracking, setIsTracking] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<TouristPlace | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [searchRadius, setSearchRadius] = useState(10) // km
  const [activeFilters, setActiveFilters] = useState<string[]>(['all'])
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [retryAfter, setRetryAfter] = useState(0)
  const watchIdRef = useRef<number | null>(null)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Filter options
  const filterOptions = [
    { id: 'all', label: 'All Places', icon: '🏛️' },
    { id: 'cafe', label: 'Cafes', icon: '☕' },
    { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
    { id: 'tourist', label: 'Tourist Attractions', icon: '🎯' },
    { id: 'historic', label: 'Historic Sites', icon: '🏛️' },
    { id: 'natural', label: 'Natural Places', icon: '🌳' },
    { id: 'leisure', label: 'Leisure', icon: '🎪' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'accommodation', label: 'Hotels', icon: '🏨' }
  ]

  // Initialize client-side components
  useEffect(() => {
    setIsClient(true)
    initializeIcons()
  }, [])

  // Countdown timer for rate limit retry
  useEffect(() => {
    if (isRateLimited && retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [isRateLimited, retryAfter])

  // Request location permission and start tracking
  const startLocationTracking = async () => {
    try {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this browser.')
        return
      }

      setIsLoading(true)
      setError('')

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          }
          
          setCurrentLocation(locationData)
          setIsTracking(true)
          setIsLoading(false)
          
          // Fetch nearby places when location updates
          fetchNearbyPlaces(locationData.latitude, locationData.longitude)
        },
        (error) => {
          console.error('Location error:', error)
          setError(`Location error: ${error.message}`)
          setIsLoading(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      )

      watchIdRef.current = watchId
    } catch (err: any) {
      setError(`Failed to start location tracking: ${err.message}`)
      setIsLoading(false)
    }
  }

  // Stop location tracking
  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
    setCurrentLocation(null)
    setPlaces([])
  }

  // Fetch nearby tourist places using Overpass API with rate limiting
  const fetchNearbyPlaces = async (lat: number, lon: number, retryCount = 0) => {
    try {
      setIsLoading(true)
      setIsRateLimited(false)
      
      const radiusInMeters = searchRadius * 1000 // Convert km to meters
      
      // Simplified query to reduce load on Overpass API
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["tourism"="attraction"](around:${radiusInMeters},${lat},${lon});
          node["tourism"="hotel"](around:${radiusInMeters},${lat},${lon});
          node["tourism"="museum"](around:${radiusInMeters},${lat},${lon});
          node["historic"](around:${radiusInMeters},${lat},${lon});
          node["amenity"="restaurant"](around:${radiusInMeters},${lat},${lon});
          node["amenity"="cafe"](around:${radiusInMeters},${lat},${lon});
          node["amenity"="fast_food"](around:${radiusInMeters},${lat},${lon});
          node["leisure"](around:${radiusInMeters},${lat},${lon});
          node["shop"](around:${radiusInMeters},${lat},${lon});
        );
        out;
      `

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
        headers: {
          'Content-Type': 'text/plain',
        },
      })

      if (response.status === 429) {
        // Rate limited - get retry-after header
        const retryAfterHeader = response.headers.get('Retry-After')
        const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader) : 60
        
        setIsRateLimited(true)
        setRetryAfter(retryAfterSeconds)
        setError(`Rate limited. Please wait ${retryAfterSeconds} seconds before trying again.`)
        
        // Auto-retry after the specified time
        setTimeout(() => {
          setIsRateLimited(false)
          setRetryAfter(0)
          if (currentLocation) {
            fetchNearbyPlaces(currentLocation.latitude, currentLocation.longitude)
          }
        }, retryAfterSeconds * 1000)
        
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      const touristPlaces: TouristPlace[] = data.elements
        .filter((element: any) => element.tags && element.tags.name)
        .map((element: any) => {
          const distance = calculateDistance(lat, lon, element.lat, element.lon)
          const category = getPlaceCategory(element.tags)
          return {
            id: element.id.toString(),
            name: element.tags.name || 'Unnamed Place',
            type: getPlaceType(element.tags),
            category: category,
            latitude: element.lat,
            longitude: element.lon,
            distance: distance,
            tags: element.tags
          }
        })
        .sort((a: TouristPlace, b: TouristPlace) => a.distance - b.distance)
        .slice(0, 100) // Limit to 100 closest places

      setPlaces(touristPlaces)
      setError('')
    } catch (err: any) {
      console.error('Error fetching places:', err)
      if (retryCount < 2) {
        // Retry with exponential backoff
        setTimeout(() => {
          fetchNearbyPlaces(lat, lon, retryCount + 1)
        }, Math.pow(2, retryCount) * 1000)
      } else {
        setError(`Failed to fetch nearby places: ${err.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Determine place type from OSM tags
  const getPlaceType = (tags: Record<string, string>): string => {
    if (tags.tourism) {
      if (tags.tourism === 'hotel') return 'accommodation'
      if (['attraction', 'museum', 'gallery', 'zoo', 'theme_park'].includes(tags.tourism)) return 'tourist'
      return `tourist: ${tags.tourism}`
    }
    if (tags.historic) return 'historic'
    if (tags.natural) return 'natural'
    if (tags.amenity) {
      if (['restaurant', 'fast_food'].includes(tags.amenity)) return 'restaurant'
      if (['cafe', 'bar', 'pub'].includes(tags.amenity)) return 'cafe'
      return `amenity: ${tags.amenity}`
    }
    if (tags.leisure) return 'leisure'
    if (tags.shop) return 'shopping'
    return 'other'
  }

  // Get place category for filtering
  const getPlaceCategory = (tags: Record<string, string>): string => {
    if (tags.tourism) {
      if (tags.tourism === 'hotel') return 'accommodation'
      if (['attraction', 'museum', 'gallery', 'zoo', 'theme_park'].includes(tags.tourism)) return 'tourist'
    }
    if (tags.historic) return 'historic'
    if (tags.natural) return 'natural'
    if (tags.amenity) {
      if (['restaurant', 'fast_food'].includes(tags.amenity)) return 'restaurant'
      if (['cafe', 'bar', 'pub'].includes(tags.amenity)) return 'cafe'
    }
    if (tags.leisure) return 'leisure'
    if (tags.shop) return 'shopping'
    return 'other'
  }

  // Get place type color
  const getPlaceTypeColor = (category: string): string => {
    switch (category) {
      case 'tourist': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'historic': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'natural': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'restaurant': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'cafe': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'leisure': return 'bg-pink-500/20 text-pink-300 border-pink-500/30'
      case 'shopping': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
      case 'accommodation': return 'bg-red-500/20 text-red-300 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  // Filter places based on active filters
  const filterPlaces = (places: TouristPlace[], filters: string[]): TouristPlace[] => {
    if (filters.includes('all')) return places
    return places.filter(place => filters.includes(place.category))
  }

  // Handle filter toggle
  const toggleFilter = (filterId: string) => {
    if (filterId === 'all') {
      setActiveFilters(['all'])
    } else {
      setActiveFilters(prev => {
        const newFilters = prev.filter(f => f !== 'all')
        if (newFilters.includes(filterId)) {
          const updated = newFilters.filter(f => f !== filterId)
          return updated.length === 0 ? ['all'] : updated
        } else {
          return [...newFilters, filterId]
        }
      })
    }
  }

  // Update filtered places when places or filters change
  useEffect(() => {
    setFilteredPlaces(filterPlaces(places, activeFilters))
  }, [places, activeFilters])

  // Refetch places when search radius changes (with debouncing)
  useEffect(() => {
    if (currentLocation && !isRateLimited) {
      // Clear existing timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
      
      // Set new timeout to debounce the API call
      fetchTimeoutRef.current = setTimeout(() => {
        fetchNearbyPlaces(currentLocation.latitude, currentLocation.longitude)
      }, 1000) // Wait 1 second after user stops changing radius
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [searchRadius, currentLocation, isRateLimited])

  // Format distance
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`
    }
    return `${distance.toFixed(1)}km`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📍 Places Near Me
              </h1>
              <p className="text-gray-600">
                Discover tourist attractions, historic sites, and points of interest around you
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {!isTracking ? (
                <button
                  onClick={startLocationTracking}
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {isLoading ? '🔄 Starting...' : '📍 Start Tracking'}
                </button>
              ) : (
                <button
                  onClick={stopLocationTracking}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  🛑 Stop Tracking
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Location Status */}
        {currentLocation && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-gray-700 font-medium">Location tracking active</span>
              </div>
              <div className="text-sm text-gray-600">
                <span>Lat: {currentLocation.latitude.toFixed(6)}</span>
                <span className="mx-2">•</span>
                <span>Lng: {currentLocation.longitude.toFixed(6)}</span>
                <span className="mx-2">•</span>
                <span>Accuracy: {currentLocation.accuracy.toFixed(0)}m</span>
              </div>
            </div>
          </div>
        )}

        {/* Search Controls */}
        {currentLocation && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Search Radius */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Search Radius: {searchRadius} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  disabled={isRateLimited}
                  className={`w-full h-2 rounded-lg appearance-none ${
                    isRateLimited 
                      ? 'bg-gray-100 cursor-not-allowed' 
                      : 'bg-gray-200 cursor-pointer'
                  }`}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1km</span>
                  <span>25km</span>
                  <span>50km</span>
                </div>
              </div>

              {/* Filter Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏷️ Filter by Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => toggleFilter(option.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        activeFilters.includes(option.id)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {option.icon} {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-4 py-3 rounded-lg mb-6 ${
              isRateLimited 
                ? 'bg-yellow-100 border border-yellow-400 text-yellow-700' 
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <div className="flex items-center space-x-3">
                {isRateLimited && retryAfter > 0 && (
                  <span className="text-sm font-medium">
                    Retrying in {retryAfter}s
                  </span>
                )}
                {isRateLimited && retryAfter === 0 && (
                  <button
                    onClick={() => {
                      if (currentLocation) {
                        fetchNearbyPlaces(currentLocation.latitude, currentLocation.longitude)
                      }
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                  >
                    Retry Now
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Places List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 h-[600px] overflow-hidden">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                🏛️ Nearby Places ({filteredPlaces.length} of {places.length})
              </h2>
              
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading places...</span>
                </div>
              )}

              {!isLoading && filteredPlaces.length === 0 && places.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No places match the selected filters</p>
                </div>
              )}

              {!isLoading && places.length === 0 && currentLocation && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No places found in the area</p>
                </div>
              )}

              {!isLoading && !currentLocation && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Start location tracking to see nearby places</p>
                </div>
              )}

              <div className="space-y-3 overflow-y-auto h-[500px] pr-2">
                <AnimatePresence>
                  {filteredPlaces.map((place) => (
                    <motion.div
                      key={place.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        selectedPlace?.id === place.id 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedPlace(place)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                          {place.name}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatDistance(place.distance)}
                        </span>
                      </div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getPlaceTypeColor(place.category)}`}>
                        {place.type}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 h-[600px]">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                🗺️ Interactive Map
              </h2>
              
              {!isClient ? (
                <div className="h-[500px] rounded-lg bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 text-lg">Loading map...</p>
                  </div>
                </div>
              ) : currentLocation ? (
                <div className="h-[500px] rounded-lg overflow-hidden">
                  <MapContainer
                    key={`${currentLocation.latitude}-${currentLocation.longitude}`}
                    center={[currentLocation.latitude, currentLocation.longitude]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* User location marker */}
                    <Marker
                      position={[currentLocation.latitude, currentLocation.longitude]}
                      icon={userIcon}
                    >
                      <Popup>
                        <div className="text-center">
                          <strong>📍 Your Location</strong>
                          <br />
                          <small>
                            Lat: {currentLocation.latitude.toFixed(6)}
                            <br />
                            Lng: {currentLocation.longitude.toFixed(6)}
                            <br />
                            Accuracy: {currentLocation.accuracy.toFixed(0)}m
                          </small>
                        </div>
                      </Popup>
                    </Marker>
                    
                    {/* Tourist places markers */}
                    {filteredPlaces.map((place) => (
                      <Marker
                        key={place.id}
                        position={[place.latitude, place.longitude]}
                        icon={attractionIcon}
                      >
                        <Popup>
                          <div className="text-center">
                            <strong>{place.name}</strong>
                            <br />
                            <small className="text-gray-600">{place.type}</small>
                            <br />
                            <small className="text-blue-600">
                              Distance: {formatDistance(place.distance)}
                            </small>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              ) : (
                <div className="h-[500px] rounded-lg bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🗺️</div>
                    <p className="text-gray-500 text-lg">Start location tracking to see the map</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Place Details */}
        {selectedPlace && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 mt-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-800">{selectedPlace.name}</h3>
              <button
                onClick={() => setSelectedPlace(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">📍 Location</h4>
                <p className="text-gray-600 text-sm">
                  {selectedPlace.latitude.toFixed(6)}, {selectedPlace.longitude.toFixed(6)}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">📏 Distance</h4>
                <p className="text-gray-600 text-sm">{formatDistance(selectedPlace.distance)}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">🏷️ Type</h4>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getPlaceTypeColor(selectedPlace.category)}`}>
                  {selectedPlace.type}
                </span>
              </div>
            </div>
            
            {Object.keys(selectedPlace.tags).length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-700 mb-3">ℹ️ Additional Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(selectedPlace.tags)
                    .filter(([key]) => !['name', 'tourism', 'historic', 'natural', 'amenity', 'leisure'].includes(key))
                    .slice(0, 6)
                    .map(([key, value]) => (
                      <div key={key} className="bg-gray-50 rounded-lg p-3">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">{key}</span>
                        <p className="text-sm text-gray-800 mt-1">{value}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default PlacesNearMe
