import { useEffect } from 'react'

interface ArticleSchemaProps {
  title: string
  description: string
  image: string
  author: string
  datePublished: string
  dateModified?: string
  url?: string
}

export default function ArticleSchema({ title, description, image, author, datePublished, dateModified, url }: ArticleSchemaProps) {
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.3guae.com'
    const pageUrl = url || (typeof window !== 'undefined' ? window.location.href : origin)

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description: description,
      image: image.startsWith('http') ? image : origin + image,
      author: {
        '@type': 'Person',
        name: author,
      },
      publisher: {
        '@type': 'Organization',
        name: '3G Real Estate',
        logo: {
          '@type': 'ImageObject',
          url: origin + '/favicon-32x32.png',
        },
      },
      datePublished: datePublished,
      dateModified: dateModified || datePublished,
      url: pageUrl,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': pageUrl,
      },
    }

    let script = document.getElementById('article-schema') as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = 'article-schema'
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(schema)

    return () => {
      const el = document.getElementById('article-schema')
      if (el) document.head.removeChild(el)
    }
  }, [title, description, image, author, datePublished, dateModified, url])

  return null
}
