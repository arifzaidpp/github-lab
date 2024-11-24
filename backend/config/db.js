import mongoose from "mongoose";

const connectToMongoDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || "mongodb+srv://arifzaidaiju:oaXkBDhT6elJ6Q9G@cluster0.6yvzq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

        // Configure mongoose with timeout settings
        await mongoose.connect(mongoUri, {
            socketTimeoutMS: 30000, // Socket timeout increased to 30 seconds
            connectTimeoutMS: 30000, // Connection timeout increased to 30 seconds
        });

        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);

        // Provide suggestions for resolving the error
        if (error.message.includes("timed out")) {
            console.error(
                "The connection attempt timed out. Please check your network connection or MongoDB server availability."
            );
        }

        process.exit(1); // Exit the process if connection fails
    }
};

export default connectToMongoDB;
