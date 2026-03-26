const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

async function main() {
  const email = String(getArgValue('--email') || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(getArgValue('--password') || process.env.ADMIN_PASSWORD || '');
  const name = String(getArgValue('--name') || process.env.ADMIN_NAME || 'Store Admin').trim();
  const phone = String(getArgValue('--phone') || process.env.ADMIN_PHONE || '+910000000000').trim();

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  if (!email) {
    throw new Error('Admin email is required. Use --email or ADMIN_EMAIL.');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  try {
    let user = await User.findOne({ email });

    if (user) {
      user.role = 'admin';
      if (name) {
        user.name = name;
      }
      if (phone) {
        user.phone = phone;
      }
      if (password) {
        user.password = password;
      }

      await user.save();
      console.log(`Updated existing user ${email} to admin.`);
      return;
    }

    if (!password || password.length < 6) {
      throw new Error('A password with at least 6 characters is required to create a new admin.');
    }

    user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'admin',
      whatsappOptIn: false,
    });

    console.log(`Created admin user ${user.email}.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
