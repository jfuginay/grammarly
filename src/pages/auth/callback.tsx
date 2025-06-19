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
          // After successful authentication, ensure user exists in database
          try {
            const { data: { user } } = await supabase.auth.getUser()
            
            if (user) {
              // Create or update user in database
              const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  id: user.id,
                  email: user.email,
                }),
              })

              if (!response.ok) {
                console.error('Failed to create/update user in database')
                // Continue to dashboard anyway since auth succeeded
              }
            }
          } catch (dbError) {
            console.error('Error ensuring user exists in database:', dbError)
            // Continue to dashboard anyway since auth succeeded
          }
          
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