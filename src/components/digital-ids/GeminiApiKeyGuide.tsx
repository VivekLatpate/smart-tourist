'use client'

import { motion } from 'framer-motion'

export default function GeminiApiKeyGuide() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 rounded-lg p-6 border border-white/10 mb-6"
    >
      <h3 className="text-white font-semibold mb-4">🔑 How to Get Your Gemini API Key</h3>
      
      <div className="space-y-4 text-sm">
        <div className="flex items-start gap-3">
          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
          <div>
            <p className="text-white/90 font-medium">Visit Google AI Studio</p>
            <p className="text-white/60">Go to <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">makersuite.google.com/app/apikey</a></p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
          <div>
            <p className="text-white/90 font-medium">Sign in with Google</p>
            <p className="text-white/60">Use your Google account to access the AI Studio</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
          <div>
            <p className="text-white/90 font-medium">Create API Key</p>
            <p className="text-white/60">Click "Create API Key" and copy the generated key</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
          <div>
            <p className="text-white/90 font-medium">Paste in the App</p>
            <p className="text-white/60">Paste your API key in the field above to start analyzing photos</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
        <p className="text-yellow-300 text-xs">
          <strong>Note:</strong> The Gemini API is free for most use cases. Your API key is stored locally in your browser and never sent to our servers.
        </p>
      </div>
    </motion.div>
  )
}
