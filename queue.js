const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const webpush = require('web-push');
const { Resend } = require('resend');
const User = require('./models/user.model');
const { getTestEmailHtml, getAssignmentEmailHtml, getClassEmailHtml } = require('./emailTemplates');

const resend = new Resend(process.env.RESEND_API_KEY);

const connection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null
});

const notificationQueue = new Queue('notifications', { connection });

// --- Worker Logic ---
const notificationWorker = new Worker('notifications', async job => {
  const { type, data } = job.data;
  console.log(`[Worker] Processing job ${job.name} of type: ${type}`);
  
  const user = await User.findById(data.userId);
  if (!user) {
    console.error(`[Worker] User not found for ID: ${data.userId}. Skipping job.`);
    return;
  }
  
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  
  switch (type) {
    case 'test':
      if (user.notification_preferences?.tests?.push) {
        const payload = JSON.stringify({ title: `Test Reminder: ${data.testName}`, body: `Your test is scheduled ${data.label}!` });
        user.push_subscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(err => console.error(`Push failed for test: ${err.statusCode}`)));
      }
      if (user.notification_preferences?.tests?.email) {
        resend.emails.send({
            from: process.env.EMAIL_FROM, to: user.email, subject: `Test Reminder: ${data.testName}`, html: getTestEmailHtml(data.testName, data.label),
        }).catch(err => console.error("Email failed for test:", err));
      }
      break;
      
    case 'assignment':
      if (user.notification_preferences?.assignments?.push) {
          const payload = JSON.stringify({ title: `Assignment Reminder: ${data.assignmentName}`, body: `Your assignment is due ${data.label}!` });
          user.push_subscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(err => console.error(`Push failed for assignment: ${err.statusCode}`)));
      }
      if (user.notification_preferences?.assignments?.email) {
            resend.emails.send({
            from: process.env.EMAIL_FROM, to: user.email, subject: `Assignment Reminder: ${data.assignmentName}`, html: getAssignmentEmailHtml(data.assignmentName, data.label),
          }).catch(err => console.error("Email failed for assignment:", err));
      }
      break;

    case 'class':
      if (user.notification_preferences?.classes?.push) {
          const payload = JSON.stringify({ title: `Class Reminder: ${data.subjectName}`, body: `Your class (${data.subjectCode}) starts in 10 minutes.` });
          user.push_subscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(err => console.error(`Push failed for class: ${err.statusCode}`)));
      }
      if (user.notification_preferences?.classes?.email) {
          resend.emails.send({
            from: process.env.EMAIL_FROM, to: user.email, subject: `Class Reminder: ${data.subjectName}`, html: getClassEmailHtml(data.subjectCode, data.subjectName),
          }).catch(err => console.error("Email failed for class:", err));
      }
      break;
  }
}, { connection });

console.log('✅ Notification worker started successfully.');

notificationWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed with error: ${err.message}`);
});

// --- Job Management Functions ---

const addNotificationJob = async (type, data, options) => {
  if (options.delay > 0) {
    await notificationQueue.add(data.jobName, { type, data }, options);
    console.log(`[Queue] Scheduled job '${data.jobName}' to run in ${Math.round(options.delay/1000/60)} minutes.`);
  }
};

const removeJobsByPattern = async (pattern) => {
    const jobs = await notificationQueue.getJobs(['delayed']);
    const jobsToRemove = jobs.filter(job => job.name.startsWith(pattern));
    
    if (jobsToRemove.length > 0) {
        console.log(`[Queue] Removing ${jobsToRemove.length} jobs with pattern: ${pattern}`);
        await Promise.all(jobsToRemove.map(job => job.remove()));
    }
};

const addClassNotificationJobs = async (subject) => {
    const pattern = `class-${subject._id}-`;
    await removeJobsByPattern(pattern); // Clear old jobs for this subject first

    const days = { "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 };

    subject.schedule.forEach(slot => {
        const [hour, minute] = slot.start_time.split(':');
        const cron = `${minute - 10} ${hour} * * ${days[slot.day]}`; // 10 minutes before class
        
        const jobData = {
            jobName: `class-${subject._id}-${slot.day}-${slot.start_time}`,
            userId: subject.user_id,
            subjectName: subject.subject_name,
            subjectCode: subject.subject_code,
        };

        notificationQueue.add(jobData.jobName, { type: 'class', data: jobData }, {
            repeat: { cron },
            jobId: jobData.jobName // Use a predictable ID to prevent duplicates
        });
        console.log(`[Queue] Scheduled recurring class job for ${subject.subject_code} on ${slot.day} at ${slot.start_time}. Cron: ${cron}`);
    });
};

module.exports = { addNotificationJob, removeJobsByPattern, addClassNotificationJobs };