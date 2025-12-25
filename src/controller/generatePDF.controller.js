import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { employeeProfileTemplate, transactionInvoiceTemplate, transactionReportTemplate } from "../utils/PDFTemplates.js";

const generatePDF = async (req, res) => {
  try {
    const { data } = req.body;
    const service = req.params.service;
    let templateHTML;

    if (service === "transactions") {
      templateHTML = transactionReportTemplate(JSON.parse(data));
    } else if (service === "profile") {
      templateHTML = employeeProfileTemplate(JSON.parse(data));
    } else if (service === "usertransaction") {
      templateHTML = transactionInvoiceTemplate(JSON.parse(data));
    }

    // 🔥 Launch Chromium compatible with Vercel
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
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
      `attachment; filename=${JSON.parse(data).name}-${service}.pdf`
    );

    return res.send(pdfBuffer);

  } catch (error) {
    console.error("PDF ERROR:", error);
    return res.status(500).json({ message: "Server error while generating PDF" });
  }
};

export default generatePDF;