import User from "../models/User.js";
import shopify from "../shopify.js";
import nodemailer from "nodemailer"; // You'll need to install this
import OrderCancellation from "../models/OrderCancellation.js";

export const submitCancellationRequest = async (req, res) => {
  try {
    const { fullName, email, phone, orderNumber, message } = req.body;
    const shop = req.query.shop;

    // Get store owner's email from User model
    const user = await User.findOne({ shop });
    if (!user || !user.email) {
      throw new Error('Store configuration not found');
    }

    // Create new cancellation record
    const cancellation = new OrderCancellation({
      shop,
      fullName,
      email,
      phone,
      orderNumber,
      message
    });

    await cancellation.save();

    // Create email content
    const emailContent = `
      New Cancellation Request
      -----------------------
      Name: ${fullName}
      Email: ${email}
      Phone: ${phone}
      Order Number: ${orderNumber}
      Message: ${message}
      Shop: ${shop}
    `;

    // Send email to store owner
    const transporter = nodemailer.createTransport({
      // Configure your email service
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `New Order Cancellation Request - ${orderNumber}`,
      text: emailContent
    });

    res.status(200).json({
      success: true,
      message: "Cancellation request submitted successfully",
      cancellationId: cancellation._id
    });

  } catch (error) {
    console.error("Error submitting cancellation request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit cancellation request",
      error: error.message
    });
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
