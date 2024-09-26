import mysql from 'mysql2/promise';
import { parse } from 'url';
import { sign } from 'jsonwebtoken';
import { verify } from 'jsonwebtoken';


const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default async function handler(req, res) {
  const { method } = req;
  const { pathname, query } = parse(req.url, true);

  try {
    switch (method) {
      case 'GET':
        if (pathname === '/api/check-auth') {
          const cookies = parse(req.headers.cookie || '');
          const token = cookies.token;
        
          if (!token) {
            return res.status(200).json({ isAuthenticated: false, usernamePasswordVerified: false });
          }
        
          try {
            verify(token, process.env.JWT_SECRET);
            return res.status(200).json({ isAuthenticated: true, usernamePasswordVerified: true });
          } catch (error) {
            return res.status(200).json({ isAuthenticated: false, usernamePasswordVerified: false });
          }
        } else if (pathname === '/api/products') {
          await handleGetProducts(req, res);
        } else if (pathname === '/api/total-stock') {
          await handleGetTotalStock(req, res);
        } else if (pathname === '/api/sales-report') {
          await handleGetSalesReport(req, res);
        } else if (pathname === '/api/sales-data') {
          await handleGetSalesData(req, res);
        } else if (pathname === '/api/total-products') {
          await handleGetTotalProducts(req, res);
        } else if (pathname === '/api/top-products') {
          await handleGetTopProducts(req, res);
        } else if (pathname === '/api/rated-products-count') {
          await handleGetRatedProductsCount(req, res);
        } else if (pathname === '/api/logout') {
          handleLogout(req, res);
        }
        break;

      case 'POST':
        if (pathname === '/api/signin') {
          await handleSignIn(req, res);
        } else if (pathname === '/api/validate-pin') {
          await handleValidatePin(req, res);
        } else if (pathname === '/api/products') {
          await handleAddProduct(req, res);
        }
        break;

      case 'PUT':
        if (pathname.startsWith('/api/products/')) {
          await handleUpdateProduct(req, res);
        } else if (pathname.startsWith('/api/orders/')) {
          if (pathname.endsWith('/status')) {
            await handleUpdateOrderStatus(req, res);
          } else if (pathname.endsWith('/cancel')) {
            await handleCancelOrder(req, res);
          } else {
            await handleUpdateOrder(req, res);
          }
        }
        break;

      case 'DELETE':
        if (pathname.startsWith('/api/products/')) {
          await handleDeleteProduct(req, res);
        } else if (pathname.startsWith('/api/orders/') && pathname.endsWith('/salesreport')) {
          await handleRemoveOrderFromSalesReport(req, res);
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
}

async function handleGetProducts(req, res) {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const [countResult] = await db.query('SELECT COUNT(*) as total FROM products');
  const totalItems = countResult[0].total;
  const totalPages = Math.ceil(totalItems / limit);

  const [products] = await db.query('SELECT * FROM products LIMIT ? OFFSET ?', [parseInt(limit), offset]);

  res.status(200).json({
    products,
    currentPage: parseInt(page),
    totalPages,
    totalItems
  });
}

async function handleSignIn(req, res) {
  const { username, password } = req.body;
  try {
    const [results] = await db.query('SELECT * FROM admin WHERE username = ? AND password = ?', [username, password]);

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = results[0];
    const token = sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict`);
    res.status(200).json({ success: true, message: 'Signin successful', username: user.username });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ error: 'An error occurred during signin' });
  }
}

async function handleValidatePin(req, res) {
  const { pin } = req.body;
  if (pin === '12345') {
    res.status(200).json({ success: true, message: 'Pin validated successfully' });
  } else {
    res.status(401).json({ error: 'Invalid pin' });
  }
}

async function handleGetTotalStock(req, res) {
  const [result] = await db.query('SELECT SUM(stock_quantity) as totalStock FROM products');
  res.status(200).json({ totalStock: result[0].totalStock });
}

async function handleGetSalesReport(req, res) {
  const [result] = await db.query('SELECT * FROM user_login');
  res.status(200).json(result);
}

async function handleGetSalesData(req, res) {
  const { timeFrame } = req.query;
  let dateCondition;

  switch (timeFrame) {
    case 'today':
      dateCondition = 'DATE(order_date) = CURDATE()';
      break;
    case 'yesterday':
      dateCondition = 'DATE(order_date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
      break;
    case 'lastWeek':
      dateCondition = 'DATE(order_date) BETWEEN DATE_SUB(CURDATE(), INTERVAL 1 WEEK) AND CURDATE()';
      break;
    case 'lastMonth':
      dateCondition = 'DATE(order_date) BETWEEN DATE_SUB(CURDATE(), INTERVAL 1 MONTH) AND CURDATE()';
      break;
    default:
      dateCondition = 'DATE(order_date) = CURDATE()';
  }

  const [result] = await db.query(`
    SELECT 
      COALESCE(SUM(total), 0) as periodSales,
      COUNT(*) as totalOrders,
      COUNT(DISTINCT user_id) as totalCustomers
    FROM orders
    WHERE ${dateCondition}
  `);

  res.status(200).json(result[0]);
}

async function handleGetTotalProducts(req, res) {
  const [result] = await db.query('SELECT COUNT(*) as totalProducts FROM products');
  res.status(200).json(result[0]);
}

async function handleGetTopProducts(req, res) {
  const [result] = await db.query(`
    SELECT 
      p.id,
      p.name,
      p.image_url,
      p.rating,
      COALESCE(SUM(op.quantity), 0) as sold
    FROM products p
    LEFT JOIN ordered_products op ON p.id = op.product_id
    GROUP BY p.id
    ORDER BY sold DESC, p.rating DESC
    LIMIT 5
  `);
  res.status(200).json(result);
}

async function handleGetRatedProductsCount(req, res) {
  const { timeFrame } = req.query;
  let dateCondition;

  switch (timeFrame) {
    case 'today':
      dateCondition = 'DATE(created_at) = CURDATE()';
      break;
    case 'yesterday':
      dateCondition = 'DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
      break;
    case 'lastWeek':
      dateCondition = 'DATE(created_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL 1 WEEK) AND CURDATE()';
      break;
    case 'lastMonth':
      dateCondition = 'DATE(created_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL 1 MONTH) AND CURDATE()';
      break;
    default:
      dateCondition = 'DATE(created_at) = CURDATE()';
  }

  const [result] = await db.query(`
    SELECT COUNT(DISTINCT product_id) as ratedProductsCount
    FROM product_ratings
    WHERE ${dateCondition}
  `);

  res.status(200).json(result[0]);
}

function handleLogout(req, res) {
  res.setHeader('Set-Cookie', 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly');
  res.status(200).json({ success: true, message: 'Logout successful' });
}

async function handleAddProduct(req, res) {
  const { name, description, price, image_url, stock_quantity, category, supplier_id, rating } = req.body;
  const order_id = generateOrderId();
  const sql = "INSERT INTO products (name, description, price, image_url, stock_quantity, category, supplier_id, order_id, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const [result] = await db.query(sql, [name, description, price, image_url, stock_quantity, category, supplier_id, order_id, rating]);
  res.status(201).json({ message: 'Product added successfully', id: result.insertId, order_id: order_id });
}

async function handleUpdateProduct(req, res) {
  const { name, description, price, image_url, stock_quantity, category, supplier_id, rating } = req.body;
  const { id } = req.query;
  const sql = "UPDATE products SET name=?, description=?, price=?, image_url=?, stock_quantity=?, category=?, supplier_id=?, rating=? WHERE id=?";
  const [result] = await db.query(sql, [name, description, price, image_url, stock_quantity, category, supplier_id, rating, id]);
  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'Product not found' });
  } else {
    res.status(200).json({ message: 'Product updated successfully' });
  }
}

async function handleDeleteProduct(req, res) {
  const { id } = req.query;
  const sql = "DELETE FROM products WHERE id=?";
  const [result] = await db.query(sql, [id]);
  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'Product not found' });
  } else {
    res.status(200).json({ message: 'Product deleted successfully' });
  }
}

async function handleUpdateOrderStatus(req, res) {
  const { id } = req.query;
  const { status } = req.body;
  const sql = "UPDATE orders SET status = ? WHERE id = ?";
  const [result] = await db.query(sql, [status, id]);
  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'Order not found' });
  } else {
    res.status(200).json({ message: 'Order status updated successfully', status: status });
  }
}

async function handleCancelOrder(req, res) {
  const { id } = req.query;
  const sql = "UPDATE orders SET status = 'Cancelled' WHERE id = ?";
  const [result] = await db.query(sql, [id]);
  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'Order not found' });
  } else {
    res.status(200).json({ message: 'Order cancelled successfully' });
  }
}

async function handleUpdateOrder(req, res) {
  const { id } = req.query;
  const { order_date } = req.body;
  const sql = "UPDATE orders SET order_date = ? WHERE id = ?";
  const [result] = await db.query(sql, [order_date, id]);
  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'Order not found' });
  } else {
    res.status(200).json({ message: 'Order date updated successfully' });
  }
}

async function handleRemoveOrderFromSalesReport(req, res) {
  const { id } = req.query;
  const sql = "UPDATE orders SET in_sales_report = 0 WHERE id = ?";
  const [result] = await db.query(sql, [id]);
  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'Order not found' });
  } else {
    res.status(200).json({ message: 'Order removed from sales report successfully' });
  }
}

function generateOrderId() {
  return 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}