import "dotenv/config";
import app from "./app.js";
import connectDB from "./src/db/index.js";

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO DB is failed to connect !!!", err);
  });
