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
      from: `"Kushagra Bhumitra FPO" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
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

    // Beautiful agriculture-themed HTML email template
    const htmlTemplate = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Kushagra FPO - Verification Code</title>
  <style>
    @media only screen and (max-width: 600px) {
      .main-table { width: 100% !important; }
      .content-padding { padding: 30px 20px !important; }
      .header-padding { padding: 35px 20px !important; }
      .otp-code { font-size: 36px !important; letter-spacing: 12px !important; }
      .title { font-size: 24px !important; }
      .feature-box { display: block !important; width: 100% !important; margin-bottom: 10px !important; }
      .feature-cell { display: block !important; width: 100% !important; padding: 8px 0 !important; }
      .footer-padding { padding: 30px 20px !important; }
      .contact-table td { display: block !important; width: 100% !important; border-right: none !important; padding: 15px 0 !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; }
      .contact-table td:last-child { border-bottom: none !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(180deg, #f0fdf4 0%, #ecfccb 100%); min-height: 100vh;">
  
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        
        <!-- Main Container -->
        <table role="presentation" class="main-table" style="max-width: 520px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 20px; box-shadow: 0 20px 50px rgba(34, 197, 94, 0.15); overflow: hidden;">
          
          <!-- Top Border -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #22c55e, #84cc16, #22c55e);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td class="header-padding" style="padding: 40px 30px 35px; text-align: center; background: linear-gradient(145deg, #15803d 0%, #166534 100%);">
              
              <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: rgba(255,255,255,0.15); border-radius: 50%; line-height: 80px; border: 3px solid rgba(255,255,255,0.3);">
                <span style="font-size: 40px;">🌾</span>
              </div>
              
              <h1 class="title" style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800;">
                Kushagra FPO
              </h1>
              <p style="margin: 8px 0 0; color: #bbf7d0; font-size: 14px; font-weight: 600;">
                Verification Code | सत्यापन कोड
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="content-padding" style="padding: 40px 35px;">
              
              <!-- Greeting -->
              <div style="text-align: center; margin-bottom: 25px;">
                <p style="margin: 0; color: #15803d; font-size: 20px; font-weight: 700;">
                  🙏 Namaste!
                </p>
                <p style="margin: 10px 0 0; color: #4b5563; font-size: 14px; line-height: 1.7;">
                  Apne account ko verify karne ke liye neeche diya gaya code use karein।
                </p>
              </div>

              <!-- OTP Box -->
              <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 2px solid #22c55e; border-radius: 16px; padding: 25px; text-align: center; margin-bottom: 25px;">
                
                <p style="margin: 0 0 15px; color: #166534; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">
                  🔐 Your OTP Code
                </p>
                
                <div class="otp-code" style="font-size: 42px; font-weight: 900; letter-spacing: 16px; color: #15803d; font-family: 'Courier New', monospace; padding-left: 16px;">
                  ${otp}
                </div>
                
                <p style="margin: 15px 0 0; color: #16a34a; font-size: 12px; font-weight: 600;">
                  Valid for 10 minutes only | केवल 10 मिनट के लिए
                </p>
              </div>

              <!-- Warning -->
              <div style="background: #fef3c7; border-radius: 12px; padding: 15px 18px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
                  ⚠️ <strong>Yeh code kisi ko na batayein!</strong> Kushagra FPO kabhi phone pe code nahi mangta।
                </p>
              </div>

              <!-- Security Tips -->
              <div style="background: #f9fafb; border-radius: 12px; padding: 18px;">
                <p style="margin: 0 0 12px; color: #374151; font-size: 13px; font-weight: 700;">
                  🛡️ Security Tips:
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.8;">
                  ✓ OTP share na karein<br>
                  ✓ Fake calls se bachein<br>
                  ✓ Sirf kushagrafpo.in use karein
                </p>
              </div>

              <!-- Didn't Request -->
              <div style="margin-top: 25px; text-align: center;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                  Agar aapne yeh request nahi ki, toh is email ko ignore karein।
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer-padding" style="padding: 30px 35px; background: linear-gradient(145deg, #15803d, #14532d); text-align: center;">
              
              <p style="margin: 0 0 15px; color: #ffffff; font-size: 18px; font-weight: 800;">
                🌾 Kushagra FPO
              </p>
              
              <p style="margin: 0 0 20px; color: #bbf7d0; font-size: 12px;">
                Kisan Ki Seva, Desh Ki Seva
              </p>
              
              <!-- Contact -->
              <table role="presentation" class="contact-table" style="width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.1); border-radius: 10px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px; text-align: center; border-right: 1px solid rgba(255,255,255,0.2);">
                    <p style="margin: 0; color: #ffffff; font-size: 13px;">📞 +91-XXXXXXXXXX</p>
                  </td>
                  <td style="padding: 12px; text-align: center;">
                    <p style="margin: 0; color: #ffffff; font-size: 13px;">🌐 kushagrafpo.in</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 11px; line-height: 1.6;">
                © ${new Date().getFullYear()} Kushagra FPO. All rights reserved.<br>
                🇮🇳 Made for Indian Farmers
              </p>
              
            </td>
          </tr>

        </table>

        <!-- Bottom Links -->
        <table role="presentation" style="max-width: 520px; width: 100%; margin-top: 15px;">
          <tr>
            <td style="text-align: center; padding: 10px;">
              <p style="margin: 0; color: #9ca3af; font-size: 10px;">
                <a href="https://kushagrafpo.in" style="color: #16a34a; text-decoration: none;">Website</a> • 
                <a href="https://kushagrafpo.in/privacy" style="color: #16a34a; text-decoration: none;">Privacy</a> • 
                <a href="https://kushagrafpo.in/terms" style="color: #16a34a; text-decoration: none;">Terms</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `;

    // Send email using your email utility
    const emailSent = await sendEmailService(
      email,
      "🔐 Your Kushagra Bhumitra FPO Verification Code",
      htmlTemplate,
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
