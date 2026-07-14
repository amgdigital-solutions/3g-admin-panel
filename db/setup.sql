-- Run this in Supabase SQL Editor to set up tables
CREATE TABLE IF NOT EXISTS listed_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  barcode VARCHAR(50),
  price INTEGER DEFAULT 0,
  price_display VARCHAR(100),
  location VARCHAR(255),
  property_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft',
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  area_sqft INTEGER DEFAULT 0,
  parking INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  images JSONB DEFAULT '[]',
  amenities JSONB DEFAULT '[]',
  meta_title VARCHAR(255),
  meta_description TEXT,
  focus_keywords VARCHAR(255),
  faqs JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  category VARCHAR(100),
  author_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft',
  featured_image TEXT,
  meta_title VARCHAR(255),
  meta_description TEXT,
  focus_keyword VARCHAR(255),
  tags JSONB DEFAULT '[]',
  faqs JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  image TEXT,
  gallery JSONB DEFAULT '[]',
  location VARCHAR(255),
  avg_price VARCHAR(100),
  property_types JSONB DEFAULT '[]',
  amenities JSONB DEFAULT '[]',
  meta_title VARCHAR(255),
  meta_description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS download_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  type VARCHAR(50),
  property_id UUID,
  property_title VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
