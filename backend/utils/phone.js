const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

const normalizePhoneNumber = (value) => {
  const normalized = String(value || '')
    .trim()
    .replace(/[\s()-]/g, '')
    .replace(/^00/, '+');

  return normalized;
};

const isValidPhoneNumber = (value) => E164_PATTERN.test(value);

module.exports = {
  isValidPhoneNumber,
  normalizePhoneNumber,
};
