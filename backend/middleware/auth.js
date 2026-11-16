import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, user not found"
        });
      }

      req.user = user;
      return next();

    } catch (error) {
      console.error("Authentication Error:", error.message);
      let message = "Not authorized, token failed";
      if (error.name === "TokenExpiredError") {
        message = "Not authorized, token expired";
      }
      return res.status(401).json({
        success: false,
        message
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: "Not authorized, no token provided"
  });
};

export default auth;