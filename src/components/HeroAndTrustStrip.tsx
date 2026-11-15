import React from 'react';
import { Phone, Calendar, ShieldCheck, HeartHandshake, Sparkles, Star } from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicConfig';
import { HeroPhotoReveal, Reveal } from './Reveal';
import { PhotoSlot } from './PhotoSlot';

interface HeroAndTrustStripProps {
  onBookClick: () => void;
}

export const HeroAndTrustStrip: React.FC<HeroAndTrustStripProps> = ({ onBookClick }) => {
  const badgeIcons = [ShieldCheck, HeartHandshake, Sparkles, Star];

  return (
    <>
      {/* c) Hero: headline with one highlighted word, one short sentence, two buttons, smiling photo in a rounded card, and a small trust card */}
      <section
        id="home"
        aria-labelledby="hero-heading"
        className="bg-[#FFFFFF] pt-8 pb-14 md:py-16 lg:py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Headline (readable immediately, never overlaps photo) */}
            <div className="lg:col-span-6 space-y-6">
              <p className="text-[16px] font-bold text-[#0E7C86] tracking-normal">
                Family, kids &amp; general dental clinic in {CLINIC_CONFIG.address.neighborhood}
              </p>

              <h1 id="hero-heading" className="text-[#0B2B3A]">
                Healthy smiles and <span className="heading-highlight">gentle</span> dental care for your whole family
              </h1>

              <p className="text-[#0B2B3A] max-w-xl text-[18px] leading-relaxed">
                From your child’s first happy check-up to calm, unhurried toothache relief for adults and seniors, we listen first and go at your pace.
              </p>

              {/* Two primary action buttons: Coral "Book appointment" (Deep navy bold text) and outlined teal "Call us" */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  type="button"
                  onClick={onBookClick}
                  className="btn-coral whitespace-nowrap"
                >
                  <Calendar className="w-5 h-5 text-[#0B2B3A] shrink-0" aria-hidden="true" />
                  <span>Book appointment</span>
                </button>

                <a
                  href={`tel:${CLINIC_CONFIG.phoneTel}`}
                  className="btn-teal-outline whitespace-nowrap"
                >
                  <Phone className="w-5 h-5 text-[#0E7C86] shrink-0" aria-hidden="true" />
                  <span>Call us: {CLINIC_CONFIG.phoneDisplay}</span>
                </a>
              </div>

              {/* Small Trust Card (rating and years of care) placed cleanly below CTAs so nothing overlaps */}
              <div className="pt-2">
                <div className="inline-flex flex-wrap items-center gap-6 bg-[#E6F4F1] border border-[#0E7C86]/25 rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#FFFFFF] flex items-center justify-center text-[#0E7C86] font-extrabold text-lg">
                      <Star className="w-5 h-5 fill-[#0E7C86] text-[#0E7C86]" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="font-extrabold text-[#0B2B3A] text-[18px] leading-tight tabular-nums">
                        {CLINIC_CONFIG.stats.googleRating} / 5 Rating
                      </div>
                      <div className="caption-text text-[#0B2B3A]">
                        Trusted by {CLINIC_CONFIG.stats.reviewCountDisplay}
                      </div>
                    </div>
                  </div>

                  <div className="h-9 w-px bg-[#0B2B3A]/15 hidden sm:block" aria-hidden="true" />

                  <div>
                    <div className="font-extrabold text-[#0B2B3A] text-[18px] leading-tight tabular-nums">
                      {CLINIC_CONFIG.stats.yearsOfCare}+ Years of Care
                    </div>
                    <div className="caption-text text-[#0B2B3A]">
                      Same-day urgent toothache slots
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Smiling photo in a rounded card (scales 0.94 -> 1 and fades in 0.8s once) */}
            <div className="lg:col-span-6">
              <HeroPhotoReveal>
                <PhotoSlot
                  src="/images/hero-family-smile.webp"
                  alt="Relaxed mother and young child smiling warmly in our bright, welcoming dental clinic reception"
                  width={800}
                  height={600}
                  priority={true}
                  placeholderComment="REPLACE PHOTO: Real photo of a relaxed parent and smiling child in your sunlit reception area or talking with your friendly dentist (no masks or dental instruments)."
                  className="rounded-3xl shadow-sm"
                  imgClassName="aspect-[4/3]"
                />
              </HeroPhotoReveal>
            </div>
          </div>
        </div>
      </section>

      {/* d) Trust strip (replaces partner logos): 4 small badges, NO third-party company logos */}
      <section
        aria-label="Clinic trust highlights"
        className="bg-[#E6F4F1] border-y border-[#0E7C86]/15 py-8"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {CLINIC_CONFIG.trustStripBadges.map((badge, index) => {
                const IconComponent = badgeIcons[index % badgeIcons.length];
                return (
                  <div
                    key={badge.id}
                    className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#0E7C86]/15 flex items-start gap-4"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#E6F4F1] flex items-center justify-center shrink-0">
                      <IconComponent className="w-5 h-5 text-[#0E7C86]" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-[18px] font-bold text-[#0B2B3A] leading-snug">
                        {badge.title}
                      </h2>
                      <p className="caption-text text-[#0B2B3A] mt-1">
                        {badge.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
};
