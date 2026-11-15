import React from 'react';
import { Phone, Calendar, MapPin, Mail, Clock } from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicConfig';

interface FooterAndMobileBarProps {
  onNavigateHome: (sectionId?: string) => void;
  onOpenPrivacyPolicy: () => void;
  onBookClick: () => void;
  showMobileStickyBar?: boolean;
}

export const FooterAndMobileBar: React.FC<FooterAndMobileBarProps> = ({
  onNavigateHome,
  onOpenPrivacyPolicy,
  onBookClick,
  showMobileStickyBar = true,
}) => {
  const quickLinks = [
    { label: 'Home', id: 'home' },
    { label: 'About our clinic', id: 'about' },
    { label: 'Dental services', id: 'services' },
    { label: 'Kids corner', id: 'kids-corner' },
    { label: 'Our dentists', id: 'team' },
    { label: 'Patient reviews', id: 'testimonials' },
    { label: 'Common questions', id: 'faq' },
    { label: 'Book or contact us', id: 'contact' },
  ];

  return (
    <>
      {/* m) Footer: Deep navy (#0B2B3A) background with white text, quick links, contact details, Privacy Policy link.
          No admin link in public navigation or footer. */}
      <footer
        aria-label="Clinic footer"
        className={`bg-[#0B2B3A] text-[#FFFFFF] pt-16 ${
          showMobileStickyBar ? 'pb-36 md:pb-24' : 'pb-24'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#FFFFFF]/15">
            {/* Column 1: Clinic Info */}
            <div className="lg:col-span-5 space-y-4">
              <div
                className="text-2xl font-extrabold text-[#FFFFFF] tracking-wide"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {CLINIC_CONFIG.clinicName}
              </div>
              <p className="text-[#FFFFFF]/90 text-[17px] max-w-md leading-relaxed">
                {CLINIC_CONFIG.tagline}
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onBookClick}
                  className="btn-coral"
                >
                  <Calendar className="w-4 h-4 text-[#0B2B3A]" aria-hidden="true" />
                  <span>Book appointment</span>
                </button>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="lg:col-span-3 space-y-4">
              <h2 className="text-[20px] font-bold text-[#FFFFFF]">Quick links</h2>
              <ul className="space-y-2.5">
                {quickLinks.map((link) => (
                  <li key={link.id}>
                    <a
                      href={`#${link.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigateHome(link.id);
                      }}
                      className="text-[#FFFFFF]/90 hover:text-[#E6F4F1] underline-offset-4 hover:underline text-[16px] inline-block py-0.5"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={onOpenPrivacyPolicy}
                    className="text-[#FFFFFF]/90 hover:text-[#E6F4F1] underline-offset-4 hover:underline text-[16px] py-0.5 text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact Details */}
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-[20px] font-bold text-[#FFFFFF]">Contact &amp; hours</h2>
              <ul className="space-y-3 text-[16px] text-[#FFFFFF]/90">
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#E6F4F1] shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <a
                      href={`tel:${CLINIC_CONFIG.phoneTel}`}
                      className="font-bold text-[#FFFFFF] hover:underline"
                    >
                      {CLINIC_CONFIG.phoneDisplay}
                    </a>
                    <div className="text-sm text-[#FFFFFF]/80">Tap to call reception</div>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#E6F4F1] shrink-0 mt-1" aria-hidden="true" />
                  <span className="text-[#FFFFFF]/90">{CLINIC_CONFIG.address.fullDisplay}</span>
                </li>

                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#E6F4F1] shrink-0 mt-1" aria-hidden="true" />
                  <span className="text-[#FFFFFF]/90">
                    {CLINIC_CONFIG.workingHours.topBarSummary}
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#E6F4F1] shrink-0 mt-1" aria-hidden="true" />
                  <a
                    href={`mailto:${CLINIC_CONFIG.email}`}
                    className="text-[#FFFFFF] hover:underline break-all"
                  >
                    {CLINIC_CONFIG.email}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Legal Row */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#FFFFFF]/85">
            <div>
              © {new Date().getFullYear()} {CLINIC_CONFIG.clinicName}. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={onOpenPrivacyPolicy}
                className="text-[#FFFFFF] underline hover:text-[#E6F4F1] min-h-[44px] inline-flex items-center"
              >
                Privacy Policy &amp; Data Protection
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* n) Mobile only: sticky bottom bar with "Call" and "Book" buttons, at least 48px tall */}
      {showMobileStickyBar && (
        <div
          role="region"
          aria-label="Quick mobile actions"
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FFFFFF] border-t border-[#0B2B3A]/15 px-3 py-2 shadow-lg"
        >
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`tel:${CLINIC_CONFIG.phoneTel}`}
              className="btn-teal !min-h-[48px] !py-2.5 !px-3 text-center whitespace-nowrap"
            >
              <Phone className="w-4 h-4 text-[#FFFFFF] shrink-0" aria-hidden="true" />
              <span>Call clinic</span>
            </a>

            <button
              type="button"
              onClick={onBookClick}
              className="btn-coral !min-h-[48px] !py-2.5 !px-3 whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 text-[#0B2B3A] shrink-0" aria-hidden="true" />
              <span>Book visit</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
