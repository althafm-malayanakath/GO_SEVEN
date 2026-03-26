/**
 * WhatsApp Notification Service
 * Note: Twilio support has been removed as per user request.
 * Direct customer redirection is now handled on the frontend.
 */

const isDebugEnabled = () => String(process.env.WHATSAPP_DEBUG_LOG || '').toLowerCase() === 'true';

const notifyCustomerOrderPlaced = async (order) => {
  if (isDebugEnabled()) {
    console.info('[whatsapp:debug] Backend customer notification skipped. Handle via frontend redirect.');
  }
  return {
    sent: false,
    attempted: false,
    error: 'Frontend redirect integration active',
  };
};

const notifyAdminOrderPlaced = async (order) => {
  if (isDebugEnabled()) {
    console.info('[whatsapp:debug] Backend admin notification skipped. Admin will receive direct message from customer.');
  }
  return {
    sent: false,
    attempted: false,
    error: 'Direct customer message expected via frontend redirect',
  };
};

module.exports = {
  notifyAdminOrderPlaced,
  notifyCustomerOrderPlaced,
};
