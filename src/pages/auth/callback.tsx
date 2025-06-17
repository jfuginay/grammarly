import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { createBrowserClient } from '@supabase/ssr'

const AuthCallback = () => {
  const router = useRouter()

  useEffect(() => {
    const exchangeCodeForSession = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // The router is not always ready on the first render,
      // so we need to wait for it. The auth code is in the URL.
      if (router.isReady) {
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.search
        )

        if (error) {
          console.error('Error exchanging code for session:', error)
          router.replace('/login?error=AuthenticationFailed')
        } else {
          router.replace('/dashboard')
        }
      }
    }

    exchangeCodeForSession()
  }, [router])

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Authenticating...</p>
      </div>
    </div>
  )
}

export default AuthCallback