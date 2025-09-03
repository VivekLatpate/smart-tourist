import Head from 'next/head'
import { useState, useCallback, useMemo, useEffect } from 'react'
import Hero from '@/components/Hero'
import SolutionsGrid, { type Solution } from '@/components/SolutionsGrid'
import Footer from '@/components/Footer'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import FloatingParticles from '@/components/FloatingParticles'
import DigitalIDPage from '@/components/digital-ids/DigitalIDPage'
import VerifyIDPage from '@/components/digital-ids/VerifyIDPage'
import SafeBookingEscrow from '@/components/digital-ids/SafeBookingEscrow'
import SolanaEmergencyAlertDashboard from '@/components/digital-ids/SolanaEmergencyAlertDashboard'
import PlacesNearMe from '@/components/digital-ids/PlacesNearMe'
import TemporaryAccessNFT from '@/components/digital-ids/TemporaryAccessNFT'
import WalletContextProvider from '@/components/digital-ids/WalletProvider'
import HotelBookingPage from '@/components/hotel-booking/HotelBookingPage'

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<'home' | 'digital-ids' | 'verify-id' | 'safe-booking' | 'emergency-alerts' | 'places-near-me' | 'access-nft' | 'book-hotels'>('home')
  
  // Initialize Vapi AI Voice Assistant Widget
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js';
    script.async = true;
    script.type = 'text/javascript';
    document.head.appendChild(script);

    script.onload = () => {
      // Create the vapi-widget element after script loads
      const widget = document.createElement('vapi-widget');
      widget.setAttribute('public-key', 'e4ba7b6e-6e0d-4a3c-8d20-5a51123d8463');
      widget.setAttribute('assistant-id', '8bcaf20e-6c00-490c-8285-b43909879b34');
      widget.setAttribute('mode', 'voice');
      widget.setAttribute('theme', 'dark');
      widget.setAttribute('base-bg-color', '#000000');
      widget.setAttribute('accent-color', '#14B8A6');
      widget.setAttribute('cta-button-color', '#000000');
      widget.setAttribute('cta-button-text-color', '#ffffff');
      widget.setAttribute('border-radius', 'large');
      widget.setAttribute('size', 'full');
      widget.setAttribute('position', 'bottom-right');
      widget.setAttribute('title', 'TALK WITH AI');
      widget.setAttribute('start-button-text', 'Start');
      widget.setAttribute('end-button-text', 'End Call');
      widget.setAttribute('chat-first-message', 'Hey, How can I help you today?');
      widget.setAttribute('chat-placeholder', 'Type your message...');
      widget.setAttribute('voice-show-transcript', 'true');
      widget.setAttribute('consent-required', 'true');
      widget.setAttribute('consent-title', 'Terms and conditions');
      widget.setAttribute('consent-content', 'By clicking "Agree," and each time I interact with this AI agent, I consent to the recording, storage, and sharing of my communications with third-party service providers, and as otherwise described in our Terms of Service.');
      widget.setAttribute('consent-storage-key', 'vapi_widget_consent');
      
      document.body.appendChild(widget);
    };

    return () => {
      // Cleanup on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      const existingWidget = document.querySelector('vapi-widget');
      if (existingWidget && existingWidget.parentNode) {
        existingWidget.parentNode.removeChild(existingWidget);
      }
    };
  }, []);
  
  // Memoize handlers to prevent unnecessary re-renders
  const notify = useCallback((message: string) => () => {
    // eslint-disable-next-line no-alert
    alert(message)
  }, [])

  const handleDigitalIDClick = useCallback(() => {
    setCurrentPage('digital-ids')
  }, [])

  const handleVerifyIDClick = useCallback(() => {
    setCurrentPage('verify-id')
  }, [])

  const handleSafeBookingClick = useCallback(() => {
    setCurrentPage('safe-booking')
  }, [])

  const handleEmergencyAlertsClick = useCallback(() => {
    setCurrentPage('emergency-alerts')
  }, [])

  const handlePlacesNearMeClick = useCallback(() => {
    setCurrentPage('places-near-me')
  }, [])

  const handleAccessNFTClick = useCallback(() => {
    setCurrentPage('access-nft')
  }, [])

  const handleBookHotelsClick = useCallback(() => {
    setCurrentPage('book-hotels')
  }, [])

  const handleNavigateHome = useCallback(() => {
    setCurrentPage('home')
  }, [])

  const solutions = useMemo<Solution[]>(() => [
    {
      id: 'digital-ids',
      title: 'Time-limited Digital IDs',
      description: 'Ephemeral IDs to verify tourists without permanent tracking.',
      ctaLabel: 'Create ID',
      ariaLabel: 'Create a time-limited digital ID',
      icon: '🪪',
      onPrimary: handleDigitalIDClick,
      onSecondary: notify('Learn more: Time-limited Digital IDs'),
      imageUrl: 'https://picsum.photos/800/600?random=1',
    },
    {
      id: 'verify-id',
      title: 'Verify Digital ID',
      description: 'Check the validity and status of any Digital ID.',
      ctaLabel: 'Verify ID',
      ariaLabel: 'Verify a digital ID',
      icon: '🔍',
      onPrimary: handleVerifyIDClick,
      onSecondary: notify('Learn more: Verify Digital ID'),
      imageUrl: 'https://picsum.photos/800/600?random=2',
    },
    {
      id: 'safe-booking',
      title: 'Safe Booking Escrow',
      description: 'Secure tour bookings with blockchain escrow and safety verification.',
      ctaLabel: 'Safe Booking',
      ariaLabel: 'Open safe booking escrow',
      icon: '🛡️',
      onPrimary: handleSafeBookingClick,
      onSecondary: notify('Learn more: Safe Booking Escrow'),
      imageUrl: 'https://picsum.photos/800/600?random=3',
    },
    {
      id: 'emergency-alerts',
      title: 'Emergency Alert System',
      description: 'Real-time tourist safety monitoring with panic button and geo-fence alerts.',
      ctaLabel: 'Emergency Alerts',
      ariaLabel: 'Open emergency alert dashboard',
      icon: '🚨',
      onPrimary: handleEmergencyAlertsClick,
      onSecondary: notify('Learn more: Emergency Alert System'),
      imageUrl: 'https://picsum.photos/800/600?random=4',
    },
    {
      id: 'places-near-me',
      title: 'Places Near Me',
      description: 'Discover tourist attractions, historic sites, and points of interest around you with live location tracking.',
      ctaLabel: 'Find Places',
      ariaLabel: 'Open places near me',
      icon: '📍',
      onPrimary: handlePlacesNearMeClick,
      onSecondary: notify('Learn more: Places Near Me'),
      imageUrl: 'https://picsum.photos/800/600?random=5',
    },
    {
      id: 'access-nft',
      title: 'Temporary Access NFTs',
      description: 'Time-limited, soulbound NFTs for secure tourist access to restricted areas, parks, and sites.',
      ctaLabel: 'Access NFTs',
      ariaLabel: 'Open temporary access NFT system',
      icon: '🎫',
      onPrimary: handleAccessNFTClick,
      onSecondary: notify('Learn more: Temporary Access NFTs'),
      imageUrl: 'https://picsum.photos/800/600?random=4',
    },
    {
      id: 'book-hotels',
      title: 'Book Hotels',
      description: 'Blockchain-based hotel booking with escrow payments, verified vendors, and dispute resolution.',
      ctaLabel: 'Book Hotels',
      ariaLabel: 'Open hotel booking platform',
      icon: '🏨',
      onPrimary: handleBookHotelsClick,
      onSecondary: notify('Learn more: Hotel Booking Platform'),
      imageUrl: 'https://picsum.photos/800/600?random=16',
    },
    {
      id: 'privacy-controls',
      title: 'Privacy Controls & Consent',
      description: 'Granular consent, data minimization, transparent sharing.',
      ctaLabel: 'Privacy Settings',
      ariaLabel: 'Open privacy settings',
      icon: '🔐',
      onPrimary: notify('Opening Privacy Settings... (demo)'),
      onSecondary: notify('Learn more: Privacy Controls & Consent'),
      imageUrl: 'https://picsum.photos/800/600?random=7',
    },
    {
      id: 'geo-fencing',
      title: 'AI Geo-Fencing & Alerts',
      description: 'Safety zones with smart alerts based on context.',
      ctaLabel: 'Enable Geo-fence',
      ariaLabel: 'Enable AI geo-fencing',
      icon: '📍',
      onPrimary: notify('AI Geo-fence enabled... (demo)'),
      onSecondary: notify('Learn more: AI Geo-Fencing & Alerts'),
      imageUrl: 'https://picsum.photos/800/600?random=8',
    },
    {
      id: 'instant-sos',
      title: 'Instant SOS & Auto E-FIR',
      description: 'One-tap emergency with automated reporting.',
      ctaLabel: 'Try SOS',
      ariaLabel: 'Trigger SOS demo',
      icon: '🚨',
      onPrimary: notify('SOS triggered and E-FIR drafted... (demo)'),
      onSecondary: notify('Learn more: Instant SOS & Auto E-FIR'),
      imageUrl: 'https://picsum.photos/800/600?random=9',
    },
    {
      id: 'multilingual-ai',
      title: 'Multilingual AI Assistant',
      description: 'Real-time translate and safety guidance.',
      ctaLabel: 'Open Translator',
      ariaLabel: 'Open multilingual AI translator',
      icon: '🗣️',
      onPrimary: notify('Opening Multilingual AI Assistant... (demo)'),
      onSecondary: notify('Learn more: Multilingual AI Assistant'),
      imageUrl: 'https://picsum.photos/800/600?random=10',
    },
    {
      id: 'crowdsourced-reporting',
      title: 'Crowdsourced Reporting (Tokens)',
      description: 'Community safety reports with token rewards.',
      ctaLabel: 'Report Issue',
      ariaLabel: 'Report an issue',
      icon: '🪙',
      onPrimary: notify('Opening report form... (demo)'),
      onSecondary: notify('Learn more: Crowdsourced Reporting (Tokens)'),
      imageUrl: 'https://picsum.photos/800/600?random=11',
    },
    {
      id: 'wearables',
      title: 'Ultra-low-power Wearables',
      description: 'Long-lasting beacons for off-grid safety.',
      ctaLabel: 'Request Wearable',
      ariaLabel: 'Request a wearable device',
      icon: '⌚',
      onPrimary: notify('Requesting demo wearable... (demo)'),
      onSecondary: notify('Learn more: Ultra-low-power Wearables'),
      imageUrl: 'https://picsum.photos/800/600?random=12',
    },
    {
      id: 'safety-circles',
      title: 'Safety Circles (Family / Tour Groups)',
      description: 'Share live status with chosen circles.',
      ctaLabel: 'Create Circle',
      ariaLabel: 'Create a safety circle',
      icon: '🫶',
      onPrimary: notify('Creating safety circle... (demo)'),
      onSecondary: notify('Learn more: Safety Circles'),
      imageUrl: 'https://picsum.photos/800/600?random=13',
    },
    {
      id: 'safety-score',
      title: 'Safety Score & Gamification',
      description: 'Earn points for safe choices.',
      ctaLabel: 'View Score',
      ariaLabel: 'View your safety score',
      icon: '🏅',
      onPrimary: notify('Fetching safety score... (demo)'),
      onSecondary: notify('Learn more: Safety Score & Gamification'),
      imageUrl: 'https://picsum.photos/800/600?random=14',
    },
    {
      id: 'heatmaps',
      title: 'Real-time Heatmaps & Dashboards',
      description: 'Visualize hotspots and trends securely.',
      ctaLabel: 'View Dashboard',
      ariaLabel: 'Open real-time dashboard',
      icon: '🗺️',
      onPrimary: notify('Opening dashboard... (demo)'),
      onSecondary: notify('Learn more: Real-time Heatmaps & Dashboards'),
      imageUrl: 'https://picsum.photos/800/600?random=15',
    },
  ], [handleDigitalIDClick, handleVerifyIDClick, handleSafeBookingClick, handleEmergencyAlertsClick, handlePlacesNearMeClick, handleAccessNFTClick, handleBookHotelsClick])

  return (
    <>
      <Head>
        <title>Smart Tourist Safety — Trusted Safety Platform</title>
        <meta name="description" content="Privacy-first safety tools for tourists, tourism boards, and law enforcement." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Smart Tourist Safety" />
        <meta property="og:description" content="Trustworthy, privacy-first safety tools for travelers and cities." />
        <meta property="og:type" content="website" />
      </Head>

      <div className="min-h-screen relative overflow-hidden">
        {/* Enhanced background with multiple gradient layers */}
        <div key="bg-gradient-1" className="fixed inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950"></div>
        <div key="bg-gradient-2" className="fixed inset-0 bg-gradient-to-tl from-cyan-950/30 via-transparent to-purple-950/30"></div>
        
        {/* Floating particles background */}
        <FloatingParticles key="particles" />
        
        {/* Animated gradient orbs */}
        <div key="gradient-orbs" aria-hidden className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <WalletContextProvider key="wallet-provider">
          <div key="main-content" className="relative z-10 text-white">
            <Sidebar 
              key="sidebar"
              solutions={solutions.map(({ id, title, icon }: Solution) => ({ 
                id, 
                label: shortLabel(title), 
                icon,
                onClick: id === 'digital-ids' ? handleDigitalIDClick : 
                         id === 'verify-id' ? handleVerifyIDClick :
                         id === 'safe-booking' ? handleSafeBookingClick :
                         id === 'emergency-alerts' ? handleEmergencyAlertsClick :
                         id === 'places-near-me' ? handlePlacesNearMeClick :
                         id === 'access-nft' ? handleAccessNFTClick :
                         id === 'book-hotels' ? handleBookHotelsClick : undefined
              }))} 
              currentPage={currentPage}
              onNavigateHome={handleNavigateHome}
            />
            <Header key="header" />
            <main id="top" className="pl-80">
              {currentPage === 'home' ? (
                <div key="home">
                  <Hero onPrimaryCta={notify('Exploring solutions... (demo)')} onSecondaryCta={notify('Jumping to solutions... (demo)')} />
                  <SolutionsGrid solutions={solutions} />
                  <Footer />
                </div>
              ) : currentPage === 'digital-ids' ? (
                <DigitalIDPage key="digital-ids" />
              ) : currentPage === 'verify-id' ? (
                <VerifyIDPage key="verify-id" />
              ) : currentPage === 'safe-booking' ? (
                <SafeBookingEscrow key="safe-booking" />
              ) : currentPage === 'emergency-alerts' ? (
                <SolanaEmergencyAlertDashboard key="emergency-alerts" />
              ) : currentPage === 'places-near-me' ? (
                <PlacesNearMe key="places-near-me" />
              ) : currentPage === 'access-nft' ? (
                <TemporaryAccessNFT key="access-nft" />
              ) : currentPage === 'book-hotels' ? (
                <HotelBookingPage key="book-hotels" />
              ) : null}
            </main>
          </div>
        </WalletContextProvider>
      </div>
    </>
  )
}

function shortLabel(title: string): string {
  const map: Record<string, string> = {
    'Time-limited Digital IDs': 'Digital IDs',
    'Verify Digital ID': 'Verify ID',
    'Safe Booking Escrow': 'Safe Booking',
    'Emergency Alert System': 'Emergency Alerts',
    'Places Near Me': 'Places Near Me',
    'Temporary Access NFTs': 'Access NFTs',
    'Book Hotels': 'Book Hotels',
    'Privacy Controls & Consent': 'Privacy',
    'AI Geo-Fencing & Alerts': 'Geo-fence',
    'Instant SOS & Auto E-FIR': 'SOS',
    'Multilingual AI Assistant': 'Assistant',
    'Crowdsourced Reporting (Tokens)': 'Reporting',
    'Ultra-low-power Wearables': 'Wearables',
    'Safety Circles (Family / Tour Groups)': 'Circles',
    'Safety Score & Gamification': 'Score',
    'Real-time Heatmaps & Dashboards': 'Dashboards',
  }
  return map[title] ?? title
}



