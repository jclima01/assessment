const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../data/items.json');

let cache = {
  stats: null,
  lastUpdated: null,
  itemsHash: null
};

const CACHE_TTL_MS = 5 * 60 * 1000;

function calculateItemsHash(items) {
  return JSON.stringify(items.length);
}

async function calculateStats() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    const items = JSON.parse(raw);

    const stats = {
      total: items.length,
      averagePrice: items.length > 0
        ? parseFloat((items.reduce((acc, cur) => acc + cur.price, 0) / items.length).toFixed(2))
        : 0,
      lastUpdated: new Date().toISOString(),
      categories: items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {})
    };

    return { stats, itemsHash: calculateItemsHash(items) };
  } catch (error) {
    throw error;
  }
}

// GET /api/stats
router.get('/', async (req, res, next) => {
  try {
    const now = Date.now();
    const isCacheExpired = !cache.lastUpdated || (now - new Date(cache.lastUpdated).getTime() > CACHE_TTL_MS);

    if (isCacheExpired) {
      // If cache is expired, calculate new stats
      const { stats, itemsHash } = await calculateStats();

      // Only update cache if data has changed
      if (itemsHash !== cache.itemsHash) {
        cache = {
          stats,
          lastUpdated: new Date().toISOString(),
          itemsHash
        };
      }
    }

    res.json({
      ...cache.stats,
      cached: !isCacheExpired,
      lastUpdated: cache.lastUpdated
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;