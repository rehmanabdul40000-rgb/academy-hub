import { formatCurrencyWithLabel, getSettings } from "@/features/settings/settings.storage";
import type { PaymentRecord, Student } from "@/types/student";

function escapeHtml(value: string): string {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
    return entities[character] || character;
  });
}

export function printPaymentReceipt(student: Student, payment: PaymentRecord): void {
  if (typeof window === "undefined") return;
  const settings = getSettings();
  const academyName = settings.academyName.trim() || "Academy Hub";
  const currencyLabel = settings.currencyLabel || "Rs";
  const bankName = settings.bankAccountName?.trim() || "—";
  const bankNumber = settings.bankAccountNumber?.trim() || "—";
  const money = (amount: number) => escapeHtml(formatCurrencyWithLabel(amount, currencyLabel));
  const status = payment.newRemaining === 0 ? "Paid" : "Partial";
  const monthLabel = payment.monthKey
    ? new Date(Number(payment.monthKey.slice(0, 4)), Number(payment.monthKey.slice(5, 7)) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  const copy = (label: string) => `
    <section class="copy">
      <div class="copy-label">${label}</div>
      <header class="brand">
        <div><h1>${escapeHtml(academyName)}</h1><p>Student &amp; Fee Management</p></div>
        <div class="receipt-title">FEE RECEIPT<br><span>${escapeHtml(payment.id)}</span></div>
      </header>
      <section class="meta">
        <div><div class="label">Student Name</div><div class="value">${escapeHtml(student.name)}</div></div>
        <div><div class="label">Father Name</div><div class="value">${escapeHtml(student.fatherName || "Not provided")}</div></div>
        <div><div class="label">Contact No. 1</div><div class="value">${escapeHtml(student.phone || "Not provided")}</div></div>
        <div><div class="label">Contact No. 2</div><div class="value">${escapeHtml(student.phone2 || "Not provided")}</div></div>
        <div><div class="label">Course / Class</div><div class="value">${escapeHtml(student.course || "Not specified")}</div></div>
        <div><div class="label">Payment Date / Time</div><div class="value">${escapeHtml(payment.paymentDate)} · ${escapeHtml(payment.paymentTime)}</div></div>
      </section>
      <div class="bank"><strong>Bank / Account Name:</strong> ${escapeHtml(bankName)} &nbsp; | &nbsp; <strong>Account No:</strong> ${escapeHtml(bankNumber)}</div>
      <section class="payment">
        <div class="row"><span>Admission Fee (One-time)</span><strong>${money(student.admissionFee)}</strong></div>
        <div class="row"><span>Monthly Fee</span><strong>${money(student.monthlyFee)}</strong></div>
        <div class="row"><span>Payment Type ${monthLabel ? "· " + escapeHtml(monthLabel) : ""}</span><strong>${escapeHtml(payment.feeType || "Fee Payment")}</strong></div>
        <div class="row"><span>This Payment</span><strong>${money(payment.amount)}</strong></div>
        <div class="row"><span>Previous Paid</span><strong>${money(payment.previousPaid)}</strong></div>
        <div class="row"><span>Previous Balance</span><strong>${money(payment.previousRemaining)}</strong></div>
        <div class="row"><span>New Total Paid</span><strong>${money(payment.newPaid)}</strong></div>
        <div class="row highlight"><span>New Remaining Balance</span><strong>${money(payment.newRemaining)}</strong></div>
      </section>
      <div class="status">Payment Status: ${status}</div>
      <footer class="footer">Recorded by ${escapeHtml(payment.recordedBy)} · Academic Session ${escapeHtml(settings.academicSession || "—")}</footer>
    </section>`;

  const receiptWindow = window.open("", "academy-hub-payment-receipt", "width=900,height=1000");
  if (!receiptWindow) return;
  receiptWindow.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Fee Receipt - ${escapeHtml(student.name)}</title>
  <style>
    body{margin:0;background:#e9eef4;color:#172033;font-family:"Segoe UI",Arial,sans-serif}.copies{max-width:820px;margin:20px auto}.copy{background:#fff;padding:28px 32px;margin-bottom:16px;border:1px solid #cbd5e1;box-shadow:0 8px 24px rgba(15,23,42,.08);page-break-inside:avoid}.copy-label{display:inline-block;padding:4px 9px;border-radius:999px;background:#e0f2fe;color:#0369a1;font-size:10px;font-weight:800;letter-spacing:.08em}.brand{display:flex;justify-content:space-between;gap:20px;border-bottom:3px solid #0891b2;padding:14px 0}.brand h1{margin:0;font-size:24px}.brand p{margin:3px 0 0;color:#64748b;font-size:11px}.receipt-title{text-align:right;color:#0e7490;font-size:10px;font-weight:800}.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px 28px;margin:20px 0}.label{font-size:9px;color:#64748b;text-transform:uppercase}.value{margin-top:3px;font-size:12px;font-weight:600}.bank{padding:10px 12px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:7px;font-size:10px}.payment{margin-top:16px;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden}.row{display:flex;justify-content:space-between;padding:9px 12px;border-bottom:1px solid #e2e8f0;font-size:11px}.row:last-child{border-bottom:0}.highlight{background:#ecfeff;font-weight:800}.status{display:inline-block;margin-top:13px;padding:5px 10px;border-radius:999px;background:#e0f2fe;color:#0369a1;font-size:10px;font-weight:800}.footer{margin-top:18px;border-top:1px solid #e2e8f0;padding-top:9px;color:#64748b;font-size:9px}@media print{body{background:#fff}.copies{max-width:none;margin:0}.copy{box-shadow:none;margin:0 0 10mm;padding:20px 24px}.copy+.copy{page-break-before:always}}
  </style></head><body><main class="copies">${copy("ACADEMY / CAMPUS COPY")}<div style="text-align:center;color:#64748b;font-size:9px;border-top:1px dashed #94a3b8;padding:5px">✂ Cut here after printing</div>${copy("STUDENT COPY")}</main><script>window.onload=function(){window.print()}</script></body></html>`);
  receiptWindow.document.close();
}
