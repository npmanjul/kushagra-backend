import TransactionHistory from "../model/Transaction.model.js";
import StorageBucket from "../model/StorageBucket.model.js";
import GrainCategories from "../model/GrainCategories.model.js";
import User from "../model/Users.model.js";
import FarmerProfiles from "../model/Farmer.model.js";
import Approval from "../model/Approval.model.js";
import Warehouses from "../model/Warehouses.model.js";
import EmployeeProfiles from "../model/Employee.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const dashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // ✅ Fetch user's storage buckets
    const userGrains = await StorageBucket.find({
      bucket_owner_id: userId,
    }).lean();

    if (!userGrains.length) {
      return res.status(200).json({
        message: "No grain data found for this user",
        totalGrain: [],
        totalGrainQuantity: 0,
        totalCost: 0,
        availableCredit: 0,
        avgProfit: 0,
        userAccountBalance: 0,
      });
    }

    // ✅ Extract all category IDs
    const allCategoryIds = userGrains.flatMap((bucket) =>
      bucket.categories.map((cat) => cat.category_id)
    );

    // ✅ Fetch category details
    const categoriesDetails = await GrainCategories.find({
      _id: { $in: allCategoryIds },
    })
      .select("grain_type quality price_history")
      .populate("price_history")
      .lean();

    // ✅ Prepare today’s price map
    const todayPriceMap = {};
    categoriesDetails.forEach((grain) => {
      const { grain_type, price_history } = grain;
      if (!price_history.length) return;
      const latestPrice = price_history[price_history.length - 1];
      todayPriceMap[grain_type] = {
        max: latestPrice.maxprice.price,
        avg: latestPrice.avgprice.price,
        min: latestPrice.minprice.price,
      };
    });

    // ✅ Fetch deposit, sell, credit transactions
    const transactions = await TransactionHistory.find({
      user_id: userId,
      transaction_type: { $in: ["deposit", "sell", "credit"] },
      "grain.category_id": { $in: allCategoryIds },
    }).lean();

    const totalGrain = [];
    let userAccountBalance = 0;

    for (const cat of categoriesDetails) {
      const catId = cat._id.toString();
      const grainType = cat.grain_type;
      const quality = cat.quality;

      const todayPrices = todayPriceMap[grainType] || {};
      let todayPricePerQtl = 0;
      if (quality === "A") todayPricePerQtl = todayPrices.max || 0;
      else if (quality === "B") todayPricePerQtl = todayPrices.avg || 0;
      else if (quality === "C") todayPricePerQtl = todayPrices.min || 0;

      let totalQuantity = 0;
      let totalValue = 0;
      let totalProfit = 0;

      // ✅ Iterate through transactions and their grain array
      for (const tx of transactions) {
        const grainItem = tx.grain.find(
          (g) => g.category_id.toString() === catId
        );
        if (!grainItem) continue;

        const { quantity_quintal, price_per_quintal } = grainItem;
        const quantity = quantity_quintal || 0;
        const price = price_per_quintal || 0;
        const profitPerQtl = todayPricePerQtl - price;

        // 🧾 Account balance adjustments
        if (tx.transaction_type === "deposit")
          userAccountBalance += quantity * price;
        else if (tx.transaction_type === "sell")
          userAccountBalance -= quantity * price;
        else if (tx.transaction_type === "credit")
          userAccountBalance -= quantity * todayPricePerQtl;

        // 🏷️ Stock adjustments
        if (tx.transaction_type === "deposit") totalQuantity += quantity;
        else if (tx.transaction_type === "sell") totalQuantity -= quantity;
        else if (tx.transaction_type === "credit") totalQuantity -= quantity;

        totalValue += quantity * todayPricePerQtl;
        totalProfit += profitPerQtl;
      }

      const avgProfit = totalQuantity > 0 ? totalProfit / totalQuantity : 0;

      totalGrain.push({
        category_id: catId,
        grain_type: grainType,
        quality,
        total_quantity: totalQuantity,
        today_price_per_quintal: todayPricePerQtl,
        total_value: totalValue,
        avgProfitPerQtl: avgProfit,
      });
    }

    // ✅ Aggregates
    const totalGrainQuantity = totalGrain.reduce(
      (sum, g) => sum + (g.total_quantity || 0),
      0
    );

    const totalCost = totalGrain.reduce(
      (sum, g) => sum + (g.total_value || 0),
      0
    );

    const availableCredit = 0.6 * totalCost;

    const avgProfit =
      totalGrain.length > 0
        ? totalGrain.reduce((sum, g) => sum + (g.avgProfitPerQtl || 0), 0) /
          totalGrain.length
        : 0;

    return res.status(200).json({
      message: "Dashboard analytics fetched successfully",
      totalGrainQuantity,
      totalCost,
      availableCredit,
      avgProfit,
      userAccountBalance,
      totalGrain,
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllGrainDeposite = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const user_role = user.role;

    // Allowed roles to access this endpoint
    const allowedRoles = ["farmer", "supervisor", "manager", "admin"];
    if (!allowedRoles.includes(user_role)) {
      return res.status(403).json({
        message:
          "Only farmers, supervisors, managers or admins can access grain deposits",
      });
    }

    // Determine which farmerId to use:
    // - If the requester is a farmer: use their own userId
    // - If the requester is supervisor/manager/admin: use req.query.farmerId
    let farmerId;
    if (user_role === "farmer") {
      farmerId = userId;
    } else {
      farmerId = req.query.farmerId;
      if (!farmerId) {
        return res.status(400).json({ message: "Farmer ID is required" });
      }
    }

    // Fetch farmer's grain buckets
    const userGrains = await StorageBucket.find({
      bucket_owner_id: farmerId,
    }).lean();

    if (!userGrains.length) {
      return res.status(200).json({
        message: "No grain data found for this farmer",
        deposits: [],
      });
    }

    // Flatten all categories across all buckets
    const categories = userGrains.flatMap((bucket) => bucket.categories);

    // Extract all category IDs
    const categoryIds = categories.map((cat) => cat.category_id);

    // Fetch category details with price history
    const categoriesDetails = await GrainCategories.find({
      _id: { $in: categoryIds },
    })
      .select("grain_type quality price_history")
      .populate("price_history")
      .lean();

    // Prepare today's price map
    const todayPriceMap = {};
    categoriesDetails.forEach((grain) => {
      const { _id, grain_type, quality, price_history } = grain;
      if (!price_history || !price_history.length) return;
      const latestPrice = price_history[price_history.length - 1];
      todayPriceMap[_id.toString()] = {
        grain_type,
        quality,
        max: latestPrice.maxprice.price,
        avg: latestPrice.avgprice.price,
        min: latestPrice.minprice.price,
      };
    });

    // Map deposits with today's price
    const deposits = categories
      .map((cat) => {
        const catPriceInfo = todayPriceMap[cat.category_id.toString()] || {};
        let todayPricePerQtl = 0;
        if (catPriceInfo.quality === "A")
          todayPricePerQtl = catPriceInfo.max || 0;
        else if (catPriceInfo.quality === "B")
          todayPricePerQtl = catPriceInfo.avg || 0;
        else if (catPriceInfo.quality === "C")
          todayPricePerQtl = catPriceInfo.min || 0;

        return {
          category_id: cat.category_id,
          total_quantity: cat.total_quantity,
          grain_type: catPriceInfo.grain_type || null,
          quality: catPriceInfo.quality || null,
          today_price_per_quintal: todayPricePerQtl,
          total_value: (cat.total_quantity || 0) * todayPricePerQtl,
        };
      })
      .filter((item) => item.total_quantity > 0);

    return res.status(200).json({
      message: "Grain deposits fetched successfully",
      deposits,
    });
  } catch (error) {
    console.error("Error fetching grain deposits:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const categoryTransactionDetails = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { category_id } = req.params;

    if (!userId || !category_id) {
      return res
        .status(400)
        .json({ message: "User ID and Category ID are required" });
    }

    const { page = 1, limit = 10 } = req.query;

    // ✅ Fetch category info
    const category = await GrainCategories.findById(category_id)
      .select("grain_type quality price_history")
      .populate("price_history")
      .lean();

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const { grain_type, quality, price_history } = category;

    // ✅ Get today's price
    const latestPrice = price_history?.[price_history.length - 1];
    let todayPricePerQtl = 0;
    if (quality === "A") todayPricePerQtl = latestPrice?.maxprice?.price || 0;
    else if (quality === "B")
      todayPricePerQtl = latestPrice?.avgprice?.price || 0;
    else if (quality === "C")
      todayPricePerQtl = latestPrice?.minprice?.price || 0;

    // ✅ Pagination
    const pageNumber = Math.max(parseInt(page), 1);
    const limitNumber = Math.max(parseInt(limit), 1);
    const skip = (pageNumber - 1) * limitNumber;

    // ✅ Fetch all transactions containing this category with complete information
    const transactions = await TransactionHistory.find({
      user_id: userId,
      "grain.category_id": category_id,
      transaction_type: { $in: ["deposit", "sell", "loan", "withdraw"] },
    })
      .populate({
        path: "user_id",
        select: "name phone_number email role farmerProfile",
        populate: {
          path: "farmerProfile",
          model: "FarmerProfiles",
          select: "farmerId user_image",
        },
      })
      .populate({
        path: "warehouse_id",
        select: "name location address",
      })
      .populate({
        path: "grain.category_id",
        select: "grain_type unit quality",
      })
      .populate({
        path: "approval_status",
        populate: [
          { path: "manager_approval.user_id", select: "name role" },
          { path: "supervisor_approval.user_id", select: "name role" },
          { path: "admin_approval.user_id", select: "name role" },
        ],
      })
      .sort({ transaction_date: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // ✅ Get total count
    const totalRecords = await TransactionHistory.countDocuments({
      user_id: userId,
      "grain.category_id": category_id,
      transaction_type: { $in: ["deposit", "sell", "loan", "withdraw"] },
    });

    // ✅ Prepare detailed response with complete transaction info
    const txDetails = transactions.map((tx) => {
      const grainItem = tx.grain.find(
        (g) => g.category_id._id.toString() === category_id
      );

      const { quantity_quintal, price_per_quintal } = grainItem || {};
      const quantity = quantity_quintal || 0;
      const depositPrice = price_per_quintal || 0;
      const profitPerQtl = todayPricePerQtl - depositPrice;
      const profitPercent =
        depositPrice > 0
          ? ((todayPricePerQtl - depositPrice) / depositPrice) * 100
          : 0;

      return {
        // Transaction basic info
        transaction_id: tx._id,
        transaction_type: tx.transaction_type,
        transaction_date: tx.transaction_date,
        symbol:
          tx.transaction_type === "deposit" || tx.transaction_type === "credit"
            ? "+"
            : "-",

        // User info
        user: {
          _id: tx.user_id?._id,
          name: tx.user_id?.name,
          phone_number: tx.user_id?.phone_number,
          email: tx.user_id?.email,
          role: tx.user_id?.role,
          farmerId: tx.user_id?.farmerProfile?.farmerId,
          user_image: tx.user_id?.farmerProfile?.user_image,
        },

        // Warehouse info
        warehouse: {
          _id: tx.warehouse_id?._id,
          name: tx.warehouse_id?.name,
          location: tx.warehouse_id?.location,
          address: tx.warehouse_id?.address,
        },

        // Grain details for this category
        grain: {
          category_id: grainItem?.category_id?._id,
          grain_type: grainItem?.category_id?.grain_type,
          quality: grainItem?.category_id?.quality,
          unit: grainItem?.category_id?.unit,
          quantity_quintal: quantity,
          price_per_quintal: depositPrice,
          total_amount: quantity * depositPrice,
        },

        // Price analysis
        price_analysis: {
          deposit_price: depositPrice,
          today_price: todayPricePerQtl,
          profit_per_quintal: profitPerQtl,
          profit_percent: Number(profitPercent.toFixed(2)),
          total_current_value: quantity * todayPricePerQtl,
        },

        // Approval status
        approval_status: tx.approval_status
          ? {
              _id: tx.approval_status._id,
              manager_approval: tx.approval_status.manager_approval,
              supervisor_approval: tx.approval_status.supervisor_approval,
              admin_approval: tx.approval_status.admin_approval,
            }
          : null,

        // Additional transaction details
        notes: tx.notes,
        status: tx.status,
        payment_method: tx.payment_method,
        receipt_url: tx.receipt_url,
        created_at: tx.createdAt,
        updated_at: tx.updatedAt,
      };
    });

    // ✅ Final response
    return res.status(200).json({
      success: true,
      message: "Category transaction details fetched successfully",
      category: {
        category_id,
        grain_type,
        quality,
        today_price_per_quintal: todayPricePerQtl,
      },
      pagination: {
        currentPage: pageNumber,
        limit: limitNumber,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNumber),
      },
      transactions: txDetails,
    });
  } catch (error) {
    console.error("Error fetching category transactions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const findUserDetails = async (req, res) => {
  try {
    let { name, email, phone_number } = req.query;

    // At least one search parameter required
    if (!name && !email && !phone_number) {
      return res
        .status(400)
        .json({ message: "At least one search parameter is required" });
    }

    const searchConditions = [];

    if (name) {
      searchConditions.push({ name: { $regex: name, $options: "i" } });
    }
    if (email) {
      searchConditions.push({ email: { $regex: email, $options: "i" } });
    }
    if (phone_number) {
      searchConditions.push({
        phone_number: { $regex: phone_number, $options: "i" },
      });
    }

    // Base query: only farmer users
    const query = { role: "farmer" };
    if (searchConditions.length > 0) {
      query.$or = searchConditions;
    }

    // 1️⃣ Find matching farmer users (basic info)
    const users = await User.find(query)
      .select("name email phone_number _id") // user_image is in FarmerProfile, not here
      .limit(5)
      .lean();

    if (!users.length) {
      return res.status(404).json({ message: "No farmers found" });
    }

    // 2️⃣ Find corresponding FarmerProfiles to get farmerId + user_image
    const userIds = users.map((u) => u._id);

    const farmerProfiles = await FarmerProfiles.find({
      user: { $in: userIds },
    })
      .select("user farmerId user_image")
      .lean();

    const profileMap = {};
    farmerProfiles.forEach((profile) => {
      profileMap[profile.user.toString()] = {
        farmerId: profile.farmerId,
        user_image: profile.user_image || null,
      };
    });

    // 3️⃣ Merge profile data into user objects
    const usersWithFarmerData = users.map((u) => {
      const profile = profileMap[u._id.toString()] || {};
      return {
        ...u,
        farmerId: profile.farmerId || null,
        user_image: profile.user_image || null,
      };
    });

    return res
      .status(200)
      .json({ message: "Farmers found", users: usersWithFarmerData });
  } catch (error) {
    console.error("Error finding farmers:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

const checkFarmerVerification = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { farmerId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // 1️⃣ Get user with verification
    const user = await User.findById(farmerId).lean();
    if (!user || !user.farmerVerification?.overallStatus) {
      return res.status(404).json({ message: "Farmer verification not found" });
    }

    const verification = user.farmerVerification;

    // 2️⃣ Get farmer profile (actual values)
    const farmer = await FarmerProfiles.findById(user.farmerProfile).lean();
    if (!farmer) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    // 3️⃣ Helper to resolve approval info
    const resolveApproval = async (approvalId) => {
      if (!approvalId) return null;

      const approval = await Approval.findById(approvalId)
        .populate("manager_approval.user_id", "name role")
        .populate("supervisor_approval.user_id", "name role")
        .populate("admin_approval.user_id", "name role")
        .lean();

      return approval
        ? {
            manager: approval.manager_approval,
            supervisor: approval.supervisor_approval,
            admin: approval.admin_approval,
          }
        : null;
    };

    // 4️⃣ Helper to merge value + verification + approval
    const mapField = async (fieldName) => ({
      value: farmer[fieldName] ?? null,
      status: verification[fieldName]?.status ?? "pending",
      reason: verification[fieldName]?.reason ?? null,
      verifiedBy: await resolveApproval(verification[fieldName]?.verifiedBy),
    });

    // 5️⃣ Build response
    const response = {
      overallStatus: verification.overallStatus,

      // ---------- Identity ----------
      aadhaar_image: await mapField("aadhaar_image"),
      aadhaar_number: await mapField("aadhaar_number"),
      pan_image: await mapField("pan_image"),
      pan_number: await mapField("pan_number"),
      khatauni_images: await mapField("khatauni_images"),

      // ---------- Address ----------
      address: await mapField("address"),
      tehsil: await mapField("tehsil"),
      district: await mapField("district"),
      state: await mapField("state"),
      landmark: await mapField("landmark"),
      pin_code: await mapField("pin_code"),

      // ---------- Land ----------
      land_size: await mapField("land_size"),

      // ---------- Bank ----------
      bank_passbook_img: await mapField("bank_passbook_img"),
      account_number: await mapField("account_number"),
      ifsc_code: await mapField("ifsc_code"),
      account_holder: await mapField("account_holder"),
      bank_name: await mapField("bank_name"),
      branch_name: await mapField("branch_name"),

      // ---------- Nominee ----------
      nominee_image: await mapField("nominee_image"),
      nominee_aadhaar_image: await mapField("nominee_aadhaar_image"),
      nominee_pan_image: await mapField("nominee_pan_image"),
      nominee_name: await mapField("nominee_name"),
      nominee_dob: await mapField("nominee_dob"),
      nominee_phone: await mapField("nominee_phone"),
      nominee_email: await mapField("nominee_email"),
      nominee_aadhaar: await mapField("nominee_aadhaar"),
      nominee_pan: await mapField("nominee_pan"),
      nominee_relation: await mapField("nominee_relation"),
      nominee_gender: await mapField("nominee_gender"),
      nominee_address: await mapField("nominee_address"),
    };

    return res.status(200).json({ data: response });
  } catch (error) {
    console.error("Error fetching farmer verification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateFarmerVerification = async (req, res) => {
  try {
    const { verifications } = req.body;
    const { farmerId } = req.query;
    const loggedInUserId = req.user?.userId;

    if (!loggedInUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!farmerId) {
      return res.status(400).json({ message: "Farmer ID is required" });
    }

    if (!verifications || typeof verifications !== "object") {
      return res.status(400).json({ message: "Invalid verification payload" });
    }

    const verifier = await User.findById(loggedInUserId);
    if (!verifier) {
      return res.status(404).json({ message: "Verifier not found" });
    }

    if (!["manager", "supervisor", "admin"].includes(verifier.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // -------------------------------
    // Create Approval
    // -------------------------------
    const approvalPayload = {};

    if (verifier.role === "manager") {
      approvalPayload.manager_approval = {
        user_id: loggedInUserId,
        status: true,
        date: new Date(),
      };
    }

    if (verifier.role === "supervisor") {
      approvalPayload.supervisor_approval = {
        user_id: loggedInUserId,
        status: true,
        date: new Date(),
      };
    }

    if (verifier.role === "admin") {
      approvalPayload.admin_approval = {
        user_id: loggedInUserId,
        status: true,
        date: new Date(),
      };
    }

    const approval = await Approval.create(approvalPayload);

    // -------------------------------
    // 🔥 BUILD $set OBJECT DYNAMICALLY
    // -------------------------------
    const updateSet = {};

    for (const [field, data] of Object.entries(verifications)) {
      if (!["approved", "rejected"].includes(data?.status)) continue;

      updateSet[`farmerVerification.${field}`] = {
        status: data.status,
        reason: data.reason || null,
        verifiedBy: approval._id,
      };
    }

    if (Object.keys(updateSet).length === 0) {
      return res.status(400).json({
        message: "No valid verification fields provided",
      });
    }

    // -------------------------------
    // 🔥 UPDATE USING $set (FORCE CREATE)
    // -------------------------------
    await User.updateOne(
      { _id: farmerId },
      {
        $set: updateSet,
      }
    );

    // -------------------------------
    // Recalculate overallStatus
    // -------------------------------
    const farmer = await User.findById(farmerId).lean();

    const statuses = Object.entries(farmer.farmerVerification)
      .filter(
        ([key, value]) =>
          key !== "overallStatus" &&
          value &&
          typeof value === "object" &&
          value.status
      )
      .map(([_, value]) => value.status);

    let overallStatus = "pending";

    if (statuses.includes("rejected")) {
      overallStatus = "rejected";
    } else if (statuses.length > 0 && statuses.every((s) => s === "approved")) {
      overallStatus = "approved";
    }

    await User.updateOne(
      { _id: farmerId },
      {
        $set: { "farmerVerification.overallStatus": overallStatus },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Farmer verification updated successfully",
      updatedFields: Object.keys(updateSet).map((k) =>
        k.replace("farmerVerification.", "")
      ),
      overallStatus,
      approvalId: approval._id,
    });
  } catch (error) {
    console.error("Update Farmer Verification Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getFarmerUnverifiedFields = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ----------------------------
    // Fetch farmer user
    // ----------------------------
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    if (user.role !== "farmer") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // ----------------------------
    // Fetch farmer profile (actual data)
    // ----------------------------
    const farmerProfile = await FarmerProfiles.findById(
      user.farmerProfile
    ).lean();
    if (!farmerProfile) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    const verification = user.farmerVerification || {};

    const result = [];

    // ----------------------------
    // ALL verification fields list
    // ----------------------------
    const verificationFields = [
      // Identity
      "aadhaar_number",
      "pan_number",
      "aadhaar_image",
      "pan_image",
      "khatauni_images",

      // Address
      "address",
      "tehsil",
      "district",
      "state",
      "landmark",
      "pin_code",

      // Land
      "land_size",

      // Bank
      "account_number",
      "ifsc_code",
      "account_holder",
      "bank_name",
      "branch_name",
      "bank_passbook_img",

      // Nominee
      "nominee_name",
      "nominee_dob",
      "nominee_phone",
      "nominee_email",
      "nominee_aadhaar",
      "nominee_pan",
      "nominee_relation",
      "nominee_gender",
      "nominee_address",
      "nominee_image",
      "nominee_aadhaar_image",
      "nominee_pan_image",
    ];

    // ----------------------------
    // Build response
    // ----------------------------
    for (const field of verificationFields) {
      const v = verification[field];

      const status = v?.status || "pending";

      // ❌ Skip approved fields
      if (status === "approved") continue;

      result.push({
        field,
        status, // pending | rejected
        reason: v?.reason || null,
        data: farmerProfile[field] ?? null,
      });
    }

    return res.status(200).json({
      success: true,
      count: result.length,
      fields: result,
    });
  } catch (error) {
    console.error("Error fetching unverified fields:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateProfileVerification = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch user with farmer profile
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "farmer") {
      return res
        .status(403)
        .json({ message: "Only farmers can update profile verification" });
    }

    const farmerProfile = await FarmerProfiles.findById(user.farmerProfile);
    if (!farmerProfile) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    const verification = user.farmerVerification || {};
    const textFields = req.body || {};
    const files = req.files || {};

    // Define which fields are file fields
    const fileFields = [
      "aadhaar_image",
      "pan_image",
      "khatauni_images",
      "bank_passbook_img",
      "nominee_image",
      "nominee_aadhaar_image",
      "nominee_pan_image",
    ];

    // Define all allowed text fields
    const allowedTextFields = [
      "aadhaar_number",
      "pan_number",
      "address",
      "tehsil",
      "district",
      "state",
      "landmark",
      "pin_code",
      "land_size",
      "account_number",
      "ifsc_code",
      "account_holder",
      "bank_name",
      "branch_name",
      "nominee_name",
      "nominee_dob",
      "nominee_phone",
      "nominee_email",
      "nominee_aadhaar",
      "nominee_pan",
      "nominee_relation",
      "nominee_gender",
      "nominee_address",
    ];

    const updatedFields = [];

    // Process text fields
    for (const field of allowedTextFields) {
      if (textFields[field] !== undefined && textFields[field] !== "") {
        // Check if this field was rejected (only allow updates for rejected fields)
        const fieldStatus = verification[field]?.status;
        if (fieldStatus === "rejected" || fieldStatus === "pending") {
          farmerProfile[field] = textFields[field];

          // Reset verification status to pending
          if (!user.farmerVerification) {
            user.farmerVerification = {};
          }
          user.farmerVerification[field] = {
            status: "pending",
            reason: null,
            verifiedBy: null,
          };

          updatedFields.push(field);
        }
      }
    }

    // Process file uploads
    for (const fieldName of fileFields) {
      const fieldFiles = files[fieldName];
      if (fieldFiles && fieldFiles.length > 0) {
        // Check if this field was rejected
        const fieldStatus = verification[fieldName]?.status;
        if (fieldStatus === "rejected" || fieldStatus === "pending") {
          if (fieldName === "khatauni_images") {
            // Handle multiple khatauni images
            const uploadedImages = [];
            for (const file of fieldFiles) {
              const uploadResult = await uploadOnCloudinary(file.path);
              if (uploadResult) {
                uploadedImages.push({
                  khatauni_id: `KH-${Date.now()}-${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                  image_url: uploadResult.secure_url,
                });
              }
            }
            if (uploadedImages.length > 0) {
              farmerProfile.khatauni_images = uploadedImages;
              updatedFields.push(fieldName);
            }
          } else {
            // Handle single file upload
            const file = fieldFiles[0];
            const uploadResult = await uploadOnCloudinary(file.path);
            if (uploadResult) {
              farmerProfile[fieldName] = uploadResult.secure_url;
              updatedFields.push(fieldName);
            }
          }

          // Reset verification status to pending
          if (!user.farmerVerification) {
            user.farmerVerification = {};
          }
          user.farmerVerification[fieldName] = {
            status: "pending",
            reason: null,
            verifiedBy: null,
          };
        }
      }
    }

    if (updatedFields.length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    // ✅ FORCE pending when anything changes
    user.farmerVerification.overallStatus = "pending";
    user.farmerVerification.lastUpdatedAt = new Date();

    // Save both documents
    await farmerProfile.save();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile verification fields updated successfully",
      updatedFields,
    });
  } catch (error) {
    console.error("Error updating profile verification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllFarmers = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const user_role = user.role;

    // Allowed roles to access this endpoint
    const allowedRoles = ["admin", "manager", "supervisor"];
    if (!allowedRoles.includes(user_role)) {
      return res
        .status(403)
        .json({ message: "Only admin, manager, supervisor can access farmers" });
    }

    // Admin, Manager, and Supervisor can all see all farmers
    const allFarmers = await User.find({ role: "farmer" })
      .select("_id")
      .lean();
    const farmerUserIds = allFarmers.map((f) => f._id);

    const totalCount = farmerUserIds.length;

    if (!totalCount) {
      return res.status(200).json({
        success: true,
        message: "No farmers found",
        farmers: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
          limit,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    // Apply pagination to farmer IDs
    const paginatedFarmerIds = farmerUserIds.slice(skip, skip + limit);

    // Fetch farmer users with basic info (only required fields)
    const farmers = await User.find({
      _id: { $in: paginatedFarmerIds },
      role: "farmer",
    })
      .select("_id name phone_number farmerVerification is_active")
      .lean();

    // Fetch farmer profiles for user_image only
    const farmerProfiles = await FarmerProfiles.find({
      user: { $in: paginatedFarmerIds },
    })
      .select("user user_image farmerId")
      .lean();

    // Create a map for quick lookup
    const profileMap = {};
    farmerProfiles.forEach((profile) => {
      profileMap[profile.user.toString()] = {
        user_image: profile.user_image || null,
        farmerId: profile.farmerId || null,
      };
    });

    // Merge user and profile data with only required fields
    const farmersWithProfiles = farmers.map((farmer) => {
      const profile = profileMap[farmer._id.toString()] || {};
      return {
        _id: farmer._id,
        name: farmer.name,
        phone_number: farmer.phone_number,
        user_image: profile.user_image || null,
        overallStatus: farmer.farmerVerification?.overallStatus || "pending",
        farmerId: profile.farmerId || null,
        is_active: farmer.is_active !== undefined ? farmer.is_active : true,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      message: "Farmers fetched successfully",
      farmers: farmersWithProfiles,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching all farmers:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const getFarmerDetails = async (req, res) => {
  try {
    const farmerId = req.query.farmerId;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user is authorized
    const requestingUser = await User.findById(userId);
    if (!requestingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const allowedRoles = ["admin", "manager", "supervisor", "farmer"];
    if (!allowedRoles.includes(requestingUser.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // If farmer, can only access their own details
    let targetFarmerId = farmerId;
    if (requestingUser.role === "farmer") {
      targetFarmerId = userId; // Farmer can only view their own profile
    } else if (!farmerId) {
      return res.status(400).json({ message: "Farmer ID is required" });
    }

    // Fetch farmer user with verification data
    const farmerUser = await User.findById(targetFarmerId).lean();
    if (!farmerUser) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    if (farmerUser.role !== "farmer") {
      return res.status(400).json({ message: "User is not a farmer" });
    }

    // Fetch farmer profile
    const profile = await FarmerProfiles.findById(farmerUser.farmerProfile).lean();
    if (!profile) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    // Build complete farmer details
    const farmerDetails = {
      // Basic info from User
      _id: farmerUser._id,
      name: farmerUser.name,
      phone_number: farmerUser.phone_number,
      secondary_phone_number: farmerUser.secondary_phone_number,
      email: farmerUser.email,
      gender: farmerUser.gender,
      dob: farmerUser.dob,
      registration_date: farmerUser.registration_date,
      is_active: farmerUser.is_active !== undefined ? farmerUser.is_active : true,
      
      // Verification status
      overallStatus: farmerUser.farmerVerification?.overallStatus || "pending",
      
      // Profile data
      farmerId: profile.farmerId,
      user_image: profile.user_image,
      
      // Identity documents
      aadhaar_number: profile.aadhaar_number,
      aadhaar_image: profile.aadhaar_image,
      pan_number: profile.pan_number,
      pan_image: profile.pan_image,
      khatauni_images: profile.khatauni_images,
      
      // Address details
      address: profile.address,
      tehsil: profile.tehsil,
      district: profile.district,
      state: profile.state,
      landmark: profile.landmark,
      pin_code: profile.pin_code,
      
      // Land details
      land_size: profile.land_size,
      
      // Bank details
      bank_passbook_img: profile.bank_passbook_img,
      account_number: profile.account_number,
      ifsc_code: profile.ifsc_code,
      account_holder: profile.account_holder,
      bank_name: profile.bank_name,
      branch_name: profile.branch_name,
      
      // Nominee details
      nominee_name: profile.nominee_name,
      nominee_dob: profile.nominee_dob,
      nominee_phone: profile.nominee_phone,
      nominee_email: profile.nominee_email,
      nominee_aadhaar: profile.nominee_aadhaar,
      nominee_pan: profile.nominee_pan,
      nominee_relation: profile.nominee_relation,
      nominee_gender: profile.nominee_gender,
      nominee_address: profile.nominee_address,
      nominee_image: profile.nominee_image,
      nominee_aadhaar_image: profile.nominee_aadhaar_image,
      nominee_pan_image: profile.nominee_pan_image,
    };

    return res.status(200).json({
      success: true,
      message: "Farmer details fetched successfully",
      data: farmerDetails,
    });
  } catch (error) {
    console.error("Error fetching farmer details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const UpdateFarmerDetails = async (req, res) => {
  try {
    const { farmerId } = req.query;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user is authorized (only supervisor, manager, admin)
    const requestingUser = await User.findById(userId);
    if (!requestingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const allowedRoles = ["admin", "manager", "supervisor"];
    if (!allowedRoles.includes(requestingUser.role)) {
      return res.status(403).json({ message: "Only admin, manager, or supervisor can update farmer details" });
    }

    if (!farmerId) {
      return res.status(400).json({ message: "Farmer ID is required" });
    }

    // Fetch farmer user
    const farmerUser = await User.findById(farmerId);
    if (!farmerUser) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    if (farmerUser.role !== "farmer") {
      return res.status(400).json({ message: "User is not a farmer" });
    }

    // Fetch farmer profile
    const farmerProfile = await FarmerProfiles.findById(farmerUser.farmerProfile);
    if (!farmerProfile) {
      return res.status(404).json({ message: "Farmer profile not found" });
    }

    const textFields = req.body || {};
    const files = req.files || {};

    // Define which fields are file fields
    const fileFields = [
      "user_image",
      "aadhaar_image",
      "pan_image",
      "khatauni_images",
      "bank_passbook_img",
      "nominee_image",
      "nominee_aadhaar_image",
      "nominee_pan_image",
    ];

    // Define all allowed text fields for profile
    const allowedProfileFields = [
      "aadhaar_number",
      "pan_number",
      "address",
      "tehsil",
      "district",
      "state",
      "landmark",
      "pin_code",
      "land_size",
      "account_number",
      "ifsc_code",
      "account_holder",
      "bank_name",
      "branch_name",
      "nominee_name",
      "nominee_dob",
      "nominee_phone",
      "nominee_email",
      "nominee_aadhaar",
      "nominee_pan",
      "nominee_relation",
      "nominee_gender",
      "nominee_address",
    ];

    // Define allowed user fields (on User model)
    const allowedUserFields = [
      "name",
      "phone_number",
      "secondary_phone_number",
      "email",
      "gender",
      "dob",
      "is_active",
    ];

    const updatedFields = [];
    const userUpdates = {};

    // Process user fields (fields on User model)
    for (const field of allowedUserFields) {
      if (textFields[field] !== undefined && textFields[field] !== "") {
        userUpdates[field] = textFields[field];
        updatedFields.push(field);
      }
    }

    // Process profile text fields
    for (const field of allowedProfileFields) {
      if (textFields[field] !== undefined && textFields[field] !== "") {
        farmerProfile[field] = textFields[field];
        updatedFields.push(field);
      }
    }

    // Process file uploads
    for (const fieldName of fileFields) {
      const fieldFiles = files[fieldName];
      if (fieldFiles && fieldFiles.length > 0) {
        if (fieldName === "khatauni_images") {
          // Handle multiple khatauni images
          const uploadedImages = [];
          for (const file of fieldFiles) {
            const uploadResult = await uploadOnCloudinary(file.path);
            if (uploadResult) {
              uploadedImages.push({
                khatauni_id: `KH-${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
                image_url: uploadResult.secure_url,
              });
            }
          }
          if (uploadedImages.length > 0) {
            farmerProfile.khatauni_images = uploadedImages;
            updatedFields.push(fieldName);
          }
        } else {
          // Handle single file upload
          const file = fieldFiles[0];
          const uploadResult = await uploadOnCloudinary(file.path);
          if (uploadResult) {
            farmerProfile[fieldName] = uploadResult.secure_url;
            updatedFields.push(fieldName);
          }
        }
      }
    }

    if (updatedFields.length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    // Update user fields if any
    if (Object.keys(userUpdates).length > 0) {
      await User.updateOne({ _id: farmerId }, { $set: userUpdates });
    }

    // Save farmer profile
    await farmerProfile.save();

    return res.status(200).json({
      success: true,
      message: "Farmer details updated successfully",
      updatedFields,
      updatedBy: {
        userId: userId,
        role: requestingUser.role,
        name: requestingUser.name,
      },
    });
  } catch (error) {
    console.error("Error updating farmer details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export {
  dashboardAnalytics,
  getAllGrainDeposite,
  categoryTransactionDetails,
  findUserDetails,
  checkFarmerVerification,
  updateFarmerVerification,
  getFarmerUnverifiedFields,
  updateProfileVerification,
  getAllFarmers,
  getFarmerDetails,
  UpdateFarmerDetails,
};
