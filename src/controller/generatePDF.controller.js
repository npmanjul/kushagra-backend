import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import {
  employeeProfileTemplate,
  transactionInvoiceTemplate,
  transactionReportTemplate
} from "../utils/PDFTemplates.js";

const generatePDF = async (req, res) => {
  try {
    const received = JSON.parse(req.body.data);
    const service = req.params.service;

    let templateHTML;

    if (service === "transactions") {
      templateHTML = transactionReportTemplate(received);
    } else if (service === "profile") {
      templateHTML = employeeProfileTemplate(received);
    } else if (service === "usertransaction") {
      templateHTML = transactionInvoiceTemplate(received);
    }

    /** ------------------ THIS FIX IS IMPORTANT ------------------ **/
    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath, // Chrome from @sparticuz/chromium
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();
    await page.setContent(templateHTML, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${received.name}-${service}.pdf`
    );

    return res.send(pdfBuffer);

  } catch (error) {
    console.error("Error generating PDF:", error);
    return res.status(500).json({
      success: false,
      message: "Failed generating PDF"
    });
  }
};

export default generatePDF;