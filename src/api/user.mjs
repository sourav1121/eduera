import express from "express";

import firebaseAdmin from "../services/firebase.mjs";

import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { checkIfAuthenticated } from "../middlewares/authMiddleware.mjs";

const router = express.Router();

router.get("/", checkIfAuthenticated, async (req, res) => {
  res.status(200).json({ message: "okay" });
});

router.get("/:userId", async (req, res) => {
  const userCollection = req.app.locals.db.collection("user");
  const user = await userCollection.findOne({ firebaseId: req.params.userId });
  res.send(user);
});

router.get("/:userId/courses", async (req, res) => {
  const userCollection = req.app.locals.db.collection("user");
  const user = await userCollection.findOne({ firebaseId: req.params.userId });
  const courses = req.app.locals.db?.collection("courses");
  if (courses) {
    const data = await courses
      .find({ instructor_id: req.params.userId })
      .toArray();
    res.status(200).send(data);
  }
});

router.post("/register", async (req, res) => {
  const { email, password, state } = req.body;

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

    console.log("New Firebase User:", newFirebaseUser);

    if (newFirebaseUser) {
      const userCollection = req.app.locals.db.collection("user");
      const insertResult = await userCollection.insertOne({
        email,
        firebaseId: newFirebaseUser.uid,
        role: state,
        permissions: state === "student" ? "enrollInCourse" : "createCourse",
        enrollments: [],
      });

      console.log("MongoDB Insert Result:", insertResult);
    }
    return res
      .status(200)
      .json({ success: "Account created successfully. Please sign in." });
  } catch (err) {
    console.error("Error:", err);
    if (err.code === "auth/email-already-exists") {
      return res
        .status(400)
        .json({ error: "User account already exists at email address." });
    }
    return res.status(500).json({ error: "Server error. Please try again" });
  }
});

router.post("/storeProviderUser", async (req, res) => {
  const { email, role, fuid } = req.body;

  if (!email || !role) {
    return res.status(400).json({
      error: "Invalid request body. Must contain email and role for user.",
    });
  }

  try {
    const userCollection = req.app.locals.db.collection("user");
    const user = await userCollection.findOne({ firebaseId: fuid });
    // If the user does not exist in the database, create a new user
    if (!user) {
      const result = await userCollection.insertOne({
        email,
        firebaseId: fuid,
        role,
        permissions: role === "student" ? "enrollInCourse" : "createCourse",
        enrollments: [],
      });
      return res.status(200).json({ success: "success" });
    } else {
      // If the user already exists, do nothing and return a success message
      return res
        .status(200)
        .json({ success: "User already exists in the database" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Server error. Please try again" });
  }
});

export default router;
