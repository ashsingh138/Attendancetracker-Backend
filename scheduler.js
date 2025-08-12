const cron = require('node-cron');
const webpush = require('web-push');
const { Resend } = require('resend');
const User = require('./models/user.model');
const Test = require('./models/test.model');
const Assignment = require('./models/assignment.model');
const Subject = require('./models/subject.model');
const { getTestEmailHtml, getAssignmentEmailHtml, getClassEmailHtml } = require('./emailTemplates');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.start = () => {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'test@example.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  cron.schedule('* * * * *', checkAndSendNotifications);
  console.log('Notification scheduler started. Will run every minute.');
};

const checkAndSendNotifications = async () => {
    const now = new Date();
    console.log(`[${now.toUTCString()}] --- Running Notification Check ---`);

    // --- 1. Check for Upcoming Tests ---
    const testNotificationWindows = [ { minutes: 30, label: 'in 30 minutes' }, { minutes: 60, label: 'in 1 hour' }, { minutes: 360, label: 'in 6 hours' }, { minutes: 1440, label: 'in 1 day' }];
    for (const window of testNotificationWindows) {
        const startTime = new Date(now.getTime() + (window.minutes * 60000) - 30000); 
        const endTime = new Date(now.getTime() + (window.minutes * 60000) + 30000);
        console.log(`[Tests] Checking for window: ${window.label}. Time range: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
        
        const upcomingTests = await Test.find({ test_datetime: { $gte: startTime, $lte: endTime }, status: 'Pending' }).populate('user_id');
        if (upcomingTests.length > 0) {
            console.log(`[Tests] Found ${upcomingTests.length} test(s) for the ${window.label} window.`);
            for (const test of upcomingTests) {
                if (!test.user_id) continue;
                const user = test.user_id;
                console.log(`[Tests] Processing test "${test.test_name}" for user ${user.email}`);

                if (user.notification_preferences?.tests?.push) {
                    const payload = JSON.stringify({ title: `Test Reminder: ${test.test_name}`, body: `Your test is scheduled ${window.label}!` });
                    user.push_subscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(err => console.error("Error sending push:", err.statusCode)));
                }
                if (user.notification_preferences?.tests?.email) {
                    resend.emails.send({
                        from: process.env.EMAIL_FROM, to: user.email, subject: `Test Reminder: ${test.test_name}`, html: getTestEmailHtml(test.test_name, window.label),
                    }).catch(err => console.error("Error sending email:", err));
                }
            }
        }
    }

    // --- 2. Check for Upcoming Assignments ---
    const assignmentNotificationWindows = [ { minutes: 60, label: 'in 1 hour' }, { minutes: 180, label: 'in 3 hours' }, { minutes: 1440, label: 'in 1 day' }];
    for (const window of assignmentNotificationWindows) {
        const startTime = new Date(now.getTime() + (window.minutes * 60000) - 30000);
        const endTime = new Date(now.getTime() + (window.minutes * 60000) + 30000);
        console.log(`[Assignments] Checking for window: ${window.label}. Time range: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);

        const upcomingAssignments = await Assignment.find({ deadline: { $gte: startTime, $lte: endTime }, status: 'Pending' }).populate('user_id');
        if (upcomingAssignments.length > 0) {
            console.log(`[Assignments] Found ${upcomingAssignments.length} assignment(s) for the ${window.label} window.`);
            for (const assignment of upcomingAssignments) {
                if (!assignment.user_id) continue;
                const user = assignment.user_id;
                console.log(`[Assignments] Processing assignment "${assignment.assignment_name}" for user ${user.email}`);

                if (user.notification_preferences?.assignments?.push) {
                    const payload = JSON.stringify({ title: `Assignment Reminder: ${assignment.assignment_name}`, body: `Your assignment is due ${window.label}!` });
                    user.push_subscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(err => console.error("Error sending push:", err.statusCode)));
                }
                if (user.notification_preferences?.assignments?.email) {
                     resend.emails.send({
                        from: process.env.EMAIL_FROM, to: user.email, subject: `Assignment Reminder: ${assignment.assignment_name}`, html: getAssignmentEmailHtml(assignment.assignment_name, window.label),
                    }).catch(err => console.error("Error sending email:", err));
                }
            }
        }
    }
    console.log(`--- Notification Check Complete ---`);
};