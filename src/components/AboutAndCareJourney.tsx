import React from 'react';
import { CalendarCheck, SmilePlus, FileCheck2 } from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicConfig';
import { Reveal, CountUpStat } from './Reveal';
import { PhotoSlot } from './PhotoSlot';

export const AboutAndCareJourney: React.FC = () => {
  const journeyIcons = [CalendarCheck, SmilePlus, FileCheck2];

  return (
    <>
      {/* e) About: "Where every smile begins with care", 3 stat counters and 3 image cards */}
      <section
        id="about"
        aria-labelledby="about-heading"
        className="bg-[#FFFFFF] py-16 lg:py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <Reveal>
            <div className="max-w-3xl space-y-4">
              <p className="text-[16px] font-bold text-[#0E7C86]">
                About {CLINIC_CONFIG.clinicName}
              </p>
              <h2 id="about-heading">
                Where every <span className="heading-highlight">smile</span> begins with care
              </h2>
              <p className="text-[#0B2B3A]">
                We built our neighbourhood clinic for real families—parents bringing toddlers for their first check-up, busy adults fitting in a visit after work, and older relatives who value clear explanations and step-free comfort.
              </p>
            </div>
          </Reveal>

          {/* 3 Stat Counters: patients treated, years of care, static 4.8 rating */}
          <Reveal delayMs={80}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#E6F4F1] rounded-2xl p-6 sm:p-8 border border-[#0E7C86]/15">
                <div
                  className="text-4xl sm:text-5xl font-extrabold text-[#0B2B3A] leading-none"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  <CountUpStat target={CLINIC_CONFIG.stats.patientsTreated} suffix="+" />
                </div>
                <h3 className="mt-3 text-[20px] font-bold text-[#0B2B3A]">
                  Patients cared for
                </h3>
                <p className="caption-text text-[#0B2B3A] mt-1">
                  Children, parents and grandparents from across {CLINIC_CONFIG.address.city}
                </p>
              </div>

              <div className="bg-[#E6F4F1] rounded-2xl p-6 sm:p-8 border border-[#0E7C86]/15">
                <div
                  className="text-4xl sm:text-5xl font-extrabold text-[#0B2B3A] leading-none"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  <CountUpStat target={CLINIC_CONFIG.stats.yearsOfCare} suffix=" years" />
                </div>
                <h3 className="mt-3 text-[20px] font-bold text-[#0B2B3A]">
                  Dedicated family practice
                </h3>
                <p className="caption-text text-[#0B2B3A] mt-1">
                  Consistent doctors who remember your family’s dental story
                </p>
              </div>

              <div className="bg-[#E6F4F1] rounded-2xl p-6 sm:p-8 border border-[#0E7C86]/15">
                <div
                  className="text-4xl sm:text-5xl font-extrabold text-[#0B2B3A] leading-none tabular-nums"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {CLINIC_CONFIG.stats.googleRating} / 5
                </div>
                <h3 className="mt-3 text-[20px] font-bold text-[#0B2B3A]">
                  Average patient rating
                </h3>
                <p className="caption-text text-[#0B2B3A] mt-1">
                  Praised for gentle hands, honest advice and punctual visits
                </p>
              </div>
            </div>
          </Reveal>

          {/* 3 Image Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CLINIC_CONFIG.aboutCards.map((card, index) => (
              <Reveal key={card.id} delayMs={index * 100}>
                <article className="bg-[#FFFFFF] rounded-2xl border border-[#0B2B3A]/12 overflow-hidden h-full flex flex-col">
                  <PhotoSlot
                    src={card.imageUrl}
                    alt={card.imageAlt}
                    width={600}
                    height={450}
                    placeholderComment={card.placeholderComment}
                    className="border-0 border-b border-[#0E7C86]/20"
                    imgClassName="aspect-[4/3]"
                  />
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-[#0B2B3A]">{card.title}</h3>
                      <p className="mt-2 text-[#0B2B3A]">{card.description}</p>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* f) Care journey: 3 steps (Book your visit, Meet your dentist, Personalised care).
          Cards on desktop, horizontal scroll-snap carousel on mobile. Purpose: reduce anxiety. */}
      <section
        aria-labelledby="journey-heading"
        className="bg-[#E6F4F1] py-16 lg:py-24 border-y border-[#0E7C86]/15"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <Reveal>
            <div className="max-w-3xl space-y-3">
              <p className="text-[16px] font-bold text-[#0B2B3A]">
                Designed for nervous patients &amp; first-timers
              </p>
              <h2 id="journey-heading">
                Your <span className="heading-highlight">calm</span> three-step care journey
              </h2>
              <p className="text-[#0B2B3A]">
                Knowing what will happen next takes the worry out of visiting the dentist. Here is how every appointment unfolds at our clinic.
              </p>
            </div>
          </Reveal>

          {/* Mobile: swipeable horizontal scroll-snap carousel; Desktop: 3-column grid */}
          <Reveal delayMs={80}>
            <div
              className="flex md:grid md:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 w-full max-w-full no-scrollbar"
              role="region"
              aria-label="Three steps of your dental visit"
            >
              {CLINIC_CONFIG.careJourneySteps.map((step, index) => {
                const StepIcon = journeyIcons[index % journeyIcons.length];
                return (
                  <div
                    key={step.stepNumber}
                    className="snap-center shrink-0 w-[88%] sm:w-[75%] md:w-auto bg-[#FFFFFF] rounded-2xl p-5 sm:p-8 border border-[#0E7C86]/20 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[16px] font-extrabold text-[#0E7C86]">
                          {step.stepNumber}
                        </span>
                        <div className="w-11 h-11 rounded-xl bg-[#E6F4F1] flex items-center justify-center">
                          <StepIcon className="w-5 h-5 text-[#0E7C86]" aria-hidden="true" />
                        </div>
                      </div>

                      <h3 className="text-[#0B2B3A]">{step.title}</h3>
                      <p className="text-[#0B2B3A]">{step.description}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#E6F4F1]">
                      <p className="caption-text font-semibold text-[#0B2B3A]">
                        Promise: {step.reassuranceTag}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="md:hidden caption-text text-[#0B2B3A] text-center mt-1">
              Swipe left or right to see all 3 steps
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
};
