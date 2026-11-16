import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import { log } from "../logger.js"; 

// --- REGISTER API ---
export const register = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database not ready yet, please try again in a moment"
      });
    }

    const { name, email, phoneNumber, password } = req.body;

    if (!name || !email || !phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone number, and password are required"
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phoneNumber }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email or phone number already exists"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      phoneNumber,
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        uuid: newUser.uuid,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (err) {
    log("Register Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error during registration"
    });
  }
};

// --- LOGIN API ---
export const login = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database not ready yet, please try again in a moment"
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (!process.env.JWT_SECRET) {
      log("Login Error: JWT_SECRET is not set");
      return res.status(500).json({
        success: false,
        message: "Server misconfiguration"
      });
    }

    const tokenPayload = {
      id: user._id,
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      role: user.role 
    };

    const tokenExpiration = user.role === 'admin' ? "1d" : "7d";

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiration }
    );

    return res.json({
      success: true,
      token,
      user: tokenPayload 
    });

  } catch (err) {
    log("Login Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};