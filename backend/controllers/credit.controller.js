import Credit from "../models/credit.model.js";
import User from "../models/user.model.js";

// Get all credits (admin only)
export const credits = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const credits = await Credit.find().sort("-date").populate("userId", "name admissionNumber");

    return res.status(200).json(credits);
  } catch (error) {
    console.error("Error in credits controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


// Get limited credits (admin only)
export const limitedCredits = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { page = 1, limit = 20, userId } = req.query;
    const query = userId ? { userId } : {};

    const credits = await Credit.find(query)
      .sort("-date")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("userId", "name admissionNumber");

    const total = await Credit.countDocuments(query);

    return res.status(200).json({
      credits,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error in credits controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get user credits
export const userCredits = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.id !== req.params.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { page = 1, limit = 20 } = req.query;
    const userId = req.params.userId;

    const credits = await Credit.find({ userId })
      .sort("-date")
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Credit.countDocuments({ userId });

    return res.status(200).json({
      credits,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error in userCredits controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Add credit (admin only)
export const addCredit = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { userId, amount, notes } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const credit = new Credit({
      userId,
      amount,
      date: new Date(),
      notes,
    });

    await credit.save();

    // Update user's credit balance
    user.creditBalance += amount;
    user.netBalance += amount;
    await user.save();

    return res
      .status(201)
      .json({ message: "Credit added successfully", credit });
  } catch (error) {
    console.error("Error in addCredit controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update credit (admin only)
export const updateCredit = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const creditId = req.params.id;
    const { amount, description } = req.body;

    const credit = await Credit.findById(creditId);
    if (!credit) {
      return res.status(404).json({ message: "Credit not found" });
    }

    const user = await User.findById(credit.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Adjust user's credit balance
    const prevAmount = credit.amount;
    const newAmount = req.body.amount || prevAmount;
    
    credit.description = description;
    await credit.save();

    // Update user's credit balance
    user.creditBalance = user.creditBalance - prevAmount + newAmount;
    await user.save();

    // Update credit
    const updatedCredit = await Credit.findByIdAndUpdate(
      req.params.id,
        { $set: req.body },
        { new: true }
        );

    return res
      .status(200)
      .json({ message: "Credit updated successfully", updatedCredit });
  } catch (error) {
    console.error("Error in updateCredit controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete credit (admin only)
export const deleteCredit = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const creditId = req.params.id;

    const credit = await Credit.findById(creditId);
    if (!credit) {
      return res.status(404).json({ message: "Credit not found" });
    }

    const user = await User.findById(credit.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user's credit balance
    user.creditBalance -= credit.amount;
    user.netBalance -= credit.amount;
    await user.save();

    await Credit.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Credit deleted successfully" });
  } catch (error) {
    console.error("Error in deleteCredit controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get credit statistics (admin only)
export const creditStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const stats = await Credit.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalCredits: { $sum: '$amount' },
            averageCredit: { $avg: '$amount' },
            count: { $sum: 1 }
          }
        }
    ]);

    return res.status(200).json(stats[0] || { totalCredits: 0, averageCredit: 0, count: 0 });
  } catch (error) {
    console.error("Error in creditStats controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};