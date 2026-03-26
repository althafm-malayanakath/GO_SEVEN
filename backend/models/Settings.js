const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  currency: { type: String, default: 'USD' },
  currencySymbol: { type: String, default: '$' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
