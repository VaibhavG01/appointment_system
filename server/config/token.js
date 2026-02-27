import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const genToken = async (userId) => {
    try {
        const token = await jwt.sign({ userId }, process.env.JWT_TOKEN, { expiresIn: "10y" })
        return token
    } catch (error) {
        throw new Error(`gen token  error ${error}`)
    }
}

export default genToken