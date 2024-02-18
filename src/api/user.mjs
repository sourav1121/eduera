import express from "express";

import firebaseAdmin from "../services/firebase.mjs";

import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { checkIfAuthenticated } from "../middlewares/authMiddleware.mjs";

const router = express.Router();

router.get("/", checkIfAuthenticated, async (req, res) => {
  res.status(200).json({ message: "okay" });
});

router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;
  console.log(req.body);

  if (!email || !password) {
    return res.status(400).json({
      error: "Invalid request body. Must contain email and password for user.",
    });
  }

  try {
    const newFirebaseUser = await firebaseAdmin.auth.createUser({
      email,
      password,
    });

    if (newFirebaseUser) {
      const userCollection = req.app.locals.db.collection("user");
      await userCollection.insertOne({
        email,
        firebaseId: newFirebaseUser.uid,
        role,
        permissions: role === "student" ? "enrollInCourse" : "createCourse",
        enrollments: [],
      });
    }
    return res
      .status(200)
      .json({ success: "Account created successfully. Please sign in." });
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      return res
        .status(400)
        .json({ error: "User account already exists at email address." });
    }
    return res.status(500).json({ error: "Server error. Please try again" });
  }
});

export default router;
