import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema({
  name: String,
  amount: Number,
  duration: String,
  features: [String],
  permissions:[String],
});

export default mongoose.model("Subscription", SubscriptionSchema);
