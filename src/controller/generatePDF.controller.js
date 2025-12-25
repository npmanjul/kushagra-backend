import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";
import { employeeProfileTemplate, transactionInvoiceTemplate, transactionReportTemplate } from "../utils/PDFTemplates.js";


export const generatePDF = async (req, res) => {
  try {
    const data = req.body;
    const service = req.params.service;

    let templateHTML;

    if (service === "transactions") {
      templateHTML = transactionReportTemplate(JSON.parse(data.data));
    } else if (service === "profile") {
      templateHTML = employeeProfileTemplate(JSON.parse(data.data));
    } else if (service === "usertransaction") {
      templateHTML = transactionInvoiceTemplate(JSON.parse(data.data));
    }

    // Launch chrome in Vercel-compatible mode
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath:
        process.env.NODE_ENV === "production"
          ? await chromium.executablePath
          : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", // local dev
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(templateHTML, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    // Headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${data.name}-${service}.pdf`
    );

    return res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while generating PDF",
      error: error.toString(),
    });
  }
};