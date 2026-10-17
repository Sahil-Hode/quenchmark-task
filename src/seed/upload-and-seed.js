import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';
import { supabase, getStoragePublicUrl } from '../config/supabase.js';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');

const productCatalog = [
  {
    fileName: 'product-1.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    title: 'Apple MacBook Pro 16" (M3 Max)',
    brand: 'Apple',
    category: 'MacBooks',
    price: 349900,
    originalPrice: 399900,
    discount: 13,
    stock: 25,
    rating: 4.9,
    description: 'The most advanced Mac laptop ever. Powered by the groundbreaking M3 Max chip with 16-core CPU, 40-core GPU, 48GB Unified Memory, and Liquid Retina XDR display.',
    specs: { processor: 'Apple M3 Max', ram: '48GB', storage: '1TB SSD', display: '16.2" Liquid Retina XDR 120Hz', battery: '22 hrs' },
  },
  {
    fileName: 'product-2.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80',
    title: 'Dell XPS 15 OLED Touch',
    brand: 'Dell',
    category: 'Ultrabooks',
    price: 214990,
    originalPrice: 249990,
    discount: 14,
    stock: 30,
    rating: 4.7,
    description: 'Precision-crafted CNC aluminum chassis with a 15.6-inch 3.5K OLED InfinityEdge touch display. Equipped with 13th Gen Intel Core i9 and NVIDIA RTX 4070.',
    specs: { processor: 'Intel Core i9-13900H', ram: '32GB DDR5', storage: '1TB NVMe', graphics: 'RTX 4070 8GB', display: '15.6" 3.5K OLED' },
  },
  {
    fileName: 'product-3.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80',
    title: 'ASUS ROG Zephyrus G16',
    brand: 'ASUS',
    category: 'Gaming Laptops',
    price: 189990,
    originalPrice: 219990,
    discount: 14,
    stock: 20,
    rating: 4.8,
    description: 'Ultra-sleek gaming powerhouse featuring the revolutionary ROG Nebula OLED 240Hz display, Intel Core Ultra 9, and RTX 4080 graphics.',
    specs: { processor: 'Intel Core Ultra 9 185H', ram: '32GB', storage: '2TB NVMe', graphics: 'RTX 4080 12GB', display: '16" 2.5K OLED 240Hz' },
  },
  {
    fileName: 'product-4.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    title: 'Lenovo ThinkPad X1 Carbon Gen 12',
    brand: 'Lenovo',
    category: 'Ultrabooks',
    price: 174990,
    originalPrice: 199990,
    discount: 13,
    stock: 35,
    rating: 4.8,
    description: 'The benchmark of business ultrabooks. Carbon-fiber composite construction, Intel Core Ultra 7 vPro, legendary keyboard, and enterprise security.',
    specs: { processor: 'Intel Core Ultra 7 155H', ram: '32GB', storage: '1TB SSD', display: '14" 2.8K OLED 120Hz', weight: '1.09 kg' },
  },
  {
    fileName: 'product-5.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80',
    title: 'Apple MacBook Air 15" (M3)',
    brand: 'Apple',
    category: 'MacBooks',
    price: 134900,
    originalPrice: 144900,
    discount: 7,
    stock: 50,
    rating: 4.9,
    description: 'Impossibly thin and wicked fast. Striking 15.3-inch Liquid Retina display, all-day 18-hour battery life, fanless silent architecture, and MagSafe 3.',
    specs: { processor: 'Apple M3 (8-core CPU, 10-core GPU)', ram: '16GB', storage: '512GB SSD', display: '15.3" Liquid Retina', battery: '18 hrs' },
  },
  {
    fileName: 'product-6.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80',
    title: 'Razer Blade 16 (Dual-Mode Mini-LED)',
    brand: 'Razer',
    category: 'Gaming Laptops',
    price: 299990,
    originalPrice: 349990,
    discount: 14,
    stock: 15,
    rating: 4.9,
    description: 'Worlds first dual-mode Mini-LED display: switch effortlessly between 4K 120Hz creator mode and FHD+ 240Hz esports gaming. Packed with RTX 4090.',
    specs: { processor: 'Intel Core i9-14900HX', ram: '32GB', storage: '2TB NVMe', graphics: 'RTX 4090 16GB', display: '16" Mini-LED Dual-Mode' },
  },
  {
    fileName: 'product-7.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
    title: 'HP Spectre x360 2-in-1 14"',
    brand: 'HP',
    category: 'Ultrabooks',
    price: 154990,
    originalPrice: 179990,
    discount: 14,
    stock: 28,
    rating: 4.6,
    description: 'Versatile 360-degree convertible laptop with a breathtaking 2.8K OLED touch screen, included rechargeable stylus, and Intel Evo certification.',
    specs: { processor: 'Intel Core Ultra 7 155H', ram: '16GB', storage: '1TB SSD', display: '14" 2.8K OLED Touch 120Hz', weight: '1.44 kg' },
  },
  {
    fileName: 'product-8.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80',
    title: 'Lenovo Legion Pro 7i Gen 9',
    brand: 'Lenovo',
    category: 'Gaming Laptops',
    price: 239990,
    originalPrice: 269990,
    discount: 11,
    stock: 22,
    rating: 4.8,
    description: 'AI-tuned esports juggernaut with Legion ColdFront Vapor thermal technology, TrueStrike per-key RGB keyboard, and 240Hz WQXGA panel.',
    specs: { processor: 'Intel Core i9-14900HX', ram: '32GB', storage: '1TB SSD', graphics: 'RTX 4080 12GB', display: '16" WQXGA 240Hz' },
  },
  {
    fileName: 'product-9.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    title: 'Dell Precision 5680 Mobile Workstation',
    brand: 'Dell',
    category: 'Workstations',
    price: 319990,
    originalPrice: 369990,
    discount: 14,
    stock: 12,
    rating: 4.9,
    description: 'High-performance ISV-certified workstation tailored for CAD, 3D modeling, deep learning, and video editing with NVIDIA RTX 5000 Ada GPU.',
    specs: { processor: 'Intel Core i9-13900H vPro', ram: '64GB', storage: '2TB NVMe', graphics: 'RTX 5000 Ada 16GB', display: '16" UHD+ OLED Touch' },
  },
  {
    fileName: 'product-10.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80',
    title: 'ASUS Zenbook Duo (2024) Dual OLED',
    brand: 'ASUS',
    category: 'Ultrabooks',
    price: 169990,
    originalPrice: 199990,
    discount: 15,
    stock: 18,
    rating: 4.7,
    description: 'Groundbreaking dual 14-inch 3K 120Hz OLED touchscreens with detachable full-size Bluetooth keyboard. The ultimate multi-tasking workspace.',
    specs: { processor: 'Intel Core Ultra 9 185H', ram: '32GB', storage: '2TB SSD', display: 'Dual 14" 3K OLED 120Hz', weight: '1.35 kg' },
  },
  {
    fileName: 'product-11.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80',
    title: 'Samsung Galaxy Book4 Pro 360',
    brand: 'Samsung',
    category: 'Ultrabooks',
    price: 164990,
    originalPrice: 189990,
    discount: 13,
    stock: 25,
    rating: 4.7,
    description: 'Ultra-thin 2-in-1 laptop with Dynamic AMOLED 2X touch display, bundled S-Pen stylus, Galaxy Connected Experience, and AKG Quad speakers.',
    specs: { processor: 'Intel Core Ultra 7 155H', ram: '16GB', storage: '1TB NVMe', display: '16" 3K AMOLED 2X Touch', battery: '76Wh' },
  },
  {
    fileName: 'product-12.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80',
    title: 'Framework Laptop 16 (Modular DIY)',
    brand: 'Framework',
    category: 'Laptops',
    price: 184990,
    originalPrice: 199990,
    discount: 8,
    stock: 14,
    rating: 4.8,
    description: 'The worlds most upgradeable and repairable 16-inch high-performance laptop. Modular GPU bay, swappable ports, and user-serviceable internals.',
    specs: { processor: 'AMD Ryzen 7 7840HS', ram: '32GB DDR5', storage: '1TB NVMe', graphics: 'Radeon RX 7700S 8GB', display: '16" 165Hz' },
  },
  {
    fileName: 'product-13.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80',
    title: 'Alienware m16 R2 Gaming Laptop',
    brand: 'Dell',
    category: 'Gaming Laptops',
    price: 194990,
    originalPrice: 224990,
    discount: 13,
    stock: 20,
    rating: 4.6,
    description: 'Redesigned stealth chassis with Cryo-tech cooling, dedicated Stealth Mode hotkey, AlienFX per-key RGB, and high-fps RTX 4070 graphics.',
    specs: { processor: 'Intel Core Ultra 7 155H', ram: '16GB DDR5', storage: '1TB NVMe', graphics: 'RTX 4070 8GB', display: '16" QHD+ 240Hz' },
  },
  {
    fileName: 'product-14.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80',
    title: 'Acer Predator Helios 18',
    brand: 'Acer',
    category: 'Gaming Laptops',
    price: 269990,
    originalPrice: 309990,
    discount: 13,
    stock: 10,
    rating: 4.7,
    description: 'Massive 18-inch desktop replacement featuring AeroBlade 3D metal fans, liquid metal thermal paste, MagKey mechanical keycaps, and RTX 4080.',
    specs: { processor: 'Intel Core i9-14900HX', ram: '32GB', storage: '2TB NVMe RAID 0', graphics: 'RTX 4080 12GB', display: '18" Mini-LED 250Hz' },
  },
  {
    fileName: 'product-15.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800&q=80',
    title: 'Microsoft Surface Laptop 6',
    brand: 'Microsoft',
    category: 'Ultrabooks',
    price: 139990,
    originalPrice: 154990,
    discount: 10,
    stock: 30,
    rating: 4.6,
    description: 'Built for modern AI with Intel Core Ultra processors and Windows Copilot key. Vibrant PixelSense touchscreen with anti-reflective glass.',
    specs: { processor: 'Intel Core Ultra 5 135H', ram: '16GB', storage: '512GB SSD', display: '13.5" PixelSense Touch', battery: '18.5 hrs' },
  },
  {
    fileName: 'product-16.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=80',
    title: 'MSI Creator Z17 HX Studio OLED',
    brand: 'MSI',
    category: 'Workstations',
    price: 279990,
    originalPrice: 319990,
    discount: 12,
    stock: 12,
    rating: 4.8,
    description: 'Ultra-thin CNC unibody workstation for architects, 3D artists, and video creators. Calman color-certified touch display with MSI Pen 2.',
    specs: { processor: 'Intel Core i9-14900HX', ram: '64GB DDR5', storage: '2TB PCIe Gen5 SSD', graphics: 'RTX 4070 Studio', display: '17" QHD+ 165Hz' },
  },
  {
    fileName: 'product-17.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=800&q=80',
    title: 'LG Gram 17 Super-Light Laptop',
    brand: 'LG',
    category: 'Ultrabooks',
    price: 129990,
    originalPrice: 149990,
    discount: 13,
    stock: 35,
    rating: 4.6,
    description: 'Unbelievably light 17-inch laptop weighing only 1.35 kg. Magnesium-alloy chassis tested to military standards (MIL-STD-810H) with 80Wh battery.',
    specs: { processor: 'Intel Core Ultra 7 155H', ram: '16GB', storage: '1TB SSD', display: '17" WQXGA IPS', weight: '1.35 kg' },
  },
  {
    fileName: 'product-18.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    title: 'HP OMEN Transcend 14 Slim Gaming',
    brand: 'HP',
    category: 'Gaming Laptops',
    price: 149990,
    originalPrice: 174990,
    discount: 14,
    stock: 25,
    rating: 4.7,
    description: 'The worlds lightest 14-inch gaming laptop. Translucent pudding RGB keycaps, HyperX sound tuning, and ultra-vivid 2.8K 120Hz OLED display.',
    specs: { processor: 'Intel Core Ultra 7 155H', ram: '16GB', storage: '1TB SSD', graphics: 'RTX 4060 8GB', display: '14" 2.8K OLED 120Hz' },
  },
  {
    fileName: 'product-19.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
    title: 'Apple Studio Display 27" 5K Retina',
    brand: 'Apple',
    category: 'Accessories',
    price: 159900,
    originalPrice: 169900,
    discount: 6,
    stock: 20,
    rating: 4.9,
    description: '27-inch 5K Retina display with 12MP Ultra Wide camera with Center Stage, studio-quality three-mic array, six-speaker Spatial Audio, and 96W charging.',
    specs: { resolution: '5120x2880 5K Retina', brightness: '600 nits', camera: '12MP Ultra Wide Center Stage', audio: '6 speakers Spatial Audio' },
  },
  {
    fileName: 'product-20.jpg',
    sourceUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    title: 'Sony WH-1000XM5 Tech Headphones',
    brand: 'Sony',
    category: 'Accessories',
    price: 29990,
    originalPrice: 34990,
    discount: 14,
    stock: 60,
    rating: 4.8,
    description: 'Industry-leading active noise canceling with eight microphones and two processors. High-Resolution Audio Wireless with LDAC and 30-hour battery.',
    specs: { driver: '30mm carbon fiber', battery: '30 hrs ANC', connectivity: 'Bluetooth 5.2 Multipoint', weight: '250 g' },
  },
];

async function main() {
  console.log('🚀 Starting 20 Product Images Download, Supabase Upload, & DB Injection...');
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  const productsToInsert = [];

  for (let i = 0; i < productCatalog.length; i++) {
    const item = productCatalog[i];
    const localFilePath = path.join(UPLOADS_DIR, item.fileName);
    console.log(`[${i + 1}/20] Processing ${item.title}...`);

    let buffer;
    try {
      buffer = await fs.readFile(localFilePath);
      console.log(`  📁 Reusing local image file: ${item.fileName}`);
    } catch {
      try {
        const response = await fetch(item.sourceUrl);
        if (!response.ok) {
          throw new Error(`Failed to download from ${item.sourceUrl}: ${response.statusText}`);
        }
        const arrayBuf = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
        await fs.writeFile(localFilePath, buffer);
        console.log(`  📥 Downloaded image: ${item.fileName}`);
      } catch (downloadErr) {
        console.error(`  ❌ Failed downloading ${item.fileName}:`, downloadErr.message);
        continue;
      }
    }

    // 3. Upload to Supabase Storage bucket 'upload'
    const { error: uploadError } = await supabase.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .upload(item.fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.warn(`  ⚠️ Supabase upload warning for ${item.fileName}:`, uploadError.message);
    } else {
      console.log(`  ☁️ Uploaded to Supabase bucket '${env.SUPABASE_STORAGE_BUCKET}': ${item.fileName}`);
    }

    // Single public image URL from Supabase
    const publicUrl = getStoragePublicUrl(item.fileName);

    productsToInsert.push({
      title: item.title,
      brand: item.brand,
      category: item.category,
      price: item.price,
      originalPrice: item.originalPrice,
      discount: item.discount,
      stock: item.stock,
      rating: item.rating,
      description: item.description,
      image: publicUrl, // Verified single image URL
      specs: item.specs,
    });
  }

  // 4. Inject into PostgreSQL via Prisma
  console.log('\n🧹 Clearing existing products in database...');
  await prisma.product.deleteMany({});

  console.log(`💾 Inserting ${productsToInsert.length} products with single image into database...`);
  const createResult = await prisma.product.createMany({
    data: productsToInsert,
  });

  console.log(`✅ Successfully injected ${createResult.count} products into Supabase database!`);

  // Verify by fetching top 3
  const sampleProducts = await prisma.product.findMany({
    take: 3,
    select: { id: true, title: true, price: true, image: true },
  });
  console.log('\n🔎 Sample Injected Products:');
  sampleProducts.forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.title} (₹${p.price})`);
    console.log(`     Image: ${p.image}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Injection script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
