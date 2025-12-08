import Farmer from "../model/Farmer.model.js";
import Employee from "../model/Employee.model.js";
import OTP from "../model/Otp.model.js";
import transporter from "./emailservice.js";

// Generate Farmer ID
const generateFarmerId = async () => {
  try {
    // Count total farmers
    const totalFarmers = await Farmer.countDocuments();

    // Base prefix and year
    const prefix = "SGB";
    const year = new Date().getFullYear();

    // Start number = total farmers + 1
    let nextNumber = totalFarmers + 1;
    let formattedNumber = String(nextNumber).padStart(6, "0");

    let newFarmerId = `${prefix}${year}${formattedNumber}`;

    // Ensure generated ID is unique
    let exists = await Farmer.findOne({ farmerId: newFarmerId });

    while (exists) {
      nextNumber++;
      formattedNumber = String(nextNumber).padStart(6, "0");
      newFarmerId = `${prefix}${year}${formattedNumber}`;
      exists = await Farmer.findOne({ farmerId: newFarmerId });
    }

    return newFarmerId;
  } catch (error) {
    console.error("Error generating farmer ID:", error.message);
    throw new Error("Failed to generate Farmer ID");
  }
};

// Generate Employee ID
const generateEmployeeId = async () => {
  try {
    // Count total employees
    const totalEmployees = await Employee.countDocuments();

    // Base prefix and year
    const prefix = "EMP";
    const year = new Date().getFullYear();

    // Start number = total employees + 1
    let nextNumber = totalEmployees + 1;
    let formattedNumber = String(nextNumber).padStart(6, "0");

    let newEmployeeId = `${prefix}${year}${formattedNumber}`;

    // Ensure generated ID is unique
    let exists = await Employee.findOne({ employeeId: newEmployeeId });

    while (exists) {
      nextNumber++;
      formattedNumber = String(nextNumber).padStart(6, "0");
      newEmployeeId = `${prefix}${year}${formattedNumber}`;
      exists = await Employee.findOne({ employeeId: newEmployeeId });
    }

    return newEmployeeId;
  } catch (error) {
    console.error("Error generating employee ID:", error.message);
    throw new Error("Failed to generate Employee ID");
  }
};

//send Email
const sendEmailService = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"Grain Bank" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html 
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};

// Send OTP via Email
const sendEmailOTP = async (email) => {
  try {
    // Remove any existing OTP for this email
    await OTP.deleteOne({ email });

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 10‑minute expiry
    await OTP.create({
      email,
      otp,
      expiry: new Date(Date.now() + 10 * 60 * 1000), // 10 min expiry
    });

    // Beautiful responsive HTML email template
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your OTP Code</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 480px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0;">
                  <div style="width: 70px; height: 70px; margin: 0 auto 20px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <img src="https://img.icons8.com/fluency/96/lock-2.png" alt="Security" style="width: 40px; height: 40px;" />
                  </div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                    Verification Code
                  </h1>
                  <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.85); font-size: 14px;">
                    Grain Bank Security
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 25px; color: #4a5568; font-size: 15px; line-height: 1.6; text-align: center;">
                    Hello! We received a request to verify your identity. Use the code below to complete your verification:
                  </p>

                  <!-- OTP Code Box -->
                  <div style="background: linear-gradient(135deg, #f6f8fb 0%, #eef1f5 100%); border: 2px dashed #d1d9e6; border-radius: 12px; padding: 25px; text-align: center; margin: 0 0 25px;">
                    <p style="margin: 0 0 8px; color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                      Your OTP Code
                    </p>
                    <div style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #667eea; font-family: 'Courier New', monospace; padding-left: 12px;">
                      ${otp}
                    </div>
                  </div>

                  <!-- Timer Warning -->
                  <div style="background-color: #fff8e6; border-left: 4px solid #f6ad55; border-radius: 0 8px 8px 0; padding: 15px 20px; margin: 0 0 25px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="width: 30px; vertical-align: top;">
                          <span style="font-size: 18px;">⏱️</span>
                        </td>
                        <td style="vertical-align: top;">
                          <p style="margin: 0; color: #c05621; font-size: 13px; font-weight: 600;">
                            This code expires in 10 minutes
                          </p>
                          <p style="margin: 5px 0 0; color: #975a16; font-size: 12px;">
                            Don't share this code with anyone.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Security Note -->
                  <div style="background-color: #f0fff4; border-radius: 8px; padding: 15px 20px; text-align: center;">
                    <p style="margin: 0; color: #276749; font-size: 12px;">
                      🔒 If you didn't request this code, please ignore this email or contact support immediately.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 25px 40px; background-color: #f8fafc; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="text-align: center;">
                        <p style="margin: 0 0 10px; color: #718096; font-size: 13px; font-weight: 600;">
                          Grain Bank
                        </p>
                        <p style="margin: 0 0 15px; color: #a0aec0; font-size: 11px;">
                          Secure • Reliable • Trusted
                        </p>
                        <div style="margin: 0 0 15px;">
                          <a href="#" style="display: inline-block; margin: 0 8px; color: #667eea; text-decoration: none;">
                            <img src="https://img.icons8.com/fluency/32/facebook-new.png" alt="Facebook" style="width: 24px; height: 24px;" />
                          </a>
                          <a href="#" style="display: inline-block; margin: 0 8px; color: #667eea; text-decoration: none;">
                            <img src="https://img.icons8.com/fluency/32/twitter.png" alt="Twitter" style="width: 24px; height: 24px;" />
                          </a>
                          <a href="#" style="display: inline-block; margin: 0 8px; color: #667eea; text-decoration: none;">
                            <img src="https://img.icons8.com/fluency/32/instagram-new.png" alt="Instagram" style="width: 24px; height: 24px;" />
                          </a>
                        </div>
                        <p style="margin: 0; color: #cbd5e0; font-size: 10px;">
                          © ${new Date().getFullYear()} Grain Bank. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>

            <!-- Help Text -->
            <p style="margin: 25px 0 0; color: #a0aec0; font-size: 11px; text-align: center;">
              Need help? Contact us at <a href="mailto:support@grainbank.com" style="color: #667eea; text-decoration: none;">support@grainbank.com</a>
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    // Send email using your email utility
    const emailSent = await sendEmailService(
      email,
      "🔐 Your Grain Bank Verification Code",
      htmlTemplate
    );

    if (!emailSent) {
      throw new Error("Failed to send OTP email");
    }

    return otp;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP");
  }
};

export { generateFarmerId, generateEmployeeId, sendEmailOTP };
