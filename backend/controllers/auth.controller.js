import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";
import upload from "../utils/uploadImage.js";
import deleteImg from "../utils/deleteImage.js";
import Session from "../models/session.model.js";
import Credit from "../models/credit.model.js";
import Print from "../models/print.model.js";
import { exec } from "child_process";
import sudo from "sudo-prompt";
import os from 'os';
import { endSession, startSession } from "./session.controller.js";
import Lab from "../models/lab.model.js";

// Signup Controller (with admin option)
export const signup = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const {
      admissionNumber,
      name,
      class: className,
      password,
      image,
    } = req.body;

    // Validate required fields
    if (!admissionNumber || !name || !className || !password) {
      return res
        .status(400)
        .json({ error: "Please fill all the required fields" });
    }

    // Check if username or admissionNumber already exists
    const existingUser = await User.findOne({ admissionNumber });
    if (existingUser)
      return res.status(400).json({ message: "Username is already taken" });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const user = new User({
      admissionNumber,
      name,
      class: className,
      password: hashedPassword,
      role: "user",
      imageUrl: image ? image: null,
    });

    await user.save();

    return res.status(201).json({
      message: "User created successfully",
      id: user._id,
      admissionNumber: user.admissionNumber,
      name: user.name,
      class: user.class,
      role: user.role,
    });
  } catch (error) {
    console.error("Error in signup controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateUser = async (req, res) => {
  
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Find the user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.name) {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Please fill all the required fields" });
      }
      user.name = name;
    } else if (req.body.class) {
      const { class: className } = req.body;
      if (!className) {
        return res.status(400).json({ error: "Please fill all the required fields" });
      }
      user.class = className;
    } else if (req.body.imageUrl !== undefined) {
      // Handle the case when imageUrl is null to remove the image
      user.imageUrl = req.body.imageUrl || null;
    } else if (req.body.password) {
      const { password, oldPassword } = req.body;
      if (!password || !oldPassword) {
        return res.status(400).json({ error: "Please fill all the required fields" });
      }
      if (!(await bcrypt.compare(oldPassword, user.password))) {
        return res.status(400).json({ error: "Invalid old password" });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user.password = hashedPassword;
    }

    // Save the user if any changes were made
    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      user: {
        _id: user._id,
        admissionNumber: user.admissionNumber,
        name: user.name,
        class: user.class,
        role: user.role,
        imageUrl: user.imageUrl,
        totalUsage: user.totalUsage,
        totalUsageFee: user.totalUsageFee,
        creditBalance: user.creditBalance,
        lastLoginAt: user.lastLoginAt,
        lastLoginLab: user.lastLoginLab,
      },
    });
  } catch (error) {
    console.error("Error in updateUser controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


// Login Controller (Handles both User and Admin)
export const login = async (req, res) => {
  try {
    const { admissionNumber, password, purpose, labId, online } = req.body;

    // Validate required fields
    if (!admissionNumber || !password) {
      return res.status(400).json({ error: "Please fill all the required fields" });
    }

    // Find the user
    const user = await User.findOne({ admissionNumber });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if there are any active sessions for the user
    const activeSession = await Session.findOne({
      userId: user._id,
      endTime: null,
    });
    if (activeSession) {
      return res.status(403).json({ message: "User has an active session already." });
    }

    if (user.role === "user") {
      const activeLab = await Lab.findOne({ name: labId, status: true });
    if (activeLab) {
      return res.status(403).json({ message: "Lab is already active." });
    }
    }

    // Check password validity
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Determine the network command based on the OS
    const platform = os.platform();
    let command;

    if (!online) {
      
      if (user.role !== "user") {
        return res.status(403).json({ message: "Not authorized" });
      }
  
      const existingSession = await Session.findOne({
        userId: user._id,
        endTime: null,
      });
  
      if (existingSession) {
        return res.status(400).json({ message: "Active session already exists" });
      }
  
      const session = new Session({
        userId: user._id,
        labId,
        admissionNumber: user.admissionNumber,
        purpose,
        online,
        startTime: new Date(),
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
    }

    if (platform === 'win32') {
      command = online
        ? `netsh interface set interface "Ethernet" enable`
        : `netsh interface set interface "Ethernet" disable`;
    } else if (platform === 'darwin') {
      command = online
        ? 'networksetup -setnetworkserviceenabled Ethernet on'
        : 'networksetup -setnetworkserviceenabled Ethernet off';
    } else if (platform === 'linux') {
      command = online
        ? 'nmcli device connect eth0'
        : 'nmcli device disconnect eth0';
    } else {
      console.error(`Unsupported platform: ${platform}`);
      return res.status(500).json({ success: false, error: "Unsupported platform" });
    }

    // Execute the network command with sudo privileges
    sudo.exec(command, { name: "Lab Management Software" }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error setting network: ${stderr || error.message}`);
        return res.status(500).json({ success: false, error: error.message });
      }

      // Generate JWT token and set it in cookies
      const token = generateTokenAndSetCookie(
        user._id,
        user.admissionNumber,
        user.role,
        res
      );

      // Return response with user details
      return res.status(200).json({
        token,
        message: "Login successful",
        user: {
          id: user._id,
          admissionNumber: user.admissionNumber,
          name: user.name,
          class: user.class,
          role: user.role,
        },
        session: {
          purpose,
          labId,
          online,
          user: {
            id: user._id,
            admissionNumber: user.admissionNumber,
            name: user.name,
            class: user.class,
          },
        },
      });
    });
  } catch (error) {
    console.error("Error in login controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Edit User Controller (Admin only)
export const editUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const {
      admissionNumber,
      name,
      class: className,
      password,
      imageUrl,
    } = req.body;

    // Validate required fields
    if (!admissionNumber || !name || !className || !imageUrl || !password) {
      return res
        .status(400)
        .json({ error: "Please fill all the required fields" });
    }

    // Find the user
    const user = await User.findOne({ admissionNumber });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user
    user.name = name;
    user.class = className;
    user.imageUrl = imageUrl;
    user.password = password;
    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      id: user._id,
      admissionNumber: user.admissionNumber,
      name: user.name,
      password: user.password,
      class: user.class,
    });
  } catch (error) {
    console.error("Error in editUser controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete User Controller (Admin only)
export const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Find and delete the user
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete all related credits
    await Credit.deleteMany({ userId: req.params.id });

    // Delete all related sessions
    await Session.deleteMany({ userId: req.params.id });

    // Delete all related prints
    await Print.deleteMany({ userId: req.params.id });

    return res
      .status(200)
      .json({ message: "User and related records deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUser controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get User Controller (Admin only)
export const getUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { admissionNumber } = req.params;

    // Validate required fields
    if (!admissionNumber) {
      return res
        .status(400)
        .json({ error: "Please fill all the required fields" });
    }

    // Find the user
    const user = await User.findOne({ admissionNumber });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        admissionNumber: user.admissionNumber,
        name: user.name,
        class: user.class,
        role: user.role,
        imageUrl: user.imageUrl,
        totalUsage: user.totalUsage,
        totalUsageFee: user.totalUsageFee,
        creditBalance: user.creditBalance,
        lastLoginAt: user.lastLoginAt,
        lastLoginLab: user.lastLoginLab,
      },
    });
  } catch (error) {
    console.error("Error in getUser controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get all Users Controller (Admin only)
export const users = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const users = await User.find({ role: "user" })
      .select("-password")
      .sort("admissionNumber");
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error in users controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const image = req.file;

    const result = await upload(image);

    const imageUrl = result.secure_url;
    const publicId = result.public_id;

    return res
      .status(201)
      .json({ message: " Success ", image: imageUrl, public_id: publicId });
  } catch (error) {
    console.error("Error in uploadImage controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteImage = async (req, res) => {
  const { public_id } = req.body;

  try {
    if (!public_id) {
      return res.status(400).json({ message: "No public ID provided" });
    }

    const result = await deleteImg(public_id);

    const message = result.success ? result.message : result.error.message;
    const status = result.success ? 200 : 400;

    return res.status(status).json({ message: message });
  } catch (error) {
    console.error("Error in deleteImage controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Logout Controller (Handles both User and Admin)
export const logout = async (req, res) => {
  try {
    const { userData } = req.body;
    // Determine the network command based on the OS
    const platform = os.platform();
    let command;

    if (platform === 'win32') {
      command = `netsh interface set interface "Ethernet" enable`;
    } else if (platform === 'darwin') {
      command = 'networksetup -setnetworkserviceenabled Ethernet on';
    } else if (platform === 'linux') {
      command = 'nmcli device connect eth0';
    } else {
      console.error(`Unsupported platform: ${platform}`);
      return res.status(500).json({ success: false, error: "Unsupported platform" });
    }

    // Execute the network command with sudo privileges
    sudo.exec(command, { name: "Lab Management Software" }, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error setting network: ${stderr || error.message}`);
        return res.status(500).json({ success: false, error: error.message });
      }

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

      // Clear the JWT cookie
      res.clearCookie('jwt');
      return res.status(200).json({ message: 'Logout successful' });
    });
  } catch (error) {
    console.error("Error in logout controller", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};