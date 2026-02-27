import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const isAuth = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Token not found" });
    }

    const verifyToken = jwt.verify(token, process.env.JWT_TOKEN);

    req.userId = verifyToken.userId;

    next();
  } catch (error) {
    return res.status(500).json({ message: `Token error: ${error.message}` });
  }
};

export default isAuth;
