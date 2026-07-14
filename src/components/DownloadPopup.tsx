import { useState } from 'react'
import { X, FileText, Building2, Send, Check } from 'lucide-react'

interface DownloadPopupProps {
  onClose: () => void
  type: 'floorplan' | 'brochure'
  propertyTitle: string
}

export default function DownloadPopup({ onClose, type, propertyTitle }: DownloadPopupProps) {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })

  const title = type === 'floorplan' ? 'Download Floor Plan' : 'Download Brochure'
  const Icon = type === 'floorplan' ? Building2 : FileText
  const description = type === 'floorplan'
    ? 'Get the detailed floor plan for this property. Submit your details below.'
    : 'Get the complete property brochure with all details. Submit your details below.'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Save to localStorage for now (can connect to Supabase later)
    const requests = JSON.parse(localStorage.getItem('download_requests') || '[]')
    requests.push({
      ...formData,
      type,
      propertyTitle,
      createdAt: new Date().toISOString()
    })
    localStorage.setItem('download_requests', JSON.stringify(requests))
    setStep('success')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#C9A84C]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1E3A5F] text-sm">{title}</h3>
              <p className="text-xs text-gray-400 truncate max-w-[200px]">{propertyTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <p className="text-sm text-gray-500">{description}</p>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+971 50 000 0000"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/20"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#C9A84C] text-[#1E3A5F] rounded-lg font-semibold text-sm hover:bg-[#b89a3f] transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit & Download
            </button>

            <p className="text-[10px] text-gray-400 text-center">
              By submitting, you agree to be contacted by our investment consultant.
            </p>
          </form>
        ) : (
          <div className="px-6 py-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-[#1E3A5F] mb-2">Thank You!</h4>
            <p className="text-sm text-gray-500 mb-2">
              Your request has been submitted successfully.
            </p>
            <p className="text-sm text-gray-500">
              One of our <span className="font-medium text-[#C9A84C]">investment consultants</span> will get in touch with you shortly.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-8 py-2.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#152a45] transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
