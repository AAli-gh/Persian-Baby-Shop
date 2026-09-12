import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function reserveOne(client, productId) {
  return client.query(
    `UPDATE products
     SET stock = stock - 1, updated_at = NOW()
     WHERE id = $1 AND stock >= 1
     RETURNING id, stock`,
    [productId],
  );
}

async function cancelReservedOrder(client, orderId) {
  await client.query("BEGIN");
  try {
    const current = await client.query(
      "SELECT inventory_reserved FROM orders WHERE id = $1 FOR UPDATE",
      [orderId],
    );
    if (current.rows[0]?.inventory_reserved) {
      const items = await client.query(
        "SELECT product_id, quantity FROM order_items WHERE order_id = $1",
        [orderId],
      );
      for (const item of items.rows) {
        await client.query(
          "UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2",
          [item.quantity, item.product_id],
        );
      }
      await client.query(
        "UPDATE orders SET status = 'cancelled', inventory_reserved = false, updated_at = NOW() WHERE id = $1",
        [orderId],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

const admin = await pool.connect();
let productId;
let originalStock;
let orderId;
const orderNumber = `inventory-test-${randomUUID()}`;

try {
  const product = await admin.query(
    "SELECT id, stock FROM products WHERE stock > 0 ORDER BY id LIMIT 1",
  );
  assert.ok(product.rows[0], "the development database needs one in-stock product");
  productId = product.rows[0].id;
  originalStock = product.rows[0].stock;

  await admin.query("UPDATE products SET stock = 1 WHERE id = $1", [productId]);

  const first = await pool.connect();
  const second = await pool.connect();
  try {
    await Promise.all([first.query("BEGIN"), second.query("BEGIN")]);
    const [left, right] = await Promise.all([
      reserveOne(first, productId),
      reserveOne(second, productId),
    ]);
    await Promise.all([first.query("COMMIT"), second.query("COMMIT")]);

    assert.equal(
      Number(left.rowCount) + Number(right.rowCount),
      1,
      "exactly one concurrent reservation must succeed",
    );
    const afterRace = await admin.query(
      "SELECT stock FROM products WHERE id = $1",
      [productId],
    );
    assert.equal(Number(afterRace.rows[0].stock), 0, "stock must not become negative");

    const order = await admin.query(
      `INSERT INTO orders
        (order_number, status, inventory_reserved, subtotal, shipping_cost, discount, total,
         address_snapshot, shipping_method, customer_name, customer_phone)
       VALUES ($1, 'pending', true, 100, 0, 0, 100, '{}', 'standard', 'Inventory Test', '00000000000')
       RETURNING id`,
      [orderNumber],
    );
    orderId = order.rows[0].id;
    await admin.query(
      `INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
       VALUES ($1, $2, 'Inventory Test Product', 1, 100)`,
      [orderId, productId],
    );

    await cancelReservedOrder(admin, orderId);
    await cancelReservedOrder(admin, orderId);
    const afterCancellation = await admin.query(
      "SELECT stock FROM products WHERE id = $1",
      [productId],
    );
    assert.equal(
      Number(afterCancellation.rows[0].stock),
      1,
      "cancellation must restore a reservation only once",
    );
  } finally {
    first.release();
    second.release();
  }

  console.log("inventory concurrency checks passed");
} finally {
  if (orderId) {
    await admin.query("DELETE FROM order_items WHERE order_id = $1", [orderId]);
    await admin.query("DELETE FROM orders WHERE id = $1", [orderId]);
  }
  if (productId !== undefined) {
    await admin.query("UPDATE products SET stock = $1 WHERE id = $2", [
      originalStock,
      productId,
    ]);
  }
  admin.release();
  await pool.end();
}