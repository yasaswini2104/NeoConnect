import cron from 'node-cron';
import Complaint from '../models/Complaint.js';

function getWorkingDaysBetween(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current < end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++; 
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export const startEscalationCron = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('🔔 Running escalation check...');
    try {
      const now = new Date();

      const complaints = await Complaint.find({
        status: { $in: ['Assigned', 'In Progress'] },
        assignedAt: { $exists: true },
      }).populate('assignedTo', 'name email');

      for (const complaint of complaints) {
        const referenceDate = complaint.lastResponseAt || complaint.assignedAt;
        const workingDays = getWorkingDaysBetween(referenceDate, now);

        if (workingDays >= 7 && !complaint.escalationReminderSent) {
          complaint.escalationReminderSent = true;
          await complaint.save();
          console.log(`📧 Reminder flag set for complaint ${complaint.trackingId}`);
        } else if (workingDays >= 14 && complaint.status !== 'Escalated') {
          complaint.status = 'Escalated';
          complaint.escalatedAt = now;
          await complaint.save();
          console.log(`🚨 Escalated complaint ${complaint.trackingId}`);
        }
      }

      console.log(`Escalation check complete. Processed ${complaints.length} complaints.`);
    } catch (err) {
      console.error('Escalation cron error:', err);
    }
  });

  console.log('⏰ Escalation cron started (runs daily at 8:00 AM)');
};
