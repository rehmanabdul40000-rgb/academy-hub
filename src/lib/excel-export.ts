import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getSettings } from "@/features/settings/settings.storage";
import {
  calculateMetrics,
  computeRemaining,
  computeStudentStatus,
  getPaymentHistory,
  getStudentSavedAt,
} from "@/features/students/students.storage";
import type { Student } from "@/types/student";

export async function exportAcademyToExcel(students: Student[]) {
  const settings = getSettings();
  const academyName = settings.academyName?.trim() || "Academy Hub";
  const currencyLabel = settings.currencyLabel || "Rs";

  const workbook = new ExcelJS.Workbook();
  workbook.creator = settings.adminDisplayName || academyName;
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
  studentsSheet.mergeCells("A1:M1");
  const r1 = studentsSheet.getCell("A1");
  r1.value = `${academyName.toUpperCase()} — STUDENT DIRECTORY & FEE RECORDS`;
  r1.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  r1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${navyAccent}` } };
  r1.alignment = { vertical: "middle", horizontal: "center" };
  studentsSheet.getRow(1).height = 36;

  // Row 2: Report Title
  studentsSheet.mergeCells("A2:M2");
  const r2 = studentsSheet.getCell("A2");
  r2.value = "STUDENT ENROLLMENT & FEE COLLECTION DIRECTORY";
  r2.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF38BDF8" } };
  r2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${navyDark}` } };
  r2.alignment = { vertical: "middle", horizontal: "center" };
  studentsSheet.getRow(2).height = 24;

  // Row 3: Meta Info
  studentsSheet.mergeCells("A3:M3");
  const r3 = studentsSheet.getCell("A3");
  r3.value = `Institution: ${academyName}  |  Admin: ${settings.adminDisplayName}  |  Session: ${settings.academicSession}  |  Export Generated: ${formattedDateTime}  |  Total Enrolled: ${students.length}`;
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
    "Gender",
    "Student Full Name",
    "Phone / WhatsApp",
    "Course / Class",
    "Date Joined",
    "Saved At",
    `Total Fees (${currencyLabel})`,
    `Amount Paid (${currencyLabel})`,
    `Remaining Balance (${currencyLabel})`,
    "Payment Status",
    "Remarks / Notes",
    "Gender",
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
    to: { row: 7, column: 13 },
  };

  // Data Rows (Row 8 onwards)
  students.forEach((s, idx) => {
    const savedTimeDisplay = getStudentSavedAt(s);
    const currentStatus = computeStudentStatus(s.totalFees, s.amountPaid);
    const currentRemaining = computeRemaining(s.totalFees, s.amountPaid);

    const row = studentsSheet.addRow([
      idx + 1,
      s.id,
      s.gender || "Unspecified",
      s.name,
      s.phone || "—",
      s.course || "—",
      s.dateJoined || "—",
      savedTimeDisplay,
      s.totalFees,
      s.amountPaid,
      currentRemaining,
      currentStatus,
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
      if (colNumber === 1 || colNumber === 2 || colNumber === 3 || colNumber === 7 || colNumber === 8) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else if (colNumber >= 9 && colNumber <= 11) {
        cell.alignment = { vertical: "middle", horizontal: "right" };
        cell.numFmt = "#,##0";
      } else if (colNumber === 12) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
        if (currentStatus === "Paid") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
          cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FF15803D" } };
        } else if (currentStatus === "Partial") {
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
    { width: 14 }, // Gender
    { width: 28 }, // Student Name
    { width: 18 }, // Phone / WhatsApp
    { width: 24 }, // Course / Class
    { width: 15 }, // Date Joined
    { width: 22 }, // Saved At
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

  // -------------------------------------------------------------
  // 3. FEE ANALYTICS SHEET
  // -------------------------------------------------------------
  const analyticsSheet = workbook.addWorksheet("Fee Analytics", {
    views: [{ state: "frozen", ySplit: 3, showGridLines: true }],
  });

  analyticsSheet.mergeCells("A1:D1");
  const analyticsTitle = analyticsSheet.getCell("A1");
  analyticsTitle.value = `${academyName.toUpperCase()} — FEE ANALYTICS`;
  analyticsTitle.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  analyticsTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${navyAccent}` } };
  analyticsTitle.alignment = { vertical: "middle", horizontal: "center" };
  analyticsSheet.getRow(1).height = 34;

  analyticsSheet.mergeCells("A2:D2");
  const analyticsMeta = analyticsSheet.getCell("A2");
  analyticsMeta.value = `Admin: ${settings.adminDisplayName}  |  Session: ${settings.academicSession}  |  Generated: ${formattedDateTime}`;
  analyticsMeta.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "FF475569" } };
  analyticsMeta.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  analyticsMeta.alignment = { vertical: "middle", horizontal: "center" };

  const analyticsHeader = analyticsSheet.addRow([
    "Payment Status",
    "Students",
    "Amount Paid",
    "Remaining Balance",
  ]);
  analyticsHeader.height = 26;
  analyticsHeader.eachCell((cell) => {
    cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${navyDark}` } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = { bottom: { style: "medium", color: { argb: `FF${navyAccent}` } } };
  });

  const analyticsRows = (["Paid", "Partial", "Pending"] as const).map((status) => {
    const matching = students.filter(
      (student) => computeStudentStatus(student.totalFees, student.amountPaid) === status,
    );
    return [
      status,
      matching.length,
      matching.reduce((sum, student) => sum + Number(student.amountPaid || 0), 0),
      matching.reduce(
        (sum, student) =>
          sum + computeRemaining(Number(student.totalFees || 0), Number(student.amountPaid || 0)),
        0,
      ),
    ];
  });

  analyticsRows.forEach((values, index) => {
    const row = analyticsSheet.addRow(values);
    row.height = 24;
    row.eachCell((cell, column) => {
      cell.font = { name: "Segoe UI", size: 10 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: index % 2 ? "FFF8FAFC" : "FFFFFFFF" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: `FF${borderSlate}` } },
        bottom: { style: "thin", color: { argb: `FF${borderSlate}` } },
        left: { style: "thin", color: { argb: `FF${borderSlate}` } },
        right: { style: "thin", color: { argb: `FF${borderSlate}` } },
      };
      cell.alignment = { vertical: "middle", horizontal: column === 1 ? "left" : "right" };
      if (column >= 3) cell.numFmt = "#,##0";
    });
  });

  analyticsSheet.columns = [{ width: 22 }, { width: 14 }, { width: 20 }, { width: 24 }];

  const paymentSheet = workbook.addWorksheet("Payment History", {
    views: [{ state: "frozen", ySplit: 3, showGridLines: true }],
  });
  paymentSheet.mergeCells("A1:K1");
  const paymentTitle = paymentSheet.getCell("A1");
  paymentTitle.value = `${academyName.toUpperCase()} — PAYMENT HISTORY`;
  paymentTitle.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  paymentTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${navyAccent}` } };
  paymentTitle.alignment = { vertical: "middle", horizontal: "center" };
  paymentSheet.getRow(1).height = 34;
  paymentSheet.mergeCells("A2:K2");
  paymentSheet.getCell("A2").value =
    `Admin: ${settings.adminDisplayName}  |  Session: ${settings.academicSession}  |  Generated: ${formattedDateTime}`;
  paymentSheet.getCell("A2").font = {
    name: "Segoe UI",
    size: 9.5,
    italic: true,
    color: { argb: "FF475569" },
  };
  const paymentHeaders = [
    "Payment ID",
    "Student ID",
    "Student Name",
    `Amount (${currencyLabel})`,
    `Previous Paid (${currencyLabel})`,
    `Previous Remaining (${currencyLabel})`,
    `New Paid (${currencyLabel})`,
    `New Remaining (${currencyLabel})`,
    "Payment Date",
    "Payment Time",
    "Recorded By",
  ];
  const paymentHeaderRow = paymentSheet.addRow(paymentHeaders);
  paymentHeaderRow.eachCell((cell) => {
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${navyDark}` } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  paymentSheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: 11 } };
  students
    .flatMap((student) => getPaymentHistory(student))
    .forEach((payment, index) => {
      const row = paymentSheet.addRow([
        payment.id,
        payment.studentId,
        payment.studentName,
        payment.amount,
        payment.previousPaid,
        payment.previousRemaining,
        payment.newPaid,
        payment.newRemaining,
        payment.paymentDate,
        payment.paymentTime,
        payment.recordedBy,
      ]);
      row.eachCell((cell, column) => {
        cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF0F172A" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: index % 2 ? "FFF8FAFC" : "FFFFFFFF" },
        };
        cell.border = {
          top: { style: "thin", color: { argb: `FF${borderSlate}` } },
          bottom: { style: "thin", color: { argb: `FF${borderSlate}` } },
          left: { style: "thin", color: { argb: `FF${borderSlate}` } },
          right: { style: "thin", color: { argb: `FF${borderSlate}` } },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: column >= 4 && column <= 8 ? "right" : "left",
        };
        if (column >= 4 && column <= 8) cell.numFmt = "#,##0";
      });
    });
  paymentSheet.columns = [
    { width: 28 },
    { width: 16 },
    { width: 26 },
    { width: 18 },
    { width: 22 },
    { width: 28 },
    { width: 18 },
    { width: 24 },
    { width: 16 },
    { width: 14 },
    { width: 22 },
  ];

  (["Male", "Female"] as const).forEach((gender) => {
    const genderSheet = workbook.addWorksheet(`${gender} Students`, {
      views: [{ state: "frozen", ySplit: 7, showGridLines: true }],
    });
    const matching = students.filter((s) => (s.gender || "Unspecified") === gender);
    const genderMetrics = calculateMetrics(matching);
    const genderCollectionRate =
      genderMetrics.totalBilledFees > 0
        ? (genderMetrics.totalFeesCollected / genderMetrics.totalBilledFees) * 100
        : 0;

    genderSheet.mergeCells("A1:M1");
    const gr1 = genderSheet.getCell("A1");
    gr1.value = `${academyName.toUpperCase()} — ${gender.toUpperCase()} STUDENTS`;
    gr1.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    gr1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${navyAccent}` } };
    gr1.alignment = { vertical: "middle", horizontal: "center" };
    genderSheet.getRow(1).height = 36;

    genderSheet.mergeCells("A2:M2");
    const gr2 = genderSheet.getCell("A2");
    gr2.value = `${gender.toUpperCase()} STUDENT DIRECTORY & FEE COLLECTION`;
    gr2.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF38BDF8" } };
    gr2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${navyDark}` } };
    gr2.alignment = { vertical: "middle", horizontal: "center" };
    genderSheet.getRow(2).height = 24;

    genderSheet.mergeCells("A3:M3");
    const gr3 = genderSheet.getCell("A3");
    gr3.value = `Institution: ${academyName}  |  Admin: ${settings.adminDisplayName}  |  Session: ${settings.academicSession}  |  Export Generated: ${formattedDateTime}  |  Total ${gender}: ${matching.length}`;
    gr3.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "FF475569" } };
    gr3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    gr3.alignment = { vertical: "middle", horizontal: "center" };
    genderSheet.getRow(3).height = 22;
    genderSheet.getRow(4).height = 10;

    const cards = [
      ["A5:C5", `Total Billed: ${currencyLabel} ${genderMetrics.totalBilledFees.toLocaleString()}`, "FFE2E8F0", "FF0F172A"],
      ["D5:F5", `Total Collected: ${currencyLabel} ${genderMetrics.totalFeesCollected.toLocaleString()}`, "FFDCFCE7", "FF15803D"],
      ["G5:I5", `Total Outstanding: ${currencyLabel} ${genderMetrics.totalOutstandingFees.toLocaleString()}`, "FFFEF3C7", "FFB45309"],
      ["J5:L5", `Collection Rate: ${genderCollectionRate.toFixed(1)}%`, "FFDBEAFE", "FF1D4ED8"],
    ];
    for (const [range, value, fill, fontColor] of cards) {
      genderSheet.mergeCells(range);
      const cell = genderSheet.getCell(range.split(":")[0]);
      cell.value = value;
      cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: fontColor } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin", color: { argb: `FF${borderSlate}` } },
        bottom: { style: "thin", color: { argb: `FF${borderSlate}` } },
        left: { style: "thin", color: { argb: `FF${borderSlate}` } },
        right: { style: "thin", color: { argb: `FF${borderSlate}` } },
      };
    }
    genderSheet.getRow(5).height = 26;
    genderSheet.getRow(6).height = 10;

    const genderHeaders = [
      "Sr. #", "Student ID", "Gender", "Student Full Name", "Phone / WhatsApp",
      "Course / Class", "Date Joined", "Saved At", `Total Fees (${currencyLabel})`,
      `Amount Paid (${currencyLabel})`, `Remaining Balance (${currencyLabel})`,
      "Payment Status", "Remarks / Notes",
    ];
    const genderHeader = genderSheet.getRow(7);
    genderHeader.values = genderHeaders;
    genderHeader.height = 28;
    genderHeader.eachCell((cell) => {
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
    genderSheet.autoFilter = { from: { row: 7, column: 1 }, to: { row: 7, column: 13 } };

    matching.forEach((s, idx) => {
      const currentStatus = computeStudentStatus(s.totalFees, s.amountPaid);
      const currentRemaining = computeRemaining(s.totalFees, s.amountPaid);
      const row = genderSheet.addRow([
        idx + 1, s.id, s.gender || "Unspecified", s.name, s.phone || "—",
        s.course || "—", s.dateJoined || "—", getStudentSavedAt(s), s.totalFees,
        s.amountPaid, currentRemaining, currentStatus, s.notes || "—",
      ]);
      row.height = 22;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF0F172A" } };
        cell.border = {
          top: { style: "thin", color: { argb: `FF${borderSlate}` } },
          left: { style: "thin", color: { argb: `FF${borderSlate}` } },
          bottom: { style: "thin", color: { argb: `FF${borderSlate}` } },
          right: { style: "thin", color: { argb: `FF${borderSlate}` } },
        };
        if (idx % 2 === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${lightZebra}` } };
        }
        if ([1, 2, 3, 7, 8, 12].includes(colNumber)) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else if (colNumber >= 9 && colNumber <= 11) {
          cell.alignment = { vertical: "middle", horizontal: "right" };
          cell.numFmt = "#,##0";
        } else {
          cell.alignment = { vertical: "middle", horizontal: "left" };
        }
        if (colNumber === 12) {
          cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: currentStatus === "Paid" ? "FF15803D" : currentStatus === "Partial" ? "FF1D4ED8" : "FFB45309" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: currentStatus === "Paid" ? "FFDCFCE7" : currentStatus === "Partial" ? "FFDBEAFE" : "FFFEF3C7" } };
        }
      });
    });

    const genderFooter = genderSheet.addRow([
      "TOTAL", `Students: ${matching.length}`, "", "", "", "", "", "",
      genderMetrics.totalBilledFees, genderMetrics.totalFeesCollected, genderMetrics.totalOutstandingFees, "", "",
    ]);
    genderFooter.height = 26;
    genderFooter.eachCell((cell, colNumber) => {
      cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FF0F172A" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
      cell.border = {
        top: { style: "thin", color: { argb: "FF0F172A" } },
        bottom: { style: "double", color: { argb: "FF0F172A" } },
        left: { style: "thin", color: { argb: `FF${borderSlate}` } },
        right: { style: "thin", color: { argb: `FF${borderSlate}` } },
      };
      if (colNumber >= 9 && colNumber <= 11) {
        cell.alignment = { vertical: "middle", horizontal: "right" };
        cell.numFmt = "#,##0";
      }
    });

    genderSheet.columns = [
      { width: 8 }, { width: 16 }, { width: 14 }, { width: 28 }, { width: 18 },
      { width: 24 }, { width: 15 }, { width: 22 }, { width: 18 }, { width: 18 },
      { width: 20 }, { width: 16 }, { width: 34 },
    ];
  });
  // Generate buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const sanitizedAcademyName = academyName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${sanitizedAcademyName}_Student_Directory_${dateString}.xlsx`;
  saveAs(blob, filename);
}
