import React, { useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Lock, Trash2, Clock } from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicConfig';

interface PrivacyPolicyPageProps {
  onBackHome: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBackHome }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="bg-[#FFFFFF] py-12 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div>
          <button
            type="button"
            onClick={onBackHome}
            className="btn-teal-outline !py-2.5 !px-4"
          >
            <ArrowLeft className="w-4 h-4 text-[#0E7C86]" aria-hidden="true" />
            <span>Back to clinic home page</span>
          </button>
        </div>

        <div className="space-y-4 border-b border-[#E6F4F1] pb-8">
          <p className="text-[16px] font-bold text-[#0E7C86]">
            Data protection &amp; patient privacy
          </p>
          <h1>
            Simple, transparent <span className="heading-highlight">privacy</span> policy
          </h1>
          <p className="caption-text text-[#0B2B3A]">
            Last updated: {CLINIC_CONFIG.privacyPolicy.lastUpdated} · Aligned with India’s Digital Personal Data Protection (DPDP) Act 2023
          </p>
        </div>

        {/* 4 Summary Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-[#E6F4F1] rounded-2xl p-6 border border-[#0E7C86]/20 space-y-2">
            <ShieldCheck className="w-6 h-6 text-[#0E7C86]" aria-hidden="true" />
            <h2 className="text-[20px] font-bold text-[#0B2B3A]">Minimum data only</h2>
            <p className="text-[16px] text-[#0B2B3A]">
              We only ask for your name, phone number, and appointment preference—never medical history or ID numbers online.
            </p>
          </div>

          <div className="bg-[#E6F4F1] rounded-2xl p-6 border border-[#0E7C86]/20 space-y-2">
            <Lock className="w-6 h-6 text-[#0E7C86]" aria-hidden="true" />
            <h2 className="text-[20px] font-bold text-[#0B2B3A]">Seen only by our clinic</h2>
            <p className="text-[16px] text-[#0B2B3A]">
              Your enquiry is viewed strictly by the clinic owner and reception desk to confirm your visit. We never sell or share your details.
            </p>
          </div>

          <div className="bg-[#E6F4F1] rounded-2xl p-6 border border-[#0E7C86]/20 space-y-2">
            <Clock className="w-6 h-6 text-[#0E7C86]" aria-hidden="true" />
            <h2 className="text-[20px] font-bold text-[#0B2B3A]">
              Kept for {CLINIC_CONFIG.privacyPolicy.retentionMonthsUnbooked} months max
            </h2>
            <p className="text-[16px] text-[#0B2B3A]">
              Unbooked website enquiries are kept for up to {CLINIC_CONFIG.privacyPolicy.retentionMonthsUnbooked} months and then permanently deleted.
            </p>
          </div>

          <div className="bg-[#E6F4F1] rounded-2xl p-6 border border-[#0E7C86]/20 space-y-2">
            <Trash2 className="w-6 h-6 text-[#0E7C86]" aria-hidden="true" />
            <h2 className="text-[20px] font-bold text-[#0B2B3A]">Easy deletion on request</h2>
            <p className="text-[16px] text-[#0B2B3A]">
              You can ask us to view, correct, or permanently delete your website enquiry at any time by calling or emailing us.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-[#0B2B3A]">
          <section className="space-y-3">
            <h2>1. What information we collect</h2>
            <p>
              When you fill in our Appointment or Callback form on this website, we collect only the details needed to arrange your visit:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your name and 10-digit phone number (and optional email address if you choose to provide it).</li>
              <li>Whether the visit is for an adult, a child, or a family, along with your preferred service, date, and time slot.</li>
              <li>Any short optional note you write (up to 500 characters), plus the date and time you ticked the consent box.</li>
              <li>A one-way salted cryptographic hash (SHA-256) of your network IP address solely to prevent automated spam submissions. We never store your raw IP address.</li>
            </ul>
            <p className="font-bold">
              Please do not submit medical records, Aadhaar/PAN numbers, or payment card details through website forms.
            </p>
          </section>

          <section className="space-y-3">
            <h2>2. Why we collect it (Purpose limitation)</h2>
            <p>
              We use your information strictly for one purpose: calling or messaging you back to confirm your dental appointment or answer your callback request. We do not use website form submissions for unsolicited marketing lists, and we do not run advertising trackers or visitor cookies on this site.
            </p>
          </section>

          <section className="space-y-3">
            <h2>3. Who can see your information</h2>
            <p>
              Your enquiry is stored securely in Google Cloud / Firebase Firestore with direct public access blocked, and is accessible only to the verified clinic owner at {CLINIC_CONFIG.clinicName}. An automated notification email is sent only to the clinic owner so we can respond promptly.
            </p>
          </section>

          <section className="space-y-3">
            <h2>4. How long we keep it</h2>
            <p>
              For website enquiries that do not result in a clinic visit, we retain the record for up to{' '}
              <span className="font-bold">{CLINIC_CONFIG.privacyPolicy.retentionMonthsUnbooked} months</span>{' '}
              and then delete it from our dashboard. If you become a registered patient at the clinic, your clinical dental records are maintained separately at the clinic in accordance with State Dental Council regulations.
            </p>
          </section>

          <section className="space-y-3">
            <h2>5. How to withdraw consent or ask for deletion</h2>
            <p>
              Under India’s Digital Personal Data Protection Act 2023 (DPDP Act), you have the right to withdraw your consent and ask us to erase your website enquiry at any time. To request immediate deletion, simply contact our clinic data protection desk:
            </p>
            <div className="bg-[#E6F4F1] rounded-2xl p-6 border border-[#0E7C86]/25 space-y-2">
              <p className="font-bold">{CLINIC_CONFIG.clinicName}</p>
              <p>
                Phone:{' '}
                <a
                  href={`tel:${CLINIC_CONFIG.phoneTel}`}
                  className="font-bold text-[#0E7C86] underline"
                >
                  {CLINIC_CONFIG.phoneDisplay}
                </a>
              </p>
              <p>
                Privacy Email:{' '}
                <a
                  href={`mailto:${CLINIC_CONFIG.privacyPolicy.dataProtectionContactEmail}`}
                  className="font-bold text-[#0E7C86] underline"
                >
                  {CLINIC_CONFIG.privacyPolicy.dataProtectionContactEmail}
                </a>
              </p>
              <p>Address: {CLINIC_CONFIG.address.fullDisplay}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
