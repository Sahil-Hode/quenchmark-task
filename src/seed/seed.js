import prisma from '../config/prisma.js';
import { dummyTechProducts } from './products.data.js';

async function seed() {
  console.log('🌱 Starting database seeding for 20 IT Tech products...');

  // Efficient batch insert
  await prisma.product.deleteMany({});
  console.log('🧹 Cleaned existing products.');

  const result = await prisma.product.createMany({
    data: dummyTechProducts,
    skipDuplicates: true,
  });

  console.log(`✅ Seeding complete! Inserted ${result.count} products into Supabase database.`);
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
