import { Phone, Mail, MessageCircle, Clock, Award } from 'lucide-react'

interface ContactExpertProps {
  variant?: 'sidebar' | 'section'
  title?: string
  subtitle?: string
  heading?: string
  agentName?: string
  agentRole?: string
}

export default function ContactExpert({
  variant = 'section',
  title,
  subtitle,
  heading,
  agentName = '3G Expert Team',
  agentRole = 'Property Consultant',
}: ContactExpertProps) {
  if (variant === 'sidebar') {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card max-w-md mx-auto">
        {heading && (
          <h3 className="font-semibold text-navy-950 mb-1">{heading}</h3>
        )}
        {!heading && <h3 className="font-semibold text-navy-950 mb-1">Contact Expert</h3>}
        <p className="text-xs text-gray-400 mb-5">
          {subtitle || 'Speak with a Dubai property specialist'}
        </p>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-full bg-navy-800 flex items-center justify-center">
            <span className="text-white font-serif text-lg">
              {agentName === '3G Expert Team'
                ? '3G'
                : agentName.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <div className="font-medium text-navy-950">{agentName}</div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {agentRole}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.href = 'tel:+971563867270'}
            className="flex items-center justify-center gap-2 w-full py-3 bg-navy-800 text-white text-sm font-medium rounded-lg hover:bg-navy-700 transition-colors"
          >
            <Phone className="w-4 h-4" />
            Call Now
          </button>
          <button
            onClick={() => window.open('https://wa.me/971563867270', '_blank')}
            className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={() => window.location.href = 'mailto:info@3guae.com'}
            className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:border-navy-800 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
        </div>
      </div>
    )
  }

  // Section variant — full-width CTA section
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-4xl mx-auto bg-navy-950 rounded-2xl p-8 sm:p-12 text-center text-white">
        <Award className="w-10 h-10 text-gold mx-auto mb-5" />
        <h2 className="font-serif text-2xl sm:text-3xl mb-3">
          {title || 'Speak to a Property Expert'}
        </h2>
        <p className="text-gray-300 mb-8 max-w-lg mx-auto text-sm leading-relaxed">
          {subtitle || 'Our licensed Dubai property specialists are available to answer your questions, recommend projects, and guide you through every step of your investment journey.'}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a href="tel:+971563867270" className="btn-primary bg-gold text-navy-950 hover:bg-gold-300 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Call +971 56 386 7270
          </a>
          <a
            href="https://wa.me/971563867270"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 bg-green-600 text-white text-sm font-semibold tracking-wider uppercase rounded hover:bg-green-700 transition-all flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        </div>
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Available 7 days a week &middot; Response within 30 minutes</span>
        </div>
      </div>
    </section>
  )
}
