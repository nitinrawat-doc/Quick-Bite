import { useState, useEffect, useRef } from 'react';
import { resolveFoodImageUrl, DEFAULT_FOOD_PLACEHOLDER_SVG } from '../../utils/imageUrl';
import { getFoodImageByName } from '../../utils/foodImageMap';

/**
 * Universal resilient Food Image component for QuickBite
 *
 * - Smooth skeleton shimmer loading state
 * - Resolves local uploads (/uploads/...) with backend base URL
 * - Optimizes Unsplash thumbnails with modern WebP formats (auto=format)
 * - Self-contained offline SVG placeholder fallback prevents broken image icons
 * - Strict single-error guard prevents infinite retry loops
 * - Supports loading="lazy" | "eager", fetchPriority="high" | "auto"
 * - Maintains aspect ratios to eliminate Cumulative Layout Shift (CLS)
 * - Never gets stuck in blank opacity: 0 state
 */
export default function FoodImage({
  src,
  item = null,
  alt = 'Food item',
  style = {},
  className = '',
  width,
  height,
  aspectRatio,
  loading = 'lazy',
  fetchPriority = 'auto',
  thumbnail = false,
  objectFit = 'cover',
  fallbackSrc = null,
  onLoad,
  onError,
}) {
  const getCandidateUrl = () => {
    if (src && typeof src === 'string' && src.trim()) return src.trim();
    if (item) {
      if (typeof item === 'string') return item;
      return (
        item.imageUrl ||
        item.image ||
        item.foodItem?.imageUrl ||
        item.foodItem?.image ||
        getFoodImageByName(item.name || item.title || alt) ||
        null
      );
    }
    if (alt) {
      return getFoodImageByName(alt) || null;
    }
    return null;
  };

  const initialCandidate = getCandidateUrl();
  const initialResolved = resolveFoodImageUrl(initialCandidate, { thumbnail });
  const isDirectSvg = initialResolved === DEFAULT_FOOD_PLACEHOLDER_SVG;

  const [imgSrc, setImgSrc] = useState(initialResolved);
  const [isLoaded, setIsLoaded] = useState(isDirectSvg);
  const [hasError, setHasError] = useState(false);

  const imgRef = useRef(null);
  const hasRetriedRef = useRef(false);

  // Sync state ONLY when candidate URL changes to prevent tearing/resetting loaded images
  useEffect(() => {
    const raw = getCandidateUrl();
    const resolved = resolveFoodImageUrl(raw, { thumbnail });
    const directSvg = resolved === DEFAULT_FOOD_PLACEHOLDER_SVG;

    if (resolved !== imgSrc) {
      setImgSrc(resolved);
      setIsLoaded(directSvg);
      setHasError(false);
      hasRetriedRef.current = false;
    }
  }, [src, item, alt, thumbnail]);

  // Synchronously recognize already-completed images from browser cache on every render
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      }
    }
  });

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    // Prevent infinite error loops
    if (hasRetriedRef.current) {
      if (imgSrc !== DEFAULT_FOOD_PLACEHOLDER_SVG) {
        setImgSrc(DEFAULT_FOOD_PLACEHOLDER_SVG);
      }
      setIsLoaded(true);
      setHasError(true);
      return;
    }

    hasRetriedRef.current = true;
    setHasError(true);

    const fallbackCandidate =
      fallbackSrc ||
      (item && getFoodImageByName(item.name || item.title || alt)) ||
      (alt && getFoodImageByName(alt));

    if (fallbackCandidate && fallbackCandidate !== imgSrc) {
      const resolvedFallback = resolveFoodImageUrl(fallbackCandidate, { thumbnail });
      setImgSrc(resolvedFallback);
      // Wait for fallback to load or fail
    } else {
      // Switch straight to zero-latency self-contained SVG placeholder
      setImgSrc(DEFAULT_FOOD_PLACEHOLDER_SVG);
      setIsLoaded(true);
    }

    if (onError) onError(e);
  };

  const containerStyle = {
    position: 'relative',
    overflow: 'hidden',
    display: style.display || 'inline-block',
    backgroundColor: '#1D2025',
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(aspectRatio ? { aspectRatio } : {}),
    ...style,
  };

  // Thumbnails in small summary cards/lists should load eagerly to avoid layout observer delays
  const effectiveLoading = thumbnail ? 'eager' : loading;

  return (
    <div className={`food-image-wrapper ${className}`} style={containerStyle}>
      {/* Animated loading skeleton shimmer */}
      {!isLoaded && !hasError && imgSrc !== DEFAULT_FOOD_PLACEHOLDER_SVG && (
        <div
          className="skeleton-pulse"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
            background: 'linear-gradient(90deg, #1D2025 25%, #252A31 50%, #1D2025 75%)',
            backgroundSize: '200% 100%',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
          aria-hidden="true"
        />
      )}

      {/* Actual image element */}
      <img
        ref={imgRef}
        src={imgSrc}
        alt={alt || 'Food item'}
        loading={effectiveLoading}
        fetchPriority={fetchPriority}
        decoding={effectiveLoading === 'eager' ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: hasError && imgSrc === DEFAULT_FOOD_PLACEHOLDER_SVG ? 'contain' : objectFit,
          display: 'block',
        }}
      />
    </div>
  );
}
