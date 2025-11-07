import GrainCategories from "../model/GrainCategories.model.js";

const CreateGrainCategoies = async (req, res) => {
  try {
    const { grain_type } = req.body;

    if (!grain_type) {
      return res.status(400).json({ message: "Grain type is required" });
    }

    const graintypeExists = await GrainCategories.findOne({ grain_type });

    if (graintypeExists) {
      return res.status(400).json({ message: "Grain type already exists" });
    }

    // Define subcategories A, B, and C
    const subcategories = ["A", "B", "C"];

    // Create an array of objects for bulk insert
    const categoriesToCreate = subcategories.map((grade) => ({
      grain_type: grain_type,
      quality: grade,
    }));

    // Insert multiple categories at once
    await GrainCategories.insertMany(categoriesToCreate);

    return res.status(201).json({
      message: `Grain categories for ${grain_type} created successfully`,
    });
  } catch (error) {
    console.error("Error creating grain categories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const getAllGrainCategories = async (req, res) => {
  try {
    const allGrainCategories = await GrainCategories.find().select(
      "grain_type quality _id"
    );

    return res.status(200).json(allGrainCategories);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};



export { CreateGrainCategoies , getAllGrainCategories };
