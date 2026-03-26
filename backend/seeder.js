const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const User = require('./models/User');

dotenv.config();

const products = [
  {
    name: 'Seven Classic Tee',
    description:
      'The foundation of the Go Seven wardrobe. A heavyweight 100% cotton blank crafted for those who move with intention. Clean silhouette, zero compromise.',
    price: 65,
    category: 'T-Shirts',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Onyx Black', hex: '#1a1a1a' },
      { name: 'Ivory White', hex: '#f5f5f0' },
      { name: 'Royal Purple', hex: '#6A0DAD' },
    ],
    stock: 100,
    images: [
      { url: 'https://placehold.co/600x700/1a1a1a/ffffff?text=SEVEN+CLASSIC+TEE' },
    ],
    rating: 4.8,
    numReviews: 124,
    isNewArrival: false,
    isFeatured: true,
  },
  {
    name: 'Seven Logo Drop Tee',
    description:
      'Our signature oversized drop-shoulder graphic tee. Screen-printed "GO SEVEN" chest logo on a washed cotton base. Limited availability — built for the culture.',
    price: 85,
    category: 'T-Shirts',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'Washed Purple', hex: '#4C1D95' },
      { name: 'Stone Grey', hex: '#6b7280' },
    ],
    stock: 60,
    images: [
      { url: 'https://placehold.co/600x700/4C1D95/ffffff?text=SEVEN+LOGO+DROP+TEE' },
    ],
    rating: 4.9,
    numReviews: 87,
    isNewArrival: true,
    isFeatured: true,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Connected');

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminName = (process.env.SEED_ADMIN_NAME || process.env.ADMIN_NAME || 'Seed Admin').trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  const adminPhone = String(process.env.SEED_ADMIN_PHONE || process.env.ADMIN_PHONE || '+910000000000').trim();

  let adminUser = adminEmail ? await User.findOne({ email: adminEmail }) : null;

  if (!adminUser) {
    adminUser = await User.findOne({ role: 'admin' });
  }

  if (!adminUser) {
    if (!adminEmail || !adminPassword) {
      throw new Error('An admin user is required before seeding products. Run npm run create:admin or set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD.');
    }

    adminUser = await User.create({
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      password: adminPassword,
      role: 'admin',
      whatsappOptIn: false,
    });
    console.log(`Created seed admin ${adminUser.email}`);
  }

  await Product.deleteMany({});
  console.log('Products cleared');

  await Product.insertMany(products.map((product) => ({ ...product, user: adminUser._id })));
  console.log(`${products.length} products seeded`);

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
