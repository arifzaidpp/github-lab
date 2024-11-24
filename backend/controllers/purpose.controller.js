import bcrypt from "bcryptjs";
import Purpose from "../models/purpose.model.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";


// Get all purposes
export const getPurposes = async (req, res) => {
    try {
        const purposes = await Purpose.find().maxTimeMS(30000).sort('name');
        return res.status(200).json(purposes);
    } catch (error) {
        console.error("Error in getPurposes controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

// Create new purpose (admin only)
export const createPurpose = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { name, active } = req.body;

        // Validate required fields
        if (!name || !active) {
            return res.status(400).json({ error: "Please fill all the required fields" });
        }

        // Check if purpose name already exists
        const existingPurpose = await Purpose.findOne({ name });
        if (existingPurpose) return res.status(400).json({ message: 'Purpose already exists' });

        // Create a new purpose
        const purpose = new Purpose({
            name,
            active: active,
        });

        await purpose.save();

        return res.status(201).json({
            message: 'Purpose created successfully',
            purpose,
        });

    } catch (error) {
        console.error("Error in createPurpose controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


// Update purpose (admin only)
export const updatePurpose = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
      
        const purpose = await Purpose.findById(req.params.id);
        if (!purpose) {
          return res.status(404).json({ message: 'Purpose not found' });
        }
    
        // Instead of deleting, mark as inactive
        purpose.active = req.body.active;
        await purpose.save();
      
        if (!purpose) return res.status(404).json({ message: 'Purpose not found' });

        return res.status(200).json({
            message: 'Purpose updated successfully',
            purpose
        });
     
    } catch (error) {
        console.error("Error in updatePurpose controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


// Delete purpose (admin only)
export const deletePurpose = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
      
        const purpose = await Purpose.findByIdAndDelete(req.params.id);
      
        if (!purpose) return res.status(404).json({ message: 'Purpose not found' });

        return res.status(200).json({
            message: 'Purpose deleted successfully',
        });
     
    } catch (error) {
        console.error("Error in deletePurpose controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};