import puppeteer from "puppeteer";
import { employeeProfileTemplate, transactionInvoiceTemplate, transactionReportTemplate } from "../utils/PDFTemplates.js";

const generatePDF = async (req, res) => {
  try {
    const data= req.body;
    const service = req.params.service;

    // console.log("Generating PDF for service:",data, service);

    let templateHTML;

    if(service === "transactions"){
      templateHTML = transactionReportTemplate(JSON.parse(data.data));
    }else if (service === "profile") {
      templateHTML = employeeProfileTemplate(JSON.parse(data.data));
    }else if (service === "usertransaction") {
      templateHTML = transactionInvoiceTemplate(JSON.parse(data.data));
    }


    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(templateHTML, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    // ✅ CORRECT HEADERS
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${data.name}-${service}.pdf`
    );

    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while generating PDF",
    });
  }
};

export default generatePDF;