import database from "../services/database.js";
import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";

export async function register(req, res) {
  console.log("register called");
  const bodyData = req.body;
  try {
    if (
      bodyData.firstName == null ||
      bodyData.lastName == null ||
      bodyData.password == null ||
      bodyData.phone == null ||
      bodyData.userName == null ||
      bodyData.email == null
    ) {
      console.log("failed1");
      return res.json({ registerMessage: "fail" });
    }

    let newId;
    let existsResult;

    do {
      newId = uuid(); // Generate a new unique ID
      existsResult = await database.query({
        text: `SELECT * FROM "Users" WHERE id = $1`,
        values: [newId],
      });
    } while (existsResult.rows.length > 0);

    const hashedPassword = await bcrypt.hash(bodyData.password, 10);
    const result = await database.query({
      text: `INSERT INTO "Users" (
        "id", "firstName", "lastName", password, phone, "userName", email
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      values: [
        newId,
        bodyData.firstName,
        bodyData.lastName,
        hashedPassword,
        bodyData.phone,
        bodyData.userName,
        bodyData.email,
      ],
    });

    console.log("success");
    return res.json({ registerMessage: "success" });
  } catch (err) {
    console.log(err.message);
    return res.json({ registerMessage: "fail" });
  }
}

export async function login(req, res) {
  console.log("login called");
  const bodyData = req.body;

  try {
    if (!bodyData.email || !bodyData.password) {
      console.log("failed1");
      return res.json({ loginMessage: "fail" });
    }

    // Check if user exists by email or username
    const result = await database.query({
      text: `SELECT * FROM "Users" WHERE email = $1 OR "userName" = $1`,
      values: [bodyData.email],
    });

    if (result.rows.length === 0) {
      console.log("failed2");
      return res.json({ loginMessage: "fail" });
    }

    const user = result.rows[0];
    const passwordMatched = await bcrypt.compare(
      bodyData.password,
      user.password
    );

    if (!passwordMatched) {
      return res.json({ loginMessage: "fail" });
    }

    console.log("sessionId: ", req.sessionID);

    // Store user information in session
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      email: user.email,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    };

    console.log("sessionId: ", req.sessionID);
    console.log("sessionUser: ", req.session.user);

    console.log("User logged in successfully");
    return res.json({ loginMessage: "success", user: req.session.user });
  } catch (err) {
    console.error(err.message);
    return res.json({ loginMessage: "fail" });
  }
}

export async function logout(req, res) {
  console.log("logout called");
  try {
    // Clear the authToken cookie by setting it to an empty value and an expired date
    res.cookie("authToken", "", {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      expires: new Date(0), // Set the cookie to expire immediately
    });

    return res.json({ logoutMessage: "success" });
  } catch (err) {
    console.error("Logout error:", err.message);
    return res.json({ logoutMessage: "fail" });
  }
}

export async function getUserSession(req, res) {
  console.log("getUserSession called");
  console.log("sessionId: ", req.sessionID);
  console.log("sessionUser:", req.session.user);
  if (!req.session.userId) {
    return res.json({ msg: "Auth fail" });
    // throw { msg: "Auth fail" };
  }

  return res.json({ user: req.session.user });
}

export async function getAdminSession(req, res) {
  console.log("getAdminSession called");
  if (req.session.admin) return res.json({ admin: req.session.admin });
}

export async function adminLogin(req, res) {
  console.log("loginAdmin called");
  const bodyData = req.body;

  try {
    if (!bodyData.userName || !bodyData.password) {
      console.log("failed1");
      return res.json({ loginMessage: "fail" });
    }

    // Check if admin exists by userName or ID
    const result = await database.query({
      text: `SELECT * FROM "Admins" WHERE "userName" = $1 OR id = $1`,
      values: [bodyData.userName],
    });

    if (result.rows.length === 0) {
      console.log("failed2");
      return res.json({ loginMessage: "fail" });
    }

    const user = result.rows[0];
    const passwordMatched = await bcrypt.compare(
      bodyData.password,
      user.password
    );

    if (!passwordMatched) {
      return res.json({ loginMessage: "fail" });
    }

    // Store admin information in session
    req.session.admin = {
      id: user.id,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    console.log("sessionAdmin: ", req.session.admin);
    console.log("Admin logged in successfully");
    return res.json({ loginMessage: "success", userName: req.session.admin });
  } catch (err) {
    console.log("Error during admin login:", err.message);
    return res.json({ loginMessage: "fail" });
  }
}

export async function adminRegister(req, res) {
  console.log("registerAdmin called");
  const bodyData = req.body;

  try {
    if (
      bodyData.id == null ||
      bodyData.firstName == null ||
      bodyData.lastName == null ||
      bodyData.password == null ||
      bodyData.userName == null
    ) {
      console.log("failed1");
      return res.json({ registerMessage: "fail" });
    }

    const existsResult = await database.query(
      `SELECT * FROM "Users" WHERE email = $1 OR "userName" = $2`,
      [bodyData.email, bodyData.userName]
    );

    if (existsResult.rows.length != 0) {
      console.log("failed2");
      return res.json({ registerMessage: "fail" });
    }

    const hashedPassword = await bcrypt.hash(bodyData.password, 10);
    const result = await database.query({
      text: `INSERT INTO "Admins" (
          id, "userName", "firstName", "lastName", password
          ) VALUES ($1, $2, $3, $4, $5)`,
      values: [
        bodyData.id,
        bodyData.userName,
        bodyData.firstName,
        bodyData.lastName,
        hashedPassword,
      ],
    });

    console.log("success");
    return res.json({ registerMessage: "success" });
  } catch (err) {
    console.log(err.message);
    return res.json({ registerMessage: "fail" });
  }
}

// export async function verifyToken(req, res) {
//   console.log("verifyToken called");
//   const token = req.cookies.authToken;
//   if (!token) {
//     return res.json({ isLoggedIn: false });
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     console.log(decoded);
//     return res.json({ isLoggedIn: true, user: decoded });
//   } catch (err) {
//     return res.json({ isLoggedIn: false });
//   }
// }
