"use client"

import Image from "next/image"
import Link from "next/link"
import { usePostHog } from "../providers/posthog"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible"
import { ArrowRight, Zap, Lock, Settings2, Code2, Sparkles, Github, Megaphone, ChevronDown } from "lucide-react"

export default function LandingPage() {
  const posthog = usePostHog()
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-grow-0 relative min-h-screen flex flex-col items-center justify-center px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-pattern-combined" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
        
        {/* Announcement Banner */}
        <div className="relative mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur border border-primary/10 hover:border-primary/20 transition-colors whitespace-nowrap overflow-hidden">
            <div className="absolute inset-0 shimmer" />
            <Megaphone className="h-3.5 w-3.5 relative z-10" />
            <span className="relative z-10">
              We solved AI Code Comprehension, launching the SDK and Platform soon. Follow{' '}
              <a 
                href="https://x.com/getasterisk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors font-semibold"
              >
                Asterisk
              </a>{' '}
              on{' '}
              <a 
                href="https://x.com/getasterisk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors inline-flex items-center font-semibold"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 relative top-[0.1em]"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>{' '}
              to catch the launch!
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="relative space-y-8 text-center max-w-[600px]">
          <div className="animate-float">
            <Image
              src="/deepclaude.png"
              alt="DeepClaude Logo"
              width={200}
              height={200}
              className="mx-auto"
              priority
            />
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
            DeepClaude
          </h1>
          
          <p className="max-w-[600px] text-lg sm:text-xl text-muted-foreground">
          Harness the power of DeepSeek R1's reasoning and Claude's creativity and code generation capabilities with a unified API and chat interface.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/chat" onClick={() => {
              posthog.capture('cta_click', {
                location: 'hero',
                target: 'chat',
                timestamp: new Date().toISOString()
              })
            }}>
              <Button size="lg" className="group">
                Try DeepClaude Chat
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/docs" onClick={() => {
              posthog.capture('cta_click', {
                location: 'hero',
                target: 'docs',
                timestamp: new Date().toISOString()
              })
            }}>
              <Button variant="outline" size="lg" className="group">
                <Code2 className="mr-2 h-4 w-4" />
                API Docs
              </Button>
            </Link>
            <a 
              href="https://github.com/getasterisk/deepclaude" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => {
                posthog.capture('cta_click', {
                  location: 'hero',
                  target: 'github',
                  timestamp: new Date().toISOString()
                })
              }}
            >
              <Button variant="outline" size="lg" className="group">
                <Github className="mr-2 h-4 w-4" />
                Star on GitHub
              </Button>
            </a>
          </div>
          
          <div className="flex items-center justify-center text-sm text-muted-foreground mt-2">
            <span className="flex items-center mr-1">A free and open-source gift from</span>
            <a 
              href="https://asterisk.so/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity flex items-center"
            >
              <Image
                src="/asterisk.png"
                alt="Asterisk Logo"
                width={150}
                height={50}
                className="inline-block"
                quality={100}
              />
            </a>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <button 
          onClick={() => {
            document.getElementById('features')?.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            })
          }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer"
        >
          <ArrowRight className="h-6 w-6 rotate-90 text-muted-foreground" />
        </button>
      </section>

      <main className="flex-grow">
        {/* Features Grid */}
        <section id="features" className="relative py-20 px-4 bg-gradient-to-b from-background to-background/95">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-pattern-combined opacity-50" />
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              Features
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Performance */}
              <Card 
                className="p-6 bg-card/50 backdrop-blur border-muted hover:border-primary/50 transition-colors"
                onClick={() => {
                  posthog.capture('feature_view', {
                    feature: 'zero_latency',
                    timestamp: new Date().toISOString()
                  })
                }}
              >
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Zero Latency</h3>
                  <p className="text-muted-foreground">
                    Instant responses of R1s CoT followed with Claude's response in a single stream powered by a high-performance streaming API written in Rust.
                  </p>
                </div>
              </Card>

              {/* Security */}
              <Card className="p-6 bg-card/50 backdrop-blur border-muted hover:border-primary/50 transition-colors">
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Private & Secure</h3>
                  <p className="text-muted-foreground">
                    Your data stays private with end-to-end security and local API key management.
                  </p>
                </div>
              </Card>

              {/* Configuration */}
              <Card className="p-6 bg-card/50 backdrop-blur border-muted hover:border-primary/50 transition-colors">
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Settings2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Highly Configurable</h3>
                  <p className="text-muted-foreground">
                    Customize every aspect of the API and interface to match your needs.
                  </p>
                </div>
              </Card>

              {/* Open Source */}
              <Card className="p-6 bg-card/50 backdrop-blur border-muted hover:border-primary/50 transition-colors">
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Code2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Open Source</h3>
                  <p className="text-muted-foreground">
                    Free and open-source codebase. Contribute, modify, and deploy as you wish.
                  </p>
                </div>
              </Card>

              {/* AI Integration */}
              <Card className="p-6 bg-card/50 backdrop-blur border-muted hover:border-primary/50 transition-colors">
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Dual AI Power</h3>
                  <p className="text-muted-foreground">
                    Combine DeepSeek R1's reasoning with Claude's creativity and code generation.
                  </p>
                </div>
              </Card>

              {/* Managed BYOK API */}
              <Card className="p-6 bg-card/50 backdrop-blur border-muted hover:border-primary/50 transition-colors">
                <div className="space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg 
                      className="h-6 w-6 text-primary"
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold">Managed BYOK API</h3>
                  <p className="text-muted-foreground">
                    Use your own API keys with our managed infrastructure for complete control and flexibility.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 relative bg-background">
          <div className="relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-pattern-combined opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-12">
              Frequently Asked Questions
            </h2>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Why R1 + Claude? */}
              <Card className="p-6 bg-card/50 backdrop-blur border-muted hover:border-primary/50 transition-colors">
              <Collapsible>
                <CollapsibleTrigger 
                  className="w-full"
                  onClick={() => {
                    posthog.capture('faq_interaction', {
                      question: 'why_r1_claude',
                      timestamp: new Date().toISOString()
                    })
                  }}
                >
                  <div className="flex items-center justify-between text-left">
                    <h3 className="text-xl font-semibold">Why R1 + Claude?</h3>
                    <ChevronDown className="h-5 w-5 transform transition-transform duration-200" />
                  </div>
                </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 text-left text-muted-foreground">
                    <p className="mb-4">
                      DeepSeek R1's CoT trace demonstrates deep reasoning to the point of an LLM experiencing "metacognition" - correcting itself, thinking about edge cases, and so on. It's a quasi MCTS in natural language.
                    </p>
                    <p className="mb-4">
                      But R1 lacks at code generation, creativity, and conversational skills. The model that excels at all 3 is the Claude 3.5 Sonnet New from Anthropic. So how about we combine both of them? And take the best of both worlds? Enter DeepClaude!
                    </p>
                    <p>
                      With DeepClaude, you get a fast streaming R1 CoT + Claude Models in a single API call with your own API keys.
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* Is it free? */}
              <Card className="p-6 bg-card/50 backdrop-blur border-muted hover:border-primary/50 transition-colors">
                <Collapsible>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between text-left">
                      <h3 className="text-xl font-semibold">The managed API is free?</h3>
                      <ChevronDown className="h-5 w-5 transform transition-transform duration-200" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 text-left text-muted-foreground">
                    <p className="mb-4">
                      Yes, 100% free and you use your own keys. The API wraps both DeepSeek and Anthropic streaming API into one. And you get some niceties like calculating the combined usage and price for you to use. We keep no logs and it's completely open-source - you can self-host it, modify it, redistribute it, whatever.
                    </p>
                    <p>
                      Feel free to use this at scale, we use this in production at Asterisk serving millions of tokens in parallel daily and it hasn't failed us "yet". And like all nice things, just don't abuse it.
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 relative bg-background">
          <div className="relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-pattern-combined opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">
              Start reading some AI internal monologue?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              No sign up. No credit card. No data stored.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/chat" onClick={() => {
                posthog.capture('cta_click', {
                  location: 'footer',
                  target: 'chat',
                  timestamp: new Date().toISOString()
                })
              }}>
                <Button size="lg" className="group">
                  Try DeepClaude Chat
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/docs" onClick={() => {
                posthog.capture('cta_click', {
                  location: 'footer',
                  target: 'docs',
                  timestamp: new Date().toISOString()
                })
              }}>
                <Button variant="outline" size="lg" className="group">
                  <Code2 className="mr-2 h-4 w-4" />
                  API Docs
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-8 px-4 border-t border-border/40 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <span className="flex items-center mr-1">A "for fun" project by</span>
            <a 
              href="https://asterisk.so/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity flex items-center"
            >
              <Image
                src="/asterisk.png"
                alt="Asterisk Logo"
                width={150}
                height={50}
                className="inline-block"
                style={{ width: '150px', height: 'auto' }}
                quality={100}
              />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
