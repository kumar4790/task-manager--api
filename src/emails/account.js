const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'admin@whynotgoogleit.com',
    subject: `Welcome Mr. ${name}`,
    text: 'We are very happy to see you with us. Thank you for joining!',
  });
};

const sendCancelEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'admin@whynotgoogleit.com',
    subject: `Good bye, ${name}`,
    text: 'Thank you to being with us. We hope to see you soon.',
  });
};

module.exports = { sendWelcomeEmail, sendCancelEmail };
