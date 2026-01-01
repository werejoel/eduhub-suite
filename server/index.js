require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eduhub';
const PORT = process.env.PORT || 4000;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Connect with retry logic so server keeps trying if DB is down
async function connectWithRetry() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err && err.message ? err : err);
    console.error('Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
}
connectWithRetry();

// Generic schema: allow flexible fields
const createFlexibleModel = (name) => {
  const schema = new mongoose.Schema({}, { strict: false, timestamps: true });
  try {
    return mongoose.model(name);
  } catch (e) {
    return mongoose.model(name, schema, name);
  }
};

const collections = ['students','teachers','classes','fees','attendance','marks','dormitories','store_items','users'];

// Users model for authentication
const UserModel = createFlexibleModel('users');

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role = 'teacher', first_name = '', last_name = '' } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const existing = await UserModel.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ email, password: hashed, role, first_name, last_name });
    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    const safeUser = { id: user._id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name };
    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const safeUser = { id: user._id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name };
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const id = req.user.id;
    const user = await UserModel.findById(id).lean();
    if (!user) return res.status(404).json({ error: 'Not found' });
    const safeUser = { id: user._id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name };
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

collections.forEach((col) => {
  const Model = createFlexibleModel(col);
  const base = `/api/${col}`;

  // List with optional query params
  app.get(base, async (req, res) => {
    try {
      const q = req.query || {};
      // support simple pagination and sorting
      const sort = req.query._sort || '-createdAt';
      const limit = parseInt(req.query._limit) || 0;
      delete q._sort; delete q._limit;

      const items = await Model.find(q).sort(sort).limit(limit);
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get(`${base}/:id`, async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post(base, async (req, res) => {
    try {
      const created = await Model.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put(`${base}/:id`, async (req, res) => {
    try {
      const updated = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete(`${base}/:id`, async (req, res) => {
    try {
      await Model.findByIdAndDelete(req.params.id);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Collection-specific conveniences
  if (col === 'students') {
    app.get(`${base}/search`, async (req, res) => {
      try {
        const { name } = req.query;
        if (!name) return res.json([]);
        const regex = new RegExp(name, 'i');
        const results = await Model.find({ $or: [{ first_name: regex }, { last_name: regex }] }).limit(50);
        res.json(results);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  }

  if (col === 'fees') {
    app.get(`${base}/student/:studentId`, async (req, res) => {
      try {
        const results = await Model.find({ student_id: req.params.studentId });
        res.json(results);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.get(`${base}/status/:status`, async (req, res) => {
      try {
        const results = await Model.find({ payment_status: req.params.status });
        res.json(results);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  }

  if (col === 'attendance') {
    app.post(`${base}/bulk`, async (req, res) => {
      try {
        const docs = await Model.insertMany(req.body.map(r => ({ ...r }))); // include timestamps
        res.status(201).json(docs);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    app.get(`${base}/student/:studentId`, async (req, res) => {
      try {
        const results = await Model.find({ student_id: req.params.studentId }).sort('-attendance_date');
        res.json(results);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.get(`${base}/class/:classId`, async (req, res) => {
      try {
        const results = await Model.find({ class_id: req.params.classId }).sort('-attendance_date');
        res.json(results);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  }

  if (col === 'marks') {
    app.post(`${base}/bulk`, async (req, res) => {
      try {
        const docs = await Model.insertMany(req.body.map(r => ({ ...r })));
        res.status(201).json(docs);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    app.get(`${base}/student/:studentId`, async (req, res) => {
      try {
        const results = await Model.find({ student_id: req.params.studentId });
        res.json(results);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.get(`${base}/class/:classId`, async (req, res) => {
      try {
        const results = await Model.find({ class_id: req.params.classId });
        res.json(results);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  }

  if (col === 'store_items') {
    app.get(`${base}/low-stock/:threshold`, async (req, res) => {
      try {
        const t = parseInt(req.params.threshold) || 10;
        const results = await Model.find({ quantity_in_stock: { $lte: t } });
        res.json(results);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
