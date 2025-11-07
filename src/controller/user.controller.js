import TransactionHistory from "../model/Transaction.model.js";
import StorageBucket from "../model/StorageBucket.model.js";
import GrainCategories from "../model/GrainCategories.model.js";
import User from "../model/Users.model.js";

const dashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // ✅ Fetch user's storage buckets
    const userGrains = await StorageBucket.find({ bucket_owner_id: userId }).lean();

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
        if (tx.transaction_type === "deposit") userAccountBalance += quantity * price;
        else if (tx.transaction_type === "sell") userAccountBalance -= quantity * price;
        else if (tx.transaction_type === "credit") userAccountBalance -= quantity * todayPricePerQtl;

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

    // Fetch user's grain buckets
    const userGrains = await StorageBucket.find({ bucket_owner_id: userId }).lean();

    if (!userGrains.length) {
      return res.status(200).json({
        message: "No grain data found for this user",
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
      if (!price_history.length) return;
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
    const deposits = categories.map((cat) => {
      const catPriceInfo = todayPriceMap[cat.category_id.toString()] || {};
      let todayPricePerQtl = 0;
      if (catPriceInfo.quality === "A") todayPricePerQtl = catPriceInfo.max || 0;
      else if (catPriceInfo.quality === "B") todayPricePerQtl = catPriceInfo.avg || 0;
      else if (catPriceInfo.quality === "C") todayPricePerQtl = catPriceInfo.min || 0;

      return {
        category_id: cat.category_id,
        total_quantity: cat.total_quantity,
        grain_type: catPriceInfo.grain_type || null,
        quality: catPriceInfo.quality || null,
        today_price_per_quintal: todayPricePerQtl,
        total_value: (cat.total_quantity || 0) * todayPricePerQtl,
      };
    });

    return res.status(200).json({ message: "Grain deposits fetched successfully", deposits });
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
    else if (quality === "B") todayPricePerQtl = latestPrice?.avgprice?.price || 0;
    else if (quality === "C") todayPricePerQtl = latestPrice?.minprice?.price || 0;

    // ✅ Fetch all transactions containing this category
    const transactions = await TransactionHistory.find({
      user_id: userId,
      "grain.category_id": category_id,
      transaction_type: { $in: ["deposit", "sell", "credit"] },
    }).lean();

    // ✅ Prepare detailed response
    const txDetails = [];

    transactions.forEach((tx) => {
      const grainItem = tx.grain.find(
        (g) => g.category_id.toString() === category_id
      );
      if (!grainItem) return;

      const { quantity_quintal, price_per_quintal } = grainItem;
      const quantity = quantity_quintal || 0;
      const depositPrice = price_per_quintal || 0;
      const profitPerQtl = todayPricePerQtl - depositPrice;
      const profitPercent =
        depositPrice > 0 ? ((todayPricePerQtl - depositPrice) / depositPrice) * 100 : 0;

      txDetails.push({
        type: tx.transaction_type,
        symbol: tx.transaction_type === "deposit" || tx.transaction_type === "credit" ? "+" : "-",
        transactionDate: tx.transaction_date,
        quantity,
        depositPrice,
        todayPrice: todayPricePerQtl,
        profitPerQtl,
        profitPercent: Number(profitPercent.toFixed(2)),
        totalAmount: quantity * depositPrice,
      });
    });

    // ✅ Final response
    return res.status(200).json({
      message: "Category transaction details fetched successfully",
      category_id,
      grain_type,
      quality,
      todayPricePerQtl,
      transactions: txDetails,
    });
  } catch (error) {
    console.error("Error fetching category transactions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const findUserDetails = async (req, res) => {
  try {
    let { name, email, phone_number, userId } = req.query; // get from query params

    if (!name && !email && !phone_number && !userId) {
      return res
        .status(400)
        .json({ message: "At least one search parameter is required" });
    }

    // Convert userId to uppercase if provided
    if (userId) {
      userId = userId.toUpperCase();
    }

    // Build search conditions dynamically
    const searchConditions = [];
    if (name) searchConditions.push({ name: { $regex: name, $options: "i" } }); // case-insensitive
    if (email) searchConditions.push({ email: { $regex: email, $options: "i" } }); // case-insensitive
    if (phone_number) searchConditions.push({ phone_number: { $regex: phone_number, $options: "i" } }); // partial match
    if (userId) searchConditions.push({ userId: userId });

    // Fetch all matching users with limit of 5
    const users = await User.find({ $or: searchConditions })
      .select("name email phone_number _id user_image userId")
      .limit(5);

    if (!users.length) {
      return res.status(404).json({ message: "No users found" });
    }

    return res.status(200).json({ message: "Users found", users });
  } catch (error) {
    console.error("Error finding users:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export { dashboardAnalytics, getAllGrainDeposite,categoryTransactionDetails,findUserDetails };
