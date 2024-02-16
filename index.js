const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors());
app.use(express.json());

//Database Connection
const uri = 'mongodb+srv://asif2k1998:TH5GbtTFjlcRPZxg@cluster0.dbcz75x.mongodb.net/?retryWrites=true&w=majority';

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

const data = require("./data/fakeData.json");

client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
    db = client.db('myFirstDatabase');
  })
  .catch(err => console.error('Failed to connect to MongoDB', err));

app.get("/", (req, res) => {
  res.send("API Running");
});

app.post("/courses", async (req, res) => {
  try {
    const courses = db.collection('courses');
    const course = req.body;
    console.log(course);
    if (course.id === null) delete course.id;
    if (course.courses.id === null) delete course.courses.id;
    const result = await courses.insertOne(course);
    res.status(201).send(result);
  } catch (err) {
    console.error('Failed to insert course', err);
    res.status(500).send('Failed to insert course');
  }
});

app.get("/courses", async (req, res) => {
  try {
    const courses = db.collection('courses');
    const allCourses = await courses.find().toArray();
    res.status(200).send(allCourses);
  } catch (err) {
    console.error('Failed to get courses', err);
    res.status(500).send('Failed to get courses');
  }
});

app.get("/courses/:categoryId", (req, res) => {
  const categoryId = parseInt(req.params.categoryId);
  const category_data = data.filter((n) => n.id === categoryId);
  res.send(category_data);
});

app.get("/courses/:categoryId/:courseId", (req, res) => {
  const categoryId = parseInt(req.params.categoryId);
  const courseId = parseInt(req.params.courseId);
  const selectedCourse = data.find(
    (n) => n.id === categoryId && n.courses.id === courseId
  );
  res.send(selectedCourse);
});
app.get("/checkout/:categoryId/:courseId", (req, res) => {
  const categoryId = parseInt(req.params.categoryId);
  const courseId = parseInt(req.params.courseId);
  const selectedCourse = data.find(
    (n) => n.id === categoryId && n.courses.id === courseId
  );
  res.send(selectedCourse);
});

app.listen(port, () => {
  console.log("Eduera Server running on port", port);
});
