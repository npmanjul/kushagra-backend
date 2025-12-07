import Employee from "../model/Employee.model.js";
import User from "../model/Users.model.js";
import { encryptPassword } from "../utils/bcrypt.js";
import { generateEmployeeId } from "../utils/miscellaneous.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
  extractPublicId,
} from "../utils/cloudinary.js";

/* ------------ Step 1: Account Setup ------------ */
const employee_onboarding_step_1 = async (req, res) => {
  try {
 

    const {
      role,
      name,
      phone_number,
      secondary_phone_number,
      email,
      gender,
      dob,
    } = req.body;

    const employee = await User.findOne({
      $or: [{ email }, { phone_number }],
    });

    if (employee) {
      const empId= await Employee.findOne({ user: employee._id });
      return res
        .status(400)
        .json({
          message: "Employee already exists",
          step_completed: employee.step_completed,
          id: empId._id,
        });
    }

    const generatePassword = () => {
      const passwordLength = 12;
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=";
      let password = "";
      for (let i = 0; i < passwordLength; i++) {
        password += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      return password;
    };

    const generatePin = () => {
      return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit PIN
    };

    const password = await encryptPassword(generatePassword());
    const pin = await encryptPassword(generatePin());

    const newUser = await User.create({
      name,
      email,
      phone_number,
      password: password,
      secondary_phone_number,
      role,
      gender,
      dob,
      account_pin: pin,
      step_completed: 1,
    });

    const employeeProfile = await Employee.create({
      user: newUser._id,
      employeeId: await generateEmployeeId(),
    });

    await User.findByIdAndUpdate(newUser._id, {
      employeeProfile: employeeProfile._id,
    });

    res.status(200).json({
      message: "Step 1 data saved successfully",
      id: employeeProfile._id,
      currentStep: newUser.step_completed,
    });
  } catch (error) {
    console.error("Error saving step 1 data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ------------ Step 2: Personal Info ------------ */
const employee_onboarding_step_2 = async (req, res) => {
  try {
    const reportingManager = req.user?.userId;

    const user = await User.findById(reportingManager);
    if (!user) {
      return res.status(404).json({ message: "Reporting manager not found" });
    }
    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admin can perform this operation" });
    }

    const { id, maritalStatus, nationality, bloodGroup } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Employee id is required" });
    }

    const employeeProfile = await Employee.findById(id);
    if (!employeeProfile) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    // Use employee name for default avatar (fallback if name not present)
    const avatarName =
      employeeProfile.fullName ||
      `${employeeProfile.firstName || ""} ${employeeProfile.lastName || ""}`.trim() ||
      "Employee";

    const defaultImageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      avatarName
    )}&background=random&size=256`;

    
    const uploadedFile =
      req.file ||
      (req.files?.employeeImage && req.files.employeeImage[0]) ||
      null;

    let employeeImageUrl = employeeProfile.employeeImage || defaultImageUrl;

    if (uploadedFile) {
      try {
        const uploadResult = await uploadOnCloudinary(
          uploadedFile.path 
        );

        if (uploadResult?.secure_url) {
          const newUrl = uploadResult.secure_url;

          if (
            employeeProfile.employeeImage &&
            employeeProfile.employeeImage.includes("res.cloudinary.com")
          ) {
            const publicId = extractPublicId(employeeProfile.employeeImage);
            if (publicId) {
              try {
                await deleteFromCloudinary(publicId);
              } catch (err) {
                console.warn("Failed to delete old image:", err.message);
              }
            }
          }

          employeeImageUrl = newUrl;
        } else {
          console.warn("Cloudinary upload failed: no secure_url in response");
        }
      } catch (err) {
        console.error("Error uploading image to Cloudinary:", err);
      }
    }


    // ----- Update Employee Profile -----
    await Employee.findByIdAndUpdate(
      employeeProfile._id,
      {
        employeeImage: employeeImageUrl || defaultImageUrl,
        maritalStatus,
        nationality,
        bloodGroup,
      },
      { new: true }
    );

    const updateUser = await User.findByIdAndUpdate(
      employeeProfile.user,
      {
        step_completed: 2,
      },
      { new: true }
    );

    res.status(200).json({
      message: "Personal info data saved successfully and step 2 completed",
      step_completed: updateUser.step_completed,
    });
  } catch (error) {
    console.error("Error saving personal info data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ------------ Step 3: Address Info ------------ */
const employee_onboarding_step_3 = async (req, res) => {
  try {
    const reportingManager = req.user?.userId;

    const user = await User.findById(reportingManager);
    if (!user) {
      return res.status(404).json({ message: "Reporting manager not found" });
    }

    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admin can perform this operation" });
    }

    const {
      permanentAddress,
      currentAddress,
      sameAsPermanent = false,
      id,
    } = req.body || {};

    if (!id) {
      return res
        .status(400)
        .json({ message: "Bad Request: employee id is required" });
    }

    const employeeProfile = await Employee.findById(id);
    if (!employeeProfile) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    // Basic input check: at least permanentAddress must be provided,
    // or sameAsPermanent true with a permanentAddress.
    if (
      !permanentAddress &&
      !sameAsPermanent &&
      !employeeProfile.permanentAddress
    ) {
      return res.status(400).json({
        message:
          "Bad Request: provide permanentAddress or set sameAsPermanent (or ensure a permanentAddress already exists for this employee).",
      });
    }

    // If sameAsPermanent is true, ensure we have a permanent address to copy
    let finalPermanent =
      permanentAddress || employeeProfile.permanentAddress || null;
    let finalCurrent = currentAddress || employeeProfile.currentAddress || null;

    if (sameAsPermanent) {
      if (!finalPermanent) {
        return res.status(400).json({
          message:
            "Bad Request: sameAsPermanent true but permanentAddress not provided or present on profile.",
        });
      }
      finalCurrent = { ...finalPermanent };
    }

    // sanitize/normalize address objects to only allowed keys
    const allowedKeys = [
      "line1",
      "line2",
      "city",
      "state",
      "country",
      "postalCode",
    ];
    const sanitize = (addr) => {
      if (!addr) return undefined;
      const out = {};
      allowedKeys.forEach((k) => {
        if (typeof addr[k] !== "undefined" && addr[k] !== null)
          out[k] = addr[k];
      });
      if (!out.country) out.country = "India";
      return out;
    };

    finalPermanent = sanitize(finalPermanent);
    finalCurrent = sanitize(finalCurrent);

    // Determine step_completed: set to 3 if current stored step is less than 3
    const storedStep = Number.isFinite(employeeProfile.step_completed)
      ? employeeProfile.step_completed
      : 0;
    const step_completed = storedStep < 3 ? 3 : storedStep;

    // Build update object
    const update = {
      ...(finalPermanent ? { permanentAddress: finalPermanent } : {}),
      ...(finalCurrent ? { currentAddress: finalCurrent } : {}),
      sameAsPermanent: !!sameAsPermanent,
      step_completed,
    };

    // Update employee document
    const updatedEmployee = await Employee.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
      context: "query",
    });

    if (!updatedEmployee) {
      return res.status(404).json({
        message: "Failed to update: employee not found after update attempt",
      });
    }

    const updateUser = await User.findByIdAndUpdate(
      employeeProfile.user,
      {
        step_completed: 3,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Address data saved successfully and step 3 completed",
      step_completed: updateUser.step_completed,
    });
  } catch (error) {
    console.error("Error saving address data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ------------ Step 4: Employment ------------ */
const employee_onboarding_step_4 = async (req, res) => {
  try {
    const reportingManager = req.user?.userId;

    const user = await User.findById(reportingManager);
    if (!user) {
      return res.status(404).json({ message: "Reporting manager not found" });
    }

    if (user.role != "admin") {
      return res
        .status(403)
        .json({ message: "Admins cannot perform this action" });
    }

    const {
      id,

      // Salary & Bank
      salary,
      account_number,
      ifsc_code,
      account_holder,
      bank_name,
      branch_name,
      upiId,

      // Govt IDs
      panNumber,
      aadhaarNumber,
      passportNumber,
      passportExpiry,
      pfNumber,
      esiNumber,
      taxStatus,
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Employee id is required" });
    }

    const updateData = {
      reportingManager: reportingManager,

      salary,
      account_number,
      ifsc_code,
      account_holder,
      bank_name,
      branch_name,
      upiId,

      panNumber,
      aadhaarNumber,
      passportNumber,
      passportExpiry: passportExpiry ? new Date(passportExpiry) : undefined,
      pfNumber,
      esiNumber,
      taxStatus,
    };

    // Remove undefined fields to avoid overwriting
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const updated = await Employee.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const updateUser = await User.findByIdAndUpdate(
      updated.user,
      {
        step_completed: 4,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Employment data saved successfully and step 4 completed",
      step_completed: updateUser.step_completed,
    });
  } catch (error) {
    console.error("Error saving employment data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ------------ Step 5: Education ------------ */
const employee_onboarding_step_5 = async (req, res) => {
  try {
    const reportingManager = req.user?.userId;

    const user = await User.findById(reportingManager);
    if (!user) {
      return res.status(404).json({ message: "Reporting manager not found" });
    }

    if (user.role != "admin") {
      return res
        .status(403)
        .json({ message: "Admins cannot perform this action" });
    }

    const { id, education, certifications } = req.body;

    if (!education || !certifications) {
      return res
        .status(400)
        .json({ message: "Education & certifications are required" });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      {
        education,
        certifications,
      },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      updatedEmployee.user,
      {
        step_completed: 5,
      },
      { new: true }
    );

    res.status(200).json({
      message: "Education data saved successfully and step 5 completed",
      step_completed: updatedUser.step_completed,
    });
  } catch (error) {
    console.error("Error saving education data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ------------ Step 6: Experience ------------ */
const employee_onboarding_step_6 = async (req, res) => {
  try {
    const reportingManager = req.user?.userId;
    if (!reportingManager) {
      return res.status(401).json({ message: "Unauthorized: missing user" });
    }

    const user = await User.findById(reportingManager);
    if (!user) {
      return res.status(404).json({ message: "Reporting manager not found" });
    }

    // allow only admin
    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can perform this action" });
    }

    const { id, experience, totalExperienceYears } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Employee profile id (id) is required" });
    }

    // minimal validation: require experience and totalExperienceYears
    if (
      !experience ||
      !Array.isArray(experience) ||
      typeof totalExperienceYears === "undefined"
    ) {
      return res.status(400).json({
        message:
          "experience (array) and totalExperienceYears (number) are required",
      });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      {
        experience,
        totalExperienceYears,
      },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    // mark user step completed = 6
    const updatedUser = await User.findByIdAndUpdate(
      updatedEmployee.user,
      { step_completed: 6 },
      { new: true }
    );

    res.status(200).json({
      message: "Experience data saved successfully and step 6 completed",
      step_completed: updatedUser.step_completed,
    });
  } catch (error) {
    console.error("Error saving experience data (step 6):", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ------------ Step 7: Additional ------------ */
const employee_onboarding_step_7 = async (req, res) => {
  try {
    const reportingManager = req.user?.userId;
    if (!reportingManager) {
      return res.status(401).json({ message: "Unauthorized: missing user" });
    }

    const user = await User.findById(reportingManager);
    if (!user) {
      return res.status(404).json({ message: "Reporting manager not found" });
    }

    // allow only admin
    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can perform this action" });
    }

    const {
      id,
      skills,
      medicalConditions,
      emergencyContacts,
      hrNotes,
      backgroundCheckStatus,
    } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Employee profile id (id) is required" });
    }

    // minimal validation
    if (typeof skills !== "undefined" && !Array.isArray(skills)) {
      return res.status(400).json({ message: "skills must be an array" });
    }

    if (
      typeof emergencyContacts !== "undefined" &&
      !Array.isArray(emergencyContacts)
    ) {
      return res
        .status(400)
        .json({ message: "emergencyContacts must be an array" });
    }

    // validate enum for backgroundCheckStatus if provided
    const allowedStatus = ["Pending", "Clear", "Failed"];
    if (
      typeof backgroundCheckStatus !== "undefined" &&
      !allowedStatus.includes(backgroundCheckStatus)
    ) {
      return res.status(400).json({
        message: `backgroundCheckStatus must be one of: ${allowedStatus.join(
          ", "
        )}`,
      });
    }

    // prepare update object (only set fields that were provided)
    const updateFields = {};
    if (typeof skills !== "undefined") updateFields.skills = skills;
    if (typeof medicalConditions !== "undefined")
      updateFields.medicalConditions = medicalConditions;
    if (typeof emergencyContacts !== "undefined")
      updateFields.emergencyContacts = emergencyContacts;
    if (typeof hrNotes !== "undefined") updateFields.hrNotes = hrNotes;
    if (typeof backgroundCheckStatus !== "undefined")
      updateFields.backgroundCheckStatus = backgroundCheckStatus;
    if (typeof onboardingCompleted !== "undefined")
      updateFields.onboardingCompleted = onboardingCompleted;

    const updatedEmployee = await Employee.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    // mark user step completed = 7
    const updatedUser = await User.findByIdAndUpdate(
      updatedEmployee.user,
      { step_completed: 7 },
      { new: true }
    );

    res.status(200).json({
      message:
        "Additional data (step 7) saved successfully and step 7 completed",
      step_completed: updatedUser.step_completed,
    });
  } catch (error) {
    console.error("Error saving additional data (step 7):", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export {
  employee_onboarding_step_1,
  employee_onboarding_step_2,
  employee_onboarding_step_3,
  employee_onboarding_step_4,
  employee_onboarding_step_5,
  employee_onboarding_step_6,
  employee_onboarding_step_7,
};
