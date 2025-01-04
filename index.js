import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import swaggerUI from "swagger-ui-express";
import yaml from "yaml";
import fs from "fs";
import cookieParser from "cookie-parser";

import database from "./services/database.js";
import productRoute from "./routes/productRoute.js";
import userRoute from "./routes/userRoute.js";
import cartRoute from "./routes/cartRoute.js";
import session from "express-session";

import testRoute from "./routes/testRoute.js";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

// app.use(cookieParser());

app.use("/img_user", express.static("img_user"));
app.use("/img_product", express.static("img_product"));
// app.use("/img_commu", express.static("img_commu"));

const secret = process.env.SECRET;
const backendUrl = process.env.NGROK_URL;

app.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 3600000,
    },
  })
);

app.use(
  cors({
    origin: [
      "http://localhost",
      `https://30e6-158-108-229-150.ngrok-free.app`,
      "http://localhost:5173",
      "http://localhost:8080",
      "http://localhost:8081",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(productRoute);
app.use(userRoute);
app.use(cartRoute);
app.use(testRoute);

// swagger
const swaggerFile = fs.readFileSync("services/swagger.yaml", "utf-8");
const swaggerDoc = yaml.parse(swaggerFile);
// กำหนด path ที่จะให้เรียกหน้า Document ขึ้นมา
app.use("/", swaggerUI.serve, swaggerUI.setup(swaggerDoc));

app.get("/", (req, res) => {
  console.log("GET / requested");
  res.status(200).json({ message: "request success" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
