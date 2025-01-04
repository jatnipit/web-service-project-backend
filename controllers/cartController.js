import database from "../services/database.js";

export async function checkCartSession(req, res) {
  console.log(`check cart session called`);
  const data = {
    id: req.session.cartId,
    quantity: req.session.quantity,
    totalPrice: req.session.totalPrice,
  };

  console.log(data);
  return res.json(data);
}

export async function showCartItem(req, res) {
  console.log(`show cart item called`);
  try {
    const result = await database.query(
      `SELECT * 
            FROM "Carts" LEFT JOIN "CartsItems" 
            ON "CartsItems".cartId = "Carts".id
            WHERE userId = $1
            GROUP BY "Carts".id
            ORDER BY "Carts".id DESC`,
      [req.params.id]
    );
    console.log(result.rows[0]);
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function addItemToCart(req, res) {
  console.log(`add item to cart called`);
  const bodyData = req.body;
  console.log(bodyData);
  try {
    // const { userId, productId, quantity } = req.body;
    // const userId = "03378ab3-82c5-42f3-b42c-9c23739bbb0a";
    const userId = bodyData.userId;
    const productId = bodyData.id;
    const quantity = bodyData.quantity;

    const cart = await database.query({
      text: `SELECT * 
                FROM "Carts"
                WHERE "userId" = $1;`,
      values: [userId],
    });

    let cartId;
    const createdTime = new Date();

    if (cart.rows.length === 0) {
      const newCart = await database.query({
        text: `INSERT INTO "Carts" 
                  ("userId", "createDate") 
                  VALUES ($1, $2) 
                  RETURNING id;`,
        values: [userId, createdTime.toISOString()],
      });
      cartId = newCart.rows[0].id;
    } else {
      cartId = cart.rows[0].id;
    }

    const existingItem = await database.query({
      text: `SELECT * 
                FROM "CartItems" 
                WHERE "cartId" = $1 AND "productId" = $2;`,
      values: [cartId, productId],
    });

    let cartItemId;

    if (existingItem.rows.length === 0) {
      const newItem = await database.query({
        text: `INSERT INTO "CartItems" 
                  ("cartId", "productId", quantity) 
                  VALUES ($1, $2, $3)
                  RETURNING id;`,
        values: [cartId, productId, quantity],
      });
      cartItemId = newItem.rows[0].id;
    } else {
      const updateItem = await database.query({
        text: `UPDATE "CartItems"
                  SET quantity = quantity + $3
                  WHERE "cartId" = $1 AND "productId" = $2
                  RETURNING id;`,
        values: [cartId, productId, quantity],
      });
      cartItemId = updateItem.rows[0].id;
    }

    console.log("Product added to cart successfully.");
    console.log("cartItemId:", cartItemId);

    res.status(201).json({
      msg: "Product added to cart successfully.",
      cartItemId,
    });
  } catch (error) {
    console.log("addItemToCart", error.message);
    res.status(500).json({ msg: "Internal server error." });
  }
}

export async function updateItemInCart(req, res) {
  console.log(`update item in cart id:${req.params.id} called`);
  const bodyData = req.body;
  console.log(bodyData);
  try {
    const result = await database.query(
      `UPDATE "CartItems"
      SET quantity = $1
      WHERE id = $2 AND "productId" = $3`,
      [bodyData.quantity, req.params.id, bodyData.productId]
    );
    console.log(result.rows);
    return res.status(201).json(result.rows);
  } catch (error) {
    console.log("updateItemInCart", error.message);
    res.status(500).json({ msg: "Internal server error." });
  }
}

export async function deleteItemFromCart(req, res) {
  console.log(`delete item from cart id:${req.params.id} called`);
  try {
    const result = await database.query(
      `DELETE FROM "CartItems"
      WHERE id = $1`,
      [req.params.id]
    );
    console.log(result.rows);
    return res.status(204).end();
  } catch (error) {
    console.log("deleteItemFromCart", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
}

export async function showItemInCart(req, res) {
  console.log(`show item in cart id:${req.params.id} called`);
  try {
    const cart = await database.query(
      `SELECT * FROM "Carts" 
      WHERE "userId" = $1`,
      [req.params.id]
    );

    if (cart.rows.length === 0) {
      return res.status(404).json({ message: "Cart not found." });
    }

    const cartItems = await database.query(
      `SELECT * FROM "CartItems" 
        WHERE "cartId" = $1`,
      [cart.rows[0].id]
    );

    if (cartItems.rows.length === 0)
      return res.status(404).json({ message: "Cart not found." });
    // console.log(cartItems.rows);

    const products = await database.query(
      `SELECT "CartItems".id AS "cartItemId", 
      "CartItems"."cartId", 
      "CartItems".quantity, 
      "CartItems"."productId", 
      "MainProducts".name, 
      "MainProducts".price, 
      "MainProducts".description, 
      "MainProducts".image
      FROM "CartItems" 
      LEFT JOIN "MainProducts" 
      ON "CartItems"."productId" = "MainProducts".id
      WHERE "cartId" = $1
      `,
      [cart.rows[0].id]
    );

    // console.log(products.rows);

    return res.status(200).json({ cartItems: products.rows });
  } catch (error) {
    console.log("showItemInCart", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
}

export async function orderCheckout(req, res) {
  console.log(`order checkout called`);
  console.log(req.body);
  try {
    if (
      !req.body.userId ||
      !req.body.totalPrice ||
      !req.body.address ||
      !req.body.firstName ||
      !req.body.lastName ||
      !req.body.country ||
      !req.body.email ||
      !req.body.zip
    )
      return res.status(400).json({ message: "Invalid request." });

    const orderDetails = await database.query(
      `INSERT INTO "OrderDetails" 
      ("userId","total", "firstName", "lastName", 
      "address", "country", "zip", "email")
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        req.body.userId,
        req.body.totalPrice,
        req.body.firstName,
        req.body.lastName,
        req.body.address,
        req.body.country,
        req.body.zip,
        req.body.email,
      ]
    );

    if (orderDetails.rows.length === 0)
      return res.status(500).json({ message: "Order not found." });

    const orderId = orderDetails.rows[0].id;

    console.log("c");
    const cartItems = await database.query({
      text: `
            SELECT "productId", quantity
            FROM "CartItems"
            WHERE "cartId" = (
              SELECT id
              FROM "Carts"
              WHERE "userId" = $1
            );
            `,
      values: [req.body.userId],
    });

    if (cartItems.rows.length === 0) {
      return res.status(500).json({ msg: "Internal server error." });
    }

    console.log("s");
    cartItems.rows.forEach(async (item) => {
      const { productId, quantity } = item;
      const result = await database.query({
        text: `INSERT INTO "OrderItems"
              ("orderId", "productId", quantity)
              VALUES ($1, $2, $3)
              RETURNING *;`,
        values: [orderId, productId, quantity],
      });
      console.log(result.rows[0]);
    });

    console.log("d");
    await database.query({
      text: `
            DELETE FROM "CartItems"
            WHERE "cartId" = (
              SELECT id
              FROM "Carts"
              WHERE "userId" = $1
            );
            `,
      values: [req.body.userId],
    });

    console.log("o");
    const order = await database.query({
      text: `
            SELECT *
            FROM "OrderDetails"
            WHERE id = $1;
            `,
      values: [orderId],
    });

    console.log("oi");
    const orderItems = await database.query({
      text: `
            SELECT 
              "OrderItems".id AS "orderItemId", 
              "productId",
              "OrderItems".quantity
            FROM "OrderItems"
            INNER JOIN "MainProducts" ON "OrderItems"."productId" = "MainProducts".id
            WHERE "orderId" = $1;
            `,
      values: [orderId],
    });

    order.rows[0].orderItems = orderItems.rows;
    console.log(order.rows[0]);
    return res
      .status(200)
      .json({ message: "Order placed successfully", order: order.rows[0] });
  } catch (err) {
    console.log("orderCheckout", err.message);
    return res.status(500).json({ error: err.message });
  }
}

export async function showOrderHistory(req, res) {
  console.log(`show order history called`);
  try {
    const orderDetails = await database.query({
      text: `
        SELECT * FROM "OrderDetails"
        WHERE "userId" = $1;
      `,
      values: [req.params.id],
    });

    // const orderItems = await database.query({
    //   text: `
    //     SELECT "orderId", id AS "orderItemId", "productId", quantity
    //     FROM "OrderItems"
    //     GROUP BY "orderId", id, "productId", quantity;
    //     `,
    // });

    // const orderItems = await database.query({
    //   text: `
    //     SELECT
    //       "orderId",
    //       json_agg(
    //       json_build_object(
    //         'orderItemId', "id",
    //           'productId', "productId", 'quantity', "quantity"
    //       )
    //     ) AS orderItems
    //     FROM "OrderItems"
    //     GROUP BY "orderId";
    //     `,
    // });

    const orderItems = await database.query({
      text: `
      SELECT od."id" AS "orderId",
       od."userId",
       od."address",
       od."total",
       od."country",
       od."zip",
       json_agg(
         json_build_object(
           'orderItemId', oi."id",
           'productId', oi."productId",
           'name', mp."name",
           'price', mp."price",
           'quantity', oi."quantity"
         )
       ) AS "orderItems"
      FROM "OrderDetails" od
      JOIN "OrderItems" oi ON od."id" = oi."orderId"
      JOIN "MainProducts" mp ON oi."productId" = mp."id"
      WHERE od."userId" = $1
      GROUP BY od."id", od."userId", od."address", od."total", od."country", od."zip";

      `,
      values: [req.params.id],
    });

    // const result2 = await database.query(
    //   `SELECT
    // "OrderItems"."orderId",
    // "OrderItems".id AS "orderItemId",
    // "MainProducts".name,
    // "MainProducts".image,
    // "OrderItems".quantity,
    // "OrderDetails".total,
    // "OrderDetails".address,
    // "OrderDetails".country,
    // "OrderDetails".zip
    // FROM "OrderItems"
    // INNER JOIN "OrderDetails" ON "OrderItems"."orderId" = "OrderDetails".id
    // INNER JOIN "MainProducts" ON "OrderItems"."productId" = "MainProducts".id
    // WHERE ($1::uuid IS NULL OR "OrderDetails"."userId" = $1::uuid)
    // GROUP BY
    // "OrderItems"."orderId",
    // "OrderItems".id,
    // "MainProducts".name,
    // "MainProducts".image,
    // "OrderItems".quantity,
    // "OrderDetails".total,
    // "OrderDetails".address,
    // "OrderDetails".country,
    // "OrderDetails".zip
    // ORDER BY "OrderItems"."orderId"`,
    //   [req.params.id]
    // )
    // return res.status(200).json(result2.rows);
    // return res.status(200).json(orderDetails.rows);
    return res.status(200).json({
      orders: orderItems.rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
