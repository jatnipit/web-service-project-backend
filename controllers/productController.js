import database from "../services/database.js";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "img_product");
  },
  filename: function (req, file, cb) {
    const productId = req.body.id;
    const extension = path.extname(file.originalname);
    cb(null, `${productId}${extension}`);
  },
});

const upload = multer({ storage: storage }).single("image");
// const upload = multer({ dest: "img_product" }).single("image");

export async function addProduct(req, res) {
  console.log(`addMainProduct called`);
  console.log(req.body);
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.log("Multer error: ", err.message);
      return res.status(500).json({ error: err.message });
    } else if (err) {
      console.log("File upload error: ", err.message);
      return res.status(500).json({ error: err.message });
    }
    const { id, name, price, quantity, description } = req.body;
    try {
      if (!id || !name || !price || !quantity || !req.file) {
        return res.status(422).json({
          error:
            "All fields (id, name, price, quantity, and image) are required",
        });
      }

      const existsResult = await database.query({
        text: `SELECT * FROM "MainProducts" WHERE id = $1`,
        values: [id],
      });

      if (existsResult.rows.length != 0) {
        return res.status(422).json({ error: "id already exists" });
      }

      const result = await database.query({
        text: `INSERT INTO "MainProducts" (id, name, price, quantity, description, image) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`,
        values: [id, name, price, quantity, description, req.file.filename],
      });
      console.log("Product added:", result.rows[0]);
      return res
        .status(201)
        .json({ msg: "Product added successfully", product: result.rows[0] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
}

export async function showProducts(req, res) {
  console.log(`showProducts called`);
  try {
    const result = await database.query(
      `
        SELECT *
        FROM "MainProducts"
        ORDER BY id DESC;
      `
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function searchProduct(req, res) {
  console.log(`searchProduct called`);
  try {
    const result = await database.query(
      `
        SELECT *
        FROM "MainProducts"
        WHERE (
          name ILIKE $1 OR
          id ILIKE $1
        )
        ORDER BY id DESC;
      `,
      [`%${req.params.id}%`]
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateProduct(req, res) {
  const bodyData = req.body;
  console.log(`updateMainProduct id:${req.params.id} called`);

  const result = await database.query({
    text: `
    UPDATE "MainProducts" 
    SET name=$1, 
        price=$2, 
        quantity=$3,
        description=$4
    WHERE id=$5`,
    values: [
      bodyData.name,
      bodyData.price,
      bodyData.quantity,
      bodyData.description,
      req.params.id,
    ],
  });
  const createdTime = new Date();
  bodyData.createTime = createdTime.toISOString();
  res.status(201).json(bodyData);
}

export async function deleteProduct(req, res) {
  console.log(`deleteMainProduct id:${req.params.id} called`);
  try {
    const result = await database.query({
      text: `DELETE FROM "MainProducts" WHERE id=$1`,
      values: [req.params.id],
    });
    res.status(204).end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function showProductById(req, res) {
  console.log(`showProductById id:${req.params.id} called`);
  try {
    const result = await database.query({
      text: `
        SELECT *
        FROM "MainProducts"
        WHERE id = $1
      `,
      values: [req.params.id],
    });
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
