import mongoose from "mongoose";

const shippingAddressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    address1: {
      type: String,
      required: true,
      trim: true,
    },
    address2: { type: String, trim: true },
    postalCode: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    reference: { type: String, trim: true },
    defaultAddress: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const ShippingAddress = mongoose.model(
  "shippingAddress",
  shippingAddressSchema,
);

export default ShippingAddress;
