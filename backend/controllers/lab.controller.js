import Lab from '../models/lab.model.js';

// Initialize lab
export const addLab = async (req, res) => {
  try {
    const { labName, computerId } = req.body;
    
    let lab = await Lab.findOne({ computerId: computerId });

    if (lab && lab.name === labName) {
      lab.lastActive = new Date();
      await lab.save();
      
      return res.status(200).json(lab.name);
    }
    
    if (!lab) {
      lab = new Lab({
        computerId: computerId,
        name: labName,
        lastActive: new Date()
      });
      await lab.save();
    } else {
      lab.lastActive = new Date();
      await lab.save();
    }

    return res.status(200).json(lab.name);
    } catch (error) {
        console.error("Lab initialization error:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

// Get all lab status (admin only)
export const getAllLabStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const labs = await Lab.find();
    return res.status(200).json(labs);
    } catch (error) {
        console.error("Error in getAllLabStatus controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

// Get lab
export const getLab = async (req, res) => {
  
  try {
    const lab = await Lab.findOne({ computerId: req.params.computerId });
    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }
    return res.status(200).json(lab);
    } catch (error) {
        console.error("Error in getLab controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


// Get lab status
export const getLabStatus = async (req, res) => {
  try {
    const lab = await Lab.findOne({ labId: req.params.labId });
    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }
    return res.status(200).json(lab)
    } catch (error) {
        console.error("Error in getLabStatus controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

// Update lab status (admin only)
export const updateLabStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { labId, status } = req.body;
    const lab = await Lab.findOneAndUpdate(
        { labId: req.params.labId },
        { $set: req.body },
        { new: true }
      );
    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }
    return res.status(200).json(lab);
    } catch (error) {
        console.error("Error in updateLabStatus controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
