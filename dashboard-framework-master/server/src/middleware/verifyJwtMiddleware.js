const jwt = require("jsonwebtoken");
const secretKey = process.env.KEY;

// Middleware function to verify the JWT token
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    let response = {
      code: 401,
      message: "",
    };

    if (!token) {
      response.message = "Missing token";
      return res.status(401).json(response);
    }

    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        response.message = "Invalid token";
        return res.status(401).json(response);
      }

      next();
    });
  } catch (e) {
    console.log("Error in verifyToken", e);
  }
};

module.exports = verifyToken;
