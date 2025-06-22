'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'
import { Shield, Lock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Image 
                src="/logo_transparent.png" 
                alt="SafetyAdvisor Logo" 
                width={80} 
                height={80}
                className="rounded-xl"
              />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Shield className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              SafetyAdvisor
            </h2>
            <p className="text-lg font-medium text-primary">
              Safety Management Platform
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Secure access to your safety management dashboard. Enter your authorized credentials to continue.
            </p>
          </div>
        </div>
        
        {/* Login Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">
              Sign In
            </CardTitle>
            <CardDescription className="text-center">
              Admin access only
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Auth
              supabaseClient={supabase}
              appearance={{ 
                theme: ThemeSupa,
                style: {
                  button: { 
                    background: 'hsl(var(--primary))', 
                    color: 'hsl(var(--primary-foreground))',
                    borderRadius: '0.5rem',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    padding: '12px 16px',
                    height: '40px'
                  },
                  anchor: { 
                    color: 'hsl(var(--primary))',
                    fontSize: '14px',
                    fontWeight: '500'
                  },
                  input: {
                    borderRadius: '0.5rem',
                    border: '1px solid hsl(var(--border))',
                    fontSize: '14px',
                    padding: '12px 16px',
                    height: '40px',
                    backgroundColor: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))'
                  },
                  label: {
                    color: 'hsl(var(--foreground))',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '6px'
                  },
                  message: {
                    fontSize: '14px',
                    borderRadius: '0.5rem',
                    padding: '12px 16px',
                    marginTop: '8px'
                  },
                  container: {
                    gap: '16px'
                  }
                },
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(var(--primary))',
                      brandAccent: 'hsl(var(--primary))',
                      brandButtonText: 'hsl(var(--primary-foreground))',
                      defaultButtonBackground: 'hsl(var(--primary))',
                      defaultButtonBackgroundHover: 'hsl(var(--primary))',
                      inputBorder: 'hsl(var(--border))',
                      inputBorderHover: 'hsl(var(--primary))',
                      inputBorderFocus: 'hsl(var(--primary))'
                    },
                    space: {
                      buttonPadding: '12px 16px',
                      inputPadding: '12px 16px'
                    },
                    radii: {
                      borderRadiusButton: '0.5rem',
                      buttonBorderRadius: '0.5rem',
                      inputBorderRadius: '0.5rem'
                    }
                  }
                }
              }}
              providers={[]}
              redirectTo="/dashboard"
            />
          </CardContent>
        </Card>
        
        {/* Security Notice */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Secured with enterprise-grade encryption</span>
          </div>
          
          <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
            <span>© 2024 SafetyAdvisor</span>
            <span>•</span>
            <span>All rights reserved</span>
          </div>
        </div>
      </div>
    </div>
  )
} 