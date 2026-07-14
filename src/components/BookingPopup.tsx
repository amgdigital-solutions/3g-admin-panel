import { useState, useEffect } from 'react'
import { X, Calendar, Clock, ChevronLeft, Send, Check } from 'lucide-react'

interface BookingPopupProps {
  onClose: () => void
}

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
]

export default function BookingPopup({ onClose }: BookingPopupProps) {
  const [step, setStep] = useState<'calendar' | 'form' | 'success'>('calendar')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '' })

  // Generate calendar days
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = currentMonth.toLocaleString('default', { month: 'long' })

  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const handleDateSelect = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (dateStr >= todayStr) {
      setSelectedDate(dateStr)
    }
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
  }

  const handleSubmit = () => {
    // Save to Supabase or localStorage
    const bookings = JSON.parse(localStorage.getItem('booking_requests') || '[]')
    bookings.push({
      ...formData,
      date: selectedDate,
      time: selectedTime,
      createdAt: new Date().toISOString()
    })
    localStorage.setItem('booking_requests', JSON.stringify(bookings))
    setStep('success')
  }

  const isFormValid = formData.name && formData.email && formData.phone

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />

      {/* Glass Card */}
      <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {step === 'form' && (
              <button onClick={() => setStep('calendar')} className="p-1 hover:bg-white/10 rounded-full transition-all">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <h3 className="text-white font-semibold text-lg">
              {step === 'calendar' && 'Book a Free Consultation'}
              {step === 'form' && 'Your Contact Details'}
              {step === 'success' && 'Booking Confirmed!'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-all">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Step 1: Calendar */}
        {step === 'calendar' && (
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(year, month - 1))}
                className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all"
              >
                ←
              </button>
              <span className="text-white font-medium">{monthName} {year}</span>
              <button
                onClick={() => setCurrentMonth(new Date(year, month + 1))}
                className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all"
              >
                →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-white/50 text-xs py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                if (!day) return <div key={i} className="h-10" />
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const isSelected = selectedDate === dateStr
                const isPast = dateStr < todayStr
                return (
                  <button
                    key={i}
                    onClick={() => !isPast && handleDateSelect(day)}
                    disabled={isPast}
                    className={`h-10 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-[#C9A84C] text-[#1E3A5F]'
                        : isPast
                        ? 'text-white/20 cursor-not-allowed'
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            {/* Selected Date Display */}
            {selectedDate && (
              <div className="mt-4 flex items-center gap-2 text-[#C9A84C] text-sm">
                <Calendar className="w-4 h-4" />
                <span>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
            )}

            {/* Time Slots */}
            {selectedDate && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-white/70 text-sm mb-3">
                  <Clock className="w-4 h-4" />
                  <span>Select Time</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      className={`py-2 px-3 rounded-lg text-sm transition-all ${
                        selectedTime === time
                          ? 'bg-[#C9A84C] text-[#1E3A5F] font-medium'
                          : 'bg-white/5 text-white/70 hover:bg-white/15 hover:text-white border border-white/10'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={() => selectedDate && selectedTime && setStep('form')}
              disabled={!selectedDate || !selectedTime}
              className={`w-full mt-6 py-3 rounded-lg font-semibold text-sm transition-all ${
                selectedDate && selectedTime
                  ? 'bg-[#C9A84C] text-[#1E3A5F] hover:bg-[#b89a3f]'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Contact Form */}
        {step === 'form' && (
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 text-[#C9A84C] text-sm mb-4">
              <Calendar className="w-4 h-4" />
              <span>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              <span className="text-white/30">|</span>
              <Clock className="w-4 h-4" />
              <span>{selectedTime}</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-white/70 text-sm mb-1 block">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#C9A84C]/50"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-1 block">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#C9A84C]/50"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-1 block">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+971 50 000 0000"
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#C9A84C]/50"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-1 block">Notes (optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Tell us about your investment goals..."
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#C9A84C]/50 min-h-[80px] resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`w-full mt-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                isFormValid
                  ? 'bg-[#C9A84C] text-[#1E3A5F] hover:bg-[#b89a3f]'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              Book Consultation
            </button>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 bg-[#C9A84C] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-[#1E3A5F]" />
            </div>
            <h4 className="text-white text-xl font-semibold mb-2">Booking Confirmed!</h4>
            <p className="text-white/70 text-sm mb-1">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-[#C9A84C] text-sm mb-6">{selectedTime}</p>
            <p className="text-white/50 text-sm mb-6">
              Our team will contact you shortly to confirm your appointment.
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-[#C9A84C] text-[#1E3A5F] rounded-lg font-semibold text-sm hover:bg-[#b89a3f] transition-all"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
