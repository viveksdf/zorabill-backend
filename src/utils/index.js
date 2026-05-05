// Logger utility
export const logger = {
  info: (message, data = "") => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  },

  error: (message, error = "") => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },

  warn: (message, data = "") => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
  },

  debug: (message, data = "") => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    }
  },
};

// Helper utilities
export const helpers = {
  formatCurrency: (amount) => {
    return `₹${(amount / 100).toFixed(2)}`;
  },

  parseCurrency: (amount) => {
    return Math.round(amount * 100);
  },

  calculateDiscount: (subtotal, discountPercent) => {
    return Math.round((subtotal * discountPercent) / 100);
  },

  calculateTax: (amount, taxRate) => {
    return Math.round((amount * taxRate) / 100);
  },

  delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

  generateId: (prefix) => {
    return `${prefix}-${Date.now()}`;
  },
};
