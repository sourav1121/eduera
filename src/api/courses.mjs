import express from "express";
import { checkIfAuthenticated } from "../middlewares/authMiddleware.mjs";
import { BSON, ObjectId } from "mongodb";
const router = express.Router();

router.get("/", async (req, res) => {
  const categories = req.app.locals.db?.collection("courses");
  if (categories) {
    const data = await categories.find({}).toArray();
    res.status(200).send(data);
  }
});

router.get("/:id", async (req, res) => {
  const categories = req.app.locals.db?.collection("courses");
  let id = req.params.id;
  id = new BSON.ObjectId(id);
  if (categories) {
    const data = await categories.find({ _id: id }).toArray();
    res.status(200).send(data);
  }
});

router.get("/:categoryid/:courseid", async (req, res) => {
  const categories = req.app.locals.db?.collection("courses");
  let catid = req.params.categoryid;
  let crsid = req.params.courseid;

  if (catid && crsid) {
    catid = new BSON.ObjectId(catid);
    crsid = new BSON.ObjectId(crsid);
  }
  if (categories) {
    const data = await categories
      .find({
        _id: catid,
        "courses._id": crsid,
      })
      .toArray();
    res.status(200).json(data);
  }
});

export default router;
