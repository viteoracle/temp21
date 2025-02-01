const getEmailTemplate = (type, data) => {
    const baseTemplate = (content) => `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Global Heritage Pageant</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    padding: 20px 0;
                    border-bottom: 2px solid #f0f0f0;
                }
                .logo {
                    max-width: 200px;
                    height: auto;
                }
                .content {
                    padding: 20px 0;
                }
                .button {
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #4CAF50;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    padding-top: 20px;
                    border-top: 2px solid #f0f0f0;
                    color: #666;
                    font-size: 12px;
                }
                .status-badge {
                    display: inline-block;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: bold;
                    margin: 10px 0;
                }
                .status-pending { background-color: #ffd700; color: #000; }
                .status-processing { background-color: #87ceeb; color: #000; }
                .status-approved { background-color: #90EE90; color: #000; }
                .status-rejected { background-color: #ffcccb; color: #000; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://yourwebsite.com/logo.png" alt="Global Heritage Pageant" class="logo">
                </div>
                ${content}
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Global Heritage Pageant. All rights reserved.</p>
                    <p>If you have any questions, please contact us at support@globalheritagepeageant.com</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const templates = {
        pending: (data) => baseTemplate(`
            <div class="content">
                <h2>Payment Pending</h2>
                <p>Dear ${data.name},</p>
                <div class="status-badge status-pending">Status: Pending</div>
                <p>Your registration for Global Heritage Pageant requires payment to be completed.</p>
                <p>Payment Details:</p>
                <ul>
                    <li>Amount: $${data.amount}</li>
                    <li>Reference ID: ${data.paymentId}</li>
                </ul>
                <a href="https://yourwebsite.com/payment" class="button">Complete Payment</a>
                <p>If you've already made the payment, please ignore this email.</p>
            </div>
        `),

        processing: (data) => baseTemplate(`
            <div class="content">
                <h2>Payment Processing</h2>
                <p>Dear ${data.name},</p>
                <div class="status-badge status-processing">Status: Processing</div>
                <p>We have received your payment submission and it is currently being processed.</p>
                <p>Payment Details:</p>
                <ul>
                    <li>Amount: $${data.amount}</li>
                    <li>Payment ID: ${data.paymentId}</li>
                    <li>Submission Date: ${new Date().toLocaleDateString()}</li>
                </ul>
                <p>We will notify you once your payment has been approved.</p>
            </div>
        `),

        approved: (data) => baseTemplate(`
            <div class="content">
                <h2>Payment Approved!</h2>
                <p>Dear ${data.name},</p>
                <div class="status-badge status-approved">Status: Approved</div>
                <p>Congratulations! Your payment has been approved.</p>
                <p>Payment Details:</p>
                <ul>
                    <li>Amount: $${data.amount}</li>
                    <li>Payment ID: ${data.paymentId}</li>
                    <li>Approval Date: ${new Date().toLocaleDateString()}</li>
                </ul>
                <div style="text-align: center; margin: 30px 0;">
                    <p style="font-size: 18px; font-weight: bold;">Ready to Complete Your Beauty Competition Registration?</p>
                    <p>Click the button below to fill out your competition details and submit your entry.</p>
                    <a href="${process.env.FRONTEND_URL}/competition/register?token=${data.registrationToken}" 
                       class="button" 
                       style="background-color: #ff69b4;">
                        Complete Competition Registration
                    </a>
                </div>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <h3 style="color: #333;">Next Steps:</h3>
                    <ol style="color: #555;">
                        <li>Complete your competition profile</li>
                        <li>Upload your photos</li>
                        <li>Submit your biography</li>
                        <li>Choose your competition category</li>
                    </ol>
                </div>
                <p style="margin-top: 20px; color: #666;">
                    <strong>Note:</strong> Please complete your registration within 7 days of receiving this email.
                </p>
            </div>
        `),

        rejected: (data) => baseTemplate(`
            <div class="content">
                <h2>Payment Status Update</h2>
                <p>Dear ${data.name},</p>
                <div class="status-badge status-rejected">Status: Rejected</div>
                <p>Unfortunately, we couldn't process your payment due to the following reason:</p>
                <p><strong>${data.paymentNotes || 'Payment verification failed'}</strong></p>
                <p>Please contact our support team for assistance or try submitting your payment again.</p>
                <a href="https://yourwebsite.com/support" class="button">Contact Support</a>
            </div>
        `),

        competitionRegistration: (data) => baseTemplate(`
            <div class="content">
                <h2>Competition Registration Confirmed!</h2>
                <p>Dear ${data.name},</p>
                <div class="status-badge" style="background-color: #9370db; color: white;">Registration Complete</div>
                <p>Your registration for the Global Heritage Pageant has been successfully completed!</p>
                <p>Registration Details:</p>
                <ul>
                    <li>Category: ${data.category}</li>
                    <li>Registration Date: ${data.registrationDate}</li>
                </ul>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <h3 style="color: #333;">Important Information:</h3>
                    <ul style="color: #555;">
                        <li>Competition Date: [Insert Date]</li>
                        <li>Venue: [Insert Venue]</li>
                        <li>Reporting Time: [Insert Time]</li>
                    </ul>
                </div>
                <a href="${process.env.FRONTEND_URL}/competition/dashboard" class="button">
                    View Competition Details
                </a>
                <p style="margin-top: 20px; color: #666;">
                    <strong>Note:</strong> Please keep this email for your records. Additional information will be sent closer to the event date.
                </p>
            </div>
        `)
    };

    return templates[type](data);
};

module.exports = getEmailTemplate; 