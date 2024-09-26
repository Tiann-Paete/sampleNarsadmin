import { query } from '../../src/api/server';

export default async function handler(req, res) {
  try {
    const result = await query('SELECT 1 + 1 AS result');
    res.status(200).json({ message: 'Database connection successful', result });
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
}