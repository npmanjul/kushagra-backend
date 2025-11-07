import Warehouse from "../model/Warehouses.model.js";
import User from "../model/Users.model.js";
import StorageBucket from "../model/StorageBucket.model.js";

const createWarehouse = async (req, res) => {
  try {
    const { name, location, capacity_quintal, manager_id } = req.body;

    if (!name || !location || !capacity_quintal || !manager_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newWarehouse = await Warehouse.create({
      name,
      location,
      capacity_quintal,
      manager_id,
    });

    // Create storage bucket for warehouse
    await StorageBucket.create({
      bucket_owner_type: "Warehouse",
      bucket_owner_id: newWarehouse._id,
      categories: [],
    });

    return res
      .status(201)
      .json({ message: "Warehouse created successfully" });
  } catch (error) {
    console.error("Error creating warehouse:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllManager= async (req, res) => {
  try {
    const allManager=await User.find({role:"manager"}).select("name _id");
    return res.status(200).json(allManager);
  } catch (error) {
    console.error("Error getting all manager:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllWarehouse = async (req, res) => {
  try {
    const warehouses = await Warehouse.find().select(
      "name location capacity_quintal manager_id"
    );

    const warehousesWithManager = await Promise.all(
      warehouses.map(async (warehouse) => {
        const manager = await User.findById(warehouse.manager_id).select("name");
        return {
          ...warehouse._doc,
          manager_name: manager ? manager.name : "Unknown",
        };
      })
    );

    return res.status(200).json(warehousesWithManager);
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getWarehouseById = (req, res) => {
  try {
    const { id } = req.params;
    Warehouse.findById(id)
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((error) => {
        res.status(500).json({ message: "Internal server error" });
      });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateWarehouse = (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, manager_id } = req.body;

    Warehouse.findByIdAndUpdate(id, {
      name,
      address,
      phone,
      email,
      manager_id,
    })
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((error) => {
        res.status(500).json({ message: "Internal server error" });
      });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteWarehouse = (req, res) => {
  try {
    const { id } = req.params;
    Warehouse.findByIdAndDelete(id)
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((error) => {
        res.status(500).json({ message: "Internal server error" });
      });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export {
  createWarehouse,
  getAllManager,
  getAllWarehouse,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
};
