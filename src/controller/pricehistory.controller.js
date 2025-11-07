import mongoose from "mongoose";
import PriceHistory from "../model/PriceHistory.model.js";
import GrainCategories from "../model/GrainCategories.model.js";

/**
 * @route   POST /pricehistory/addtodayprice
 * @desc    Add or update today's price for a given grain (A, B, C categories)
 * @access  Private / Admin , / Manager
 *
 * @body
 * {
 *   "grain_name": "Wheat",
 *   "maxprice": 2600,
 *   "avgprice": 2500,
 *   "minprice": 2400
 * }
 *
 * @returns {Object}
 * {
 *   "message": "Today's price recorded successfully"
 * }
 */

const addTodayPrice = async (req, res) => {
  try {
    const { grain_name, maxprice, avgprice, minprice } = req.body;

    if (!grain_name || !maxprice || !avgprice || !minprice) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Find all grain categories (A, B, C) for the given grain name
    const grainCategories = await GrainCategories.find({
      grain_type: grain_name,
    });

    if (!grainCategories || grainCategories.length === 0) {
      return res.status(404).json({ message: "Grain categories not found" });
    }

    // ✅ Find specific quality categories (A, B, C)
    const qualityA = grainCategories.find((cat) => cat.quality === "A");
    const qualityB = grainCategories.find((cat) => cat.quality === "B");
    const qualityC = grainCategories.find((cat) => cat.quality === "C");

    if (!qualityA || !qualityB || !qualityC) {
      return res.status(400).json({
        message: "Missing one or more quality categories (A, B, C)",
      });
    }

    // ✅ Define today's date (normalized)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ✅ Check if a price record already exists for today
    let existingPrice = await PriceHistory.findOne({
      grain_name,
      created_at: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingPrice) {
      // ✅ Update the existing price record
      existingPrice.maxprice = {
        grain_category: qualityA._id,
        price: maxprice,
      };
      existingPrice.avgprice = {
        grain_category: qualityB._id,
        price: avgprice,
      };
      existingPrice.minprice = {
        grain_category: qualityC._id,
        price: minprice,
      };

      await existingPrice.save();

      // ✅ Update references in GrainCategories (if not already present)
      await Promise.all([
        GrainCategories.findByIdAndUpdate(qualityA._id, {
          $addToSet: { price_history: existingPrice._id },
        }),
        GrainCategories.findByIdAndUpdate(qualityB._id, {
          $addToSet: { price_history: existingPrice._id },
        }),
        GrainCategories.findByIdAndUpdate(qualityC._id, {
          $addToSet: { price_history: existingPrice._id },
        }),
      ]);

      return res.status(200).json({
        message: "Today's price updated successfully",
      });
    }

    // ✅ Otherwise, create a new price record
    const newPrice = await PriceHistory.create({
      grain_name,
      maxprice: {
        grain_category: qualityA._id,
        price: maxprice,
      },
      avgprice: {
        grain_category: qualityB._id,
        price: avgprice,
      },
      minprice: {
        grain_category: qualityC._id,
        price: minprice,
      },
      created_at: today,
    });

    // ✅ Push new price reference to each corresponding grain category
    await Promise.all([
      GrainCategories.findByIdAndUpdate(qualityA._id, {
        $push: { price_history: newPrice._id },
      }),
      GrainCategories.findByIdAndUpdate(qualityB._id, {
        $push: { price_history: newPrice._id },
      }),
      GrainCategories.findByIdAndUpdate(qualityC._id, {
        $push: { price_history: newPrice._id },
      }),
    ]);

    return res.status(201).json({
      message: "Today's price recorded successfully",
    });
  } catch (error) {
    console.error("Error adding/updating price:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @route   GET /pricehistory/allpricehistory/:id (id = grain_name , grain_id)
 * @desc    Get today price history for a given grain (A, B, C categories)
 * @access  Public --> Anyone
 *
 * @body
 * { null }
 *
 * @returns {Object}
 * 
 *   {
    "grain_type": "Wheat",
    "dates": [
        "2025-10-13",
        "2025-10-14",
        "2025-10-15"
    ],
    "maxPrices": [
        2565,
        1200,
        2550
    ],
    "avgPrices": [
        2515,
        1000,
        2500
    ],
    "minPrices": [
        2450,
        700,
        2475
    ]
 * }
 */

const getAllPriceHistory = async (req, res) => {
  try {
    const grain = req.params.id?.trim();

    if (!grain) {
      return res.status(400).json({ message: "Grain identifier is required" });
    }

    // ✅ Check if it's a valid ObjectId
    const isObjectId = mongoose.Types.ObjectId.isValid(grain);

    // ✅ Use case-insensitive regex for string match
    const grainType = await GrainCategories.findOne(
      isObjectId
        ? {
            $or: [
              { _id: grain },
              { grain_type: new RegExp(`^${grain}$`, "i") },
            ],
          }
        : { grain_type: new RegExp(`^${grain}$`, "i") }
    );

    if (!grainType) {
      return res.status(404).json({ message: "Grain category not found" });
    }

    // ✅ Fetch all price records where this grain category is referenced
    const priceHistory = await PriceHistory.find({
      $or: [
        { "maxprice.grain_category": grainType._id },
        { "avgprice.grain_category": grainType._id },
        { "minprice.grain_category": grainType._id },
      ],
    })
      .select("maxprice avgprice minprice created_at")
      .sort({ created_at: 1 }); // oldest → newest

    if (!priceHistory.length) {
      return res
        .status(404)
        .json({ message: "No price history found for this grain" });
    }

    // ✅ Prepare arrays for chart or visualization
    const dates = [];
    const maxPrices = [];
    const avgPrices = [];
    const minPrices = [];

    priceHistory.forEach((item) => {
      dates.push(item.created_at.toISOString().split("T")[0]);
      maxPrices.push(item.maxprice?.price || 0);
      avgPrices.push(item.avgprice?.price || 0);
      minPrices.push(item.minprice?.price || 0);
    });

    return res.status(200).json({
      grain_type: grainType.grain_type,
      dates,
      maxPrices,
      avgPrices,
      minPrices,
    });
  } catch (error) {
    console.error("Error fetching price history:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @route   GET /pricehistory/todayprice 
 * @desc    Get today price history for all grains
 * @access  Public --> Anyone
 *
 * @body
 * { null }
 *
 * @returns {Object}
 * 
 * {
    "todayprice": {
        "Wheat": {
            "max": 2550,
            "avg": 2500,
            "min": 2475,
            "change": {
                "max": 112.5,
                "avg": 150,
                "min": 253.57142857142856
            }
        },
        "Rice": {
            "max": 3250,
            "avg": 3200,
            "min": 3120,
            "change": {
                "max": 62.5,
                "avg": 77.77777777777779,
                "min": 95
            }
        },
        "Bajra": {
            "max": 2800,
            "avg": 2745,
            "min": 2680,
            "change": {
                "max": 0.9009009009009009,
                "avg": 14.853556485355648,
                "min": 16.52173913043478
            }
        },
        "Soybean": {
            "max": 89,
            "avg": 78,
            "min": 67,
            "change": {
                "max": 0,
                "avg": 0,
                "min": 0
            }
        },
        "Green Moong Beans": {
            "max": 2332,
            "avg": 2320,
            "min": 2300,
            "change": {
                "max": 0,
                "avg": 0,
                "min": 0
            }
        }
    }
*}
 */

const getTodayPrice = async (req, res) => {
  try {
    // Fetch all grain categories and populate price_history
    const allGrains = await GrainCategories.find().populate("price_history");

    const grainsGrouped = {};

    allGrains.forEach((grain) => {
      const { grain_type, price_history } = grain;

      if (!price_history.length) {
        // No price data
        grainsGrouped[grain_type] = null;
        return;
      }

      // Take the latest price entry
      const latestPrice = price_history[price_history.length - 1];

      // Take the previous price entry (if exists)
      const prevPrice =
        price_history.length > 1
          ? price_history[price_history.length - 2]
          : null;

      // Helper function to calculate percentage change
      const calcChange = (current, previous) => {
        if (!previous || previous === 0) return 0;
        return ((current - previous) / previous) * 100;
      };

      grainsGrouped[grain_type] = {
        max: latestPrice.maxprice.price,
        avg: latestPrice.avgprice.price,
        min: latestPrice.minprice.price,
        change: {
          max: prevPrice
            ? calcChange(latestPrice.maxprice.price, prevPrice.maxprice.price)
            : 0,
          avg: prevPrice
            ? calcChange(latestPrice.avgprice.price, prevPrice.avgprice.price)
            : 0,
          min: prevPrice
            ? calcChange(latestPrice.minprice.price, prevPrice.minprice.price)
            : 0,
        },
      };
    });

    return res.status(200).json({
      todayprice: grainsGrouped,
    });
  } catch (error) {
    console.error("Error fetching today's price:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * @route   GET /pricehistory/pricehistory/pricehistorybygrain?name=wheat&grade=a / ?id=89j58r9357r937htriuy5y48 (id = grain_id , name + grade = grain_name + grade)
 * @desc    Get price history for a specific grain (A, B, C categories)
 * @access  Public --> Anyone
 *
 * @body
 * { null }
 *
 * @returns {Object}
 * 
 *   {
    "grain_type": "Wheat",
    "grade": "A",
    "date": "2025-10-16",
    "price": 2565
}
 */


const getPriceHistoryByGrain = async (req, res) => {
  try {
    const { id, name, grade } = req.query; 

    // ✅ Validate input: either id OR (name + grade)
    if (!id && (!name || !grade)) {
      return res.status(400).json({
        message: "Please provide either a valid grain ID or both name and grade.",
      });
    }

    let grainFilter = {};

    // ✅ If searching by ID
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      grainFilter = { _id: id };
    } else {
      grainFilter = {
        grain_type: new RegExp(`^${name}$`, "i"),
        quality: new RegExp(`^${grade}$`, "i"),
      };
    }

    // ✅ Find the grain by ID or name + grade
    const grainType = await GrainCategories.findOne(grainFilter);
    if (!grainType) {
      return res.status(404).json({ message: "Grain category not found" });
    }

    // Use grade from grainType if grade is undefined
    const effectiveGrade = grade || grainType.quality;

    // Determine which price field to fetch based on grade
    let priceField;
    if (effectiveGrade.toUpperCase() === "A") {
      priceField = "maxprice";
    } else if (effectiveGrade.toUpperCase() === "B") {
      priceField = "avgprice";
    } else if (effectiveGrade.toUpperCase() === "C") {
      priceField = "minprice";
    } else {
      return res.status(400).json({ message: "Invalid grade specified" });
    }

    // ✅ Fetch price history entries for this specific grain and grade
    const priceHistory = await PriceHistory.find({
      [`${priceField}.grain_category`]: grainType._id,
    })
      .select(`${priceField} created_at`)
      .sort({ created_at: 1 }); // oldest → newest

    if (!priceHistory.length) {
      return res.status(404).json({ message: "No price history found for this grain" });
    }

    // ✅ Get only the last entry
    const lastRecord = priceHistory[priceHistory.length - 1];

    return res.status(200).json({
      grain_type: grainType.grain_type,
      grade: grainType.quality,
      date: lastRecord.created_at.toISOString().split("T")[0],
      price: lastRecord[priceField]?.price || 0,
    });
  } catch (error) {
    console.error("Error fetching price history:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



export {
  addTodayPrice,
  getAllPriceHistory,
  getTodayPrice,
  getPriceHistoryByGrain,
};
