import nodemailer from "nodemailer";

export const sendMail = async (to, subject, message) => {
  try {
    //! Mail Transporter
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_SMTP_HOST,
      port: process.env.MAILTRAP_SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAILTRAP_SMTP_USER,
        pass: process.env.MAILTRAP_SMTP_PASS,
      },
    });

    //! Mail Info
    const info = await transporter.sendMail({
      from: "No Reply @inngest",
      to: to,
      subject: subject,
      text: message, // plain‑text body
      //   html: "<b>Hello world?</b>", //TODO-add later
    });

    console.log("✅Mail Send Success", info.messageId);
    return info;
  } catch (error) {
    console.log(
      `❌ Failed to execute sendMail function ERROR=> ${error.message}`
    );
    throw error;
  }
};
