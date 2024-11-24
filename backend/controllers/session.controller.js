import Lab from "../models/lab.model.js";
import Session from "../models/session.model.js";
import User from "../models/user.model.js";
import { roundToTwoDecimals } from "../utils/calculations.js";

// Helper function to check admin role
const isAdmin = (user) => user?.role === "admin";

// Get all sessions (admin only)
export const getSessions = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const sessions = await Session.find().sort("-startTime");
    return res.status(200).json(sessions);
  } catch (error) {
    console.error("Error in getSessions controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get limited sessions (admin only)
export const getLimitedSessions = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { page = 1, limit = 20, search, startDate, endDate } = req.query;
    const query = {};

    if (search) query.admissionNumber = new RegExp(search, "i");
    if (startDate || endDate) {
      query.startTime = {
        ...(startDate && { $gte: new Date(startDate) }),
        ...(endDate && { $lte: new Date(endDate) }),
      };
    }

    const sessions = await Session.find(query)
      .sort("-startTime")
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Session.countDocuments(query);

    return res.status(200).json({
      sessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error in getLimitedSessions controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Start session
export const startSession = async (req, res) => {
  try {

    const { purpose, labId, user } = req.body;

    if (user.role !== "user") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const existingSession = await Session.findOne({
      userId: user.id,
      endTime: null,
    });

    if (existingSession) {
      return res.status(400).json({ message: "Active session already exists" });
    }

    const session = new Session({
      userId: user.id,
      labId,
      admissionNumber: user.admissionNumber,
      purpose,
      online: true,
      startTime: new Date(),
      lastActivityTime: new Date(),
      usageFee: 0,
      duration: 0,
    });

    await session.save();

    await User.findByIdAndUpdate(user.id, {
      lastLoginAt: new Date(),
      lastLoginLab: labId,
    });

    const lab = await Lab.findOne({ name: labId });
    if (!lab) return res.status(404).json({ message: "Lab not found" });

    await Lab.findByIdAndUpdate(lab.id, {
      lastActive: new Date(),
      status: true,
    });

    return res
      .status(201)
      .json({ message: "Session started successfully", session });
  } catch (error) {
    console.error("Error in startSession controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update activity timestamp
export const updateActivity = async (req, res) => {
  try {
    const { userData } = req.body;
    const session = await Session.findOne({
      userId: userData.id,
      endTime: null,
    });

    if (!session) {
      return res.status(404).json({ message: "No active session found" });
    }

    const start = new Date(session.startTime).getTime();
    const now = new Date().getTime();
    const duration = now - start;

    const secFee = Math.floor(duration / 6000) * 0.01;
    const usageFee = parseFloat(secFee.toFixed(2));

    const updateTime = new Date();

    session.lastActivityTime = updateTime;
    session.usageFee = usageFee;
    session.duration = duration;
    await session.save();

    return res.json({ message: "Activity updated" });
  } catch (error) {
    console.error("Error in updateActivity controller", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// End session
export const endSession = async (req, res) => {
  try {
    const { userData } = req.body;
    const session = await Session.findOne({
      userId: userData.id,
      endTime: null,
    });

    if (!session) {
      return res.status(404).json({ message: "No active session found" });
    }

    const endTime = new Date();

    const start = new Date(session.startTime).getTime();
    const now = new Date().getTime();
    const duration = now - start;

    const secFee = Math.floor(duration / 6000) * 0.01;
    const usageFee = parseFloat(secFee.toFixed(2));

    session.endTime = endTime;
    session.duration = duration;
    session.usageFee = usageFee;
    await session.save();

    const user = await User.findById(session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const totalFee = parseFloat((user.totalUsageFee + usageFee).toFixed(2));
    const netBalance = parseFloat((user.netBalance - usageFee).toFixed(2));

    user.totalUsage += duration;
    user.totalUsageFee = totalFee;
    user.netBalance = netBalance;
    await user.save();

    const lab = await Lab.findOne({ name: session.labId });
    if (!lab) return res.status(404).json({ message: "Lab not found" });

    await Lab.findByIdAndUpdate(lab.id, {
      lastActive: new Date(),
      status: false,
    });

    return res.json(session);
  } catch (error) {
    console.error("Error in endSession controller", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Force end session (admin only)
export const forceEndSession = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const session = await Session.findById(req.body.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.endTime)
      return res.status(400).json({ message: "Session already ended" });

    if (!session.online) {
      const endTime = new Date();

      const start = new Date(session.startTime).getTime();
      const now = new Date().getTime();
      const duration = now - start;

      // const secFee = Math.floor(duration / 6000) * 0.01;
      const usageFee = 0;

      session.endTime = endTime;
      session.duration = duration;
      session.usageFee = usageFee;
      await session.save();

      const user = await User.findById(session.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const totalFee = parseFloat((user.totalUsageFee + usageFee).toFixed(2));
      const netBalance = parseFloat((user.netBalance - usageFee).toFixed(2));

      user.totalUsage += duration;
      user.totalUsageFee = totalFee;
      user.netBalance = netBalance;
      await user.save();

      const lab = await Lab.findOne({ name: session.labId });
      if (!lab) return res.status(404).json({ message: "Lab not found" });

      await Lab.findByIdAndUpdate(lab.id, {
        lastActive: new Date(),
        status: false,
      });

      return res.json(session);
    }

    const endTime = session.lastActivityTime || new Date();

    const start = new Date(session.startTime).getTime();
    const end = new Date(endTime).getTime();
    const duration = end - start;

    const secFee = Math.floor(duration / 6000) * 0.01;
    const usageFee = parseFloat(secFee.toFixed(2));

    session.endTime = endTime;
    session.duration = duration;
    session.usageFee = usageFee;
    await session.save();

    const user = await User.findById(session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const totalFee = parseFloat((user.totalUsageFee + usageFee).toFixed(2));
    const netBalance = parseFloat((user.netBalance - usageFee).toFixed(2));

    user.totalUsage += duration;
    user.totalUsageFee = totalFee;
    user.netBalance = netBalance;
    await user.save();

    const lab = await Lab.findOne({ name: session.labId });
    if (!lab) return res.status(404).json({ message: "Lab not found" });

    await Lab.findByIdAndUpdate(lab.id, {
      lastActive: new Date(),
      status: false,
    });

    return res.json(session);
  } catch (error) {
    console.error("Error in forceEndSession controller", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Remove fees for sessions (admin only)
export const removeFee = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const sessionIds = req.body.sessionIds;

    if (!sessionIds || !Array.isArray(sessionIds)) {
      return res.status(400).json({ message: "Invalid session IDs" });
    }

    // Fetch all relevant sessions to update user fees
    const sessions = await Session.find({ _id: { $in: sessionIds } });

    // Update usageFee for selected sessions
    await Session.updateMany(
      { _id: { $in: sessionIds } },
      { $set: { usageFee: 0 } }
    );

    // Decrease each user's totalUsageFee based on the removed session fees
    const userUpdates = sessions.map(async (session) => {
      const user = await User.findById(session.userId);
      user.totalUsageFee = parseFloat(
        (user.totalUsageFee - session.usageFee).toFixed(2)
      );
      await user.save();
    });
    await Promise.all(userUpdates);

    return res.json({ message: "Usage fees removed for selected sessions" });
  } catch (error) {
    console.error("Error in removeFee controller", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const cutFee = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const sessionIds = req.body.sessionIds;

    if (!sessionIds || !Array.isArray(sessionIds)) {
      return res.status(400).json({ message: "Invalid session IDs" });
    }

    // Calculate the total cut amount
    const sessions = await Session.find({ _id: { $in: sessionIds } });

    // Update usageFee for selected sessions
    await Session.updateMany(
      { _id: { $in: sessionIds } },
      { $mul: { usageFee: 0.5 } }
    );

    // Decrease each user's totalUsageFee based on the cut amount
    const userUpdates = sessions.map(async (session) => {
      const user = await User.findById(session.userId);
      user.totalUsageFee = parseFloat(
        (user.totalUsageFee - session.usageFee / 2).toFixed(2)
      );
      await user.save();
    });
    await Promise.all(userUpdates);

    return res.json({ message: "Usage fees cut for selected sessions" });
  } catch (error) {
    console.error("Error in cutFee controller", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get user active session
export const getActiveSession = async (req, res) => {
  try {
    const session = await Session.findOne({
      userId: req.params.userId,
      endTime: null,
    });

    if (!session) {
      return res.status(404).json({ message: "No active session found" });
    }

    return res.status(200).json(session);
  } catch (error) {
    console.error("Error in getActiveSession controller", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all user sessions (paginated)
export const getUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const sessions = await Session.find({ userId })
      .sort("-startTime")
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Session.countDocuments({ userId });

    return res.status(200).json({
      sessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error in getUserSessions controller", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};
