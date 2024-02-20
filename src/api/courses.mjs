import express from "express";
import { checkIfAuthenticated } from "../middlewares/authMiddleware.mjs";
import { BSON, ObjectId } from "mongodb";
const router = express.Router();

router.get("/", async (req, res) => {
  const courses = req.app.locals.db?.collection("courses");
  if (courses) {
    const data = await courses
      .find({}, { projection: { course_outline: 0 } })
      .toArray();
    res.status(200).send(data);
  }
});

router.get("/:categoryId", async (req, res) => {
  const courses = req.app.locals.db?.collection("courses");
  let catId = req.params.categoryId;
  catId = new BSON.ObjectId(catId);
  if (courses) {
    const data = await courses.find({ category_id: catId }).toArray();
    res.status(200).send(data);
  }
});

router.get("/:categoryid/:courseid", async (req, res) => {
  const courses = req.app.locals.db?.collection("courses");
  let catid = req.params.categoryid;
  let crsid = req.params.courseid;

  if (catid && crsid) {
    catid = new BSON.ObjectId(catid);
    crsid = new BSON.ObjectId(crsid);
  }
  if (courses) {
    const data = await courses.findOne({
      category_id: catid,
      _id: crsid,
    });
    res.status(200).send(data);
  }
});

router.get(
  "/:categoryid/:courseid/view",
  checkIfAuthenticated,
  async (req, res) => {
    const courses = req.app.locals.db?.collection("courses");
    let catid = req.params.categoryid;
    let crsid = req.params.courseid;

    if (catid && crsid) {
      catid = new BSON.ObjectId(catid);
      crsid = new BSON.ObjectId(crsid);
    }
    if (courses) {
      const data = await courses.findOne({
        category_id: catid,
        _id: crsid,
      });
      res.status(200).send(data);
    }
  }
);

export default router;
