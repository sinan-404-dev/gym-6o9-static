const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_FILE = path.join(__dirname, 'database.json');

// Helper to read DB
const readDB = () => {
  if (!fs.existsSync(DB_FILE)) return { members: [] };
  const data = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(data);
};

// Helper to write DB
const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

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
app.post('/api/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, memberData } = req.body;
    
    // Create expected signature using our secret key
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is authentic!
      // Save member to database
      const db = readDB();
      db.members.push(memberData);
      writeDB(db);

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
app.post('/api/login', (req, res) => {
  const { phone, memberId } = req.body;
  const db = readDB();
  const member = db.members.find(m => m.whatsappNumber === phone && m.memberId === memberId);
  
  if (member) {
    res.json({ success: true, memberId: member.memberId });
  } else {
    res.status(401).json({ success: false, message: "Invalid Phone Number or Member ID" });
  }
});

// Get Member Info Endpoint
app.get('/api/me/:memberId', (req, res) => {
  const db = readDB();
  const member = db.members.find(m => m.memberId === req.params.memberId);
  
  if (member) {
    res.json({ success: true, member });
  } else {
    res.status(404).json({ success: false, message: "Member not found" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
