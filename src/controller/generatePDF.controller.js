import * as puppeteer from "puppeteer";
import { employeeProfileTemplate, transactionInvoiceTemplate, transactionReportTemplate } from "../utils/PDFTemplates.js";
import chromium from "@sparticuz/chromium";
import puppeteerCore from "puppeteer-core";

const generatePDF = async (req, res) => {
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
    
    let browser = null;
    
    if (process.env.ENVIRONMENT === "development") {
      console.log("Development browser: ");
      
      // Solution 1: Use puppeteer-core with explicit executable path
      try {
        browser = await puppeteerCore.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          headless: true,
          // Try common Chrome/Chromium paths
          executablePath: 
            process.env.CHROME_PATH || 
            process.platform === 'win32' 
              ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
              : process.platform === 'darwin'
              ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
              : '/usr/bin/google-chrome' || '/usr/bin/chromium-browser' || '/usr/bin/chromium'
        });
      } catch (err) {
        // Solution 2: Fallback to regular puppeteer (which includes Chromium)
        console.log("Falling back to bundled Chromium");
        browser = await puppeteer.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          headless: true,
        });
      }
    }
    
    if (process.env.ENVIRONMENT === "production") {
      console.log("Production browser: ");
      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    }
    
    const page = await browser?.newPage();
    await page?.setContent(templateHTML, {
      waitUntil: "networkidle0",
    });
    
    const pdfBuffer = await page?.pdf({
      format: "A4",
      printBackground: true,
    });
    
    await browser?.close();
    
    // ✅ CORRECT HEADERS
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice.pdf`);
    return res.send(pdfBuffer);
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while generating PDF",
      error: error.message
    });
  }
};

export default generatePDF;