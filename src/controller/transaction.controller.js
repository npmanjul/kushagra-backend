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
    const { 
      transaction_type, 
      page = 1, 
      limit = 10,
      start_date,
      end_date,
      status,
      search,
      min_amount,
      max_amount,
      grain_type,
      warehouse_id
    } = req.query;

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

    // Transaction type filter
    if (transaction_type) {
      if (!allowedTypes.includes(transaction_type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid transaction type",
        });
      }
      filter.transaction_type = transaction_type;
    }

    // Date range filter
    if (start_date || end_date) {
      filter.transaction_date = {};
      if (start_date) {
        filter.transaction_date.$gte = new Date(start_date);
      }
      if (end_date) {
        const endDate = new Date(end_date);
        endDate.setHours(23, 59, 59, 999);
        filter.transaction_date.$lte = endDate;
      }
    }

    // Amount range filter
    if (min_amount || max_amount) {
      filter.total_amount = {};
      if (min_amount) {
        filter.total_amount.$gte = parseFloat(min_amount);
      }
      if (max_amount) {
        filter.total_amount.$lte = parseFloat(max_amount);
      }
    }

    // Status filter
    if (status) {
      const allowedStatuses = ["pending", "approved", "rejected"];
      if (allowedStatuses.includes(status)) {
        filter.status = status;
      }
    }

    // Grain type filter
    if (grain_type) {
      filter["grain.grain_type"] = { $regex: grain_type, $options: "i" };
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
    } else if (userRole === "admin" && warehouse_id) {
      // Admin can filter by specific warehouse
      filter.warehouse_id = warehouse_id;
    }

    // -----------------------------
    // Search filter (user name, phone, email)
    // -----------------------------
    let userSearchIds = [];
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      const matchedUsers = await User.find({
        $or: [
          { name: searchRegex },
          { phone_number: searchRegex },
          { email: searchRegex },
        ],
      }).select("_id").lean();
      
      userSearchIds = matchedUsers.map(u => u._id);
      if (userSearchIds.length > 0) {
        filter.user_id = { $in: userSearchIds };
      } else {
        // No users matched, return empty result
        return res.status(200).json({
          success: true,
          role: userRole,
          pagination: {
            currentPage: parseInt(page),
            limit: parseInt(limit),
            totalRecords: 0,
            totalPages: 0,
          },
          transactionCounts: { sell: 0, deposit: 0, withdraw: 0, loan: 0 },
          warehouse: warehouseDetails || "All Warehouses",
          filters: req.query,
          data: [],
        });
      }
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
      filters: {
        transaction_type: transaction_type || "all",
        date_range: start_date || end_date ? { start_date, end_date } : "all",
        status: status || "all",
        search: search || null,
        amount_range: min_amount || max_amount ? { min_amount, max_amount } : "all",
        grain_type: grain_type || "all",
      },
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