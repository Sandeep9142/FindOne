import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import connectDatabase from '../config/database.js';
import {
  Booking,
  Category,
  ClientProfile,
  Conversation,
  Job,
  JobApplication,
  Message,
  Payment,
  Review,
  User,
  WorkerProfile,
} from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureCategories() {
  const existing = await Category.countDocuments();
  if (existing > 0) {
    return;
  }

  const seedPath = path.resolve(__dirname, '../../../database/seeds/categories.json');
  const raw = await fs.readFile(seedPath, 'utf-8');
  const categories = JSON.parse(raw);

  for (const category of categories) {
    await Category.updateOne({ slug: category.slug }, { $set: category }, { upsert: true });
  }
}

async function clearExistingDemoData(emails) {
  const existingUsers = await User.find({ email: { $in: emails } }).select('_id');
  const ids = existingUsers.map((user) => user._id);

  if (ids.length === 0) {
    return;
  }

  await Promise.all([
    Message.deleteMany({ senderId: { $in: ids } }),
    Conversation.deleteMany({ participantIds: { $in: ids } }),
    Review.deleteMany({
      $or: [{ clientId: { $in: ids } }, { workerId: { $in: ids } }],
    }),
    Payment.deleteMany({
      $or: [{ clientId: { $in: ids } }, { workerId: { $in: ids } }],
    }),
    Booking.deleteMany({
      $or: [{ clientId: { $in: ids } }, { workerId: { $in: ids } }],
    }),
    JobApplication.deleteMany({ workerId: { $in: ids } }),
    Job.deleteMany({
      $or: [{ clientId: { $in: ids } }, { assignedWorkerId: { $in: ids } }],
    }),
    WorkerProfile.deleteMany({ userId: { $in: ids } }),
    ClientProfile.deleteMany({ userId: { $in: ids } }),
    User.deleteMany({ _id: { $in: ids } }),
  ]);
}

async function seedDemoData() {
  await connectDatabase();
  await ensureCategories();

  const demoAccounts = [
    {
      fullName: 'Demo Client',
      email: 'demo.client@findone.local',
      role: 'client',
      phone: '9000000001',
    },
    {
      fullName: 'Demo Worker',
      email: 'demo.worker@findone.local',
      role: 'worker',
      phone: '9000000002',
    },
    {
      fullName: 'Demo Admin',
      email: 'demo.admin@findone.local',
      role: 'admin',
      phone: '9000000003',
    },
  ];

  await clearExistingDemoData(demoAccounts.map((item) => item.email));

  const passwordHash = await bcrypt.hash('secret123', 10);
  const categories = await Category.find().sort({ sortOrder: 1 });
  const homeRepairs = categories[0];

  const [clientUser, workerUser, adminUser] = await User.create(
    demoAccounts.map((account) => ({
      ...account,
      passwordHash,
      isVerified: true,
      isActive: true,
    }))
  );

  const clientProfile = await ClientProfile.create({
    userId: clientUser._id,
    companyName: 'Demo Client Co',
    address: 'Salt Lake, Kolkata',
    preferredLocations: [
      { city: 'Kolkata', state: 'West Bengal', pincode: '700091' },
    ],
  });

  const workerProfile = await WorkerProfile.create({
    userId: workerUser._id,
    headline: 'Experienced Home Repair Specialist',
    bio: 'Handles plumbing, maintenance, and home repair requests.',
    categories: homeRepairs ? [homeRepairs._id] : [],
    skills: ['plumbing', 'repairs', 'maintenance'],
    experienceYears: 6,
    hourlyRate: 550,
    serviceAreas: [{ city: 'Kolkata', state: 'West Bengal', pincode: '700001' }],
    languages: ['English', 'Hindi', 'Bengali'],
    isAvailableNow: true,
    verificationStatus: 'verified',
    backgroundCheckStatus: 'approved',
    ratingAverage: 5,
    ratingCount: 1,
    jobsCompleted: 1,
    portfolioImages: [],
  });

  const openJob = await Job.create({
    clientId: clientUser._id,
    categoryId: homeRepairs?._id,
    title: 'Fix bathroom tap leakage',
    description: 'Need a skilled worker to inspect and fix bathroom tap leakage.',
    skillsRequired: ['plumbing', 'repair'],
    location: {
      addressLine: 'Sector V',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700091',
      coordinates: { lat: null, lng: null },
    },
    budgetType: 'hourly',
    budgetMin: 400,
    budgetMax: 700,
    urgency: 'high',
    status: 'open',
    applicationCount: 1,
    paymentStatus: 'pending',
  });

  await JobApplication.create({
    jobId: openJob._id,
    workerId: workerUser._id,
    coverMessage: 'I can take care of this quickly.',
    proposedRate: 550,
    status: 'pending',
  });

  const completedBooking = await Booking.create({
    clientId: clientUser._id,
    workerId: workerUser._id,
    categoryId: homeRepairs?._id,
    title: 'Direct repair booking',
    description: 'On-site home repair service booking.',
    bookingDate: new Date('2026-03-31T10:00:00.000Z'),
    timeSlot: '10:00 AM - 12:00 PM',
    address: {
      addressLine: 'Lake Town',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700048',
    },
    pricingType: 'hourly',
    amount: 600,
    status: 'completed',
    paymentStatus: 'paid',
    notes: 'Bring standard tools',
  });

  await Review.create({
    bookingId: completedBooking._id,
    clientId: clientUser._id,
    workerId: workerUser._id,
    rating: 5,
    comment: 'Excellent work and very punctual.',
    tags: ['punctual', 'professional'],
  });

  await Payment.create({
    bookingId: completedBooking._id,
    clientId: clientUser._id,
    workerId: workerUser._id,
    amount: 600,
    currency: 'INR',
    provider: 'manual',
    status: 'paid',
    paidAt: new Date(),
  });

  const conversation = await Conversation.create({
    participantIds: [clientUser._id, workerUser._id],
    bookingId: completedBooking._id,
    lastMessageAt: new Date(),
  });

  const [firstMessage, secondMessage] = await Message.create([
    {
      conversationId: conversation._id,
      senderId: clientUser._id,
      text: 'Hi, thanks for completing the booking.',
      messageType: 'text',
      readBy: [{ userId: clientUser._id, readAt: new Date() }],
    },
    {
      conversationId: conversation._id,
      senderId: workerUser._id,
      text: 'Glad to help. Let me know if you need anything else.',
      messageType: 'text',
      readBy: [{ userId: workerUser._id, readAt: new Date() }],
    },
  ]);

  conversation.lastMessageId = secondMessage._id;
  conversation.lastMessageAt = secondMessage.createdAt;
  await conversation.save();

  const summary = {
    users: {
      client: {
        email: clientUser.email,
        password: 'secret123',
        id: clientUser._id,
      },
      worker: {
        email: workerUser.email,
        password: 'secret123',
        id: workerUser._id,
        profileId: workerProfile._id,
      },
      admin: {
        email: adminUser.email,
        password: 'secret123',
        id: adminUser._id,
      },
    },
    records: {
      clientProfileId: clientProfile._id,
      openJobId: openJob._id,
      completedBookingId: completedBooking._id,
      conversationId: conversation._id,
      firstMessageId: firstMessage._id,
      secondMessageId: secondMessage._id,
    },
  };

  console.log('Demo data seeded successfully');
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

seedDemoData().catch((error) => {
  console.error('Failed to seed demo data', error);
  process.exit(1);
});
