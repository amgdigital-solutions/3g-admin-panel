import { useEffect } from 'react'

interface PageSEOProps {
  title: string
  description: string
  canonical?: string
  ogImage?: string
  ogType?: string
  noindex?: boolean
  keywords?: string
  schema?: object
}

export default function PageSEO({
  title,
  description,
  canonical,
  ogImage = 'https://www.3guae.com/images/og-image.jpg',
  ogType = 'website',
  noindex = false,
  keywords,
  schema,
}: PageSEOProps) {
  const fullTitle = title.includes('3G') ? title : `${title} | 3G Real Estate`
  const siteUrl = 'https://www.3guae.com'
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : typeof window !== 'undefined' ? window.location.href : siteUrl

  useEffect(() => {
    // Update document title
    document.title = fullTitle

    // Helper to update or create meta tag
    const setMeta = (_selector: string, attr: 'name' | 'property', value: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, value)
        document.head.appendChild(el)
      }
      el.content = content
    }

    // Basic meta
    setMeta('', 'name', 'description', description)
    if (keywords) setMeta('', 'name', 'keywords', keywords)
    setMeta('', 'name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')

    // Canonical
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonicalEl) {
      canonicalEl = document.createElement('link')
      canonicalEl.rel = 'canonical'
      document.head.appendChild(canonicalEl)
    }
    canonicalEl.href = canonicalUrl

    // Open Graph
    setMeta('', 'property', 'og:title', fullTitle)
    setMeta('', 'property', 'og:description', description)
    setMeta('', 'property', 'og:type', ogType)
    setMeta('', 'property', 'og:url', canonicalUrl)
    setMeta('', 'property', 'og:image', ogImage)
    setMeta('', 'property', 'og:site_name', '3G Real Estate')
    setMeta('', 'property', 'og:locale', 'en_US')

    // Twitter Card
    setMeta('', 'name', 'twitter:card', 'summary_large_image')
    setMeta('', 'name', 'twitter:title', fullTitle)
    setMeta('', 'name', 'twitter:description', description)
    setMeta('', 'name', 'twitter:image', ogImage)

    // Schema.org JSON-LD (if provided)
    if (schema) {
      let schemaScript = document.getElementById('page-schema') as HTMLScriptElement | null
      if (!schemaScript) {
        schemaScript = document.createElement('script')
        document.head.appendChild(schemaScript)
      }
      schemaScript.type = 'application/ld+json'
      schemaScript.textContent = JSON.stringify(schema)
    }

    // Viewport (ensure it's there)
    let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null
    if (!viewport) {
      viewport = document.createElement('meta')
      viewport.name = 'viewport'
      viewport.content = 'width=device-width, initial-scale=1'
      document.head.appendChild(viewport)
    }
  }, [fullTitle, description, canonicalUrl, ogImage, ogType, noindex, keywords, schema])

  return null
}
