import { Router } from 'express';

const router = Router();

// Example controller functions
const getItems = (req, res) => {
  res.status(200).json({ message: 'List of items' });
};

const createItem = (req, res) => {
  res.status(201).json({ message: 'Item created' });
};

// Define routes
router.get('/items', getItems);
router.post('/items', createItem);

// Export the router
export default router;