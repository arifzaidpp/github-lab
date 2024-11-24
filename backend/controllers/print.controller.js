import Print from "../models/print.model.js";
import User from "../models/user.model.js";

// Get all prints (admin only)
export const allPrints = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const prints = await Print.find()
      .sort("-date")
      .populate("userId", "name admissionNumber");

    return res.status(200).json(prints);
  } catch (error) {
    console.error("Error in prints controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get limited prints (admin only)
export const limitedPrints = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { page = 1, limit = 20, userId } = req.query;
    const query = userId ? { userId } : {};

    const prints = await Print.find(query)
      .sort("-date")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("userId", "name admissionNumber");

    const total = await Print.countDocuments(query);

    return res.status(200).json({
      prints,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error in limitedPrints controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get user prints
export const userPrints = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.id !== req.params.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { page = 1, limit = 20 } = req.query;
    const userId = req.params.userId;

    const prints = await Print.find({ userId })
      .sort("-date")
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Print.countDocuments({ userId });

    return res.status(200).json({
      prints,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error in userPrints controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Add print (admin only)
export const addPrint = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { userId, page, pageByUser } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const amount = pageByUser ? page * 1 : page * 2;

    const print = new Print({
      userId,
      pages: page,
      amount,
      date: new Date(),
      pageByUser,
    });

    await print.save();

    user.totalPrint += page;
    user.totalPrintFee += amount;
    user.netBalance -= amount;
    await user.save();

    return res.status(201).json({ message: "Print added successfully", print });
  } catch (error) {
    console.error("Error in addPrint controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update print (admin only)
export const updatePrint = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const printId = req.params.id;
    const { pages, pageByUser } = req.body;

    const print = await Print.findById(printId);
    if (!print) {
      return res.status(404).json({ message: "Print not found" });
    }

    const amount = pageByUser ? pages * 1 : pages * 2;

    print.pages = pages;
    print.amount = amount;
    print.pageByUser = pageByUser;
    await print.save();

    return res
      .status(200)
      .json({ message: "Print updated successfully", print });
  } catch (error) {
    console.error("Error in updatePrint controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete print (admin only)
export const deletePrint = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const printId = req.params.id;

    const print = await Print.findById(printId);
    const user = await User.findById(print.userId);
    const { pages, amount } = print;
    if (!print) {
      return res.status(404).json({ message: "Print not found" });
    }

    await Print.findByIdAndDelete(req.params.id);

    user.totalPrint -= pages;
    user.totalPrintFee -= amount;
    user.netBalance += amount;
    await user.save();

    return res.status(200).json({ message: "Print deleted successfully" });
  } catch (error) {
    console.error("Error in deletePrint controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get print statistics (admin only)
export const printStats = async (req, res) => {
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

    const stats = await Print.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalPages: { $sum: "$pages" },
          totalAmount: { $sum: "$amount" },
          averagePages: { $avg: "$pages" },
          count: { $sum: 1 },
        },
      },
    ]);

    return res
      .status(200)
      .json(
        stats[0] || { totalPages: 0, totalAmount: 0, averagePages: 0, count: 0 }
      );
  } catch (error) {
    console.error("Error in printStats controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
