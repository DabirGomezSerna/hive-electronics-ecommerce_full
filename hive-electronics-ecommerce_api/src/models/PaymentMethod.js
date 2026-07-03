import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "credit_card",
        "debit_card",
        "paypal",
        "bank_transfer",
        "cash_on_delivery",
      ],
    },
    cardNumber: { type: String, max: 16 },
    cardHolderName: {
      type: String,
      trim: true,
    },
    expiryDate: {
      type: String,
    },
    paypalEmail: {
      type: String,
    },
    bankName: {
      type: String,
    },
    accountNumber: {
      type: String,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    cvv: {
      type: String,
    },
  },
  { timestamps: true },
);

const PaymentMethod = mongoose.model("paymentMethod", paymentMethodSchema);

export default PaymentMethod;
