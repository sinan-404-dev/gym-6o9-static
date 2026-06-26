const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();

// Initialize Firebase
const serviceAccount = require('./serviceAccountKey.json');
initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static files from current directory

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order Endpoint
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, receipt } = req.body;
    
    // amount is in paise for INR (multiply by 100)
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: receipt || `rcpt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify Payment Endpoint
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, memberData } = req.body;
    
    // Create expected signature using our secret key
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is authentic! Save member to Firestore
      await db.collection('members').doc(memberData.memberId).set(memberData);

      return res.status(200).json({ success: true, message: "Payment verified successfully", memberId: memberData.memberId });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature sent!" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { phone, memberId } = req.body;
    const doc = await db.collection('members').doc(memberId).get();
    
    if (doc.exists && doc.data().whatsappNumber === phone) {
      res.json({ success: true, memberId });
    } else {
      res.status(401).json({ success: false, message: "Invalid Phone Number or Member ID" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get Member Info Endpoint
app.get('/api/me/:memberId', async (req, res) => {
  try {
    const doc = await db.collection('members').doc(req.params.memberId).get();
    
    if (doc.exists) {
      res.json({ success: true, member: doc.data() });
    } else {
      res.status(404).json({ success: false, message: "Member not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Admin Login Endpoint
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true, token: "admin-auth-token" });
  } else {
    res.status(401).json({ success: false, message: "Invalid Password" });
  }
});

// Admin Get Members Endpoint
app.get('/api/admin/members', async (req, res) => {
  try {
    const snapshot = await db.collection('members').get();
    const members = [];
    snapshot.forEach(doc => {
      members.push(doc.data());
    });
    res.json({ success: true, members });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Pricing Endpoints
app.get('/api/prices', async (req, res) => {
  try {
    const doc = await db.collection('config').doc('prices').get();
    if (doc.exists) {
      res.json({ success: true, prices: doc.data().prices });
    } else {
      res.json({ success: true, prices: {} });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post('/api/prices', async (req, res) => {
  try {
    const { prices } = req.body;
    await db.collection('config').doc('prices').set({ prices });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Features Endpoints
app.get('/api/features', async (req, res) => {
  try {
    const doc = await db.collection('config').doc('features').get();
    if (doc.exists) {
      res.json({ success: true, features: doc.data().features });
    } else {
      res.json({ success: true, features: {} });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post('/api/features', async (req, res) => {
  try {
    const { features } = req.body;
    await db.collection('config').doc('features').set({ features });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
