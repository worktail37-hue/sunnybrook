import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  Square,
  RotateCcw,
  Printer,
  Calendar,
  Sparkles,
  MessageCircleHeart,
  Baby,
  Smile,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicConfig';
import { Reveal } from './Reveal';

interface FirstVisitGuideProps {
  onBookFirstVisit?: (serviceName: string) => void;
}

const STORAGE_KEY = 'sunnybrook_first_visit_checklist_v1';

export const FirstVisitGuide: React.FC<FirstVisitGuideProps> = ({
  onBookFirstVisit,
}) => {
  const guide = CLINIC_CONFIG.firstVisitGuide;

  // Interactive checklist state persisted in localStorage
  const [checkedIds, setCheckedIds] = useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors in restricted environments
    }
    return ['chk-morning-slot'];
  });

  // Active age-stage tab
  const [selectedAgeGroupId, setSelectedAgeGroupId] = useState<string>(
    guide.ageGroupTips[0].id
  );

  // Filter checklist by stage ('all', '1–2 days before', 'Morning of visit')
  const [stageFilter, setStageFilter] = useState<string>('all');

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedIds));
    } catch {
      // Ignore storage errors
    }
  }, [checkedIds]);

  const toggleItem = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const resetChecklist = () => {
    setCheckedIds([]);
  };

  const checkAllItems = () => {
    setCheckedIds(guide.checklistItems.map((item) => item.id));
  };

  const handlePrintGuide = () => {
    window.print();
  };

  const handleBookClick = () => {
    if (onBookFirstVisit) {
      onBookFirstVisit('Child dental check-ups');
    } else {
      const contactEl = document.getElementById('contact') || document.getElementById('book');
      contactEl?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const totalItems = guide.checklistItems.length;
  const completedCount = checkedIds.length;
  const progressPercent = Math.round((completedCount / totalItems) * 100);

  const filteredChecklist =
    stageFilter === 'all'
      ? guide.checklistItems
      : guide.checklistItems.filter((item) => item.stage === stageFilter);

  const activeAgeGroup =
    guide.ageGroupTips.find((group) => group.id === selectedAgeGroupId) ||
    guide.ageGroupTips[0];

  return (
    <section
      id="first-visit-guide"
      aria-labelledby="first-visit-guide-heading"
      className="bg-[#FFFFFF] py-16 lg:py-24 border-b border-[#0E7C86]/15 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Header */}
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 text-[#0E7C86] font-bold text-[16px]">
                <Sparkles className="w-5 h-5 text-[#0E7C86]" aria-hidden="true" />
                <span>{guide.eyebrow}</span>
              </div>

              <h2 id="first-visit-guide-heading">
                {guide.headingPrefix}{' '}
                <span className="heading-highlight">{guide.headingHighlight}</span>{' '}
                {guide.headingSuffix}
              </h2>

              <p className="text-[#0B2B3A]">{guide.intro}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handlePrintGuide}
                className="btn-teal-outline !py-2.5 !px-4 !min-h-[44px]"
              >
                <Printer className="w-4 h-4 text-[#0E7C86]" aria-hidden="true" />
                <span>Print checklist</span>
              </button>

              <button
                type="button"
                onClick={handleBookClick}
                className="btn-coral !py-2.5 !px-5 !min-h-[44px]"
              >
                <Calendar className="w-4 h-4 text-[#0B2B3A]" aria-hidden="true" />
                <span>Book child’s first visit</span>
              </button>
            </div>
          </div>
        </Reveal>

        {/* Main 2-Column Interactive Layout: Left = Parent Checklist, Right = Age-by-Age Tips + Words That Help */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column (7 cols): Interactive Parent Preparation Checklist */}
          <div className="lg:col-span-7">
            <Reveal>
              <div className="bg-[#E6F4F1] rounded-3xl p-6 sm:p-8 border border-[#0E7C86]/25 space-y-6">
                {/* Checklist Header & Progress Bar */}
                <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#0E7C86]/20 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[22px] font-bold text-[#0B2B3A]">
                        Parent preparation checklist
                      </h3>
                      <p className="caption-text text-[#0B2B3A]">
                        Tick off each step as you get ready—your progress is saved automatically on your phone.
                      </p>
                    </div>

                    <div className="bg-[#E6F4F1] rounded-xl px-4 py-2 border border-[#0E7C86]/20 text-right shrink-0">
                      <div className="text-[18px] font-extrabold text-[#0B2B3A] tabular-nums">
                        {completedCount} of {totalItems} ready
                      </div>
                      <div className="caption-text font-bold text-[#0E7C86] tabular-nums">
                        {progressPercent}% complete
                      </div>
                    </div>
                  </div>

                  {/* Accessible Progress Bar */}
                  <div
                    role="progressbar"
                    aria-valuenow={progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="First visit preparation checklist progress"
                    className="w-full h-3 rounded-full bg-[#E6F4F1] overflow-hidden"
                  >
                    <div
                      className="h-full bg-[#0E7C86] transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Stage Filter & Quick Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div
                      role="group"
                      aria-label="Filter checklist by timing"
                      className="flex flex-wrap items-center gap-2"
                    >
                      {['all', '1–2 days before', 'Morning of visit'].map((stage) => {
                        const isSelected = stageFilter === stage;
                        return (
                          <button
                            key={stage}
                            type="button"
                            onClick={() => setStageFilter(stage)}
                            aria-pressed={isSelected}
                            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl caption-text font-bold transition-colors border ${
                              isSelected
                                ? 'bg-[#0E7C86] text-[#FFFFFF] border-[#0E7C86]'
                                : 'bg-[#E6F4F1] text-[#0B2B3A] border-[#0E7C86]/20 hover:border-[#0E7C86]'
                            }`}
                          >
                            {stage === 'all' ? 'All steps (7)' : stage}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      {completedCount < totalItems && (
                        <button
                          type="button"
                          onClick={checkAllItems}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl caption-text font-bold text-[#0E7C86] hover:bg-[#E6F4F1] transition-colors"
                        >
                          Check all
                        </button>
                      )}
                      {completedCount > 0 && (
                        <button
                          type="button"
                          onClick={resetChecklist}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl caption-text font-bold text-[#0B2B3A] hover:bg-[#E6F4F1] transition-colors inline-flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-[#0E7C86]" aria-hidden="true" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Checklist Items List */}
                <div className="space-y-3" role="list" aria-label="Checklist items">
                  {filteredChecklist.map((item) => {
                    const isChecked = checkedIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        role="listitem"
                        className={`rounded-2xl border transition-colors p-4 sm:p-5 ${
                          isChecked
                            ? 'bg-[#FFFFFF] border-[#0E7C86]'
                            : 'bg-[#FFFFFF] border-[#0B2B3A]/15 hover:border-[#0E7C86]/60'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleItem(item.id)}
                          aria-pressed={isChecked}
                          className="w-full text-left flex items-start gap-3.5"
                        >
                          <div className="mt-0.5 shrink-0">
                            {isChecked ? (
                              <CheckSquare
                                className="w-6 h-6 text-[#0E7C86]"
                                aria-hidden="true"
                              />
                            ) : (
                              <Square
                                className="w-6 h-6 text-[#0B2B3A]/50"
                                aria-hidden="true"
                              />
                            )}
                          </div>

                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className={`text-[18px] font-bold text-[#0B2B3A] ${
                                  isChecked ? 'line-through opacity-80' : ''
                                }`}
                              >
                                {item.title}
                              </span>
                              <span className="inline-flex items-center gap-1 caption-text font-bold text-[#0E7C86] bg-[#E6F4F1] px-2.5 py-0.5 rounded-lg">
                                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>{item.stage}</span>
                              </span>
                            </div>

                            <p className="caption-text text-[#0B2B3A] leading-relaxed">
                              {item.detail}
                            </p>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Completion Reassurance Banner */}
                {completedCount === totalItems && (
                  <div
                    role="status"
                    className="bg-[#FFFFFF] rounded-2xl p-5 border-2 border-[#0E7C86] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <Smile className="w-6 h-6 text-[#0E7C86] shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <div className="text-[18px] font-bold text-[#0B2B3A]">
                          You and your child are all set!
                        </div>
                        <p className="caption-text text-[#0B2B3A]">
                          Our team will have the picture books and sticker box waiting for you.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleBookClick}
                      className="btn-coral shrink-0 !py-2.5 !px-4 !min-h-[44px]"
                    >
                      <Calendar className="w-4 h-4 text-[#0B2B3A]" aria-hidden="true" />
                      <span>Book visit now</span>
                    </button>
                  </div>
                )}
              </div>
            </Reveal>
          </div>

          {/* Right Column (5 cols): Age-by-Age Tips + Parent Language Guide */}
          <div className="lg:col-span-5 space-y-8">
            {/* 1. Age-by-Age First Visit Tips */}
            <Reveal delayMs={80}>
              <div className="bg-[#E6F4F1] rounded-3xl p-6 sm:p-7 border border-[#0E7C86]/25 space-y-5">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 caption-text font-bold text-[#0E7C86]">
                    <Baby className="w-4 h-4 text-[#0E7C86]" aria-hidden="true" />
                    <span>Tailored by child’s age</span>
                  </div>
                  <h3 className="text-[22px] font-bold text-[#0B2B3A]">
                    What to expect at each age
                  </h3>
                </div>

                {/* Age Group Selector Buttons */}
                <div
                  role="tablist"
                  aria-label="Select your child's age group"
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                >
                  {guide.ageGroupTips.map((group) => {
                    const isSelected = group.id === activeAgeGroup.id;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setSelectedAgeGroupId(group.id)}
                        className={`min-h-[48px] px-3 py-2 rounded-xl text-center transition-colors border ${
                          isSelected
                            ? 'bg-[#0E7C86] text-[#FFFFFF] border-[#0E7C86]'
                            : 'bg-[#FFFFFF] text-[#0B2B3A] border-[#0E7C86]/25 hover:border-[#0E7C86]'
                        }`}
                      >
                        <div className="text-[15px] font-extrabold">
                          {group.ageRange}
                        </div>
                        <div
                          className={`text-[12px] font-semibold truncate ${
                            isSelected ? 'text-[#FFFFFF]' : 'text-[#0B2B3A]'
                          }`}
                        >
                          {group.label}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Active Age Group Content Card */}
                <div
                  role="tabpanel"
                  className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#0E7C86]/20 space-y-4"
                >
                  <div className="space-y-1 border-b border-[#E6F4F1] pb-3">
                    <div className="caption-text font-bold text-[#0E7C86]">
                      {activeAgeGroup.ageRange} · {activeAgeGroup.label}
                    </div>
                    <h4 className="text-[19px] font-bold text-[#0B2B3A]">
                      {activeAgeGroup.summary}
                    </h4>
                  </div>

                  <p className="text-[16px] text-[#0B2B3A]">
                    {activeAgeGroup.whatHappens}
                  </p>

                  <div className="space-y-2.5 pt-1">
                    <div className="caption-text font-bold text-[#0B2B3A]">
                      Helpful tips for parents:
                    </div>
                    <ul className="space-y-2.5">
                      {activeAgeGroup.tips.map((tip, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 caption-text text-[#0B2B3A]"
                        >
                          <CheckCircle2
                            className="w-4 h-4 text-[#0E7C86] shrink-0 mt-1"
                            aria-hidden="true"
                          />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* 2. "Words That Help" Positive Phrase Swaps */}
            <Reveal delayMs={140}>
              <div className="bg-[#E6F4F1] rounded-3xl p-6 sm:p-7 border border-[#0E7C86]/25 space-y-5">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 caption-text font-bold text-[#0E7C86]">
                    <MessageCircleHeart
                      className="w-4 h-4 text-[#0E7C86]"
                      aria-hidden="true"
                    />
                    <span>Positive language guide</span>
                  </div>
                  <h3 className="text-[22px] font-bold text-[#0B2B3A]">
                    Words that keep kids calm
                  </h3>
                  <p className="caption-text text-[#0B2B3A]">
                    Simple phrase swaps at home prevent accidental worry before you arrive.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {guide.phraseSwaps.map((swap, idx) => (
                    <div
                      key={idx}
                      className="bg-[#FFFFFF] rounded-2xl p-4 sm:p-5 border border-[#0E7C86]/20 space-y-2.5"
                    >
                      <div className="caption-text text-[#0B2B3A]">
                        <span className="font-bold text-[#0B2B3A]">Skip saying: </span>
                        <span className="italic">{swap.insteadOf}</span>
                      </div>

                      <div className="bg-[#E6F4F1] rounded-xl p-3 border border-[#0E7C86]/20">
                        <div className="caption-text font-bold text-[#0E7C86]">
                          Try saying instead:
                        </div>
                        <div className="text-[16px] font-bold text-[#0B2B3A] mt-0.5">
                          {swap.trySaying}
                        </div>
                      </div>

                      <p className="caption-text text-[#0B2B3A]">
                        <span className="font-bold">Why it helps: </span>
                        {swap.whyItHelps}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};
