import User from "../model/Users.model.js"; // Adjust path if needed

/**
 * Generate next farmer ID
 * @returns {Promise<string>} - The next farmer ID
 */
const generateFarmerId = async () => {
  try {
    // 1️⃣ Fetch all existing farmer IDs
    const existingUsers = await User.find({}, { farmerId: 1 }).lean();
    const existingIds = existingUsers.map(u => u.farmerId).filter(Boolean);

    // 2️⃣ Set default values
    let prefix = "SGB";
    let year = String(new Date().getFullYear());
    let lastNumber = 0;

    // 3️⃣ If there are existing IDs, find the last one
    if (existingIds.length > 0) {
      // Sort numerically by last 6 digits
      existingIds.sort((a, b) => {
        const numA = parseInt(a.slice(-6), 10);
        const numB = parseInt(b.slice(-6), 10);
        return numA - numB;
      });

      const lastId = existingIds[existingIds.length - 1];
      const match = lastId.match(/^([A-Z]+)(\d{4})(\d{6})$/);

      if (match) {
        prefix = match[1];
        year = match[2];
        lastNumber = parseInt(match[3], 10);
      }
    }

    // 4️⃣ Generate next ID
    const nextNumber = String(lastNumber + 1).padStart(6, "0");
    return `${prefix}${year}${nextNumber}`;
  } catch (error) {
    console.error("Error generating farmer ID:", error);
    throw new Error("Failed to generate Farmer ID");
  }
};

export { generateFarmerId };