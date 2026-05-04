export function buildWhatsAppUrl(
  number: string | null | undefined,
  message: string,
): string | null {
  if (!number) return null;
  const digits = number.replace(/\D/g, '');
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function defaultBookingMessage(artistName: string, serviceName?: string): string {
  return serviceName
    ? `Hi ${artistName}, I'd like to book ${serviceName} via Styleja.`
    : `Hi ${artistName}, I'd like to book a session via Styleja.`;
}
