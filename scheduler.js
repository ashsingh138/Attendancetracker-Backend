const cron = require('node-cron');
const webpush = require('web-push');
const { Resend } = require('resend');
const User = require('./models/user.model');
const Test = require('./models/test.model');
const Assignment = require('./models/assignment.model');
const Subject = require('./models/subject.model');
const { getTestEmailHtml, getAssignmentEmailHtml, getClassEmailHtml } = require('./emailTemplates');

// Initialize Resend with your API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// This function is called by server.js to start the scheduler
exports.start = () => {
  // Configure web-push with your VAPID keys
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'test@example.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  // Schedule the task to run once every minute
  cron.schedule('* * * * *', checkAndSendNotifications);
  console.log('Notification scheduler started. Will run every minute.');
};

// This is the main function that performs the checks
const checkAndSendNotifications = async () => {
    const now = new Date();

    // --- 1. Check for Upcoming Tests ---
    const testNotificationWindows = [ { minutes: 30, label: 'in 30 minutes' }, { minutes: 60, label: 'in 1 hour' }, { minutes: 360, label: 'in 6 hours' }, { minutes: 1440, label: 'in 1 day' }];
    for (const window of testNotificationWindows) {
        const startTime = new Date(now.getTime() + (window.minutes * 60000) - 30000); 
        const endTime = new Date(now.getTime() + (window.minutes * 60000) + 30000);
        const upcomingTests = await Test.find({ test_datetime: { $gte: startTime, $lte: endTime }, status: 'Pending' }).populate('user_id');
        
        for (const test of upcomingTests) {
            if (!test.user_id) continue;
            const user = test.user_id;

            // Check push preference specifically
            if (user.notification_preferences?.tests?.push) {
                const payload = JSON.stringify({ title: `Test Reminder: ${test.test_name}`, body: `Your test is scheduled ${window.label}!` });
                user.push_subscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(err => console.error("Error sending push notification:", err.statusCode)));
            }
            // Check email preference specifically
            if (user.notification_preferences?.tests?.email) {
                resend.emails.send({
                    from: process.env.EMAIL_FROM,
                    to: user.email,
                    subject: `Test Reminder: ${test.test_name}`,
                    html: getTestEmailHtml(test.test_name, window.label),
                }).catch(err => console.error("Error sending email via Resend:", err));
            }
        }
    }

    // --- 2. Check for Upcoming Assignments ---
    const assignmentNotificationWindows = [ { minutes: 60, label: 'in 1 hour' }, { minutes: 180, label: 'in 3 hours' }, { minutes: 1440, label: 'in 1 day' }];
    for (const window of assignmentNotificationWindows) {
        const startTime = new Date(now.getTime() + (window.minutes * 60000) - 30000);
        const endTime = new Date(now.getTime() + (window.minutes * 60000) + 30000);
        const upcomingAssignments = await Assignment.find({ deadline: { $gte: startTime, $lte: endTime }, status: 'Pending' }).populate('user_id');

        for (const assignment of upcomingAssignments) {
            if (!assignment.user_id) continue;
            const user = assignment.user_id;

            if (user.notification_preferences?.assignments?.push) {
                const payload = JSON.stringify({ title: `Assignment Reminder: ${assignment.assignment_name}`, body: `Your assignment is due ${window.label}!` });
                user.push_subscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(err => console.error("Error sending push notification:", err.statusCode)));
            }
            if (user.notification_preferences?.assignments?.email) {
                 resend.emails.send({
                    from: process.env.EMAIL_FROM,
                    to: user.email,
                    subject: `Assignment Reminder: ${assignment.assignment_name}`,
                    html: getAssignmentEmailHtml(assignment.assignment_name, window.label),
                }).catch(err => console.error("Error sending email via Resend:", err));
            }
        }
    }

    // --- 3. Check for Upcoming Classes ---
    const classNotificationTime = 10;
    const classStartTime = new Date(now.getTime() + (classNotificationTime * 60000));
    const dayOfWeekNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const targetDay = dayOfWeekNames[classStartTime.getDay()];
    const targetTime = classStartTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const subjectsWithUpcomingClasses = await Subject.find({ "schedule.day": targetDay, "schedule.start_time": targetTime }).populate('user_id');
    for (const subject of subjectsWithUpcomingClasses) {
        if (!subject.user_id) continue;
        const user = subject.user_id;

        if (user.notification_preferences?.classes?.push) {
            const payload = JSON.stringify({ title: `Class Reminder: ${subject.subject_code}`, body: `Your ${subject.subject_name} class is starting in 10 minutes!` });
            user.push_subscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(err => console.error("Error sending push notification:", err.statusCode)));
        }
        if (user.notification_preferences?.classes?.email) {
            resend.emails.send({
                from: process.env.EMAIL_FROM,
                to: user.email,
                subject: `Class Reminder: ${subject.subject_code}`,
                html: getClassEmailHtml(subject.subject_code, subject.subject_name),
            }).catch(err => console.error("Error sending email via Resend:", err));
        }
    }
};
