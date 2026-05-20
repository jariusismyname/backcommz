// server.js (Backend)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Import your database schemas
const { User, Product, Order } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";
const mongoURI = "mongodb+srv://jarius:connectedisme1234@cluster0.axzmifl.mongodb.net/ecommerce?retryWrites=true&w=majority";

// 1. DATABASE CONNECTION
mongoose.connect(mongoURI)
  .then(() => console.log('🚀 Connected securely to MongoDB Atlas Cloud!'))
  .catch(err => console.error('❌ Cloud DB Connection Error:', err));


// 2. SEED ROUTE (Run this ONCE to populate your database)
app.post('/api/seed-products', async (req, res) => {
  try {
    await Product.deleteMany({}); // Clears old products
    const products = await Product.insertMany([
      { name: 'Sony Noise-Cancelling Headphones', price: 299.99, stockQuantity: 10, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'Keychron Mechanical Keyboard', price: 109.99, stockQuantity: 15, image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'Logitech Gaming Mouse', price: 79.99, stockQuantity: 20, image: 'https://images.unsplash.com/photo-1527814050087-179f00485c14?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
      { name: 'Samsung 32" Curved Monitor', price: 349.99, stockQuantity: 5, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' }
    ]);
    res.json({ message: "Database Seeded Successfully!", products });
  } catch (error) {
    res.status(500).json({ error: "Failed to seed database" });
  }
});


// 3. GET PRODUCTS ROUTE
app.get('/api/products', async (req, res) => {
  try {
    // Only fetch products that have stock and are active
    const products = await Product.find({ isActive: true, stockQuantity: { $gt: 0 } });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});


// 4. MOCK LOGIN ROUTE
app.post('/api/auth/login', async (req, res) => {
  try {
    let user = await User.findOne({ email: "buyer@example.com" });
    if (!user) {
      user = await User.create({
        name: "John Doe",
        email: "buyer@example.com",
        password: "hashedpassword123",
        defaultShipping: { street: "123 Main Street", city: "New York", state: "NY", zipCode: "10001" }
      });
    }
    const token = jwt.sign({ id: user._id, address: user.defaultShipping.street, name: user.name }, JWT_SECRET);
    res.json({ token, user: { name: user.name, address: user.defaultShipping.street } });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});


// 5. SECURE CHECKOUT ROUTE
app.post('/api/checkout', async (req, res) => {
  try {
    const { cartItems } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).json({ message: "You must be logged in to checkout!" });
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    let subtotal = 0;
    const orderItems = [];

    // Verify inventory and calculate real prices directly from the database
    for (let item of cartItems) {
      const dbProduct = await Product.findById(item._id);
      if (!dbProduct || dbProduct.stockQuantity < 1) {
        return res.status(400).json({ message: `Sorry, ${item.name} is out of stock!` });
      }
      
      subtotal += dbProduct.price;
      orderItems.push({
        productId: dbProduct._id,
        name: dbProduct.name,
        quantity: 1, 
        priceAtPurchase: dbProduct.price 
      });
    }

    const tax = subtotal * 0.08;
    const shippingCost = 15.00;
    const totalAmount = subtotal + tax + shippingCost;

    // Create and save the order
    const newOrder = new Order({
      userId: decoded.id,
      items: orderItems,
      pricing: { subtotal, tax, shippingCost, totalAmount },
      shippingAddress: { street: decoded.address, city: "Tech City", state: "CA", zipCode: "90210" },
      paymentInfo: { method: 'CreditCard', status: 'Paid', transactionId: "txn_" + Date.now() }
    });
    
    await newOrder.save();

    // Decrement the inventory
    for (let item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: -item.quantity } });
    }

    res.json({ message: "Order placed successfully!", orderId: newOrder._id, deliveredTo: newOrder.shippingAddress.street });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during checkout." });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));

app.get('/api/admin/orders', async (req, res) => {
      try {
        // The -1 sorts by ObjectId descending (newest first)
        const orders = await Order.find().sort({ _id: -1 });
        res.json(orders);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to load admin orders." });
      }
    });