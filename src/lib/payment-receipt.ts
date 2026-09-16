import { getSettings } from "@/features/settings/settings.storage";
import { formatCurrencyWithLabel } from "@/features/settings/settings.storage";
import type { PaymentRecord, Student } from "@/types/student";

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character] || character;
  });
}

export function printPaymentReceipt(student: Student, payment: PaymentRecord): void {
  if (typeof window === "undefined") return;

  const settings = getSettings();
  const academyName = settings.academyName.trim() || "Academy Hub";
  const currencyLabel = settings.currencyLabel || "Rs";
  const displayAmount = (amount: number) =>
    escapeHtml(formatCurrencyWithLabel(amount, currencyLabel));
  const receiptWindow = window.open("", "academy-hub-payment-receipt", "width=820,height=900");

  if (!receiptWindow) return;

  receiptWindow.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Payment Receipt - ${escapeHtml(student.id)}</title>
  <style>
    :root { color-scheme: light; font-family: "Segoe UI", Arial, sans-serif; }
    body { margin: 0; background: #eef2f7; color: #172033; }
    .receipt { max-width: 720px; margin: 32px auto; padding: 42px; background: #fff; box-shadow: 0 16px 50px rgba(15, 23, 42, .12); }
    .brand { display: flex; justify-content: space-between; gap: 24px; border-bottom: 3px solid #0891b2; padding-bottom: 22px; }
    h1 { margin: 0; font-size: 26px; letter-spacing: .02em; }
    h2 { margin: 4px 0 0; font-size: 12px; font-weight: 500; color: #64748b; }
    .receipt-title { text-align: right; color: #0e7490; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; font-size: 12px; }
    .meta, .totals { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 30px; margin: 28px 0; }
    .label { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
    .value { margin-top: 3px; font-size: 14px; font-weight: 600; }
    .payment { margin-top: 28px; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; }
    .payment-row { display: flex; justify-content: space-between; padding: 13px 16px; border-bottom: 1px solid #e2e8f0; }
    .payment-row:last-child { border-bottom: 0; background: #ecfeff; font-size: 17px; font-weight: 700; }
    .status { display: inline-block; margin-top: 22px; padding: 6px 12px; border-radius: 999px; background: #e0f2fe; color: #0369a1; font-size: 12px; font-weight: 700; }
    .footer { margin-top: 42px; border-top: 1px solid #e2e8f0; padding-top: 14px; color: #64748b; font-size: 11px; }
    @media print { body { background: #fff; } .receipt { margin: 0; max-width: none; box-shadow: none; } }
  </style>
</head>
<body>
  <article class="receipt">
    <header class="brand">
      <div><h1>${escapeHtml(academyName)}</h1><h2>Student &amp; Fee Management</h2></div>
      <div class="receipt-title">Payment Receipt<br /><span>${escapeHtml(payment.id)}</span></div>
    </header>
    <section class="meta">
      <div><div class="label">Student ID</div><div class="value">${escapeHtml(student.id)}</div></div>
      <div><div class="label">Student Name</div><div class="value">${escapeHtml(student.name)}</div></div>
      <div><div class="label">Phone / WhatsApp</div><div class="value">${escapeHtml(student.phone || "Not provided")}</div></div>
      <div><div class="label">Course / Class</div><div class="value">${escapeHtml(student.course || "Not specified")}</div></div>
      <div><div class="label">Payment Date</div><div class="value">${escapeHtml(payment.paymentDate)}</div></div>
      <div><div class="label">Payment Time</div><div class="value">${escapeHtml(payment.paymentTime)}</div></div>
    </section>
    <section class="payment">
      <div class="payment-row"><span>Payment Amount</span><strong>${displayAmount(payment.amount)}</strong></div>
      <div class="payment-row"><span>Previous Paid</span><strong>${displayAmount(payment.previousPaid)}</strong></div>
      <div class="payment-row"><span>Previous Balance</span><strong>${displayAmount(payment.previousRemaining)}</strong></div>
      <div class="payment-row"><span>New Total Paid</span><strong>${displayAmount(payment.newPaid)}</strong></div>
      <div class="payment-row"><span>New Remaining Balance</span><strong>${displayAmount(payment.newRemaining)}</strong></div>
    </section>
    <div class="status">Payment Status: ${escapeHtml(payment.newRemaining === 0 ? "Paid" : "Partial")}</div>
    <footer class="footer">Recorded by ${escapeHtml(payment.recordedBy)}${settings.academicSession ? ` · Academic Session ${escapeHtml(settings.academicSession)}` : ""}</footer>
  </article>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`);
  receiptWindow.document.close();
}
