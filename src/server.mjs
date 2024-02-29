import express from "express";
import multer from "multer";
import path from "path";
import cors from "cors";
import config from "./config/index.mjs";
import db from "./config/db.mjs";
import userRouter from "./api/user.mjs";
import coursesRouter from "./api/courses.mjs";
import categoriesRouter from "./api/categories.mjs";
import Stripe from "stripe";
import { checkIfAuthenticated } from "./middlewares/authMiddleware.mjs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
  destination: "public/assets/images/",
  filename: (req, file, cb) => {
    // Use the original file name but ensure it has a .jpg extension
    const filename = path.parse(file.originalname).name;
    const extension = ".jpg";
    cb(null, filename + extension);
  },
});

const upload = multer({ storage: storage });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.static(path.join(__dirname, "..", "public")));

db(config.MONGO_URI, app);

app.use(cors({ origin: true }));
// app.use(express.json());
app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url}`);
  next();
});

app.use("/api/user", express.json(), userRouter);
app.use("/api/courses", express.json(), coursesRouter);
app.use("/api/categories", express.json(), categoriesRouter);

app.post(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Error verifying webhook signature", err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const { userId, courseId } = session.metadata;
        const userCollection = req.app.locals.db.collection("user");
        await userCollection.updateOne(
          { firebaseId: userId },
          { $push: { enrollments: courseId } }
        );
      }
    } catch (err) {
      console.error("Error handling webhook event", err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

app.post(
  "/api/checkout_sessions/",
  express.json(),
  checkIfAuthenticated,
  async (req, res) => {
    const { categoryId, courseId, userId } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Course",
              // Add other course details...
            },
            unit_amount: 2000, // Replace with actual course price
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://localhost:3000/courses/${categoryId}/${courseId}/view`,
      cancel_url: `http://localhost:3000/cancel`,
      metadata: {
        categoryId: categoryId.toString(),
        userId: userId.toString(),
        courseId: courseId.toString(),
      },
    });
    res.json({ id: session.id });
  }
);

app.post("/upload", upload.single("photo"), async (req, res) => {
  console.log("Received file upload request");

  try {
    // The path where multer saves the file
    let photoPath = req.file.path;
    console.log("File saved at:", photoPath);
    // Replace backslashes with forward slashes for URL compatibility
    photoPath = photoPath.replace(/\\/g, "/");
    // Remove the 'public' part of the path for URL compatibility
    photoPath = photoPath.replace("public/", "");
    // Return the path to the client
    res.status(200).json({ path: photoPath });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "An error occurred while uploading the file" });
  }
});

app.get("/test", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "public", "assets", "images", "AWD.jpg")
  );
});

app.listen(config.PORT, () =>
  console.log(`App listening on PORT ${config.PORT}`)
);
