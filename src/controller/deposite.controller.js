import StorageBucket from "../model/StorageBucket.model.js";
import Transaction from "../model/Transaction.model.js";
import Approval from "../model/Approval.model.js";
import User from "../model/Users.model.js";

const grainDeposit = async (req, res) => {
  try {
    const {
      quantity,
      farmerId,
      category_id,
      warehouse_id,
      current_price,
      moisture_content,
      transaction_type,
    } = req.body;

    const userId = req.user?.userId; // actor (manager / supervisor / admin)

    if (!userId) {
      return res.status(400).json({ message: "Actor userId is required" });
    }

    // Load actor
    const actor = await User.findById(userId);
    if (!actor) {
      return res.status(400).json({ message: "Actor (user) not found" });
    }

    const user_role = actor.role;
    if (!user_role) {
      return res.status(400).json({ message: "Actor role is required" });
    }

    // Ensure actor is one of allowed roles
    const allowedActors = ["manager", "supervisor", "admin"];
    if (!allowedActors.includes(user_role)) {
      return res.status(403).json({
        message:
          "Only manager, supervisor or admin are allowed to perform deposits on behalf of farmers",
      });
    }

    // farmerId must be provided (owner of the grain)
    if (!farmerId) {
      return res.status(400).json({ message: "farmerId is required" });
    }

    // Load farmer (owner)
    const farmer = await User.findById(farmerId);
    if (!farmer) {
      return res.status(400).json({ message: "Farmer not found" });
    }

    // Convert numeric fields
    const quantityNum = Number(quantity) || 0;
    const priceNum = Number(current_price) || 0;
    const moistureNum = Number(moisture_content) || 0;

    if (quantityNum <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than zero" });
    }

    // Prepare approval object depending on actor role
    const approvalPayload = {
      manager_approval: { user_id: null, status: false, date: null },
      supervisor_approval: { user_id: null, status: false, date: null },
      admin_approval: { user_id: null, status: false, date: null },
    };

    if (user_role === "manager") {
      approvalPayload.manager_approval = { user_id: userId, status: true, date: new Date() };
    } else if (user_role === "supervisor") {
      approvalPayload.supervisor_approval = { user_id: userId, status: true, date: new Date() };
    } else if (user_role === "admin") {
      approvalPayload.admin_approval = { user_id: userId, status: true, date: new Date() };
    }

    // Create Approval record
    const createApproval = await Approval.create(approvalPayload);

    // Transaction status: only admin deposits are completed immediately
    const txStatus = user_role === "admin" ? "completed" : "pending";

    // Create Transaction:
    const newTransaction = await Transaction.create({
      transaction_type,
      user_id: farmerId, // owner of grain (matches Transaction schema)
      warehouse_id: warehouse_id || null,
      grain: [
        {
          category_id,
          quantity_quintal: quantityNum,
          price_per_quintal: priceNum,
          moisture_content: moistureNum,
        },
      ],
      total_amount: quantityNum * priceNum,
      remarks: "Grain deposited",
      transaction_status: txStatus,
      approval_status: createApproval._id,
      created_at: new Date(),
    });

    const transactionId = newTransaction._id;

    // Use farmer's storage bucket (owner is the farmer)
    const bucketOwnerId = farmerId;

    // Find or create storage bucket for the farmer
    let storage = await StorageBucket.findOne({ bucket_owner_id: bucketOwnerId });

    if (!storage) {
      storage = new StorageBucket({
        bucket_owner_type: "User",
        bucket_owner_id: bucketOwnerId,
        categories: [],
        total_quantity: 0,
        pending_quantity: 0,
      });
    }

    // Find category index in storage bucket
    let categoryIndex = storage.categories.findIndex(
      (c) => String(c.category_id) === String(category_id)
    );

    if (categoryIndex === -1) {
      // New category entry
      const newCategory = {
        category_id,
        warehouse_storage: [
          {
            transaction_id: transactionId, // matches StorageBucket schema
            created_at: new Date(),
          },
        ],
        // If actor is admin, add directly to total; otherwise to pending
        pending_quantity: user_role === "admin" ? 0 : quantityNum,
        total_quantity: user_role === "admin" ? quantityNum : 0,
      };

      storage.categories.push(newCategory);
      categoryIndex = storage.categories.length - 1;
    } else {
      // Ensure numeric fields exist
      const cat = storage.categories[categoryIndex];
      if (typeof cat.pending_quantity !== "number")
        cat.pending_quantity = Number(cat.pending_quantity) || 0;
      if (typeof cat.total_quantity !== "number")
        cat.total_quantity = Number(cat.total_quantity) || 0;

      // Add deposit record to existing category (warehouse_storage only tracks id/date)
      storage.categories[categoryIndex].warehouse_storage.push({
        transaction_id: transactionId,
        created_at: new Date(),
      });

      // If admin, add to total directly; else add to pending.
      if (user_role === "admin") {
        storage.categories[categoryIndex].total_quantity =
          Number(storage.categories[categoryIndex].total_quantity || 0) + quantityNum;
      } else {
        storage.categories[categoryIndex].pending_quantity =
          Number(storage.categories[categoryIndex].pending_quantity || 0) + quantityNum;
      }
    }

    // Recalculate top-level totals by summing categories' totals/pending
    const totalQuantity = storage.categories.reduce((acc, c) => {
      return acc + (Number(c.total_quantity) || 0);
    }, 0);

    const pendingQuantity = storage.categories.reduce((acc, c) => {
      return acc + (Number(c.pending_quantity) || 0);
    }, 0);

    storage.total_quantity = totalQuantity;
    storage.pending_quantity = pendingQuantity;

    // Save storage
    await storage.save();

    return res.status(200).json({
      message:
        user_role === "admin"
          ? "Grain deposited and transaction completed by admin"
          : "Grain deposited successfully (awaiting further approvals)",
    });
  } catch (error) {
    console.error("Error during grain deposit:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export { grainDeposit };