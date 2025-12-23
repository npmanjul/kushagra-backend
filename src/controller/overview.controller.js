import User from "../model/Users.model.js";
import Warehouse from "../model/Warehouses.model.js";
import Farmer from "../model/Farmer.model.js";

const adminOverview = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Verify user is admin
    const requestingUser = await User.findById(userId).select("role");
    if (!requestingUser || requestingUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can view overview.",
      });
    }

    // Get counts in parallel for better performance
    const [totalFarmers, totalManagers, totalSupervisors, totalStaff, totalWarehouses] =
      await Promise.all([
        Farmer.countDocuments(),
        User.countDocuments({ role: "manager" }),
        User.countDocuments({ role: "supervisor" }),
        User.countDocuments({ role: "staff" }),
      ]);


    return res.status(200).json({
      success: true,
      message: "Admin overview fetched successfully",
      data: {
        farmers: totalFarmers,
        managers: totalManagers,
        supervisors: totalSupervisors,
        staff: totalStaff,
      },
    });
  } catch (error) {
    console.error("Error fetching admin overview:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export { adminOverview };