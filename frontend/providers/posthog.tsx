"use client"

import { createContext, useContext, useEffect } from "react"
import posthog from "posthog-js"

// Create context for PostHog
const PostHogContext = createContext<typeof posthog | null>(null)

// Provider component
export function PostHogProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Skip PostHog initialization in development
    if (process.env.NODE_ENV === "development") {
      console.log("[PostHog] Skipping initialization in development mode")
      return
    }

    // Only initialize in production with valid API key
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      try {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
          capture_pageview: true,
          persistence: "localStorage",
          autocapture: true,
        })
      } catch (error) {
        console.warn("[PostHog] Failed to initialize:", error)
      }
    }

    return () => {
      if (process.env.NODE_ENV === "production") {
        try {
          posthog.capture("$pageleave")
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  }, [])

  return (
    <PostHogContext.Provider value={posthog}>
      {children}
    </PostHogContext.Provider>
  )
}

// Custom hook to use PostHog
export function usePostHog() {
  const context = useContext(PostHogContext)
  
  // Return a mock PostHog instance in development if context is null
  if (context === null) {
    if (process.env.NODE_ENV === "development") {
      // Create a mock instance that logs to console
      const mockPostHog = {
        ...posthog,
        capture: (event: string, properties?: Record<string, any>) => {
          console.log("[PostHog Development]", event, properties)
        },
        identify: (id: string, properties?: Record<string, any>) => {
          console.log("[PostHog Development] Identify:", id, properties)
        },
        isFeatureEnabled: () => false,
        onFeatureFlags: (callback: () => void) => {
          callback()
          return () => {}
        },
        debug: () => {},
        init: () => {},
      }
      return mockPostHog
    }
    throw new Error("usePostHog must be used within a PostHogProvider")
  }
  
  return context
}
