import Warehouse from "../model/Warehouses.model.js";
import User from "../model/Users.model.js";
import StorageBucket from "../model/StorageBucket.model.js";
import EmployeeProfile from "../model/Employee.model.js";

const createWarehouse = async (req, res) => {
  try {
    const {
      name,
      location,
      capacity_quintal,
      manager_id,
      supervisor_id,
      staff_ids,
    } = req.body;

    // Basic Validation
    if (!name || !location || !capacity_quintal || !manager_id) {
      return res.status(400).json({
        message:
          "Missing required fields: name, location, capacity_quintal, manager_id",
      });
    }

    const newWarehouse = await Warehouse.create({
      name,
      location,
      capacity_quintal,
      manager_id,
      supervisor_id: supervisor_id,
      staff_ids: staff_ids || [],
    });

    // Create storage bucket for warehouse
    await StorageBucket.create({
      bucket_owner_type: "Warehouse",
      bucket_owner_id: newWarehouse._id,
      categories: [],
    });

    return res.status(201).json({
      message: "Warehouse created successfully",
    });
  } catch (error) {
    console.error("Error creating warehouse:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllManager = async (req, res) => {
  try {
    // Get all managers from Users collection with their employee profiles
    const allManagers = await User.find({ role: "manager" })
      .select("_id name phone_number email employeeProfile is_active")
      .populate({
        path: "employeeProfile",
        select: "employeeImage employeeId _id",
      })
      .lean();

    // Get all warehouses to check manager assignments
    const allWarehouses = await Warehouse.find()
      .select("name location manager_id")
      .lean();

    // Create a map of manager_id to warehouse info
    // manager_id in Warehouse could be User._id or EmployeeProfile._id
    const warehouseMapByUserId = {};
    const warehouseMapByEmployeeProfileId = {};
    
    allWarehouses.forEach((warehouse) => {
      if (warehouse.manager_id) {
        const managerId = warehouse.manager_id.toString();
        const warehouseInfo = {
          warehouse_id: warehouse._id,
          warehouse_name: warehouse.name,
          warehouse_location: warehouse.location,
        };
        // Store in both maps to handle both cases
        warehouseMapByUserId[managerId] = warehouseInfo;
        warehouseMapByEmployeeProfileId[managerId] = warehouseInfo;
      }
    });

    // Build response with all required fields
    const managersWithDetails = allManagers.map((manager) => {
      const userId = manager._id.toString();
      const employeeProfileId = manager.employeeProfile?._id?.toString();
      
      // Try to find warehouse by User._id first, then by EmployeeProfile._id
      const warehouseInfo = warehouseMapByUserId[userId] || 
        (employeeProfileId ? warehouseMapByEmployeeProfileId[employeeProfileId] : null);

      return {
        _id: manager._id,
        name: manager.name,
        phone: manager.phone_number,
        email: manager.email,
        photo: manager.employeeProfile?.employeeImage || null,
        employee_id: manager.employeeProfile?.employeeId || null,
        employee_profile_id: manager.employeeProfile?._id || null,
        is_active: manager.is_active ?? true,
        is_engaged: !!warehouseInfo,
        warehouse_id: warehouseInfo?.warehouse_id || null,
        warehouse_name: warehouseInfo?.warehouse_name || null,
        warehouse_location: warehouseInfo?.warehouse_location || null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Managers fetched successfully",
      data: managersWithDetails,
    });
  } catch (error) {
    console.error("Error getting all managers:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getAllSupervisor = async (req, res) => {
  try {
    // Get all supervisors from Users collection with their employee profiles
    const allSupervisors = await User.find({ role: "supervisor" })
      .select("_id name phone_number email employeeProfile is_active")
      .populate({
        path: "employeeProfile",
        select: "employeeImage employeeId _id",
      })
      .lean();

    // Get all warehouses to check supervisor assignments
    const allWarehouses = await Warehouse.find()
      .select("name location supervisor_id")
      .lean();

    // Create a map of supervisor_id to warehouse info
    // supervisor_id in Warehouse could be User._id or EmployeeProfile._id
    const warehouseMapByUserId = {};
    const warehouseMapByEmployeeProfileId = {};
    
    allWarehouses.forEach((warehouse) => {
      if (warehouse.supervisor_id) {
        const supervisorId = warehouse.supervisor_id.toString();
        const warehouseInfo = {
          warehouse_id: warehouse._id,
          warehouse_name: warehouse.name,
          warehouse_location: warehouse.location,
        };
        // Store in both maps to handle both cases
        warehouseMapByUserId[supervisorId] = warehouseInfo;
        warehouseMapByEmployeeProfileId[supervisorId] = warehouseInfo;
      }
    });

    // Build response with all required fields
    const supervisorsWithDetails = allSupervisors.map((supervisor) => {
      const userId = supervisor._id.toString();
      const employeeProfileId = supervisor.employeeProfile?._id?.toString();
      
      // Try to find warehouse by User._id first, then by EmployeeProfile._id
      const warehouseInfo = warehouseMapByUserId[userId] || 
        (employeeProfileId ? warehouseMapByEmployeeProfileId[employeeProfileId] : null);

      return {
        _id: supervisor._id,
        name: supervisor.name,
        phone: supervisor.phone_number,
        email: supervisor.email,
        photo: supervisor.employeeProfile?.employeeImage || null,
        employee_id: supervisor.employeeProfile?.employeeId || null,
        employee_profile_id: supervisor.employeeProfile?._id || null,
        is_active: supervisor.is_active ?? true,
        is_engaged: !!warehouseInfo,
        warehouse_id: warehouseInfo?.warehouse_id || null,
        warehouse_name: warehouseInfo?.warehouse_name || null,
        warehouse_location: warehouseInfo?.warehouse_location || null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Supervisors fetched successfully",
      data: supervisorsWithDetails,
    });
  } catch (error) {
    console.error("Error getting all supervisors:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getAllStaff = async (req, res) => {
  try {
    // Get all staff from Users collection with their employee profiles
    const allStaff = await User.find({ role: "staff" })
      .select("_id name phone_number email employeeProfile is_active")
      .populate({
        path: "employeeProfile",
        select: "employeeImage employeeId _id",
      })
      .lean();

    // Get all warehouses to check staff assignments
    const allWarehouses = await Warehouse.find()
      .select("name location staff_ids")
      .lean();

    // Create a map of staff_id to warehouse info
    // staff_ids in Warehouse could contain User._id or EmployeeProfile._id
    const warehouseMapByUserId = {};
    const warehouseMapByEmployeeProfileId = {};
    
    allWarehouses.forEach((warehouse) => {
      if (warehouse.staff_ids && warehouse.staff_ids.length > 0) {
        const warehouseInfo = {
          warehouse_id: warehouse._id,
          warehouse_name: warehouse.name,
          warehouse_location: warehouse.location,
        };
        warehouse.staff_ids.forEach((staffId) => {
          const id = staffId.toString();
          // Store in both maps to handle both cases
          warehouseMapByUserId[id] = warehouseInfo;
          warehouseMapByEmployeeProfileId[id] = warehouseInfo;
        });
      }
    });

    // Build response with all required fields
    const staffWithDetails = allStaff.map((staff) => {
      const userId = staff._id.toString();
      const employeeProfileId = staff.employeeProfile?._id?.toString();
      
      // Try to find warehouse by User._id first, then by EmployeeProfile._id
      const warehouseInfo = warehouseMapByUserId[userId] || 
        (employeeProfileId ? warehouseMapByEmployeeProfileId[employeeProfileId] : null);

      return {
        _id: staff._id,
        name: staff.name,
        phone: staff.phone_number,
        email: staff.email,
        photo: staff.employeeProfile?.employeeImage || null,
        employee_id: staff.employeeProfile?.employeeId || null,
        employee_profile_id: staff.employeeProfile?._id || null,
        is_active: staff.is_active ?? true,
        is_engaged: !!warehouseInfo,
        warehouse_id: warehouseInfo?.warehouse_id || null,
        warehouse_name: warehouseInfo?.warehouse_name || null,
        warehouse_location: warehouseInfo?.warehouse_location || null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Staff fetched successfully",
      data: staffWithDetails,
    });
  } catch (error) {
    console.error("Error getting all staff:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getAllWarehouse = async (req, res) => {
  try {
    const warehouses = await Warehouse.find()
      .select(
        "name location capacity_quintal manager_id supervisor_id staff_ids created_at"
      )
      // -------- MANAGER --------
      .populate({
        path: "manager_id",
        model: "Users",
        select: "name phone_number email role employeeProfile",
        populate: {
          path: "employeeProfile",
          model: "EmployeeProfiles",
          select:
            "employeeId employeeImage employmentType employmentStatus dateOfJoining",
        },
      })
      // -------- SUPERVISOR --------
      .populate({
        path: "supervisor_id",
        model: "Users",
        select: "name phone_number email role employeeProfile",
        populate: {
          path: "employeeProfile",
          model: "EmployeeProfiles",
          select:
            "employeeId employeeImage employmentType employmentStatus dateOfJoining",
        },
      })
      // -------- STAFF --------
      .populate({
        path: "staff_ids",
        model: "Users",
        select: "name phone_number email role employeeProfile",
        populate: {
          path: "employeeProfile",
          model: "EmployeeProfiles",
          select:
            "employeeId employeeImage employmentType employmentStatus dateOfJoining",
        },
      });

    const response = warehouses.map((w) => ({
      _id: w._id,
      name: w.name,
      location: w.location,
      capacity_quintal: w.capacity_quintal,
      created_at: w.created_at,

      manager: w.manager_id
        ? {
            _id: w.manager_id._id,
            name: w.manager_id.name,
            phone_number: w.manager_id.phone_number,
            email: w.manager_id.email,
            role: w.manager_id.role,
            employee: w.manager_id.employeeProfile || null,
          }
        : null,

      supervisor: w.supervisor_id
        ? {
            _id: w.supervisor_id._id,
            name: w.supervisor_id.name,
            phone_number: w.supervisor_id.phone_number,
            email: w.supervisor_id.email,
            role: w.supervisor_id.role,
            employee: w.supervisor_id.employeeProfile || null,
          }
        : null,

      staff: w.staff_ids.map((s) => ({
        _id: s._id,
        name: s.name,
        phone_number: s.phone_number,
        email: s.email,
        role: s.role,
        employee: s.employeeProfile || null,
      })),
    }));

    return res.status(200).json({
      success: true,
      count: response.length,
      data: response,
    });
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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
  getAllSupervisor,
  getAllStaff,
  getAllWarehouse,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
};
