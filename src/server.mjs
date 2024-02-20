import express from "express";
import cors from "cors";
import config from "./config/index.mjs";
import db from "./config/db.mjs";
import userRouter from "./api/user.mjs";
import coursesRouter from "./api/courses.mjs";
import categoriesRouter from "./api/categories.mjs";
import Stripe from "stripe";
import { checkIfAuthenticated } from "./middlewares/authMiddleware.mjs";

const stripe = new Stripe(
  "sk_test_51LqrMSFWwK1Md247hhoW2WFX8Fo4lLOlK8BcfAy0WDnjPmd6CZQXgplWvrKZYmtucd2ZoYYh3zKw1a4YOXCcpByn00YGLHlS03"
);

const app = express();

db(config.MONGO_URI, app);

app.use(cors({ origin: true }));
// app.use(express.json());

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

app.listen(config.PORT, () =>
  console.log(`App listening on PORT ${config.PORT}`)
);
