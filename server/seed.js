import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Complaint from './models/Complaint.js';
import Poll from './models/Poll.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neoconnect');
    console.log('Connected to MongoDB');

    await mongoose.connection.collection('users').drop().catch(() => {});
    await mongoose.connection.collection('complaints').drop().catch(() => {});
    await mongoose.connection.collection('polls').drop().catch(() => {});
    console.log('🗑️  Cleared existing data');

    const users = await User.create([
      { name: 'Alice Staff',      email: 'staff@demo.com',        password: 'password123', role: 'staff',        department: 'Engineering'     },
      { name: 'Bob Secretariat',  email: 'secretariat@demo.com',  password: 'password123', role: 'secretariat',  department: 'Admin'           },
      { name: 'Carol Manager',    email: 'casemanager@demo.com',  password: 'password123', role: 'case_manager', department: 'HR'              },
      { name: 'Dave Admin',       email: 'admin@demo.com',        password: 'password123', role: 'admin',        department: 'IT'              },
      { name: 'Eve HR',           email: 'hr@demo.com',           password: 'password123', role: 'staff',        department: 'Human Resources' },
      { name: 'Frank Ops',        email: 'ops@demo.com',          password: 'password123', role: 'case_manager', department: 'Operations'      },
    ]);

    const [alice, , carol, , eve] = users;
    console.log('👥 Created', users.length, 'users');

    // Create complaints ONE BY ONE so pre-save hook generates sequential tracking IDs
    const c1 = await Complaint.create({
      title: 'AC not working in Block B',
      description: 'The air conditioning on Floor 3 has been non-functional for 2 weeks. Multiple employees are affected.',
      category: 'Facilities',
      department: 'Engineering',
      location: 'Block B, Floor 3',
      severity: 'High',
      status: 'Assigned',
      submittedBy: alice._id,
      submitterName: alice.name,
      assignedTo: carol._id,
      assignedToName: carol.name,
      assignedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      lastResponseAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });
    console.log('  ✓', c1.trackingId);

    const c2 = await Complaint.create({
      title: 'Harassment by team lead',
      description: 'I have experienced repeated verbal harassment from my team lead during meetings.',
      category: 'HR',
      department: 'Human Resources',
      location: 'Meeting Room 2A',
      severity: 'High',
      status: 'In Progress',
      isAnonymous: true,
      submittedBy: eve._id,
      assignedTo: carol._id,
      assignedToName: carol.name,
      assignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      lastResponseAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      notes: [{
        content: 'Initial review done. Scheduling a meeting with the team lead this week.',
        addedBy: carol._id,
        addedByName: carol.name,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      }],
    });
    console.log('  ✓', c2.trackingId);

    const c3 = await Complaint.create({
      title: 'Parking lot overcrowded',
      description: 'The main parking lot is consistently full by 8:30 AM, causing staff to park on the street.',
      category: 'Facilities',
      department: 'Operations',
      location: 'Main Parking Lot',
      severity: 'Medium',
      status: 'Resolved',
      submittedBy: alice._id,
      submitterName: alice.name,
      resolution: 'New parking allocation system implemented. Overflow area opened.',
      resolvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      isPublished: true,
      publicSummary: 'Staff reported consistent parking overcrowding during morning hours',
      actionTaken: 'New parking rules implemented with reserved slots and overflow area',
      result: 'Congestion reduced by 60%, no more street parking needed',
    });
    console.log('  ✓', c3.trackingId);

    const c4 = await Complaint.create({
      title: 'Safety equipment missing in workshop',
      description: 'Several safety helmets and gloves are missing from the workshop storage room.',
      category: 'Safety',
      department: 'Operations',
      location: 'Workshop B',
      severity: 'High',
      status: 'New',
      submittedBy: alice._id,
      submitterName: alice.name,
    });
    console.log('  ✓', c4.trackingId);

    const c5 = await Complaint.create({
      title: 'Unclear overtime policy',
      description: 'The current overtime policy document is outdated and causes confusion about compensation.',
      category: 'Policy',
      department: 'Finance',
      location: 'N/A',
      severity: 'Low',
      status: 'New',
      submittedBy: eve._id,
      submitterName: eve.name,
    });
    console.log('  ✓', c5.trackingId);

    console.log('📝 Created 5 complaints');

    // Create demo poll
    const [sec] = await User.find({ role: 'secretariat' });
    await Poll.create({
      question: 'Should we allow work from home twice a week?',
      options: [
        { text: 'Yes, 2 days WFH per week', votes: [alice._id, eve._id] },
        { text: 'Yes, but only 1 day',      votes: []                   },
        { text: 'No, fully in-office',       votes: []                   },
        { text: 'Flexible — employee choice', votes: [carol._id]         },
      ],
      createdBy: sec._id,
      isActive: true,
    });
    console.log('📊 Created demo poll');

    console.log('\n✨ Seed complete! Demo accounts:');
    console.log('   staff@demo.com         / password123');
    console.log('   secretariat@demo.com   / password123');
    console.log('   casemanager@demo.com   / password123');
    console.log('   admin@demo.com         / password123');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();