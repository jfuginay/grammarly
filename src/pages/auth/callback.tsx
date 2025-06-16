import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@/util/supabase/component'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClient()
  const { createUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Starting auth callback handling...')
        
        // First, try to get the current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        console.log('Session data:', sessionData, 'Session error:', sessionError)
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setError(sessionError.message)
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        if (sessionData.session?.user) {
          console.log('User found in session:', sessionData.session.user.id)
          try {
            await createUser(sessionData.session.user)
            console.log('User created/verified, redirecting to dashboard')
            router.push('/dashboard')
          } catch (userError) {
            console.error('Error creating user:', userError)
            // Don't fail the auth flow if user creation fails
            // Just redirect to dashboard anyway
            router.push('/dashboard')
          }
        } else {
          console.log('No session found, redirecting to login')
          router.push('/login')
        }
      } catch (err) {
        console.error('Callback handling error:', err)
        setError('Authentication failed')
        setTimeout(() => router.push('/login'), 3000)
      } finally {
        setIsProcessing(false)
      }
    }

    // Only run if we haven't processed yet and router is ready
    if (router.isReady && isProcessing) {
      handleAuthCallback()
    }
  }, [router, router.isReady, createUser, supabase.auth, isProcessing])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-destructive mb-4 text-2xl">⚠️</div>
          <p className="text-destructive mb-2 font-semibold">Authentication Error</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <p className="text-muted-foreground text-sm mt-2">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
        <p className="mt-2 text-xs text-muted-foreground">This should only take a moment</p>
      </div>
    </div>
  )
}