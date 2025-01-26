import { useEffect, useState } from "react"
import posthog from "posthog-js"

// Define your feature flag types
export type FeatureFlags = {
  "new-model-selector": boolean
  "enhanced-chat-ui": boolean
  "beta-features": boolean
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Partial<FeatureFlags>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only run if PostHog is initialized
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      const handleFlagChange = () => {
        const activeFlags: Partial<FeatureFlags> = {
          "new-model-selector": posthog.isFeatureEnabled("new-model-selector"),
          "enhanced-chat-ui": posthog.isFeatureEnabled("enhanced-chat-ui"),
          "beta-features": posthog.isFeatureEnabled("beta-features"),
        }
        setFlags(activeFlags)
        setLoading(false)
      }

      // Initial load
      handleFlagChange()

      // Listen for changes
      const unsubscribe = posthog.onFeatureFlags(handleFlagChange)

      return () => {
        unsubscribe()
      }
    } else {
      setLoading(false)
    }
  }, [])

  return {
    flags,
    loading,
    isEnabled: (flag: keyof FeatureFlags) => flags[flag] ?? false,
  }
}
