export interface Property {
  id: string;
  title: string;
  slug: string;
  description: string;
  barcode: string;
  price: number;
  price_display: string;
  location: string;
  property_type: string;
  status: "draft" | "published" | "sold_out";
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  parking: number;
  featured: boolean;
  images: string[];
  amenities: string[];
  meta_title: string;
  meta_description: string;
  focus_keywords: string;
  faqs: { q: string; a: string }[];
  created_at: string;
  updated_at: string;
}
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author_name: string;
  status: "draft" | "published";
  featured_image: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  tags: string[];
  faqs: { q: string; a: string }[];
  created_at: string;
  updated_at: string;
}
export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  image: string;
  gallery: string[];
  location: string;
  avg_price: string;
  property_types: string[];
  amenities: string[];
  meta_title: string;
  meta_description: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}
export interface DownloadRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: "brochure" | "floor_plan";
  property_id: string | null;
  property_title: string;
  notes: string;
  created_at: string;
}
export const PROPERTY_TYPES = ["Apartment", "Villa", "Penthouse", "Townhouse", "Studio", "Mansion", "Office", "Private Island", "Estate"] as const;
export const BLOG_CATEGORIES = ["Investment Guide", "Market Update", "Community Guide", "Golden Visa", "Lifestyle", "Tips & Advice"] as const;
export const PROPERTY_STATUS = ["draft", "published", "sold_out"] as const;
export const BLOG_STATUS = ["draft", "published"] as const;
export const COMMUNITY_STATUS = ["draft", "published"] as const;
export const COMMON_AMENITIES = ["Swimming Pool", "Fitness Center", "Parking", "24/7 Security", "Concierge", "Beach Access", "Marina Access", "Golf Course", "Tennis Courts", "Spa", "Restaurants", "Retail Shops", "Parks", "Schools", "Metro Access", "Elevator", "Balcony", "Garden", "Pet Friendly", "Kids Play Area", "Business Center", "Conference Room", "Cinema", "Sports Facilities", "Yoga Studio", "Running Track", "BBQ Area", "Clubhouse", "Waterfront Views", "Rooftop Terrace", "Smart Home", "EV Charging", "Laundry Service", "Room Service", "Housekeeping", "Valet Parking"] as const;
