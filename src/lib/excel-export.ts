import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getSettings } from "@/features/settings/settings.storage";
import { calculateMetrics, getStudentSavedAt } from "@/features/students/students.storage";
import type { Student } from "@/types/student";

export async function exportAcademyToExcel(students: Student[]) {
  const settings = getSettings();
  const academyName = settings.academyName?.trim() || "Academy Hub";
  const currencyLabel = settings.currencyLabel || "Rs";

  const workbook = new ExcelJS.Workbook();
  workbook.creator = `${academyName} Admin`;
  workbook.created = new Date();
  workbook.modified = new Date();

  const metrics = calculateMetrics(students);
  const nowDate = new Date();
  const dateString = nowDate.toISOString().split("T")[0];
  const formattedDateTime = nowDate.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const navyDark = "1E293B";
  const navyAccent = "0F172A";
  const lightZebra = "F8FAFC";
  const borderSlate = "CBD5E1";

  const collectionRate =
    metrics.totalBilledFees > 0 ? (metrics.totalFeesCollected / metrics.totalBilledFees) * 100 : 0;

  // -------------------------------------------------------------
  // 1. STUDENTS DIRECTORY SHEET
  // -------------------------------------------------------------
  const studentsSheet = workbook.addWorksheet("Students Directory", {
    views: [{ state: "frozen", ySplit: 7, showGridLines: true }],
  });

  // Row 1: Academy Name Header Banner
  studentsSheet.mergeCells("A1:L1");
  const r1 = studentsSheet.getCell("A1");
  r1.value = academyName.toUpperCase();
  r1.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  r1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${navyAccent}` } };
  r1.alignment = { vertical: "middle", horizontal: "center" };
  studentsSheet.getRow(1).height = 36;

  // Row 2: Report Title
  studentsSheet.mergeCells("A2:L2");
  const r2 = studentsSheet.getCell("A2");
  r2.value = "STUDENT ENROLLMENT & FEE COLLECTION DIRECTORY";
  r2.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF38BDF8" } };
  r2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${navyDark}` } };
  r2.alignment = { vertical: "middle", horizontal: "center" };
  studentsSheet.getRow(2).height = 24;

  // Row 3: Meta Info
  studentsSheet.mergeCells("A3:L3");
  const r3 = studentsSheet.getCell("A3");
  r3.value = `Export Date & Time: ${formattedDateTime}  |  Total Students: ${students.length}  |  Currency: ${currencyLabel}`;
  r3.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "FF475569" } };
  r3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  r3.alignment = { vertical: "middle", horizontal: "center" };
  studentsSheet.getRow(3).height = 22;

  // Row 4: Blank Separator Row
  studentsSheet.getRow(4).height = 10;

  // Row 5: Financial KPI Summary Cards
  studentsSheet.mergeCells("A5:C5");
  const kpi1 = studentsSheet.getCell("A5");
  kpi1.value = `Total Billed: ${currencyLabel} ${metrics.totalBilledFees.toLocaleString()}`;
  kpi1.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0F172A" } };
  kpi1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  kpi1.alignment = { vertical: "middle", horizontal: "center" };

  studentsSheet.mergeCells("D5:F5");
  const kpi2 = studentsSheet.getCell("D5");
  kpi2.value = `Total Collected: ${currencyLabel} ${metrics.totalFeesCollected.toLocaleString()}`;
  kpi2.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF15803D" } };
  kpi2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
  kpi2.alignment = { vertical: "middle", horizontal: "center" };

  studentsSheet.mergeCells("G5:I5");
  const kpi3 = studentsSheet.getCell("G5");
  kpi3.value = `Total Outstanding: ${currencyLabel} ${metrics.totalOutstandingFees.toLocaleString()}`;
  kpi3.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFB45309" } };
  kpi3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
  kpi3.alignment = { vertical: "middle", horizontal: "center" };

  studentsSheet.mergeCells("J5:L5");
  const kpi4 = studentsSheet.getCell("J5");
  kpi4.value = `Collection Rate: ${collectionRate.toFixed(1)}%`;
  kpi4.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1D4ED8" } };
  kpi4.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
  kpi4.alignment = { vertical: "middle", horizontal: "center" };

  [kpi1, kpi2, kpi3, kpi4].forEach((cell) => {
    cell.border = {
      top: { style: "thin", color: { argb: `FF${borderSlate}` } },
      bottom: { style: "thin", color: { argb: `FF${borderSlate}` } },
      left: { style: "thin", color: { argb: `FF${borderSlate}` } },
      right: { style: "thin", color: { argb: `FF${borderSlate}` } },
    };
  });
  studentsSheet.getRow(5).height = 26;

  // Row 6: Blank Separator Row
  studentsSheet.getRow(6).height = 10;

  // Row 7: Table Headers
  const studentHeaders = [
    "Sr. #",
    "Student ID",
    "Student Full Name",
    "Phone / WhatsApp",
    "Course / Class",
    "Date Joined",
    "Date & Time Added",
    `Total Fees (${currencyLabel})`,
    `Amount Paid (${currencyLabel})`,
    `Remaining Balance (${currencyLabel})`,
    "Payment Status",
    "Remarks / Notes",
  ];

  const headerRow = studentsSheet.getRow(7);
  headerRow.values = studentHeaders;
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${navyDark}` } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: `FF${borderSlate}` } },
      left: { style: "thin", color: { argb: `FF${borderSlate}` } },
      bottom: { style: "medium", color: { argb: `FF${navyAccent}` } },
      right: { style: "thin", color: { argb: `FF${borderSlate}` } },
    };
  });

  // Enable autoFilter on header row
  studentsSheet.autoFilter = {
    from: { row: 7, column: 1 },
    to: { row: 7, column: 12 },
  };

  // Data Rows (Row 8 onwards)
  students.forEach((s, idx) => {
    const savedTimeDisplay = getStudentSavedAt(s);

    const row = studentsSheet.addRow([
      idx + 1,
      s.id,
      s.name,
      s.phone || "—",
      s.course || "—",
      s.dateJoined || "—",
      savedTimeDisplay,
      s.totalFees,
      s.amountPaid,
      s.remainingFees,
      s.status,
      s.notes || "—",
    ]);

    row.height = 22;
    const isEven = idx % 2 === 0;

    row.eachCell((cell, colNumber) => {
      cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF0F172A" } };
      cell.border = {
        top: { style: "thin", color: { argb: `FF${borderSlate}` } },
        left: { style: "thin", color: { argb: `FF${borderSlate}` } },
        bottom: { style: "thin", color: { argb: `FF${borderSlate}` } },
        right: { style: "thin", color: { argb: `FF${borderSlate}` } },
      };

      // Zebra striping
      if (!isEven) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: `FF${lightZebra}` },
        };
      }

      // Column Alignments & Number formats
      if (colNumber === 1 || colNumber === 2 || colNumber === 6 || colNumber === 7) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else if (colNumber >= 8 && colNumber <= 10) {
        cell.alignment = { vertical: "middle", horizontal: "right" };
        cell.numFmt = "#,##0";
      } else if (colNumber === 11) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
        if (s.status === "Paid") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
          cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF15803D" } };
        } else if (s.status === "Partial") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
          cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF1D4ED8" } };
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
          cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FFB45309" } };
        }
      } else {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }
    });
  });

  // Total Summary Footer Row
  const footerRow = studentsSheet.addRow([
    "TOTAL",
    `Students: ${students.length}`,
    "",
    "",
    "",
    "",
    "",
    metrics.totalBilledFees,
    metrics.totalFeesCollected,
    metrics.totalOutstandingFees,
    "",
    "",
  ]);
  footerRow.height = 26;
  footerRow.eachCell((cell, colNumber) => {
    cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FF0F172A" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FF0F172A" } },
      bottom: { style: "double", color: { argb: "FF0F172A" } },
      left: { style: "thin", color: { argb: `FF${borderSlate}` } },
      right: { style: "thin", color: { argb: `FF${borderSlate}` } },
    };
    if (colNumber >= 8 && colNumber <= 10) {
      cell.alignment = { vertical: "middle", horizontal: "right" };
      cell.numFmt = "#,##0";
    }
  });

  // Precise Column Widths with generous room to avoid truncation or '###'
  studentsSheet.columns = [
    { width: 8 }, // Sr. #
    { width: 16 }, // Student ID
    { width: 28 }, // Student Name
    { width: 18 }, // Phone / WhatsApp
    { width: 24 }, // Course / Class
    { width: 15 }, // Date Joined
    { width: 22 }, // Date & Time Added
    { width: 18 }, // Total Fees
    { width: 18 }, // Amount Paid
    { width: 20 }, // Remaining Balance
    { width: 16 }, // Payment Status
    { width: 34 }, // Remarks / Notes
  ];

  // -------------------------------------------------------------
  // 2. EXECUTIVE FEE SUMMARY SHEET
  // -------------------------------------------------------------
  const summarySheet = workbook.addWorksheet("Fee Summary", {
    views: [{ showGridLines: true }],
  });

  summarySheet.mergeCells("A1:D1");
  const sumTitle = summarySheet.getCell("A1");
  sumTitle.value = `${academyName.toUpperCase()} — EXECUTIVE FEE & REVENUE SUMMARY`;
  sumTitle.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  sumTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${navyAccent}` } };
  sumTitle.alignment = { vertical: "middle", horizontal: "center" };
  summarySheet.getRow(1).height = 34;

  summarySheet.addRow([]);

  const summaryHeaders = ["Metric / Indicator", "Value", "Unit / Context", "Remarks"];
  const sumHeaderRow = summarySheet.addRow(summaryHeaders);
  sumHeaderRow.height = 26;
  sumHeaderRow.eachCell((cell) => {
    cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${navyDark}` } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      bottom: { style: "medium", color: { argb: `FF${navyAccent}` } },
    };
  });

  const summaryRows = [
    ["Total Enrolled Students", metrics.totalStudents, "Students", "Active student records"],
    ["Fully Paid Students", metrics.paidStudents, "Students", "100% fees cleared"],
    ["Partial Payment Students", metrics.partialStudents, "Students", "Installments pending"],
    ["Pending Payment Students", metrics.pendingStudents, "Students", "Zero fees received"],
    ["Total Fees Billed", metrics.totalBilledFees, `${currencyLabel}`, "Gross expected revenue"],
    ["Total Fees Collected", metrics.totalFeesCollected, `${currencyLabel}`, "Realized revenue"],
    [
      "Total Outstanding Fees",
      metrics.totalOutstandingFees,
      `${currencyLabel}`,
      "Receivables balance",
    ],
    ["Fee Collection Rate", `${collectionRate.toFixed(1)}%`, "Percentage", "Realized / Billed"],
  ];

  summaryRows.forEach((r, idx) => {
    const row = summarySheet.addRow(r);
    row.height = 24;
    const isEven = idx % 2 === 0;

    row.eachCell((cell, col) => {
      cell.font = { name: "Segoe UI", size: 10 };
      if (!isEven) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${lightZebra}` } };
      }
      cell.border = {
        top: { style: "thin", color: { argb: `FF${borderSlate}` } },
        bottom: { style: "thin", color: { argb: `FF${borderSlate}` } },
        left: { style: "thin", color: { argb: `FF${borderSlate}` } },
        right: { style: "thin", color: { argb: `FF${borderSlate}` } },
      };
      if (col === 2) {
        cell.font = { name: "Segoe UI", size: 10, bold: true };
        if (typeof cell.value === "number" && idx >= 4 && idx <= 6) {
          cell.numFmt = "#,##0";
        }
      }
    });
  });

  summarySheet.columns = [{ width: 32 }, { width: 22 }, { width: 18 }, { width: 30 }];

  // Generate buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const sanitizedAcademyName = academyName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${sanitizedAcademyName}_Student_Directory_${dateString}.xlsx`;
  saveAs(blob, filename);
}
