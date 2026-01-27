import Employee from "../model/Employee.model.js";
import User from "../model/Users.model.js";
import Warehouse from "../model/Warehouses.model.js";
import { encryptPassword } from "../utils/bcrypt.js";
import { generateEmployeeId } from "../utils/miscellaneous.js";

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

    const userId = req.user?.userId;

    const user = await User.findById(userId);
    if (user.role !== "admin") {
      return res.status(400).json({ message: "Only admin can perform this operation" });
    }

    const employee = await User.findOne({
      $or: [{ email }, { phone_number }],
    });

    if (employee) {
      const empId = await Employee.findOne({ user: employee._id });
      return res.status(400).json({
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

    const { id, employeeImage, maritalStatus, nationality, bloodGroup } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Employee id is required" });
    }

    const employeeProfile = await Employee.findById(id);
    if (!employeeProfile) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    // Get employee name for default avatar (fallback if name not present)
    const employeeUser = await User.findById(employeeProfile.user);
    const avatarName = employeeUser?.name || "Employee";

    const defaultImageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      avatarName
    )}&background=random&size=256`;

    // Use the S3 public URL from the request body, or fallback to existing image or default
    let employeeImageUrl = employeeImage || employeeProfile.employeeImage || defaultImageUrl;

    // ----- Update Employee Profile -----
    await Employee.findByIdAndUpdate(
      employeeProfile._id,
      {
        employeeImage: employeeImageUrl,
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

const getManagerDetails = async (req, res) => {
  try {
    const { managerId } = req.query;
    const requestingUserId = req.user?.userId;

    if (!requestingUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get requesting user to check role
    const requestingUser = await User.findById(requestingUserId).select("role");
    if (!requestingUser) {
      return res.status(404).json({
        success: false,
        message: "Requesting user not found",
      });
    }

    // Only admin can view any manager, others can only view their own details
    let targetManagerId = managerId;
    if (!["admin"].includes(requestingUser.role)) {
      // Non-admin users can only view their own details if they are a manager
      if (requestingUser.role !== "manager") {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only admins and managers can access manager details.",
        });
      }
      targetManagerId = requestingUserId; // Force to view own details
    }

    if (!targetManagerId) {
      return res.status(400).json({
        success: false,
        message: "Manager ID is required",
      });
    }

    // Fetch manager's user details with employee profile populated
    const managerUser = await User.findById(targetManagerId)
      .select("-password -account_pin")
      .populate({
        path: "employeeProfile",
        populate: {
          path: "reportingManager",
          select: "employeeId employeeImage",
        },
      })
      .lean();

    if (!managerUser) {
      return res.status(404).json({
        success: false,
        message: "Manager not found",
      });
    }

    if (managerUser.role !== "manager") {
      return res.status(400).json({
        success: false,
        message: "User is not a manager",
      });
    }

    // Get warehouse assignment for this manager
    // Try matching by User._id and EmployeeProfile._id
    const employeeProfileId = managerUser.employeeProfile?._id;

    const warehouse = await Warehouse.findOne({
      $or: [{ manager_id: targetManagerId }, { manager_id: employeeProfileId }],
    })
      .select("_id name location capacity_quintal created_at")
      .lean();

    // Get reporting manager's user details if exists
    let reportingManagerDetails = null;
    if (managerUser.employeeProfile?.reportingManager) {
      const reportingManagerProfile = await Employee.findById(
        managerUser.employeeProfile.reportingManager
      )
        .populate({
          path: "user",
          select: "name phone_number email",
        })
        .lean();

      if (reportingManagerProfile?.user) {
        reportingManagerDetails = {
          _id: reportingManagerProfile.user._id,
          name: reportingManagerProfile.user.name,
          phone: reportingManagerProfile.user.phone_number,
          email: reportingManagerProfile.user.email,
          employee_id: reportingManagerProfile.employeeId,
          photo: reportingManagerProfile.employeeImage,
        };
      }
    }

    // Build comprehensive response
    const response = {
      // User Details
      _id: managerUser._id,
      name: managerUser.name,
      phone_number: managerUser.phone_number,
      secondary_phone_number: managerUser.secondary_phone_number,
      email: managerUser.email,
      gender: managerUser.gender,
      dob: managerUser.dob,
      role: managerUser.role,
      is_active: managerUser.is_active ?? true,
      registration_date: managerUser.registration_date,
      step_completed: managerUser.step_completed,

      // Employee Profile Details
      employee_id: managerUser.employeeProfile?.employeeId || null,
      employee_profile_id: managerUser.employeeProfile?._id || null,
      photo: managerUser.employeeProfile?.employeeImage || null,

      // Personal Info
      marital_status: managerUser.employeeProfile?.maritalStatus || null,
      nationality: managerUser.employeeProfile?.nationality || null,
      blood_group: managerUser.employeeProfile?.bloodGroup || null,

      // Address
      permanent_address: managerUser.employeeProfile?.permanentAddress || null,
      current_address: managerUser.employeeProfile?.currentAddress || null,
      same_as_permanent: managerUser.employeeProfile?.sameAsPermanent || false,

      // Employment Details
      employment_type: managerUser.employeeProfile?.employmentType || null,
      date_of_joining: managerUser.employeeProfile?.dateOfJoining || null,
      employment_status: managerUser.employeeProfile?.employmentStatus || null,
      salary: managerUser.employeeProfile?.salary || null,

      // Bank Details
      bank_details: {
        account_number: managerUser.employeeProfile?.account_number || null,
        ifsc_code: managerUser.employeeProfile?.ifsc_code || null,
        account_holder: managerUser.employeeProfile?.account_holder || null,
        bank_name: managerUser.employeeProfile?.bank_name || null,
        branch_name: managerUser.employeeProfile?.branch_name || null,
        upi_id: managerUser.employeeProfile?.upiId || null,
      },

      // Government IDs
      govt_ids: {
        pan_number: managerUser.employeeProfile?.panNumber || null,
        aadhaar_number: managerUser.employeeProfile?.aadhaarNumber || null,
        passport_number: managerUser.employeeProfile?.passportNumber || null,
        passport_expiry: managerUser.employeeProfile?.passportExpiry || null,
        pf_number: managerUser.employeeProfile?.pfNumber || null,
        esi_number: managerUser.employeeProfile?.esiNumber || null,
        tax_status: managerUser.employeeProfile?.taxStatus || null,
      },

      // Education & Experience
      education: managerUser.employeeProfile?.education || [],
      certifications: managerUser.employeeProfile?.certifications || [],
      experience: managerUser.employeeProfile?.experience || [],
      total_experience_years:
        managerUser.employeeProfile?.totalExperienceYears || 0,

      // Skills & Additional
      skills: managerUser.employeeProfile?.skills || [],
      medical_conditions:
        managerUser.employeeProfile?.medicalConditions || null,
      emergency_contacts: managerUser.employeeProfile?.emergencyContacts || [],
      hr_notes: managerUser.employeeProfile?.hrNotes || null,
      background_check_status:
        managerUser.employeeProfile?.backgroundCheckStatus || "Pending",
      onboarding_completed:
        managerUser.employeeProfile?.onboardingCompleted || false,

      // Reporting Manager
      reporting_manager: reportingManagerDetails,

      // Warehouse Assignment
      is_engaged: !!warehouse,
      warehouse: warehouse
        ? {
          _id: warehouse._id,
          name: warehouse.name,
          location: warehouse.location,
          capacity_quintal: warehouse.capacity_quintal,
          created_at: warehouse.created_at,
        }
        : null,

      // Timestamps
      created_at:
        managerUser.employeeProfile?.createdAt || managerUser.created_at,
      updated_at:
        managerUser.employeeProfile?.updatedAt || managerUser.updated_at,
    };

    return res.status(200).json({
      success: true,
      message: "Manager details fetched successfully",
      data: response,
    });
  } catch (error) {
    console.error("Error fetching manager details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateManagerDetails = async (req, res) => {
  try {
    const { managerId } = req.query;
    const requestingUserId = req.user?.userId;

    if (!requestingUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get requesting user to check role
    const requestingUser = await User.findById(requestingUserId).select("role");
    if (!requestingUser) {
      return res.status(404).json({
        success: false,
        message: "Requesting user not found",
      });
    }

    // Determine target manager ID based on role
    let targetManagerId = managerId;
    const isAdmin = requestingUser.role === "admin";

    if (!isAdmin) {
      // Non-admin can only update their own details if they are a manager
      if (requestingUser.role !== "manager") {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only admins and managers can update manager details.",
        });
      }
      targetManagerId = requestingUserId; // Force to update own details
    }

    if (!targetManagerId) {
      return res.status(400).json({
        success: false,
        message: "Manager ID is required",
      });
    }

    // Fetch manager user with employee profile
    const managerUser = await User.findById(targetManagerId).populate(
      "employeeProfile"
    );
    if (!managerUser) {
      return res.status(404).json({
        success: false,
        message: "Manager not found",
      });
    }

    if (managerUser.role !== "manager") {
      return res.status(400).json({
        success: false,
        message: "User is not a manager",
      });
    }

    const employeeProfile = managerUser.employeeProfile;
    if (!employeeProfile) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found for this manager",
      });
    }

    // Extract fields from request body
    const {
      // User model fields
      name,
      phone_number,
      secondary_phone_number,
      email,
      gender,
      dob,
      is_active,

      // Employee Profile fields - Personal Info
      maritalStatus,
      nationality,
      bloodGroup,

      // Address
      permanentAddress,
      currentAddress,
      sameAsPermanent,

      // Employment
      employmentType,
      dateOfJoining,
      employmentStatus,
      salary,

      // Bank Details
      account_number,
      ifsc_code,
      account_holder,
      bank_name,
      branch_name,
      upiId,

      // Government IDs
      panNumber,
      aadhaarNumber,
      passportNumber,
      passportExpiry,
      pfNumber,
      esiNumber,
      taxStatus,

      // Skills & Additional
      skills,
      medicalConditions,
      emergencyContacts,
      hrNotes,
      backgroundCheckStatus,

      // S3 Image URL (uploaded from frontend)
      employeeImage,
    } = req.body;

    // Build User update object (only changed fields)
    const userUpdateFields = {};

    // Fields that managers can update themselves
    const selfUpdateUserFields = [
      "name",
      "secondary_phone_number",
      "gender",
      "dob",
    ];
    // Fields only admin can update
    const adminOnlyUserFields = ["phone_number", "email", "is_active"];

    if (name !== undefined) userUpdateFields.name = name;
    if (secondary_phone_number !== undefined)
      userUpdateFields.secondary_phone_number = secondary_phone_number;
    if (gender !== undefined) userUpdateFields.gender = gender;
    if (dob !== undefined) userUpdateFields.dob = dob;

    // Admin-only fields
    if (isAdmin) {
      if (phone_number !== undefined)
        userUpdateFields.phone_number = phone_number;
      if (email !== undefined) userUpdateFields.email = email;
      if (is_active !== undefined) userUpdateFields.is_active = is_active;
    }

    // Build Employee Profile update object
    const employeeUpdateFields = {};

    // Fields managers can update themselves
    if (maritalStatus !== undefined)
      employeeUpdateFields.maritalStatus = maritalStatus;
    if (nationality !== undefined)
      employeeUpdateFields.nationality = nationality;
    if (bloodGroup !== undefined) employeeUpdateFields.bloodGroup = bloodGroup;
    if (permanentAddress !== undefined)
      employeeUpdateFields.permanentAddress = permanentAddress;
    if (currentAddress !== undefined)
      employeeUpdateFields.currentAddress = currentAddress;
    if (sameAsPermanent !== undefined)
      employeeUpdateFields.sameAsPermanent = sameAsPermanent;
    if (skills !== undefined) employeeUpdateFields.skills = skills;
    if (medicalConditions !== undefined)
      employeeUpdateFields.medicalConditions = medicalConditions;
    if (emergencyContacts !== undefined)
      employeeUpdateFields.emergencyContacts = emergencyContacts;

    // Bank details - self update allowed
    if (account_number !== undefined)
      employeeUpdateFields.account_number = account_number;
    if (ifsc_code !== undefined) employeeUpdateFields.ifsc_code = ifsc_code;
    if (account_holder !== undefined)
      employeeUpdateFields.account_holder = account_holder;
    if (bank_name !== undefined) employeeUpdateFields.bank_name = bank_name;
    if (branch_name !== undefined)
      employeeUpdateFields.branch_name = branch_name;
    if (upiId !== undefined) employeeUpdateFields.upiId = upiId;

    // Government IDs - self update allowed
    if (panNumber !== undefined) employeeUpdateFields.panNumber = panNumber;
    if (aadhaarNumber !== undefined)
      employeeUpdateFields.aadhaarNumber = aadhaarNumber;
    if (passportNumber !== undefined)
      employeeUpdateFields.passportNumber = passportNumber;
    if (passportExpiry !== undefined)
      employeeUpdateFields.passportExpiry = new Date(passportExpiry);
    if (pfNumber !== undefined) employeeUpdateFields.pfNumber = pfNumber;
    if (esiNumber !== undefined) employeeUpdateFields.esiNumber = esiNumber;
    if (taxStatus !== undefined) employeeUpdateFields.taxStatus = taxStatus;

    // Admin-only employee fields
    if (isAdmin) {
      if (employmentType !== undefined)
        employeeUpdateFields.employmentType = employmentType;
      if (dateOfJoining !== undefined)
        employeeUpdateFields.dateOfJoining = new Date(dateOfJoining);
      if (employmentStatus !== undefined)
        employeeUpdateFields.employmentStatus = employmentStatus;
      if (salary !== undefined) employeeUpdateFields.salary = salary;
      if (hrNotes !== undefined) employeeUpdateFields.hrNotes = hrNotes;
      if (backgroundCheckStatus !== undefined)
        employeeUpdateFields.backgroundCheckStatus = backgroundCheckStatus;
    }

    // Check if there are any updates to make
    if (
      Object.keys(userUpdateFields).length === 0 &&
      Object.keys(employeeUpdateFields).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    // Handle employee image - use S3 URL from body
    if (employeeImage) {
      employeeUpdateFields.employeeImage = employeeImage;
    }

    // Update User model
    let updatedUser = managerUser;
    if (Object.keys(userUpdateFields).length > 0) {
      updatedUser = await User.findByIdAndUpdate(
        targetManagerId,
        { $set: userUpdateFields },
        { new: true, runValidators: true }
      ).select("-password -account_pin");
    }

    // Update Employee Profile
    let updatedEmployee = employeeProfile;
    if (Object.keys(employeeUpdateFields).length > 0) {
      employeeUpdateFields.updatedAt = new Date();
      updatedEmployee = await Employee.findByIdAndUpdate(
        employeeProfile._id,
        { $set: employeeUpdateFields },
        { new: true, runValidators: true }
      );
    }

    // Track what was updated
    const updatedFields = [
      ...Object.keys(userUpdateFields),
      ...Object.keys(employeeUpdateFields),
    ];

    return res.status(200).json({
      success: true,
      message: "Manager details updated successfully",
      updated_fields: updatedFields,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone_number: updatedUser.phone_number,
        is_active: updatedUser.is_active,
        employee_id: updatedEmployee.employeeId,
        photo: updatedEmployee.employeeImage,
      },
    });
  } catch (error) {
    console.error("Error updating manager details:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists. Please use a different value.`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getSupervisorDetails = async (req, res) => {
  try {
    const { supervisorId } = req.query;
    const requestingUserId = req.user?.userId;

    if (!requestingUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get requesting user to check role
    const requestingUser = await User.findById(requestingUserId).select("role");
    if (!requestingUser) {
      return res.status(404).json({
        success: false,
        message: "Requesting user not found",
      });
    }

    // Only admin can view any supervisor, others can only view their own details
    let targetSupervisorId = supervisorId;
    if (!["admin"].includes(requestingUser.role)) {
      // Non-admin users can only view their own details if they are a supervisor
      if (requestingUser.role !== "supervisor") {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only admins and supervisors can access supervisor details.",
        });
      }
      targetSupervisorId = requestingUserId; // Force to view own details
    }

    if (!targetSupervisorId) {
      return res.status(400).json({
        success: false,
        message: "Supervisor ID is required",
      });
    }

    // Fetch supervisor's user details with employee profile populated
    const supervisorUser = await User.findById(targetSupervisorId)
      .select("-password -account_pin")
      .populate({
        path: "employeeProfile",
        populate: {
          path: "reportingManager",
          select: "employeeId employeeImage",
        },
      })
      .lean();

    if (!supervisorUser) {
      return res.status(404).json({
        success: false,
        message: "Supervisor not found",
      });
    }

    if (supervisorUser.role !== "supervisor") {
      return res.status(400).json({
        success: false,
        message: "User is not a supervisor",
      });
    }

    // Get warehouse assignment for this supervisor
    const employeeProfileId = supervisorUser.employeeProfile?._id;

    const warehouse = await Warehouse.findOne({
      $or: [{ supervisor_id: targetSupervisorId }, { supervisor_id: employeeProfileId }],
    })
      .select("_id name location capacity_quintal created_at")
      .lean();

    // Get reporting manager's user details if exists
    let reportingManagerDetails = null;
    if (supervisorUser.employeeProfile?.reportingManager) {
      const reportingManagerProfile = await Employee.findById(
        supervisorUser.employeeProfile.reportingManager
      )
        .populate({
          path: "user",
          select: "name phone_number email",
        })
        .lean();

      if (reportingManagerProfile?.user) {
        reportingManagerDetails = {
          _id: reportingManagerProfile.user._id,
          name: reportingManagerProfile.user.name,
          phone: reportingManagerProfile.user.phone_number,
          email: reportingManagerProfile.user.email,
          employee_id: reportingManagerProfile.employeeId,
          photo: reportingManagerProfile.employeeImage,
        };
      }
    }

    // Build comprehensive response
    const response = {
      // User Details
      _id: supervisorUser._id,
      name: supervisorUser.name,
      phone_number: supervisorUser.phone_number,
      secondary_phone_number: supervisorUser.secondary_phone_number,
      email: supervisorUser.email,
      gender: supervisorUser.gender,
      dob: supervisorUser.dob,
      role: supervisorUser.role,
      is_active: supervisorUser.is_active ?? true,
      registration_date: supervisorUser.registration_date,
      step_completed: supervisorUser.step_completed,

      // Employee Profile Details
      employee_id: supervisorUser.employeeProfile?.employeeId || null,
      employee_profile_id: supervisorUser.employeeProfile?._id || null,
      photo: supervisorUser.employeeProfile?.employeeImage || null,

      // Personal Info
      marital_status: supervisorUser.employeeProfile?.maritalStatus || null,
      nationality: supervisorUser.employeeProfile?.nationality || null,
      blood_group: supervisorUser.employeeProfile?.bloodGroup || null,

      // Address
      permanent_address: supervisorUser.employeeProfile?.permanentAddress || null,
      current_address: supervisorUser.employeeProfile?.currentAddress || null,
      same_as_permanent: supervisorUser.employeeProfile?.sameAsPermanent || false,

      // Employment Details
      employment_type: supervisorUser.employeeProfile?.employmentType || null,
      date_of_joining: supervisorUser.employeeProfile?.dateOfJoining || null,
      employment_status: supervisorUser.employeeProfile?.employmentStatus || null,
      salary: supervisorUser.employeeProfile?.salary || null,

      // Bank Details
      bank_details: {
        account_number: supervisorUser.employeeProfile?.account_number || null,
        ifsc_code: supervisorUser.employeeProfile?.ifsc_code || null,
        account_holder: supervisorUser.employeeProfile?.account_holder || null,
        bank_name: supervisorUser.employeeProfile?.bank_name || null,
        branch_name: supervisorUser.employeeProfile?.branch_name || null,
        upi_id: supervisorUser.employeeProfile?.upiId || null,
      },

      // Government IDs
      govt_ids: {
        pan_number: supervisorUser.employeeProfile?.panNumber || null,
        aadhaar_number: supervisorUser.employeeProfile?.aadhaarNumber || null,
        passport_number: supervisorUser.employeeProfile?.passportNumber || null,
        passport_expiry: supervisorUser.employeeProfile?.passportExpiry || null,
        pf_number: supervisorUser.employeeProfile?.pfNumber || null,
        esi_number: supervisorUser.employeeProfile?.esiNumber || null,
        tax_status: supervisorUser.employeeProfile?.taxStatus || null,
      },

      // Education & Experience
      education: supervisorUser.employeeProfile?.education || [],
      certifications: supervisorUser.employeeProfile?.certifications || [],
      experience: supervisorUser.employeeProfile?.experience || [],
      total_experience_years: supervisorUser.employeeProfile?.totalExperienceYears || 0,

      // Skills & Additional
      skills: supervisorUser.employeeProfile?.skills || [],
      medical_conditions: supervisorUser.employeeProfile?.medicalConditions || null,
      emergency_contacts: supervisorUser.employeeProfile?.emergencyContacts || [],
      hr_notes: supervisorUser.employeeProfile?.hrNotes || null,
      background_check_status: supervisorUser.employeeProfile?.backgroundCheckStatus || "Pending",
      onboarding_completed: supervisorUser.employeeProfile?.onboardingCompleted || false,

      // Reporting Manager
      reporting_manager: reportingManagerDetails,

      // Warehouse Assignment
      is_engaged: !!warehouse,
      warehouse: warehouse
        ? {
          _id: warehouse._id,
          name: warehouse.name,
          location: warehouse.location,
          capacity_quintal: warehouse.capacity_quintal,
          created_at: warehouse.created_at,
        }
        : null,

      // Timestamps
      created_at: supervisorUser.employeeProfile?.createdAt || supervisorUser.created_at,
      updated_at: supervisorUser.employeeProfile?.updatedAt || supervisorUser.updated_at,
    };

    return res.status(200).json({
      success: true,
      message: "Supervisor details fetched successfully",
      data: response,
    });
  } catch (error) {
    console.error("Error fetching supervisor details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateSupervisorDetails = async (req, res) => {
  try {
    const { supervisorId } = req.query;
    const requestingUserId = req.user?.userId;

    if (!requestingUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get requesting user to check role
    const requestingUser = await User.findById(requestingUserId).select("role");
    if (!requestingUser) {
      return res.status(404).json({
        success: false,
        message: "Requesting user not found",
      });
    }

    // Determine target supervisor ID based on role
    let targetSupervisorId = supervisorId;
    const isAdmin = requestingUser.role === "admin";

    if (!isAdmin) {
      // Non-admin can only update their own details if they are a supervisor
      if (requestingUser.role !== "supervisor") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Only admins and supervisors can update supervisor details.",
        });
      }
      targetSupervisorId = requestingUserId; // Force to update own details
    }

    if (!targetSupervisorId) {
      return res.status(400).json({
        success: false,
        message: "Supervisor ID is required",
      });
    }

    // Fetch supervisor user with employee profile
    const supervisorUser = await User.findById(targetSupervisorId).populate("employeeProfile");
    if (!supervisorUser) {
      return res.status(404).json({
        success: false,
        message: "Supervisor not found",
      });
    }

    if (supervisorUser.role !== "supervisor") {
      return res.status(400).json({
        success: false,
        message: "User is not a supervisor",
      });
    }

    const employeeProfile = supervisorUser.employeeProfile;
    if (!employeeProfile) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found for this supervisor",
      });
    }

    // Extract fields from request body
    const {
      // User model fields
      name,
      phone_number,
      secondary_phone_number,
      email,
      gender,
      dob,
      is_active,

      // Employee Profile fields - Personal Info
      maritalStatus,
      nationality,
      bloodGroup,

      // Address
      permanentAddress,
      currentAddress,
      sameAsPermanent,

      // Employment
      employmentType,
      dateOfJoining,
      employmentStatus,
      salary,

      // Bank Details
      account_number,
      ifsc_code,
      account_holder,
      bank_name,
      branch_name,
      upiId,

      // Government IDs
      panNumber,
      aadhaarNumber,
      passportNumber,
      passportExpiry,
      pfNumber,
      esiNumber,
      taxStatus,

      // Skills & Additional
      skills,
      medicalConditions,
      emergencyContacts,
      hrNotes,
      backgroundCheckStatus,

      // S3 Image URL (uploaded from frontend)
      employeeImage,
    } = req.body;

    // Build User update object (only changed fields)
    const userUpdateFields = {};

    if (name !== undefined) userUpdateFields.name = name;
    if (secondary_phone_number !== undefined)
      userUpdateFields.secondary_phone_number = secondary_phone_number;
    if (gender !== undefined) userUpdateFields.gender = gender;
    if (dob !== undefined) userUpdateFields.dob = dob;

    // Admin-only fields
    if (isAdmin) {
      if (phone_number !== undefined) userUpdateFields.phone_number = phone_number;
      if (email !== undefined) userUpdateFields.email = email;
      if (is_active !== undefined) userUpdateFields.is_active = is_active;
    }

    // Build Employee Profile update object
    const employeeUpdateFields = {};

    // Fields supervisors can update themselves
    if (maritalStatus !== undefined) employeeUpdateFields.maritalStatus = maritalStatus;
    if (nationality !== undefined) employeeUpdateFields.nationality = nationality;
    if (bloodGroup !== undefined) employeeUpdateFields.bloodGroup = bloodGroup;
    if (permanentAddress !== undefined) employeeUpdateFields.permanentAddress = permanentAddress;
    if (currentAddress !== undefined) employeeUpdateFields.currentAddress = currentAddress;
    if (sameAsPermanent !== undefined) employeeUpdateFields.sameAsPermanent = sameAsPermanent;
    if (skills !== undefined) employeeUpdateFields.skills = skills;
    if (medicalConditions !== undefined) employeeUpdateFields.medicalConditions = medicalConditions;
    if (emergencyContacts !== undefined) employeeUpdateFields.emergencyContacts = emergencyContacts;

    // Bank details - self update allowed
    if (account_number !== undefined) employeeUpdateFields.account_number = account_number;
    if (ifsc_code !== undefined) employeeUpdateFields.ifsc_code = ifsc_code;
    if (account_holder !== undefined) employeeUpdateFields.account_holder = account_holder;
    if (bank_name !== undefined) employeeUpdateFields.bank_name = bank_name;
    if (branch_name !== undefined) employeeUpdateFields.branch_name = branch_name;
    if (upiId !== undefined) employeeUpdateFields.upiId = upiId;

    // Government IDs - self update allowed
    if (panNumber !== undefined) employeeUpdateFields.panNumber = panNumber;
    if (aadhaarNumber !== undefined) employeeUpdateFields.aadhaarNumber = aadhaarNumber;
    if (passportNumber !== undefined) employeeUpdateFields.passportNumber = passportNumber;
    if (passportExpiry !== undefined) employeeUpdateFields.passportExpiry = new Date(passportExpiry);
    if (pfNumber !== undefined) employeeUpdateFields.pfNumber = pfNumber;
    if (esiNumber !== undefined) employeeUpdateFields.esiNumber = esiNumber;
    if (taxStatus !== undefined) employeeUpdateFields.taxStatus = taxStatus;

    // Admin-only employee fields
    if (isAdmin) {
      if (employmentType !== undefined) employeeUpdateFields.employmentType = employmentType;
      if (dateOfJoining !== undefined) employeeUpdateFields.dateOfJoining = new Date(dateOfJoining);
      if (employmentStatus !== undefined) employeeUpdateFields.employmentStatus = employmentStatus;
      if (salary !== undefined) employeeUpdateFields.salary = salary;
      if (hrNotes !== undefined) employeeUpdateFields.hrNotes = hrNotes;
      if (backgroundCheckStatus !== undefined) employeeUpdateFields.backgroundCheckStatus = backgroundCheckStatus;
    }

    // Check if there are any updates to make
    if (
      Object.keys(userUpdateFields).length === 0 &&
      Object.keys(employeeUpdateFields).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    // Handle employee image - use S3 URL from body
    if (employeeImage) {
      employeeUpdateFields.employeeImage = employeeImage;
    }

    // Update User model
    let updatedUser = supervisorUser;
    if (Object.keys(userUpdateFields).length > 0) {
      updatedUser = await User.findByIdAndUpdate(
        targetSupervisorId,
        { $set: userUpdateFields },
        { new: true, runValidators: true }
      ).select("-password -account_pin");
    }

    // Update Employee Profile
    let updatedEmployee = employeeProfile;
    if (Object.keys(employeeUpdateFields).length > 0) {
      employeeUpdateFields.updatedAt = new Date();
      updatedEmployee = await Employee.findByIdAndUpdate(
        employeeProfile._id,
        { $set: employeeUpdateFields },
        { new: true, runValidators: true }
      );
    }

    // Track what was updated
    const updatedFields = [
      ...Object.keys(userUpdateFields),
      ...Object.keys(employeeUpdateFields),
    ];

    return res.status(200).json({
      success: true,
      message: "Supervisor details updated successfully",
      updated_fields: updatedFields,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone_number: updatedUser.phone_number,
        is_active: updatedUser.is_active,
        employee_id: updatedEmployee.employeeId,
        photo: updatedEmployee.employeeImage,
      },
    });
  } catch (error) {
    console.error("Error updating supervisor details:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists. Please use a different value.`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getStaffDetails = async (req, res) => {
  try {
    const { staffId } = req.query;
    const requestingUserId = req.user?.userId;

    if (!requestingUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get requesting user to check role
    const requestingUser = await User.findById(requestingUserId).select("role");
    if (!requestingUser) {
      return res.status(404).json({
        success: false,
        message: "Requesting user not found",
      });
    }

    // Only admin can view any staff, others can only view their own details
    let targetStaffId = staffId;
    if (!["admin"].includes(requestingUser.role)) {
      // Non-admin users can only view their own details if they are staff
      if (requestingUser.role !== "staff") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Only admins and staff can access staff details.",
        });
      }
      targetStaffId = requestingUserId; // Force to view own details
    }

    if (!targetStaffId) {
      return res.status(400).json({
        success: false,
        message: "Staff ID is required",
      });
    }

    // Fetch staff's user details with employee profile populated
    const staffUser = await User.findById(targetStaffId)
      .select("-password -account_pin")
      .populate({
        path: "employeeProfile",
        populate: {
          path: "reportingManager",
          select: "employeeId employeeImage",
        },
      })
      .lean();

    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    if (staffUser.role !== "staff") {
      return res.status(400).json({
        success: false,
        message: "User is not a staff member",
      });
    }

    // Get warehouse assignment for this staff (staff_ids is an array)
    const employeeProfileId = staffUser.employeeProfile?._id;

    const warehouse = await Warehouse.findOne({
      $or: [
        { staff_ids: targetStaffId },
        { staff_ids: employeeProfileId },
      ],
    })
      .select("_id name location capacity_quintal created_at")
      .lean();

    // Get reporting manager's user details if exists
    let reportingManagerDetails = null;
    if (staffUser.employeeProfile?.reportingManager) {
      const reportingManagerProfile = await Employee.findById(
        staffUser.employeeProfile.reportingManager
      )
        .populate({
          path: "user",
          select: "name phone_number email",
        })
        .lean();

      if (reportingManagerProfile?.user) {
        reportingManagerDetails = {
          _id: reportingManagerProfile.user._id,
          name: reportingManagerProfile.user.name,
          phone: reportingManagerProfile.user.phone_number,
          email: reportingManagerProfile.user.email,
          employee_id: reportingManagerProfile.employeeId,
          photo: reportingManagerProfile.employeeImage,
        };
      }
    }

    // Build comprehensive response
    const response = {
      // User Details
      _id: staffUser._id,
      name: staffUser.name,
      phone_number: staffUser.phone_number,
      secondary_phone_number: staffUser.secondary_phone_number,
      email: staffUser.email,
      gender: staffUser.gender,
      dob: staffUser.dob,
      role: staffUser.role,
      is_active: staffUser.is_active ?? true,
      registration_date: staffUser.registration_date,
      step_completed: staffUser.step_completed,

      // Employee Profile Details
      employee_id: staffUser.employeeProfile?.employeeId || null,
      employee_profile_id: staffUser.employeeProfile?._id || null,
      photo: staffUser.employeeProfile?.employeeImage || null,

      // Personal Info
      marital_status: staffUser.employeeProfile?.maritalStatus || null,
      nationality: staffUser.employeeProfile?.nationality || null,
      blood_group: staffUser.employeeProfile?.bloodGroup || null,

      // Address
      permanent_address: staffUser.employeeProfile?.permanentAddress || null,
      current_address: staffUser.employeeProfile?.currentAddress || null,
      same_as_permanent: staffUser.employeeProfile?.sameAsPermanent || false,

      // Employment Details
      employment_type: staffUser.employeeProfile?.employmentType || null,
      date_of_joining: staffUser.employeeProfile?.dateOfJoining || null,
      employment_status: staffUser.employeeProfile?.employmentStatus || null,
      salary: staffUser.employeeProfile?.salary || null,

      // Bank Details
      bank_details: {
        account_number: staffUser.employeeProfile?.account_number || null,
        ifsc_code: staffUser.employeeProfile?.ifsc_code || null,
        account_holder: staffUser.employeeProfile?.account_holder || null,
        bank_name: staffUser.employeeProfile?.bank_name || null,
        branch_name: staffUser.employeeProfile?.branch_name || null,
        upi_id: staffUser.employeeProfile?.upiId || null,
      },

      // Government IDs
      govt_ids: {
        pan_number: staffUser.employeeProfile?.panNumber || null,
        aadhaar_number: staffUser.employeeProfile?.aadhaarNumber || null,
        passport_number: staffUser.employeeProfile?.passportNumber || null,
        passport_expiry: staffUser.employeeProfile?.passportExpiry || null,
        pf_number: staffUser.employeeProfile?.pfNumber || null,
        esi_number: staffUser.employeeProfile?.esiNumber || null,
        tax_status: staffUser.employeeProfile?.taxStatus || null,
      },

      // Education & Experience
      education: staffUser.employeeProfile?.education || [],
      certifications: staffUser.employeeProfile?.certifications || [],
      experience: staffUser.employeeProfile?.experience || [],
      total_experience_years: staffUser.employeeProfile?.totalExperienceYears || 0,

      // Skills & Additional
      skills: staffUser.employeeProfile?.skills || [],
      medical_conditions: staffUser.employeeProfile?.medicalConditions || null,
      emergency_contacts: staffUser.employeeProfile?.emergencyContacts || [],
      hr_notes: staffUser.employeeProfile?.hrNotes || null,
      background_check_status: staffUser.employeeProfile?.backgroundCheckStatus || "Pending",
      onboarding_completed: staffUser.employeeProfile?.onboardingCompleted || false,

      // Reporting Manager
      reporting_manager: reportingManagerDetails,

      // Warehouse Assignment
      is_engaged: !!warehouse,
      warehouse: warehouse
        ? {
          _id: warehouse._id,
          name: warehouse.name,
          location: warehouse.location,
          capacity_quintal: warehouse.capacity_quintal,
          created_at: warehouse.created_at,
        }
        : null,

      // Timestamps
      created_at: staffUser.employeeProfile?.createdAt || staffUser.created_at,
      updated_at: staffUser.employeeProfile?.updatedAt || staffUser.updated_at,
    };

    return res.status(200).json({
      success: true,
      message: "Staff details fetched successfully",
      data: response,
    });
  } catch (error) {
    console.error("Error fetching staff details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateStaffDetails = async (req, res) => {
  try {
    const { staffId } = req.query;
    const requestingUserId = req.user?.userId;

    if (!requestingUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get requesting user to check role
    const requestingUser = await User.findById(requestingUserId).select("role");
    if (!requestingUser) {
      return res.status(404).json({
        success: false,
        message: "Requesting user not found",
      });
    }

    // Determine target staff ID based on role
    let targetStaffId = staffId;
    const isAdmin = requestingUser.role === "admin";

    if (!isAdmin) {
      // Non-admin can only update their own details if they are staff
      if (requestingUser.role !== "staff") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Only admins and staff can update staff details.",
        });
      }
      targetStaffId = requestingUserId; // Force to update own details
    }

    if (!targetStaffId) {
      return res.status(400).json({
        success: false,
        message: "Staff ID is required",
      });
    }

    // Fetch staff user with employee profile
    const staffUser = await User.findById(targetStaffId).populate("employeeProfile");
    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    if (staffUser.role !== "staff") {
      return res.status(400).json({
        success: false,
        message: "User is not a staff member",
      });
    }

    const employeeProfile = staffUser.employeeProfile;
    if (!employeeProfile) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found for this staff",
      });
    }

    // Extract fields from request body
    const {
      // User model fields
      name,
      phone_number,
      secondary_phone_number,
      email,
      gender,
      dob,
      is_active,

      // Employee Profile fields - Personal Info
      maritalStatus,
      nationality,
      bloodGroup,

      // Address
      permanentAddress,
      currentAddress,
      sameAsPermanent,

      // Employment
      employmentType,
      dateOfJoining,
      employmentStatus,
      salary,

      // Bank Details
      account_number,
      ifsc_code,
      account_holder,
      bank_name,
      branch_name,
      upiId,

      // Government IDs
      panNumber,
      aadhaarNumber,
      passportNumber,
      passportExpiry,
      pfNumber,
      esiNumber,
      taxStatus,

      // Skills & Additional
      skills,
      medicalConditions,
      emergencyContacts,
      hrNotes,
      backgroundCheckStatus,

      // S3 Image URL (uploaded from frontend)
      employeeImage,
    } = req.body;

    // Build User update object (only changed fields)
    const userUpdateFields = {};

    if (name !== undefined) userUpdateFields.name = name;
    if (secondary_phone_number !== undefined)
      userUpdateFields.secondary_phone_number = secondary_phone_number;
    if (gender !== undefined) userUpdateFields.gender = gender;
    if (dob !== undefined) userUpdateFields.dob = dob;

    // Admin-only fields
    if (isAdmin) {
      if (phone_number !== undefined) userUpdateFields.phone_number = phone_number;
      if (email !== undefined) userUpdateFields.email = email;
      if (is_active !== undefined) userUpdateFields.is_active = is_active;
    }

    // Build Employee Profile update object
    const employeeUpdateFields = {};

    // Fields staff can update themselves
    if (maritalStatus !== undefined) employeeUpdateFields.maritalStatus = maritalStatus;
    if (nationality !== undefined) employeeUpdateFields.nationality = nationality;
    if (bloodGroup !== undefined) employeeUpdateFields.bloodGroup = bloodGroup;
    if (permanentAddress !== undefined) employeeUpdateFields.permanentAddress = permanentAddress;
    if (currentAddress !== undefined) employeeUpdateFields.currentAddress = currentAddress;
    if (sameAsPermanent !== undefined) employeeUpdateFields.sameAsPermanent = sameAsPermanent;
    if (skills !== undefined) employeeUpdateFields.skills = skills;
    if (medicalConditions !== undefined) employeeUpdateFields.medicalConditions = medicalConditions;
    if (emergencyContacts !== undefined) employeeUpdateFields.emergencyContacts = emergencyContacts;

    // Bank details - self update allowed
    if (account_number !== undefined) employeeUpdateFields.account_number = account_number;
    if (ifsc_code !== undefined) employeeUpdateFields.ifsc_code = ifsc_code;
    if (account_holder !== undefined) employeeUpdateFields.account_holder = account_holder;
    if (bank_name !== undefined) employeeUpdateFields.bank_name = bank_name;
    if (branch_name !== undefined) employeeUpdateFields.branch_name = branch_name;
    if (upiId !== undefined) employeeUpdateFields.upiId = upiId;

    // Government IDs - self update allowed
    if (panNumber !== undefined) employeeUpdateFields.panNumber = panNumber;
    if (aadhaarNumber !== undefined) employeeUpdateFields.aadhaarNumber = aadhaarNumber;
    if (passportNumber !== undefined) employeeUpdateFields.passportNumber = passportNumber;
    if (passportExpiry !== undefined) employeeUpdateFields.passportExpiry = new Date(passportExpiry);
    if (pfNumber !== undefined) employeeUpdateFields.pfNumber = pfNumber;
    if (esiNumber !== undefined) employeeUpdateFields.esiNumber = esiNumber;
    if (taxStatus !== undefined) employeeUpdateFields.taxStatus = taxStatus;

    // Admin-only employee fields
    if (isAdmin) {
      if (employmentType !== undefined) employeeUpdateFields.employmentType = employmentType;
      if (dateOfJoining !== undefined) employeeUpdateFields.dateOfJoining = new Date(dateOfJoining);
      if (employmentStatus !== undefined) employeeUpdateFields.employmentStatus = employmentStatus;
      if (salary !== undefined) employeeUpdateFields.salary = salary;
      if (hrNotes !== undefined) employeeUpdateFields.hrNotes = hrNotes;
      if (backgroundCheckStatus !== undefined) employeeUpdateFields.backgroundCheckStatus = backgroundCheckStatus;
    }

    // Check if there are any updates to make
    if (
      Object.keys(userUpdateFields).length === 0 &&
      Object.keys(employeeUpdateFields).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    // Handle employee image - use S3 URL from body
    if (employeeImage) {
      employeeUpdateFields.employeeImage = employeeImage;
    }

    // Update User model
    let updatedUser = staffUser;
    if (Object.keys(userUpdateFields).length > 0) {
      updatedUser = await User.findByIdAndUpdate(
        targetStaffId,
        { $set: userUpdateFields },
        { new: true, runValidators: true }
      ).select("-password -account_pin");
    }

    // Update Employee Profile
    let updatedEmployee = employeeProfile;
    if (Object.keys(employeeUpdateFields).length > 0) {
      employeeUpdateFields.updatedAt = new Date();
      updatedEmployee = await Employee.findByIdAndUpdate(
        employeeProfile._id,
        { $set: employeeUpdateFields },
        { new: true, runValidators: true }
      );
    }

    // Track what was updated
    const updatedFields = [
      ...Object.keys(userUpdateFields),
      ...Object.keys(employeeUpdateFields),
    ];

    return res.status(200).json({
      success: true,
      message: "Staff details updated successfully",
      updated_fields: updatedFields,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone_number: updatedUser.phone_number,
        is_active: updatedUser.is_active,
        employee_id: updatedEmployee.employeeId,
        photo: updatedEmployee.employeeImage,
      },
    });
  } catch (error) {
    console.error("Error updating staff details:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists. Please use a different value.`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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
  getManagerDetails,
  updateManagerDetails,
  getSupervisorDetails,
  updateSupervisorDetails,
  getStaffDetails,
  updateStaffDetails,
};
