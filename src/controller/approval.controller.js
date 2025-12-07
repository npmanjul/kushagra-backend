import Transaction from "../model/Transaction.model.js";
import Approval from "../model/Approval.model.js";
import User from "../model/Users.model.js";
import StorageBucket from "../model/StorageBucket.model.js";


const get_deposite_approvals = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const {
      status = "pending", // "pending" | "completed" | "rejected" | "all"
      page = 1,
      limit = 5,
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 5;
    const skip = (pageNum - 1) * limitNum;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const user_role = user.role;
    if (!user_role) {
      return res.status(400).json({ message: "User role is required" });
    }

    const allowedRoles = ["manager", "supervisor", "admin"];
    if (!allowedRoles.includes(user_role)) {
      return res.status(403).json({
        message:
          "Only manager, supervisor or admin are allowed to view approvals",
      });
    }

    const approverId = user._id;

    // ------------------------------------
    // 1) Filter ONLY by transaction_status (for main list)
    // ------------------------------------
    let txStatusMatch = {};
    switch (status) {
      case "pending":
        txStatusMatch.transaction_status = "pending";
        break;
      case "completed":
        txStatusMatch.transaction_status = "completed";
        break;
      case "rejected":
        txStatusMatch.transaction_status = "rejected"; // make sure enum matches this
        break;
      case "all":
      default:
        break;
    }

    // ------------------------------------
    // 2) Role-based filter (who can see what)
    // ------------------------------------
    let roleMatch = {};

    if (user_role === "supervisor") {
      roleMatch = {
        $or: [
          {
            "approval.supervisor_approval.status": false,
            "approval.manager_approval.status": false,
            "approval.admin_approval.status": false,
          },
          {
            "approval.supervisor_approval.user_id": approverId,
          },
        ],
      };
    } else if (user_role === "manager") {
      roleMatch = {
        $or: [
          {
            "approval.supervisor_approval.status": true,
            "approval.manager_approval.status": false,
          },
          {
            "approval.manager_approval.user_id": approverId,
          },
        ],
      };
    } else if (user_role === "admin") {
      roleMatch = {
        $or: [
          {
            "approval.manager_approval.status": true,
            "approval.admin_approval.status": false,
          },
          {
            "approval.admin_approval.user_id": approverId,
          },
        ],
      };
    }

    // ------------------------------------
    // 3) Base pipeline for main list (with current status filter)
    // ------------------------------------
    const basePipeline = [
      // filter by transaction status (if any)
      Object.keys(txStatusMatch).length ? { $match: txStatusMatch } : null,

      // only deposit approvals
      { $match: { transaction_type: "deposit" } },

      // join approval
      {
        $lookup: {
          from: "approvals",
          localField: "approval_status",
          foreignField: "_id",
          as: "approval",
        },
      },
      { $unwind: "$approval" },

      // role-based filter
      { $match: roleMatch },

      // main user (farmer)
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // warehouse
      {
        $lookup: {
          from: "warehouses",
          localField: "warehouse_id",
          foreignField: "_id",
          as: "warehouse",
        },
      },
      {
        $unwind: {
          path: "$warehouse",
          preserveNullAndEmptyArrays: true,
        },
      },

      // grain categories
      {
        $lookup: {
          from: "graincategories",
          localField: "grain.category_id",
          foreignField: "_id",
          as: "grain_categories",
        },
      },

      // approver users
      {
        $lookup: {
          from: "users",
          localField: "approval.supervisor_approval.user_id",
          foreignField: "_id",
          as: "supervisor_user",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "approval.manager_approval.user_id",
          foreignField: "_id",
          as: "manager_user",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "approval.admin_approval.user_id",
          foreignField: "_id",
          as: "admin_user",
        },
      },
      {
        $addFields: {
          supervisor_user: { $arrayElemAt: ["$supervisor_user", 0] },
          manager_user: { $arrayElemAt: ["$manager_user", 0] },
          admin_user: { $arrayElemAt: ["$admin_user", 0] },
        },
      },

      // grain: qty/price/moisture + category{grain_type,quality}
      {
        $addFields: {
          grain: {
            $map: {
              input: "$grain",
              as: "g",
              in: {
                quantity_quintal: "$$g.quantity_quintal",
                price_per_quintal: "$$g.price_per_quintal",
                moisture_content: "$$g.moisture_content",
                category: {
                  $let: {
                    vars: {
                      cat: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$grain_categories",
                              as: "gc",
                              cond: { $eq: ["$$gc._id", "$$g.category_id"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      grain_type: "$$cat.grain_type",
                      quality: "$$cat.quality",
                    },
                  },
                },
              },
            },
          },
        },
      },

      // approvals: add user info if present
      {
        $addFields: {
          "approval.admin_approval": {
            $cond: [
              { $ne: ["$approval.admin_approval.user_id", null] },
              {
                status: "$approval.admin_approval.status",
                date: "$approval.admin_approval.date",
                user: {
                  name: "$admin_user.name",
                  role: "$admin_user.role",
                },
              },
              {
                status: "$approval.admin_approval.status",
              },
            ],
          },
          "approval.manager_approval": {
            $cond: [
              { $ne: ["$approval.manager_approval.user_id", null] },
              {
                status: "$approval.manager_approval.status",
                date: "$approval.manager_approval.date",
                user: {
                  name: "$manager_user.name",
                  role: "$manager_user.role",
                },
              },
              {
                status: "$approval.manager_approval.status",
              },
            ],
          },
          "approval.supervisor_approval": {
            $cond: [
              { $ne: ["$approval.supervisor_approval.user_id", null] },
              {
                status: "$approval.supervisor_approval.status",
                date: "$approval.supervisor_approval.date",
                user: {
                  name: "$supervisor_user.name",
                  role: "$supervisor_user.role",
                },
              },
              {
                status: "$approval.supervisor_approval.status",
              },
            ],
          },
        },
      },

      // remove raw ids & helper arrays
      {
        $unset: [
          "user_id",
          "warehouse_id",
          "approval_status",
          "grain.category_id",
          "grain_categories",
          "supervisor_user",
          "manager_user",
          "admin_user",
        ],
      },

      // final projection
      {
        $project: {
          _id: 1,
          transaction_type: 1,
          transaction_status: 1,
          total_amount: 1,
          transaction_date: 1,

          month: {
            $cond: [{ $ne: ["$month", null] }, "$month", "$$REMOVE"],
          },
          remarks: {
            $cond: [{ $ne: ["$remarks", null] }, "$remarks", "$$REMOVE"],
          },

          grain: 1,

          user: {
            _id: "$user._id",
            name: "$user.name",
            role: "$user.role",
            phone_number: "$user.phone_number",
            email: "$user.email",
          },

          warehouse: {
            $cond: [
              {
                $and: [
                  { $ne: ["$warehouse", null] },
                  { $ne: ["$warehouse._id", null] },
                ],
              },
              {
                _id: "$warehouse._id",
                name: "$warehouse.name",
                location: "$warehouse.location",
              },
              "$$REMOVE",
            ],
          },

          approval: {
            admin_approval: "$approval.admin_approval",
            manager_approval: "$approval.manager_approval",
            supervisor_approval: "$approval.supervisor_approval",
          },
        },
      },
    ].filter(Boolean);

    // ------------------------------------
    // 4) Pagination using $facet
    // ------------------------------------
    const paginatedPipeline = [
      ...basePipeline,
      { $sort: { transaction_date: -1 } }, // optional sort
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limitNum },
          ],
          totalCount: [
            { $count: "count" },
          ],
        },
      },
    ];

    // ------------------------------------
    // 5) Status-wise counts & total_value (ignoring current status filter)
    //    but respecting role-based visibility
    // ------------------------------------
    const statusCountsPipeline = [
      { $match: { transaction_type: "deposit" } },
      {
        $lookup: {
          from: "approvals",
          localField: "approval_status",
          foreignField: "_id",
          as: "approval",
        },
      },
      { $unwind: "$approval" },
      { $match: roleMatch },
      {
        $group: {
          _id: "$transaction_status",
          count: { $sum: 1 },
          total_value: { $sum: "$total_amount" },
        },
      },
    ];

    const [paginatedResult, statusCountsResult] = await Promise.all([
      Transaction.aggregate(paginatedPipeline),
      Transaction.aggregate(statusCountsPipeline),
    ]);

    const facet = paginatedResult[0] || { data: [], totalCount: [] };
    const transactions = facet.data || [];
    const totalItems =
      (facet.totalCount[0] && facet.totalCount[0].count) || 0;

    // Build counts + total values
    let allCount = 0;
    let allTotalValue = 0;
    let pendingCount = 0,
      completedCount = 0,
      rejectedCount = 0;
    let pendingValue = 0,
      completedValue = 0,
      rejectedValue = 0;

    statusCountsResult.forEach((doc) => {
      const st = doc._id;
      const c = doc.count || 0;
      const v = doc.total_value || 0;

      allCount += c;
      allTotalValue += v;

      if (st === "pending") {
        pendingCount = c;
        pendingValue = v;
      } else if (st === "completed") {
        completedCount = c;
        completedValue = v;
      } else if (st === "rejected") {
        rejectedCount = c;
        rejectedValue = v;
      }
    });

    return res.status(200).json({
      status, // current filter
      role: user_role,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total_items: totalItems,
        total_pages: totalItems ? Math.ceil(totalItems / limitNum) : 0,
      },
      counts: {
        all: {
          count: allCount,
          total_value: allTotalValue,
        },
        pending: {
          count: pendingCount,
          total_value: pendingValue,
        },
        completed: {
          count: completedCount,
          total_value: completedValue,
        },
        rejected: {
          count: rejectedCount,
          total_value: rejectedValue,
        },
      },
      data: transactions,
    });
  } catch (error) {
    console.error("Error fetching role-based approvals:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const action_deposite_approvals = async (req, res) => {
  try {
    const { action, transactionId } = req.body;
    const userId = req.user?.userId;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const role = user.role;
    const allowed = ["manager", "supervisor", "admin"];
    if (!allowed.includes(role)) {
      return res
        .status(403)
        .json({ message: "Not authorized for transaction approvals" });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    if (transaction.transaction_type !== "deposit") {
      return res
        .status(400)
        .json({ message: "Only deposit transactions allowed here" });
    }

    if (["completed", "Rejected"].includes(transaction.transaction_status)) {
      return res.status(400).json({
        message: `Transaction already ${transaction.transaction_status}`,
      });
    }

    const approval = await Approval.findById(transaction.approval_status);
    if (!approval)
      return res.status(404).json({ message: "Approval not found" });

    const now = new Date();

    // ----------------------------------------------------------------------------
    // 🔹 HELPER – Add to pending_quantity in USER's StorageBucket
    // ----------------------------------------------------------------------------
    const addToPendingQuantity = async () => {
      const bucketOwnerType = "User";
      const bucketOwnerId = transaction.user_id;

      if (!bucketOwnerId) {
        console.warn("No user_id on transaction, skipping StorageBucket update");
        return;
      }

      let bucket = await StorageBucket.findOne({
        bucket_owner_type: bucketOwnerType,
        bucket_owner_id: bucketOwnerId,
      });

      // If bucket doesn't exist, create it
      if (!bucket) {
        bucket = new StorageBucket({
          bucket_owner_type: bucketOwnerType,
          bucket_owner_id: bucketOwnerId,
          categories: [],
        });
      }

      // Loop through grains in the transaction
      for (const g of transaction.grain) {
        const categoryId = g.category_id;
        const qtyToAdd = Number(g.quantity_quintal || 0);

        const idx = bucket.categories.findIndex(
          (c) => c.category_id.toString() === categoryId.toString()
        );

        if (idx === -1) {
          // Category doesn't exist, create it with pending quantity
          bucket.categories.push({
            category_id: categoryId,
            warehouse_storage: [],
            pending_quantity: qtyToAdd,
            total_quantity: 0,
          });
        } else {
          // Category exists, add to pending quantity
          const cat = bucket.categories[idx];
          const currentPending = Number(cat.pending_quantity || 0);
          cat.pending_quantity = currentPending + qtyToAdd;
        }
      }

      bucket.markModified("categories");
      await bucket.save();
    };

    // ----------------------------------------------------------------------------
    // 🔹 HELPER – Remove from pending_quantity in USER's StorageBucket
    // ----------------------------------------------------------------------------
    const removeFromPendingQuantity = async () => {
      const bucketOwnerType = "User";
      const bucketOwnerId = transaction.user_id;

      if (!bucketOwnerId) {
        console.warn("No user_id on transaction");
        return;
      }

      const bucket = await StorageBucket.findOne({
        bucket_owner_type: bucketOwnerType,
        bucket_owner_id: bucketOwnerId,
      });

      if (!bucket) return;

      for (const g of transaction.grain) {
        const categoryId = g.category_id;
        const qtyToRemove = Number(g.quantity_quintal || 0);

        const cat = bucket.categories.find(
          (c) => c.category_id.toString() === categoryId.toString()
        );

        if (cat) {
          const currentPending = Number(cat.pending_quantity || 0);
          cat.pending_quantity = Math.max(0, currentPending - qtyToRemove);
        }
      }

      bucket.markModified("categories");
      await bucket.save();
    };

    // ----------------------------------------------------------------------------
    // 🔹 HELPER – Admin direct approval: Add directly to total_quantity in USER's account
    // ----------------------------------------------------------------------------
    const addDirectlyToTotal = async () => {
      const bucketOwnerType = "User";
      const bucketOwnerId = transaction.user_id;

      if (!bucketOwnerId) {
        console.warn("No user_id on transaction, skipping StorageBucket update");
        return;
      }

      let bucket = await StorageBucket.findOne({
        bucket_owner_type: bucketOwnerType,
        bucket_owner_id: bucketOwnerId,
      });

      // If bucket doesn't exist, create it
      if (!bucket) {
        bucket = new StorageBucket({
          bucket_owner_type: bucketOwnerType,
          bucket_owner_id: bucketOwnerId,
          categories: [],
        });
      }

      for (const g of transaction.grain) {
        const categoryId = g.category_id;
        const qtyToAdd = Number(g.quantity_quintal || 0);

        const idx = bucket.categories.findIndex(
          (c) => c.category_id.toString() === categoryId.toString()
        );

        if (idx === -1) {
          // Category doesn't exist, create it directly in total
          bucket.categories.push({
            category_id: categoryId,
            warehouse_storage: [
              {
                transaction_id: transaction._id,
                created_at: new Date(),
              },
            ],
            pending_quantity: 0,
            total_quantity: qtyToAdd,
          });
        } else {
          // Category exists, add to total
          const cat = bucket.categories[idx];
          
          cat.warehouse_storage.push({
            transaction_id: transaction._id,
            created_at: new Date(),
          });

          const currentTotal = Number(cat.total_quantity || 0);
          cat.total_quantity = currentTotal + qtyToAdd;
        }
      }

      bucket.markModified("categories");
      await bucket.save();
    };

    // ----------------------------------------------------------------------------
    // 🔹 HELPER – Move from pending to total in USER's account
    // ----------------------------------------------------------------------------
    const movePendingToTotal = async () => {
      const bucketOwnerType = "User";
      const bucketOwnerId = transaction.user_id;

      if (!bucketOwnerId) {
        console.warn("No user_id on transaction");
        return;
      }

      const bucket = await StorageBucket.findOne({
        bucket_owner_type: bucketOwnerType,
        bucket_owner_id: bucketOwnerId,
      });

      if (!bucket) {
        console.error("StorageBucket not found during admin approval");
        return;
      }

      for (const g of transaction.grain) {
        const categoryId = g.category_id;
        const qtyToMove = Number(g.quantity_quintal || 0);

        const cat = bucket.categories.find(
          (c) => c.category_id.toString() === categoryId.toString()
        );

        if (!cat) {
          console.error(`Category ${categoryId} not found in bucket`);
          continue;
        }

        // Add to transaction history
        cat.warehouse_storage.push({
          transaction_id: transaction._id,
          created_at: new Date(),
        });

        // Get current values
        const currentPending = Number(cat.pending_quantity || 0);
        const currentTotal = Number(cat.total_quantity || 0);

        // Move from pending to total
        cat.pending_quantity = Math.max(0, currentPending - qtyToMove);
        cat.total_quantity = currentTotal + qtyToMove;
      }

      bucket.markModified("categories");
      await bucket.save();
    };

    // ----------------------------------------------------------------------------
    // 🟨 SUPERVISOR FLOW
    // ----------------------------------------------------------------------------
    if (role === "supervisor") {
      if (approval.supervisor_approval?.date) {
        return res
          .status(400)
          .json({ message: "Supervisor has already taken action" });
      }

      if (action === "approve") {
        approval.supervisor_approval = {
          user_id: userId,
          status: true,
          date: now,
        };
        await approval.save();

        transaction.transaction_status = "pending";
        await transaction.save();

        // ✅ Add to USER's pending_quantity when supervisor approves
        await addToPendingQuantity();

        return res
          .status(200)
          .json({ message: "Supervisor approved successfully" });
      } else {
        approval.supervisor_approval = {
          user_id: userId,
          status: false,
          date: now,
        };
        await approval.save();

        transaction.transaction_status = "Rejected";
        await transaction.save();

        return res
          .status(200)
          .json({ message: "Supervisor rejected the transaction" });
      }
    }

    // ----------------------------------------------------------------------------
    // 🟩 MANAGER FLOW
    // ----------------------------------------------------------------------------
    if (role === "manager") {
      if (approval.manager_approval?.date) {
        return res
          .status(400)
          .json({ message: "Manager has already taken action" });
      }

      if (action === "approve") {
        approval.manager_approval = {
          user_id: userId,
          status: true,
          date: now,
        };
        await approval.save();

        transaction.transaction_status = "pending";
        await transaction.save();

        // ✅ Add to USER's pending_quantity when manager approves
        // (Only if supervisor hasn't already added it)
        if (!approval.supervisor_approval?.status) {
          await addToPendingQuantity();
        }

        return res
          .status(200)
          .json({ message: "Manager approved successfully" });
      } else {
        approval.manager_approval = {
          user_id: userId,
          status: false,
          date: now,
        };
        await approval.save();

        transaction.transaction_status = "Rejected";
        await transaction.save();

        // ✅ Only remove from USER's pending if supervisor had added it
        if (approval.supervisor_approval?.status) {
          await removeFromPendingQuantity();
        }

        return res
          .status(200)
          .json({ message: "Manager rejected the transaction" });
      }
    }

    // ----------------------------------------------------------------------------
    // 🟥 ADMIN FLOW
    // ----------------------------------------------------------------------------
    if (role === "admin") {
      if (approval.admin_approval?.date) {
        return res
          .status(400)
          .json({ message: "Admin has already taken action" });
      }

      if (action === "approve") {
        approval.admin_approval = {
          user_id: userId,
          status: true,
          date: now,
        };
        await approval.save();

        transaction.transaction_status = "completed";
        await transaction.save();

        // ✅ Check if Manager OR Supervisor already approved
        const hasLowerApproval = 
          approval.supervisor_approval?.status || 
          approval.manager_approval?.status;

        if (hasLowerApproval) {
          // Move from pending to total in USER's account
          await movePendingToTotal();
        } else {
          // Admin approved directly, add directly to USER's total
          await addDirectlyToTotal();
        }

        return res.status(200).json({
          message: "Admin approved & user storage bucket updated successfully",
        });
      } else {
        approval.admin_approval = {
          user_id: userId,
          status: false,
          date: now,
        };
        await approval.save();

        transaction.transaction_status = "Rejected";
        await transaction.save();

        // ✅ Check if there's pending quantity to remove from USER's account
        const hasLowerApproval = 
          approval.supervisor_approval?.status || 
          approval.manager_approval?.status;

        if (hasLowerApproval) {
          // Remove from USER's pending (it was added by supervisor/manager)
          await removeFromPendingQuantity();
        }

        return res.status(200).json({
          message: "Admin rejected the transaction",
        });
      }
    }

    return res.status(400).json({ message: "Unknown role" });
  } catch (error) {
    console.error("Error in deposit approval action:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export {
  get_deposite_approvals,
  action_deposite_approvals,
};
