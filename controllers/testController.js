import database from "../services/database.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";

const SECRET = "secret";
const maxAge = 60 * 60; // 1h

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const checkEmail = await database.query({
      text: `SELECT id, password FROM "Users" WHERE email = $1 OR "userName" = $1`,
      values: [email],
    });

    if (checkEmail.rows.length === 0) {
      return res.status(404).json({ loginMessage: "User not found." });
    }

    const { id, password: hashedPassword } = checkEmail.rows[0];

    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      return res.status(404).json({ loginMessage: "Invalid password" });
    }

    const result = await database.query({
      text: `
            SELECT * FROM "Users"
            WHERE id=$1;
            `,
      values: [id],
    });

    const user = result.rows[0];

    const token = jwt.sign(user, SECRET, {
      expiresIn: maxAge,
    });

    return res.json({ loginMessage: "Login successful.", user, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ loginMessage: "Login failed.", error });
  }
};

export const register = async (req, res) => {
  try {
    const { userName, firstName, lastName, email, password, phone } = req.body;

    let newId;
    let existsResult;

    const checkEmail = await database.query({
      text: `SELECT * FROM "Users" WHERE email = $1 OR "userName" = $1`,
      values: [email],
    });

    if (checkEmail.rows.length > 0) {
      return res.status(404).json({ loginMessage: "User already exists." });
    }

    do {
      newId = uuid();
      existsResult = await database.query({
        text: `SELECT * FROM "Users" WHERE id = $1`,
        values: [newId],
      });
    } while (existsResult.rows.length > 0);

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await database.query({
      text: `
            INSERT INTO "Users" (id, "userName", "firstName", "lastName", email, password, phone)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
            `,
      values: [
        newId,
        userName,
        firstName,
        lastName,
        email,
        hashedPassword,
        phone,
      ],
    });

    console.log(result.rows[0]);

    const user = result.rows[0];
    const token = jwt.sign(user, SECRET, { expiresIn: maxAge });

    return res.json({
      loginMessage: "Registration successful.",
      user,
      token,
    });
  } catch (error) {
    console.log("error", error);
  }
};

export const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    let authToken = "";

    if (authHeader) {
      authToken = authHeader.split(" ")[1];
    }

    const decoded = jwt.verify(authToken, SECRET);

    return res.json({ user: decoded });
  } catch (error) {
    console.log("error", error);
    res
      .status(500)
      .json({ loginMessage: "Invalid token, authorization failed.", error });
  }
};

export const getUsers = async (req, res) => {
  try {
    const result = await database.query({
      text: `SELECT * FROM "Users"`,
    });

    return res.json({ users: result.rows });
  } catch (error) {
    console.log(error);
    res.status(500).json({ loginMessage: "Login failed.", error });
  }
};
