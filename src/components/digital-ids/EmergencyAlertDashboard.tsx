'use client'

import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { motion, AnimatePresence } from 'framer-motion'

// Emergency Alert Contract Address (demo mode)
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"

// Alert types enum
enum AlertType {
  PANIC = 0,
  GEOFENCE = 1,
  ANOMALY = 2
}

interface Alert {
  alertId: number
  tourist: string
  alertType: AlertType
  location: string
  timestamp: number
  isActive: boolean
  description: string
  alertTypeString: string
}

interface ContractStats {
  totalAlerts: number
  activeAlerts: number
  totalTourists: number
}

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface EmergencyAlertDashboardProps {
  programId?: string
}

export default function EmergencyAlertDashboard({ 
  programId = "EmergencyAlert1111111111111111111111111111111" 
}: EmergencyAlertDashboardProps) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [account, setAccount] = useState<string>("")
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Alert data state
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<ContractStats | null>(null)
  const [isListening, setIsListening] = useState(false)

  // Location tracking state
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const [locationPermission, setLocationPermission] = useState<PermissionState | null>(null)
  const [isTrackingLocation, setIsTrackingLocation] = useState(false)

  // Alert form state
  const [alertType, setAlertType] = useState<AlertType>(AlertType.PANIC)
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (typeof (window as any).ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider((window as any).ethereum)
        await provider.send("eth_requestAccounts", [])
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        
        setProvider(provider)
        setSigner(signer)
        setAccount(address)
        setIsConnected(true)
        
        // Initialize contract (demo mode - no actual contract)
        // const contract = new ethers.Contract(contractAddress, EMERGENCY_ALERT_ABI, signer)
        // setContract(contract)
        
        setSuccess("Wallet connected successfully!")
        setTimeout(() => setSuccess(""), 3000)
        
        // Load initial data
        await loadAlerts()
        await loadStats()
        
      } else {
        setError("MetaMask is not installed. Please install MetaMask to continue.")
      }
    } catch (err: any) {
      setError(`Failed to connect wallet: ${err.message}`)
    }
  }

  // Load recent alerts
  const loadAlerts = async () => {
    try {
      setLoading(true)
      
      // Demo mode - simulate loading alerts
      const alertsData: Alert[] = [
        {
          alertId: 1,
          tourist: "0x1234...5678",
          alertType: AlertType.PANIC,
          location: "Times Square, NYC",
          timestamp: Math.floor(Date.now() / 1000) - 3600,
          isActive: true,
          description: "Lost in crowded area",
          alertTypeString: "PANIC"
        },
        {
          alertId: 2,
          tourist: "0x9876...5432",
          alertType: AlertType.GEOFENCE,
          location: "Central Park, NYC",
          timestamp: Math.floor(Date.now() / 1000) - 7200,
          isActive: false,
          description: "Left designated safe zone",
          alertTypeString: "GEOFENCE"
        }
      ]
      
      setAlerts(alertsData)
      
    } catch (err: any) {
      setError(`Failed to load alerts: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Load contract statistics
  const loadStats = async () => {
    try {
      // Demo mode - simulate stats
      setStats({
        totalAlerts: 15,
        activeAlerts: 3,
        totalTourists: 8
      })
    } catch (err: any) {
      console.error('Failed to load stats:', err)
    }
  }

  // Trigger emergency alert
  const triggerAlert = async () => {
    if (!location.trim()) {
      setError("Please fill in the location field")
      return
    }

    try {
      setLoading(true)
      setError("")
      
      // Demo mode - simulate alert trigger
      setSuccess(`Emergency alert triggered! (Demo mode)`)
      
      // Refresh data
      await loadAlerts()
      await loadStats()
      
      // Clear form
      setLocation("")
      setDescription("")
      
    } catch (err: any) {
      setError(`Failed to trigger alert: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Start listening for events
  const startListening = useCallback(async () => {
    if (isListening) return

    try {
      setIsListening(true)
      console.log('Started listening for emergency alert events (Demo mode)')
      
    } catch (err: any) {
      setError(`Failed to start listening: ${err.message}`)
      setIsListening(false)
    }
  }, [isListening])

  // Stop listening for events
  const stopListening = useCallback(() => {
    if (isListening) {
      setIsListening(false)
      console.log('Stopped listening for events')
    }
  }, [isListening])

  // Get alert type string
  const getAlertTypeString = (type: AlertType): string => {
    switch (type) {
      case AlertType.PANIC: return "PANIC"
      case AlertType.GEOFENCE: return "GEOFENCE"
      case AlertType.ANOMALY: return "ANOMALY"
      default: return "UNKNOWN"
    }
  }

  // Get alert type color
  const getAlertTypeColor = (type: AlertType): string => {
    switch (type) {
      case AlertType.PANIC: return "text-red-400 bg-red-500/20"
      case AlertType.GEOFENCE: return "text-orange-400 bg-orange-500/20"
      case AlertType.ANOMALY: return "text-yellow-400 bg-yellow-500/20"
      default: return "text-gray-400 bg-gray-500/20"
    }
  }

  // Get alert priority
  const getAlertPriority = (type: AlertType): string => {
    switch (type) {
      case AlertType.PANIC: return "CRITICAL"
      case AlertType.GEOFENCE: return "HIGH"
      case AlertType.ANOMALY: return "MEDIUM"
      default: return "LOW"
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  // Format address
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(async () => {
        await loadAlerts()
        await loadStats()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [isConnected])

  // Start/stop listening when connected
  useEffect(() => {
    if (isConnected) {
      startListening()
    }
    
    return () => {
      stopListening()
    }
  }, [isConnected, startListening, stopListening])

  return (
    <div className="max-w-7xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="glass-strong rounded-xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">🚨 Emergency Alert System</h1>
            <p className="text-white/70">Real-time tourist safety monitoring and emergency response</p>
          </div>

          {/* Connection Status */}
          {!isConnected ? (
            <div className="text-center py-8">
              <button
                onClick={connectWallet}
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                Connect MetaMask Wallet
              </button>
              <p className="text-white/60 mt-4 text-sm">
                Connect your wallet to access the emergency alert system
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Wallet Info */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold mb-1">Connected Wallet</h3>
                    <p className="text-white/70 text-sm font-mono">{account}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                    <span className="text-white/70 text-sm">
                      {isListening ? 'Listening' : 'Not Listening'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-white/70 text-sm mb-1">Total Alerts</h4>
                    <p className="text-2xl font-bold text-white">{stats.totalAlerts}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-white/70 text-sm mb-1">Active Alerts</h4>
                    <p className="text-2xl font-bold text-red-400">{stats.activeAlerts}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-white/70 text-sm mb-1">Unique Tourists</h4>
                    <p className="text-2xl font-bold text-blue-400">{stats.totalTourists}</p>
                  </div>
                </div>
              )}

              {/* Trigger Alert Form */}
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-white font-semibold mb-4">🚨 Trigger Emergency Alert</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Alert Type</label>
                    <select
                      value={alertType}
                      onChange={(e) => setAlertType(Number(e.target.value) as AlertType)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
                    >
                      <option value={AlertType.PANIC}>🚨 PANIC</option>
                      <option value={AlertType.GEOFENCE}>📍 GEOFENCE</option>
                      <option value={AlertType.ANOMALY}>⚠️ ANOMALY</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Location *</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., 40.7128,-74.0060 or Times Square, NYC"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Additional details (optional)"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
                <button
                  onClick={triggerAlert}
                  disabled={loading || !location.trim()}
                  className="mt-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {loading ? "Triggering..." : "🚨 Trigger Alert"}
                </button>
              </div>

              {/* Alerts Table */}
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">📊 Recent Emergency Alerts</h3>
                  <button
                    onClick={loadAlerts}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-1 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed text-sm"
                  >
                    {loading ? "Loading..." : "Refresh"}
                  </button>
                </div>

                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/60">No alerts found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left text-white/70 text-sm py-3">ID</th>
                          <th className="text-left text-white/70 text-sm py-3">Type</th>
                          <th className="text-left text-white/70 text-sm py-3">Tourist</th>
                          <th className="text-left text-white/70 text-sm py-3">Location</th>
                          <th className="text-left text-white/70 text-sm py-3">Time</th>
                          <th className="text-left text-white/70 text-sm py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alerts.map((alert) => (
                          <motion.tr
                            key={alert.alertId}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-b border-white/5 hover:bg-white/5"
                          >
                            <td className="py-3 text-white font-mono text-sm">
                              #{alert.alertId}
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getAlertTypeColor(alert.alertType)}`}>
                                {alert.alertTypeString}
                              </span>
                            </td>
                            <td className="py-3 text-white font-mono text-sm">
                              {formatAddress(alert.tourist)}
                            </td>
                            <td className="py-3 text-white text-sm max-w-xs truncate">
                              {alert.location}
                            </td>
                            <td className="py-3 text-white/70 text-sm">
                              {formatTimestamp(alert.timestamp)}
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                alert.isActive 
                                  ? 'text-red-400 bg-red-500/20' 
                                  : 'text-green-400 bg-green-500/20'
                              }`}>
                                {alert.isActive ? 'ACTIVE' : 'RESOLVED'}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-red-500/20 border border-red-500/50 rounded-lg p-4"
                  >
                    <p className="text-red-300">{error}</p>
                  </motion.div>
                )}
                
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-green-500/20 border border-green-500/50 rounded-lg p-4"
                  >
                    <p className="text-green-300">{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
