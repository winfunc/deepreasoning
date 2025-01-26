"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { usePostHog } from "../providers/posthog"
import debounce from "lodash/debounce"
import { Settings2, RotateCcw, Save } from "lucide-react"
import { useToast } from "./ui/use-toast"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form"
import { Textarea } from "./ui/textarea"
import { Input } from "./ui/input"
import { useForm } from "react-hook-form"

interface SettingsFormValues {
  model: string
  systemPrompt: string
  deepseekApiToken: string
  anthropicApiToken: string
  deepseekHeaders: { key: string; value: string }[]
  deepseekBody: { key: string; value: string }[]
  anthropicHeaders: { key: string; value: string }[]
  anthropicBody: { key: string; value: string }[]
}

interface SettingsProps {
  onSettingsChange: (settings: { deepseekApiToken: string; anthropicApiToken: string }) => void
}

export function Settings({ onSettingsChange }: SettingsProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const posthog = usePostHog()
  
  const form = useForm<SettingsFormValues>({
    defaultValues: {
      systemPrompt: "You are a helpful AI assistant who excels at reasoning and responds in Markdown format. For code snippets, you wrap them in Markdown codeblocks with it's language specified.",
      deepseekApiToken: "",
      anthropicApiToken: "",
      deepseekHeaders: [],
      deepseekBody: [],
      anthropicHeaders: [{ key: "anthropic-version", value: "2023-06-01" }],
      anthropicBody: []
    }
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('deepclaude-settings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      form.reset(settings)
      onSettingsChange({
        deepseekApiToken: settings.deepseekApiToken,
        anthropicApiToken: settings.anthropicApiToken
      })
    }
  }, [form, onSettingsChange])

  // Debounced save function
  const debouncedSave = useCallback((data: SettingsFormValues) => {
    localStorage.setItem('deepclaude-settings', JSON.stringify(data))
    onSettingsChange({
      deepseekApiToken: data.deepseekApiToken,
      anthropicApiToken: data.anthropicApiToken
    })

    // Track settings update
    posthog.capture('settings_updated', {
      model: data.model,
      has_deepseek_token: !!data.deepseekApiToken,
      has_anthropic_token: !!data.anthropicApiToken,
      has_system_prompt: !!data.systemPrompt,
      deepseek_headers_count: data.deepseekHeaders.length,
      deepseek_body_count: data.deepseekBody.length,
      anthropic_headers_count: data.anthropicHeaders.length,
      anthropic_body_count: data.anthropicBody.length,
      timestamp: new Date().toISOString()
    })

    toast({
      variant: "success",
      description: "Settings saved to local storage",
      duration: 2000,
    })
  }, [onSettingsChange, toast, posthog])

  const debouncedSaveCallback = useMemo(
    () => debounce(debouncedSave, 1000),
    [debouncedSave]
  )

  // Auto-save on form changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      const data = form.getValues()
      debouncedSaveCallback(data)
    })
    return () => {
      subscription.unsubscribe()
      debouncedSaveCallback.cancel()
    }
  }, [form, debouncedSaveCallback])

  const handleReset = () => {
    form.reset({
      systemPrompt: "You are a helpful AI assistant who excels at reasoning and responds in Markdown format. For code snippets, you wrap them in Markdown codeblocks with it's language specified.",
      deepseekApiToken: "",
      anthropicApiToken: "",
      deepseekHeaders: [],
      deepseekBody: [],
      anthropicHeaders: [{ key: "anthropic-version", value: "2023-06-01" }],
      anthropicBody: []
    })
    localStorage.removeItem('deepclaude-settings')
    onSettingsChange({
      deepseekApiToken: "",
      anthropicApiToken: ""
    })

    // Track settings reset
    posthog.capture('settings_reset', {
      timestamp: new Date().toISOString()
    })

    toast({
      description: "Settings reset to defaults",
      duration: 2000,
    })
  }

  const KeyValuePairFields = ({ 
    name,
    label 
  }: { 
    name: "deepseekHeaders" | "deepseekBody" | "anthropicHeaders" | "anthropicBody"
    label: string 
  }) => {
    const pairs = form.watch(name)

    return (
      <FormField
        control={form.control}
        name={name}
        render={() => (
          <FormItem className="space-y-2">
            <FormLabel>{label}</FormLabel>
            <div className="space-y-2">
              {pairs.map((_, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Key"
                    {...form.register(`${name}.${index}.key`)}
                  />
                  <Input
                    placeholder="Value"
                    {...form.register(`${name}.${index}.value`)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newPairs = [...pairs]
                      newPairs.splice(index, 1)
                      form.setValue(name, newPairs)
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.setValue(name, [...pairs, { key: "", value: "" }])
                }}
              >
                Add {label}
              </Button>
            </div>
          </FormItem>
        )}
      />
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="absolute top-4 right-4 z-[100]">
          <Button 
            variant="outline" 
            className="cursor-pointer bg-muted/30"
          >
            <Settings2 className="h-4 w-4" />
            Configure
          </Button>
          {!form.getValues("deepseekApiToken") || !form.getValues("anthropicApiToken") ? (
            <div className="absolute top-[48px] right-0 bg-muted text-muted-foreground px-4 py-2 rounded-lg text-sm border border-border before:content-[''] before:absolute before:top-[-6px] before:right-6 before:w-3 before:h-3 before:bg-muted before:border-l before:border-t before:border-border before:rotate-45">
              Configure API tokens to start
            </div>
          ) : null}
        </div>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto z-[150]">
        <SheetHeader className="mb-6">
          <div className="h-8" /> {/* Spacer for close button */}
          <div className="flex flex-row items-center justify-between mt-2">
            <SheetTitle>Settings</SheetTitle>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="bg-muted/30 text-blue-500 hover:text-blue-500/80"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const data = form.getValues()
                  localStorage.setItem('deepclaude-settings', JSON.stringify(data))
                  onSettingsChange({
                    deepseekApiToken: data.deepseekApiToken,
                    anthropicApiToken: data.anthropicApiToken
                  })
                  toast({
                    variant: "success",
                    description: "Settings saved to local storage",
                    duration: 2000,
                  })
                }}
                className="bg-muted/30 text-green-500 hover:text-green-500/80"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </SheetHeader>
        <Form {...form}>
          <form className="space-y-6 pt-6">

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="deepseekApiToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DeepSeek API Token</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter DeepSeek API token..."
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="anthropicApiToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anthropic API Token</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter Anthropic API token..."
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter system prompt..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">DeepSeek Configuration</h4>
                <KeyValuePairFields name="deepseekHeaders" label="Headers" />
                <KeyValuePairFields name="deepseekBody" label="Body" />
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Anthropic Configuration</h4>
                <KeyValuePairFields name="anthropicHeaders" label="Headers" />
                <KeyValuePairFields name="anthropicBody" label="Body" />
              </div>
            </div>

          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
