import html_to_pdf from "html-pdf-node";
import {
  employeeProfileTemplate,
  transactionInvoiceTemplate,
  transactionReportTemplate,
} from "../utils/PDFTemplates.js";


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
    const file = { content: templateHTML };

    const pdfBuffer = await html_to_pdf.generatePdf(file, {
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "10mm",
        right: "10mm",
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");


    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while generating PDF",
    });
  }
};

export default generatePDF;
