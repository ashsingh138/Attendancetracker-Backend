// /src/emailTemplates.js

/**
 * Generates HTML for a test reminder email.
 * @param {string} testName - The name of the test.
 * @param {string} timeLabel - A string like 'in 1 hour'.
 * @returns {string} HTML content for the email.
 */
exports.getTestEmailHtml = (testName, timeLabel) => {
  return `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2>Test Reminder: ${testName}</h2>
      <p>This is a reminder that your test, <strong>${testName}</strong>, is scheduled ${timeLabel}.</p>
      <p>Good luck with your preparation!</p>
    </div>
  `;
};

/**
 * Generates HTML for an assignment reminder email.
 * @param {string} assignmentName - The name of the assignment.
 * @param {string} timeLabel - A string like 'in 3 hours'.
 * @returns {string} HTML content for the email.
 */
exports.getAssignmentEmailHtml = (assignmentName, timeLabel) => {
  return `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2>Assignment Due Soon: ${assignmentName}</h2>
      <p>This is a reminder that your assignment, <strong>${assignmentName}</strong>, is due ${timeLabel}.</p>
      <p>Don't forget to submit it on time!</p>
    </div>
  `;
};

/**
 * Generates HTML for a class reminder email.
 * @param {string} subjectCode - The code for the subject.
 * @param {string} subjectName - The name of the subject.
 * @returns {string} HTML content for the email.
 */
exports.getClassEmailHtml = (subjectCode, subjectName) => {
  return `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2>Class Reminder: ${subjectName}</h2>
      <p>Your class, <strong>${subjectCode} - ${subjectName}</strong>, is starting in 10 minutes.</p>
    </div>
  `;
};