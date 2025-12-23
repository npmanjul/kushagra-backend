import User from "../model/Users.model.js";
import Warehouse from "../model/Warehouses.model.js";
import TransactionHistory from "../model/Transaction.model.js";

const userAllTransactions = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const { transaction_type, page = 1, limit = 10 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const allowedTypes = ["sell", "deposit", "withdraw", "loan"];

    // Build base filter
    const filter = { user_id: userId };

    if (transaction_type) {
      if (!allowedTypes.includes(transaction_type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid transaction type",
        });
      }
      filter.transaction_type = transaction_type;
    }

    // Pagination
    const pageNumber = Math.max(parseInt(page), 1);
    const limitNumber = Math.max(parseInt(limit), 1);
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch transactions with complete information
    const transactions = await TransactionHistory.find(filter)
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
        select: "name location",
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

    // Get total count for pagination
    const totalRecords = await TransactionHistory.countDocuments(filter);

    // Get transaction counts by type
    const typeCountsAgg = await TransactionHistory.aggregate([
      { $match: { user_id: user._id } },
      {
        $group: {
          _id: "$transaction_type",
          count: { $sum: 1 },
        },
      },
    ]);

    const transactionCounts = {
      sell: 0,
      deposit: 0,
      withdraw: 0,
      loan: 0,
    };

    typeCountsAgg.forEach((item) => {
      transactionCounts[item._id] = item.count;
    });

    return res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
      },
      pagination: {
        currentPage: pageNumber,
        limit: limitNumber,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNumber),
      },
      transactionCounts,
      data: transactions,
    });
  }
  catch (error) {
    console.error("Error fetching user transactions:", error);
    return res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

const allTransactions = async (req, res) => {
  try {
    const { transaction_type, page = 1, limit = 10 } = req.query;

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    const userRole = user.role;
    const allowedRoles = ["admin", "manager", "supervisor"];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const allowedTypes = ["sell", "deposit", "withdraw", "loan"];

    // -----------------------------
    // Build base filter
    // -----------------------------
    const filter = {};

    if (transaction_type) {
      if (!allowedTypes.includes(transaction_type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid transaction type",
        });
      }
      filter.transaction_type = transaction_type;
    }

    let warehouseDetails ;

    // -----------------------------
    // Role-based warehouse filter
    // -----------------------------
    if (userRole === "manager" || userRole === "supervisor") {

      // Find warehouse for this employee
      const warehouse = await Warehouse.findOne({
        $or: [
          { manager_id: user._id },
          { supervisor_id: user._id },
        ],
      });

      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not assigned" });
      }


      warehouseDetails= `${warehouse.name} - ${warehouse.location}`;

      // Restrict transactions to this warehouse
      filter.warehouse_id = warehouse._id;
    }

    // -----------------------------
    // Pagination
    // -----------------------------
    const pageNumber = Math.max(parseInt(page), 1);
    const limitNumber = Math.max(parseInt(limit), 1);
    const skip = (pageNumber - 1) * limitNumber;

    // -----------------------------
    // Fetch transactions
    // -----------------------------
    const transactions = await TransactionHistory.find(filter)
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
        select: "name location",
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

    // -----------------------------
    // Pagination count
    // -----------------------------
    const totalRecords = await TransactionHistory.countDocuments(filter);

    // -----------------------------
    // Transaction type counts
    // -----------------------------
    const typeCountsAgg = await TransactionHistory.aggregate([
      { $match: filter.warehouse_id ? { warehouse_id: filter.warehouse_id } : {} },
      {
        $group: {
          _id: "$transaction_type",
          count: { $sum: 1 },
        },
      },
    ]);

    const transactionCounts = {
      sell: 0,
      deposit: 0,
      withdraw: 0,
      loan: 0,
    };

    typeCountsAgg.forEach((item) => {
      transactionCounts[item._id] = item.count;
    });

    
    // -----------------------------
    // Final response
    // -----------------------------
    return res.status(200).json({
      success: true,
      role: userRole,
      pagination: {
        currentPage: pageNumber,
        limit: limitNumber,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNumber),
      },
      transactionCounts,
      warehouse: warehouseDetails? warehouseDetails : "All Warehouses",
      data: transactions,
    });

  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export { userAllTransactions, allTransactions };