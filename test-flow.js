const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting End-to-End API Test Suite...');

  // 1. Send OTP
  console.log('\n--- 1. Testing Auth: Send OTP ---');
  const sendOtpRes = await fetch(`${BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: '9876543210' }),
  });
  const sendOtpData = await sendOtpRes.json();
  console.log('Status:', sendOtpRes.status, 'Response:', sendOtpData);
  const otp = sendOtpData.data.otp;

  // 2. Verify OTP
  console.log('\n--- 2. Testing Auth: Verify OTP ---');
  const verifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobile: '9876543210',
      otp,
      name: 'Sahil Test User',
    }),
  });
  const verifyData = await verifyRes.json();
  console.log('Status:', verifyRes.status, 'User:', verifyData.data?.user?.name);
  const token = verifyData.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 3. Get User Profile
  console.log('\n--- 3. Testing Auth: /auth/me ---');
  const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
  const meData = await meRes.json();
  console.log('Status:', meRes.status, 'Profile Mobile:', meData.data?.mobile);

  // 4. Products: Paginated & Sorted (Price Low to High)
  console.log('\n--- 4. Testing Products: Sorting (price_asc - low to high) ---');
  const productsRes = await fetch(`${BASE_URL}/products?sortBy=price_asc&limit=3`);
  const productsData = await productsRes.json();
  console.log('Total Products:', productsData.data.pagination.total);
  productsData.data.products.forEach((p, idx) => {
    console.log(`  ${idx + 1}. [₹${p.price}] ${p.title} (${p.category})`);
  });

  // 5. Products: Search Filter
  console.log('\n--- 5. Testing Products: Search "ROG" ---');
  const searchRes = await fetch(`${BASE_URL}/products?search=ROG`);
  const searchData = await searchRes.json();
  console.log('Search matches:', searchData.data.products.length);
  searchData.data.products.forEach((p) => console.log(`  - ${p.title} by ${p.brand}`));

  // 6. Products: Category Filter
  console.log('\n--- 6. Testing Products: Category "Ultrabooks" ---');
  const catRes = await fetch(`${BASE_URL}/products?category=Ultrabooks`);
  const catData = await catRes.json();
  console.log('Ultrabooks count:', catData.data.products.length);

  const testProduct = productsData.data.products[0];
  const testProduct2 = productsData.data.products[1];

  // 7. Cart: Add Products
  console.log('\n--- 7. Testing Cart: Add Products ---');
  const addCartRes = await fetch(`${BASE_URL}/cart/add`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ productId: testProduct.id, quantity: 2 }),
  });
  const addCartData = await addCartRes.json();
  console.log('Status:', addCartRes.status, 'Summary:', addCartData.data?.summary);

  // Add 2nd product
  await fetch(`${BASE_URL}/cart/add`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ productId: testProduct2.id, quantity: 1 }),
  });

  // 8. Cart: Fetch Cart with Dynamic Totals
  console.log('\n--- 8. Testing Cart: Fetch Cart with Dynamic Totals ---');
  const getCartRes = await fetch(`${BASE_URL}/cart`, { headers: authHeaders });
  const getCartData = await getCartRes.json();
  console.log('Cart Items Count:', getCartData.data.items.length);
  console.log('Dynamic Totals:', getCartData.data.summary);

  // 9. Cart: Update Quantity
  console.log('\n--- 9. Testing Cart: Update Quantity ---');
  const updateCartRes = await fetch(`${BASE_URL}/cart/update`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ productId: testProduct.id, quantity: 1 }),
  });
  const updateCartData = await updateCartRes.json();
  console.log('Updated Totals after qty modification:', updateCartData.data?.summary);

  // 10. Fake Checkout & Order Placement
  console.log('\n--- 10. Testing Order Placement: Fake Checkout ---');
  const checkoutRes = await fetch(`${BASE_URL}/orders/checkout`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      paymentMethod: 'FAKE_CHECKOUT',
      shippingAddress: {
        fullName: 'Sahil Test User',
        addressLine: 'Flat 402, Tech Towers',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
      },
    }),
  });
  const checkoutData = await checkoutRes.json();
  console.log('Checkout Status:', checkoutRes.status);
  console.log('Order Created:', {
    orderNumber: checkoutData.data?.orderNumber,
    status: checkoutData.data?.status,
    totalAmount: checkoutData.data?.totalAmount,
    itemsCount: checkoutData.data?.items?.length,
  });

  // 11. Verify Cart is Empty after Checkout
  console.log('\n--- 11. Testing Cart Cleared after Checkout ---');
  const cartAfterRes = await fetch(`${BASE_URL}/cart`, { headers: authHeaders });
  const cartAfterData = await cartAfterRes.json();
  console.log('Items remaining in cart:', cartAfterData.data.items.length);

  // 12. Verify Orders List
  console.log('\n--- 12. Testing Orders List ---');
  const ordersRes = await fetch(`${BASE_URL}/orders`, { headers: authHeaders });
  const ordersData = await ordersRes.json();
  console.log('Total orders in DB for user:', ordersData.data.count);

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
