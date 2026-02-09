import TransactionHistory from "../model/Transaction.model.js";
import StorageBucket from "../model/StorageBucket.model.js";
import GrainCategories from "../model/GrainCategories.model.js";

const getAvailableLoan = async (req, res) => {
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
        availableCredit: 0,
        totalGrainQuantity: 0,
        totalValue: 0,
      });
    }

    // ✅ Extract all category IDs
    const allCategoryIds = userGrains.flatMap((bucket) =>
      bucket.categories.map((cat) => cat.category_id)
    );

    // ✅ Fetch category details with price history
    const categoriesDetails = await GrainCategories.find({
      _id: { $in: allCategoryIds },
    })
      .select("grain_type quality price_history")
      .populate("price_history")
      .lean();

    // ✅ Prepare today's price map
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

    // ✅ Fetch deposit and sell transactions
    const transactions = await TransactionHistory.find({
      user_id: userId,
      transaction_type: { $in: ["deposit", "sell"] },
      grain_category_id: { $in: allCategoryIds },
    }).lean();

    // ✅ Calculate total quantity & total value
    let totalValue = 0;
    let totalGrainQuantity = 0;

    for (const cat of categoriesDetails) {
      const catId = cat._id.toString();
      const grainType = cat.grain_type;
      const quality = cat.quality;

      const todayPrices = todayPriceMap[grainType] || {};
      let todayPricePerQtl = 0;
      if (quality === "A") todayPricePerQtl = todayPrices.max || 0;
      else if (quality === "B") todayPricePerQtl = todayPrices.avg || 0;
      else if (quality === "C") todayPricePerQtl = todayPrices.min || 0;

      const catTx = transactions.filter(
        (tx) => tx.grain_category_id.toString() === catId
      );

      // compute net quantity
      let totalQuantity = 0;
      for (const tx of catTx) {
        const quantity = tx.quantity_quintal || 0;
        if (tx.transaction_type === "deposit") totalQuantity += quantity;
        if (tx.transaction_type === "sell") totalQuantity -= quantity;
      }

      // ✅ accumulate totals
      totalGrainQuantity += totalQuantity;
      totalValue += totalQuantity * todayPricePerQtl;
    }

    // ✅ Available credit = 60% of total current market value
    const availableCredit = 0.6 * totalValue;

    return res.status(200).json({
      message: "Available credit fetched successfully",
      availableCredit,
    });
  } catch (error) {
    console.error("Error fetching available credit:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const loanCalculation = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { loan_amount } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!loan_amount || loan_amount <= 0) {
      return res.status(400).json({ message: "Loan amount must be greater than 0" });
    }

    // ✅ Fetch user's storage buckets
    const userGrains = await StorageBucket.find({
      bucket_owner_id: userId,
    }).lean();

    if (!userGrains.length) {
      return res.status(200).json({
        message: "No grain data found for this user",
      });
    }

    // ✅ Extract all category IDs
    const allCategoryIds = userGrains.flatMap((bucket) =>
      bucket.categories.map((cat) => cat.category_id)
    );

    // ✅ Fetch category details with price history
    const categoriesDetails = await GrainCategories.find({
      _id: { $in: allCategoryIds },
    })
      .select("grain_type quality price_history")
      .populate("price_history")
      .lean();

    // ✅ Prepare today's price map
    const todayPriceMap = {};
    categoriesDetails.forEach((grain) => {
      const { grain_type, price_history } = grain;
      if (!price_history.length) return;
      const latestPrice = price_history[price_history.length - 1];
      todayPriceMap[grain._id.toString()] = {
        grain_type,
        quality: grain.quality,
        max: latestPrice.maxprice.price,
        avg: latestPrice.avgprice.price,
        min: latestPrice.minprice.price,
      };
    });

    // ✅ Calculate total grain value for all categories
    const categoryValues = [];

    for (const bucket of userGrains) {
      for (const cat of bucket.categories) {
        const catId = cat.category_id.toString();
        const catPriceInfo = todayPriceMap[catId];
        if (!catPriceInfo) continue;

        let todayPricePerQtl = 0;
        if (catPriceInfo.quality === "A") todayPricePerQtl = catPriceInfo.max;
        else if (catPriceInfo.quality === "B") todayPricePerQtl = catPriceInfo.avg;
        else if (catPriceInfo.quality === "C") todayPricePerQtl = catPriceInfo.min;

        const categoryValue = (cat.total_quantity || 0) * todayPricePerQtl;

        categoryValues.push({
          category_id: catId,
          grain_type: catPriceInfo.grain_type,
          quality: catPriceInfo.quality,
          todayPricePerQtl,
          categoryValue,
        });
      }
    }

    const totalValue = categoryValues.reduce((sum, c) => sum + c.categoryValue, 0);
    if (totalValue <= 0) {
      return res.status(200).json({ message: "No valid grain value found for user" });
    }

    // ✅ Distribute loan amount proportionally
    const loanDistribution = categoryValues.map((cat) => {
      const shareRatio = cat.categoryValue / totalValue;
      const allocatedLoan = shareRatio * loan_amount;
      const loan_allocated_quantity = cat.todayPricePerQtl
        ? parseFloat((allocatedLoan / cat.todayPricePerQtl).toFixed(2))
        : 0;

      return {
        category_id: cat.category_id,
        grain_type: cat.grain_type,
        quality: cat.quality,
        todayPricePerQtl: cat.todayPricePerQtl,
        loan_allocated: parseFloat(allocatedLoan.toFixed(2)),
        loan_allocated_quantity,
      };
    });

    // ✅ Ensure total matches loan_amount
    const totalAllocated = loanDistribution.reduce((sum, c) => sum + c.loan_allocated, 0);
    const adjustment = loan_amount - totalAllocated;
    if (Math.abs(adjustment) > 0.01) {
      loanDistribution[loanDistribution.length - 1].loan_allocated += adjustment;
    }

    return res.status(200).json({
      message: "Loan distribution calculated successfully",
      totalLoanAmount: loan_amount,
      totalGrainValue: totalValue,
      distribution: loanDistribution,
    });
  } catch (error) {
    console.error("Error fetching loan calculation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const loanApply = async (req, res) => {
  try {
    const { loan_amount, months, distribution } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!loan_amount || loan_amount <= 0) {
      return res.status(400).json({ message: "Loan amount must be greater than 0" });
    }

    if (!months || months <= 0) {
      return res.status(400).json({ message: "Loan tenure must be greater than 0" });
    }

    if (!distribution || !Array.isArray(distribution) || distribution.length === 0) {
      return res.status(400).json({ message: "Invalid grain distribution data" });
    }

    const warehouseId = "68f07799848c4a9a87a61474";

    // ✅ Ensure warehouse bucket exists
    let warehouseBucket = await StorageBucket.findOne({
      bucket_owner_id: warehouseId,
      bucket_owner_type: "Warehouse",
    });

    if (!warehouseBucket) {
      warehouseBucket = await StorageBucket.create({
        bucket_owner_id: warehouseId,
        bucket_owner_type: "Warehouse",
        categories: [],
      });
    }

    // ✅ Subtract grains from user and add to warehouse
    for (const item of distribution) {
      const { category_id, loan_allocated_quantity, todayPricePerQtl } = item;

      // Subtract from user's bucket
      await StorageBucket.findOneAndUpdate(
        {
          bucket_owner_id: userId,
          bucket_owner_type: "User",
          "categories.category_id": category_id,
        },
        {
          $inc: {
            "categories.$.total_quantity": -loan_allocated_quantity,
          },
          $push: {
            "categories.$.warehouse_storage": {
              transaction_id: null,
              created_at: new Date(),
            },
          },
        }
      );

      // Ensure category exists in warehouse bucket
      const existingCategory = await StorageBucket.findOne({
        bucket_owner_id: warehouseId,
        bucket_owner_type: "Warehouse",
        "categories.category_id": category_id,
      });

      if (!existingCategory) {
        await StorageBucket.updateOne(
          {
            bucket_owner_id: warehouseId,
            bucket_owner_type: "Warehouse",
          },
          {
            $push: {
              categories: {
                category_id,
                total_quantity: 0,
                warehouse_storage: [],
              },
            },
          }
        );
      }

      // Add to warehouse bucket
      await StorageBucket.findOneAndUpdate(
        {
          bucket_owner_id: warehouseId,
          bucket_owner_type: "Warehouse",
          "categories.category_id": category_id,
        },
        {
          $inc: {
            "categories.$.total_quantity": loan_allocated_quantity,
          },
          $push: {
            "categories.$.warehouse_storage": {
              transaction_id: null,
              created_at: new Date(),
            },
          },
        }
      );
    }

    // ✅ Subtract loan amount from user account balance
    await StorageBucket.findOneAndUpdate(
      { bucket_owner_id: userId, bucket_owner_type: "User" },
      { $inc: { account_balance: -loan_amount } } // make sure `account_balance` exists in user model
    );

    // ✅ Create transaction
    const transaction = await TransactionHistory.create({
      transaction_type: "credit",
      user_id: userId,
      warehouse_id: warehouseId,
      grain: distribution.map((item) => ({
        category_id: item.category_id,
        quantity_quintal: item.loan_allocated_quantity,
        price_per_quintal: item.todayPricePerQtl,
      })),
      total_amount: loan_amount,
      remarks: `Loan applied for ₹${loan_amount} for ${months} months`,
    });

    // ✅ Update transaction_id references in warehouse storage
    await StorageBucket.updateMany(
      {
        bucket_owner_type: "Warehouse",
        bucket_owner_id: warehouseId,
        "categories.category_id": { $in: distribution.map((c) => c.category_id) },
      },
      {
        $set: {
          "categories.$[].warehouse_storage.$[elem].transaction_id": transaction._id,
        },
      },
      {
        arrayFilters: [{ "elem.transaction_id": null }],
      }
    );

    return res.status(201).json({
      message: "Loan applied successfully",
      transaction,
      distribution,
    });
  } catch (error) {
    console.error("Error applying loan:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { getAvailableLoan , loanCalculation , loanApply };