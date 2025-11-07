import TransactionHistory from "../model/Transaction.model.js";

const userAllTransactions = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const userTransactions = await TransactionHistory.find({
      user_id: userId,
    }).lean();

    return res.status(200).json(userTransactions);
  }
  catch (error) {
    console.error("Error fetching user transactions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { userAllTransactions };