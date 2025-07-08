const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

async function readData() {
  const raw = await fs.promises.readFile(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

// GET /api/items
router.get('/', async (req, res, next) => {
  try {
    const data = await readData();
    const { q, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    let results = [...data];

    if (q) {
      results = results.filter(item => 
        item.name.toLowerCase().includes(q.toLowerCase())
      );
    }

    const totalItems = results.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limitNumber));
    const currentPage = Math.min(Math.max(1, pageNumber), totalPages);
    const startIndex = (currentPage - 1) * limitNumber;
    const endIndex = Math.min(startIndex + limitNumber, totalItems);
    
    const paginatedResults = results.slice(startIndex, endIndex);

    const response = {
      items: paginatedResults,
      pagination: {
        totalItems,
        totalPages,
        currentPage,
        itemsPerPage: limitNumber,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      }
    };
    
    res.json(response);
  } catch (err) {
    next(err);
  }
});
// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readData();
    const itemId = req.params.id;
    // Try to find by string ID first, then fall back to numeric ID
    const item = data.find(i => i.id === itemId || i.id === parseInt(itemId));
    
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
    // TODO: Validate payload (intentional omission)
    const item = req.body;
    const data = await readData();
    item.id = Date.now();
    data.push(item);
    fs.promises.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;