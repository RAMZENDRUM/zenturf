/**
 * Refund policy:
 * - >24h before slot: 100% refund
 * - 2-24h before: 50% refund
 * - <2h before: 0% refund
 */
export function calculateRefund(
  bookingDate: string,
  startTime: string,
  totalPrice: number,
): { percentage: number; amount: number; label: string } {
  const slotStart = new Date(`${bookingDate}T${startTime}`);
  const now = new Date();
  const hoursUntil = (slotStart.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntil >= 24) {
    return { percentage: 100, amount: totalPrice, label: "Full refund" };
  }
  if (hoursUntil >= 2) {
    return { percentage: 50, amount: totalPrice * 0.5, label: "50% refund" };
  }
  return { percentage: 0, amount: 0, label: "No refund (less than 2h)" };
}
