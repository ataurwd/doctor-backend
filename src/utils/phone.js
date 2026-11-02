const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function toEnglishDigits(value = '') {
  let str = String(value);
  BN_DIGITS.forEach((bn, idx) => {
    str = str.split(bn).join(String(idx));
  });
  return str;
}

function normalizePhone(value = '') {
  let digits = toEnglishDigits(value).replace(/\D+/g, '');
  if (digits.startsWith('880')) {
    digits = digits.slice(2); // "8801711..." -> "01711..."
  }
  return digits;
}

function isValidBangladeshPhone(value = '') {
  const digits = normalizePhone(value);
  const mobile = /^01[3-9]\d{8}$/;
  const landline = /^0[2-9]\d{7,9}$/;
  return mobile.test(digits) || landline.test(digits);
}

module.exports = {
  toEnglishDigits,
  normalizePhone,
  isValidBangladeshPhone,
};

