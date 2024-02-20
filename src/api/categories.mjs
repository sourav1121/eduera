import express from "express";

import { BSON, ObjectId } from "mongodb";

const router = express.Router();

router.get("/", async (req, res) => {
  const categories = req.app.locals.db?.collection("categories");
  if (categories) {
    const data = await categories
      .find({}, { projection: { courses: 0 } })
      .toArray();
    res.status(200).send(data);
  }
});

export default router;
