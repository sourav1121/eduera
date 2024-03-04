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

router.get("/category/:categoryId", async (req, res) => {
  const courses = req.app.locals.db?.collection("courses");
  let catId = req.params.categoryId;
  catId = new BSON.ObjectId(catId);
  if (courses) {
    const data = await courses.find({ category_id: catId }).toArray();
    res.status(200).send(data);
  }
});

router.get("/:courseid", async (req, res) => {
  try {
    const courses = req.app.locals.db?.collection("courses");
    let crsid = req.params.courseid;
    if (crsid) {
      crsid = new BSON.ObjectId(crsid);
    }
    if (courses) {
      const data = await courses.findOne({
        _id: crsid,
      });
      if (data) {
        res.status(200).send(data);
      } else {
        res.status(404).send({ message: "Course not found" });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server error" });
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
    const data = await courses.findOne(
      {
        category_id: catid,
        _id: crsid,
      },
      { course_materials: { $slice: 1 } }
    );
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
      const data = await courses.findOne(
        {
          category_id: catid,
          _id: crsid,
        },
        { projection: { course_materials: 1, title: 1, description: 1 } }
      );
      res.status(200).send(data);
    }
  }
);

router.post("/", async (req, res) => {
  const courses = req.app.locals.db?.collection("courses");
  const categories = req.app.locals.db?.collection("categories");

  try {
    let course = req.body;

    const userCollection = req.app.locals.db.collection("user");
    const user = await userCollection.findOne({
      firebaseId: course.instructor_id,
    });
    if (!user.permissions.includes("createCourse")) {
      return res
        .status(403)
        .json({ message: "You do not have permission to create courses." });
    }

    // Convert category_id to ObjectId
    course.category_id = new ObjectId(course.category_id);

    // Insert the course
    const result = await courses.insertOne(course);

    // Fetch the category
    const category = await categories.findOne({ _id: course.category_id });

    // Add the course _id to the category's courses array
    if (category) {
      category.courses = category.courses || [];
      category.courses.push(result.insertedId);
      await categories.updateOne(
        { _id: category._id },
        { $set: { courses: category.courses } }
      );
    }

    res.status(201).json({ message: "Course created successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while creating the course" });
  }
});

router.put("/:id", async (req, res) => {
  const courses = req.app.locals.db?.collection("courses");

  try {
    let updatedCourse = req.body;

    let { _id, ...courseWithoutId } = updatedCourse;
    _id = new ObjectId(_id);
    const result = await courses.updateOne({ _id }, { $set: courseWithoutId });

    if (result.matchedCount > 0) {
      res.status(200).json({ message: "Course updated successfully" });
    } else {
      res.status(404).json({ message: "Course not found" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the course" });
  }
});

router.delete("/:id", async (req, res) => {
  const courses = req.app.locals.db?.collection("courses");
  const users = req.app.locals.db?.collection("user");

  // You would need the userId of the specific user
  const userId = req.body.userId;

  try {
    // Convert _id to ObjectId
    const _id = new ObjectId(req.params.id);

    // Delete the course
    const result = await courses.deleteOne({ _id });

    if (result.deletedCount > 0) {
      // Remove the course from the enrollments array of the specific user
      await users.updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { enrollments: _id } }
      );

      res.status(200).json({ message: "Course deleted successfully" });
    } else {
      res.status(404).json({ message: "Course not found" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the course" });
  }
});

export default router;
