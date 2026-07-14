import { useParams } from 'react-router'
import BlogDetail from '../pages/BlogDetail'
import { getPostBySlug } from '../data/blogPosts'

// This component handles root-level blog post URLs like /dubai-real-estate-2026/
// matching 3guae.com's URL structure where posts were at root level
export default function BlogRouteHandler() {
  const { '*': slug } = useParams()
  const post = getPostBySlug(slug || '')

  if (!post) {
    // Not a blog post - will fall through to 404
    return null
  }

  // Render the blog detail with the matched slug
  return <BlogDetail />
}
