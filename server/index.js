require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/eduhub";
const PORT = process.env.PORT || 4000;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

// Email transport for password reset (optional — logs to console if SMTP not configured)
let mailTransport = null;
try {
  const nodemailer = require("nodemailer");
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    mailTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
} catch (e) {
  console.warn("nodemailer not available; password reset links will be logged to console");
}

async function sendPasswordResetEmail(email, resetLink) {
  const subject = "Reset your EduHub password";
  const html = `
    <p>You requested a password reset for your EduHub account.</p>
    <p><a href="${resetLink}">Click here to reset your password</a></p>
    <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
  `;
  if (mailTransport) {
    await mailTransport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject,
      html,
    });
  } else {
    console.log(`[Password Reset] Email: ${email} | Link: ${resetLink}`);
  }
}
const webpush = require("web-push");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");

// allow school name to be set via env for reports; default to generic name if not set
const SCHOOL_NAME = process.env.SCHOOL_NAME || "KIBAALE PARENTS PRIMARY SCHOOL";

// Setup VAPID keys for Web Push. Prefer env values, otherwise generate temporary keys.
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || null;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || null;
let vapidPublic = VAPID_PUBLIC_KEY;
let vapidPrivate = VAPID_PRIVATE_KEY;
if (!vapidPublic || !vapidPrivate) {
  try {
    const keys = webpush.generateVAPIDKeys();
    vapidPublic = keys.publicKey;
    vapidPrivate = keys.privateKey;
    console.warn(
      "Generated temporary VAPID keys. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in env for persistent keys."
    );
  } catch (e) {
    console.error("Failed to generate VAPID keys", e);
  }
}
if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(
    "mailto:admin@example.com",
    vapidPublic,
    vapidPrivate
  );
  console.log("VAPID public key:", vapidPublic);
}

// In-memory store for push subscriptions
const pushSubscriptions = [];

// Connect with retry logic so server keeps trying if DB is down
async function connectWithRetry() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Successfully Connected");
  } catch (err) {
    console.error("connection error:", err && err.message ? err : err);
    console.error("Retrying connection in 5 seconds...");
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

const collections = [
  "students",
  "teachers",
  "classes",
  "fees",
  "attendance",
  "marks",
  "dormitories",
  "store_items",
  "users",
  "item_requests",
  "rooms",
  "assignment_logs",
  "occupancy_snapshots",
  "duties",
  "ratings",
];

// Users model for authentication
const UserModel = createFlexibleModel("users");

// Auth routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      email,
      password,
      role = "teacher",
      first_name = "",
      last_name = "",
    } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email and password are required" });

    const existing = await UserModel.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    // Create account in pending state; admin must confirm before login
    const user = await UserModel.create({
      email,
      password: hashed,
      role,
      first_name,
      last_name,
      email_confirmed: false,
    });

    const safeUser = {
      id: user._id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      email_confirmed: false,
    };
    // Do not issue a token yet; require admin confirmation
    res.status(201).json({ message: "pending_confirmation", user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email and password are required" });

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    // Require admin confirmation before allowing login
    if (user.email_confirmed === false)
      return res
        .status(403)
        .json({ error: "Email not confirmed. Await administrator approval." });

    const accountStatus = user.account_status || "active";
    if (accountStatus === "blocked")
      return res
        .status(403)
        .json({ error: "Your account has been blocked. Contact the administrator." });
    if (accountStatus === "inactive")
      return res
        .status(403)
        .json({ error: "Your account is deactivated. Contact the administrator." });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });
    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    const safeUser = {
      id: user._id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
    };
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await UserModel.findOne({ email });
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        message: "If an account exists with that email, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await UserModel.findByIdAndUpdate(user._id, {
      reset_token: resetTokenHash,
      reset_token_expires: resetExpires,
    });

    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    await sendPasswordResetEmail(email, resetLink);

    res.json({
      message: "If an account exists with that email, a reset link has been sent.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, token, new_password } = req.body;
    if (!email || !token || !new_password)
      return res
        .status(400)
        .json({ error: "Email, token, and new password are required" });
    if (new_password.length < 6)
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await UserModel.findOne({
      email,
      reset_token: resetTokenHash,
      reset_token_expires: { $gt: new Date() },
    });

    if (!user)
      return res
        .status(400)
        .json({ error: "Invalid or expired reset token" });

    const hashed = await bcrypt.hash(new_password, 10);
    await UserModel.findByIdAndUpdate(user._id, {
      password: hashed,
      reset_token: null,
      reset_token_expires: null,
    });

    res.json({ message: "Password reset successfully. You may now log in." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res
        .status(400)
        .json({ error: "Current and new password are required" });

    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(current_password, user.password);
    if (!ok)
      return res.status(400).json({ error: "Current password is incorrect" });

    const hashed = await bcrypt.hash(new_password, 10);
    await UserModel.findByIdAndUpdate(
      req.user.id,
      { password: hashed },
      { new: true }
    );

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const id = req.user.id;
    const user = await UserModel.findById(id).lean();
    if (!user) return res.status(404).json({ error: "Not found" });
    const safeUser = {
      id: user._id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
    };
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
      const sort = req.query._sort || "-createdAt";
      const limit = parseInt(req.query._limit) || 0;
      delete q._sort;
      delete q._limit;

      const items = await Model.find(q).sort(sort).limit(limit);
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get(`${base}/:id`, async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post(base, async (req, res) => {
    try {
      // For store items compute and store status automatically
      if (col === "store_items") {
        const body = { ...req.body };
        const qty = parseInt(body.quantity_in_stock) || 0;
        const reorder = parseInt(body.reorder_level) || 0;
        body.status =
          qty <= 0 ? "Out of Stock" : qty <= reorder ? "Low Stock" : "In Stock";
        const created = await Model.create(body);
        return res.status(201).json(created);
      }
      const created = await Model.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put(`${base}/:id`, async (req, res) => {
    try {
      // For store items, compute new status based on updated quantity or reorder level
      if (col === "store_items") {
        const existing = await Model.findById(req.params.id).lean();
        if (!existing) return res.status(404).json({ error: "Not found" });
        const body = { ...req.body };
        const qty =
          typeof body.quantity_in_stock !== "undefined"
            ? parseInt(body.quantity_in_stock)
            : existing.quantity_in_stock || 0;
        const reorder =
          typeof body.reorder_level !== "undefined"
            ? parseInt(body.reorder_level)
            : existing.reorder_level || 0;
        const newStatus =
          qty <= 0 ? "Out of Stock" : qty <= reorder ? "Low Stock" : "In Stock";
        body.status = newStatus;
        const updated = await Model.findByIdAndUpdate(req.params.id, body, {
          new: true,
        });

        // Send push notifications to subscribers if status is Low Stock or Out of Stock
        if (newStatus === "Low Stock" || newStatus === "Out of Stock") {
          const payload = {
            title: `Store Alert: ${newStatus}`,
            message: `${updated.item_name} is ${newStatus} (qty: ${qty})`,
            url: "/admin/store",
          };
          pushSubscriptions.forEach((sub) => {
            webpush
              .sendNotification(sub, JSON.stringify(payload))
              .catch((err) => {
                if (err && err.statusCode === 410) {
                  const idx = pushSubscriptions.findIndex(
                    (s) => s.endpoint === sub.endpoint
                  );
                  if (idx >= 0) pushSubscriptions.splice(idx, 1);
                } else {
                  console.error(
                    "Push send error",
                    err && err.body ? err.body : err
                  );
                }
              });
          });
        }

        return res.json(updated);
      }

      // Special handling for classes: log teacher assignments
      if (col === "classes") {
        const existing = await Model.findById(req.params.id).lean();
        if (!existing) return res.status(404).json({ error: "Not found" });

        const updates = req.body || {};
        const updated = await Model.findByIdAndUpdate(req.params.id, updates, {
          new: true,
        });

        const oldTeacher = existing.teacher_id || existing.teacher || null;
        const newTeacher =
          typeof updates.teacher_id !== "undefined"
            ? updates.teacher_id
            : existing.teacher_id || existing.teacher || null;

        if (String(oldTeacher) !== String(newTeacher)) {
          try {
            const AssignmentLog = createFlexibleModel("assignment_logs");
            await AssignmentLog.create({
              class_id: req.params.id,
              class_name: updated.class_name || existing.class_name || null,
              from_teacher_id: oldTeacher || null,
              to_teacher_id: newTeacher || null,
              assigned_by: (req.user && req.user.id) || "system",
              action: newTeacher ? "assign_class" : "unassign_class",
              timestamp: new Date(),
            });
          } catch (e) {
            console.error(
              "Failed to create assignment log",
              e && e.message ? e.message : e
            );
          }
        }

        return res.json(updated);
      }

      // Special handling for users: set status to "active" when teacher is confirmed
      if (col === "users") {
        const existing = await Model.findById(req.params.id).lean();
        if (!existing) return res.status(404).json({ error: "Not found" });

        const updates = req.body || {};

        // If confirming email for a teacher, automatically set status to "active"
        if (
          existing.role === "teacher" &&
          updates.email_confirmed === true &&
          existing.email_confirmed !== true
        ) {
          updates.status = "active";
        }

        const updated = await Model.findByIdAndUpdate(req.params.id, updates, {
          new: true,
        });
        return res.json(updated);
      }

      const updated = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      if (!updated) return res.status(404).json({ error: "Not found" });
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

  // Collections
  if (col === "students") {
    app.get(`${base}/search`, async (req, res) => {
      try {
        const { name } = req.query;
        if (!name) return res.json([]);
        const regex = new RegExp(name, "i");
        const results = await Model.find({
          $or: [{ first_name: regex }, { last_name: regex }],
        }).limit(50);
        res.json(results);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  }

  if (col === "fees") {
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

  if (col === "attendance") {
    app.post(`${base}/bulk`, async (req, res) => {
      try {
        const docs = await Model.insertMany(req.body.map((r) => ({ ...r }))); // include timestamps
        res.status(201).json(docs);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    app.get(`${base}/student/:studentId`, async (req, res) => {
      try {
        const results = await Model.find({
          student_id: req.params.studentId,
        }).sort("-attendance_date");
        res.json(results);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.get(`${base}/class/:classId`, async (req, res) => {
      try {
        const results = await Model.find({ class_id: req.params.classId }).sort(
          "-attendance_date"
        );
        res.json(results);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  }

  if (col === "marks") {
    app.post(`${base}/bulk`, async (req, res) => {
      try {
        const docs = await Model.insertMany(req.body.map((r) => ({ ...r })));
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

  if (col === "store_items") {
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

  // Push subscription endpoint
  if (col === "store_items") {
    app.post("/api/push/subscribe", async (req, res) => {
      try {
        const sub = req.body;
        if (!sub || !sub.endpoint)
          return res.status(400).json({ error: "Invalid subscription" });
        // Deduplicate by endpoint
        const exists = pushSubscriptions.find(
          (s) => s.endpoint === sub.endpoint
        );
        if (!exists) pushSubscriptions.push(sub);
        res.status(201).json({ ok: true });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.get("/api/push/publicKey", (req, res) => {
      if (!vapidPublic)
        return res.status(500).json({ error: "VAPID not configured" });
      res.json({ publicKey: vapidPublic });
    });

    app.post("/api/push/notify", async (req, res) => {
      try {
        const payload = req.body || {
          title: "EduHub",
          message: "Notification",
        };
        const promises = pushSubscriptions.map((sub) =>
          webpush
            .sendNotification(sub, JSON.stringify(payload))
            .catch((err) => {
              // If subscription is gone, remove it
              if (err && err.statusCode === 410) {
                const idx = pushSubscriptions.findIndex(
                  (s) => s.endpoint === sub.endpoint
                );
                if (idx >= 0) pushSubscriptions.splice(idx, 1);
              } else {
                console.error(
                  "Push send error",
                  err && err.body ? err.body : err
                );
              }
            })
        );
        await Promise.all(promises);
        res.json({ ok: true });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  }
});

// Custom student update: log assignments and notify
app.put("/api/students/:id", async (req, res) => {
  try {
    const StudentModel = createFlexibleModel("students");
    const AssignmentLog = createFlexibleModel("assignment_logs");
    const existing = await StudentModel.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ error: "Not found" });

    const updates = req.body || {};
    const updated = await StudentModel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    const oldDorm = existing.dormitory_id || existing.dormitory;
    const newDorm = updates.dormitory_id || updates.dormitory || oldDorm;
    const oldBed = existing.bed_number || null;
    const newBed =
      typeof updates.bed_number !== "undefined" ? updates.bed_number : oldBed;

    if (
      String(oldDorm) !== String(newDorm) ||
      String(oldBed) !== String(newBed)
    ) {
      await AssignmentLog.create({
        student_id: req.params.id,
        student_name: `${updated.first_name || ""} ${
          updated.last_name || ""
        }`.trim(),
        from_dormitory: oldDorm || null,
        to_dormitory: newDorm || null,
        from_bed: oldBed || null,
        to_bed: newBed || null,
        changed_by: (req.user && req.user.id) || "system",
        action: String(oldDorm) !== String(newDorm) ? "reassign" : "bed_change",
        timestamp: new Date(),
      });

      const payload = {
        title: "Dormitory Assignment Changed",
        message: `${updated.first_name || ""} ${
          updated.last_name || ""
        } assigned to ${newDorm || "N/A"}${newBed ? " bed " + newBed : ""}`,
        url: "/dormitory",
      };
      pushSubscriptions.forEach((sub) => {
        webpush.sendNotification(sub, JSON.stringify(payload)).catch((err) => {
          if (err && err.statusCode === 410) {
            const idx = pushSubscriptions.findIndex(
              (s) => s.endpoint === sub.endpoint
            );
            if (idx >= 0) pushSubscriptions.splice(idx, 1);
          } else {
            console.error("Push send error", err && err.body ? err.body : err);
          }
        });
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Custom dormitory update: snapshot occupancy
app.put("/api/dormitories/:id", async (req, res) => {
  try {
    const DormModel = createFlexibleModel("dormitories");
    const Snapshot = createFlexibleModel("occupancy_snapshots");
    const existing = await DormModel.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ error: "Not found" });

    const updated = await DormModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    await Snapshot.create({
      dormitory_id: req.params.id,
      dormitory_name: updated.dormitory_name || existing.dormitory_name,
      capacity: updated.capacity || existing.capacity,
      current_occupancy:
        updated.current_occupancy || existing.current_occupancy || 0,
      recorded_at: new Date(),
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Export assignment logs as CSV
app.get("/api/assignments/export", async (req, res) => {
  try {
    const AssignmentLog = createFlexibleModel("assignment_logs");
    const q = {};
    if (req.query.dormitory_id) q.to_dormitory = req.query.dormitory_id;
    const logs = await AssignmentLog.find(q)
      .sort("-timestamp")
      .limit(1000)
      .lean();

    const header = [
      "timestamp",
      "student_id",
      "student_name",
      "action",
      "from_dormitory",
      "to_dormitory",
      "from_bed",
      "to_bed",
      "changed_by",
    ];
    const rows = logs.map((l) => [
      (l.timestamp || l.createdAt || "").toISOString
        ? (l.timestamp || l.createdAt).toISOString()
        : String(l.timestamp || ""),
      l.student_id || "",
      l.student_name || "",
      l.action || "",
      l.from_dormitory || "",
      l.to_dormitory || "",
      l.from_bed || "",
      l.to_bed || "",
      l.changed_by || "",
    ]);

    const csv = [
      header.join(","),
      ...rows.map((r) =>
        r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(",")
      ),
    ].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="assignment_logs.csv"'
    );
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REPORT GENERATION
// returns either pdf or excel document depending on body.format
app.post("/api/reports/class", authenticateToken, async (req, res) => {
  try {
    console.log("/api/reports/class body", req.body);
    const { classId, format = "pdf" } = req.body;
    if (!classId) return res.status(400).json({ error: "classId required" });

    const ClassModel = createFlexibleModel("classes");
    const StudentModel = createFlexibleModel("students");
    const MarkModel = createFlexibleModel("marks");

    const classInfo = await ClassModel.findById(classId).lean();
    const students = await StudentModel.find({ class_id: classId }).lean();
    const marks = await MarkModel.find({ class_id: classId }).lean();

    // map marks by student
    const marksByStudent = {};
    marks.forEach((m) => {
      marksByStudent[m.student_id] = marksByStudent[m.student_id] || [];
      marksByStudent[m.student_id].push(m);
    });

    // map students by id
    const studentMap = {};
    students.forEach((s) => studentMap[s._id] = s);

    const applyBorders = (ws) => {
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = { c: C, r: R };
          const cell_ref = XLSX.utils.encode_cell(cell_address);
          if (!ws[cell_ref]) continue;
          ws[cell_ref].s = ws[cell_ref].s || {};
          ws[cell_ref].s.border = {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          };
        }
      }
    };

    if (format === "excel") {
      try {
        const wb = XLSX.utils.book_new();

        // info sheet
        const info = [
          ["School", SCHOOL_NAME],
          ["Class", classInfo?.class_name || ""],
          ["Generated", new Date().toLocaleDateString()],
        ];
        const wsInfo = XLSX.utils.aoa_to_sheet(info);
        applyBorders(wsInfo);
        XLSX.utils.book_append_sheet(wb, wsInfo, "Info");

        // overview sheet
        const overview = [
          ["Student", "Marks", "%", "Grade", "Subjects"],
        ];
        for (const s of students) {
          const sm = marksByStudent[s._id] || [];
          const total = sm.reduce((a, m) => a + m.marks_obtained, 0);
          const max = sm.reduce((a, m) => a + m.total_marks, 0);
          const perc = max > 0 ? Math.round((total / max) * 100) : 0;
          const grade = calculateGrade(total, max);
          const subj = [...new Set(sm.map((m) => m.subject))].join(",");
          overview.push([`${s.first_name} ${s.last_name}`, `${total}/${max}`, `${perc}%`, grade, subj]);
        }
        const ws1 = XLSX.utils.aoa_to_sheet(overview);
        applyBorders(ws1);
        XLSX.utils.book_append_sheet(wb, ws1, "Overview");

        // raw marks sheet
        const raw = [["Student", "Subject", "Exam", "Obtained", "Total"]];
        marks.forEach((m) => raw.push([`${studentMap[m.student_id]?.first_name || ''} ${studentMap[m.student_id]?.last_name || ''}`, m.subject, m.exam_type, m.marks_obtained, m.total_marks]));
        const ws2 = XLSX.utils.aoa_to_sheet(raw);
        applyBorders(ws2);
        XLSX.utils.book_append_sheet(wb, ws2, "Raw Marks");

        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        res.setHeader("Content-Disposition", "attachment; filename=class-report.xlsx");
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        return res.send(buf);
      } catch (excelErr) {
        console.error("Excel export error:", excelErr);
        return res.status(500).json({ error: `Excel export failed: ${excelErr.message}` });
      }
    }

    // default to pdf
    res.setHeader("Content-Disposition", "attachment; filename=class-report.pdf");
    res.setHeader("Content-Type", "application/pdf");
    const doc = new PDFDocument({ autoFirstPage: false });
    doc.pipe(res);
    doc.addPage();
    doc.fontSize(18).text(SCHOOL_NAME, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).text(`Class Report: ${classInfo?.class_name || ""}`, { align: "center" });
    doc.moveDown();

    // draw bordered, centered table
    const tableTop = doc.y + 10;
    const margin = 40;
    const usableWidth = doc.page.width - margin * 2;
    const colWidths = [usableWidth * 0.4, usableWidth * 0.2, usableWidth * 0.2, usableWidth * 0.2];
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    const startX = (doc.page.width - totalWidth) / 2;
    const rowHeight = 20;

    // header row
    doc.rect(startX, tableTop, totalWidth, rowHeight).stroke();
    doc.fontSize(10).text("Student", startX + 2, tableTop + 5);
    doc.text("Marks", startX + colWidths[0] + 2, tableTop + 5);
    doc.text("%", startX + colWidths[0] + colWidths[1] + 2, tableTop + 5);
    doc.text("Grade", startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, tableTop + 5);

    let y = tableTop + rowHeight;
    students.forEach((s) => {
      const sm = marksByStudent[s._id] || [];
      const total = sm.reduce((a, m) => a + m.marks_obtained, 0);
      const max = sm.reduce((a, m) => a + m.total_marks, 0);
      const perc = max > 0 ? Math.round((total / max) * 100) : 0;
      const grade = calculateGrade(total, max);

      doc.rect(startX, y, totalWidth, rowHeight).stroke();
      doc.fontSize(10).text(`${s.first_name} ${s.last_name}`, startX + 2, y + 5);
      doc.text(`${total}/${max}`, startX + colWidths[0] + 2, y + 5);
      doc.text(`${perc}%`, startX + colWidths[0] + colWidths[1] + 2, y + 5);
      doc.text(grade, startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, y + 5);
      y += rowHeight;
    });
    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reports/student", authenticateToken, async (req, res) => {
  try {
    console.log("/api/reports/student body", req.body);
    const { studentId, format = "pdf" } = req.body;
    if (!studentId) return res.status(400).json({ error: "studentId required" });

    const StudentModel = createFlexibleModel("students");
    const MarkModel = createFlexibleModel("marks");

    const student = await StudentModel.findById(studentId).lean();
    const marks = await MarkModel.find({ student_id: studentId }).lean();
    const ClassModel = createFlexibleModel("classes");
    const classInfo = student?.class_id ? await ClassModel.findById(student.class_id).lean() : null;
    const DormModel = createFlexibleModel("dormitories");
    const dormInfo = student?.dormitory_id ? await DormModel.findById(student.dormitory_id).lean() : null;

    const applyBorders = (ws) => {
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = { c: C, r: R };
          const cell_ref = XLSX.utils.encode_cell(cell_address);
          if (!ws[cell_ref]) continue;
          ws[cell_ref].s = ws[cell_ref].s || {};
          ws[cell_ref].s.border = {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          };
        }
      }
    };

    if (format === "excel") {
      try {
        const wb = XLSX.utils.book_new();

        // info sheet with student details
        const info = [
          ["School", SCHOOL_NAME],
          ["Name", `${student?.first_name || ''} ${student?.last_name || ''}`],
          ["Class", classInfo?.class_name || "N/A"],
          ["Dormitory", dormInfo?.dormitory_name || "N/A"],
        ];
        const wsInfo = XLSX.utils.aoa_to_sheet(info);
        applyBorders(wsInfo);
        XLSX.utils.book_append_sheet(wb, wsInfo, "Info");

        const exams = [...new Set(marks.map((m) => m.exam_type))];
        exams.forEach((exam) => {
          const rows = [["Subject", "Obtained", "Total"]];
          marks.filter((m) => m.exam_type === exam).forEach((m) => {
            rows.push([m.subject, m.marks_obtained, m.total_marks]);
          });
          const ws = XLSX.utils.aoa_to_sheet(rows);
          applyBorders(ws);
          XLSX.utils.book_append_sheet(wb, ws, exam.substring(0, 31));
        });
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        res.setHeader("Content-Disposition", "attachment; filename=student-report.xlsx");
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        return res.send(buf);
      } catch (excelErr) {
        console.error("Excel export error (student):", excelErr);
        return res.status(500).json({ error: `Excel export failed: ${excelErr.message}` });
      }
    }

    res.setHeader("Content-Disposition", "attachment; filename=student-report.pdf");
    res.setHeader("Content-Type", "application/pdf");
    const doc = new PDFDocument({ autoFirstPage: false });
    doc.pipe(res);
    doc.addPage();
    doc.fontSize(18).text(SCHOOL_NAME, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).text("Student Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${student?.first_name || ''} ${student?.last_name || ''}`);
    doc.text(`Class: ${classInfo?.class_name || 'N/A'}`);
    doc.text(`Dormitory: ${dormInfo?.dormitory_name || 'N/A'}`);
    doc.moveDown();

    // table of marks with borders (centered, wider)
    const tableTop = doc.y + 10;
    const margin = 40;
    const usableWidth = doc.page.width - margin * 2;
    const colWidths = [usableWidth * 0.3, usableWidth * 0.4, usableWidth * 0.3];
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    const startX = (doc.page.width - totalWidth) / 2;
    const rowHeight = 20;

    // header
    doc.rect(startX, tableTop, totalWidth, rowHeight).stroke();
    doc.fontSize(10).text("Exam", startX + 2, tableTop + 5);
    doc.text("Subject", startX + colWidths[0] + 2, tableTop + 5);
    doc.text("Marks", startX + colWidths[0] + colWidths[1] + 2, tableTop + 5);

    let y = tableTop + rowHeight;
    marks.forEach((m) => {
      doc.rect(startX, y, totalWidth, rowHeight).stroke();
      doc.fontSize(10).text(m.exam_type, startX + 2, y + 5);
      doc.text(m.subject, startX + colWidths[0] + 2, y + 5);
      doc.text(`${m.marks_obtained}/${m.total_marks}`, startX + colWidths[0] + colWidths[1] + 2, y + 5);
      y += rowHeight;
    });
    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Item Requests endpoints
const ItemRequestModel = createFlexibleModel("item_requests");

app.post("/api/item-requests", async (req, res) => {
  try {
    const request = await ItemRequestModel.create({
      ...req.body,
      status: "pending",
      created_at: new Date(),
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/item-requests", async (req, res) => {
  try {
    const status = req.query.status || "pending";
    const requests = await ItemRequestModel.find({ status }).sort(
      "-created_at"
    );
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/item-requests/:id/approve", async (req, res) => {
  try {
    const { approval_notes } = req.body;
    const updated = await ItemRequestModel.findByIdAndUpdate(
      req.params.id,
      { status: "approved", approval_notes, approved_at: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Request not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/item-requests/:id/reject", async (req, res) => {
  try {
    const { rejection_reason } = req.body;
    const updated = await ItemRequestModel.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", rejection_reason, rejected_at: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Request not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
