/**
 * SINGLE CLINIC CONFIGURATION FILE
 * ============================================================================
 * Replace every value marked with [PLACEHOLDER] below with your real clinic
 * details before launching publicly. All pages, forms, SEO tags, and Schema.org
 * structured data read directly from this file.
 */

export interface DoctorProfile {
  id: string;
  name: string;
  qualification: string;
  registrationNumber: string;
  yearsExperience: number;
  specialty: string;
  experienceNote: string;
  reassuranceQuote: string;
  detailedBio: string;
  educationAndTraining: string[];
  clinicalFocusAreas: string[];
  languagesSpoken: string[];
  consultationDays: string;
  photoUrl: string;
  photoAlt: string;
  photoPlaceholderComment: string;
}

export interface ClinicService {
  id: string;
  number: string;
  name: string;
  shortDescription: string;
  gentleNote: string;
  typicalDuration: string;
  idealFor: string;
  imageUrl: string;
  imageAlt: string;
  imagePlaceholderComment: string;
}

export interface SampleTestimonial {
  id: string;
  patientName: string;
  visitContext: string;
  quote: string;
  dateLabel: string;
  isSamplePlaceholder: boolean;
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const CLINIC_CONFIG = {
  // 1. Core Clinic Identity [PLACEHOLDER: Replace with your registered clinic name and tagline]
  clinicName: "Sunnybrook Family & Kids Dental", // [PLACEHOLDER: Replace with your clinic name]
  shortName: "Sunnybrook Dental", // [PLACEHOLDER: Replace with short header brand name]
  tagline: "Warm, gentle dental care for children, adults and whole families.", // [PLACEHOLDER: Replace with your tagline]

  // 2. Contact Numbers & Email [PLACEHOLDER: Replace with your real phone, WhatsApp, and email]
  phoneDisplay: "+91 98765 43210", // [PLACEHOLDER: Replace with formatted clinic phone number]
  phoneTel: "+919876543210", // [PLACEHOLDER: Replace with E.164 phone number for tel: links]
  whatsappNumber: "919876543210", // [PLACEHOLDER: Replace with digits-only WhatsApp number with country code]
  whatsappDefaultMessage: "Hello! I would like to book a dental visit.",
  email: "care@sunnybrookdental.example.com", // [PLACEHOLDER: Replace with your public clinic enquiry email]

  // 3. Location & Map [PLACEHOLDER: Replace with your clinic street address and Google Maps link]
  address: {
    line1: "142 Green Park Avenue, Ground Floor (Wheelchair & Stroller Accessible)", // [PLACEHOLDER]
    neighborhood: "Indiranagar", // [PLACEHOLDER]
    city: "Bengaluru", // [PLACEHOLDER]
    state: "Karnataka", // [PLACEHOLDER]
    postalCode: "560038", // [PLACEHOLDER]
    country: "IN",
    fullDisplay: "142 Green Park Avenue, Ground Floor, Indiranagar, Bengaluru 560038", // [PLACEHOLDER]
    landmarkNote: "200 metres from Metro Station, with step-free entrance and dedicated family parking.", // [PLACEHOLDER]
  },
  mapDirectionsUrl: "https://maps.google.com/?q=12.9784,77.6408", // [PLACEHOLDER: Replace with your Google Maps directions link]
  coordinates: {
    latitude: 12.9784, // [PLACEHOLDER]
    longitude: 77.6408, // [PLACEHOLDER]
  },

  // 4. Working Hours [PLACEHOLDER: Replace with your real clinic hours]
  workingHours: {
    topBarSummary: "Mon–Sat: 9:30 am – 8:00 pm · Sun: 10:00 am – 1:30 pm", // [PLACEHOLDER]
    schedule: [
      { days: "Monday to Friday", hours: "9:30 am – 1:30 pm, 4:00 pm – 8:00 pm" },
      { days: "Saturday", hours: "9:30 am – 6:00 pm (Kids & Family Priority Day)" },
      { days: "Sunday", hours: "10:00 am – 1:30 pm (By prior appointment & urgent toothache care)" },
    ],
    emergencyNote: "Same-day slots kept open every day for children or adults with sudden toothache.",
  },

  // 5. Social Links [PLACEHOLDER: Replace with your real clinic social profile links]
  socialLinks: {
    instagram: "https://instagram.com/", // [PLACEHOLDER: Replace with your Instagram URL]
    facebook: "https://facebook.com/", // [PLACEHOLDER: Replace with your Facebook URL]
    youtube: "https://youtube.com/", // [PLACEHOLDER: Replace with your YouTube URL]
  },

  // 6. Trust Strip & Stats [PLACEHOLDER: Update numbers to match your clinic's actual track record]
  stats: {
    patientsTreated: 6800, // [PLACEHOLDER: Replace with actual number of patients treated]
    yearsOfCare: 12, // [PLACEHOLDER: Replace with actual years in practice]
    googleRating: "4.8", // Static 4.8 rating (never animates from 0.0)
    reviewCountDisplay: "420+ local families", // [PLACEHOLDER: Replace with actual review count]
  },

  trustStripBadges: [
    {
      id: "registered",
      title: "Registered dentists",
      subtitle: "State Dental Council verified BDS & MDS clinicians",
    },
    {
      id: "child-friendly",
      title: "Child-friendly care",
      subtitle: "Calm tell-show-do visits at your child's pace",
    },
    {
      id: "sterilised",
      title: "Sterilised instruments",
      subtitle: "Class-B autoclaved & sealed pouches for every seat",
    },
    {
      id: "rating",
      title: "4.8 Google rating",
      subtitle: "Trusted by parents, seniors and nervous patients",
    },
  ],

  // 7. About Section Image Cards [PLACEHOLDER: Replace WebP files in /public/images/ with real clinic photos]
  aboutCards: [
    {
      id: "about-1",
      title: "A quiet, welcoming reception",
      description: "Step-free entry for strollers and elders, warm lighting, and a picture-book corner for children.",
      imageUrl: "/images/about-reception-calm.webp",
      imageAlt: "Bright, calm dental reception area with comfortable seating and children's storybooks",
      placeholderComment: "REPLACE PHOTO: Real photo of your reception area with natural light, comfortable chairs, and kids' book corner (no clinical instruments).",
    },
    {
      id: "about-2",
      title: "Conversations before check-ups",
      description: "We sit at eye level and listen to your questions first, before you ever lean back in the chair.",
      imageUrl: "/images/about-gentle-checkup.webp",
      imageAlt: "Friendly dentist talking calmly with a relaxed patient before starting an examination",
      placeholderComment: "REPLACE PHOTO: Real photo of your dentist smiling without a mask, talking warmly with a seated adult or parent.",
    },
    {
      id: "about-3",
      title: "Hospital-grade sterilisation",
      description: "Every mirror and probe is autoclaved and opened from a sealed pouch right in front of you.",
      imageUrl: "/images/about-sterilisation-care.webp",
      imageAlt: "Clean dental room showing sealed, sterilised instrument pouches ready for a visit",
      placeholderComment: "REPLACE PHOTO: Real photo of your clean sterilisation zone or sealed autoclave pouches (avoid sharp instruments near faces).",
    },
  ],

  // 8. Care Journey (3 steps to reduce anxiety)
  careJourneySteps: [
    {
      stepNumber: "Step 1",
      title: "Book your visit",
      description:
        "Pick a morning, afternoon or evening time online or by phone. Let us know if you or your child feel nervous—we gladly allow extra quiet time.",
      reassuranceTag: "No rush, no waiting room crowds",
    },
    {
      stepNumber: "Step 2",
      title: "Meet your dentist",
      description:
        "We start with a friendly chat. For children, we count teeth on a toy model first. For adults, we explain what we see in plain language.",
      reassuranceTag: "You can pause at any time by raising a hand",
    },
    {
      stepNumber: "Step 3",
      title: "Personalised care",
      description:
        "Before doing any treatment, we share a clear written plan and exact costs. You decide what feels right for your family and budget.",
      reassuranceTag: "Clear costs upfront, zero surprise fees",
    },
  ],

  // 9. Numbered Services (01 to 07 as specified) [PLACEHOLDER: Replace service photos with real photos]
  services: [
    {
      id: "Teeth whitening",
      number: "01",
      name: "Teeth whitening",
      shortDescription:
        "Gentle, enamel-safe brightening that lifts tea, coffee and everyday staining while keeping sensitive teeth comfortable.",
      gentleNote: "Includes a sensitivity check and soothing fluoride gel so your teeth feel calm afterwards.",
      typicalDuration: "45 mins",
      idealFor: "Adults & older teens",
      imageUrl: "/images/service-01-whitening.webp",
      imageAlt: "Relaxed adult patient smiling naturally after a gentle teeth whitening visit",
      imagePlaceholderComment: "REPLACE PHOTO: Natural photo of a smiling adult patient in bright daylight (avoid artificial stock-looking neon white teeth).",
    },
    {
      id: "Smile makeovers",
      number: "02",
      name: "Smile makeovers",
      shortDescription:
        "Conservative bonding, natural-shade ceramic crowns and gap closures designed to look like your own healthy teeth.",
      gentleNote: "We preview shapes and shades together so your smile still looks naturally like you.",
      typicalDuration: "1 to 2 visits",
      idealFor: "Chipped, worn or uneven front teeth",
      imageUrl: "/images/service-02-makeover.webp",
      imageAlt: "Dentist and patient looking at a natural tooth shade guide together",
      imagePlaceholderComment: "REPLACE PHOTO: Dentist and patient smiling while reviewing a shade guide or tablet preview together.",
    },
    {
      id: "Bite correction",
      number: "03",
      name: "Bite correction",
      shortDescription:
        "Early jaw guidance for growing children, comfortable braces, and clear aligners for teens and adults.",
      gentleNote: "Early check-ups around age 7 help guide crowded teeth gently as your child grows.",
      typicalDuration: "30 min review",
      idealFor: "Kids (age 7+), teens & adults",
      imageUrl: "/images/service-03-bite.webp",
      imageAlt: "Parent and teenager discussing clear aligners and bite correction with the orthodontist",
      imagePlaceholderComment: "REPLACE PHOTO: Friendly orthodontist showing a clear aligner model to a teenager and parent.",
    },
    {
      id: "Child dental check-ups",
      number: "04",
      name: "Child dental check-ups",
      shortDescription:
        "Playful, unhurried check-ups for toddlers and school kids, including gentle cleaning, fluoride protection and brushing tips.",
      gentleNote: "First-time visitors get to explore the chair ride and choose a sticker at the end.",
      typicalDuration: "30 mins",
      idealFor: "Babies, toddlers & children up to 14",
      imageUrl: "/images/service-04-kids-checkup.webp",
      imageAlt: "Happy young child holding a giant toothbrush model next to a smiling pediatric dentist",
      imagePlaceholderComment: "REPLACE PHOTO: Child smiling with parent in clinic chair holding a big toothbrush prop (no masks or metal tools near face).",
    },
    {
      id: "Root canal treatment",
      number: "05",
      name: "Root canal treatment",
      shortDescription:
        "Quiet, modern single-sitting or two-sitting root canal care to save an infected tooth and stop deep throbbing pain.",
      gentleNote: "We apply numbing gel on the gum before local anaesthesia and wait until the tooth is completely numb.",
      typicalDuration: "45 to 60 mins",
      idealFor: "Deep decay or lingering sensitivity",
      imageUrl: "/images/service-05-root-canal.webp",
      imageAlt: "Dentist calmly explaining a tooth X-ray on a screen to a comfortable patient",
      imagePlaceholderComment: "REPLACE PHOTO: Calm consultation photo where the dentist explains a tooth diagram on a tablet to a seated adult.",
    },
    {
      id: "Toothache relief",
      number: "06",
      name: "Toothache relief",
      shortDescription:
        "Same-day relief for sudden tooth pain, swollen gums, broken fillings or knocked teeth for children and adults.",
      gentleNote: "Our first priority is getting you out of pain gently on the same day, before planning next steps.",
      typicalDuration: "30 mins (Same-day priority)",
      idealFor: "Urgent toothache or broken tooth",
      imageUrl: "/images/service-06-toothache.webp",
      imageAlt: "Caring dentist welcoming a patient for same-day toothache relief",
      imagePlaceholderComment: "REPLACE PHOTO: Reassuring photo of dentist greeting a patient at the door or chairside with a calm smile.",
    },
    {
      id: "Dental sealants",
      number: "07",
      name: "Dental sealants",
      shortDescription:
        "A thin, protective coating painted onto the deep grooves of children's back molars to keep food and cavities out.",
      gentleNote: "Completely painless—no drilling and no numbing needed. Takes just a few minutes per tooth.",
      typicalDuration: "20 mins",
      idealFor: "Children aged 6 to 13",
      imageUrl: "/images/service-07-sealants.webp",
      imageAlt: "School-age child giving a thumbs up after a quick, painless dental sealant visit",
      imagePlaceholderComment: "REPLACE PHOTO: School-age child smiling and giving a thumbs up with their parent beside the dental chair.",
    },
  ] as ClinicService[],

  // 10. Kids Corner Section
  kidsCorner: {
    headingPrefix: "A calm, playful space for",
    headingHighlight: "little",
    headingSuffix: "explorers",
    intro:
      "Many adults feel nervous at the dentist because of rushed childhood visits. We do things differently for your children—no surprises, no holding kids down, and plenty of patience.",
    whatToExpect: [
      {
        title: "Tell, show, then do",
        text: "We name every friendly tool first—like our 'water whistle' and 'tooth counter mirror'—and let your child touch it on their finger before we look inside.",
      },
      {
        title: "Parents stay right beside them",
        text: "You are always welcome in the treatment room. Younger toddlers can even sit right on your lap during their check-up.",
      },
      {
        title: "Stop-signal hand raise",
        text: "We practice raising one hand before we begin. If your child raises their hand, we pause right away so they know they are in control.",
      },
      {
        title: "Happy memories from age one",
        text: "Early visits when nothing hurts build lifelong confidence and prevent painful cavities later on.",
      },
    ],
    images: [
      {
        url: "/images/kids-first-visit.webp",
        alt: "Parent holding their child's hand while the dentist gives a friendly high-five",
        caption: "Parents stay right next to their child throughout the visit.",
        placeholderComment: "REPLACE PHOTO: Real photo of a parent holding their child's hand while the pediatric dentist gives a warm high-five.",
      },
      {
        url: "/images/kids-tell-show-do.webp",
        alt: "Young child counting teeth on a friendly puppet model with the dentist",
        caption: "Counting teeth on our puppet friend before we count yours.",
        placeholderComment: "REPLACE PHOTO: Real photo of a child laughing and brushing a plush puppet's teeth in the clinic.",
      },
    ],
  },

  // 11. Doctors / Team (4 doctor cards, photo ALWAYS visible, plus detailed bios) [PLACEHOLDER: Replace with your real doctors]
  doctors: [
    {
      id: "doc-1",
      name: "Dr. Ananya Sharma", // [PLACEHOLDER: Replace with Doctor 1 name]
      qualification: "BDS, MDS (Pediatric & Preventive Dentistry)", // [PLACEHOLDER]
      registrationNumber: "State Dental Council Reg. No. 28419-A", // [PLACEHOLDER: Replace with actual registration number]
      yearsExperience: 12,
      specialty: "Children's Dentistry & First Visits",
      experienceNote: "12 years caring for babies, kids and anxious young patients",
      reassuranceQuote: "Every child sets their own pace in my room—we never rush a frightened child.",
      detailedBio:
        "Dr. Ananya Sharma has spent over a decade turning first dental check-ups into calm, happy milestones for toddlers and school-age children. Trained in behavioural pediatric dentistry, she uses the 'tell-show-do' method, playful tooth-counting props, and non-invasive preventive care so children grow up completely free of dental fear. She also works closely with parents of neurodivergent children and kids with sensory sensitivities to tailor quiet, unhurried appointments.",
      educationAndTraining: [
        "Master of Dental Surgery (MDS) in Pediatric & Preventive Dentistry – Government Dental College & Research Institute",
        "Bachelor of Dental Surgery (BDS) – Rajiv Gandhi University of Health Sciences",
        "Certified in Minimal Intervention Pediatric Dentistry & Child Behaviour Guidance (ISPPD)",
      ],
      clinicalFocusAreas: [
        "First-birthday & toddler check-ups",
        "Painless fluoride varnish & molar fissure sealants",
        "Gentle kids' fillings & milk-tooth crowns",
        "Care for anxious or sensory-sensitive children",
      ],
      languagesSpoken: ["English", "Kannada", "Hindi"],
      consultationDays: "Mon – Sat · 9:30 am – 6:30 pm",
      photoUrl: "/images/doctor-01-ananya.webp",
      photoAlt: "Portrait of Dr. Ananya Sharma, BDS, MDS, Pediatric Dentist smiling in clinic scrubs",
      photoPlaceholderComment: "REPLACE PHOTO: Warm, unmasked portrait of Doctor 1 smiling in clinic attire against a bright, simple background.",
    },
    {
      id: "doc-2",
      name: "Dr. Rahul Verma", // [PLACEHOLDER: Replace with Doctor 2 name]
      qualification: "BDS, MDS (Conservative Dentistry & Endodontics)", // [PLACEHOLDER]
      registrationNumber: "State Dental Council Reg. No. 24108-A", // [PLACEHOLDER: Replace with actual registration number]
      yearsExperience: 14,
      specialty: "Painless Root Canals & Tooth Saving",
      experienceNote: "14 years helping adults relieve toothache and keep natural teeth",
      reassuranceQuote: "My promise is simple: we do not begin until you tell me your tooth feels completely numb.",
      detailedBio:
        "Dr. Rahul Verma specialises in saving deeply decayed, cracked, or aching natural teeth through gentle microscopic and rotary root canal treatments. Over 14 years of clinical practice, he has helped thousands of nervous adults overcome their fear of toothache visits by combining topical numbing gels, slow-delivery local anaesthesia, and clear plain-language explanations of digital X-rays before any step begins.",
      educationAndTraining: [
        "Master of Dental Surgery (MDS) in Conservative Dentistry & Endodontics – Manipal College of Dental Sciences",
        "Bachelor of Dental Surgery (BDS) – Nair Hospital Dental College",
        "Advanced Fellowship in Micro-Endodontics & Biomimetic Tooth Restoration",
      ],
      clinicalFocusAreas: [
        "Single-sitting & complex root canal treatments",
        "Same-day emergency toothache & swelling relief",
        "Natural-shade composite bonding & inlays",
        "Re-treatment of old failing root canals",
      ],
      languagesSpoken: ["English", "Hindi", "Kannada", "Tamil"],
      consultationDays: "Mon – Sat · 10:00 am – 8:00 pm",
      photoUrl: "/images/doctor-02-rahul.webp",
      photoAlt: "Portrait of Dr. Rahul Verma, BDS, MDS, Endodontist with a calm, reassuring smile",
      photoPlaceholderComment: "REPLACE PHOTO: Warm, unmasked portrait of Doctor 2 smiling in clinic attire.",
    },
    {
      id: "doc-3",
      name: "Dr. Meera Nair", // [PLACEHOLDER: Replace with Doctor 3 name]
      qualification: "BDS, MDS (Orthodontics & Dentofacial Orthopedics)", // [PLACEHOLDER]
      registrationNumber: "State Dental Council Reg. No. 31904-A", // [PLACEHOLDER: Replace with actual registration number]
      yearsExperience: 10,
      specialty: "Bite Correction, Braces & Clear Aligners",
      experienceNote: "10 years guiding growing jaws and straightening teen and adult smiles",
      reassuranceQuote: "Gentle bite checks around age seven can make teenage orthodontics much simpler.",
      detailedBio:
        "Dr. Meera Nair focuses on healthy bite alignment for growing children, teenagers, and working adults. She believes orthodontic care should protect long-term jaw comfort and easy tooth brushing—not just aesthetics. By spotting crowding or jaw imbalances early around age seven, she often helps children avoid tooth extractions later in life, and offers comfortable ceramic braces and removable clear aligners for older teens and adults.",
      educationAndTraining: [
        "Master of Dental Surgery (MDS) in Orthodontics & Dentofacial Orthopedics – A.B. Shetty Memorial Institute of Dental Sciences",
        "Bachelor of Dental Surgery (BDS) – Government Dental College, Kozhikode",
        "Member of the Indian Orthodontic Society (IOS) & Certified Clear Aligner Provider",
      ],
      clinicalFocusAreas: [
        "Age-7 interceptive jaw & bite guidance for kids",
        "Low-friction metal & tooth-coloured ceramic braces",
        "Removable clear aligner therapy for teens & adults",
        "Post-orthodontic retention & habit appliances",
      ],
      languagesSpoken: ["English", "Malayalam", "Kannada", "Hindi"],
      consultationDays: "Tue, Thu, Sat & Sun · 10:00 am – 7:30 pm",
      photoUrl: "/images/doctor-03-meera.webp",
      photoAlt: "Portrait of Dr. Meera Nair, BDS, MDS, Orthodontist smiling warmly",
      photoPlaceholderComment: "REPLACE PHOTO: Warm, unmasked portrait of Doctor 3 smiling in clinic attire.",
    },
    {
      id: "doc-4",
      name: "Dr. Karthik Iyer", // [PLACEHOLDER: Replace with Doctor 4 name]
      qualification: "BDS (General, Family & Senior Dental Care)", // [PLACEHOLDER]
      registrationNumber: "State Dental Council Reg. No. 26752-A", // [PLACEHOLDER: Replace with actual registration number]
      yearsExperience: 11,
      specialty: "Family Check-ups, Dentures & Nervous Patients",
      experienceNote: "11 years looking after adults, elders and families returning after a long gap",
      reassuranceQuote: "Haven't seen a dentist in ten years? There is zero judgement here—only a helpful step forward.",
      detailedBio:
        "Dr. Karthik Iyer looks after whole-family preventive dentistry, gum health, crowns, and comfortable replacement teeth for older adults. Known for his unhurried chairside manner, he takes extra care with patients who have avoided the dentist for years due to past painful experiences, as well as senior citizens managing diabetes, blood pressure medications, or loose dentures.",
      educationAndTraining: [
        "Bachelor of Dental Surgery (BDS) – Sri Ramachandra Dental College & Hospital",
        "Postgraduate Certificate in Geriatric Dentistry & Prosthetic Rehabilitation",
        "Continuing Education in Gentle Periodontal Care & Medical-Risk Dental Management",
      ],
      clinicalFocusAreas: [
        "Whole-family preventive check-ups & ultrasonic scaling",
        "Lightweight flexible & implant-supported dentures",
        "Ceramic crowns, bridges & worn-tooth repair",
        "Step-by-step care for high-anxiety adults & seniors",
      ],
      languagesSpoken: ["English", "Tamil", "Kannada", "Telugu", "Hindi"],
      consultationDays: "Mon – Sun · 9:30 am – 8:00 pm",
      photoUrl: "/images/doctor-04-karthik.webp",
      photoAlt: "Portrait of Dr. Karthik Iyer, BDS, General and Family Dentist smiling kindly",
      photoPlaceholderComment: "REPLACE PHOTO: Warm, unmasked portrait of Doctor 4 smiling in clinic attire.",
    },
  ] as DoctorProfile[],

  // 12. Testimonials (Marked clearly as sample content until owner replaces them)
  testimonials: [
    {
      id: "rev-1",
      patientName: "Priya & Aarav M. (Sample Review)", // [PLACEHOLDER: Replace with real verified patient review]
      visitContext: "Child dental check-up & sealants (Age 5)",
      quote:
        "My five-year-old was terrified of doctors, but Dr. Ananya spent ten minutes letting him press the chair buttons and count teeth on a dinosaur first. He walked out asking when he can come back.",
      dateLabel: "Sample review – replace in clinicConfig.ts",
      isSamplePlaceholder: true,
    },
    {
      id: "rev-2",
      patientName: "Ramesh K., 68 (Sample Review)", // [PLACEHOLDER: Replace with real verified patient review]
      visitContext: "Toothache relief & root canal treatment",
      quote:
        "I avoided dentists for eight years out of fear. Dr. Rahul explained the X-ray in plain words, numbed my gum with gel first, and finished my root canal without any sharp pain. Very honest pricing too.",
      dateLabel: "Sample review – replace in clinicConfig.ts",
      isSamplePlaceholder: true,
    },
    {
      id: "rev-3",
      patientName: "Deepa S. (Sample Review)", // [PLACEHOLDER: Replace with real verified patient review]
      visitContext: "Whole-family Saturday check-ups",
      quote:
        "We bring both our kids and my mother here together on Saturdays. The ground-floor entrance is easy for my mother's knees, appointments run on time, and they never push unnecessary treatments.",
      dateLabel: "Sample review – replace in clinicConfig.ts",
      isSamplePlaceholder: true,
    },
    {
      id: "rev-4",
      patientName: "Vikram & Neha T. (Sample Review)", // [PLACEHOLDER: Replace with real verified patient review]
      visitContext: "Teenager bite correction & aligners",
      quote:
        "Dr. Meera gave us a clear written comparison between regular braces and aligners for our daughter, with an exact monthly payment plan. No hidden charges at any visit.",
      dateLabel: "Sample review – replace in clinicConfig.ts",
      isSamplePlaceholder: true,
    },
    {
      id: "rev-5",
      patientName: "Farah A. (Sample Review)", // [PLACEHOLDER: Replace with real verified patient review]
      visitContext: "Emergency evening toothache visit",
      quote:
        "Called at 5 pm with a bad toothache and they fitted me in the same evening. Within half an hour the throbbing stopped and I could sleep peacefully that night.",
      dateLabel: "Sample review – replace in clinicConfig.ts",
      isSamplePlaceholder: true,
    },
  ] as SampleTestimonial[],

  // 13. FAQ (5 items: first visit, children, pain, payment and insurance, emergencies)
  faqs: [
    {
      id: "faq-first-visit",
      category: "First visit",
      question: "What happens at my first visit, especially if I haven't seen a dentist in years?",
      answer:
        "We start with a friendly conversation—never a lecture. Your dentist will listen to your concerns, gently examine your teeth and gums, take a low-radiation digital X-ray only if needed, and talk you through your options with written costs before any treatment begins.",
    },
    {
      id: "faq-children",
      category: "Children",
      question: "At what age should I bring my child, and what if they cry or refuse to open their mouth?",
      answer:
        "We recommend a first visit around your child's first birthday or when their first milk teeth appear. It is completely normal for young children to feel shy or cry! We never force a child. We use our gentle 'tell-show-do' approach, let toddlers sit on a parent's lap, and go at their comfort level.",
    },
    {
      id: "faq-pain",
      category: "Pain & anxiety",
      question: "How do you keep treatments comfortable for nervous patients who fear needles or pain?",
      answer:
        "Before giving any local anaesthetic, we dry the gum and apply a fruit-flavoured numbing gel for two full minutes so you barely feel a pinch. We wait until your tooth is completely numb, and we agree on a hand-raise stop signal so you can pause for a breather whenever you wish.",
    },
    {
      id: "faq-payment",
      category: "Payment & insurance",
      question: "How do payments, cost estimates, and dental insurance reimbursement work?",
      answer:
        "Before starting any procedure, we give you a clear printed or WhatsApp cost estimate with zero surprise charges. We accept UPI, debit/credit cards, net banking and cash. For patients with dental insurance or corporate health allowances, we provide GST-compliant itemised invoices and clinical notes for easy reimbursement.",
    },
    {
      id: "faq-emergencies",
      category: "Emergencies",
      question: "What should I do if my child or I have a sudden toothache, swelling, or a knocked-out tooth?",
      answer:
        "Call us immediately on our clinic phone number. We keep dedicated same-day emergency slots open every day so you don't have to wait in pain. If a permanent adult tooth is knocked out, hold it by the crown (not the root), place it in cold milk, and reach the clinic within 60 minutes.",
    },
  ] as FaqItem[],

  // 14. Privacy & Data Protection Details (DPDP Act 2023 compliant)
  privacyPolicy: {
    lastUpdated: "November 2026",
    retentionMonthsUnbooked: 12,
    dataProtectionContactEmail: "privacy@sunnybrookdental.example.com", // [PLACEHOLDER: Replace with your privacy contact email]
  },

  // 15. Interactive D3.js Treatment Cost & Insurance Estimator [PLACEHOLDER: Adjust fees to match your clinic tariff]
  costEstimator: {
    currencySymbol: "₹",
    disclaimerNote:
      "Estimates are for guidance only. We share a written, itemised treatment plan after your check-up before any work begins.",
    insurancePlans: [
      {
        id: "standard-self",
        name: "No insurance (Standard clinic fee)",
        shortLabel: "No insurance",
        description: "Clear, upfront clinic tariff with zero hidden charges. Pay by UPI, card, or cash.",
        annualCapInr: 0,
        coverageRates: {
          preventive: 0,
          urgentAndRootCanal: 0,
          orthodonticAndMakeover: 0,
          whitening: 0,
        },
      },
      {
        id: "basic-opd",
        name: "Basic OPD Dental Cover",
        shortLabel: "Basic OPD Plan",
        description: "Covers most preventive child check-ups and half of urgent pain relief up to ₹8,000/year.",
        annualCapInr: 8000,
        coverageRates: {
          preventive: 0.8,
          urgentAndRootCanal: 0.5,
          orthodonticAndMakeover: 0.2,
          whitening: 0.1,
        },
      },
      {
        id: "corporate-family",
        name: "Corporate Family Health + Dental",
        shortLabel: "Corporate Family",
        description: "Popular employer OPD benefit covering 90% of kids check-ups and 75% of root canals up to ₹20,000/year.",
        annualCapInr: 20000,
        coverageRates: {
          preventive: 0.9,
          urgentAndRootCanal: 0.75,
          orthodonticAndMakeover: 0.45,
          whitening: 0.25,
        },
      },
      {
        id: "comprehensive-plus",
        name: "Comprehensive Kids & Family Plus",
        shortLabel: "Comprehensive Plus",
        description: "Full cover for child check-ups & sealants plus high reimbursement on restorative care up to ₹35,000/year.",
        annualCapInr: 35000,
        coverageRates: {
          preventive: 1.0,
          urgentAndRootCanal: 0.85,
          orthodonticAndMakeover: 0.6,
          whitening: 0.35,
        },
      },
    ],
    serviceBaseCosts: [
      {
        serviceId: "Teeth whitening",
        number: "01",
        shortName: "01. Teeth whitening",
        category: "whitening" as const,
        baseCostInr: 6500, // [PLACEHOLDER: Replace with your standard whitening fee]
        unitLabel: "per arch session",
      },
      {
        serviceId: "Smile makeovers",
        number: "02",
        shortName: "02. Smile makeovers",
        category: "orthodonticAndMakeover" as const,
        baseCostInr: 9500, // [PLACEHOLDER: Replace with your bonding / crown starting fee]
        unitLabel: "per tooth restoration",
      },
      {
        serviceId: "Bite correction",
        number: "03",
        shortName: "03. Bite correction",
        category: "orthodonticAndMakeover" as const,
        baseCostInr: 14000, // [PLACEHOLDER: Replace with initial orthodontic appliance / phase fee]
        unitLabel: "initial starter phase",
      },
      {
        serviceId: "Child dental check-ups",
        number: "04",
        shortName: "04. Child check-ups",
        category: "preventive" as const,
        baseCostInr: 1200, // [PLACEHOLDER: Replace with child check-up + fluoride fee]
        unitLabel: "check-up + gentle clean",
      },
      {
        serviceId: "Root canal treatment",
        number: "05",
        shortName: "05. Root canal",
        category: "urgentAndRootCanal" as const,
        baseCostInr: 5500, // [PLACEHOLDER: Replace with standard root canal fee]
        unitLabel: "complete single tooth",
      },
      {
        serviceId: "Toothache relief",
        number: "06",
        shortName: "06. Toothache relief",
        category: "urgentAndRootCanal" as const,
        baseCostInr: 1500, // [PLACEHOLDER: Replace with emergency consultation + X-ray + relief fee]
        unitLabel: "same-day relief + X-ray",
      },
      {
        serviceId: "Dental sealants",
        number: "07",
        shortName: "07. Dental sealants",
        category: "preventive" as const,
        baseCostInr: 1800, // [PLACEHOLDER: Replace with protective sealant fee for 2 molars]
        unitLabel: "pair of back molars",
      },
    ],
  },

  // 16. First Visit Guide for Parents & Kids [PLACEHOLDER: Customize checklist & tips for your clinic]
  firstVisitGuide: {
    eyebrow: "First visit preparation guide",
    headingPrefix: "Helping your child feel",
    headingHighlight: "excited",
    headingSuffix: "for their first check-up",
    intro:
      "A calm, happy first dental visit sets your child up for a lifetime of healthy smiles. Use our interactive parent checklist and age-by-age tips below to prepare at home.",
    checklistItems: [
      {
        id: "chk-morning-slot",
        stage: "1–2 days before",
        title: "Choose a well-rested morning or post-nap time",
        detail:
          "Young children cope best when they are fresh and not hungry. Avoid scheduling right over your child's usual nap or mealtime.",
      },
      {
        id: "chk-play-count",
        stage: "1–2 days before",
        title: "Play 'count the teeth' on a favourite stuffed toy",
        detail:
          "Take turns holding a small spoon or toothbrush to count a teddy bear's teeth, then count yours so looking inside mouths feels like a familiar game.",
      },
      {
        id: "chk-hand-signal",
        stage: "1–2 days before",
        title: "Practice the one-hand stop signal together",
        detail:
          "Let your child know that if they ever want the dentist to pause for a moment, all they have to do is raise one hand like a superhero.",
      },
      {
        id: "chk-pack-brush",
        stage: "Morning of visit",
        title: "Pack your child's own toothbrush and toothpaste",
        detail:
          "Bringing their own brush lets our pediatric dentist show them fun brushing circles using the brush they already recognise at home.",
      },
      {
        id: "chk-comfort-buddy",
        stage: "Morning of visit",
        title: "Bring a favourite small toy or comfort blanket",
        detail:
          "Holding a familiar plush friend in the dental chair gives toddlers immediate reassurance—and we can 'check' their toy's teeth first!",
      },
      {
        id: "chk-light-snack",
        stage: "Morning of visit",
        title: "Give a light snack 45 minutes before arriving",
        detail:
          "A satisfied tummy keeps energy steady, while leaving 45 minutes before the appointment ensures a comfortable tummy during the check-up.",
      },
      {
        id: "chk-arrive-early",
        stage: "Morning of visit",
        title: "Arrive 10 minutes early to explore the picture-book corner",
        detail:
          "Having a few quiet minutes to read a storybook and meet our reception team helps your child settle in without feeling rushed.",
      },
    ],
    ageGroupTips: [
      {
        id: "age-toddlers",
        ageRange: "Ages 1 – 3",
        label: "Babies & toddlers",
        summary: "Knee-to-knee lap check-ups & teething guidance",
        whatHappens:
          "Toddlers never have to sit alone in the big chair. You sit knee-to-knee with Dr. Ananya while your child rests their head right in your lap.",
        tips: [
          "Bring their regular sippy cup or pacifier so we can share gentle weaning and tooth-friendly habits.",
          "It is completely normal if a toddler wiggles or cries briefly—that actually helps us get a quick, gentle look at their milk teeth!",
          "Visits take just 15 to 20 minutes and focus on counting teeth, checking gums, and answering your feeding questions.",
        ],
      },
      {
        id: "age-preschool",
        ageRange: "Ages 4 – 6",
        label: "Preschoolers & kindergartners",
        summary: "Playful 'tell-show-do' discovery & chair rides",
        whatHappens:
          "Preschoolers love pressing buttons and learning how things work. We introduce our 'water whistle', 'wind straw', and 'tooth counter mirror' on their finger first.",
        tips: [
          "Tell your child they will get to ride the magic up-and-down chair and wear cool sunglasses under the bright light.",
          "Avoid promising big food treats for 'being brave'—that can make children wonder if something scary is coming. Treat it like a fun trip to the haircut or shoe shop.",
          "Let your child answer the dentist's friendly questions first so they feel proud and independent.",
        ],
      },
      {
        id: "age-school",
        ageRange: "Ages 7 – 12",
        label: "School-age children",
        summary: "Permanent molar protection & early bite checks",
        whatHappens:
          "Around age 6 to 7, permanent back molars and adult front teeth appear. We gently check jaw growth, polish away plaque, and protect deep molar grooves.",
        tips: [
          "If your child plays school sports, ask us about a comfortable custom mouthguard.",
          "Explain how painless dental sealants work—like painting a clear raincoat onto back teeth so food cannot hide in the grooves.",
          "Encourage your child to ask the dentist their own questions about loose milk teeth or brushing.",
        ],
      },
    ],
    phraseSwaps: [
      {
        insteadOf: "“Don’t be scared, it won’t hurt and there are no needles.”",
        trySaying: "“The dentist is going to count how many strong teeth you have and show you a tiny mirror!”",
        whyItHelps: "Young children hear action words like 'hurt' and 'needle' even when you put 'no' in front of them.",
      },
      {
        insteadOf: "“You have to sit completely still and be brave today.”",
        trySaying: "“You can hold your teddy bear and raise your hand anytime you want a little pause.”",
        whyItHelps: "Giving children a clear stop signal replaces helplessness with calm confidence.",
      },
      {
        insteadOf: "“If you don’t brush properly, the dentist will have to drill a cavity.”",
        trySaying: "“The dentist is our friendly helper who teaches us tricks to keep your smile shiny and comfortable.”",
        whyItHelps: "Keeping the dentist as a friendly teammate prevents bedtime brushing battles from turning into clinic anxiety.",
      },
    ],
  },
};

