import React, { useState } from 'react';
import { Phone, Clock, Menu, X, Calendar, Instagram, Facebook, Youtube } from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicConfig';

interface TopBarAndHeaderProps {
  onNavigateHome: (sectionId?: string) => void;
  onBookClick: (preselectedService?: string) => void;
}

export const TopBarAndHeader: React.FC<TopBarAndHeaderProps> = ({
  onNavigateHome,
  onBookClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Our team', href: '#team' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigateHome(sectionId);
  };

  return (
    <>
      {/* Skip to content link for keyboard and screen reader accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-[#FFFFFF] focus:text-[#0B2B3A] focus:font-bold focus:px-4 focus:py-2.5 focus:rounded-lg focus:shadow-md"
      >
        Skip to main content
      </a>

      {/* a) Top bar: tap-to-call phone number (tel: link), working hours, small social icons */}
      <div className="bg-[#E6F4F1] border-b border-[#0E7C86]/15 text-[#0B2B3A] w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 sm:py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <a
              href={`tel:${CLINIC_CONFIG.phoneTel}`}
              className="inline-flex items-center gap-1.5 sm:gap-2 font-bold text-[#0B2B3A] hover:text-[#0E7C86] transition-colors min-h-[36px] text-[14px] sm:text-[15px] whitespace-nowrap"
              aria-label={`Call clinic at ${CLINIC_CONFIG.phoneDisplay}`}
            >
              <Phone className="w-4 h-4 text-[#0E7C86] shrink-0" aria-hidden="true" />
              <span>Call: {CLINIC_CONFIG.phoneDisplay}</span>
            </a>

            <div className="hidden md:inline-flex items-center gap-2 caption-text text-[#0B2B3A]">
              <Clock className="w-4 h-4 text-[#0E7C86] shrink-0" aria-hidden="true" />
              <span>{CLINIC_CONFIG.workingHours.topBarSummary}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <a
              href="#patient-portal"
              onClick={(e) => handleNavClick(e, 'patient-portal')}
              className="caption-text font-bold text-[#0E7C86] hover:text-[#0B2B3A] underline underline-offset-4 min-h-[36px] inline-flex items-center whitespace-nowrap"
            >
              Patient portal
            </a>
            <span className="caption-text hidden md:inline text-[#0B2B3A] ml-1">Follow us:</span>
            <div className="hidden sm:flex items-center gap-1">
              <a
                href={CLINIC_CONFIG.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit our Instagram page"
                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[#0E7C86] hover:bg-[#FFFFFF] transition-colors"
              >
                <Instagram className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href={CLINIC_CONFIG.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit our Facebook page"
                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[#0E7C86] hover:bg-[#FFFFFF] transition-colors"
              >
                <Facebook className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href={CLINIC_CONFIG.socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit our YouTube channel"
                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[#0E7C86] hover:bg-[#FFFFFF] transition-colors"
              >
                <Youtube className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* b) Header: clinic name, nav (Home, About, Services, Our team, Testimonials, Contact), coral Book appointment button */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-xs border-b border-[#0B2B3A]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4 sm:gap-6">
          {/* Zone 1: Brand Title (single line) */}
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, 'home')}
            className="text-lg sm:text-2xl font-extrabold text-[#0B2B3A] tracking-tight whitespace-nowrap shrink-0"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {CLINIC_CONFIG.shortName}
          </a>

          {/* Zone 2: Primary Desktop Navigation */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-6 xl:gap-7">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href.replace('#', ''))}
                className="text-[16px] font-semibold text-[#0B2B3A] hover:text-[#0E7C86] underline-offset-8 hover:underline transition-colors whitespace-nowrap shrink-0 py-2"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: Coral Book appointment CTA + Mobile/Tablet Hamburger */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onBookClick()}
              className="hidden sm:inline-flex btn-coral whitespace-nowrap shrink-0"
            >
              <Calendar className="w-4 h-4 text-[#0B2B3A] shrink-0" aria-hidden="true" />
              <span>Book appointment</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="lg:hidden min-w-[44px] min-h-[44px] rounded-xl border border-[#0B2B3A]/20 inline-flex items-center justify-center text-[#0B2B3A] hover:bg-[#E6F4F1] transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-[#0B2B3A]" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6 text-[#0B2B3A]" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Dropdown Navigation */}
        {mobileMenuOpen && (
          <nav
            id="mobile-nav-drawer"
            aria-label="Mobile navigation"
            className="lg:hidden bg-[#FFFFFF] border-b border-[#0B2B3A]/15 px-4 pt-3 pb-6 space-y-2 shadow-lg max-h-[calc(100dvh-4rem)] overflow-y-auto"
          >
            <div className="pb-2 mb-2 border-b border-[#E6F4F1] caption-text flex items-center gap-2 text-[#0B2B3A]">
              <Clock className="w-4 h-4 text-[#0E7C86] shrink-0" aria-hidden="true" />
              <span>{CLINIC_CONFIG.workingHours.topBarSummary}</span>
            </div>

            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href.replace('#', ''))}
                className="block px-4 py-3 rounded-xl text-[17px] font-bold text-[#0B2B3A] hover:bg-[#E6F4F1] transition-colors"
              >
                {item.label}
              </a>
            ))}

            <div className="pt-3 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onBookClick();
                }}
                className="btn-coral w-full"
              >
                <Calendar className="w-5 h-5 text-[#0B2B3A]" aria-hidden="true" />
                <span>Book appointment</span>
              </button>
              <a
                href={`tel:${CLINIC_CONFIG.phoneTel}`}
                className="btn-teal-outline w-full text-center"
              >
                <Phone className="w-5 h-5 text-[#0E7C86]" aria-hidden="true" />
                <span>Call {CLINIC_CONFIG.phoneDisplay}</span>
              </a>
            </div>
          </nav>
        )}
      </header>
    </>
  );
};
