import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Transaction, SystemProgram, PublicKey, TransactionInstruction } from '@solana/web3.js'
import QRCode from 'qrcode.react'

type DigitalIDForm = {
  fullName: string
  idNumber: string
  emergencyContact: string
  visitStartDate: string
  visitEndDate: string
  destination: string
}

type CreateIDModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: (id: any) => void
}

export default function CreateIDModal({ isOpen, onClose, onSuccess }: CreateIDModalProps) {
  const { connected, publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  
  const [formData, setFormData] = useState<DigitalIDForm>({
    fullName: '',
    idNumber: '',
    emergencyContact: '',
    visitStartDate: '',
    visitEndDate: '',
    destination: ''
  })

  // Debug: Log form state changes
  useEffect(() => {
    console.log('Form state changed:', formData)
  }, [formData])
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [transactionHash, setTransactionHash] = useState('')
  const [generatedQR, setGeneratedQR] = useState('')



  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, resetting form...')
      // Reset all form state
      setFormData({
        fullName: '',
        idNumber: '',
        emergencyContact: '',
        visitStartDate: '',
        visitEndDate: '',
        destination: ''
      })
      setShowSuccess(false)
      setTransactionHash('')
      setGeneratedQR('')
      setIsSubmitting(false)
    } else {
      console.log('Modal closed, cleaning up form...')
      // Clean up when modal closes
      setFormData({
        fullName: '',
        idNumber: '',
        emergencyContact: '',
        visitStartDate: '',
        visitEndDate: '',
        destination: ''
      })
      setShowSuccess(false)
      setTransactionHash('')
      setGeneratedQR('')
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Don't trim immediately - let users type freely, only trim during validation
    const processedValue = value
    
    console.log('Input changed:', name, processedValue)
    console.log('Input type:', e.target.type)
    console.log('Input required:', e.target.required)
    console.log('Input valid:', e.target.validity.valid)
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: processedValue
      }
      console.log('Previous form data:', prev)
      console.log('New form data:', newData)
      console.log('Updated field:', name, '=', processedValue)
      return newData
    })
  }, [])

  const generateIDHash = useCallback((data: DigitalIDForm) => {
    // Simple hash generation (in production, use proper hashing)
    const jsonString = JSON.stringify(data)
    return btoa(jsonString).slice(0, 32)
  }, [])

  const isFormValid = useCallback(() => {
    // Check each field individually to avoid type issues
    const fullNameValid = formData.fullName?.trim().length > 0
    const idNumberValid = formData.idNumber?.trim().length > 0
    const emergencyContactValid = formData.emergencyContact?.trim().length > 0
    const visitStartDateValid = formData.visitStartDate && formData.visitStartDate.length > 0
    const visitEndDateValid = formData.visitEndDate && formData.visitEndDate.length > 0
    const destinationValid = formData.destination?.trim().length > 0
    
    const isValid = fullNameValid && idNumberValid && emergencyContactValid && 
                   visitStartDateValid && visitEndDateValid && destinationValid
    
    console.log('Form validation check:', { 
      fullNameValid, idNumberValid, emergencyContactValid, 
      visitStartDateValid, visitEndDateValid, destinationValid, 
      isValid 
    })
    return isValid
  }, [formData])

  const getFieldValidationStatus = useCallback((fieldName: keyof DigitalIDForm) => {
    const value = formData[fieldName]
    
    // Handle date fields
    if (fieldName === 'visitStartDate' || fieldName === 'visitEndDate') {
      return value && String(value).length > 0 ? 'valid' : 'invalid'
    }
    
    // Handle text fields - check for meaningful content
    if (typeof value === 'string') {
      const trimmed = value.trim()
      return trimmed.length > 0 ? 'valid' : 'invalid'
    }
    
    // Fallback
    return value && String(value).length > 0 ? 'valid' : 'invalid'
  }, [formData])

  const validateForm = useCallback(() => {
    const validationResults = {
      fullName: { valid: !!formData.fullName?.trim(), value: formData.fullName },
      idNumber: { valid: !!formData.idNumber?.trim(), value: formData.idNumber },
      emergencyContact: { valid: !!formData.emergencyContact?.trim(), value: formData.emergencyContact },
      visitStartDate: { valid: !!formData.visitStartDate, value: formData.visitStartDate },
      visitEndDate: { valid: !!formData.visitEndDate, value: formData.visitEndDate },
      destination: { valid: !!formData.destination?.trim(), value: formData.destination }
    }
    
    console.log('Form validation results:', validationResults)
    return validationResults
  }, [formData])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted!')
    console.log('Event:', e)
    console.log('Form element:', e.target)
    
    if (!connected || !publicKey) {
      alert('Please connect your wallet first')
      return
    }

    setIsSubmitting(true)

    try {
      // Get the current form data directly from the form element to avoid stale closure
      const formElement = e.target as HTMLFormElement
      const formDataObj = new FormData(formElement)
      
      // Also try to get data directly from input elements as a backup
      const inputElements = formElement.querySelectorAll('input, textarea')
      const directInputData: any = {}
      inputElements.forEach((input: any) => {
        if (input.name) {
          directInputData[input.name] = input.value
        }
      })
      
      const currentFormData = {
        fullName: formDataObj.get('fullName') as string || directInputData.fullName || '',
        idNumber: formDataObj.get('idNumber') as string || directInputData.idNumber || '',
        emergencyContact: formDataObj.get('emergencyContact') as string || directInputData.emergencyContact || '',
        visitStartDate: formDataObj.get('visitStartDate') as string || directInputData.visitStartDate || '',
        visitEndDate: formDataObj.get('visitEndDate') as string || directInputData.visitEndDate || '',
        destination: formDataObj.get('destination') as string || directInputData.destination || ''
      }
      
      console.log('Current form data from form element:', currentFormData)
      console.log('Direct input data:', directInputData)
      console.log('React state form data:', formData)
      
      // Use the current form data from the form element
      const formDataToUse = currentFormData
      
      // Debug: Log form data
      console.log('Form data to use:', formDataToUse)
      console.log('Form data type:', typeof formDataToUse)
      console.log('Form data keys:', Object.keys(formDataToUse))
      console.log('Form data values:', Object.values(formDataToUse))
      console.log('Date fields:', {
        visitStartDate: formDataToUse.visitStartDate,
        visitEndDate: formDataToUse.visitEndDate,
        startDateType: typeof formDataToUse.visitStartDate,
        endDateType: typeof formDataToUse.visitEndDate
      })
      
      // Validate required fields with better error handling
      // First try to use the form data, fallback to React state if needed
      let validationResults: Record<string, { valid: boolean; value: string }>
      let formDataToValidate: DigitalIDForm
      
      if (Object.values(formDataToUse).some(val => val && val.trim())) {
        // Form data has some values, use it
        formDataToValidate = formDataToUse
        validationResults = {
          fullName: { valid: !!formDataToUse.fullName?.trim(), value: formDataToUse.fullName },
          idNumber: { valid: !!formDataToUse.idNumber?.trim(), value: formDataToUse.idNumber },
          emergencyContact: { valid: !!formDataToUse.emergencyContact?.trim(), value: formDataToUse.emergencyContact },
          visitStartDate: { valid: !!formDataToUse.visitStartDate, value: formDataToUse.visitStartDate },
          visitEndDate: { valid: !!formDataToUse.visitEndDate, value: formDataToUse.visitEndDate },
          destination: { valid: !!formDataToUse.destination?.trim(), value: formDataToUse.destination }
        }
      } else {
        // Fallback to React state
        console.log('Form data empty, using React state for validation')
        formDataToValidate = formData
        validationResults = {
          fullName: { valid: !!formData.fullName?.trim(), value: formData.fullName },
          idNumber: { valid: !!formData.idNumber?.trim(), value: formData.idNumber },
          emergencyContact: { valid: !!formData.emergencyContact?.trim(), value: formData.emergencyContact },
          visitStartDate: { valid: !!formData.visitStartDate, value: formData.visitStartDate },
          visitEndDate: { valid: !!formData.visitEndDate, value: formData.visitEndDate },
          destination: { valid: !!formData.destination?.trim(), value: formData.destination }
        }
      }
      
      const missingFields = Object.entries(validationResults)
        .filter(([key, result]) => !(result as { valid: boolean; value: string }).valid)
        .map(([key]) => key)
      
      if (missingFields.length > 0) {
        console.log('Missing or empty fields:', missingFields)
        console.log('Validation results:', validationResults)
        console.log('Form data being validated:', formDataToValidate)
        
        const fieldLabels = {
          fullName: 'Full Name',
          idNumber: 'Passport/Aadhaar Number',
          emergencyContact: 'Emergency Contact',
          visitStartDate: 'Visit Start Date',
          visitEndDate: 'Visit End Date',
          destination: 'Destination/Trip Plan'
        }
        
        const missingFieldLabels = missingFields.map(field => fieldLabels[field as keyof typeof fieldLabels])
        const errorMessage = `Please fill in all required fields:\n\n${missingFieldLabels.join('\n')}\n\nCurrent values:\n${missingFields.map(field => `${fieldLabels[field as keyof typeof fieldLabels]}: "${validationResults[field as keyof typeof validationResults].value || 'empty'}"`).join('\n')}`
        
        alert(errorMessage)
        setIsSubmitting(false)
        return
      }

            // Validate dates
      const startDate = new Date(formDataToUse.visitStartDate)
      const endDate = new Date(formDataToUse.visitEndDate)
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        alert('Please enter valid dates.')
        setIsSubmitting(false)
        return
      }

      if (endDate <= startDate) {
        alert('End date must be after start date.')
        setIsSubmitting(false)
        return
      }

      if (endDate <= new Date()) {
        alert('End date must be in the future.')
        setIsSubmitting(false)
        return
      }

      // Generate ID hash and metadata
      const idHash = generateIDHash(formDataToUse)
      const expiryTimestamp = endDate.getTime()
      
      // Store form data locally (in production, use IPFS/Arweave)
      const digitalID = {
        id: idHash,
        fullName: formDataToUse.fullName,
        idNumber: formDataToUse.idNumber,
        emergencyContact: formDataToUse.emergencyContact,
        visitStartDate: formDataToUse.visitStartDate,
        visitEndDate: formDataToUse.visitEndDate,
        destination: formDataToUse.destination,
        createdAt: new Date().toISOString(),
        expiryTimestamp,
        isActive: true,
        transactionHash: '' // Will be set after transaction
      }
      
             // Save to localStorage for now
       console.log('Saving digital ID to localStorage:', digitalID)
       const existingIDs = JSON.parse(localStorage.getItem('digitalIDs') || '[]')
       existingIDs.push(digitalID)
       localStorage.setItem('digitalIDs', JSON.stringify(existingIDs))
       console.log('Updated localStorage:', existingIDs)

      // Create Solana transaction
      const transaction = new Transaction()
      
      // Add a memo instruction with ID hash and expiry
      const memoData = `DIGITAL_ID:${idHash}:${expiryTimestamp}`
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'), // Memo program
        data: Buffer.from(memoData, 'utf8')
      })
      
      transaction.add(memoInstruction)
      
      // Add a small transfer to make it a valid transaction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: publicKey, // Self transfer
        lamports: 1000 // 0.000001 SOL
      })
      
      transaction.add(transferInstruction)

      // Send transaction
      const signature = await sendTransaction(transaction, connection)
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed')
      
      setTransactionHash(signature)
      
      // Generate QR code data
      const qrData = {
        name: formDataToUse.fullName,
        idNumber: formDataToUse.idNumber,
        validUntil: formDataToUse.visitEndDate,
        txHash: signature,
        id: idHash
      }
      
      setGeneratedQR(JSON.stringify(qrData))
      setShowSuccess(true)
      
             // Update the stored digital ID with transaction hash
       digitalID.transactionHash = signature
       
       // Update localStorage with the transaction hash
       const updatedIDs = JSON.parse(localStorage.getItem('digitalIDs') || '[]')
       const idIndex = updatedIDs.findIndex((id: any) => id.id === idHash)
       if (idIndex !== -1) {
         updatedIDs[idIndex] = digitalID
         localStorage.setItem('digitalIDs', JSON.stringify(updatedIDs))
       }
       
       // Notify parent component
       onSuccess(digitalID)
      
    } catch (error) {
      console.error('Error creating Digital ID:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }, [connected, publicKey, sendTransaction, connection, onSuccess])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(generatedQR)
    alert('ID data copied to clipboard!')
  }, [generatedQR])

  const resetAndClose = useCallback(() => {
    console.log('Resetting form and closing...')
    // Reset all form state
    setFormData({
      fullName: '',
      idNumber: '',
      emergencyContact: '',
      visitStartDate: '',
      visitEndDate: '',
      destination: ''
    })
    setShowSuccess(false)
    setTransactionHash('')
    setGeneratedQR('')
    setIsSubmitting(false)
    onClose()
  }, [onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-strong rounded-2xl border border-cyan-500/20"
          >
            {!showSuccess ? (
              // Form View
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold gradient-text">Create Digital ID</h2>
                  <button
                    onClick={onClose}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Form validation summary */}
                  <div className="glass rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white/80">Form Status:</span>
                      <span className={`text-sm font-semibold ${
                        isFormValid() ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {isFormValid() ? '✓ Ready to Submit' : '⚠ Incomplete'}
                      </span>
                    </div>
                    <div className="text-xs text-white/60">
                      {isFormValid() 
                        ? 'All required fields are filled. You can now create your Digital ID.'
                        : 'Please fill in all required fields marked with * to continue.'
                      }
                    </div>
                    {/* Debug button for troubleshooting */}
                    <button
                      type="button"
                      onClick={() => {
                        console.log('=== FORM DEBUG INFO ===')
                        console.log('Form data:', formData)
                        console.log('Form valid:', isFormValid())
                        console.log('Validation results:', validateForm())
                        console.log('=======================')
                      }}
                      className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Debug Form (Check Console)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Test form validation
                        const testData = {
                          fullName: 'Test User',
                          idNumber: 'TEST123456',
                          emergencyContact: '1234567890',
                          visitStartDate: '2024-12-20',
                          visitEndDate: '2024-12-25',
                          destination: 'Test destination with enough characters to meet minimum length requirement'
                        }
                        setFormData(testData)
                        console.log('Test data set:', testData)
                        console.log('Form should now be valid:', isFormValid())
                        
                        // Force a re-render to update validation status
                        setTimeout(() => {
                          console.log('After setting test data - Form valid:', isFormValid())
                          console.log('Current form data:', formData)
                        }, 100)
                      }}
                      className="mt-2 ml-2 text-xs text-green-400 hover:text-green-300 underline"
                    >
                      Test with Sample Data
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Manually validate form
                        const validation = validateForm()
                        const isValid = isFormValid()
                        console.log('Manual validation triggered')
                        console.log('Validation results:', validation)
                        console.log('Form is valid:', isValid)
                        
                        if (!isValid) {
                          const missingFields = Object.entries(validation)
                            .filter(([key, result]) => !result.valid)
                            .map(([key]) => key)
                          console.log('Missing fields:', missingFields)
                        }
                      }}
                      className="mt-2 ml-2 text-xs text-yellow-400 hover:text-yellow-300 underline"
                    >
                      Validate Form
                    </button>
                    
                                         {/* Test DOM form data button */}
                     <button
                       type="button"
                       onClick={() => {
                         const formElement = document.querySelector('form') as HTMLFormElement
                         if (formElement) {
                           const formDataObj = new FormData(formElement)
                           const currentFormData = {
                             fullName: formDataObj.get('fullName') as string || '',
                             idNumber: formDataObj.get('idNumber') as string || '',
                             emergencyContact: formDataObj.get('emergencyContact') as string || '',
                             visitStartDate: formDataObj.get('visitStartDate') as string || '',
                             visitEndDate: formDataObj.get('visitEndDate') as string || '',
                             destination: formDataObj.get('destination') as string || ''
                           }
                           
                           // Also get direct input values
                           const inputs = formElement.querySelectorAll('input, textarea')
                           const directValues: any = {}
                           inputs.forEach((input: any) => {
                             if (input.name) {
                               directValues[input.name] = input.value
                             }
                           })
                           
                           console.log('=== DOM FORM DATA TEST ===')
                           console.log('Form data from FormData:', currentFormData)
                           console.log('Direct input values:', directValues)
                           console.log('React state form data:', formData)
                           console.log('FormData vs Direct values:', JSON.stringify(currentFormData) === JSON.stringify(directValues))
                           console.log('FormData vs React state:', JSON.stringify(currentFormData) === JSON.stringify(formData))
                           console.log('================================')
                           
                           // Also test the actual form submission logic
                           console.log('=== TESTING FORM SUBMISSION LOGIC ===')
                           console.log('Form element:', formElement)
                           console.log('Form inputs:', inputs)
                           console.log('================================')
                         }
                       }}
                       className="mt-2 ml-2 text-xs text-purple-400 hover:text-purple-300 underline"
                     >
                       Test DOM Form Data
                     </button>
                    
                    {/* Submit button status debug */}
                    <div className="mt-2 p-2 bg-black/20 rounded text-xs">
                      <div className="font-semibold mb-1">Submit Button Status:</div>
                      <div>Wallet Connected: <span className={connected ? 'text-green-400' : 'text-red-400'}>{connected ? '✓ Yes' : '✗ No'}</span></div>
                      <div>Form Valid: <span className={isFormValid() ? 'text-green-400' : 'text-red-400'}>{isFormValid() ? '✓ Yes' : '✗ No'}</span></div>
                      <div>Is Submitting: <span className={isSubmitting ? 'text-yellow-400' : 'text-green-400'}>{isSubmitting ? '✓ Yes' : '✗ No'}</span></div>
                      <div>Button Disabled: <span className={(!connected || isSubmitting || !isFormValid()) ? 'text-red-400' : 'text-green-400'}>
                        {(!connected || isSubmitting || !isFormValid()) ? '✓ Yes' : '✗ No'}
                      </span></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        minLength={2}
                        maxLength={100}
                        className={`w-full px-4 py-3 glass rounded-xl border transition-colors focus:outline-none ${
                          getFieldValidationStatus('fullName') === 'valid' 
                            ? 'border-green-500/50 focus:border-green-500/70' 
                            : 'border-white/10 focus:border-cyan-500/50'
                        } text-white placeholder-white/50`}
                        placeholder="Enter your full name"
                      />
                      {getFieldValidationStatus('fullName') === 'valid' && (
                        <div className="text-green-400 text-xs mt-1 flex items-center gap-1">
                          <span>✓</span> Valid
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Passport / Aadhaar Number *
                      </label>
                      <input
                        type="text"
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleInputChange}
                        required
                        minLength={5}
                        maxLength={50}
                        className={`w-full px-4 py-3 glass rounded-xl border transition-colors focus:outline-none ${
                          getFieldValidationStatus('idNumber') === 'valid' 
                            ? 'border-green-500/50 focus:border-green-500/70' 
                            : 'border-white/10 focus:border-cyan-500/50'
                        } text-white placeholder-white/50`}
                        placeholder="Enter ID number"
                      />
                      {getFieldValidationStatus('idNumber') === 'valid' && (
                        <div className="text-green-400 text-xs mt-1 flex items-center gap-1">
                          <span>✓</span> Valid
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Emergency Contact *
                    </label>
                    <input
                      type="tel"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      required
                      pattern="[0-9+\-\s()]{10,20}"
                      minLength={10}
                      maxLength={20}
                      className={`w-full px-4 py-3 glass rounded-xl border transition-colors focus:outline-none ${
                        getFieldValidationStatus('emergencyContact') === 'valid' 
                          ? 'border-green-500/50 focus:border-green-500/70' 
                          : 'border-white/10 focus:border-cyan-500/50'
                      } text-white placeholder-white/50`}
                      placeholder="Emergency contact number"
                    />
                    {getFieldValidationStatus('emergencyContact') === 'valid' && (
                      <div className="text-green-400 text-xs mt-1 flex items-center gap-1">
                        <span>✓</span> Valid
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Visit Start Date *
                      </label>
                      <input
                        type="date"
                        name="visitStartDate"
                        value={formData.visitStartDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]} // Today or later
                        required
                        className={`w-full px-4 py-3 glass rounded-xl border transition-colors focus:outline-none ${
                          getFieldValidationStatus('visitStartDate') === 'valid' 
                            ? 'border-green-500/50 focus:border-green-500/70' 
                            : 'border-white/10 focus:border-cyan-500/50'
                        } text-white`}
                      />
                      {getFieldValidationStatus('visitStartDate') === 'valid' && (
                        <div className="text-green-400 text-xs mt-1 flex items-center gap-1">
                          <span>✓</span> Valid
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Visit End Date *
                      </label>
                      <input
                        type="date"
                        name="visitEndDate"
                        value={formData.visitEndDate}
                        onChange={handleInputChange}
                        min={formData.visitStartDate || new Date().toISOString().split('T')[0]} // Start date or today
                        required
                        className={`w-full px-4 py-3 glass rounded-xl border transition-colors focus:outline-none ${
                          getFieldValidationStatus('visitEndDate') === 'valid' 
                            ? 'border-green-500/50 focus:border-green-500/70' 
                            : 'border-white/10 focus:border-cyan-500/50'
                        } text-white`}
                      />
                      {getFieldValidationStatus('visitEndDate') === 'valid' && (
                        <div className="text-green-400 text-xs mt-1 flex items-center gap-1">
                          <span>✓</span> Valid
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Destination / Trip Plan *
                    </label>
                    <textarea
                      name="destination"
                      value={formData.destination}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      minLength={10}
                      maxLength={500}
                      className={`w-full px-4 py-3 glass rounded-xl border transition-colors focus:outline-none resize-none ${
                        getFieldValidationStatus('destination') === 'valid' 
                          ? 'border-green-500/50 focus:border-green-500/70' 
                          : 'border-white/10 focus:border-cyan-500/50'
                      } text-white placeholder-white/50`}
                      placeholder="Describe your destination and travel plans..."
                    />
                    {getFieldValidationStatus('destination') === 'valid' && (
                      <div className="text-green-400 text-xs mt-1 flex items-center gap-1">
                        <span>✓</span> Valid
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-3 glass rounded-xl border border-white/20 text-white hover:border-white/40 transition-colors"
                    >
                      Cancel
                    </button>
                    
                    {/* Submit button status indicator */}
                    <div className="flex-1">
                      <motion.button
                        type="submit"
                        disabled={!connected || isSubmitting || !isFormValid()}
                        whileHover={{ scale: connected && isFormValid() ? 1.02 : 1 }}
                        whileTap={{ scale: connected && isFormValid() ? 0.98 : 1 }}
                        className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        onClick={() => {
                          console.log('Submit button clicked!')
                          console.log('Button disabled state:', !connected || isSubmitting || !isFormValid())
                          console.log('Wallet connected:', connected)
                          console.log('Is submitting:', isSubmitting)
                          console.log('Form valid:', isFormValid())
                          console.log('Current form data:', formData)
                        }}
                      >
                        {isSubmitting ? 'Creating...' : 'Generate Digital ID'}
                      </motion.button>
                      
                      {/* Status explanation */}
                      {!connected && (
                        <div className="text-red-400 text-xs mt-2 text-center">
                          ⚠️ Wallet not connected
                        </div>
                      )}
                      {connected && !isFormValid() && (
                        <div className="text-yellow-400 text-xs mt-2 text-center">
                          ⚠️ Form incomplete
                        </div>
                      )}
                      {connected && isFormValid() && !isSubmitting && (
                        <div className="text-green-400 text-xs mt-2 text-center">
                          ✓ Ready to submit
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              // Success View
              <div className="p-6 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Digital ID Created Successfully!
                  </h2>
                  <p className="text-white/80">
                    Valid until {new Date(formData.visitEndDate).toLocaleDateString()}
                  </p>
                </div>

                {transactionHash && (
                  <div className="glass rounded-xl p-4 mb-6">
                    <p className="text-sm text-white/80 mb-2">Transaction Hash:</p>
                    <a
                      href={`https://explorer.solana.com/tx/${transactionHash}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 text-sm font-mono break-all underline"
                    >
                      {transactionHash}
                    </a>
                  </div>
                )}

                {generatedQR && (
                  <div className="glass rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Your Digital ID QR Code</h3>
                    <div className="bg-white p-4 rounded-xl inline-block mb-4">
                      <QRCode value={generatedQR} size={200} />
                    </div>
                    <motion.button
                      onClick={copyToClipboard}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg text-white text-sm font-semibold"
                    >
                      Copy ID Data
                    </motion.button>
                  </div>
                )}

                <motion.button
                  onClick={resetAndClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-white font-semibold"
                >
                  Done
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
