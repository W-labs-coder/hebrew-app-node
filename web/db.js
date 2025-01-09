import mongoose from "mongoose";

const mongoUri =
  "mongodb+srv://emmyconceptng:5FAes7qL0JjICpm2@hebrew-app.sxmin.mongodb.net/?retryWrites=true&w=majority&appName=hebrew-app";

(async function testMongoConnection() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
})();
