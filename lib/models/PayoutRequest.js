import mongoose from 'mongoose';

const PayoutRequestSchema = new mongoose.Schema({
  creatorId: {
    type: String,
    required: true,
    index: true // Fast searching ke liye
  },
  amount: {
    type: Number,
    required: true,
    min: 250 // Minimum payout threshold
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'BANK_TRANSFER'],
    default: 'UPI'
  },
  paymentDetails: {
    type: String,
    required: true // UPI ID ya Bank Account Number
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'rejected'],
    default: 'pending'
  },
  adminRemarks: {
    type: String,
    default: "" // Agar reject karna ho toh yahan reason likh sakte hain
  },
  paidAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Agar model pehle se bana hai toh wahi use karo, warna naya banao
export default mongoose.models.PayoutRequest || mongoose.model('PayoutRequest', PayoutRequestSchema);