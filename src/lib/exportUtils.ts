import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { toast } from "sonner";

export const calculateGrade = (marks: number, totalMarks: number) => {
  const percentage = (marks / totalMarks) * 100;
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "F";
};

export interface ExcelExportOptions {
  filename: string;
  sheets: Array<{
    name: string;
    data: (string | number)[][];
  }>;
}

export interface PDFExportOptions {
  filename: string;
  title: string;
  summaryItems: Array<{ label: string; value: string | number }>;
  tableTitle: string;
  tableHeaders: string[];
  tableData: (string | number)[][];
}

/**
 * Export data to Excel with multiple sheets
 */
export const exportToExcel = (options: ExcelExportOptions) => {
  try {
    const wb = XLSX.utils.book_new();

    options.sheets.forEach((sheet) => {
      const ws = XLSX.utils.aoa_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });

    XLSX.writeFile(wb, options.filename);
    toast.success("Report exported to Excel successfully");
  } catch (error) {
    console.error("Excel export error:", error);
    toast.error("Failed to export report to Excel");
  }
};

/**
 * Export data to PDF with formatted tables and pagination
 */
export const exportToPDF = (options: PDFExportOptions) => {
  try {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = 20;

    // Title
    pdf.setFontSize(18);
    pdf.text(options.title, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Summary section
    pdf.setFontSize(11);
    options.summaryItems.forEach((item) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(`${item.label}: ${item.value}`, margin, yPosition);
      yPosition += 8;
    });

    yPosition += 7;

    // Table section
    pdf.setFontSize(14);
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 20;
    }
    pdf.text(options.tableTitle, margin, yPosition);
    yPosition += 10;

    // Table headers
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.setFillColor(0, 102, 204);
    const headerHeight = 7;
    const headerWidth = pageWidth - 2 * margin;
    pdf.rect(margin, yPosition - 5, headerWidth, headerHeight, "F");

    const colWidth = headerWidth / options.tableHeaders.length;
    options.tableHeaders.forEach((header, idx) => {
      pdf.text(header, margin + 2 + idx * colWidth, yPosition);
    });
    yPosition += 10;

    // Table data
    pdf.setTextColor(0, 0, 0);
    options.tableData.forEach((row) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      row.forEach((cell, idx) => {
        pdf.text(String(cell), margin + 2 + idx * colWidth, yPosition);
      });
      yPosition += 8;
    });

    pdf.save(options.filename);
    toast.success("Report exported to PDF successfully");
  } catch (error) {
    console.error("PDF export error:", error);
    toast.error("Failed to export report to PDF");
  }
};
