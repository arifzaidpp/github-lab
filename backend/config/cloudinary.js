import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME || "dalsp4a8a",
    api_key: process.env.CLOUD_API_KEY || "247531746671535",
    api_secret: process.env.CLOUD_API_SECRET || "T6Xi5BnW73zI1Wei_sDz24qSFE8",
});

export default cloudinary;
