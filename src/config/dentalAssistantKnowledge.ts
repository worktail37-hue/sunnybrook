import { CLINIC_CONFIG } from './clinicConfig.ts';

export const OUT_OF_DOMAIN_DATABASE_MESSAGE =
  'I can only answer questions related to dental care, oral health, what dentists do, and Sunnybrook Family & Kids Dental. This information is not stored in the database.';

export interface SpokenTopicPreset {
  id: string;
  label: string;
  shortTitle: string;
  prompt: string;
  spokenScript: string;
}

export const VOICE_ASSISTANT_PRESETS: SpokenTopicPreset[] = [
  {
    id: 'website-overview',
    label: 'All about this website & clinic',
    shortTitle: 'Website & Clinic Guide',
    prompt: 'Tell me all about this website and Sunnybrook Family & Kids Dental clinic.',
    spokenScript:
      'Welcome to Sunnybrook Family and Kids Dental at 142 Green Park Avenue, Ground Floor, Indiranagar, Bengaluru! On this website, you can explore our 3-step anxiety-free care journey, browse our 7 dental treatments, compare out-of-pocket costs using our interactive D3 insurance estimator, use our interactive First Visit Guide checklist for parents, read full clinical biographies of our 4 State Dental Council registered dentists, sign in to the secure Patient Portal to view your appointment status and health history, enable browser appointment reminders, or book a visit and request a callback online.',
  },
  {
    id: 'what-dentist-does',
    label: 'What a dentist does & how we care for teeth',
    shortTitle: 'What a Dentist Does',
    prompt: 'Explain what is done as a dentist and how dental treatments work at your clinic.',
    spokenScript:
      'As dentists at Sunnybrook Family and Kids Dental, our role is to keep your teeth, gums, and jaws healthy, comfortable, and pain-free for life. First, we focus on preventive care: gentle check-ups, ultrasonic plaque cleaning, fluoride protection, and painless molar sealants so cavities never start. Second, for growing children, Dr. Ananya Sharma uses the calm tell-show-do method, counting teeth on a puppet first and letting toddlers sit on a parent’s lap. Third, when a tooth hurts or has deep decay, Dr. Rahul Verma uses fruit-flavoured numbing gel and microscopic root canal care to stop pain and save your natural tooth. Fourth, Dr. Meera Nair guides jaw growth with braces and clear aligners, while Dr. Karthik Iyer restores adult and senior smiles with natural-shade bonding, crowns, and comfortable dentures.',
  },
  {
    id: 'services-and-costs',
    label: 'Our 7 treatments & insurance costs',
    shortTitle: 'Treatments & Costs',
    prompt: 'What are the 7 dental services offered here and their exact prices and insurance plans?',
    spokenScript:
      'We offer 7 core dental services with transparent upfront pricing before any treatment begins: 1. Teeth whitening at 6,500 rupees per arch session. 2. Smile makeovers at 9,500 rupees per tooth restoration. 3. Bite correction and aligners starting at 14,000 rupees for the initial phase. 4. Child dental check-ups with gentle cleaning at 1,200 rupees. 5. Complete single-tooth root canal treatment at 5,500 rupees. 6. Same-day emergency toothache relief with X-ray at 1,500 rupees. And 7. Painless dental sealants for a pair of back molars at 1,800 rupees. You can also estimate reimbursements on our website across Basic OPD, Corporate Family, and Comprehensive Plus insurance plans.',
  },
  {
    id: 'kids-and-nervous-patients',
    label: 'Care for kids & nervous patients',
    shortTitle: 'Kids & Anxiety-Free Care',
    prompt: 'How do you help nervous patients and children during their first dental visit?',
    spokenScript:
      'We specialise in caring for nervous adults and young children. Every visit starts with an eye-level conversation before you ever lean back in the chair. Before any local anaesthetic, we dry the gum and apply a fruit-flavoured numbing gel for two full minutes so you barely feel a pinch. We also practice a one-hand stop signal—if you or your child raise a hand, we pause immediately. For children, parents stay right beside them in the room, and our instruments are autoclaved in Class-B sterilisers and opened from sealed pouches right in front of you.',
  },
  {
    id: 'meet-our-dentists',
    label: 'Meet our 4 registered dentists',
    shortTitle: 'Our 4 Dentists',
    prompt: 'Tell me about the 4 dentists at Sunnybrook Family & Kids Dental and their qualifications.',
    spokenScript:
      'Our clinical team includes four State Dental Council registered specialists: Dr. Ananya Sharma, BDS, MDS in Pediatric and Preventive Dentistry with 12 years of experience caring for babies and children; Dr. Rahul Verma, BDS, MDS in Conservative Dentistry and Endodontics with 14 years of experience in painless root canals and tooth saving; Dr. Meera Nair, BDS, MDS in Orthodontics with 10 years of experience in child bite guidance, braces, and clear aligners; and Dr. Karthik Iyer, BDS with 11 years of experience in family check-ups, crowns, dentures, and caring for nervous adults and seniors.',
  },
];

export const DENTAL_SYSTEM_INSTRUCTION = `You are the official Dental Care Chatbot and Voice Assistant for "${CLINIC_CONFIG.clinicName}" (${CLINIC_CONFIG.shortName}), located at ${CLINIC_CONFIG.address.fullDisplay} (${CLINIC_CONFIG.address.landmarkNote}).

CRITICAL DOMAIN & ACCURACY RULES (MANDATORY):
1. STRICT DOMAIN BOUNDARY: You are ONLY allowed to answer questions related to:
   - Dental care, oral health, teeth, gums, brushing, flossing, cavities, toothache, root canals, braces, aligners, whitening, dental sealants, crowns, dentures, oral hygiene, pediatric dentistry, and dental emergencies.
   - What a dentist does, how dental procedures work, dental instruments/sterilisation, and overcoming dental anxiety.
   - "${CLINIC_CONFIG.clinicName}", its website features, its 4 doctors, its 7 services, its pricing & insurance estimator plans, its working hours, address, phone number, patient portal, browser appointment reminders, and booking/callback process.
2. OUT-OF-DOMAIN REFUSAL: If a visitor asks ANY question outside the dental care or clinic website domain (for example: general trivia, politics, history, sports, movies, coding/programming, math homework, weather, recipes, finance/stocks, or unrelated medical fields), you MUST NOT answer the question. Instead, you MUST reply clearly that:
   "${OUT_OF_DOMAIN_DATABASE_MESSAGE}"
3. 100% FACTUAL ACCURACY: Never invent doctors, prices, addresses, or policies. Use ONLY the verified clinic facts below and established evidence-based dentistry facts.

VERIFIED CLINIC & WEBSITE DATABASE:
- Clinic Name: ${CLINIC_CONFIG.clinicName} (${CLINIC_CONFIG.shortName})
- Tagline: ${CLINIC_CONFIG.tagline}
- Phone & WhatsApp: ${CLINIC_CONFIG.phoneDisplay}
- Email: ${CLINIC_CONFIG.email} (Privacy contact: ${CLINIC_CONFIG.privacyPolicy.dataProtectionContactEmail})
- Address: ${CLINIC_CONFIG.address.fullDisplay} (${CLINIC_CONFIG.address.landmarkNote})
- Working Hours:
  * Monday to Friday: 9:30 am – 1:30 pm, 4:00 pm – 8:00 pm
  * Saturday: 9:30 am – 6:00 pm (Kids & Family Priority Day)
  * Sunday: 10:00 am – 1:30 pm (By prior appointment & urgent toothache care)
  * Emergency Policy: ${CLINIC_CONFIG.workingHours.emergencyNote}
- Track Record: ${CLINIC_CONFIG.stats.patientsTreated.toLocaleString()}+ patients treated, ${CLINIC_CONFIG.stats.yearsOfCare} years of care, ${CLINIC_CONFIG.stats.googleRating} Google rating (${CLINIC_CONFIG.stats.reviewCountDisplay}).
- Sterilisation & Safety: Class-B autoclaved instruments opened from sealed pouches in front of every patient; low-radiation digital X-rays only when clinically necessary.
- Pain-Free & Anxiety-Free Protocol:
  * Eye-level conversation before sitting back in the chair.
  * Fruit-flavoured topical numbing gel applied for 2 full minutes before any local anaesthesia; treatment never starts until the tooth is 100% numb.
  * One-hand stop signal: raising a hand pauses treatment immediately.
  * Pediatric 'Tell-Show-Do' approach: counting teeth on a toy puppet first, letting toddlers sit knee-to-knee on a parent's lap, and allowing parents to stay right beside their child.

VERIFIED WEBSITE FEATURES & SECTIONS:
1. Hero & Trust Strip: Highlights registered BDS/MDS dentists, child-friendly care, Class-B sterilisation, and 4.8 rating.
2. About & 3-Step Care Journey: Step 1 Book your visit -> Step 2 Meet your dentist -> Step 3 Personalised written plan with upfront costs.
3. 7 Numbered Dental Services & Base Fees:
   - 01. Teeth whitening: ₹6,500 per arch session (45 mins, adults & older teens, enamel-safe with soothing fluoride gel).
   - 02. Smile makeovers: ₹9,500 per tooth restoration (1–2 visits, conservative bonding, natural-shade ceramic crowns, gap closures).
   - 03. Bite correction: ₹14,000 initial starter phase (30 min review, age-7 jaw guidance, braces, and clear aligners for kids, teens & adults).
   - 04. Child dental check-ups: ₹1,200 check-up + gentle clean (30 mins, babies, toddlers & kids up to 14, fluoride protection & sticker reward).
   - 05. Root canal treatment: ₹5,500 complete single tooth (45–60 mins, single or two-sitting microscopic/rotary care to save infected teeth).
   - 06. Toothache relief: ₹1,500 same-day relief + X-ray (30 mins same-day priority for sudden tooth pain, swelling, broken fillings, or knocked-out teeth).
   - 07. Dental sealants: ₹1,800 pair of back molars (20 mins, painless protective coating painted onto deep grooves of molars for children aged 6–13, no drilling or numbing).
4. Interactive D3.js Insurance & Treatment Cost Estimator:
   - Compares clinic base fees vs Insurance Covered vs Out-of-Pocket across 4 plans:
     * No insurance (Standard clinic fee)
     * Basic OPD Dental Cover (up to ₹8,000/yr cap: 80% preventive, 50% urgent/root canal, 20% ortho/makeover, 10% whitening)
     * Corporate Family Health + Dental (up to ₹20,000/yr cap: 90% preventive, 75% urgent/root canal, 45% ortho/makeover, 25% whitening)
     * Comprehensive Kids & Family Plus (up to ₹35,000/yr cap: 100% preventive, 85% urgent/root canal, 60% ortho/makeover, 35% whitening)
   - Payment methods accepted: UPI, debit/credit cards, net banking, and cash, with GST-compliant itemised invoices for reimbursement.
5. Kids Corner & Interactive First Visit Guide:
   - Includes a 7-item interactive parent checklist (saved in browser), age-by-age tabs (Ages 1–3 lap check-ups, Ages 4–6 tell-show-do, Ages 7–12 molar sealants & bite checks), and positive parent phrase swaps.
6. Our 4 Registered Dentists:
   - Dr. Ananya Sharma: BDS, MDS (Pediatric & Preventive Dentistry), Reg. No. 28419-A, 12 years experience. Consults Mon–Sat 9:30 am – 6:30 pm. Speaks English, Kannada, Hindi.
   - Dr. Rahul Verma: BDS, MDS (Conservative Dentistry & Endodontics), Reg. No. 24108-A, 14 years experience. Consults Mon–Sat 10:00 am – 8:00 pm. Speaks English, Hindi, Kannada, Tamil.
   - Dr. Meera Nair: BDS, MDS (Orthodontics & Dentofacial Orthopedics), Reg. No. 31904-A, 10 years experience. Consults Tue, Thu, Sat & Sun 10:00 am – 7:30 pm. Speaks English, Malayalam, Kannada, Hindi.
   - Dr. Karthik Iyer: BDS (General, Family & Senior Dental Care), Reg. No. 26752-A, 11 years experience. Consults Mon–Sun 9:30 am – 8:00 pm. Speaks English, Tamil, Kannada, Telugu, Hindi.
7. Patient Portal & Browser Appointment Reminders:
   - Patients can sign in with Google or Email/Password via Firebase Auth to check upcoming appointment status, update their dental health history (allergies, medical conditions, dental anxiety notes), and enable Service-Worker + interval browser notifications (24h before, morning of visit, 2h before) to prevent missed visits.

WHAT A DENTIST DOES (CLINICAL EDUCATION):
- A dentist diagnoses, prevents, and treats conditions of the teeth, gums, jaws, and oral tissues.
- Preventive dentistry: Oral examinations, scaling/cleaning tartar, fluoride treatments, pit-and-fissure dental sealants, oral hygiene coaching.
- Restorative & Endodontic dentistry: Removing tooth decay, placing tooth-coloured composite fillings, performing root canal treatment to clean infected root canals and save natural teeth, fitting crowns/bridges/dentures.
- Pediatric dentistry: Monitoring baby (milk) teeth and jaw eruption, knee-to-knee toddler check-ups, habit counselling, painless cavity prevention.
- Orthodontics: Diagnosing crowded teeth or bite malocclusion around age 7+, guiding jaw growth, braces, and clear aligners.
- Emergency care: Relieving acute pulpitis/toothache, draining gum swelling, re-implanting knocked-out permanent teeth (hold by crown, place in cold milk, reach clinic within 60 minutes).

TONE & STYLE:
- Warm, reassuring, clear, concise, and family-friendly.
- Keep responses well-structured (2 to 5 short sentences or clean bullet points) so they are easy to read in a chat window and natural to listen to when spoken aloud.`;

// Keywords that strongly indicate a question IS within the dental / clinic / website domain
const DENTAL_DOMAIN_KEYWORDS = [
  'dental',
  'dentist',
  'dentistry',
  'tooth',
  'teeth',
  'molar',
  'molars',
  'incisor',
  'canine',
  'gum',
  'gums',
  'gingivitis',
  'periodont',
  'cavity',
  'cavities',
  'decay',
  'caries',
  'plaque',
  'tartar',
  'calculus',
  'enamel',
  'fluoride',
  'sealant',
  'sealants',
  'root canal',
  'endodont',
  'crown',
  'crowns',
  'bridge',
  'denture',
  'dentures',
  'implant',
  'implants',
  'filling',
  'fillings',
  'composite',
  'bonding',
  'veneer',
  'whitening',
  'bleaching',
  'stain',
  'smile',
  'makeover',
  'bite',
  'brace',
  'braces',
  'aligner',
  'aligners',
  'invisalign',
  'orthodont',
  'jaw',
  'tmj',
  'toothache',
  'pain',
  'ache',
  'swelling',
  'abscess',
  'sensitive',
  'sensitivity',
  'bleeding',
  'brush',
  'brushing',
  'toothbrush',
  'toothpaste',
  'floss',
  'flossing',
  'mouthwash',
  'mouthguard',
  'mouth',
  'oral',
  'breath',
  'halitosis',
  'wisdom',
  'extraction',
  'pull',
  'knocked',
  'chipped',
  'cracked',
  'broken',
  'x-ray',
  'xray',
  'radiograph',
  'numb',
  'numbing',
  'anaesthesia',
  'anesthesia',
  'needle',
  'injection',
  'nervous',
  'anxious',
  'anxiety',
  'fear',
  'scared',
  'afraid',
  'child',
  'children',
  'kid',
  'kids',
  'toddler',
  'baby',
  'pediatric',
  'teething',
  'milk tooth',
  'milk teeth',
  'pacifier',
  'thumb',
  'clinic',
  'sunnybrook',
  'website',
  'site',
  'page',
  'portal',
  'login',
  'appointment',
  'book',
  'booking',
  'schedule',
  'callback',
  'call',
  'phone',
  'whatsapp',
  'contact',
  'address',
  'location',
  'where',
  'indiranagar',
  'bengaluru',
  'bangalore',
  'green park',
  'hour',
  'hours',
  'timing',
  'timings',
  'open',
  'close',
  'sunday',
  'saturday',
  'emergency',
  'urgent',
  'cost',
  'costs',
  'price',
  'prices',
  'fee',
  'fees',
  'charge',
  'charges',
  'rupee',
  'inr',
  'insurance',
  'opd',
  'reimburse',
  'reimbursement',
  'payment',
  'upi',
  'doctor',
  'doctors',
  'dr',
  'dr.',
  'ananya',
  'sharma',
  'rahul',
  'verma',
  'meera',
  'nair',
  'karthik',
  'iyer',
  'team',
  'specialist',
  'qualification',
  'bds',
  'mds',
  'experience',
  'sterilis',
  'steriliz',
  'autoclave',
  'hygiene',
  'check-up',
  'checkup',
  'visit',
  'first visit',
  'checklist',
  'reminder',
  'notification',
  'service',
  'services',
  'treatment',
  'treatments',
  'procedure',
  'check',
  'clean',
  'cleaning',
  'scaling',
  'polishing',
];

const GREETING_PATTERNS = /^(hi|hello|hey|good morning|good afternoon|good evening|namaste|help|who are you|what can you do|start|menu)[\s!?.,]*$/i;

const OBVIOUS_OUT_OF_DOMAIN_KEYWORDS = [
  'president',
  'prime minister',
  'capital of',
  'stock market',
  'bitcoin',
  'crypto',
  'football',
  'cricket',
  'fifa',
  'ipl',
  'movie',
  'actor',
  'actress',
  'bollywood',
  'hollywood',
  'python',
  'javascript',
  'typescript',
  'react code',
  'write a program',
  'write code',
  'sql query',
  'html css',
  'quadratic',
  'calculus problem',
  'physics',
  'chemistry equation',
  'planet',
  'galaxy',
  'weather in',
  'train ticket',
  'flight booking',
  'hotel booking',
  'election',
  'politician',
  'war in',
  'video game',
  'minecraft',
  'fortnite',
  'astrology',
  'horoscope',
  'car repair',
  'engine oil',
];

export function checkIsDentalOrClinicQuery(rawMessage: string): boolean {
  const text = rawMessage.trim().toLowerCase();
  if (!text) return false;
  if (GREETING_PATTERNS.test(text)) return true;

  // Check if any dental or clinic keyword is present
  const hasDentalKeyword = DENTAL_DOMAIN_KEYWORDS.some((kw) => text.includes(kw));

  // Check if obvious non-dental topic is present without dental context
  const hasObviousNonDental = OBVIOUS_OUT_OF_DOMAIN_KEYWORDS.some((kw) =>
    text.includes(kw)
  );

  if (hasObviousNonDental && !hasDentalKeyword) {
    return false;
  }

  return hasDentalKeyword;
}

/**
 * Deterministic, 100% accurate fallback & verification responder built directly from CLINIC_CONFIG.
 * Used when a visitor asks a question and we need guaranteed factual precision.
 */
export function buildDeterministicDentalAnswer(rawMessage: string): {
  reply: string;
  outOfDomain: boolean;
} {
  const text = rawMessage.trim().toLowerCase();

  if (!checkIsDentalOrClinicQuery(text)) {
    return {
      reply: OUT_OF_DOMAIN_DATABASE_MESSAGE,
      outOfDomain: true,
    };
  }

  if (GREETING_PATTERNS.test(text)) {
    return {
      reply: `Hello! Welcome to ${CLINIC_CONFIG.clinicName}. I am your Dental Care & Clinic Assistant. You can ask me anything about dental care, what a dentist does, child & adult treatments, our 4 registered doctors, treatment fees & insurance plans, or everything on this website!`,
      outOfDomain: false,
    };
  }

  // 1. Website overview
  if (
    text.includes('website') ||
    text.includes('about this site') ||
    text.includes('what is on this page') ||
    text.includes('tell me all about')
  ) {
    return {
      reply: VOICE_ASSISTANT_PRESETS[0].spokenScript,
      outOfDomain: false,
    };
  }

  // 2. What a dentist does
  if (
    text.includes('what does a dentist') ||
    text.includes('what is done as a dentist') ||
    text.includes('role of a dentist') ||
    text.includes('what do dentists do')
  ) {
    return {
      reply: VOICE_ASSISTANT_PRESETS[1].spokenScript,
      outOfDomain: false,
    };
  }

  // 3. Doctors / Team
  if (
    text.includes('doctor') ||
    text.includes('dentist') && (text.includes('who') || text.includes('team') || text.includes('meet') || text.includes('qualification')) ||
    text.includes('ananya') ||
    text.includes('rahul') ||
    text.includes('meera') ||
    text.includes('karthik')
  ) {
    if (text.includes('ananya')) {
      const d = CLINIC_CONFIG.doctors[0];
      return {
        reply: `${d.name} (${d.qualification}, ${d.registrationNumber}) has ${d.yearsExperience} years of experience in ${d.specialty}. She consults ${d.consultationDays}, speaks ${d.languagesSpoken.join(', ')}, and uses the gentle 'tell-show-do' approach for babies, toddlers, and children.`,
        outOfDomain: false,
      };
    }
    if (text.includes('rahul')) {
      const d = CLINIC_CONFIG.doctors[1];
      return {
        reply: `${d.name} (${d.qualification}, ${d.registrationNumber}) has ${d.yearsExperience} years of experience in ${d.specialty}. He consults ${d.consultationDays}, speaks ${d.languagesSpoken.join(', ')}, and specialises in painless microscopic root canals and same-day emergency toothache relief.`,
        outOfDomain: false,
      };
    }
    if (text.includes('meera')) {
      const d = CLINIC_CONFIG.doctors[2];
      return {
        reply: `${d.name} (${d.qualification}, ${d.registrationNumber}) has ${d.yearsExperience} years of experience in ${d.specialty}. She consults ${d.consultationDays}, speaks ${d.languagesSpoken.join(', ')}, and provides age-7 jaw guidance, ceramic braces, and clear aligners.`,
        outOfDomain: false,
      };
    }
    if (text.includes('karthik')) {
      const d = CLINIC_CONFIG.doctors[3];
      return {
        reply: `${d.name} (${d.qualification}, ${d.registrationNumber}) has ${d.yearsExperience} years of experience in ${d.specialty}. He consults ${d.consultationDays}, speaks ${d.languagesSpoken.join(', ')}, and cares for whole-family check-ups, crowns, dentures, and high-anxiety adults or seniors.`,
        outOfDomain: false,
      };
    }
    return {
      reply: VOICE_ASSISTANT_PRESETS[4].spokenScript,
      outOfDomain: false,
    };
  }

  // 4. Costs, Fees & Insurance
  if (
    text.includes('cost') ||
    text.includes('price') ||
    text.includes('fee') ||
    text.includes('charge') ||
    text.includes('insurance') ||
    text.includes('opd') ||
    text.includes('how much')
  ) {
    return {
      reply: `${VOICE_ASSISTANT_PRESETS[2].spokenScript} We accept UPI, cards, net banking, and cash, and provide GST-compliant itemised invoices for insurance claims.`,
      outOfDomain: false,
    };
  }

  // 5. Working hours, address, phone, location
  if (
    text.includes('hour') ||
    text.includes('timing') ||
    text.includes('open') ||
    text.includes('address') ||
    text.includes('where') ||
    text.includes('location') ||
    text.includes('phone') ||
    text.includes('contact')
  ) {
    return {
      reply: `${CLINIC_CONFIG.clinicName} is located at ${CLINIC_CONFIG.address.fullDisplay} (${CLINIC_CONFIG.address.landmarkNote}). Our working hours are Monday–Friday 9:30 am – 1:30 pm & 4:00 pm – 8:00 pm, Saturday 9:30 am – 6:00 pm (Kids & Family Priority Day), and Sunday 10:00 am – 1:30 pm. Call or WhatsApp us at ${CLINIC_CONFIG.phoneDisplay}.`,
      outOfDomain: false,
    };
  }

  // 6. Specific procedures (Root canal, whitening, sealants, braces, kids first visit, emergency)
  if (text.includes('root canal')) {
    return {
      reply: `Root canal treatment at our clinic (₹5,500 complete single tooth, 45–60 mins) is performed by Endodontist Dr. Rahul Verma. We first apply fruit-flavoured numbing gel for 2 minutes before local anaesthesia and wait until your tooth feels 100% numb before gently cleaning and sealing the infected root canal to save your natural tooth.`,
      outOfDomain: false,
    };
  }

  if (text.includes('sealant')) {
    return {
      reply: `Dental sealants (₹1,800 for a pair of back molars, 20 mins) are a thin, protective raincoat painted onto the deep grooves of children's permanent back molars (ages 6 to 13) to keep food and cavities out. It is 100% painless with no drilling and no numbing needed.`,
      outOfDomain: false,
    };
  }

  if (text.includes('whiten') || text.includes('stain')) {
    return {
      reply: `Our enamel-safe Teeth Whitening service (₹6,500 per arch session, 45 mins) gently lifts tea, coffee, and everyday staining for adults and older teens. It includes a sensitivity check and soothing fluoride gel so your teeth stay calm afterwards.`,
      outOfDomain: false,
    };
  }

  if (text.includes('brace') || text.includes('aligner') || text.includes('bite')) {
    return {
      reply: `Bite correction (₹14,000 initial starter phase, 30 min review) is led by Orthodontist Dr. Meera Nair. We recommend an early orthodontic check around age 7 to guide growing jaws gently, and we offer low-friction metal braces, tooth-coloured ceramic braces, and removable clear aligners for teens and adults.`,
      outOfDomain: false,
    };
  }

  if (
    text.includes('child') ||
    text.includes('kid') ||
    text.includes('toddler') ||
    text.includes('baby') ||
    text.includes('first visit')
  ) {
    return {
      reply: `We recommend bringing your child around their first birthday or when their first milk teeth appear. Child dental check-ups are ₹1,200 (30 mins) with Pediatric Dentist Dr. Ananya Sharma. Parents stay right beside their child (toddlers can sit knee-to-knee on your lap), we count teeth on a puppet first using 'tell-show-do', and kids can raise one hand anytime to pause!`,
      outOfDomain: false,
    };
  }

  if (
    text.includes('emergency') ||
    text.includes('toothache') ||
    text.includes('knocked') ||
    text.includes('swelling') ||
    text.includes('pain')
  ) {
    return {
      reply: `We keep same-day emergency toothache slots open every day (₹1,500 including emergency consultation, digital X-ray, and pain relief). Call us immediately at ${CLINIC_CONFIG.phoneDisplay}. If a permanent adult tooth is knocked out, hold it by the crown (never touch the root), place it in cold milk, and reach our clinic within 60 minutes.`,
      outOfDomain: false,
    };
  }

  if (
    text.includes('brush') ||
    text.includes('floss') ||
    text.includes('cavity') ||
    text.includes('cavities') ||
    text.includes('gum') ||
    text.includes('hygiene')
  ) {
    return {
      reply: `To prevent cavities and gum inflammation (gingivitis), dentists recommend brushing twice daily for 2 minutes using a soft-bristled brush and fluoride toothpaste, flossing once every evening to clean between teeth where brushes cannot reach, limiting sugary snacks between meals, and scheduling a professional dental check-up and ultrasonic cleaning every 6 months.`,
      outOfDomain: false,
    };
  }

  return {
    reply: `At ${CLINIC_CONFIG.clinicName} in Indiranagar, Bengaluru (${CLINIC_CONFIG.phoneDisplay}), our 4 State Dental Council registered dentists provide gentle, anxiety-free care across 7 treatments: Teeth whitening (₹6,500), Smile makeovers (₹9,500), Bite correction (₹14,000), Child dental check-ups (₹1,200), Root canal treatment (₹5,500), Same-day toothache relief (₹1,500), and Dental sealants (₹1,800). Ask me about any specific tooth symptom, procedure, doctor, or website feature!`,
    outOfDomain: false,
  };
}
