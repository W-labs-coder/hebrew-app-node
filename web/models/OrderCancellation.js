import mongoose from "mongoose";

const orderCancellationSchema = new mongoose.Schema(
  {
    shop: {
      type: String,
      required: true,
      index: true
    },
    fullName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    orderNumber: {
      type: String,
      required: true,
      index: true
    },
    message: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending'
    },
    processedAt: Date,
    adminNotes: String
  },
  { timestamps: true }
);

// Add compound index for shop + orderNumber
orderCancellationSchema.index({ shop: 1, orderNumber: 1 });

const OrderCancellation = mongoose.model("OrderCancellation", orderCancellationSchema);

export default OrderCancellation;
