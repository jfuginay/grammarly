import '@/styles/globals.css'
import '@/styles/editor-custom.css'
import type { AppProps } from 'next/app'
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "next-themes"

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Component {...pageProps} />
      <Toaster />
    </ThemeProvider>
  )
}

export default MyApp