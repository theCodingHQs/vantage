import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Input, Select } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import { getCurrentUser } from '#/server/functions/auth'
import { completeOnboarding } from '#/server/functions/auth'
import confetti from 'canvas-confetti'
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw redirect({ to: '/login' })
    }
    if (user.onboardingCompleted) {
      throw redirect({ to: '/dashboard' })
    }
    return { user }
  },
  component: OnboardingComponent,
})

function OnboardingComponent() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  
  // Form State
  const [businessName, setBusinessName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [timezone, setTimezone] = useState('UTC')
  const [freelancerType, setFreelancerType] = useState('developer')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [hourlyRate, setHourlyRate] = useState('50')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNext = () => {
    if (step === 1 && !businessName) {
      setError('Business name is required')
      return
    }
    if (step === 3 && (!clientName || !clientEmail)) {
      setError('Please add a primary client to get started')
      return
    }
    setError(null)
    setStep(prev => prev + 1)
  }

  const handleBack = () => {
    setError(null)
    setStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await completeOnboarding({
        data: {
          businessName,
          currency,
          timezone,
          freelancerType,
          clientName,
          clientEmail,
          hourlyRate: parseFloat(hourlyRate) || 0,
        }
      })

      if (res.success) {
        // Trigger celebration
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        })
        
        // Wait a second for animation and redirect
        setTimeout(() => {
          navigate({ to: '/dashboard' })
        }, 1500)
      } else {
        setError(res.error || 'Failed to save onboarding. Please try again.')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save onboarding. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4 selection:bg-accent/25 relative overflow-hidden">
      {/* Glare background */}
      <div className="absolute top-[-30%] right-[-20%] w-[800px] h-[800px] rounded-full bg-accent/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-30%] left-[-20%] w-[800px] h-[800px] rounded-full bg-success/5 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-xl bg-surface border border-border rounded-2xl p-8 shadow-2xl backdrop-blur-md relative z-10">
        
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/60">
          <div>
            <span className="text-[10px] text-accent font-bold uppercase tracking-wider block">Step {step} of 5</span>
            <h2 className="text-xl font-bold text-text-1">Set up your workspace</h2>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`w-6 h-1 rounded transition-all duration-300 ${
                  s <= step ? 'bg-accent' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Step 1: Branding */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-semibold text-text-2">What is your business branding?</h3>
            <Input
              label="Business Name"
              type="text"
              placeholder="e.g. Acme Design, Jane Freelances"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Currency"
                options={[
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'GBP', label: 'GBP (£)' },
                  { value: 'CAD', label: 'CAD ($)' },
                  { value: 'AUD', label: 'AUD ($)' },
                ]}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
              <Select
                label="Timezone"
                options={[
                  { value: 'UTC', label: 'UTC' },
                  { value: 'America/New_York', label: 'EST / New York' },
                  { value: 'Europe/London', label: 'GMT / London' },
                  { value: 'Asia/Kolkata', label: 'IST / India' },
                  { value: 'Asia/Tokyo', label: 'JST / Japan' },
                ]}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Service category */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-semibold text-text-2">What service do you provide?</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'developer', label: '💻 Software Engineer' },
                { value: 'designer', label: '🎨 UI/UX Designer' },
                { value: 'copywriter', label: '✍️ Copywriter / Editor' },
                { value: 'consultant', label: '👔 Business Consultant' },
                { value: 'video-editor', label: '🎬 Video Editor' },
                { value: 'marketer', label: '📈 Digital Marketer' },
                { value: 'photographer', label: '📷 Photographer' },
                { value: 'virtual-assistant', label: '🤝 Virtual Assistant' },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFreelancerType(type.value)}
                  className={`p-4 rounded-xl border text-left text-sm font-medium transition-all cursor-pointer ${
                    freelancerType === type.value
                      ? 'border-accent bg-accent/5 text-text-1'
                      : 'border-border bg-surface-2/20 text-text-2 hover:bg-surface-2/40'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Add Client */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-semibold text-text-2">Add your first client</h3>
            <p className="text-xs text-text-2 leading-relaxed">
              Don't worry, you can easily add more clients or import contacts later. Let's create your first client placeholder:
            </p>
            <Input
              label="Client Contact Name"
              type="text"
              placeholder="e.g. John Miller"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
            <Input
              label="Client Email Address"
              type="email"
              placeholder="e.g. billing@client.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              required
            />
          </div>
        )}

        {/* Step 4: Hourly Rate */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-semibold text-text-2">Set your hourly billing rate</h3>
            <p className="text-xs text-text-2 leading-relaxed">
              This will be used as the default rate when logging hours for clients and setting up invoices. You can always override this.
            </p>
            <Input
              label="Default Hourly Rate"
              type="number"
              min="0"
              placeholder="50"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              required
            />
          </div>
        )}

        {/* Step 5: Invite Team & Review */}
        {step === 5 && (
          <div className="space-y-6 text-center py-4 animate-in fade-in duration-200">
            <div className="flex justify-center text-success">
              <CheckCircle2 size={64} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-1">You're all set!</h3>
              <p className="text-xs text-text-2 mt-2 max-w-sm mx-auto leading-relaxed">
                Click complete below to initialize your dashboard with your business branding, first client, and a demo project.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/60">
          {step > 1 ? (
            <Button variant="secondary" onClick={handleBack} disabled={loading} className="flex items-center gap-1.5">
              <ArrowLeft size={14} /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <Button onClick={handleNext} className="flex items-center gap-1.5">
              Continue <ArrowRight size={14} />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="flex items-center gap-1.5">
              {loading ? 'Setting up...' : 'Complete Onboarding'}
              {!loading && <Sparkles size={14} />}
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}
