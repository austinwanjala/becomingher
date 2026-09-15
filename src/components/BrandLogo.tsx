'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { createClient } from '@/utils/supabase/client';

interface BrandLogoProps {
  variant?: 'light' | 'dark' | 'auto';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  href?: string;
}

export function BrandLogo({
  variant = 'light',
  showText = true,
  size = 'md',
  className = '',
  href
}: BrandLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string>(store.brand.logo_url || '');
  const [darkLogoUrl, setDarkLogoUrl] = useState<string>(store.brand.logo_dark_url || '');
  const [brandName, setBrandName] = useState<string>(store.brand.name || 'Becoming Her');
  const [tagline, setTagline] = useState<string>(store.brand.tagline || 'Digital Sanctuary');

  useEffect(() => {
    // 1. Initial fallback from memory/localStorage
    const storedLogo = localStorage.getItem('becoming_her_brand_logo');
    const storedDarkLogo = localStorage.getItem('becoming_her_brand_dark_logo');
    const storedName = localStorage.getItem('becoming_her_brand_name');

    if (storedLogo) setLogoUrl(storedLogo);
    if (storedDarkLogo) setDarkLogoUrl(storedDarkLogo);
    if (storedName) setBrandName(storedName);

    // 2. Fetch fresh settings from the database
    let isMounted = true;
    const fetchBrandSettings = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('site_settings')
          .select('brand')
          .eq('id', 'global')
          .single();

        if (data?.brand && !error && isMounted) {
          const brand = data.brand;
          if (brand.logo_url) {
            setLogoUrl(brand.logo_url);
            localStorage.setItem('becoming_her_brand_logo', brand.logo_url);
          }
          if (brand.logo_dark_url) {
            setDarkLogoUrl(brand.logo_dark_url);
            localStorage.setItem('becoming_her_brand_dark_logo', brand.logo_dark_url);
          }
          if (brand.name) {
            setBrandName(brand.name);
            localStorage.setItem('becoming_her_brand_name', brand.name);
          }
          if (brand.tagline) {
            setTagline(brand.tagline);
          }
        }
      } catch (err) {
        console.error('Failed to fetch brand settings from DB:', err);
      }
    };

    fetchBrandSettings();

    const handleBrandUpdate = (e: CustomEvent) => {
      if (e.detail?.logo_url !== undefined) setLogoUrl(e.detail.logo_url);
      if (e.detail?.logo_dark_url !== undefined) setDarkLogoUrl(e.detail.logo_dark_url);
      if (e.detail?.name !== undefined) setBrandName(e.detail.name);
    };

    window.addEventListener('becoming_her_brand_updated' as any, handleBrandUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('becoming_her_brand_updated' as any, handleBrandUpdate);
    };
  }, []);

  const activeLogo = variant === 'dark' && darkLogoUrl ? darkLogoUrl : logoUrl;

  const sizeStyles = {
    sm: {
      img: 'h-8 max-w-[140px]',
      icon: 'w-7 h-7',
      sparkle: 'w-3.5 h-3.5',
      title: 'text-base',
      subtitle: 'text-[9px]'
    },
    md: {
      img: 'h-10 max-w-[180px]',
      icon: 'w-9 h-9',
      sparkle: 'w-4 h-4',
      title: 'text-lg sm:text-xl',
      subtitle: 'text-[10px]'
    },
    lg: {
      img: 'h-14 max-w-[240px]',
      icon: 'w-12 h-12',
      sparkle: 'w-6 h-6',
      title: 'text-2xl sm:text-3xl',
      subtitle: 'text-xs'
    }
  }[size];

  const content = (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      {activeLogo && (
        <img
          src={activeLogo}
          alt={brandName}
          className={`${sizeStyles.img} w-auto object-contain transition-transform group-hover:scale-105 duration-200`}
        />
      )}

      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-serif tracking-tight font-semibold transition ${
              variant === 'dark'
                ? 'text-white group-hover:text-amber-200'
                : 'text-stone-900 group-hover:text-rose-900'
            } ${sizeStyles.title}`}
          >
            {brandName}
          </span>
          <span
            className={`tracking-widest uppercase font-sans font-medium ${
              variant === 'dark' ? 'text-stone-400' : 'text-stone-500'
            } ${sizeStyles.subtitle}`}
          >
            {tagline}
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
}
