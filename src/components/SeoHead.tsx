import React, { useEffect } from 'react';
import { CLINIC_CONFIG } from '../config/clinicConfig';

interface SeoHeadProps {
  page: 'home' | 'privacy' | 'admin';
}

/**
 * Dynamically updates document title, meta description, robots (noindex on /admin),
 * and injects Schema.org "Dentist" JSON-LD generated directly from CLINIC_CONFIG.
 */
export const SeoHead: React.FC<SeoHeadProps> = ({ page }) => {
  useEffect(() => {
    if (page === 'admin') {
      document.title = `Owner Dashboard – ${CLINIC_CONFIG.clinicName}`;
    } else if (page === 'privacy') {
      document.title = `Privacy Policy – ${CLINIC_CONFIG.clinicName}`;
    } else {
      document.title = `${CLINIC_CONFIG.clinicName} – Gentle Care for Every Smile`;
    }

    // Manage robots meta tag (noindex for /admin)
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = page === 'admin' ? 'noindex, nofollow' : 'index, follow';

    // Inject Schema.org Dentist JSON-LD
    const scriptId = 'dentist-json-ld';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'Dentist',
      name: CLINIC_CONFIG.clinicName,
      description: CLINIC_CONFIG.tagline,
      telephone: CLINIC_CONFIG.phoneDisplay,
      email: CLINIC_CONFIG.email,
      url: window.location.origin,
      image: `${window.location.origin}/images/hero-family-smile.webp`,
      priceRange: '₹₹',
      address: {
        '@type': 'PostalAddress',
        streetAddress: CLINIC_CONFIG.address.line1,
        addressLocality: CLINIC_CONFIG.address.city,
        addressRegion: CLINIC_CONFIG.address.state,
        postalCode: CLINIC_CONFIG.address.postalCode,
        addressCountry: CLINIC_CONFIG.address.country,
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: CLINIC_CONFIG.coordinates.latitude,
        longitude: CLINIC_CONFIG.coordinates.longitude,
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:30',
          closes: '20:00',
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Saturday'],
          opens: '09:30',
          closes: '18:00',
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Sunday'],
          opens: '10:00',
          closes: '13:30',
        },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: CLINIC_CONFIG.stats.googleRating,
        reviewCount: '420',
      },
      medicalSpecialty: ['Pediatric', 'Dentistry', 'Orthodontics', 'Endodontics'],
      availableService: CLINIC_CONFIG.services.map((service) => ({
        '@type': 'MedicalProcedure',
        name: service.name,
        description: service.shortDescription,
      })),
    };

    scriptEl.textContent = JSON.stringify(schemaData);
  }, [page]);

  return null;
};
