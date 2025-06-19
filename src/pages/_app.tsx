import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from '@vercel/analytics/react'
import { Auth0Provider } from '@auth0/auth0-react'
import { AuthProvider } from '@/contexts/AuthContext'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN || ''}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || ''}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
        audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
        scope: 'openid profile email https://www.googleapis.com/auth/drive.file',
      }}
    >
      <AuthProvider>
        <Component {...pageProps} />
        <Toaster />
        <Analytics />
      </AuthProvider>
    </Auth0Provider>
  )
}

export default MyApp