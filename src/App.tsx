/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { SeoHead } from './components/SeoHead';
import { TopBarAndHeader } from './components/TopBarAndHeader';
import { HeroAndTrustStrip } from './components/HeroAndTrustStrip';
import { AboutAndCareJourney } from './components/AboutAndCareJourney';
import { ServicesAndKidsCorner } from './components/ServicesAndKidsCorner';
import { TeamTestimonialsFaq } from './components/TeamTestimonialsFaq';
import { PatientPortalSection } from './components/PatientPortalSection';
import { ContactSection } from './components/ContactSection';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { AdminDashboard } from './components/AdminDashboard';
import { FooterAndMobileBar } from './components/FooterAndMobileBar';
import { AppointmentReminderGlobalWatcher } from './components/AppointmentReminderPrompt';
import { DentalAssistantWidget } from './components/DentalAssistantWidget';
import { CLINIC_CONFIG } from './config/clinicConfig';

type PageRoute = 'home' | 'privacy' | 'admin';

function resolveRoute(): PageRoute {
  const pathname = window.location.pathname;
  const hash = window.location.hash;
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view') || params.get('portal');

  if (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    hash === '#admin' ||
    viewParam === 'admin' ||
    viewParam === 'owner'
  ) {
    return 'admin';
  }
  if (
    pathname === '/privacy' ||
    pathname.startsWith('/privacy/') ||
    hash === '#privacy' ||
    viewParam === 'privacy'
  ) {
    return 'privacy';
  }
  return 'home';
}

export default function App() {
  const [route, setRoute] = useState<PageRoute>(() => resolveRoute());
  const [selectedService, setSelectedService] = useState<string>(
    CLINIC_CONFIG.services[0].name
  );

  useEffect(() => {
    const handleRouteChange = () => {
      setRoute(resolveRoute());
    };
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  const navigateToHome = (sectionId?: string) => {
    const isNotCleanRoot =
      window.location.pathname !== '/' ||
      window.location.hash === '#admin' ||
      window.location.hash === '#privacy' ||
      window.location.search.includes('view=') ||
      window.location.search.includes('portal=');

    if (isNotCleanRoot) {
      window.history.pushState({}, '', sectionId ? `/#${sectionId}` : '/');
      setRoute('home');
      setTimeout(() => {
        if (sectionId) {
          const el = document.getElementById(sectionId);
          el?.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 60);
    } else if (sectionId) {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToPrivacy = () => {
    window.history.pushState({}, '', '/privacy');
    setRoute('privacy');
  };

  const handleBookClick = (preselectedService?: string) => {
    if (preselectedService) {
      setSelectedService(preselectedService);
    }
    navigateToHome('contact');
  };

  if (route === 'admin') {
    return (
      <>
        <SeoHead page="admin" />
        <AdminDashboard onBackHome={() => navigateToHome()} />
      </>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip flex flex-col bg-[#FFFFFF] text-[#0B2B3A]">
      <SeoHead page={route} />

      <TopBarAndHeader
        onNavigateHome={navigateToHome}
        onBookClick={handleBookClick}
      />

      <main id="main-content" className="flex-1 w-full max-w-full min-w-0 overflow-x-clip">
        {route === 'privacy' ? (
          <PrivacyPolicyPage onBackHome={() => navigateToHome()} />
        ) : (
          <>
            <HeroAndTrustStrip onBookClick={() => handleBookClick()} />
            <AboutAndCareJourney />
            <ServicesAndKidsCorner
              onSelectServiceForBooking={(serviceName) =>
                handleBookClick(serviceName)
              }
            />
            <TeamTestimonialsFaq />
            <PatientPortalSection
              onBookNewVisit={(serviceName) => handleBookClick(serviceName)}
            />
            <ContactSection
              selectedService={selectedService}
              onOpenPrivacyPolicy={navigateToPrivacy}
            />
          </>
        )}
      </main>

      <AppointmentReminderGlobalWatcher
        onNavigateToPortal={() => navigateToHome('patient-portal')}
      />

      <DentalAssistantWidget onBookAppointmentClick={() => handleBookClick()} />

      <FooterAndMobileBar
        onNavigateHome={navigateToHome}
        onOpenPrivacyPolicy={navigateToPrivacy}
        onBookClick={() => handleBookClick()}
        showMobileStickyBar={route === 'home'}
      />
    </div>
  );
}
