import { Link, useNavigate } from 'react-router'
import { X, ArrowRight, GitCompare } from 'lucide-react'
import { useCompare } from '../context/CompareContext'

export default function CompareBar() {
  const { properties, removeProperty, isOpen, setIsOpen, canAddMore } = useCompare()
  const navigate = useNavigate()

  if (!isOpen || properties.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <div className="w-full px-4 sm:px-8 lg:px-16 xl:px-24 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Title and count */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <GitCompare className="w-5 h-5 text-navy-800" />
            <div>
              <span className="font-semibold text-navy-950 text-sm hidden sm:inline">
                Compare
              </span>
              <span className="text-gray-400 text-xs ml-1 sm:ml-2">
                ({properties.length}/3)
              </span>
            </div>
          </div>

          {/* Center: Selected property thumbnails - CLICKABLE */}
          <button
            onClick={() => navigate('/compare')}
            className="flex items-center gap-2 flex-1 justify-center min-w-0 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors py-1"
          >
            {properties.map(prop => (
              <div
                key={prop.id}
                className="relative flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={prop.featured_image}
                  alt={prop.title}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border-2 border-navy-800"
                />
                <button
                  onClick={() => removeProperty(prop.id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center hover:bg-red-400 transition-colors"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
            ))}

            {/* Empty slots */}
            {canAddMore && (
              <>
                {Array.from({ length: 3 - properties.length }).map((_, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-dashed border-gray-200 rounded-lg flex-shrink-0"
                  />
                ))}
              </>
            )}

            {/* Tap to compare hint on mobile */}
            <span className="text-xs text-navy-800 font-medium ml-2 sm:hidden">
              Tap to compare
              <ArrowRight className="w-3 h-3 inline ml-1" />
            </span>
          </button>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Link
              to="/compare"
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-navy-950 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-navy-800 transition-colors"
            >
              Compare
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
