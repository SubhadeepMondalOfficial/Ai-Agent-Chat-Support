import { inngest } from "../inngest/client.js";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  const { email, password, skills = [] } = req.body;
  try {
    //check is email already exist
    const user = await User.findOne({ email });
    if (user) {
      return res
        .status(401)
        .json({ error: "Sign-up failed! Email already exist" });
    }

    //process to add new email(user) in DB
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      password: hashedPassword,
      skills,
    });

    //Now Fire inngest event
    await inngest.send({
      name: "user/signup",
      data: { email },
    });

    //create jwt token
    const token = jwt.sign(
      { _id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET
    );

    res.json({ newUser, token });
  } catch (error) {
    res.status(500).json({ error: "Sign-up failed!", ErrorMsg: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    //check is the user exist in db
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Email not found in DB" });
    }

    //now validate password
    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword) {
      return res.status(500).json({ error: "Wrong Password!" });
    }

    //if all credentials correct then create jwt token
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: "Login failed!", ErrorMsg: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(" ")[1]; //splitting because 1st part is Bearer and 2nd part is token value

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // In real-world, you'd handle token blacklisting or set cookie expiration here
    return res.json({ message: "Logout Successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Logout failed!", ErrorMsg: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { email, role, skills = [] } = req.body;
  try {
    //update can only perform by admin
    if (req.user?.role !== "admin") {
      return res.status(401).json({ error: "Failed! Only admin can update user" });
    }

    //if user not found in DB
    const userDetails = await User.findOne({ email });
    if (!userDetails) {
      return res.status(404).json({ error: "Failed! User email not found in DB" });
    }

    //if user found in DB
    await User.updateOne(
      { email },
      { skills: skills.length ? skills : userDetails.skills, role }
    );

    return res.json({message: "User Details Updated Successfully."})

  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to Update User!", ErrorMsg: error.message });
  }
};

export const getAllUser = async (req, res) => {
  try {
    //only admin can see all registered user
    if(req.user.role !== "admin"){
      res.status(401).json({ error: "Failed! Only admin can see all registered users" });
    }

    const allUsers = await User.find().select("-password")
    return res.json(allUsers);
    
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to get all Users!", ErrorMsg: error.message });
  }
}