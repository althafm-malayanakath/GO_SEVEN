const Settings = require('../models/Settings');

const getSettings = async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.json(settings);
};

const updateSettings = async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = new Settings({});
  if (req.body.currency !== undefined) settings.currency = req.body.currency;
  if (req.body.currencySymbol !== undefined) settings.currencySymbol = req.body.currencySymbol;
  if (req.body.whatsappNumber !== undefined) settings.whatsappNumber = String(req.body.whatsappNumber).trim();
  if (req.body.whatsappMessage !== undefined) settings.whatsappMessage = String(req.body.whatsappMessage).trim();
  if (req.body.footerSupportText !== undefined) settings.footerSupportText = String(req.body.footerSupportText).trim();
  await settings.save();
  res.json(settings);
};

module.exports = { getSettings, updateSettings };
