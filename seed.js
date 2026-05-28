require('dotenv').config();
const mongoose = require('mongoose');
const { Product, User, Order } = require('./models'); 

const MONGO_URI = process.env.MONGODB_URI;

async function seedDatabase() {
  try {
    console.log('Connecting to cloud database shard cluster...');
    await mongoose.connect(MONGO_URI);
    console.log('Database connection stable.');

    // 1. CLEAN ARCHIVE
    console.log('Clearing old collections...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    // 2. SEED MOCK USERS (Admin & Customers)
    console.log('Generating dummy accounts...');
    const createdUsers = await User.create([
      {
        name: 'System Administrator',
        email: 'admin@matrix.io',
        password: 'admin_secure_password', 
        role: 'admin',      
        isAdmin: true,      
        defaultShipping: {
          street: '101 Server Command Center',
          city: 'Data Cluster',
          state: 'HQ',
          zipCode: '00000'
        }
      },
      {
        name: 'Alice Vance',
        email: 'alice@matrix.io',
        password: 'hashed_password_123',
        role: 'customer',
        isAdmin: false,
        defaultShipping: {
          street: '404 Innovation Way',
          city: 'Tech City',
          state: 'CA',
          zipCode: '90210'
        }
      },
      {
        name: 'Bob Miller',
        email: 'bob@cyber.net',
        password: 'hashed_password_456',
        role: 'customer',
        isAdmin: false,
        defaultShipping: {
          street: '742 Evergreen Terrace',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62704'
        }
      }
    ]);

    // 3. SEED MOCK PRODUCTS
    console.log('Provisioning storefront retail inventory assets...');
    const createdProducts = await Product.create([
      {
        name: 'Quantum Noise Headphones',
        description: 'Hybrid ANC headphones featuring an immersive 40mm cinematic driver matrix.',
        price: 299.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
        stockQuantity: 12,
        isActive: true
      },
      {
        name: 'Ergonomic Mechanical Keyboard',
        description: 'Hot-swappable tactile switches wrapped in an aircraft-grade aluminum casing.',
        price: 159.50,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80',
        stockQuantity: 4, 
        isActive: true
      },
      {
        name: '4K Ultra-Wide Creator Monitor',
        description: '34-inch curved display calibrated perfectly for digital design pipelines.',
        price: 649.99,
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80',
        stockQuantity: 25,
        isActive: true
      }
    ]);

    // 4. SEED SYNCHRONIZED ORDERS
    console.log('Compiling historical order records...');
    const p1 = createdProducts[0];
    const p2 = createdProducts[1];
    const p3 = createdProducts[2];

    const subtotal1 = (p1.price * 1) + (p2.price * 2);
    const subtotal2 = p3.price * 1;

    await Order.create([
      {
        userId: createdUsers[1]._id, // Linked to Alice
        items: [
          { productId: p1._id, name: p1.name, quantity: 1, priceAtPurchase: p1.price },
          { productId: p2._id, name: p2.name, quantity: 2, priceAtPurchase: p2.price }
        ],
        pricing: {
          subtotal: subtotal1,
          tax: subtotal1 * 0.08,
          shippingCost: 15.00,
          totalAmount: subtotal1 + (subtotal1 * 0.08) + 15.00
        },
        shippingAddress: {
          street: createdUsers[1].defaultShipping.street,
          city: createdUsers[1].defaultShipping.city,
          state: createdUsers[1].defaultShipping.state,
          zipCode: createdUsers[1].defaultShipping.zipCode
        },
        paymentInfo: { method: 'Stripe', transactionId: 'ch_3MvY2XClsrNgjG2M1x8KqZp', status: 'Paid' },
        orderStatus: 'Processing'
      },
      {
        userId: createdUsers[2]._id, // Linked to Bob
        items: [
          { productId: p3._id, name: p3.name, quantity: 1, priceAtPurchase: p3.price }
        ],
        pricing: {
          subtotal: subtotal2,
          tax: subtotal2 * 0.08,
          shippingCost: 15.00,
          totalAmount: subtotal2 + (subtotal2 * 0.08) + 15.00
        },
        shippingAddress: {
          street: createdUsers[2].defaultShipping.street,
          city: createdUsers[2].defaultShipping.city,
          state: createdUsers[2].defaultShipping.state,
          zipCode: createdUsers[2].defaultShipping.zipCode
        },
        paymentInfo: { method: 'PayPal', transactionId: 'PAYID-MNS4309AA201', status: 'Paid' },
        orderStatus: 'Shipped'
      }
    ]);

    console.log('🎉 Database seeding sequence completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding aborted due to an error:', error);
    process.exit(1);
  }
}

seedDatabase();