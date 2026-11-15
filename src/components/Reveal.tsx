import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

/**
 * Smooth entrance animation triggered once with IntersectionObserver.
 * Animates ONLY transform (translateY 24px -> 0) and opacity (0 -> 1) over 0.6s ease-out.
 * Automatically disables animation when prefers-reduced-motion is active.
 */
export const Reveal: React.FC<RevealProps> = ({ children, className = '', delayMs = 0 }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setReducedMotion(true);
      setIsVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const style: React.CSSProperties = reducedMotion
    ? {}
    : {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0px)' : 'translateY(24px)',
        transitionProperty: 'transform, opacity',
        transitionDuration: '600ms',
        transitionTimingFunction: ' cubic-bezier(0.22, 1, 0.36, 1)',
        transitionDelay: `${delayMs}ms`,
      };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
};

/**
 * Hero photo card animation: on load, scales from 0.94 to 1 and fades in (0.8s) once.
 */
export const HeroPhotoReveal: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setReducedMotion(true);
      setMounted(true);
      return;
    }
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const style: React.CSSProperties = reducedMotion
    ? {}
    : {
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'scale(1)' : 'scale(0.94)',
        transitionProperty: 'transform, opacity',
        transitionDuration: '800ms',
        transitionTimingFunction: 'ease-out',
      };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
};

/**
 * CountUpStat: counts up once when visible, starting close to the final value (85%)
 * so there is never an jarring 0 flash. Respects prefers-reduced-motion.
 */
export const CountUpStat: React.FC<{
  target: number;
  suffix?: string;
  durationMs?: number;
}> = ({ target, suffix = '', durationMs = 900 }) => {
  const startValue = Math.floor(target * 0.85);
  const [currentValue, setCurrentValue] = useState<number>(startValue);
  const ref = useRef<HTMLSpanElement | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setCurrentValue(target);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;
            const startTime = performance.now();

            const step = (now: number) => {
              const progress = Math.min((now - startTime) / durationMs, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              const nextVal = Math.round(startValue + (target - startValue) * eased);
              setCurrentValue(nextVal);
              if (progress < 1) {
                requestAnimationFrame(step);
              }
            };

            requestAnimationFrame(step);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [target, startValue, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {currentValue.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
};
