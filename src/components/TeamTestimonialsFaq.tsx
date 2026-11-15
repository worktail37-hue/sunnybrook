import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Star,
  ChevronDown,
  GraduationCap,
  Award,
  Stethoscope,
  Clock,
  Globe,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicConfig';
import { Reveal } from './Reveal';
import { PhotoSlot } from './PhotoSlot';

export const TeamTestimonialsFaq: React.FC = () => {
  // Selected doctor filter for the detailed biography section ('all' shows all 4 detailed bios by default)
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('all');

  // Testimonials state (carousel with prev/next, touch swipe, and pausable >6s autoplay)
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // FAQ state (first item open by default for immediate helpfulness)
  const [openFaqId, setOpenFaqId] = useState<string | null>(CLINIC_CONFIG.faqs[0].id);

  const handleFocusDoctorBio = (doctorId: string) => {
    setSelectedDoctorFilter(doctorId);
    const bioElement = document.getElementById(`bio-${doctorId}`) || document.getElementById('dentist-bios');
    if (bioElement) {
      bioElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const visibleDoctorsForBios =
    selectedDoctorFilter === 'all'
      ? CLINIC_CONFIG.doctors
      : CLINIC_CONFIG.doctors.filter((doc) => doc.id === selectedDoctorFilter);

  const totalReviews = CLINIC_CONFIG.testimonials.length;

  const nextReview = () => {
    setCurrentReviewIndex((prev) => (prev + 1) % totalReviews);
  };

  const prevReview = () => {
    setCurrentReviewIndex((prev) => (prev - 1 + totalReviews) % totalReviews);
  };

  // Autoplay slower than 6 seconds (7500ms), paused on hover/focus/button or prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches || isPaused) return;

    const timer = window.setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % totalReviews);
    }, 7500);

    return () => window.clearInterval(timer);
  }, [isPaused, totalReviews]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 45) {
      prevReview();
    } else if (deltaX < -45) {
      nextReview();
    }
    touchStartX.current = null;
  };

  const activeReview = CLINIC_CONFIG.testimonials[currentReviewIndex];

  return (
    <>
      {/* i) Team: 4 doctor cards. Photo is ALWAYS visible (never hidden behind hover). Show name, qualification and specialty. */}
      <section
        id="team"
        aria-labelledby="team-heading"
        className="bg-[#FFFFFF] py-16 lg:py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <Reveal>
            <div className="max-w-3xl space-y-3">
              <p className="text-[16px] font-bold text-[#0E7C86]">
                Meet our registered dentists
              </p>
              <h2 id="team-heading">
                Friendly <span className="heading-highlight">doctors</span> who take time to listen
              </h2>
              <p className="text-[#0B2B3A]">
                You will always see a qualified BDS or MDS dentist who explains your options clearly and remembers what helps you feel comfortable.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {CLINIC_CONFIG.doctors.map((doc, idx) => (
              <Reveal key={doc.id} delayMs={idx * 80}>
                <article className="bg-[#E6F4F1] rounded-2xl overflow-hidden border border-[#0E7C86]/20 flex flex-col h-full">
                  {/* Photo is ALWAYS visible */}
                  <PhotoSlot
                    src={doc.photoUrl}
                    alt={doc.photoAlt}
                    width={480}
                    height={560}
                    placeholderComment={doc.photoPlaceholderComment}
                    className="border-0 border-b border-[#0E7C86]/15"
                    imgClassName="aspect-[6/7]"
                  />

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="text-[22px] font-bold text-[#0B2B3A]">
                        {doc.name}
                      </h3>
                      <p className="caption-text font-bold text-[#0B2B3A]">
                        {doc.qualification}
                      </p>
                      <p className="text-[16px] font-semibold text-[#0B2B3A] pt-1">
                        {doc.specialty}
                      </p>
                      <p className="caption-text text-[#0B2B3A]">
                        {doc.experienceNote}
                      </p>
                    </div>

                    <blockquote className="pt-3 border-t border-[#0B2B3A]/10 caption-text italic text-[#0B2B3A]">
                      “{doc.reassuranceQuote}”
                    </blockquote>
                    <button
                      type="button"
                      onClick={() => handleFocusDoctorBio(doc.id)}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#0E7C86] text-[#0B2B3A] text-[16px] font-bold hover:bg-[#0E7C86] hover:text-[#FFFFFF] transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <GraduationCap className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Read full bio & qualifications</span>
                    </button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          {/* Detailed Dentist Biographies, Qualifications & Clinical Experience Section */}
          <div
            id="dentist-bios"
            aria-labelledby="dentist-bios-heading"
            className="pt-8 border-t border-[#0E7C86]/20 space-y-10 scroll-mt-24"
          >
            <Reveal>
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="max-w-3xl space-y-3">
                  <p className="text-[16px] font-bold text-[#0E7C86]">
                    In-depth credentials & clinical background
                  </p>
                  <h3
                    id="dentist-bios-heading"
                    className="text-[28px] sm:text-[36px] font-extrabold text-[#0B2B3A] leading-tight"
                  >
                    Detailed dentist <span className="heading-highlight">biographies</span> and experience
                  </h3>
                  <p className="text-[#0B2B3A]">
                    Get to know each dentist’s academic training, State Dental Council registration, years of chairside experience, and the gentle techniques they use to care for children, adults, and seniors.
                  </p>
                </div>

                {/* Filter buttons to view all bios or focus on a single dentist */}
                <div
                  role="group"
                  aria-label="Filter dentist biographies"
                  className="flex flex-wrap items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedDoctorFilter('all')}
                    aria-pressed={selectedDoctorFilter === 'all'}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-[16px] font-bold transition-colors border ${
                      selectedDoctorFilter === 'all'
                        ? 'bg-[#0E7C86] text-[#FFFFFF] border-[#0E7C86]'
                        : 'bg-[#E6F4F1] text-[#0B2B3A] border-[#0E7C86]/25 hover:border-[#0E7C86]'
                    }`}
                  >
                    All dentists ({CLINIC_CONFIG.doctors.length})
                  </button>
                  {CLINIC_CONFIG.doctors.map((doc) => {
                    const isSelected = selectedDoctorFilter === doc.id;
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setSelectedDoctorFilter(doc.id)}
                        aria-pressed={isSelected}
                        className={`min-h-[44px] px-4 py-2 rounded-xl text-[16px] font-bold transition-colors border ${
                          isSelected
                            ? 'bg-[#0E7C86] text-[#FFFFFF] border-[#0E7C86]'
                            : 'bg-[#E6F4F1] text-[#0B2B3A] border-[#0E7C86]/25 hover:border-[#0E7C86]'
                        }`}
                      >
                        {doc.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Reveal>

            <div className="space-y-8">
              {visibleDoctorsForBios.map((doc, idx) => (
                <Reveal key={doc.id} delayMs={idx * 70}>
                  <article
                    id={`bio-${doc.id}`}
                    aria-labelledby={`bio-heading-${doc.id}`}
                    className="bg-[#E6F4F1] rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#0E7C86]/25 scroll-mt-28"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Left Column: Portrait + Quick Credentials Summary */}
                      <div className="lg:col-span-4 space-y-5">
                        <div className="rounded-2xl overflow-hidden border border-[#0E7C86]/20 bg-[#FFFFFF]">
                          <PhotoSlot
                            src={doc.photoUrl}
                            alt={doc.photoAlt}
                            width={480}
                            height={560}
                            placeholderComment={doc.photoPlaceholderComment}
                            className="border-0"
                            imgClassName="aspect-[6/7]"
                          />
                        </div>

                        <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#0E7C86]/20 space-y-3.5">
                          <div className="flex items-start gap-3">
                            <Award className="w-5 h-5 text-[#0E7C86] shrink-0 mt-0.5" aria-hidden="true" />
                            <div>
                              <div className="caption-text font-bold text-[#0B2B3A]">
                                Clinical experience
                              </div>
                              <div className="text-[17px] font-bold text-[#0B2B3A]">
                                {doc.yearsExperience} years of dental practice
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 pt-3 border-t border-[#E6F4F1]">
                            <Clock className="w-5 h-5 text-[#0E7C86] shrink-0 mt-0.5" aria-hidden="true" />
                            <div>
                              <div className="caption-text font-bold text-[#0B2B3A]">
                                Consultation schedule
                              </div>
                              <div className="caption-text text-[#0B2B3A]">
                                {doc.consultationDays}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 pt-3 border-t border-[#E6F4F1]">
                            <Globe className="w-5 h-5 text-[#0E7C86] shrink-0 mt-0.5" aria-hidden="true" />
                            <div>
                              <div className="caption-text font-bold text-[#0B2B3A]">
                                Languages spoken
                              </div>
                              <div className="caption-text text-[#0B2B3A]">
                                {doc.languagesSpoken.join(' · ')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Detailed Biography, Qualifications & Clinical Focus */}
                      <div className="lg:col-span-8 space-y-6">
                        <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#0E7C86]/20 space-y-6">
                          {/* Doctor Header & Registration */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E6F4F1]">
                            <div className="space-y-1.5">
                              <div className="caption-text font-bold text-[#0E7C86]">
                                {doc.specialty}
                              </div>
                              <h4
                                id={`bio-heading-${doc.id}`}
                                className="text-[24px] sm:text-[28px] font-extrabold text-[#0B2B3A]"
                              >
                                {doc.name}
                              </h4>
                              <p className="text-[17px] font-bold text-[#0B2B3A]">
                                {doc.qualification}
                              </p>
                            </div>

                            <div className="bg-[#E6F4F1] rounded-xl px-4 py-2.5 border border-[#0E7C86]/20 shrink-0 self-start">
                              <div className="caption-text font-bold text-[#0B2B3A]">
                                {doc.registrationNumber}
                              </div>
                              <div className="caption-text text-[#0B2B3A]">
                                Verified dental clinician
                              </div>
                            </div>
                          </div>

                          {/* Detailed Biography Paragraph */}
                          <div className="space-y-2">
                            <h5 className="text-[18px] font-bold text-[#0B2B3A]">
                              About {doc.name}
                            </h5>
                            <p className="text-[#0B2B3A] leading-relaxed">
                              {doc.detailedBio}
                            </p>
                          </div>

                          {/* Qualifications & Academic Training + Clinical Focus Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            {/* Qualifications & Training */}
                            <div className="bg-[#E6F4F1]/60 rounded-2xl p-5 border border-[#0E7C86]/15 space-y-3">
                              <div className="flex items-center gap-2.5">
                                <GraduationCap className="w-5 h-5 text-[#0E7C86] shrink-0" aria-hidden="true" />
                                <h5 className="text-[18px] font-bold text-[#0B2B3A]">
                                  Qualifications & training
                                </h5>
                              </div>
                              <ul className="space-y-2.5">
                                {doc.educationAndTraining.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2.5 caption-text text-[#0B2B3A]">
                                    <CheckCircle2 className="w-4 h-4 text-[#0E7C86] shrink-0 mt-1" aria-hidden="true" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Clinical Experience & Focus Areas */}
                            <div className="bg-[#E6F4F1]/60 rounded-2xl p-5 border border-[#0E7C86]/15 space-y-3">
                              <div className="flex items-center gap-2.5">
                                <Stethoscope className="w-5 h-5 text-[#0E7C86] shrink-0" aria-hidden="true" />
                                <h5 className="text-[18px] font-bold text-[#0B2B3A]">
                                  Clinical experience & focus
                                </h5>
                              </div>
                              <ul className="space-y-2.5">
                                {doc.clinicalFocusAreas.map((area, i) => (
                                  <li key={i} className="flex items-start gap-2.5 caption-text text-[#0B2B3A]">
                                    <CheckCircle2 className="w-4 h-4 text-[#0E7C86] shrink-0 mt-1" aria-hidden="true" />
                                    <span>{area}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Reassurance Quote & Direct Booking CTA */}
                          <div className="pt-4 border-t border-[#E6F4F1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <blockquote className="caption-text italic text-[#0B2B3A] max-w-xl">
                              "{doc.reassuranceQuote}"
                            </blockquote>

                            <a
                              href="#book"
                              className="min-h-[48px] px-6 py-3 rounded-xl bg-[#FF7A59] text-[#0B2B3A] font-bold text-[16px] hover:opacity-95 transition-opacity inline-flex items-center justify-center gap-2 shrink-0"
                            >
                              <Calendar className="w-4 h-4 text-[#0B2B3A]" aria-hidden="true" />
                              <span>Book with {doc.name}</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* j) Testimonials: carousel of 5 reviews from config file, marked as sample content until replaced. Static 4.8 rating. */}
      <section
        id="testimonials"
        aria-labelledby="testimonials-heading"
        className="bg-[#E6F4F1] py-16 lg:py-24 border-y border-[#0E7C86]/15"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <p className="text-[16px] font-bold text-[#0B2B3A]">
                  Kind words from families
                </p>
                <h2 id="testimonials-heading">
                  Why <span className="heading-highlight">parents</span> and nervous patients trust us
                </h2>
              </div>

              {/* Static 4.8 Rating Card */}
              <div className="bg-[#FFFFFF] rounded-2xl px-5 py-4 border border-[#0E7C86]/20 flex items-center gap-3.5 shrink-0">
                <div className="w-11 h-11 rounded-xl bg-[#E6F4F1] flex items-center justify-center">
                  <Star className="w-6 h-6 fill-[#0E7C86] text-[#0E7C86]" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#0B2B3A] tabular-nums">
                    {CLINIC_CONFIG.stats.googleRating} out of 5
                  </div>
                  <div className="caption-text text-[#0B2B3A]">
                    Static rating · Sample reviews below
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Accessible Carousel Container */}
          <Reveal delayMs={80}>
            <div
              className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-10 border border-[#0E7C86]/25"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              role="region"
              aria-roledescription="carousel"
              aria-label="Patient testimonials"
            >
              {/* Sample placeholder banner so visitors and owner know these are sample reviews */}
              <div className="mb-6 pb-4 border-b border-[#E6F4F1] flex flex-wrap items-center justify-between gap-2">
                <span className="caption-text font-bold text-[#0E7C86]">
                  Sample testimonial {currentReviewIndex + 1} of {totalReviews} (Replace in src/config/clinicConfig.ts)
                </span>
                <span className="caption-text text-[#0B2B3A]">
                  {activeReview.visitContext}
                </span>
              </div>

              <div aria-live="polite" className="min-h-[160px] flex flex-col justify-between space-y-6">
                <blockquote className="text-xl sm:text-2xl font-bold text-[#0B2B3A] leading-relaxed">
                  “{activeReview.quote}”
                </blockquote>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div>
                    <div className="font-extrabold text-[#0B2B3A] text-[18px]">
                      {activeReview.patientName}
                    </div>
                    <div className="caption-text text-[#0B2B3A]">
                      {activeReview.dateLabel}
                    </div>
                  </div>

                  {/* Carousel Controls: Prev, Pause/Play, Next */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={prevReview}
                      aria-label="Previous testimonial"
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-[#0B2B3A]/20 inline-flex items-center justify-center text-[#0B2B3A] hover:bg-[#E6F4F1] transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPaused((p) => !p)}
                      aria-label={isPaused ? 'Resume testimonial rotation' : 'Pause testimonial rotation'}
                      className="min-w-[44px] min-h-[44px] px-3 rounded-xl border border-[#0B2B3A]/20 inline-flex items-center justify-center gap-1.5 caption-text font-bold text-[#0B2B3A] hover:bg-[#E6F4F1] transition-colors"
                    >
                      {isPaused ? (
                        <>
                          <Play className="w-4 h-4 text-[#0E7C86]" aria-hidden="true" />
                          <span>Play</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4 text-[#0E7C86]" aria-hidden="true" />
                          <span>Pause</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={nextReview}
                      aria-label="Next testimonial"
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-[#0B2B3A]/20 inline-flex items-center justify-center text-[#0B2B3A] hover:bg-[#E6F4F1] transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* k) FAQ: 5 items (first visit, children, pain, payment and insurance, emergencies) */}
      <section
        id="faq"
        aria-labelledby="faq-heading"
        className="bg-[#FFFFFF] py-16 lg:py-24"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <Reveal>
            <div className="space-y-3">
              <p className="text-[16px] font-bold text-[#0E7C86]">
                Common questions answered clearly
              </p>
              <h2 id="faq-heading">
                Helpful answers before your <span className="heading-highlight">first</span> visit
              </h2>
              <p className="text-[#0B2B3A]">
                Have another question? Call us on {CLINIC_CONFIG.phoneDisplay} and our reception team will gladly help.
              </p>
            </div>
          </Reveal>

          <div className="space-y-4">
            {CLINIC_CONFIG.faqs.map((faq, idx) => {
              const isOpen = openFaqId === faq.id;
              return (
                <Reveal key={faq.id} delayMs={idx * 60}>
                  <div className="rounded-2xl border border-[#0B2B3A]/15 bg-[#FFFFFF] overflow-hidden">
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${faq.id}`}
                        id={`faq-btn-${faq.id}`}
                        className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-[#E6F4F1]/50 transition-colors min-h-[56px]"
                      >
                        <span className="text-[19px] sm:text-[20px] font-bold text-[#0B2B3A]">
                          <span className="text-[#0E7C86] mr-2">{faq.category}:</span>
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-[#0E7C86] shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </h3>
                    {isOpen && (
                      <div
                        id={`faq-panel-${faq.id}`}
                        role="region"
                        aria-labelledby={`faq-btn-${faq.id}`}
                        className="px-6 pb-6 pt-2 border-t border-[#E6F4F1] bg-[#E6F4F1]/35"
                      >
                        <p className="text-[#0B2B3A]">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};
