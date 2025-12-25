import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import {
  employeeProfileTemplate,
  transactionInvoiceTemplate,
  transactionReportTemplate
} from "../utils/PDFTemplates.js";

export default async function generatePDF(req, res) {
  try {
    const parsed = JSON.parse(req.body?.data || "{}");
    const service = req.params.service;
    let templateHTML;

    if (service === "transactions") templateHTML = transactionReportTemplate(parsed);
    else if (service === "profile") templateHTML = employeeProfileTemplate(parsed);
    else if (service === "usertransaction") templateHTML = transactionInvoiceTemplate(parsed);
    else return res.status(400).send("Invalid service type");

    /** --- FIX PART: VERCEL CHROMIUM LAUNCH --- */
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),   // <— MUST BE THIS
      headless: true,
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();
    await page.setContent(templateHTML, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${parsed.name}-${service}.pdf`);
    return res.send(pdfBuffer);

  } catch (error) {
    console.error("PDF ERROR >>", error);
    return res.status(500).json({ error: true, message: error.message });
  }
}

