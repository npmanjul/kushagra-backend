import StorageBucket from "../model/StorageBucket.model.js";
import TransactionHistory from "../model/Transaction.model.js";
import Approval from "../model/Approval.model.js";

const sellGrain = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { quantity_sold, price_per_quintal, category_id, warehouse_id } =
      req.body;

    if (!quantity_sold || !price_per_quintal || !category_id || !warehouse_id) {
      return res.status(400).json({ message: "Invalid request" });
    }

    // 1️⃣ Fetch farmer storage
    const userBucket = await StorageBucket.findOne({
      bucket_owner_id: userId,
      bucket_owner_type: "User",
    });

    if (!userBucket) {
      return res.status(404).json({ message: "User storage bucket not found" });
    }

    const userCategory = userBucket.categories.find(
      (c) => c.category_id.toString() === category_id
    );

    if (!userCategory || userCategory.total_quantity < quantity_sold) {
      return res.status(400).json({ message: "Insufficient grain quantity" });
    }

    // 2️⃣ Create approval flow
    const approval = await Approval.create({});

    // 3️⃣ Create transaction (PENDING)
    const transaction = await TransactionHistory.create({
      transaction_type: "sell",
      user_id: userId,
      warehouse_id,
      grain: [
        {
          category_id,
          quantity_quintal: Number(quantity_sold),
          price_per_quintal: Number(price_per_quintal),
          moisture_content:0,
        },
      ],
      total_amount: Number(quantity_sold) * Number(price_per_quintal),
      transaction_status: "pending",
      approval_status: approval._id,
      remarks: "Sell request raised",
    });

    // 4️⃣ Move grain to HOLD
    userCategory.total_quantity -= Number(quantity_sold);
    userCategory.hold_quantity += Number(quantity_sold);
    userCategory.warehouse_storage.push({
      transaction_id: transaction._id,
    });

    await userBucket.save();

    return res.status(201).json({
      success: true,
      message: "Sell request created and sent for approval",
      transaction_id: transaction._id,
    });
  } catch (error) {
    console.error("Sell Grain Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { sellGrain };
