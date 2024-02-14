const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

app.use(cors());

const data = require("./data/fakeData.json");

app.get("/", (req, res) => {
  res.send("API Running");
});

app.get("/courses", (req, res) => {
  res.send(data);
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
