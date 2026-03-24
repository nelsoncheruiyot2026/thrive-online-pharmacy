require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const categories = [
  { name: 'Prescription Drugs', slug: 'prescription-drugs', description: 'Medications requiring a valid prescription' },
  { name: 'Over-the-Counter', slug: 'over-the-counter', description: 'Medications available without prescription' },
  { name: 'Vitamins & Supplements', slug: 'vitamins-supplements', description: 'Vitamins, minerals and dietary supplements' },
  { name: 'First Aid', slug: 'first-aid', description: 'First aid supplies and wound care' },
  { name: 'Mother & Baby', slug: 'mother-baby', description: 'Products for mothers and infants' },
  { name: 'Personal Care', slug: 'personal-care', description: 'Skincare, oral care and hygiene products' },
  { name: 'Sexual Health', slug: 'sexual-health', description: 'Sexual health and family planning products' },
  { name: 'Chronic Conditions', slug: 'chronic-conditions', description: 'Medications for diabetes, hypertension and more' }
];

const products = [
  {
    name: 'Amoxicillin 500mg Capsules',
    slug: 'amoxicillin-500mg',
    description: 'Amoxicillin is a penicillin antibiotic used to treat bacterial infections including ear infections, strep throat, pneumonia, skin infections, and urinary tract infections.',
    shortDescription: 'Broad-spectrum antibiotic for bacterial infections',
    price: 350,
    stock: 200,
    requiresPrescription: true,
    categorySlug: 'prescription-drugs',
    dosage: '500mg, 3 times daily for 7-10 days',
    manufacturer: 'Cosmos Pharmaceuticals',
    isFeatured: false
  },
  {
    name: 'Paracetamol 500mg Tablets',
    slug: 'paracetamol-500mg',
    description: 'Paracetamol is used to treat mild to moderate pain (from headaches, menstrual periods, toothaches, backaches, osteoarthritis, or cold/flu aches and pains) and to reduce fever.',
    shortDescription: 'Pain relief and fever reducer',
    price: 50,
    compareAtPrice: 80,
    stock: 500,
    requiresPrescription: false,
    categorySlug: 'over-the-counter',
    dosage: '500-1000mg every 4-6 hours',
    manufacturer: 'Dawa Limited',
    isFeatured: true
  },
  {
    name: 'Vitamin C 1000mg Effervescent',
    slug: 'vitamin-c-1000mg',
    description: 'High-strength Vitamin C effervescent tablets that dissolve in water. Supports immune function, acts as an antioxidant, and supports collagen synthesis.',
    shortDescription: 'Immune-boosting Vitamin C supplement',
    price: 450,
    stock: 150,
    requiresPrescription: false,
    categorySlug: 'vitamins-supplements',
    dosage: '1 tablet daily dissolved in water',
    manufacturer: 'Sandoz',
    isFeatured: true
  },
  {
    name: 'Metformin 500mg Tablets',
    slug: 'metformin-500mg',
    description: 'Metformin is used with diet and exercise to treat type 2 diabetes. It decreases the amount of sugar your liver makes and that your stomach/intestines absorb.',
    shortDescription: 'Type 2 diabetes management medication',
    price: 280,
    stock: 300,
    requiresPrescription: true,
    categorySlug: 'chronic-conditions',
    dosage: '500-2000mg daily with meals',
    manufacturer: 'Merck Kenya',
    isFeatured: false
  },
  {
    name: 'Ibuprofen 400mg Tablets',
    slug: 'ibuprofen-400mg',
    description: 'Ibuprofen is a nonsteroidal anti-inflammatory drug (NSAID) used to treat fever, pain, and inflammation. It works by reducing hormones that cause inflammation and pain in the body.',
    shortDescription: 'Anti-inflammatory pain relief',
    price: 120,
    stock: 400,
    requiresPrescription: false,
    categorySlug: 'over-the-counter',
    dosage: '400mg every 6-8 hours with food',
    manufacturer: 'Reckitt',
    isFeatured: true
  },
  {
    name: 'Omeprazole 20mg Capsules',
    slug: 'omeprazole-20mg',
    description: 'Omeprazole reduces the amount of acid your stomach makes. It\'s used for heartburn, acid reflux, gastroesophageal reflux disease (GERD), stomach ulcers, and certain infections.',
    shortDescription: 'Proton pump inhibitor for acid reflux',
    price: 420,
    stock: 180,
    requiresPrescription: true,
    categorySlug: 'prescription-drugs',
    dosage: '20mg once daily before meals',
    manufacturer: 'AstraZeneca Kenya',
    isFeatured: false
  },
  {
    name: 'Wound Care Kit',
    slug: 'wound-care-kit',
    description: 'Complete first aid wound care kit includes sterile gauze pads, bandages, antiseptic wipes, adhesive bandages, and medical tape.',
    shortDescription: 'Complete wound care and first aid kit',
    price: 650,
    stock: 80,
    requiresPrescription: false,
    categorySlug: 'first-aid',
    manufacturer: 'Johnson & Johnson',
    isFeatured: true
  },
  {
    name: 'Prenatal Vitamins (30 tablets)',
    slug: 'prenatal-vitamins',
    description: 'Comprehensive prenatal multivitamin with Folic Acid, Iron, Calcium, Vitamin D, and DHA. Supports healthy pregnancy and fetal development.',
    shortDescription: 'Complete prenatal supplement for mothers',
    price: 890,
    compareAtPrice: 1200,
    stock: 120,
    requiresPrescription: false,
    categorySlug: 'mother-baby',
    dosage: '1 tablet daily',
    manufacturer: 'Nutrishared',
    isFeatured: true
  },
  {
    name: 'Cetaphil Moisturizing Cream 250g',
    slug: 'cetaphil-moisturizing-cream',
    description: 'Cetaphil Moisturizing Cream provides long-lasting hydration for dry, sensitive skin. Dermatologist recommended, fragrance-free formula.',
    shortDescription: 'Gentle moisturizer for sensitive skin',
    price: 1200,
    stock: 60,
    requiresPrescription: false,
    categorySlug: 'personal-care',
    manufacturer: 'Galderma',
    isFeatured: false
  },
  {
    name: 'Amlodipine 5mg Tablets',
    slug: 'amlodipine-5mg',
    description: 'Amlodipine is a calcium channel blocker used to treat high blood pressure (hypertension) and chest pain (angina). It relaxes blood vessels and reduces strain on the heart.',
    shortDescription: 'Hypertension and angina treatment',
    price: 380,
    stock: 250,
    requiresPrescription: true,
    categorySlug: 'chronic-conditions',
    dosage: '5-10mg once daily',
    manufacturer: 'Pfizer',
    isFeatured: false
  }
];

async function seed() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@Thrive2024', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@thrivepharmacy.co.ke' },
    update: {},
    create: {
      email: 'admin@thrivepharmacy.co.ke',
      password: adminPassword,
      firstName: 'Thrive',
      lastName: 'Admin',
      phone: '254700000000',
      role: 'ADMIN',
      emailVerified: true
    }
  });
  console.log('✅ Admin user created:', admin.email);

  // Create pharmacist user
  const pharmPassword = await bcrypt.hash('Pharm@Thrive2024', 12);
  await prisma.user.upsert({
    where: { email: 'pharmacist@thrivepharmacy.co.ke' },
    update: {},
    create: {
      email: 'pharmacist@thrivepharmacy.co.ke',
      password: pharmPassword,
      firstName: 'Jane',
      lastName: 'Pharmacist',
      phone: '254711111111',
      role: 'PHARMACIST',
      emailVerified: true
    }
  });
  console.log('✅ Pharmacist user created');

  // Create demo customer
  const custPassword = await bcrypt.hash('Customer@123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: custPassword,
      firstName: 'Demo',
      lastName: 'Customer',
      phone: '254722222222',
      role: 'CUSTOMER',
      emailVerified: true,
      cart: { create: {} }
    }
  });
  console.log('✅ Demo customer created:', customer.email);

  // Create categories
  const createdCategories = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat
    });
    createdCategories[cat.slug] = created;
    console.log(`✅ Category: ${cat.name}`);
  }

  // Create products
  for (const product of products) {
    const { categorySlug, ...productData } = product;
    const category = createdCategories[categorySlug];

    await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: {
        ...productData,
        categoryId: category.id
      }
    });
    console.log(`✅ Product: ${productData.name}`);
  }

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Admin credentials:');
  console.log('   Email: admin@thrivepharmacy.co.ke');
  console.log('   Password: Admin@Thrive2024');
  console.log('\n📋 Demo customer:');
  console.log('   Email: demo@example.com');
  console.log('   Password: Customer@123');
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
