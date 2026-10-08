import ExcelJS from "exceljs";
import type { NewStudentInput, StudentGender, StudentShift } from "@/types/student";

export interface StudentImportResult {
  rows: NewStudentInput[];
  errors: string[];
  totalRows: number;
}

function normalize(value: unknown): string {
  return String(value ?? "").trim();
}

function key(value: unknown): string {
  return normalize(value).toLowerCase().replace(/[\\s_/-]+/g, "");
}

function rowToInput(values: unknown[], rowNumber: number, columns?: Map<string, number>): { row?: NewStudentInput; error?: string } {
  const cells = (values || []).map((value) => normalize(value));
  const normalized = new Map<string, string>();
  cells.forEach((value, index) => normalized.set(String(index), value));
  const aliases: Record<string, string[]> = {
    id: ["studentid", "id", "studentnumber", "registrationno", "rollno"],
    fatherName: ["fathername", "father", "fatherfullname"],
    phone2: ["phone2", "contact2", "secondcontact", "alternatephone", "alternatecontact"],
    admissionFee: ["admissionfee", "admission", "admissioncharges"],
    monthlyFee: ["monthlyfee", "monthly", "monthlycharges"],
    name: ["studentname", "fullname", "name", "studentfullname"],
    gender: ["gender", "sex"],
    phone: ["phonewhatsapp", "phone", "whatsapp", "contact", "mobile"],
    course: ["courseclass", "course", "class", "courseclassname"],
    dateJoined: ["datejoined", "joiningdate", "dateofjoining"],
    shift: ["shift", "shiftname"],
    shiftTime: ["shifttime", "classtime", "time", "classtime"],
    totalFees: ["totalfees", "fees", "totalfee", "total"],
    amountPaid: ["amountpaid", "paid", "paidamount", "initialpaid"],
    notes: ["notes", "remarks", "remark", "comments"],
  };
  const get = (field: keyof typeof aliases) => {
    if (columns) {
      for (const alias of aliases[field]) {
        const index = columns.get(alias);
        if (index !== undefined) return normalized.get(String(index)) || "";
      }
    }
    return "";
  };
  const id = get("id") || undefined;
  const name = get("name");
  if (!name) return { error: `Row ${rowNumber}: Student Name is required.` };
  const admissionFee = Number(get("admissionFee") || 0);
  const monthlyFee = Number(get("monthlyFee") || 0);
  const totalRaw = get("totalFees");
  const totalFees = totalRaw === "" ? admissionFee + monthlyFee : Number(totalRaw);
  if (![admissionFee, monthlyFee, totalFees].every(Number.isFinite) || admissionFee < 0 || monthlyFee < 0 || totalFees < 0) return { error: `Row ${rowNumber}: Fee values are invalid.` };
  const paidRaw = get("amountPaid");
  const amountPaid = paidRaw === "" ? 0 : Number(paidRaw);
  if (!Number.isFinite(amountPaid) || amountPaid < 0 || amountPaid > Math.max(totalFees, admissionFee + monthlyFee)) return { error: `Row ${rowNumber}: Amount Paid is invalid or greater than the initial fee total.` };
  const genderRaw = get("gender").toLowerCase();
  const shiftRaw = get("shift").toLowerCase();
  const gender: StudentGender | undefined = genderRaw === "male" ? "Male" : genderRaw === "female" ? "Female" : undefined;
  const shift: StudentShift | undefined = shiftRaw.includes("morning") ? "Morning" : shiftRaw.includes("evening") ? "Evening" : undefined;
  return { row: { id, name, fatherName: get("fatherName") || undefined, gender, phone: get("phone") || undefined, phone2: get("phone2") || undefined, course: get("course") || undefined, dateJoined: get("dateJoined") || undefined, shift, shiftTime: get("shiftTime") || undefined, admissionFee, monthlyFee, totalFees, amountPaid, notes: get("notes") || undefined } };
}

export async function parseStudentImportFile(file: File): Promise<StudentImportResult> {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  if (file.name.toLowerCase().endsWith(".csv")) {
    const text = new TextDecoder().decode(buffer);
    await workbook.csv.load(text);
  } else {
    await workbook.xlsx.load(buffer);
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) return { rows: [], errors: ["The file does not contain a worksheet."], totalRows: 0 };
  const values = Array.from({ length: sheet.rowCount }, (_, index) => sheet.getRow(index + 1).values as unknown[]);
  const headerCells = (values[0] || []).map((value) => key(value));
  const knownHeader = headerCells.some((value) => ["studentid","studentname","fullname","gender","phonewhatsapp","courseclass","totalfees"].includes(value));
  const columns = new Map<string, number>();
  if (knownHeader) headerCells.forEach((value, index) => { if (value) columns.set(value, index); });
  const start = knownHeader ? 2 : 1;
  const rows: NewStudentInput[] = [];
  const errors: string[] = [];
  if (!knownHeader) errors.push("The first row must contain column headings such as Student Name, Father Name, Admission Fee, Monthly Fee, and Amount Paid.");
  for (let rowNumber = start; rowNumber <= values.length; rowNumber += 1) {
    const parsed = rowToInput(values[rowNumber - 1] || [], rowNumber, columns);
    if (parsed.row) rows.push(parsed.row);
    else if (parsed.error) errors.push(parsed.error);
  }
  return { rows, errors, totalRows: Math.max(0, values.length - start + 1) };
}
