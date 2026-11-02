const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const contentJsonPath = path.join(__dirname, 'specialities-services-content.json');
const contentJson = JSON.parse(fs.readFileSync(contentJsonPath, 'utf8'));

const URGENT_NOTE =
  'Seek urgent medical care if you have severe breathlessness, chest pain, blood in the urine or sputum, sudden weakness, a very high fever, or sudden vision loss.';

const URGENT_SLUGS = [
  'lupus-sle',
  'vasculitis',
  'systemic-sclerosis-myositis-sjogrens',
  'juvenile-childhood-arthritis',
];

function getInitialSeedData() {
  const adminPasswordPlain = process.env.ADMIN_PASSWORD || 'UjmeMkFNsQ3Rk2f4rV6Q';
  const adminPasswordHash = bcrypt.hashSync(adminPasswordPlain, 10);
  const editorPasswordHash = bcrypt.hashSync('EditorPass2026!', 10);

  const users = [
    {
      _id: 'user_admin_1',
      name: 'Dr. Sajib Admin',
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: adminPasswordHash,
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'user_editor_1',
      name: 'Chamber Staff Editor',
      email: 'editor@example.com',
      password: editorPasswordHash,
      role: 'editor',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const doctors = [
    {
      _id: 'doctor_1',
      name: {
        en: 'Dr. Md. Kamrul Hasan Sajib',
        bn: 'ডা: মো: কামরুল হাসান সজীব',
      },
      title_line: {
        en: 'Dhaka Medical College Hospital, Dhaka',
        bn: 'ঢাকা মেডিকেল কলেজ হাসপাতাল, ঢাকা',
      },
      credentials: {
        en: 'MBBS, BCS (Health), MD (Rheumatology), ECRD (Switzerland), FACR (USA)',
        bn: 'এমবিবিএস, বিসিএস (স্বাস্থ্য), এমডি (রিউমাটোলজি), ইসিআরডি (সুইজারল্যান্ড), এফএসিআর (ইউএসএ)',
      },
      specialty_line: {
        en: 'Rheumatology, arthritis and joint pain specialist',
        bn: 'বাত-ব্যথা ও রিউমাটোলজি বিশেষজ্ঞ',
      },
      bio: {
        en: "Dr. Md. Kamrul Hasan Sajib is a rheumatologist at Dhaka Medical College Hospital, Dhaka. He treats arthritis, joint pain and autoimmune conditions.\n\nHis qualifications are MBBS, BCS (Health) and MD in Rheumatology. He also holds ECRD (Switzerland) and FACR (USA).\n\nHe sees patients at Japan Bangladesh Friendship Hospital in Dhanmondi, Dhaka, and at Ibn Sina D.Lab and Consultation Center in Cumilla. Please call the chamber to book a visit.",
        bn: '',
      },
      years_experience: null,
      photo_path: null,
      facebook_url: 'https://www.facebook.com/dr.khsajib',
      review_note:
        'DRAFT FOR DR. SAJIB TO REVIEW: this bio was written only from the facts in the build brief. Rank (Consultant or Registrar) is deliberately left out until confirmed. Years of experience is empty, so no experience badge is shown. Bangla bio still needed.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const chambers = [
    {
      _id: 'chamber_1',
      name: {
        en: 'Japan Bangladesh Friendship Hospital (JBFH)',
        bn: 'জাপান বাংলাদেশ ফ্রেন্ডশিপ মেডিকেল সার্ভিসেস লিঃ',
      },
      address: {
        en: '55 Satmasjid Road (Zigatola Bus Stand), Dhanmondi, Dhaka-1209',
        bn: '৫৫, সাতমসজিদ রোড (জিগাতলা বাস স্ট্যান্ড), ধানমন্ডি, ঢাকা-১২০৯',
      },
      phone_primary: '01711-647877',
      phone_secondary: null,
      email: 'jbfh24@yahoo.com',
      website: 'www.jbfh.org.bd',
      hours_text: {
        en: 'Saturday to Wednesday, 7 pm to 10 pm',
        bn: 'শনিবার থেকে বুধবার, সন্ধ্যা ৭টা থেকে রাত ১০টা পর্যন্ত',
      },
      hours_note: { en: '', bn: '' },
      map_url: null,
      is_active: true,
      verify_note: 'Other phone numbers on the card were unreadable. Confirm and add.',
      sort_order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'chamber_2',
      name: {
        en: 'Ibn Sina D.Lab and Consultation Center, Cumilla',
        bn: 'ইবনে সিনা ডি. ল্যাব এন্ড কমসালটেশন সেন্টার, কুমিল্লা',
      },
      address: {
        en: '29 Kot Bari Road, Tomsom Bridge, Cumilla-3500',
        bn: '২৯, কোট বাড়ি রোড, টমছম ব্রিজ, কুমিল্লা-৩৫০০',
      },
      phone_primary: '01841-212275',
      phone_secondary: '01841-212276',
      email: null,
      website: null,
      hours_text: {
        en: 'Every Friday, 10 am to 7 pm',
        bn: 'প্রতি শুক্রবার সকাল ১০টা থেকে সন্ধ্যা ৭টা পর্যন্ত',
      },
      hours_note: { en: '', bn: '' },
      map_url: null,
      is_active: true,
      verify_note:
        'Card shows 01841-222275/276, Ibn Sina Trust site shows 01841-212275/276. Confirm which is correct.',
      sort_order: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'chamber_3',
      name: {
        en: 'BRAC Healthcare, Siddheswari, Dhaka',
        bn: '',
      },
      address: {
        en: '116/1 Siddheswari Circular Road, Dhaka-1217',
        bn: '',
      },
      phone_primary: null,
      phone_secondary: null,
      email: null,
      website: null,
      hours_text: { en: '', bn: '' },
      hours_note: { en: '', bn: '' },
      map_url: null,
      is_active: false,
      verify_note: 'Not on his printed cards. Keep hidden until he confirms he still sits here.',
      sort_order: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const specialities = contentJson.specialities.map((item, idx) => {
    const urgent = URGENT_SLUGS.includes(item.slug);
    return {
      _id: `spec_${idx + 1}`,
      slug: item.slug,
      title: { en: item.title, bn: '' },
      summary: { en: item.summary, bn: '' },
      what_it_is: { en: item.what_it_is, bn: '' },
      common_symptoms: { en: item.common_symptoms || [], bn: [] },
      how_dr_sajib_helps: { en: item.how_dr_sajib_helps, bn: '' },
      when_to_see: { en: item.when_to_see, bn: '' },
      urgent_note: urgent ? { en: URGENT_NOTE, bn: '' } : { en: '', bn: '' },
      sort_order: item.order,
      is_published: true,
      review_note: urgent
        ? 'DRAFT FOR DR. SAJIB TO APPROVE: the urgent note wording was added by the developer. Bangla translation needed.'
        : 'Bangla translation needed (reviewed, not machine translated).',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const specialServices = contentJson.special_services.map((item, idx) => ({
    _id: `srv_${idx + 1}`,
    slug: item.slug,
    title: { en: item.title, bn: '' },
    summary: { en: item.summary, bn: '' },
    what_it_is: { en: item.what_it_is, bn: '' },
    who_needs_it: { en: item.who_needs_it || [], bn: [] },
    what_to_expect: { en: item.what_to_expect, bn: '' },
    benefits: { en: item.benefits, bn: '' },
    how_dr_sajib_helps: { en: '', bn: '' },
    when_to_see: { en: '', bn: '' },
    urgent_note: { en: '', bn: '' },
    sort_order: item.order,
    is_published: true,
    review_note:
      'Dr. Sajib to confirm procedure details (timings, preparation) as practice can vary by chamber. Bangla translation needed.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const categories = [
    { _id: 'cat_1', slug: 'gout-and-diet', name: { en: 'Gout and Diet', bn: 'গেঁটে বাত ও খাবার' } },
    { _id: 'cat_2', slug: 'arthritis-care', name: { en: 'Arthritis Care', bn: 'আর্থ্রাইটিসের যত্ন' } },
    {
      _id: 'cat_3',
      slug: 'lupus-and-autoimmune',
      name: { en: 'Lupus and Autoimmune', bn: 'লুপাস ও অটোইমিউন রোগ' },
    },
    { _id: 'cat_4', slug: 'joint-protection', name: { en: 'Joint Protection', bn: 'জয়েন্টের সুরক্ষা' } },
    { _id: 'cat_5', slug: 'medicines', name: { en: 'Medicines', bn: 'ওষুধ' } },
    { _id: 'cat_6', slug: 'news', name: { en: 'News', bn: 'খবর' } },
  ];

  const disclaimerSuffix = `\n\n---\n\n*${contentJson.page_disclaimer}*`;
  const postReviewNote =
    "DRAFT FOR DOCTOR'S REVIEW: written by the developer from general patient-education sources. Dr. Sajib should check and approve the wording. Bangla version needed.";

  const posts = [
    {
      _id: 'post_1',
      slug: 'gout-and-diet-what-to-eat-and-avoid',
      category_slug: 'gout-and-diet',
      title: { en: 'Gout and diet: what to eat and avoid', bn: '' },
      excerpt: {
        en: 'Food is not the only cause of gout, but what you eat and drink can make attacks more or less likely. Here is a simple guide, with a note for Ramadan and Eid.',
        bn: '',
      },
      body: {
        en:
          `Gout is a type of arthritis caused by too much uric acid in the blood. When uric acid builds up, it can form tiny crystals inside a joint, often the big toe, and cause sudden, very painful swelling. Food is not the only cause of gout, but what you eat and drink can make attacks more or less likely.

## Foods and drinks to limit

- **Organ meat**, such as liver, kidney and brain.
- **Red meat**, such as beef and mutton, especially large portions.
- **Shellfish**, such as prawns, shrimp and crab.
- **Sugary drinks**, such as soft drinks, packaged juices and energy drinks.
- **Alcohol**, especially beer.

You do not have to give up every one of these forever. Smaller portions, eaten less often, make a real difference.

## Foods that are usually fine

- Vegetables, including green leafy vegetables.
- Rice, roti and other grains.
- Low-fat milk and yoghurt (doi).
- Eggs, and moderate portions of fish and chicken.
- Fruit, eaten whole rather than as juice.

Many people are told to avoid dal and some vegetables. Plant foods do not seem to raise the risk of attacks in the way that meat and sugary drinks do, so most people can keep eating them. Ask your doctor if you are not sure what is right for you.

## Drink enough water

Water helps your kidneys remove uric acid. Drink enough through the day that your urine stays pale yellow, unless your doctor has asked you to limit fluids because of a heart or kidney problem.

## Do not stop your uric-acid medicine on your own

Medicines that lower uric acid work slowly, over months. Some people stop taking them when the pain goes away, or during an attack. This often leads to more attacks later. If you have side effects or questions, talk to your doctor before you change anything.

## A note for Ramadan and Eid

During Ramadan, long hours without water can raise uric acid. Drink plenty of water between iftar and sehri, and go easy on fried and very rich food.

At Eid, many families cook large amounts of beef and mutton, often with organ meat. Enjoy a small portion, fill the rest of your plate with rice, vegetables and salad, and keep drinking water. If you take medicine for gout, ask your doctor before Ramadan how to time your doses.

## When to get help

Contact a doctor quickly if you have a hot, swollen joint together with fever, because this can be an infection. Book a visit if attacks keep coming back, or if you notice lumps under the skin near your joints.

Diet alone rarely controls gout fully. Together with the right medicine and regular check-ups, most people can have far fewer attacks.` +
          disclaimerSuffix,
        bn: '',
      },
      cover_image: null,
      published_at: '2026-10-25T00:00:00.000Z',
      is_published: true,
      review_note: postReviewNote,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'post_2',
      slug: 'morning-stiffness-when-is-it-more-than-a-stiff-body',
      category_slug: 'arthritis-care',
      title: { en: 'Morning stiffness: when is it more than just a stiff body?', bn: '' },
      excerpt: {
        en: 'A little stiffness after waking is common. Stiffness that lasts a long time every morning, with swollen joints, can be a sign of inflammatory arthritis.',
        bn: '',
      },
      body: {
        en:
          `Most people feel a little stiff when they get out of bed, especially as they get older. This kind of stiffness usually fades within a few minutes once you start moving. But stiffness that lasts a long time every morning can be a sign of inflammatory arthritis, which needs a specialist's assessment.

## Ordinary stiffness

- Lasts a few minutes, usually well under 30 minutes.
- Gets better quickly once you move around.
- Often follows unusual exercise, a long journey or a poor night's sleep.
- Is common in osteoarthritis, where stiffness after rest is short.

## Stiffness that may be more

Talk to a doctor if you notice:

- Stiffness that lasts more than 30 minutes, sometimes an hour or more, on most mornings.
- Swollen, warm or tender joints, especially in the fingers, wrists or feet.
- The same joints affected on both sides of the body.
- Trouble making a fist, holding a cup or turning a key in the morning.
- Lower back pain and stiffness that wakes you at night and feels better with movement rather than rest.
- Tiredness, a mild fever or weight loss along with the joint problems.

These can be signs of conditions such as rheumatoid arthritis or spondyloarthritis, which includes ankylosing spondylitis. In these conditions the immune system causes inflammation in the joints or the spine.

## Why early assessment matters

Ongoing inflammation can slowly damage joints. Treatment tends to work best when it starts early. A rheumatologist can examine your joints, arrange blood tests and, where useful, use ultrasound to look for inflammation that does not yet show on an X-ray.

## What you can do now

- Keep a simple diary: when you wake up, how long the stiffness lasts, and which joints are affected.
- Take photos of any swollen joints, because swelling may settle before your appointment.
- Note any family history of arthritis, psoriasis or bowel inflammation.
- Avoid steroid tablets or injections taken without a prescription. They can have serious side effects and can make the diagnosis harder.

## When to book a visit

Book an assessment if morning stiffness of more than 30 minutes, or swelling in your joints, has lasted for more than six weeks. If you are a young adult with back pain and night stiffness for more than three months, a specialist opinion is also a good idea.

Stiffness is easy to ignore, especially when life is busy. Paying attention to how long it lasts is a simple way to know when to ask for help.` +
          disclaimerSuffix,
        bn: '',
      },
      cover_image: null,
      published_at: '2026-10-25T00:00:00.000Z',
      is_published: true,
      review_note: postReviewNote,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'post_3',
      slug: 'what-to-bring-to-your-first-rheumatology-visit',
      category_slug: 'arthritis-care',
      title: { en: 'What to bring to your first rheumatology visit', bn: '' },
      excerpt: {
        en: 'Coming prepared helps you get the most from your first appointment. Bring your medicines, old reports and X-rays, a list of symptoms with dates, and your questions.',
        bn: '',
      },
      body: {
        en:
          `A first visit to a rheumatologist often takes longer than a regular check-up, because the doctor needs to understand the full story of your symptoms. Coming prepared helps you get the most from the time you have.

## 1. A list of all your medicines

Write down every medicine you take, how much and how often. Include:

- Medicines from other doctors.
- Pain killers bought from a pharmacy.
- Herbal, homeopathic or other traditional remedies.
- Vitamins and supplements.
- Any steroid tablets or injections you have had in the past.

If it is easier, bring the medicine strips or boxes with you.

## 2. Previous reports and X-rays

Bring everything you have, even if it seems old:

- Blood and urine test reports.
- X-ray films or CDs, not only the written reports.
- Ultrasound, CT or MRI reports and images.
- Prescriptions from other doctors and hospital discharge papers.

Put them in a file in date order, with the newest on top. This saves time and avoids repeating tests you have already had.

## 3. A list of symptoms with dates

Memory is easy to lose in a busy clinic, so write it down:

- When did the problem start?
- Which joints or body parts are affected?
- How long does morning stiffness last?
- What makes it better or worse?
- Any other problems, such as rash, mouth ulcers, dry eyes, hair loss, fever or weight loss.

Photos of swollen joints or rashes are very useful, because these can come and go.

## 4. Your questions

It is normal to forget questions during the visit. Write them down before you come. For example:

- What is causing my symptoms?
- Which tests do I need, and why?
- How long will treatment take, and what side effects should I watch for?
- Can I keep working, praying and fasting as usual?
- What should I do if my symptoms get worse?

## 5. Family and personal history

Tell the doctor if anyone in your family has arthritis, psoriasis, lupus or thyroid disease. Women should mention if they are pregnant or planning a pregnancy, because this affects the choice of medicines.

## On the day

- Wear loose clothes, so your joints can be examined easily.
- Bring a family member if that helps you feel comfortable or remember the advice.
- Call the chamber before you leave home to confirm the time.

A little preparation helps the doctor understand your problem clearly and plan the right next steps with you.` +
          disclaimerSuffix,
        bn: '',
      },
      cover_image: null,
      published_at: '2026-10-25T00:00:00.000Z',
      is_published: true,
      review_note: postReviewNote,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const handouts = [
    {
      _id: 'handout_1',
      post_slug: 'gout-and-diet-what-to-eat-and-avoid',
      title: {
        en: 'Gout and diet: printable sheet',
        bn: 'গেঁটে বাত ও খাবার: প্রিন্ট করার পাতা (ইংরেজি)',
      },
      file_path: '/handouts/gout-and-diet.pdf',
      is_published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const faqReview =
    'DRAFT FOR DR. SAJIB TO REVIEW: practical answer written by the developer from the build brief. Please check the wording (English and Bangla).';

  const faqs = [
    {
      _id: 'faq_1',
      question: {
        en: 'How do I book an appointment?',
        bn: 'কীভাবে অ্যাপয়েন্টমেন্ট নেব?',
      },
      answer: {
        en: 'Call the chamber where you want to see Dr. Sajib. You can also send a request through the appointment form on this website, and the chamber team will call you to confirm the time. A request is not a confirmed appointment.',
        bn: 'যে চেম্বারে দেখাতে চান, সেখানে ফোন করুন। এই ওয়েবসাইটের অ্যাপয়েন্টমেন্ট ফর্মেও অনুরোধ পাঠাতে পারেন, চেম্বার থেকে কল করে সময় নিশ্চিত করা হবে। অনুরোধ পাঠালেই অ্যাপয়েন্টমেন্ট নিশ্চিত হয় না।',
      },
      sort_order: 1,
      is_published: true,
      review_note: faqReview,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'faq_2',
      question: {
        en: 'Where and when does Dr. Sajib see patients?',
        bn: 'ডা. সজীব কোথায় ও কখন রোগী দেখেন?',
      },
      answer: {
        en: 'The Chambers page lists each chamber with its address, hours and phone numbers. Hours can change, so please call the chamber to confirm before you visit.',
        bn: 'চেম্বার পাতায় প্রতিটি চেম্বারের ঠিকানা, সময় ও ফোন নম্বর দেওয়া আছে। সময় পরিবর্তন হতে পারে, তাই আসার আগে চেম্বারে ফোন করে নিশ্চিত হয়ে নিন।',
      },
      sort_order: 2,
      is_published: true,
      review_note: faqReview,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'faq_3',
      question: {
        en: 'What should I bring to my first visit?',
        bn: 'প্রথমবার দেখাতে এলে কী কী সাথে আনব?',
      },
      answer: {
        en: 'Bring a list of all your medicines, your previous reports and X-rays, a list of your symptoms with dates, and the questions you want to ask.',
        bn: 'আপনার সব ওষুধের তালিকা, আগের রিপোর্ট ও এক্স-রে, তারিখসহ সমস্যাগুলোর তালিকা, এবং যে প্রশ্নগুলো করতে চান সেগুলো সাথে আনুন।',
      },
      sort_order: 3,
      is_published: true,
      review_note: faqReview,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'faq_4',
      question: {
        en: 'Can I send my medical reports through this website?',
        bn: 'এই ওয়েবসাইটের মাধ্যমে কি রিপোর্ট পাঠানো যায়?',
      },
      answer: {
        en: 'No. Please do not send medical reports or details through the forms on this website. Bring them with you to your visit.',
        bn: 'না। এই ওয়েবসাইটের ফর্মে রোগের বিস্তারিত বা রিপোর্ট পাঠাবেন না। দেখাতে আসার সময় সাথে নিয়ে আসুন।',
      },
      sort_order: 4,
      is_published: true,
      review_note: faqReview,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const settings = [
    { key: 'whatsapp_number', value: '' },
    { key: 'whatsapp_message', value: 'Hello, I would like to request an appointment with Dr. Sajib.' },
    { key: 'public_email', value: '' },
    { key: 'facebook_url', value: 'https://www.facebook.com/dr.khsajib' },
    { key: 'call_number', value: '01711-647877' },
    {
      key: 'hours_banner_text_en',
      value: 'Hours can change. Please call the chamber to confirm before you visit.',
    },
    {
      key: 'hours_banner_text_bn',
      value: 'সময় পরিবর্তন হতে পারে। আসার আগে চেম্বারে ফোন করে নিশ্চিত হয়ে নিন।',
    },
    {
      key: 'site_disclaimer_en',
      value:
        'The information on this website is for general education only and does not replace a consultation with a doctor. In an emergency, go to the nearest hospital.',
    },
    {
      key: 'site_disclaimer_bn',
      value:
        'এই ওয়েবসাইটের তথ্য শুধুমাত্র সাধারণ স্বাস্থ্য-শিক্ষার জন্য, এটি ডাক্তারের সাথে পরামর্শের বিকল্প নয়। জরুরি অবস্থায় নিকটস্থ হাসপাতালে যান।',
    },
    { key: 'page_disclaimer_en', value: contentJson.page_disclaimer },
    {
      key: 'page_disclaimer_bn',
      value:
        'এই পাতার তথ্য শুধুমাত্র সাধারণ শিক্ষার জন্য, এটি ব্যক্তিগত পরামর্শের বিকল্প নয়। আপনার নিজের সমস্যার বিষয়ে পরামর্শের জন্য অ্যাপয়েন্টমেন্ট নিন।',
    },
    { key: 'doctor_photo_credit', value: '' },
    { key: 'rank_pending_confirmation', value: 'true' },
  ];

  return {
    users,
    doctors,
    chambers,
    specialities,
    specialServices,
    categories,
    posts,
    handouts,
    faqs,
    settings,
    appointmentRequests: [],
    contactMessages: [],
  };
}

module.exports = { getInitialSeedData };

