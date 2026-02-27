import genToken from "../config/token.js";
import Admin from "../model/Admin.model.js";
import bcrypt from "bcryptjs";
// Sign Up Auth
export const signUp = async (req, res) => {
    try {

        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if username already exists
        const findByUsername = await Admin.findOne({ username });
        if (findByUsername) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        // Secure password with hash
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await Admin.create({
            username,
            password: hashedPassword,
        });

        // Generate token
        const token = await genToken(user._id);

        // Set cookie token
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict', // or 'Strict'
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Return user data (exclude sensitive fields)
        res.status(201).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
        });
    } catch (error) {
        console.error('Sign up error:', error);
        res.status(500).json({ message: 'An error occurred during signup' });
    }
};

// Sign In Auth
export const signIn = async (req, res) => {
    try {
        const { username, password } = req.body;


        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Check if user exists
        const user = await Admin.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }


        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect password' });
        }

        // Generate token
        const token = await genToken(user._id);

        // Set cookie token
        const c = res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            secure: process.env.NODE_ENV === 'production', // Secure in production
            sameSite: 'Strict',
        });

        // Return user data (exclude sensitive fields)
        res.status(200).json({
            _id: user._id,
            username: user.username,
            token
        });
    } catch (error) {
        console.error('Sign in error:', error);
        res.status(500).json({ message: 'An error occurred during signin' });
    }
};

// Sign Out Auth
export const signOut = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        return res.status(200).json({ message: 'Signed out successfully' });
    } catch (error) {
        console.error('Sign out error:', error);
        return res.status(500).json({ message: 'An error occurred during signout' });
    }
};


export const getUserProfile = async (req, res) => {
  try {
    const user = await Admin.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
}