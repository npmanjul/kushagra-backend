import express from "express";
import BACKEND_URL from "./constants.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
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
import approvalRouter from "./src/router/approval.router.js";
import employeeRouter from "./src/router/employee.router.js";
import withdrawalRouter from "./src/router/withdrawal.router.js";
import overviewRouter from "./src/router/overview.router.js";
import generatePDFRouter from "./src/router/generatePDF.router.js";
import awsRouter from "./src/router/aws.router.js";

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
app.use(`${BACKEND_URL}/approval`, approvalRouter);
app.use(`${BACKEND_URL}/employee`, employeeRouter);
app.use(`${BACKEND_URL}/withdrawal`, withdrawalRouter);
app.use(`${BACKEND_URL}/overview`, overviewRouter);
app.use(`${BACKEND_URL}/generatepdf`, generatePDFRouter);
app.use(`${BACKEND_URL}/aws`, awsRouter);


app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


export default app;
