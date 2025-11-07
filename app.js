import express from "express";
import BACKEND_URL from "./constants.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

const corsOptions = {
  origin: ["http://localhost:3000","http://localhost:3001"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Import routes
import authRoutes from "./src/router/auth.router.js";
import registerRoutes from "./src/router/register.router.js";
import warehouseRouter from "./src/router/warehouse.router.js";
import grainRouter from "./src/router/grain.router.js";
import depositeRouter from "./src/router/deposite.router.js";
import userRouter from "./src/router/user.router.js";
import priceHistoryRouter from "./src/router/pricehistory.router.js";
import sellRouter from "./src/router/sell.router.js";
import loanRouter from "./src/router/loan.router.js";
import transactionRouter from "./src/router/transaction.router.js";

// Routes
app.use(`${BACKEND_URL}/auth`, authRoutes);
app.use(`${BACKEND_URL}/register`, registerRoutes);
app.use(`${BACKEND_URL}/warehouse`, warehouseRouter);
app.use(`${BACKEND_URL}/grain`, grainRouter);
app.use(`${BACKEND_URL}/deposite`, depositeRouter);
app.use(`${BACKEND_URL}/user`, userRouter);
app.use(`${BACKEND_URL}/pricehistory`, priceHistoryRouter);
app.use(`${BACKEND_URL}/sell`, sellRouter);
app.use(`${BACKEND_URL}/loan`, loanRouter);
app.use(`${BACKEND_URL}/transaction`, transactionRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


export default app;
