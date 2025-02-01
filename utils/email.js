const nodemailer = require('nodemailer');
const getEmailTemplate = require('./emailTemplates');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (options) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    await transporter.sendMail(mailOptions);
};

const sendPaymentStatusEmail = async (user, status) => {
    const subjects = {
        pending: 'Payment Pending - Global Heritage Pageant Registration',
        processing: 'Payment Processing - Global Heritage Pageant',
        approved: 'Welcome to Global Heritage Pageant - Payment Approved!',
        rejected: 'Payment Status Update - Global Heritage Pageant'
    };

    const emailHtml = getEmailTemplate(status, {
        name: user.name,
        amount: user.paymentAmount,
        paymentId: user.paymentId,
        paymentNotes: user.paymentNotes
    });

    await sendEmail({
        email: user.email,
        subject: subjects[status],
        html: emailHtml,
        message: `Payment status: ${status}` // Fallback plain text
    });
};

const sendCompetitionRegistrationEmail = async (user) => {
    const emailHtml = getEmailTemplate('competitionRegistration', {
        name: user.name,
        category: user.competitionRegistration.category,
        registrationDate: new Date().toLocaleDateString()
    });

    await sendEmail({
        email: user.email,
        subject: 'Competition Registration Confirmed - Global Heritage Pageant',
        html: emailHtml,
        message: 'Your competition registration has been confirmed'
    });
};

module.exports = {
    sendEmail,
    sendPaymentStatusEmail,
    sendCompetitionRegistrationEmail
}; 