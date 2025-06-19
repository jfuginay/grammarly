import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from '@/contexts/AuthContext'
import { Auth0Provider } from '@/components/Auth0Provider' // Updated import

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Auth0Provider> {/* Removed props */}
      <AuthProvider>
        <Component {...pageProps} />
        <Toaster />
        <Analytics />
      </AuthProvider>
    </Auth0Provider>
  )
}

export default MyApp