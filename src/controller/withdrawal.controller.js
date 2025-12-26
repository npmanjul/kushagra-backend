import TransactionHistory from "../model/Transaction.model.js";
import StorageBucket from "../model/StorageBucket.model.js";
import Approval from "../model/Approval.model.js";
import User from "../model/Users.model.js";

const createWithdrawalRequest = async (req, res) => {
  try {
    const loggedInUserId = req.user?.userId;
    if (!loggedInUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(loggedInUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const user_role = user.role;

    const {
      farmerId,
      grain_id,
      quantity,
      price,
      total_value,
      reason,
      notes,
      moisture_content,
      WarehouseId,
    } = req.body;

    if (!["admin", "manager", "supervisor"].includes(user_role)) {
      return res.status(403).json({
        message:
          "Only admin, manager, supervisor or superadmin can create withdrawal requests",
      });
    }

    if (!farmerId) {
      return res
        .status(400)
        .json({
          message: "farmerId is required to create a withdrawal request",
        });
    }

    if (!grain_id || !quantity || !price || !total_value) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!WarehouseId) {
      return res.status(400).json({ message: "WarehouseId is required" });
    }

    const numericQuantity = Number(quantity);
    const numericPrice = Number(price);
    const numericTotal = Number(total_value);

    if (
      Number.isNaN(numericQuantity) ||
      Number.isNaN(numericPrice) ||
      Number.isNaN(numericTotal)
    ) {
      return res
        .status(400)
        .json({ message: "Quantity, price and total_value must be numbers" });
    }

    if (numericQuantity <= 0) {
      return res
        .status(400)
        .json({ message: "Withdrawal quantity must be greater than 0" });
    }

    const moisture =
      typeof moisture_content === "number" ? moisture_content : 0;

    const targetFarmerId = farmerId;

    const farmer = await User.findById(targetFarmerId);
    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    // 1) Get storage bucket + category
    const bucket = await StorageBucket.findOne({
      bucket_owner_type: "User",
      bucket_owner_id: farmer._id,
      "categories.category_id": grain_id,
    });

    if (!bucket) {
      return res.status(404).json({
        message: "Storage bucket not found for this farmer and grain category",
      });
    }

    const categoryEntry = bucket.categories.find(
      (c) => c.category_id.toString() === grain_id.toString()
    );

    if (!categoryEntry) {
      return res.status(404).json({
        message: "Grain category not found in farmer's storage bucket",
      });
    }

    // ensure numeric fields exist on category entry
    categoryEntry.total_quantity = Number(categoryEntry.total_quantity) || 0;
    categoryEntry.pending_quantity =
      Number(categoryEntry.pending_quantity) || 0;

    const availableQuantity = categoryEntry.total_quantity - categoryEntry.pending_quantity;

    if (numericQuantity > availableQuantity) {
      return res.status(400).json({
        message:
          "Requested withdrawal quantity exceeds available (non-pending) quantity",
        availableQuantity,
      });
    }

    // 2) Create Approval doc (all false initially, we'll toggle admin approval immediately if creator is admin)
    const approvalData = {
      manager_approval: {
        status: false,
        user_id: null,
        date: null,
      },
      supervisor_approval: {
        status: false,
        user_id: null,
        date: null,
      },
      admin_approval: {
        status: false,
        user_id: null,
        date: null,
      },
    };

    // If creator is admin, mark admin approval true immediately
    if (user_role === "admin") {
      approvalData.admin_approval = {
        status: true,
        user_id: loggedInUserId,
        date: new Date(),
      };
    } else if (user_role === "manager") {
      approvalData.manager_approval = {
        status: true,
        user_id: loggedInUserId,
        date: new Date(),
      };
    } else if (user_role === "supervisor") {
      approvalData.supervisor_approval = {
        status: true,
        user_id: loggedInUserId,
        date: new Date(),
      };
    }

    const approval = await Approval.create(approvalData);

    // 3) Create TransactionHistory
    // set transaction_status depending on role
    const txnStatus = user_role === "admin" ? "completed" : "pending";

    await TransactionHistory.create({
      transaction_type: "withdraw",
      user_id: targetFarmerId,
      warehouse_id: WarehouseId,
      grain: [
        {
          category_id: grain_id,
          quantity_quintal: numericQuantity,
          price_per_quintal: numericPrice,
          moisture_content: moisture,
        },
      ],
      total_amount: numericTotal,
      transaction_status: txnStatus,
      approval_status: approval._id,
      remarks: [reason, notes].filter(Boolean).join(" | "),
      created_by: loggedInUserId,
      created_by_role: user_role,
    });

    // console.log("transation detail : ", transaction);

    // console.log("before - ",categoryEntry.pending_quantity)

    // 4) Update bucket quantities depending on role
    if (user_role === "admin") {
      // admin: apply immediately -> subtract from total_quantity directly
      categoryEntry.total_quantity =
        categoryEntry.total_quantity - numericQuantity;
      // ensure not negative (extra guard)
      if (categoryEntry.total_quantity < 0) {
        return res
          .status(500)
          .json({ message: "Quantity adjustment would make total negative" });
      }
    } else {
      // manager / supervisor: subtract from total_quantity AND add to pending_quantity
      // This ensures the quantity is removed from user's available inventory
      // and tracked as pending withdrawal
      categoryEntry.total_quantity =
        categoryEntry.total_quantity - numericQuantity;
      categoryEntry.pending_quantity =
        categoryEntry.pending_quantity + numericQuantity;
      
      // ensure not negative (extra guard)
      if (categoryEntry.total_quantity < 0) {
        return res
          .status(500)
          .json({ message: "Quantity adjustment would make total negative" });
      }
    }

    // console.log("After - ",categoryEntry.pending_quantity)

    await bucket.save();

    return res.status(user_role === "admin" ? 201 : 201).json({
      message:
        user_role === "admin"
          ? "Withdrawal processed immediately by admin (quantity deducted from total)."
          : "Withdrawal request created successfully, pending admin approval",
    });
  } catch (error) {
    console.error("Error creating withdrawal request:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { createWithdrawalRequest };
