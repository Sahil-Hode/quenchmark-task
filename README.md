# Quenchmark Mini E-Commerce / Store Backend

Full-featured Express.js & Prisma backend connected to Supabase PostgreSQL and Supabase Storage.

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Express.js (ES Modules), Nodemon
- **Database ORM**: Prisma 6 with PostgreSQL (Supabase pooler & direct session connection)
- **Authentication**: Mobile & OTP-based with JWT tokens
- **Validation**: Zod schema validation middleware
- **File Storage**: Supabase Storage bucket (`upload`) with `@supabase/supabase-js`

---

## 🚀 Setup & Execution

### 1. Environment Configuration (`.env`)
The `.env` file is already configured with your Supabase credentials:
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=*

DATABASE_URL="postgresql://postgres.xzgxfzkmzfqoiikpvmif:rqfgozBH8bfokRoA@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xzgxfzkmzfqoiikpvmif:rqfgozBH8bfokRoA@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"
DBPASS=rqfgozBH8bfokRoA

SUPABASE_URL="https://xzgxfzkmzfqoiikpvmif.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1Ni..."
SUPABASE_STORAGE_BUCKET="upload"

JWT_SECRET="quenchmark_super_secret_jwt_key_2026_secure"
JWT_EXPIRES_IN="7d"

FAST2SMS_API_KEY="your_fast2sms_api_key_here"
```

### 2. Available Scripts
```bash
# Start Development Server (with auto-reload)
npm run dev

# Re-seed 20 IT Tech Products into Supabase
npm run seed

# Run End-to-End Automated Test Suite
node test-flow.js
```

---

## 🗄️ Database Models (Prisma)

- **`User`** (`users` table): `id`, `mobile` (unique), `name`, `email`, `otp`, `otpExpiresAt`, `role`, `createdAt`
- **`Product`** (`products` table): `id`, `title`, `description`, `price`, `originalPrice`, `discount`, `category`, `brand`, `image`, `images`, `stock`, `rating`, `specs` (JSON), `createdAt`
- **`Cart`** & **`CartItem`** (`carts` & `cart_items` tables): Dynamic user carts with item relations and stock tracking
- **`Order`** & **`OrderItem`** (`orders` & `order_items` tables): Stores orders placed via Fake Checkout with item snapshots, totals, and delivery addresses

---

## 📡 API Reference & Endpoints

### 🔐 1. Authentication (Mobile & OTP)

#### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "mobile": "9876543210"
}
```
*Response*:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "mobile": "9876543210",
    "otp": "123456",
    "expiresIn": "10 minutes"
  },
  "message": "OTP generated and sent successfully"
}
```

#### Verify OTP & Login
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "mobile": "9876543210",
  "otp": "123456",
  "name": "Sahil Hode"
}
```
*Response*:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "user": { "id": "...", "mobile": "9876543210", "name": "Sahil Hode" },
    "token": "eyJhbGciOi..."
  }
}
```

#### Get Current User Profile (Protected)
```http
GET /api/auth/me
Authorization: Bearer <TOKEN>
```

---

### 💻 2. Products

#### Get Paginated Products with Search, Filters & Sorting
```http
GET /api/products?page=1&limit=10&search=MacBook&category=MacBooks&sortBy=price_asc
```
- `sortBy` options: `price_asc` (Price Low-to-High), `price_desc`, `rating`, `newest`
- `search`: Searches across title, description, brand, and category
- `category`: Filter by category (e.g., `Gaming Laptops`, `Ultrabooks`, `MacBooks`, `Workstations`, `Accessories`)
- `minPrice`, `maxPrice`: Filter by price range

#### Get Product Details
```http
GET /api/products/:id
```

#### Get Categories List
```http
GET /api/products/categories
```

---

### 🛒 3. Cart & Dynamic Pricing

All Cart routes require `Authorization: Bearer <TOKEN>`.

#### Get User Cart
```http
GET /api/cart
```
*Calculates dynamic totals automatically:*
```json
{
  "success": true,
  "data": {
    "items": [...],
    "summary": {
      "subtotal": 59980,
      "tax": 10796.4,
      "shippingFee": 0,
      "totalAmount": 70776.4,
      "totalSavings": 10000,
      "totalQuantity": 2,
      "isFreeShippingEligible": true
    }
  }
}
```

#### Add Product to Cart
```http
POST /api/cart/add
Content-Type: application/json

{
  "productId": "PRODUCT_ID",
  "quantity": 1
}
```

#### Update Item Quantity
```http
PATCH /api/cart/update
Content-Type: application/json

{
  "productId": "PRODUCT_ID",
  "quantity": 3
}
```

#### Remove Product from Cart
```http
DELETE /api/cart/remove/:productId
```

#### Clear Entire Cart
```http
DELETE /api/cart/clear
```

---

### 📦 4. Orders & Fake Checkout

#### Fake Checkout Button Hit (Places Order in DB)
```http
POST /api/orders/checkout
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "paymentMethod": "FAKE_CHECKOUT",
  "shippingAddress": {
    "fullName": "Sahil Hode",
    "addressLine": "Flat 402, Tech Towers",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001"
  }
}
```
*What happens automatically:*
1. Validates cart items and stock.
2. Calculates subtotal, tax, and grand total.
3. Creates `Order` with unique `orderNumber` (e.g. `ORD-20261017-819271`) and status `CONFIRMED`.
4. Creates snapshots in `OrderItem` table.
5. Decrements product stock in DB.
6. Empties the user's cart in DB.

#### List User Orders
```http
GET /api/orders
Authorization: Bearer <TOKEN>
```

#### Get Order Details
```http
GET /api/orders/:id
Authorization: Bearer <TOKEN>
```

---

### ☁️ 5. Supabase Storage Upload

#### Upload Base64 Image to `upload` Bucket
```http
POST /api/upload/base64
Content-Type: application/json

{
  "fileName": "my-laptop.jpg",
  "base64Data": "data:image/jpeg;base64,..."
}
```

#### List Files in `upload` Bucket
```http
GET /api/upload/files
```
# quenchmark-task
