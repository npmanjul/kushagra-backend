import StorageBucket from "../model/StorageBucket.model.js";
import Transaction from "../model/Transaction.model.js";

const grainDeposite = async (req, res) => {
  try {
    const { quantity, category_id, userId, warehouse_id, current_price } = req.body;

    if (!quantity || !category_id || !userId || !current_price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Create a new deposit transaction
    const newTransaction = await Transaction.create({
      transaction_type: "deposit",
      user_id: userId,
      warehouse_id: warehouse_id || null,
      grain: [
        {
          category_id,
          quantity_quintal: Number(quantity),
          price_per_quintal: Number(current_price),
        },
      ],
      total_amount: Number(quantity) * Number(current_price),
      remarks: "Grain deposited",
    });

    const transactionId = newTransaction._id;

    // ✅ Find or create user's storage bucket
    let storage = await StorageBucket.findOne({ bucket_owner_id: userId });

    if (!storage) {
      storage = new StorageBucket({
        bucket_owner_type: "User",
        bucket_owner_id: userId,
        categories: [],
      });
    }

    // ✅ Check if category already exists
    let categoryIndex = storage.categories.findIndex(
      (c) => c.category_id.toString() === category_id
    );

    if (categoryIndex === -1) {
      // Add new grain category entry
      storage.categories.push({
        category_id,
        warehouse_storage: [
          {
            transaction_id: transactionId,
            created_at: new Date(),
          },
        ],
        total_quantity: Number(quantity),
      });
      categoryIndex = storage.categories.length - 1; // Update index for response
    } else {
      // Add new deposit to existing category
      storage.categories[categoryIndex].warehouse_storage.push({
        transaction_id: transactionId,
        created_at: new Date(),
      });

      // Increment total_quantity
      storage.categories[categoryIndex].total_quantity += Number(quantity);
    }

    await storage.save();

    return res.status(200).json({
      message: "Grain deposited successfully",
      transaction_id: transactionId,
      total_quantity: storage.categories[categoryIndex].total_quantity,
      storage,
    });
  } catch (error) {
    console.error("Error during grain deposit:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export { grainDeposite };