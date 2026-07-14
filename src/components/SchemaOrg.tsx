import { useEffect } from 'react'

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: '3G Real Estate',
  alternateName: '3G UAE',
  url: 'https://www.3guae.com',
  logo: 'https://www.3guae.com/images/logo.png',
  image: 'https://www.3guae.com/images/og-image.jpg',
  description: 'Dubai\'s premier real estate investment portal. 3G Real Estate specializes in off-plan and ready properties, Golden Visa assistance, and property management services.',
  telephone: '+971563867270',
  email: 'info@3guae.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Office #1001, Sobha Ivory 1, Business Bay',
    addressLocality: 'Dubai',
    addressCountry: 'AE',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 25.1864,
    longitude: 55.2636,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '19:00',
    },
  ],
  sameAs: [
    'https://www.facebook.com/3g.realestate/',
    'https://www.instagram.com/3grealestate/',
    'https://www.linkedin.com/company/3g-real-estate/',
    'https://twitter.com/3grealestate',
    'https://www.youtube.com/@3grealestate',
  ],
  priceRange: '$$$',
  areaServed: {
    '@type': 'City',
    name: 'Dubai',
  },
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '3G Real Estate',
  url: 'https://www.3guae.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://www.3guae.com/properties?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function SchemaOrg() {
  useEffect(() => {
    const schemas = [organizationSchema, websiteSchema]

    schemas.forEach((schema, i) => {
      const id = `schema-org-${i}`
      let script = document.getElementById(id) as HTMLScriptElement | null
      if (!script) {
        script = document.createElement('script')
        script.id = id
        script.type = 'application/ld+json'
        document.head.appendChild(script)
      }
      script.textContent = JSON.stringify(schema)
    })

    return () => {
      schemas.forEach((_, i) => {
        const el = document.getElementById(`schema-org-${i}`)
        if (el) document.head.removeChild(el)
      })
    }
  }, [])

  return null
}
