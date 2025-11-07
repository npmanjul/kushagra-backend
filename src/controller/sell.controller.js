import StorageBucket from "../model/StorageBucket.model.js";
import transactionHistory from "../model/Transaction.model.js";

const sellGrain = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { quantity_sold, price_per_quintal, category_id, warehouse_id } = req.body;

    if (!quantity_sold || !price_per_quintal || !category_id || !warehouse_id) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const createTransaction = await transactionHistory.create({
      transaction_type: "sell",
      user_id: userId,
      warehouse_id,
      grain_category_id: category_id,
      quantity_quintal: Number(quantity_sold),
      price_per_quintal: Number(price_per_quintal),
      total_amount: Number(quantity_sold) * Number(price_per_quintal),
      remarks: "Grain sold",
    });

    const transactionId = createTransaction._id;

    const userStorageBucket = await StorageBucket.findOne({ bucket_owner_id: userId });
    const warehouseStorageBucket = await StorageBucket.findOne({ bucket_owner_id: warehouse_id });

    if (!userStorageBucket) {
      return res.status(404).json({ message: "User storage bucket not found" });
    }

    if (!warehouseStorageBucket) {
      return res.status(404).json({ message: "Warehouse storage bucket not found" });
    }

    // Update user storage
    const userCategory = userStorageBucket.categories.find(
      (cat) => cat.category_id.toString() === category_id
    );

    if (!userCategory || userCategory.total_quantity < quantity_sold) {
      return res.status(400).json({ message: "Insufficient quantity in user storage" });
    }
    userCategory.total_quantity -= Number(quantity_sold);
    userCategory.warehouse_storage.push({
      transaction_id: transactionId,
      quantity: -Number(quantity_sold),
      date: new Date(),
    });


    // Update warehouse storage
    let warehouseCategory = warehouseStorageBucket.categories.find(
      (cat) => cat.category_id.toString() === category_id
    );

    if (!warehouseCategory) {
      warehouseStorageBucket.categories.push({
        category_id,
        total_quantity: Number(quantity_sold),
        warehouse_storage: [
          {
            transaction_id: transactionId,
            quantity: Number(quantity_sold),
            date: new Date(),
          },
        ],
      });
    } else {
      warehouseCategory.total_quantity += Number(quantity_sold);
      warehouseCategory.warehouse_storage.push({
        transaction_id: transactionId,
        quantity: Number(quantity_sold),
        date: new Date(),
      });
    }

    await userStorageBucket.save();
    await warehouseStorageBucket.save();

    return res.status(201).json({
      message: "Sale created and storage updated successfully",
    });
  } catch (error) {
    console.error("Error creating sale:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { sellGrain };
