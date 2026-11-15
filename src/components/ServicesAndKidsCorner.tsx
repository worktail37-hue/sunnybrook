import React, { useState } from 'react';
import { Calendar, Clock, Users, Smile, CheckCircle2 } from 'lucide-react';
import { CLINIC_CONFIG, ClinicService } from '../config/clinicConfig';
import { Reveal } from './Reveal';
import { PhotoSlot } from './PhotoSlot';
import { InsuranceCostEstimatorChart } from './InsuranceCostEstimatorChart';
import { FirstVisitGuide } from './FirstVisitGuide';

interface ServicesAndKidsCornerProps {
  onSelectServiceForBooking: (serviceName: string) => void;
}

export const ServicesAndKidsCorner: React.FC<ServicesAndKidsCornerProps> = ({
  onSelectServiceForBooking,
}) => {
  const [activeServiceId, setActiveServiceId] = useState<string>(
    CLINIC_CONFIG.services[0].id
  );

  const activeService: ClinicService =
    CLINIC_CONFIG.services.find((s) => s.id === activeServiceId) ||
    CLINIC_CONFIG.services[0];

  return (
    <>
      {/* g) Services: numbered list 01 to 07. Hover (desktop) or tap (mobile) swaps image and short description with 0.3s crossfade */}
      <section
        id="services"
        aria-labelledby="services-heading"
        className="bg-[#FFFFFF] py-16 lg:py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <Reveal>
            <div className="max-w-3xl space-y-3">
              <p className="text-[16px] font-bold text-[#0E7C86]">
                Everyday &amp; specialist dental care
              </p>
              <h2 id="services-heading">
                Complete treatments for <span className="heading-highlight">every</span> generation
              </h2>
              <p className="text-[#0B2B3A]">
                Tap or hover on any treatment below to see how we keep your visit comfortable, then book directly with that service preselected.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Numbered Service List 01–07 */}
            <div className="lg:col-span-6 space-y-3" role="listbox" aria-label="Dental services">
              {CLINIC_CONFIG.services.map((service) => {
                const isSelected = service.id === activeService.id;
                return (
                  <div
                    key={service.id}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveServiceId(service.id)}
                    className={`rounded-2xl border transition-colors duration-200 p-4 sm:p-5 ${
                      isSelected
                        ? 'bg-[#E6F4F1] border-[#0E7C86]'
                        : 'bg-[#FFFFFF] border-[#0B2B3A]/12 hover:bg-[#E6F4F1]/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveServiceId(service.id)}
                        className="text-left flex items-baseline gap-3.5 min-h-[44px] flex-1"
                      >
                        <span className="text-xl font-extrabold text-[#0E7C86] tabular-nums shrink-0">
                          {service.number}
                        </span>
                        <div>
                          <h3 className="text-[20px] sm:text-[22px] font-bold text-[#0B2B3A]">
                            {service.name}
                          </h3>
                          {/* Mobile inline preview when tapped */}
                          {isSelected && (
                            <p className="mt-2 text-[#0B2B3A] lg:hidden">
                              {service.shortDescription}
                            </p>
                          )}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectServiceForBooking(service.name)}
                        className={`shrink-0 whitespace-nowrap ${
                          isSelected ? 'btn-coral' : 'btn-teal-outline'
                        } !py-2.5 !px-4 !min-h-[44px]`}
                        aria-label={`Book appointment for ${service.name}`}
                      >
                        <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Book this</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Sticky Image & Description Preview Card with 0.3s Crossfade */}
            <div className="lg:col-span-6 lg:sticky lg:top-28">
              <div className="bg-[#E6F4F1] rounded-3xl p-5 sm:p-7 border border-[#0E7C86]/25">
                {/* 0.3s crossfade stack of service images */}
                <div className="relative rounded-2xl overflow-hidden bg-[#FFFFFF] aspect-[720/500]">
                  {CLINIC_CONFIG.services.map((service) => {
                    const isCurrent = service.id === activeService.id;
                    return (
                      <div
                        key={service.id}
                        aria-hidden={!isCurrent}
                        className="absolute inset-0 transition-opacity duration-300 ease-out"
                        style={{
                          opacity: isCurrent ? 1 : 0,
                          pointerEvents: isCurrent ? 'auto' : 'none',
                        }}
                      >
                        <PhotoSlot
                          src={service.imageUrl}
                          alt={service.imageAlt}
                          width={720}
                          height={500}
                          placeholderComment={service.imagePlaceholderComment}
                          className="h-full border-0"
                          imgClassName="h-full"
                          showGuideCaption={false}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Crossfading text details */}
                <div className="mt-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[16px] font-extrabold text-[#0B2B3A]">
                      Service {activeService.number} · {activeService.name}
                    </span>
                    <span className="caption-text text-[#0B2B3A] font-semibold">
                      Typical time: {activeService.typicalDuration}
                    </span>
                  </div>

                  <p className="text-[#0B2B3A] font-semibold text-[18px]">
                    {activeService.shortDescription}
                  </p>

                  <div className="bg-[#FFFFFF] rounded-xl p-4 border border-[#0E7C86]/15 space-y-2">
                    <p className="text-[#0B2B3A] text-[16px]">
                      <span className="font-bold">Comfort note:</span> {activeService.gentleNote}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 pt-1 caption-text text-[#0B2B3A]">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#0E7C86]" aria-hidden="true" />
                        <span>Ideal for: {activeService.idealFor}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#0E7C86]" aria-hidden="true" />
                        <span>Duration: {activeService.typicalDuration}</span>
                      </span>
                    </div>
                  </div>

                  <p className="caption-text text-[#0B2B3A]">
                    <span className="font-semibold">Photo slot:</span>{' '}
                    {activeService.imagePlaceholderComment.replace('REPLACE PHOTO: ', '')}
                  </p>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectServiceForBooking(activeService.name)}
                      className="btn-coral w-full sm:w-auto"
                    >
                      <Calendar className="w-5 h-5 text-[#0B2B3A]" aria-hidden="true" />
                      <span>Book {activeService.name.toLowerCase()}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive D3.js Dental Treatment Cost & Insurance Plan Estimator */}
          <Reveal delayMs={100}>
            <InsuranceCostEstimatorChart
              activeServiceId={activeService.id}
              onSelectService={(serviceId) => setActiveServiceId(serviceId)}
              onBookService={(serviceName) => onSelectServiceForBooking(serviceName)}
            />
          </Reveal>
        </div>
      </section>

      {/* h) Kids corner: friendly section for children and parents (what to expect at first visit, gentle reassurance), with child-friendly images */}
      <section
        id="kids-corner"
        aria-labelledby="kids-heading"
        className="bg-[#E6F4F1] py-16 lg:py-24 border-y border-[#0E7C86]/15"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <Reveal>
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 text-[#0B2B3A] font-bold text-[16px]">
                <Smile className="w-5 h-5 text-[#0E7C86]" aria-hidden="true" />
                <span>Kids corner · For parents &amp; young children</span>
              </div>

              <h2 id="kids-heading">
                {CLINIC_CONFIG.kidsCorner.headingPrefix}{' '}
                <span className="heading-highlight">
                  {CLINIC_CONFIG.kidsCorner.headingHighlight}
                </span>{' '}
                {CLINIC_CONFIG.kidsCorner.headingSuffix}
              </h2>

              <p className="text-[#0B2B3A]">{CLINIC_CONFIG.kidsCorner.intro}</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left: 4 Gentle Reassurance Cards for Parents */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {CLINIC_CONFIG.kidsCorner.whatToExpect.map((item, idx) => (
                <Reveal key={item.title} delayMs={idx * 70}>
                  <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#0E7C86]/15 h-full flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#E6F4F1] flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-[#0E7C86]" aria-hidden="true" />
                      </div>
                      <h3 className="text-[20px] font-bold text-[#0B2B3A]">
                        {item.title}
                      </h3>
                      <p className="text-[#0B2B3A] text-[16px]">{item.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}

              <div className="sm:col-span-2 pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onSelectServiceForBooking('Child dental check-ups')}
                  className="btn-coral"
                >
                  <Calendar className="w-5 h-5 text-[#0B2B3A]" aria-hidden="true" />
                  <span>Book your child’s happy first visit</span>
                </button>

                <a
                  href="#first-visit-guide"
                  className="btn-teal-outline"
                >
                  <span>Open parent checklist &amp; tips</span>
                </a>
              </div>
            </div>

            {/* Right: 2 Child-Friendly Image Cards */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {CLINIC_CONFIG.kidsCorner.images.map((img, idx) => (
                <Reveal key={img.url} delayMs={idx * 100}>
                  <div className="bg-[#FFFFFF] rounded-2xl overflow-hidden border border-[#0E7C86]/20 flex flex-col h-full">
                    <PhotoSlot
                      src={img.url}
                      alt={img.alt}
                      width={640}
                      height={480}
                      placeholderComment={img.placeholderComment}
                      className="border-0 border-b border-[#0E7C86]/15"
                      imgClassName="aspect-[4/3]"
                    />
                    <div className="p-4">
                      <p className="text-[16px] font-semibold text-[#0B2B3A]">
                        {img.caption}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive First Visit Guide for Parents (Checklist, Age-by-Age Tips & Positive Language Guide) */}
      <FirstVisitGuide onBookFirstVisit={onSelectServiceForBooking} />
    </>
  );
};
