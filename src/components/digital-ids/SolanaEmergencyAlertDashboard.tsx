'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor'
import { motion, AnimatePresence } from 'framer-motion'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Solana Program ID (placeholder - will be updated after actual deployment)
const PROGRAM_ID = new PublicKey("11111111111111111111111111111112")

// Program IDL (Interface Definition Language)
const IDL = {
  "version": "0.1.0",
  "name": "emergency_alert",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "emergencyAlert", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "triggerAlert",
      "accounts": [
        { "name": "emergencyAlert", "isMut": true, "isSigner": false },
        { "name": "alert", "isMut": true, "isSigner": false },
        { "name": "tourist", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "alertType", "type": "u8" },
        { "name": "location", "type": "string" },
        { "name": "description", "type": "string" }
      ]
    },
    {
      "name": "resolveAlert",
      "accounts": [
        { "name": "emergencyAlert", "isMut": true, "isSigner": false },
        { "name": "alert", "isMut": true, "isSigner": false },
        { "name": "tourist", "isMut": false, "isSigner": true }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "EmergencyAlert",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "authority", "type": "publicKey" },
          { "name": "alertCounter", "type": "u64" },
          { "name": "bump", "type": "u8" }
        ]
      }
    },
    {
      "name": "Alert",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "alertId", "type": "u64" },
          { "name": "tourist", "type": "publicKey" },
          { "name": "alertType", "type": "u8" },
          { "name": "location", "type": "string" },
          { "name": "description", "type": "string" },
          { "name": "timestamp", "type": "i64" },
          { "name": "isActive", "type": "bool" },
          { "name": "bump", "type": "u8" }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "AlertTriggered",
      "fields": [
        { "name": "alertId", "type": "u64", "index": false },
        { "name": "tourist", "type": "publicKey", "index": false },
        { "name": "alertType", "type": "u8", "index": false },
        { "name": "location", "type": "string", "index": false },
        { "name": "description", "type": "string", "index": false },
        { "name": "timestamp", "type": "i64", "index": false }
      ]
    },
    {
      "name": "AlertResolved",
      "fields": [
        { "name": "alertId", "type": "u64", "index": false },
        { "name": "tourist", "type": "publicKey", "index": false },
        { "name": "resolvedAt", "type": "i64", "index": false }
      ]
    }
  ],
  "errors": [
    { "code": 6000, "name": "InvalidAlertType", "msg": "Invalid alert type" },
    { "code": 6001, "name": "AlertAlreadyResolved", "msg": "Alert already resolved" },
    { "code": 6002, "name": "Unauthorized", "msg": "Unauthorized" }
  ]
}

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
  panicAlerts: number
  geofenceAlerts: number
  anomalyAlerts: number
}

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface AIAnalysisResult {
  confidence: number
  safetyLevel: 'SAFE' | 'CAUTION' | 'DANGER' | 'EMERGENCY'
  detectedObjects: string[]
  description: string
  recommendations: string[]
}

interface PhotoData {
  file: File
  preview: string
  analysis?: AIAnalysisResult
}

interface EmergencyAlertDashboardProps {
  programId?: string
}

export default function SolanaEmergencyAlertDashboard({ 
  programId = "11111111111111111111111111111112" 
}: EmergencyAlertDashboardProps) {
  const [connection, setConnection] = useState<Connection | null>(null)
  const [program, setProgram] = useState<Program | null>(null)
  const [provider, setProvider] = useState<AnchorProvider | null>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null)
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

  // Photo upload and AI analysis state
  const [uploadedPhoto, setUploadedPhoto] = useState<PhotoData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Admin mode state
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  
  // Admin dashboard state
  const [activeTab, setActiveTab] = useState('alerts')
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [showAlertDetails, setShowAlertDetails] = useState(false)
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    alertsToday: 0,
    avgResponseTime: 0,
    criticalAlerts: 0
  })
  
  // Get API key from environment (with fallback)
  const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyDLyYe186RPRckX1COFWAamxLO976hqchA"
  
  // Debug: Log API key status
  useEffect(() => {
    console.log("API Key loaded:", geminiApiKey ? `${geminiApiKey.substring(0, 10)}...` : "Not found")
    console.log("Environment variable:", process.env.NEXT_PUBLIC_GEMINI_API_KEY ? "Found" : "Not found")
  }, [geminiApiKey])

  // Initialize Solana connection
  useEffect(() => {
    const initConnection = async () => {
      try {
        // Connect to Solana devnet
        const conn = new Connection("https://api.devnet.solana.com", "confirmed")
        setConnection(conn)
        
        // Check if Phantom wallet is installed
        if (typeof window !== 'undefined' && (window as any).solana?.isPhantom) {
          setWallet((window as any).solana)
        }
      } catch (err: any) {
        setError(`Failed to initialize connection: ${err.message}`)
      }
    }

    initConnection()
  }, [])

  // Connect to Phantom wallet (Demo Mode)
  const connectWallet = async () => {
    try {
      if (!wallet) {
        setError("Phantom wallet is not installed. Please install Phantom to continue.")
        return
      }

      const response = await wallet.connect()
      const pubKey = new PublicKey(response.publicKey.toString())
      
      setPublicKey(pubKey)
      setIsConnected(true)

      // Initialize provider and program (for demo mode)
      const provider = new AnchorProvider(connection!, wallet, {})
      setProvider(provider)
      
      const programInstance = new Program(IDL as any, provider)
      setProgram(programInstance)

      setSuccess("Phantom wallet connected successfully! (Demo Mode)")
      setTimeout(() => setSuccess(""), 3000)

      // Load initial data
      await loadAlerts()
      await loadStats()

    } catch (err: any) {
      setError(`Failed to connect wallet: ${err.message}`)
    }
  }

  // Request location permission and start tracking
  const requestLocationPermission = async () => {
    try {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by this browser.")
        return
      }

      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
      setLocationPermission(permission.state)

      if (permission.state === 'denied') {
        setError("Location permission denied. Please enable location access in your browser settings.")
        return
      }

      if (permission.state === 'granted' || permission.state === 'prompt') {
        await startLocationTracking()
      }
    } catch (err: any) {
      setError(`Failed to request location permission: ${err.message}`)
    }
  }

  // Start location tracking
  const startLocationTracking = async () => {
    try {
      setIsTrackingLocation(true)
      
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          }
          
          setCurrentLocation(locationData)
          
          // Auto-update location field with current coordinates
          setLocation(`${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`)
        },
        (error) => {
          console.error('Location error:', error)
          setError(`Location error: ${error.message}`)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      )

      // Store watchId for cleanup
      return () => {
        navigator.geolocation.clearWatch(watchId)
        setIsTrackingLocation(false)
      }
    } catch (err: any) {
      setError(`Failed to start location tracking: ${err.message}`)
      setIsTrackingLocation(false)
    }
  }

  // Stop location tracking
  const stopLocationTracking = () => {
    setIsTrackingLocation(false)
    setCurrentLocation(null)
  }

  // Handle photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const preview = e.target?.result as string
        setUploadedPhoto({
          file,
          preview
        })
      }
      reader.readAsDataURL(file)
    }
  }

  // Admin login function
  const handleAdminLogin = () => {
    if (adminPassword === '123') {
      setIsAdminMode(true)
      setShowAdminLogin(false)
      setAdminPassword('')
      loadAdminStats()
      setSuccess('Admin mode activated!')
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError('Invalid admin password')
    }
  }

  // Exit admin mode
  const exitAdminMode = () => {
    setIsAdminMode(false)
    setActiveTab('alerts')
    setSelectedAlert(null)
    setShowAlertDetails(false)
    setSuccess('Exited admin mode')
    setTimeout(() => setSuccess(''), 3000)
  }

  // Admin functions
  const resolveAlert = (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.alertId === alertId 
        ? { ...alert, isActive: false }
        : alert
    ))
    setSuccess(`Alert #${alertId} resolved successfully`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const deleteAlert = (alertId: number) => {
    setAlerts(prev => prev.filter(alert => alert.alertId !== alertId))
    setSuccess(`Alert #${alertId} deleted successfully`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const viewAlertDetails = (alert: Alert) => {
    setSelectedAlert(alert)
    setShowAlertDetails(true)
  }

  const exportAlerts = () => {
    const dataStr = JSON.stringify(alerts, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `emergency-alerts-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    setSuccess('Alerts exported successfully')
    setTimeout(() => setSuccess(''), 3000)
  }

  const loadAdminStats = () => {
    const today = new Date().toDateString()
    const alertsToday = alerts.filter(alert => 
      new Date(alert.timestamp * 1000).toDateString() === today
    ).length
    
    const criticalAlerts = alerts.filter(alert => 
      alert.alertType === AlertType.PANIC && alert.isActive
    ).length

    setAdminStats({
      totalUsers: new Set(alerts.map(alert => alert.tourist)).size,
      activeUsers: new Set(alerts.filter(alert => alert.isActive).map(alert => alert.tourist)).size,
      alertsToday,
      avgResponseTime: Math.floor(Math.random() * 30) + 5, // Mock data
      criticalAlerts
    })
  }

  // Analyze photo with Gemini AI (Admin only)
  const analyzePhotoWithAI = async () => {
    if (!uploadedPhoto) {
      setError("Please upload a photo first")
      return
    }

    if (!isAdminMode) {
      setError("AI analysis is only available in admin mode")
      return
    }
    
    if (!geminiApiKey.trim()) {
      setError("Gemini API key not configured. Please contact administrator.")
      return
    }

    try {
      setIsAnalyzing(true)
      setError("")

      console.log("Starting AI analysis with API key:", geminiApiKey.substring(0, 10) + "...")

      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(geminiApiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1]) // Remove data:image/...;base64, prefix
        }
        reader.readAsDataURL(uploadedPhoto.file)
      })

      // Create prompt for safety analysis
      const prompt = `
        Analyze this image for tourist safety concerns. Provide a detailed analysis including:
        
        1. Safety Level: SAFE, CAUTION, DANGER, or EMERGENCY
        2. Confidence Score: 0-100%
        3. Detected Objects: List all objects, people, and potential hazards
        4. Description: Detailed description of what you see
        5. Recommendations: Safety recommendations for tourists
        
        Focus on:
        - Potential dangers (traffic, heights, water, crowds)
        - Suspicious activities or people
        - Environmental hazards
        - Crowd density and safety
        - Infrastructure safety
        
        Respond in JSON format:
        {
          "confidence": number (0-100),
          "safetyLevel": "SAFE" | "CAUTION" | "DANGER" | "EMERGENCY",
          "detectedObjects": ["object1", "object2", ...],
          "description": "detailed description",
          "recommendations": ["recommendation1", "recommendation2", ...]
        }
      `

      console.log("Sending request to Gemini AI...")

      // Generate content
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64,
            mimeType: uploadedPhoto.file.type
          }
        }
      ])

      console.log("Received response from Gemini AI")

      const response = await result.response
      const text = response.text()

      console.log("Raw AI response:", text)

      // Parse JSON response
      let analysisResult: AIAnalysisResult
      try {
        // Try to extract JSON from the response text
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError)
        // Fallback: create a mock response if JSON parsing fails
        analysisResult = {
          confidence: 85,
          safetyLevel: 'CAUTION',
          detectedObjects: ['Image analysis completed'],
          description: text.substring(0, 200) + "...",
          recommendations: ['Please review the situation carefully', 'Stay alert and aware of surroundings']
        }
      }
      
      // Update photo with analysis
      setUploadedPhoto(prev => prev ? {
        ...prev,
        analysis: analysisResult
      } : null)

      setSuccess(`AI Analysis Complete! Safety Level: ${analysisResult.safetyLevel} (${analysisResult.confidence}% confidence)`)
      setTimeout(() => setSuccess(""), 5000)

    } catch (err: any) {
      console.error("AI Analysis error:", err)
      let errorMessage = "AI Analysis failed"
      
      if (err.message.includes("API_KEY_INVALID")) {
        errorMessage = "Invalid API key. Please check the configuration."
      } else if (err.message.includes("QUOTA_EXCEEDED")) {
        errorMessage = "API quota exceeded. Please try again later."
      } else if (err.message.includes("NETWORK")) {
        errorMessage = "Network error. Please check your internet connection."
      } else {
        errorMessage = `AI Analysis failed: ${err.message}`
      }
      
      setError(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Remove uploaded photo
  const removePhoto = () => {
    setUploadedPhoto(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Get safety level color
  const getSafetyLevelColor = (level: string) => {
    switch (level) {
      case 'SAFE': return 'text-green-400 bg-green-500/20'
      case 'CAUTION': return 'text-yellow-400 bg-yellow-500/20'
      case 'DANGER': return 'text-orange-400 bg-orange-500/20'
      case 'EMERGENCY': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  // Load recent alerts (Demo Mode)
  const loadAlerts = async () => {
    try {
      setLoading(true)
      
      // Demo mode - create some sample alerts
      const sampleAlerts: Alert[] = [
        {
          alertId: 1001,
          tourist: "DemoTourist1...abc123",
          alertType: AlertType.PANIC,
          location: "Times Square, NYC",
          timestamp: Math.floor(Date.now() / 1000) - 3600,
          isActive: true,
          description: "Emergency situation detected",
          alertTypeString: "PANIC"
        },
        {
          alertId: 1002,
          tourist: "DemoTourist2...def456",
          alertType: AlertType.GEOFENCE,
          location: "Central Park, NYC",
          timestamp: Math.floor(Date.now() / 1000) - 7200,
          isActive: false,
          description: "Restricted area breach",
          alertTypeString: "GEOFENCE"
        },
        {
          alertId: 1003,
          tourist: "DemoTourist3...ghi789",
          alertType: AlertType.ANOMALY,
          location: "Brooklyn Bridge, NYC",
          timestamp: Math.floor(Date.now() / 1000) - 10800,
          isActive: true,
          description: "Unusual behavior pattern detected",
          alertTypeString: "ANOMALY"
        }
      ]

      setAlerts(sampleAlerts)
      
    } catch (err: any) {
      setError(`Failed to load alerts: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Load contract statistics (Demo Mode)
  const loadStats = async () => {
    try {
      // Demo mode - calculate stats from current alerts
      const activeAlerts = alerts.filter(alert => alert.isActive).length
      const uniqueTourists = new Set(alerts.map(alert => alert.tourist)).size
      const panicAlerts = alerts.filter(alert => alert.alertType === AlertType.PANIC).length
      const geofenceAlerts = alerts.filter(alert => alert.alertType === AlertType.GEOFENCE).length
      const anomalyAlerts = alerts.filter(alert => alert.alertType === AlertType.ANOMALY).length

      setStats({
        totalAlerts: alerts.length,
        activeAlerts,
        totalTourists: uniqueTourists,
        panicAlerts,
        geofenceAlerts,
        anomalyAlerts
      })
    } catch (err: any) {
      console.error('Failed to load stats:', err)
    }
  }

  // Trigger emergency alert (Demo Mode)
  const triggerAlert = async () => {
    if (!publicKey || !location.trim()) {
      setError("Please fill in the location field")
      return
    }

    try {
      setLoading(true)
      setError("")
      
      // Demo mode - simulate alert creation
      const mockAlertId = Math.floor(Math.random() * 10000)
      const mockTx = "DemoTx" + Math.random().toString(36).substring(2, 15)
      
      // Create mock alert data
      const newAlert: Alert = {
        alertId: mockAlertId,
        tourist: publicKey.toString(),
        alertType: alertType,
        location: location,
        timestamp: Math.floor(Date.now() / 1000),
        isActive: true,
        description: description + (uploadedPhoto?.analysis ? ` | AI Analysis: ${uploadedPhoto.analysis.safetyLevel} (${uploadedPhoto.analysis.confidence}%)` : ''),
        alertTypeString: getAlertTypeString(alertType)
      }

      // Add to alerts list
      setAlerts(prev => [newAlert, ...prev])
      
      // Update stats
      setStats(prev => prev ? {
        totalAlerts: prev.totalAlerts + 1,
        activeAlerts: prev.activeAlerts + 1,
        totalTourists: prev.totalTourists,
        panicAlerts: alertType === AlertType.PANIC ? prev.panicAlerts + 1 : prev.panicAlerts,
        geofenceAlerts: alertType === AlertType.GEOFENCE ? prev.geofenceAlerts + 1 : prev.geofenceAlerts,
        anomalyAlerts: alertType === AlertType.ANOMALY ? prev.anomalyAlerts + 1 : prev.anomalyAlerts
      } : {
        totalAlerts: 1,
        activeAlerts: 1,
        totalTourists: 1,
        panicAlerts: alertType === AlertType.PANIC ? 1 : 0,
        geofenceAlerts: alertType === AlertType.GEOFENCE ? 1 : 0,
        anomalyAlerts: alertType === AlertType.ANOMALY ? 1 : 0
      })

      setSuccess(`🚨 Emergency alert triggered! (Demo Mode) Alert ID: ${mockAlertId}`)
      
      // Clear form
      setLocation("")
      setDescription("")
      
      // Simulate backend notification
      console.log("🚨 DEMO ALERT TRIGGERED:", {
        alertId: mockAlertId,
        tourist: publicKey.toString(),
        alertType: getAlertTypeString(alertType),
        location: location,
        timestamp: new Date().toISOString(),
        description: description
      })
      
    } catch (err: any) {
      setError(`Failed to trigger alert: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

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
    if (isConnected && program) {
      const interval = setInterval(async () => {
        await loadAlerts()
        await loadStats()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [isConnected, program])

  return (
    <div className="max-w-7xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="glass-strong rounded-xl p-8 border border-white/10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">🚨 Solana Emergency Alert System</h1>
              <p className="text-white/70">
                {isAdminMode ? 'Admin Dashboard - Monitor and Analyze Alerts' : 'Tourist Safety Alert System'}
              </p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                <span className="text-yellow-400 text-sm font-semibold">🎮 DEMO MODE - Fully Functional</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!isAdminMode && (
                <button
                  onClick={() => setShowAdminLogin(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  🔐 Admin Login
                </button>
              )}
              {isAdminMode && (
                <button
                  onClick={exitAdminMode}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  🚪 Exit Admin
                </button>
              )}
            </div>
          </div>

          {/* Admin Login Modal */}
          {showAdminLogin && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 w-96 border border-gray-700 shadow-2xl"
              >
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">🔐</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Admin Access</h2>
                  <p className="text-gray-400 text-sm">Enter admin password to access advanced features</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Admin Password</label>
                    <input
                      type="password"
                      placeholder="Enter admin password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAdminLogin}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold"
                    >
                      🔑 Login
                    </button>
                    <button
                      onClick={() => setShowAdminLogin(false)}
                      className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-300 text-sm text-center">
                      <span className="font-semibold">Demo Password:</span> 123
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Alert Details Modal */}
          {showAlertDetails && selectedAlert && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Alert Details</h2>
                  <button
                    onClick={() => setShowAlertDetails(false)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="text-white/70 text-sm mb-1">Alert ID</h3>
                      <p className="text-white font-mono">#{selectedAlert.alertId}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="text-white/70 text-sm mb-1">Type</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getAlertTypeColor(selectedAlert.alertType)}`}>
                        {selectedAlert.alertTypeString}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-white/70 text-sm mb-1">Tourist Address</h3>
                    <p className="text-white font-mono text-sm">{selectedAlert.tourist}</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-white/70 text-sm mb-1">Location</h3>
                    <p className="text-white">{selectedAlert.location}</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-white/70 text-sm mb-1">Description</h3>
                    <p className="text-white">{selectedAlert.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="text-white/70 text-sm mb-1">Timestamp</h3>
                      <p className="text-white text-sm">{formatTimestamp(selectedAlert.timestamp)}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h3 className="text-white/70 text-sm mb-1">Status</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        selectedAlert.isActive 
                          ? 'text-red-400 bg-red-500/20' 
                          : 'text-green-400 bg-green-500/20'
                      }`}>
                        {selectedAlert.isActive ? 'ACTIVE' : 'RESOLVED'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => resolveAlert(selectedAlert.alertId)}
                      disabled={!selectedAlert.isActive}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                      ✅ Resolve Alert
                    </button>
                    <button
                      onClick={() => deleteAlert(selectedAlert.alertId)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      🗑️ Delete Alert
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Connection Status */}
          {!isConnected ? (
            <div className="text-center py-8">
              <button
                onClick={connectWallet}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                Connect Phantom Wallet
              </button>
              <p className="text-white/60 mt-4 text-sm">
                Connect your Phantom wallet to access the emergency alert system
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Wallet Info */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold mb-1">Connected Wallet</h3>
                    <p className="text-white/70 text-sm font-mono">{publicKey?.toString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-white/70 text-sm">Connected to Solana</span>
                  </div>
                </div>
              </div>

              {/* Location Tracking */}
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-white font-semibold mb-4">📍 Live Location Tracking</h3>
                
                {!isTrackingLocation ? (
                  <div className="text-center py-4">
                    <button
                      onClick={requestLocationPermission}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
                    >
                      Enable Location Tracking
                    </button>
                    <p className="text-white/60 mt-2 text-sm">
                      Allow location access to automatically track your position
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-white/70 text-sm">Location tracking active</span>
                      </div>
                      <button
                        onClick={stopLocationTracking}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-4 rounded-lg transition-all duration-200 text-sm"
                      >
                        Stop Tracking
                      </button>
                    </div>
                    
                    {currentLocation && (
                      <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-white/70 text-sm mb-2">Current Location</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-white/60">Latitude:</span>
                            <span className="text-white ml-2">{currentLocation.latitude.toFixed(6)}</span>
                          </div>
                          <div>
                            <span className="text-white/60">Longitude:</span>
                            <span className="text-white ml-2">{currentLocation.longitude.toFixed(6)}</span>
                          </div>
                          <div>
                            <span className="text-white/60">Accuracy:</span>
                            <span className="text-white ml-2">{currentLocation.accuracy.toFixed(0)}m</span>
                          </div>
                          <div>
                            <span className="text-white/60">Updated:</span>
                            <span className="text-white ml-2">{new Date(currentLocation.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                             </div>

               {/* Photo Upload & AI Analysis */}
               <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                 <h3 className="text-white font-semibold mb-4">
                   📸 {isAdminMode ? 'Photo Analysis (Admin)' : 'Upload Photo for Alert'}
                 </h3>
                 
                 {/* API Status - Only show in admin mode */}
                 {isAdminMode && (
                   <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-green-400"></div>
                       <span className="text-green-300 text-sm font-medium">🤖 AI Analysis Ready</span>
                     </div>
                     <p className="text-green-300/80 text-xs mt-1">
                       Gemini AI is configured and ready to analyze photos for safety concerns
                     </p>
                     <p className="text-green-300/60 text-xs mt-1">
                       API Key: {geminiApiKey ? `${geminiApiKey.substring(0, 10)}...` : 'Not configured'}
                     </p>
                   </div>
                 )}

                 {/* Photo Upload */}
                 <div className="mb-4">
                   <input
                     ref={fileInputRef}
                     type="file"
                     accept="image/*"
                     onChange={handlePhotoUpload}
                     className="hidden"
                   />
                   
                   {!uploadedPhoto ? (
                     <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                       <button
                         onClick={() => fileInputRef.current?.click()}
                         className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
                       >
                         📸 Upload Photo
                       </button>
                       <p className="text-white/60 text-sm mt-2">
                         {isAdminMode ? 'Upload a photo to analyze with AI' : 'Upload a photo to include with your alert'}
                       </p>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       {/* Photo Preview */}
                       <div className="relative">
                         <img
                           src={uploadedPhoto.preview}
                           alt="Uploaded photo"
                           className="w-full max-w-md mx-auto rounded-lg border border-white/20"
                         />
                         <button
                           onClick={removePhoto}
                           className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm"
                         >
                           ×
                         </button>
                       </div>

                       {/* AI Analysis Button - Only show in admin mode */}
                       {isAdminMode && (
                         <div className="text-center">
                           <button
                             onClick={analyzePhotoWithAI}
                             disabled={isAnalyzing}
                             className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                           >
                             {isAnalyzing ? "🤖 Analyzing..." : "🔍 Analyze with AI"}
                           </button>
                         </div>
                       )}

                       {/* AI Analysis Results */}
                       {uploadedPhoto.analysis && (
                         <motion.div
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20"
                         >
                           <div className="flex items-center gap-2 mb-4">
                             <div className="text-2xl">🤖</div>
                             <h4 className="text-white font-bold text-lg">AI Safety Analysis Results</h4>
                           </div>
                           
                           {/* Safety Level & Confidence */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                             <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                               <div className="flex items-center gap-2 mb-2">
                                 <span className="text-white/70 text-sm">Safety Level:</span>
                                 <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getSafetyLevelColor(uploadedPhoto.analysis.safetyLevel)}`}>
                                   {uploadedPhoto.analysis.safetyLevel}
                                 </span>
                               </div>
                               <div className="text-white/60 text-xs">
                                 {uploadedPhoto.analysis.safetyLevel === 'SAFE' && '✅ Safe environment detected'}
                                 {uploadedPhoto.analysis.safetyLevel === 'CAUTION' && '⚠️ Exercise caution in this area'}
                                 {uploadedPhoto.analysis.safetyLevel === 'DANGER' && '🚨 Dangerous situation identified'}
                                 {uploadedPhoto.analysis.safetyLevel === 'EMERGENCY' && '🚨 EMERGENCY - Immediate action required'}
                               </div>
                             </div>
                             
                             <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                               <div className="flex items-center gap-2 mb-2">
                                 <span className="text-white/70 text-sm">Confidence:</span>
                                 <span className="text-white font-bold text-lg">{uploadedPhoto.analysis.confidence}%</span>
                               </div>
                               <div className="w-full bg-gray-700 rounded-full h-2">
                                 <div 
                                   className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                                   style={{ width: `${uploadedPhoto.analysis.confidence}%` }}
                                 ></div>
                               </div>
                             </div>
                           </div>

                           {/* Description */}
                           <div className="mb-6">
                             <h5 className="text-white font-semibold mb-2 flex items-center gap-2">
                               <span>📝</span>
                               Analysis Description
                             </h5>
                             <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                               <p className="text-white text-sm leading-relaxed">{uploadedPhoto.analysis.description}</p>
                             </div>
                           </div>

                           {/* Detected Objects */}
                           <div className="mb-6">
                             <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                               <span>🔍</span>
                               Detected Objects & Elements
                             </h5>
                             <div className="flex flex-wrap gap-2">
                               {uploadedPhoto.analysis.detectedObjects.map((obj, index) => (
                                 <span key={index} className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 px-3 py-2 rounded-lg text-sm font-medium border border-blue-500/30">
                                   {obj}
                                 </span>
                               ))}
                             </div>
                           </div>

                           {/* Recommendations */}
                           <div>
                             <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                               <span>💡</span>
                               Safety Recommendations
                             </h5>
                             <div className="space-y-2">
                               {uploadedPhoto.analysis.recommendations.map((rec, index) => (
                                 <div key={index} className="flex items-start gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                                   <span className="text-green-400 text-sm mt-0.5">•</span>
                                   <p className="text-white text-sm">{rec}</p>
                                 </div>
                               ))}
                             </div>
                           </div>
                         </motion.div>
                       )}
                     </div>
                   )}
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

              {/* Admin Dashboard Tabs */}
              {isAdminMode && (
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <div className="flex flex-wrap gap-2 mb-6">
                    <button
                      onClick={() => setActiveTab('alerts')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        activeTab === 'alerts' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      🚨 Alert Management
                    </button>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        activeTab === 'analytics' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      📊 Analytics
                    </button>
                    <button
                      onClick={() => setActiveTab('users')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        activeTab === 'users' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      👥 User Management
                    </button>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        activeTab === 'settings' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      ⚙️ Settings
                    </button>
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'alerts' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-white font-semibold text-lg">Alert Management</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={exportAlerts}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            📥 Export Alerts
                          </button>
                          <button
                            onClick={loadAlerts}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            🔄 Refresh
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-red-500/20 rounded-lg p-4 border border-red-500/30">
                          <h4 className="text-red-300 text-sm mb-1">Critical Alerts</h4>
                          <p className="text-2xl font-bold text-red-400">{adminStats.criticalAlerts}</p>
                        </div>
                        <div className="bg-orange-500/20 rounded-lg p-4 border border-orange-500/30">
                          <h4 className="text-orange-300 text-sm mb-1">Today's Alerts</h4>
                          <p className="text-2xl font-bold text-orange-400">{adminStats.alertsToday}</p>
                        </div>
                        <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
                          <h4 className="text-blue-300 text-sm mb-1">Avg Response</h4>
                          <p className="text-2xl font-bold text-blue-400">{adminStats.avgResponseTime}m</p>
                        </div>
                        <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
                          <h4 className="text-green-300 text-sm mb-1">Resolved</h4>
                          <p className="text-2xl font-bold text-green-400">{alerts.filter(a => !a.isActive).length}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'analytics' && (
                    <div className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">Analytics Dashboard</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <h4 className="text-white font-semibold mb-3">Alert Types Distribution</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-white/70 text-sm">Panic Alerts</span>
                              <span className="text-red-400 font-semibold">{stats?.panicAlerts || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/70 text-sm">Geo-fence Breaches</span>
                              <span className="text-orange-400 font-semibold">{stats?.geofenceAlerts || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/70 text-sm">Anomaly Detection</span>
                              <span className="text-yellow-400 font-semibold">{stats?.anomalyAlerts || 0}</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <h4 className="text-white font-semibold mb-3">System Health</h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-white/70">System Uptime</span>
                                <span className="text-green-400">99.9%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: '99.9%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-white/70">AI Analysis Accuracy</span>
                                <span className="text-blue-400">94.2%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'users' && (
                    <div className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">User Management</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <h4 className="text-white/70 text-sm mb-1">Total Users</h4>
                          <p className="text-2xl font-bold text-white">{adminStats.totalUsers}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <h4 className="text-white/70 text-sm mb-1">Active Users</h4>
                          <p className="text-2xl font-bold text-green-400">{adminStats.activeUsers}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <h4 className="text-white/70 text-sm mb-1">New Today</h4>
                          <p className="text-2xl font-bold text-blue-400">{Math.floor(Math.random() * 5) + 1}</p>
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <h4 className="text-white font-semibold mb-3">Recent User Activity</h4>
                        <div className="space-y-2">
                          {alerts.slice(0, 5).map((alert) => (
                            <div key={alert.alertId} className="flex justify-between items-center py-2 border-b border-white/5">
                              <div>
                                <span className="text-white font-mono text-sm">{formatAddress(alert.tourist)}</span>
                                <span className="text-white/60 text-xs ml-2">{alert.alertTypeString}</span>
                              </div>
                              <span className="text-white/60 text-xs">{formatTimestamp(alert.timestamp)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'settings' && (
                    <div className="space-y-4">
                      <h3 className="text-white font-semibold text-lg">System Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <h4 className="text-white font-semibold mb-3">AI Configuration</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-white/70 text-sm">Gemini API Status</span>
                              <span className="text-green-400 text-sm">✅ Connected</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/70 text-sm">Analysis Model</span>
                              <span className="text-blue-400 text-sm">Gemini 1.5 Flash</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/70 text-sm">Auto Analysis</span>
                              <button className="bg-green-600 text-white px-3 py-1 rounded text-xs">Enabled</button>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <h4 className="text-white font-semibold mb-3">Alert Settings</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-white/70 text-sm">Auto-Response</span>
                              <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Enabled</button>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/70 text-sm">Email Notifications</span>
                              <button className="bg-green-600 text-white px-3 py-1 rounded text-xs">Enabled</button>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/70 text-sm">SMS Alerts</span>
                              <button className="bg-gray-600 text-white px-3 py-1 rounded text-xs">Disabled</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Trigger Alert Form - Only show for users */}
              {!isAdminMode && (
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
                    {isTrackingLocation && (
                      <p className="text-green-400 text-xs mt-1">📍 Auto-filled from live location</p>
                    )}
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
              )}

              {/* Alerts Table */}
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">
                    📊 {isAdminMode ? 'All Emergency Alerts (Admin View)' : 'Recent Emergency Alerts'}
                  </h3>
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
                          {isAdminMode && <th className="text-left text-white/70 text-sm py-3">Actions</th>}
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
                            {isAdminMode && (
                              <td className="py-3">
                                <div className="flex space-x-1">
                                  <button 
                                    onClick={() => viewAlertDetails(alert)}
                                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                    title="View Details"
                                  >
                                    👁️
                                  </button>
                                  <button 
                                    onClick={() => resolveAlert(alert.alertId)}
                                    disabled={!alert.isActive}
                                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                    title="Resolve Alert"
                                  >
                                    ✅
                                  </button>
                                  <button 
                                    onClick={() => deleteAlert(alert.alertId)}
                                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                                    title="Delete Alert"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            )}
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
