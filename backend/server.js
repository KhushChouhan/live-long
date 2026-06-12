const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config/config');
const { connectDB } = require('./config/database');
const logger = require('./utils/logger');
const { User } = require('./models');

// Middleware & Routers
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const aadhaarRoutes = require('./routes/aadhaarRoutes');
const userRoutes = require('./routes/userRoutes');
const doctorRoutes = require('./routes/doctorRoutes');

const app = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const corsOptions = {
  origin: '*', // In production, restrict to allowed app domains/IPs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Parsing Requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiter
app.use('/api/', apiLimiter);

// Static Uploads Folder (Serve uploaded files securely)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Proxy endpoint to send WhatsApp templates via MSG91 to avoid CORS and secure the authkey
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { integrated_number, recipient_number, template } = req.body;
    const url = 'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';

    const cleanNumber = (num) => {
      if (!num) return '';
      let cleaned = num.toString().replace(/[^0-9]/g, '');
      if (cleaned.length === 10) {
        cleaned = '91' + cleaned;
      }
      return cleaned;
    };

    // Fetch sender and receiver numbers from the database
    let dbRecipient = null;

    if (template && template.body_1) {
      try {
        const patientName = template.body_1.trim();
        const firstName = patientName.split(/\s+/)[0];
        const patientUser = await User.findOne({
          role: 'patient',
          $or: [
            { name: { $regex: new RegExp(`^${patientName}$`, 'i') } },
            { name: { $regex: new RegExp(`^${firstName}$`, 'i') } }
          ]
        });
        if (patientUser && patientUser.phone) {
          dbRecipient = patientUser.phone;
        }
      } catch (err) {
        logger.error('[Backend WhatsApp Proxy] Patient query error: ' + err.message);
      }
    }

    // Use 918890204260 as the MSG91 integrated sender number as instructed
    const sender = '918890204260';
    const rawRecipient = dbRecipient || recipient_number;
    const recipient = cleanNumber(rawRecipient);

    if (!recipient) {
      return res.status(400).json({ message: 'Recipient phone number is required and must contain numeric digits.' });
    }

    const components = {};
    if (template) {
      if (template.body_1) components.body_1 = { type: 'text', value: template.body_1 };
      if (template.body_2) components.body_2 = { type: 'text', value: template.body_2 };
      if (template.body_3) components.body_3 = { type: 'text', value: template.body_3 };
      if (template.body_4) components.body_4 = { type: 'text', value: template.body_4 };
    }

    const payload = {
      integrated_number: sender,
      content_type: 'template',
      payload: {
        messaging_product: 'whatsapp',
        type: 'template',
        template: {
          name: 'live_long_appointment_confirmed',
          language: {
            code: 'en',
            policy: 'deterministic'
          },
          namespace: 'c2b18b4e_d86e_424e_b7ec_fc66e0314e1f',
          to_and_components: [
            {
              to: [
                recipient
              ],
              ...(Object.keys(components).length > 0 ? { components } : {})
            }
          ]
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authkey: process.env.MSG91_AUTH_KEY || '520374AfkKX1J56a17dd2cP1',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    })

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }

    // Check HTTP-level failure
    if (!response.ok) {
      logger.error('[Backend WhatsApp Proxy] Failed response from MSG91: ' + text);
      return res.status(response.status).json(data);
    }

    // Check MSG91 application-level failure (HTTP 200 but status: 'fail')
    if (data && (data.status === 'fail' || data.hasError === true)) {
      logger.error('[Backend WhatsApp Proxy] MSG91 returned failure: ' + text);
      return res.status(502).json({
        message: data.errors || 'MSG91 rejected the request',
        status: 'fail',
        hasError: true,
        errors: data.errors
      });
    }

    res.status(200).json(data);
  } catch (error) {
    logger.error('[Backend WhatsApp Proxy] Error: ' + error.message);
    res.status(500).json({ message: error.message });
  }
});

// GET route for /api/whatsapp/send to handle accidental browser GET requests gracefully
app.get('/api/whatsapp/send', (req, res) => {
  res.status(200).json({
    message: 'WhatsApp Send Proxy is active. Please use the POST method to send notifications.',
    endpoint: '/api/whatsapp/send',
    method: 'POST'
  });
});


// Mapped REST APIs
app.use('/api/auth', authRoutes);
app.use('/api/aadhaar', aadhaarRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);

// Global Error Handler
app.use(errorHandler);

// Seed mock database for local MongoDB / MongoDB Atlas sandbox
const seedMockDatabase = async () => {
  try {
    const { User, Doctor, Patient, AadhaarVerification, Appointment, MedicalRecord } = require('./models');

    logger.info('Resetting and seeding mock database patient data...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('000000', 10);
    const chinuHashedPassword = await bcrypt.hash('968026', 10);

    // Wipe patient-related collections to avoid leftover old users
    await User.deleteMany({ role: 'patient' });
    await Patient.deleteMany({});
    await Appointment.deleteMany({});
    await MedicalRecord.deleteMany({});
    await AadhaarVerification.deleteMany({});

    // Seed/Ensure Users - check by BOTH phone AND email to prevent duplicates
    const ensureUser = async (userData, profileType, profileData) => {
      let existing = await User.findOne({
        $or: [{ phone: userData.phone }, { email: userData.email }]
      });
      if (!existing) {
        const { id, password: rawPass, ...rest } = userData;
        // If password is already hashed (starts with $2b$), use as-is, else hash
        const finalPassword = rawPass.startsWith('$2b$') ? rawPass : await bcrypt.hash(rawPass, 10);
        existing = await User.create({ _id: id, ...rest, password: finalPassword });
        if (profileType === 'doctor') {
          const { id: profileId, ...profRest } = profileData;
          await Doctor.create({ _id: profileId, userId: existing._id, ...profRest });
        } else if (profileType === 'patient') {
          const { id: profileId, ...profRest } = profileData;
          await Patient.create({ _id: profileId, userId: existing._id, ...profRest });
        }
      } else {
        logger.info(`Already exists: ${existing.name} (${existing.phone})`);
      }
      return existing;

    };

    // ── DOCTOR ──────────────────────────────────────────────────────
    const docUser = await ensureUser({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Dr. Catherine Lawrence',
      email: 'doctor@livelong.com',
      phone: '+919876543210',      // Doctor number: 9876543210
      password: hashedPassword,
      role: 'doctor',
      isAadhaarVerified: true,
      isActive: true
    }, 'doctor', {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      specialization: 'Cardiology',
      registrationNumber: 'MCI-12345',
      experienceYears: 12,
      isVerifiedBadge: true,
      consultationFee: 800.00,
      clinicAddress: 'LiveLong Heart Care Clinic, Ground Floor, Sector 15, Gurgaon, India'
    });

    // ── PATIENT 1 (Karan) ──────────────────────────────────────────
    const patUser1 = await ensureUser({
      id: '66666666-6666-6666-6666-666666666666',
      name: 'karan',
      email: 'karan@livelong.com',
      phone: '+918890204260',
      password: hashedPassword,
      role: 'patient',
      isAadhaarVerified: true,
      isActive: true
    }, 'patient', {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      dateOfBirth: '2000-01-01',
      gender: 'male',
      bloodGroup: 'A+',
      emergencyContactName: 'Emergency Contact',
      emergencyContactPhone: '+918890204261',
      allergies: 'None'
    });

    // ── PATIENT 2 (Chinu) ──────────────────────────────────────────
    const patUser2 = await ensureUser({
      id: '77777777-7777-7777-7777-777777777777',
      name: 'chinu',
      email: 'chinu@livelong.com',
      phone: '+919680796461',
      password: chinuHashedPassword,
      role: 'patient',
      isAadhaarVerified: true,
      isActive: true
    }, 'patient', {
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      dateOfBirth: '1995-08-20',
      gender: 'male',
      bloodGroup: 'O+',
      emergencyContactName: 'Emergency Contact',
      emergencyContactPhone: '+919680079647',
      allergies: 'None'
    });

    // ── PATIENT 3 (Sonia) ──────────────────────────────────────────
    const patUser3 = await ensureUser({
      id: '88888888-8888-8888-8888-888888888888',
      name: 'sonia',
      email: 'sonia@livelong.com',
      phone: '+95713299819',
      password: hashedPassword,
      role: 'patient',
      isAadhaarVerified: true,
      isActive: true
    }, 'patient', {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      dateOfBirth: '1998-05-12',
      gender: 'female',
      bloodGroup: 'B+',
      emergencyContactName: 'Emergency Contact',
      emergencyContactPhone: '+95713299820',
      allergies: 'None'
    });

    // ── ADMIN ────────────────────────────────────────────────────────
    await ensureUser({
      id: '33333333-3333-3333-3333-333333333333',
      name: 'System Admin',
      email: 'admin@livelong.com',
      phone: '+917777777777',
      password: hashedPassword,
      role: 'admin',
      isAadhaarVerified: false,
      isActive: true
    });

    // Ensure Aadhaar verification entries
    const ensureAadhaar = async (aadhaarData) => {
      const { id, ...rest } = aadhaarData;
      // Check by _id OR by aadhaarHash to avoid duplicate key error
      const existing = await AadhaarVerification.findOne({
        $or: [{ _id: id }, { aadhaarHash: rest.aadhaarHash }]
      });
      if (!existing) {
        await AadhaarVerification.create({ _id: id, ...rest });
      }
    };

    await ensureAadhaar({
      id: 'c34a2e5d-16f3-4d43-8ab2-1c6d860fe3d4',
      userId: docUser._id,
      aadhaarHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      transactionId: 'TXN-AADHAAR-DOC-10293',
      verifiedAt: new Date(),
      status: 'verified'
    });

    await ensureAadhaar({
      id: 'd45b3f6e-27a4-5e54-9bc3-2d7e971af4e5',
      userId: patUser1._id,
      aadhaarHash: 'cbd6f43e5c94a2b168a4fa16b208fa5f7c1e3768b1ff53e811c79a834b6e27ff',
      transactionId: 'TXN-AADHAAR-PAT-40283',
      verifiedAt: new Date(),
      status: 'verified'
    });

    await ensureAadhaar({
      id: 'e45b3f6e-27a4-5e54-9bc3-2d7e971af4e5',
      userId: patUser2._id,
      aadhaarHash: 'dbd6f43e5c94a2b168a4fa16b208fa5f7c1e3768b1ff53e811c79a834b6e27ff',
      transactionId: 'TXN-AADHAAR-PAT-40284',
      verifiedAt: new Date(),
      status: 'verified'
    });

    await ensureAadhaar({
      id: 'f45b3f6e-27a4-5e54-9bc3-2d7e971af4e5',
      userId: patUser3._id,
      aadhaarHash: 'ebd6f43e5c94a2b168a4fa16b208fa5f7c1e3768b1ff53e811c79a834b6e27ff',
      transactionId: 'TXN-AADHAAR-PAT-40285',
      verifiedAt: new Date(),
      status: 'verified'
    });

    // Ensure Appointment
    await Appointment.create({
      _id: 'a5555555-5555-5555-5555-555555555555',
      doctorId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      patientId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', // Karan
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'scheduled',
      type: 'video',
      symptoms: 'Routine checkup for mild heart rate variations.'
    });

    await Appointment.create({
      _id: 'b5555555-5555-5555-5555-555555555555',
      doctorId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      patientId: 'ffffffff-ffff-ffff-ffff-ffffffffffff', // Chinu
      appointmentDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: 'scheduled',
      type: 'video',
      symptoms: 'Cardiology follow-up consultation.'
    });

    await Appointment.create({
      _id: 'c5555555-5555-5555-5555-555555555555',
      doctorId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      patientId: 'dddddddd-dddd-dddd-dddd-dddddddddddd', // Sonia
      appointmentDate: new Date(Date.now() + 72 * 60 * 60 * 1000),
      status: 'scheduled',
      type: 'video',
      symptoms: 'Routine consultation.'
    });

    // Ensure Medical Record
    await MedicalRecord.create({
      _id: '66666666-6666-6666-6666-666666666666',
      patientId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', // Karan
      doctorId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      recordType: 'prescription',
      title: 'Prescription for Cardiology Consult',
      description: 'Take Amlodipine 5mg once daily. Avoid excessive sodium intake.',
      fileUrl: '/uploads/prescriptions/prescription_102.pdf',
      recordDate: '2026-05-25'
    });

    await MedicalRecord.create({
      _id: '77777777-7777-7777-7777-777777777777',
      patientId: 'ffffffff-ffff-ffff-ffff-ffffffffffff', // Chinu
      doctorId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      recordType: 'prescription',
      title: 'Initial Health Assessment',
      description: 'General evaluation of cardiovascular health.',
      fileUrl: '/uploads/prescriptions/prescription_103.pdf',
      recordDate: '2026-05-28'
    });

    await MedicalRecord.create({
      _id: '88888888-8888-8888-8888-888888888888',
      patientId: 'dddddddd-dddd-dddd-dddd-dddddddddddd', // Sonia
      doctorId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      recordType: 'prescription',
      title: 'General Health Check',
      description: 'Annual physical examination.',
      fileUrl: '/uploads/prescriptions/prescription_104.pdf',
      recordDate: '2026-06-01'
    });

  } catch (err) {
    logger.error('Failed to seed mock database:', err);
  }
};

// Establish database connection and start Express server
const startServer = async () => {
  try {
    await connectDB();
    logger.info('Database connection established successfully.');

    // Seed/Ensure mock database (safe to run always — ensureUser prevents duplicates)
    await seedMockDatabase();

    // 0.0.0.0 = sabhi interfaces pe suno (phone bhi connect kar sake)
    const server = app.listen(config.port, '0.0.0.0', () => {
      const os = require('os');
      const nets = os.networkInterfaces();
      let localIP = 'localhost';
      for (const iface of Object.values(nets)) {
        for (const net of iface) {
          if (net.family === 'IPv4' && !net.internal) {
            localIP = net.address;
            break;
          }
        }
        if (localIP !== 'localhost') break;
      }
      logger.info(`Server running in [${config.env}] mode on port ${config.port}`);
      logger.info(`Local   : http://localhost:${config.port}`);
      logger.info(`Network : http://${localIP}:${config.port} `);
    });

    // WebSocket Server for real-time chat
    const { WebSocketServer } = require('ws');
    const wss = new WebSocketServer({ server });
    const wsClients = new Set();

    wss.on('connection', (ws) => {
      wsClients.add(ws);
      logger.info(`[WS] Client connected. Total clients: ${wsClients.size}`);

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          logger.info(`[WS] Received message: ${JSON.stringify(data)}`);

          // Broadcast to all other connected clients
          const broadcastMsg = JSON.stringify(data);
          for (const client of wsClients) {
            if (client !== ws && client.readyState === 1) { // 1 is OPEN
              client.send(broadcastMsg);
            }
          }
        } catch (err) {
          logger.error('[WS] Failed to parse message:', err);
        }
      });

      ws.on('close', () => {
        wsClients.delete(ws);
        logger.info(`[WS] Client disconnected. Total clients: ${wsClients.size}`);
      });
    });

    // Handle port-already-in-use gracefully instead of crashing
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${config.port} is already in use. Kill the other process first:`);
        logger.error(`   Windows: netstat -ano | findstr :${config.port}  then  taskkill /PID <pid> /F`);
        process.exit(1);
      } else {
        logger.error('Server error:', err);
        process.exit(1);
      }
    });
  } catch (err) {
    logger.error('Failed to initialize server application:', err);
    process.exit(1);
  }
};

startServer();
