import React, { useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';

interface PhotoSlotProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  placeholderComment: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  showGuideCaption?: boolean;
}

/**
 * Renders a WebP placeholder image slot with:
 * 1. Real HTML comment node injected into the DOM stating what real photo to use.
 * 2. Explicit width and height attributes to guarantee near-zero Cumulative Layout Shift (CLS).
 * 3. Lazy loading below the fold, or high priority for the preloaded hero image.
 * 4. Optional subtle photo replacement hint for the clinic owner.
 */
export const PhotoSlot: React.FC<PhotoSlotProps> = ({
  src,
  alt,
  width,
  height,
  placeholderComment,
  priority = false,
  className = '',
  imgClassName = '',
  showGuideCaption = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const commentNode = document.createComment(` ${placeholderComment} `);
    el.prepend(commentNode);
    return () => {
      if (commentNode.parentNode === el) {
        el.removeChild(commentNode);
      }
    };
  }, [placeholderComment]);

  return (
    <div
      ref={containerRef}
      data-photo-slot={placeholderComment}
      className={`relative overflow-hidden bg-[#E6F4F1] border border-[#0E7C86]/25 ${className}`}
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover block ${imgClassName}`}
      />
      {showGuideCaption && (
        <div className="bg-[#FFFFFF]/95 backdrop-blur-xs border-t border-[#0E7C86]/20 px-3.5 py-2 flex items-start gap-2">
          <Camera className="w-4 h-4 text-[#0E7C86] shrink-0 mt-0.5" aria-hidden="true" />
          <p className="caption-text text-[#0B2B3A]">
            <span className="font-semibold">Photo slot:</span> {placeholderComment.replace('REPLACE PHOTO: ', '')}
          </p>
        </div>
      )}
    </div>
  );
};
