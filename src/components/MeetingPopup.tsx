import { useState, useEffect, useCallback } from 'react'
import { X, Calendar, Clock, User, Mail, Phone, MessageSquare, Check, ChevronRight } from 'lucide-react'

type PopupStep = 'datetime' | 'contact' | 'thankyou'

function generateTimeSlots() {
  const slots: string[] = []
  for (let h = 9; h <= 18; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`)
    if (h < 18) slots.push(`${h.toString().padStart(2, '0')}:30`)
  }
  return slots
}

const timeSlots = generateTimeSlots()

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function MeetingPopup() {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [step, setStep] = useState<PopupStep>('datetime')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '' })
  const [hasSeenPopup, setHasSeenPopup] = useState(false)

  // Show popup after 10 seconds
  useEffect(() => {
    const seen = sessionStorage.getItem('3g-popup-seen')
    if (seen) { setHasSeenPopup(true); return }

    const timer = setTimeout(() => {
      setIsVisible(true)
      sessionStorage.setItem('3g-popup-seen', 'true')
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

  const close = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => { setIsVisible(false); setIsClosing(false) }, 300)
  }, [])

  const handleDateSelect = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
  }

  const goToContact = () => {
    if (selectedDate && selectedTime) setStep('contact')
  }

  const handleSubmit = () => {
    if (formData.name && formData.email && formData.phone) {
      setStep('thankyou')
    }
  }

  const navigateMonth = (dir: number) => {
    let newMonth = currentMonth + dir
    let newYear = currentYear
    if (newMonth > 11) { newMonth = 0; newYear++ }
    if (newMonth < 0) { newMonth = 11; newYear-- }
    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const today = new Date()

  if (!isVisible || hasSeenPopup) return null

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      {/* Popup */}
      <div className={`relative w-full max-w-lg bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {step === 'datetime' && 'Schedule a Meeting'}
              {step === 'contact' && 'Your Details'}
              {step === 'thankyou' && 'All Set!'}
            </h3>
            <p className="text-xs text-white/60 mt-0.5">
              {step === 'datetime' && 'Pick a date and time that works for you'}
              {step === 'contact' && `Meeting on ${selectedDate} at ${selectedTime}`}
              {step === 'thankyou' && 'We look forward to speaking with you'}
            </p>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Date & Time */}
          {step === 'datetime' && (
            <div className="space-y-4">
              {/* Calendar */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => navigateMonth(-1)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                  <span className="text-sm font-medium text-white">{monthNames[currentMonth]} {currentYear}</span>
                  <button onClick={() => navigateMonth(1)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-center text-[10px] text-white/40 py-1">{d}</div>
                  ))}
                </div>
                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }, (_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1
                    const dateStr = new Date(currentYear, currentMonth, day).toISOString().split('T')[0]
                    const isSelected = selectedDate === dateStr
                    const isPast = new Date(currentYear, currentMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                    return (
                      <button
                        key={day}
                        onClick={() => !isPast && handleDateSelect(day)}
                        disabled={isPast}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-all mx-auto ${isSelected ? 'bg-[#c9a84c] text-[#0a192f]' : isPast ? 'text-white/20 cursor-not-allowed' : 'text-white/80 hover:bg-white/10'}`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-[#c9a84c]" />
                    <span className="text-sm font-medium text-white">Select Time</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map(time => (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        className={`py-2 px-1 rounded-lg text-xs font-medium transition-all ${selectedTime === time ? 'bg-[#c9a84c] text-[#0a192f]' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Next button */}
              <button
                onClick={goToContact}
                disabled={!selectedDate || !selectedTime}
                className="w-full py-3 bg-[#c9a84c] text-[#0a192f] font-semibold rounded-lg hover:bg-[#d4b55a] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Contact Form */}
          {step === 'contact' && (
            <div className="space-y-4">
              <div className="bg-[#c9a84c]/10 rounded-lg p-3 border border-[#c9a84c]/20 mb-4">
                <div className="flex items-center gap-2 text-[#c9a84c]">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">{selectedDate} at {selectedTime} (GST)</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-white/70 mb-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-sm placeholder-white/40 outline-none focus:border-[#c9a84c]"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-white/70 mb-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-sm placeholder-white/40 outline-none focus:border-[#c9a84c]"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-white/70 mb-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-sm placeholder-white/40 outline-none focus:border-[#c9a84c]"
                  placeholder="+971 XX XXX XXXX"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-white/70 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-sm placeholder-white/40 outline-none focus:border-[#c9a84c] resize-none"
                  rows={3}
                  placeholder="Tell us about your investment goals..."
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.email || !formData.phone}
                className="w-full py-3 bg-[#c9a84c] text-[#0a192f] font-semibold rounded-lg hover:bg-[#d4b55a] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Schedule Meeting
              </button>
            </div>
          )}

          {/* Step 3: Thank You */}
          {step === 'thankyou' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[#c9a84c]/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-[#c9a84c]" />
              </div>
              <h4 className="text-xl font-serif text-white mb-2">Thank You!</h4>
              <p className="text-sm text-white/70 mb-1">Your meeting is scheduled for</p>
              <p className="text-base font-medium text-[#c9a84c] mb-4">{selectedDate} at {selectedTime} (GST)</p>
              <p className="text-xs text-white/50 mb-6">Our team will send you a confirmation email shortly with the meeting link.</p>
              <button onClick={close} className="px-8 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all text-sm">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
