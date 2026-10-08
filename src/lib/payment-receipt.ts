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
  const currencyLabel = settings.currencyLabel || "Rs";
  const money = (amount: number) => formatCurrencyWithLabel(amount, currencyLabel);
  const monthLabel = payment.monthKey
    ? new Date(Number(payment.monthKey.slice(0, 4)), Number(payment.monthKey.slice(5, 7)) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  const receiptWindow = window.open("", "academy-hub-payment-receipt", "width=1000,height=1000");
  if (!receiptWindow) return;

  const initial = {
    academyName: settings.academyName.trim() || "Academy Hub",
    studentName: student.name || "",
    fatherName: student.fatherName || "",
    phone: student.phone || "",
    phone2: student.phone2 || "",
    course: student.course || "",
    bankName: student.bankAccountName || settings.bankAccountName || "",
    bankNumber: student.bankAccountNumber || settings.bankAccountNumber || "",
    admissionFee: String(student.admissionFee || 0),
    monthlyFee: String(student.monthlyFee || 0),
    amount: String(payment.amount || 0),
    previousPaid: String(payment.previousPaid || 0),
    previousBalance: String(payment.previousRemaining || 0),
    newPaid: String(payment.newPaid || 0),
    newBalance: String(payment.newRemaining || 0),
    status: payment.newRemaining === 0 ? "Paid" : "Partial",
    paymentType: payment.feeType || "Fee Payment",
    monthLabel,
    date: payment.paymentDate,
    time: payment.paymentTime,
    receiptNo: payment.id,
    recordedBy: payment.recordedBy,
    session: settings.academicSession || "—",
  };

  receiptWindow.document.write(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>Fee Receipt - ${escapeHtml(initial.studentName)}</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#e9eef4;color:#172033;font-family:"Segoe UI",Arial,sans-serif}.editor{position:sticky;top:0;z-index:5;background:#0f172a;color:#fff;padding:12px 16px;display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:8px}.editor label{font-size:9px;color:#cbd5e1;text-transform:uppercase}.editor input{display:block;width:100%;height:32px;margin-top:3px;border:1px solid #475569;border-radius:5px;background:#1e293b;color:#fff;padding:0 8px;font-size:12px}.actions{grid-column:1/-1;display:flex;gap:8px;justify-content:flex-end}.actions button{border:0;border-radius:6px;padding:9px 14px;font-weight:700;cursor:pointer}.print{background:#06b6d4;color:#fff}.close{background:#334155;color:#fff}.copies{max-width:820px;margin:18px auto}.copy{background:#fff;padding:26px 30px;margin-bottom:16px;border:1px solid #cbd5e1;box-shadow:0 8px 24px rgba(15,23,42,.08);page-break-inside:avoid}.copy-label{display:inline-block;padding:4px 9px;border-radius:999px;background:#e0f2fe;color:#0369a1;font-size:10px;font-weight:800;letter-spacing:.08em}.brand{display:flex;justify-content:space-between;gap:20px;border-bottom:3px solid #0891b2;padding:13px 0}.brand h1{margin:0;font-size:24px}.brand p{margin:3px 0 0;color:#64748b;font-size:11px}.receipt-title{text-align:right;color:#0e7490;font-size:10px;font-weight:800}.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px 28px;margin:18px 0}.label{font-size:9px;color:#64748b;text-transform:uppercase}.value{margin-top:3px;font-size:12px;font-weight:600}.bank{padding:10px 12px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:7px;font-size:10px}.payment{margin-top:15px;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden}.row{display:flex;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:11px}.row:last-child{border-bottom:0}.highlight{background:#ecfeff;font-weight:800}.status{display:inline-block;margin-top:12px;padding:5px 10px;border-radius:999px;background:#e0f2fe;color:#0369a1;font-size:10px;font-weight:800}.footer{margin-top:17px;border-top:1px solid #e2e8f0;padding-top:9px;color:#64748b;font-size:9px}@media(max-width:760px){.editor{grid-template-columns:1fr 1fr}.copies{margin:10px}.copy{padding:20px}.meta{grid-template-columns:1fr}}@media print{body{background:#fff}.editor{display:none}.copies{max-width:none;margin:0}.copy{box-shadow:none;margin:0 0 10mm;padding:20px 24px}.copy+.copy{page-break-before:always}}
</style></head>
<body>
<section class="editor">
<label>Academy Name<input id="academyName" value="${escapeHtml(initial.academyName)}"></label>
<label>Student Name<input id="studentName" value="${escapeHtml(initial.studentName)}"></label>
<label>Father Name<input id="fatherName" value="${escapeHtml(initial.fatherName)}"></label>
<label>Contact 1<input id="phone" value="${escapeHtml(initial.phone)}"></label>
<label>Contact 2<input id="phone2" value="${escapeHtml(initial.phone2)}"></label>
<label>Course / Class<input id="course" value="${escapeHtml(initial.course)}"></label>
<label>Account Name<input id="bankName" value="${escapeHtml(initial.bankName)}"></label>
<label>Account Number<input id="bankNumber" value="${escapeHtml(initial.bankNumber)}"></label>
<label>Admission Fee<input id="admissionFee" type="number" value="${escapeHtml(initial.admissionFee)}"></label>
<label>Monthly Fee<input id="monthlyFee" type="number" value="${escapeHtml(initial.monthlyFee)}"></label>
<label>This Payment<input id="amount" type="number" value="${escapeHtml(initial.amount)}"></label>
<label>Payment Status<input id="status" value="${escapeHtml(initial.status)}"></label>
<div class="actions"><button class="print" onclick="window.print()">Print Both Copies</button><button class="close" onclick="window.close()">Close</button></div>
</section>
<main class="copies" id="copies"></main>
<script>
const data=${JSON.stringify(initial)};
const ids=["academyName","studentName","fatherName","phone","phone2","course","bankName","bankNumber","admissionFee","monthlyFee","amount","status"];
const v=id=>document.getElementById(id).value;
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]||c));
const num=id=>Math.max(0,Number(v(id)||0));
function money(n){return ${JSON.stringify(currencyLabel)}+" "+Math.round(n||0).toLocaleString()}
function makeCopy(label){
 const amount=num("amount"), admission=num("admissionFee"), monthly=num("monthlyFee");
 const prevPaid=Number(data.previousPaid||0), prevBal=Number(data.previousBalance||0);
 const newPaid=prevPaid+amount, newBal=Math.max(0,prevBal-amount);
 return '<section class="copy"><div class="copy-label">'+label+'</div>'+
 '<header class="brand"><div><h1>'+esc(v("academyName"))+'</h1><p>Student &amp; Fee Management</p></div><div class="receipt-title">FEE RECEIPT<br><span>'+esc(data.receiptNo)+'</span></div></header>'+
 '<section class="meta"><div><div class="label">Student Name</div><div class="value">'+esc(v("studentName"))+'</div></div>'+
 '<div><div class="label">Father Name</div><div class="value">'+esc(v("fatherName")||"Not provided")+'</div></div>'+
 '<div><div class="label">Contact No. 1</div><div class="value">'+esc(v("phone")||"Not provided")+'</div></div>'+
 '<div><div class="label">Contact No. 2</div><div class="value">'+esc(v("phone2")||"Not provided")+'</div></div>'+
 '<div><div class="label">Course / Class</div><div class="value">'+esc(v("course")||"Not specified")+'</div></div>'+
 '<div><div class="label">Payment Date / Time</div><div class="value">'+esc(data.date)+' · '+esc(data.time)+'</div></div></section>'+
 '<div class="bank"><strong>Account Name:</strong> '+esc(v("bankName")||"—")+' &nbsp; | &nbsp; <strong>Account No:</strong> '+esc(v("bankNumber")||"—")+'</div>'+
 '<section class="payment"><div class="row"><span>Admission Fee (One-time)</span><strong>'+money(admission)+'</strong></div>'+
 '<div class="row"><span>Monthly Fee</span><strong>'+money(monthly)+'</strong></div>'+
 '<div class="row"><span>Payment Type '+(data.monthLabel?"· "+esc(data.monthLabel):"")+'</span><strong>'+esc(data.paymentType)+'</strong></div>'+
 '<div class="row"><span>This Payment</span><strong>'+money(amount)+'</strong></div>'+
 '<div class="row"><span>Previous Paid</span><strong>'+money(prevPaid)+'</strong></div>'+
 '<div class="row"><span>Previous Balance</span><strong>'+money(prevBal)+'</strong></div>'+
 '<div class="row"><span>New Total Paid</span><strong>'+money(newPaid)+'</strong></div>'+
 '<div class="row highlight"><span>New Remaining Balance</span><strong>'+money(newBal)+'</strong></div></section>'+
 '<div class="status">Payment Status: '+esc(v("status"))+'</div>'+
 '<footer class="footer">Recorded by '+esc(data.recordedBy)+' · Academic Session '+esc(data.session)+'</footer></section>';
}
function render(){document.getElementById("copies").innerHTML=makeCopy("ACADEMY / CAMPUS COPY")+'<div style="text-align:center;color:#64748b;font-size:9px;border-top:1px dashed #94a3b8;padding:5px">✂ Cut here after printing</div>'+makeCopy("STUDENT COPY")}
ids.forEach(id=>document.getElementById(id).addEventListener("input",render)); render();
</script></body></html>`);
  receiptWindow.document.close();
}
