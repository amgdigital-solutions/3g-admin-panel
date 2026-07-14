import { useLocation } from 'react-router'
import { useEffect } from 'react'

interface BreadcrumbItem {
  name: string
  item: string
}

export default function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const location = useLocation()

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.3guae.com'
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: origin + '/',
        },
        ...items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 2,
          name: item.name,
          item: origin + item.item,
        })),
      ],
    }

    let script = document.getElementById('breadcrumb-schema') as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = 'breadcrumb-schema'
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(schema)

    return () => {
      const el = document.getElementById('breadcrumb-schema')
      if (el) document.head.removeChild(el)
    }
  }, [items, location])

  return null
}
