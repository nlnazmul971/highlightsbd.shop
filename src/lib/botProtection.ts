// Bot protection utilities: honeypot, rate limiting, time-based validation

const ORDER_TIMESTAMPS_KEY = 'hl_order_ts';
const MAX_ORDERS_PER_HOUR = 5;
const MIN_FORM_TIME_MS = 3000; // 3 seconds minimum to fill form

/**
 * Check if honeypot field is filled (bots auto-fill hidden fields)
 */
export const isHoneypotFilled = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Check if form was filled too quickly (bot behavior)
 */
export const isFormFilledTooFast = (formOpenedAt: number): boolean => {
  return Date.now() - formOpenedAt < MIN_FORM_TIME_MS;
};

/**
 * Rate limiting: check if too many orders placed recently
 */
export const isRateLimited = (): boolean => {
  try {
    const stored = localStorage.getItem(ORDER_TIMESTAMPS_KEY);
    if (!stored) return false;
    const timestamps: number[] = JSON.parse(stored);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentOrders = timestamps.filter(t => t > oneHourAgo);
    return recentOrders.length >= MAX_ORDERS_PER_HOUR;
  } catch {
    return false;
  }
};

/**
 * Record an order timestamp for rate limiting
 */
export const recordOrderTimestamp = (): void => {
  try {
    const stored = localStorage.getItem(ORDER_TIMESTAMPS_KEY);
    const timestamps: number[] = stored ? JSON.parse(stored) : [];
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recent = timestamps.filter(t => t > oneHourAgo);
    recent.push(Date.now());
    localStorage.setItem(ORDER_TIMESTAMPS_KEY, JSON.stringify(recent));
  } catch {}
};

/**
 * Validate phone number format (Bangladesh)
 */
export const isValidBDPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-\+]/g, '');
  // Must be 11 digits starting with 01, or 13 digits starting with 880
  return /^01[3-9]\d{8}$/.test(cleaned) || /^8801[3-9]\d{8}$/.test(cleaned);
};
