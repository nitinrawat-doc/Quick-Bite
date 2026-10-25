/**
 * Image URL Resolution and Optimization Utility for QuickBite
 *
 * Resolves local uploads (/uploads/...), external URLs (Unsplash, Cloudinary),
 * local static assets (/images/...), and provides a 100% reliable self-contained
 * SVG food placeholder that works offline without any network dependency.
 */

// Self-contained, beautifully styled QuickBite dark-theme SVG placeholder
export const DEFAULT_FOOD_PLACEHOLDER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A1D23" />
      <stop offset="100%" stop-color="#252A31" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F28C45" />
      <stop offset="100%" stop-color="#D97028" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="400" height="300" fill="url(#bg)" />

  <!-- Subtle geometric accent rings -->
  <circle cx="200" cy="130" r="85" fill="none" stroke="#2E333B" stroke-width="1.5" stroke-dasharray="6,6" opacity="0.6" />
  <circle cx="200" cy="130" r="64" fill="#1D2025" stroke="#2E333B" stroke-width="1" filter="url(#shadow)" />

  <!-- Food / Cloche / Burger Icon -->
  <g transform="translate(170, 100)" stroke="url(#accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <!-- Cloche / Burger Dome -->
    <path d="M 6 36 C 6 18, 54 18, 54 36 Z" fill="rgba(242,140,69,0.12)" />
    <!-- Handle -->
    <circle cx="30" cy="14" r="3.5" fill="#F28C45" />
    <line x1="30" y1="18" x2="30" y2="20" />
    <!-- Serving Platter base -->
    <line x1="2" y1="41" x2="58" y2="41" stroke="#F28C45" stroke-width="3" />
    <path d="M 14 41 C 14 46, 46 46, 46 41" />
  </g>

  <!-- Brand Label -->
  <text x="200" y="222" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#F5F5F5" text-anchor="middle" letter-spacing="1">QUICKBITE</text>
  <text x="200" y="242" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="500" fill="#8B9099" text-anchor="middle">Fresh Campus Canteen</text>
</svg>
`)}`;

/**
 * Returns the configured backend origin for resolving relative upload paths.
 */
export function getBackendBaseUrl() {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env) ? process.env : {};
  const backendEnv = env.VITE_BACKEND_URL || env.BACKEND_URL;
  if (backendEnv && typeof backendEnv === 'string') {
    return backendEnv.replace(/\/+$/, '');
  }

  const apiEnv = env.VITE_API_URL || env.API_URL;
  if (apiEnv && typeof apiEnv === 'string') {
    // If VITE_API_URL is e.g. "https://api.example.com/api" or "http://localhost:5000/api",
    // strip the trailing "/api" to get the server base origin.
    const stripped = apiEnv.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    if (stripped && (stripped.startsWith('http://') || stripped.startsWith('https://'))) {
      return stripped;
    }
  }

  // In development, Vite proxies /uploads and /api to http://localhost:5000,
  // so a relative URL works directly without prepending an origin.
  return '';
}

/**
 * Optimizes Unsplash image URLs with modern formats (WebP/AVIF via auto=format)
 * and responsive thumbnail sizing.
 */
export function optimizeUnsplashUrl(url, { thumbnail = false, width = null } = {}) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('images.unsplash.com')) {
      return url;
    }

    // Modern format negotiation (serves WebP / AVIF automatically)
    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('fit', 'crop');

    if (thumbnail) {
      parsed.searchParams.set('w', '240');
      parsed.searchParams.set('h', '240');
      parsed.searchParams.set('q', '75');
    } else if (width) {
      parsed.searchParams.set('w', String(width));
      parsed.searchParams.set('q', '80');
    } else if (!parsed.searchParams.has('w')) {
      parsed.searchParams.set('w', '600');
      parsed.searchParams.set('q', '80');
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Resolves a food item's image URL safely:
 * - Handles null, undefined, empty, invalid strings.
 * - Resolves relative /uploads/... to the backend server origin when configured.
 * - Upgrades insecure http:// URLs to https:// on secure origins.
 * - Optimizes Unsplash images with auto WebP and sizing.
 * - Returns DEFAULT_FOOD_PLACEHOLDER_SVG on invalid inputs.
 */
export function resolveFoodImageUrl(url, options = {}) {
  if (!url || typeof url !== 'string') {
    return DEFAULT_FOOD_PLACEHOLDER_SVG;
  }

  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    return DEFAULT_FOOD_PLACEHOLDER_SVG;
  }

  // Already a data URI or local blob preview URL
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Local uploaded image path (/uploads/...)
  if (trimmed.startsWith('/uploads/')) {
    const backendOrigin = getBackendBaseUrl();
    return backendOrigin ? `${backendOrigin}${trimmed}` : trimmed;
  }

  // Relative frontend public path (/images/..., /icons/..., etc.)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  // Absolute HTTP / HTTPS URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Fix mixed-content if running on HTTPS
    let secureUrl = trimmed;
    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      trimmed.startsWith('http://')
    ) {
      // Upgrade to https if safe
      secureUrl = trimmed.replace(/^http:\/\//i, 'https://');
    }

    // Optimize Unsplash images
    if (secureUrl.includes('images.unsplash.com')) {
      return optimizeUnsplashUrl(secureUrl, options);
    }

    return secureUrl;
  }

  // Fallback for unrecognized format
  return DEFAULT_FOOD_PLACEHOLDER_SVG;
}

import { getFoodImageByName } from './foodImageMap';

/**
 * Resolves the image URL for an item object (cart item, order item, or food item)
 * checking multiple common property conventions: imageUrl, image, foodItem.imageUrl, foodItem.image,
 * and falls back to the canonical food image map by item name.
 */
export function resolveItemImageUrl(item, options = {}) {
  if (!item) return DEFAULT_FOOD_PLACEHOLDER_SVG;
  if (typeof item === 'string') return resolveFoodImageUrl(item, options);
  const raw =
    item.imageUrl ||
    item.image ||
    item.foodItem?.imageUrl ||
    item.foodItem?.image ||
    getFoodImageByName(item.name || item.title) ||
    null;
  return resolveFoodImageUrl(raw, options);
}
