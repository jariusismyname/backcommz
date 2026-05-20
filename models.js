// models.js (Backend)
const mongoose = require('mongoose');

// 1. PRODUCT COLLECTION (Tracks Inventory)
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String },
  stockQuantity: { type: Number, required: true, default: 0 }, // Crucial for checkout
  isActive: { type: Boolean, default: true } // Hide products instead of deleting them
}, { timestamps: true });

// 2. USER COLLECTION (Expanded for Checkout)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Save multiple details to pre-fill the checkout form
  defaultShipping: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'US' }
  }
}, { timestamps: true });

// 3. ORDER COLLECTION (The Core Checkout Record)
const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // SNAPSHOT: We copy the product details here so price changes don't alter past receipts
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtPurchase: { type: Number, required: true } 
  }],

  // CHECKOUT MATH
  pricing: {
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true, default: 0 },
    shippingCost: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true }
  },

  // WHERE IT GOES
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },

  // PAYMENT TRACKING
  paymentInfo: {
    method: { type: String, enum: ['Stripe', 'PayPal', 'CreditCard'], required: true },
    transactionId: { type: String }, // Provided by Stripe/PayPal after success
    status: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' }
  },

  // FULFILLMENT TRACKING
  orderStatus: { 
    type: String, 
    enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], 
    default: 'Processing' 
  }
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);
const User = mongoose.model('User', UserSchema);
const Order = mongoose.model('Order', OrderSchema);

module.exports = { Product, User, Order };