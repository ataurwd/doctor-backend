const mongoose = require('mongoose');

const TranslatableString = {
  en: { type: String, default: '' },
  bn: { type: String, default: '' },
};

const TranslatableStringList = {
  en: { type: [String], default: [] },
  bn: { type: [String], default: [] },
};

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'editor'], default: 'editor' },
  },
  { timestamps: true }
);

const DoctorSchema = new mongoose.Schema(
  {
    name: { type: TranslatableString, required: true },
    title_line: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    credentials: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    specialty_line: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    bio: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    years_experience: { type: Number, default: null },
    photo_path: { type: String, default: null },
    facebook_url: { type: String, default: 'https://www.facebook.com/dr.khsajib' },
    review_note: { type: String, default: '' },
  },
  { timestamps: true }
);

const ChamberSchema = new mongoose.Schema(
  {
    name: { type: TranslatableString, required: true },
    address: { type: TranslatableString, required: true },
    phone_primary: { type: String, default: null },
    phone_secondary: { type: String, default: null },
    email: { type: String, default: null },
    website: { type: String, default: null },
    hours_text: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    hours_note: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    map_url: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    verify_note: { type: String, default: '' },
    sort_order: { type: Number, default: 1 },
  },
  { timestamps: true }
);

const SpecialitySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: TranslatableString, required: true },
    summary: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    what_it_is: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    common_symptoms: { type: TranslatableStringList, default: () => ({ en: [], bn: [] }) },
    how_dr_sajib_helps: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    when_to_see: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    urgent_note: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    sort_order: { type: Number, default: 1 },
    is_published: { type: Boolean, default: true },
    review_note: { type: String, default: '' },
  },
  { timestamps: true }
);

const SpecialServiceSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: TranslatableString, required: true },
    summary: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    what_it_is: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    who_needs_it: { type: TranslatableStringList, default: () => ({ en: [], bn: [] }) },
    what_to_expect: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    benefits: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    how_dr_sajib_helps: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    when_to_see: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    urgent_note: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    sort_order: { type: Number, default: 1 },
    is_published: { type: Boolean, default: true },
    review_note: { type: String, default: '' },
  },
  { timestamps: true }
);

const CategorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: TranslatableString, required: true },
  },
  { timestamps: true }
);

const PostSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    category_slug: { type: String, default: '' },
    title: { type: TranslatableString, required: true },
    excerpt: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    body: { type: TranslatableString, default: () => ({ en: '', bn: '' }) },
    cover_image: { type: String, default: null },
    published_at: { type: Date, default: Date.now },
    is_published: { type: Boolean, default: true },
    review_note: { type: String, default: '' },
  },
  { timestamps: true }
);

const HandoutSchema = new mongoose.Schema(
  {
    post_slug: { type: String, default: null },
    title: { type: TranslatableString, required: true },
    file_path: { type: String, default: null },
    is_published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FaqSchema = new mongoose.Schema(
  {
    question: { type: TranslatableString, required: true },
    answer: { type: TranslatableString, required: true },
    sort_order: { type: Number, default: 1 },
    is_published: { type: Boolean, default: true },
    review_note: { type: String, default: '' },
  },
  { timestamps: true }
);

const AppointmentRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 120 },
    phone: { type: String, required: true, maxlength: 30 },
    chamber_id: { type: String, default: null },
    preferred_day: { type: String, default: null },
    reason: { type: String, default: null, maxlength: 200 },
    consent: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['new', 'called', 'booked', 'closed'],
      default: 'new',
    },
    staff_note: { type: String, default: '' },
  },
  { timestamps: true }
);

const ContactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 120 },
    phone: { type: String, required: true, maxlength: 30 },
    email: { type: String, default: null, maxlength: 190 },
    message: { type: String, required: true, maxlength: 1000 },
    is_read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = {
  User: mongoose.models.User || mongoose.model('User', UserSchema),
  Doctor: mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema),
  Chamber: mongoose.models.Chamber || mongoose.model('Chamber', ChamberSchema),
  Speciality: mongoose.models.Speciality || mongoose.model('Speciality', SpecialitySchema),
  SpecialService: mongoose.models.SpecialService || mongoose.model('SpecialService', SpecialServiceSchema),
  Category: mongoose.models.Category || mongoose.model('Category', CategorySchema),
  Post: mongoose.models.Post || mongoose.model('Post', PostSchema),
  Handout: mongoose.models.Handout || mongoose.model('Handout', HandoutSchema),
  Faq: mongoose.models.Faq || mongoose.model('Faq', FaqSchema),
  AppointmentRequest: mongoose.models.AppointmentRequest || mongoose.model('AppointmentRequest', AppointmentRequestSchema),
  ContactMessage: mongoose.models.ContactMessage || mongoose.model('ContactMessage', ContactMessageSchema),
  Setting: mongoose.models.Setting || mongoose.model('Setting', SettingSchema),
};

