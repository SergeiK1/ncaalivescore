require("dotenv").config();
const express = require("express");
const cors = require("cors");

const scoreRoutes = require("./routes/scores");
const schoolRoutes = require("./routes/schools");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use("/api/scores", scoreRoutes);
app.use("/api/schools", schoolRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
