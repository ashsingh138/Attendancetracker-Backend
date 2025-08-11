const cron = require('node-cron');
const webpush = require('web-push');
const User = require('./models/user.model');
const Test = require('./models/test.model');
const Assignment = require('./models/assignment.model');
const Subject = require('./models/subject.model');

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

    // --- 1. Check for Upcoming Tests ---
    const testNotificationWindows = [ { minutes: 30, label: 'in 30 minutes' }, { minutes: 60, label: 'in 1 hour' }, { minutes: 360, label: 'in 6 hours' }, { minutes: 1440, label: 'in 1 day' }];
    for (const window of testNotificationWindows) {
        const startTime = new Date(now.getTime() + (window.minutes * 60000) - 30000); 
        const endTime = new Date(now.getTime() + (window.minutes * 60000) + 30000);
        const upcomingTests = await Test.find({ test_datetime: { $gte: startTime, $lte: endTime }, status: 'Pending' }).populate('user_id');
        for (const test of upcomingTests) {
            if (test.user_id && test.user_id.notification_preferences.tests) {
                const payload = JSON.stringify({ title: `Test Reminder: ${test.test_name}`, body: `Your test is scheduled ${window.label}!` });
                test.user_id.push_subscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(err => console.error("Error sending test notification:", err.statusCode)));
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
            if (assignment.user_id && assignment.user_id.notification_preferences.assignments) {
                const payload = JSON.stringify({ title: `Assignment Reminder: ${assignment.assignment_name}`, body: `Your assignment is due ${window.label}!` });
                assignment.user_id.push_subscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(err => console.error("Error sending assignment notification:", err.statusCode)));
            }
        }
    }

    // --- 3. Check for Upcoming Classes ---
    const classNotificationTime = 10; // 10 minutes before
    const classStartTime = new Date(now.getTime() + (classNotificationTime * 60000));
    const dayOfWeekNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const targetDay = dayOfWeekNames[classStartTime.getDay()];
    const targetTime = classStartTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const subjectsWithUpcomingClasses = await Subject.find({ "schedule.day": targetDay, "schedule.start_time": targetTime }).populate('user_id');
    for (const subject of subjectsWithUpcomingClasses) {
        if (subject.user_id && subject.user_id.notification_preferences.classes) {
            const payload = JSON.stringify({ title: `Class Reminder: ${subject.subject_code}`, body: `Your ${subject.subject_name} class is starting in 10 minutes!` });
            subject.user_id.push_subscriptions.forEach(sub => webpush.sendNotification(sub, payload).catch(err => console.error("Error sending class notification:", err.statusCode)));
        }
    }
};