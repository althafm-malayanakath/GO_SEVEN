export function getCleanWhatsAppNumber(number: string) {
  return number.replace(/\D/g, '');
}

export function buildWhatsAppUrl(number: string, message: string) {
  const cleanNumber = getCleanWhatsAppNumber(number);

  if (!cleanNumber) {
    return '';
  }

  const normalizedMessage = message.trim();
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(normalizedMessage)}`;
}
