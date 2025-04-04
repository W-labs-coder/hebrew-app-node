import User from "../models/User.js";
import shopify from "../shopify.js";
import nodemailer from "nodemailer"; // You'll need to install this
import OrderCancellation from "../models/OrderCancellation.js";

export const submitCancellationRequest = async (req, res) => {
  try {
    const { fullName, email, phone, orderNumber, message, shop } = req.body;

    if (!shop) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing shop information" 
      });
    }

    const host = process.env.HOST || req.get('host');

    // Save to database with shop information
    const cancellation = new OrderCancellation({
      shop,
      fullName,
      email,
      phone,
      orderNumber,
      message,
    });
    await cancellation.save();

    // Find store owner's email from the User model
    const storeUser = await User.findOne({ shop });
    const notificationEmail = storeUser?.ownerWebsiteEmail || process.env.ADMIN_EMAIL;

    // Optionally send email notification
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: notificationEmail,
      subject: `New Order Cancellation Request - ${orderNumber}`,
      text: `Store: ${shop}\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nOrder Number: ${orderNumber}\nMessage: ${message}`,
    });

    res.status(200).json({ success: true, message: "Cancellation request submitted successfully" });
  } catch (error) {
    console.error("Error submitting cancellation request:", error);
    res.status(500).json({ success: false, message: "Failed to submit cancellation request" });
  }
};

// Add method to fetch cancellations
export const getCancellations = async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const shop = session.shop;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const query = { shop };
    if (status) {
      query.status = status;
    }

    const cancellations = await OrderCancellation.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await OrderCancellation.countDocuments(query);

    res.status(200).json({
      success: true,
      data: cancellations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });

  } catch (error) {
    console.error("Error fetching cancellations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cancellations",
      error: error.message
    });
  }
};
