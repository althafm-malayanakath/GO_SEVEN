const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  currency: { type: String, default: 'USD' },
  currencySymbol: { type: String, default: '$' },
  whatsappNumber: { type: String, default: '+97431685812' },
  whatsappMessage: { type: String, default: 'Hi, I want to enquire about your products.' },
  footerSupportText: {
    type: String,
    default: 'Need help with size, stock, or custom orders? Message us on WhatsApp.',
  },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
