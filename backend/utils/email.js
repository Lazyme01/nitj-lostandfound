const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Test connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter error:', error.message);
  } else {
    console.log('Email server ready');
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"NITJ Lost & Found" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email error name:', error.name);
    console.error('Email error message:', error.message);
    console.error('Email error code:', error.code);
    return false;
  }
};

const notifyAllUsersOfNewPost = async (post, poster, users) => {
  const batchSize = 10;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    await Promise.all(batch.map(user =>
      sendEmail({
        to: user.email,
        subject: `New Found Item: ${post.title} [${post.category}] - NITJ Lost & Found`,
        html: newPostEmailTemplate(post, poster),
      })
    ));
    if (i + batchSize < users.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
};

const newPostEmailTemplate = (post, poster) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px; text-align: center; }
    .header h1 { color: #f59e0b; margin: 0; font-size: 22px; letter-spacing: 2px; }
    .header p { color: #94a3b8; margin: 8px 0 0; font-size: 13px; }
    .body { padding: 32px; }
    .badge { display: inline-block; background: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
    .title { font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px; }
    .description { color: #64748b; line-height: 1.6; margin-bottom: 20px; }
    .info-row { display: flex; gap: 8px; margin-bottom: 8px; }
    .info-label { font-weight: 600; color: #374151; min-width: 100px; }
    .info-val { color: #6b7280; }
    .cta { display: block; text-align: center; background: #f59e0b; color: #1a1a2e; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; margin: 24px 0; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NITJ LOST & FOUND</h1>
      <p>National Institute of Technology, Jalandhar</p>
    </div>
    <div class="body">
      <div class="badge">${post.category}</div>
      <div class="title">${post.title}</div>
      <div class="description">${post.description}</div>
      <div class="info-row">
        <span class="info-label">Posted by:</span>
        <span class="info-val">${poster.name} (${poster.rollNo || poster.email})</span>
      </div>
      ${post.location ? `<div class="info-row"><span class="info-label">Location:</span><span class="info-val">${post.location}</span></div>` : ''}
      <a href="${process.env.FRONTEND_URL}/posts/${post._id}" class="cta">View Post & Contact Finder</a>
      <p style="font-size:13px;color:#94a3b8;text-align:center;">This post will expire in 7 days.</p>
    </div>
    <div class="footer">
      NIT Jalandhar Lost & Found Portal &bull; Do not reply to this email.
    </div>
  </div>
</body>
</html>
`;

module.exports = { sendEmail, notifyAllUsersOfNewPost, newPostEmailTemplate };