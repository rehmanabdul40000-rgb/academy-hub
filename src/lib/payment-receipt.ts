import { formatCurrencyWithLabel, getSettings } from "@/features/settings/settings.storage";
import type { PaymentRecord, Student } from "@/types/student";
import { getStudentById } from "@/features/students/students.storage";

function escapeHtml(value: string): string {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
    return entities[character] || character;
  });
}

export function printPaymentReceipt(student: Student, payment: PaymentRecord): void {
  if (typeof window === "undefined") return;
  // Always build the receipt from the latest saved student/payment, not the stale object
  // captured when the payment-history modal first rendered.
  const latestStudent = getStudentById(student.createdAt) || student;
  const latestPayment =
    latestStudent.payments?.find((item) => item.id === payment.id) ||
    latestStudent.payments?.find((item) =>
      item.feeType === payment.feeType && item.monthKey === payment.monthKey
    ) ||
    payment;
  student = latestStudent;
  payment = latestPayment;

  const settings = getSettings();
  const currencyLabel = settings.currencyLabel || "Rs";
  const money = (amount: number) => formatCurrencyWithLabel(amount, currencyLabel);
  const monthLabel = payment.monthKey
    ? new Date(Number(payment.monthKey.slice(0, 4)), Number(payment.monthKey.slice(5, 7)) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  // Each receipt gets its own window so one student's editor can never retain another student's form state.
  const receiptWindow = window.open("", "_blank", "width=900,height=1000");
  if (!receiptWindow) return;

  const initial = {
    academyName: settings.academyName?.trim() || "Academy Hub",
    campus: settings.campusName?.trim() || "",
    studentName: student.name || "",
    fatherName: student.fatherName || "",
    section: student.shift || "",
    className: student.course || "",
    phone1: student.phone || "",
    phone2: student.phone2 || "",
    bankName: settings.bankName?.trim() || "",
    accountName: settings.bankAccountName?.trim() || "",
    accountNumber: settings.bankAccountNumber?.trim() || "",
    receiptNo: payment.id,
    date: payment.paymentDate,
    time: payment.paymentTime,
    admissionFee: String(student.admissionFee || 0),
    testCharges: "0",
    monthlyFee: String(student.monthlyFee || 0),
    acDues: "0",
    amountReceived: String(payment.amount || 0),
    previousBalance: String(payment.previousRemaining || 0),
    balance: String(payment.newRemaining || 0),
    lastDate: "",
    lateFee: "0",
    note: payment.note || (monthLabel ? `${monthLabel} fee payment` : ""),
    status: payment.newRemaining === 0 ? "Paid" : payment.amount > 0 ? "Partial" : "Pending",
  };

  // Reusing the named receipt window is intentional, but its old document must be cleared first.
  receiptWindow.document.open();
  receiptWindow.document.write(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>Fee Receipt - ${escapeHtml(initial.studentName)}</title>
<style>
*{box-sizing:border-box}
@page{size:A4 landscape;margin:5mm}
body{margin:0;background:#eef2f7;color:#172033;font-family:"Segoe UI",Arial,sans-serif}
.toolbar{position:sticky;top:0;z-index:20;background:#0f172a;color:#fff;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px}
.toolbar .hint{font-size:11px;color:#cbd5e1}.toolbar button{border:0;border-radius:6px;padding:8px 12px;font-weight:700;cursor:pointer}.editBtn{background:#334155;color:#fff}.printBtn{background:#06b6d4;color:#fff}
.sheet{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0;max-width:1120px;margin:14px auto}.copy{min-width:0;background:#fff;border:1px solid #9ca3af;margin:0;padding:10px 11px;page-break-inside:avoid;break-inside:avoid}.copy:nth-of-type(2){border-left:0}.copyHead{display:flex;justify-content:space-between;gap:12px;border-bottom:2px solid #111827;padding-bottom:7px}.academy{font-size:20px;font-weight:800;text-transform:uppercase}.sub{font-size:10px;color:#475569;margin-top:3px}.copyTitle{text-align:right;font-size:10px;font-weight:800}.copyTitle b{display:block;font-size:15px;margin-bottom:3px}
.copyTag{font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;border:1px solid #64748b;padding:4px 7px;display:inline-block;margin-bottom:7px}
.info{margin-top:7px;border:1px solid #9ca3af}.infoGrid{display:grid;grid-template-columns:1.35fr 1.35fr 1fr 1fr}.cell{padding:6px 7px;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;min-height:33px}.cell:nth-child(4n){border-right:0}.cell:nth-last-child(-n+4){border-bottom:0}.label{font-size:8.5px;text-transform:uppercase;color:#475569}.value{font-size:11px;font-weight:700;margin-top:3px;min-height:13px}
.bank{margin-top:7px;border:1px solid #9ca3af;padding:6px 8px;font-size:9.5px;display:grid;grid-template-columns:1fr 1.2fr 1.4fr;gap:8px}.bank b{font-size:8.5px;color:#475569;text-transform:uppercase;display:block}
.fees{margin-top:8px;width:100%;border-collapse:collapse;font-size:9.5px}.fees th,.fees td{border:1px solid #9ca3af;padding:5px 6px}.fees th{background:#f1f5f9;text-transform:uppercase;font-size:8.5px}.fees td:nth-child(2),.fees td:nth-child(3){text-align:right;font-weight:700}.fees .total td{font-weight:800;background:#f8fafc}.fees .received td{font-weight:800;background:#ecfeff}
.bottom{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:7px;margin-top:6px}.smallBox{border:1px solid #9ca3af;padding:6px 8px;min-height:36px}.smallBox b{display:block;font-size:8.5px;color:#475569;text-transform:uppercase}.smallBox span{font-size:9.5px;font-weight:700}.note{margin-top:7px;border:1px solid #9ca3af;padding:6px 8px;font-size:9.5px;min-height:28px}.status{margin-top:7px;display:flex;justify-content:space-between;align-items:center;font-size:9.5px;font-weight:800}.statusBadge{border:1px solid #334155;padding:4px 9px}.sign{margin-top:9px;display:grid;grid-template-columns:1fr 1fr;gap:25px;font-size:8.5px;color:#475569}.line{border-top:1px solid #64748b;padding-top:3px;text-align:center}
.cut{position:absolute;z-index:2;left:50%;top:0;bottom:0;border-left:1px dashed #64748b;width:0;color:#64748b;font-size:7px;pointer-events:none}.cut span{position:absolute;top:50%;left:0;transform:translate(-50%,-50%) rotate(-90deg);white-space:nowrap;background:#fff;padding:3px 5px}
.modal{display:none;position:fixed;inset:0;z-index:50;background:rgba(15,23,42,.72);padding:18px;overflow:auto}.modalCard{max-width:780px;margin:0 auto;background:#fff;border-radius:10px;padding:16px;color:#0f172a}.modalHead{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #cbd5e1;padding-bottom:10px}.modalHead h2{font-size:15px;margin:0}.close{border:0;background:#e2e8f0;border-radius:6px;padding:7px 10px;cursor:pointer}.formGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:12px}.formGrid label{font-size:8px;text-transform:uppercase;color:#475569}.formGrid input,.formGrid textarea{display:block;width:100%;margin-top:3px;height:31px;border:1px solid #cbd5e1;border-radius:5px;padding:5px 7px;font-size:11px}.formGrid textarea{height:55px;resize:vertical}.modalActions{display:flex;justify-content:flex-end;gap:7px;margin-top:12px}.modalActions button{border:0;border-radius:6px;padding:8px 12px;font-weight:700;cursor:pointer}.saveEdit{background:#06b6d4;color:#fff}.cancelEdit{background:#e2e8f0;color:#0f172a}
@media(max-width:760px){.formGrid{grid-template-columns:1fr 1fr}.infoGrid{grid-template-columns:1fr 1fr}.cell:nth-child(4n){border-right:1px solid #cbd5e1}.bank,.bottom{grid-template-columns:1fr}.sheet{margin:8px;grid-template-columns:1fr}.copy:nth-of-type(2){border-left:1px solid #9ca3af}.cut{display:none}.copy{padding:10px}}
@media print{body{background:#fff}.toolbar{display:none}.sheet{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0;max-width:none;width:100%;margin:0}.copy{margin:0;padding:4mm 3.5mm;box-shadow:none;font-size:9px}.copy:nth-of-type(2){border-left:0}.cut{display:block}.modal{display:none!important}}
</style></head>
<body>
<div class="toolbar"><span class="hint">Receipt preview — edit the receipt before printing. Changes here affect the receipt print only.</span><div><button class="editBtn" onclick="openEditor()">Edit Receipt</button> <button class="printBtn" onclick="window.print()">Print Both Copies</button></div></div>
<div class="sheet" id="sheet"></div>

<div class="modal" id="editor">
  <div class="modalCard">
    <div class="modalHead"><h2>Edit Receipt Details</h2><button class="close" onclick="closeEditor()">Close</button></div>
    <div class="formGrid">
      <label>Academy Name<input id="academyName"></label><label>Campus<input id="campus"></label><label>Receipt / Sr. No.<input id="receiptNo"></label>
      <label>Student Name<input id="studentName"></label><label>Father Name<input id="fatherName"></label><label>Section<input id="section"></label>
      <label>Class / Course<input id="className"></label><label>Contact No. 1<input id="phone1"></label><label>Contact No. 2<input id="phone2"></label>
      <label>Bank Name<input id="bankName"></label><label>Account Name / Title<input id="accountName"></label><label>Account Number<input id="accountNumber"></label>
      <label>Date<input id="date"></label><label>Time<input id="time"></label><label>Admission Fee<input id="admissionFee" type="number"></label>
      <label>Test / Session Charges<input id="testCharges" type="number"></label><label>Monthly Fee<input id="monthlyFee" type="number"></label><label>AC Dues<input id="acDues" type="number"></label>
      <label>Amount Received<input id="amountReceived" type="number"></label><label>Previous Balance<input id="previousBalance" type="number"></label><label>Balance / Outstanding<input id="balance" type="number"></label>
      <label>Last Date of Fee Submission<input id="lastDate"></label><label>Late Fee<input id="lateFee" type="number"></label><label>Status<input id="status"></label>
      <label style="grid-column:1/-1">Note / Remarks<textarea id="note"></textarea></label>
    </div>
    <div class="modalActions"><button class="cancelEdit" onclick="closeEditor()">Cancel</button><button class="saveEdit" onclick="saveEditor()">Apply to Receipt</button></div>
  </div>
</div>

<script>
const data=${JSON.stringify(initial)};
const ids=["academyName","campus","studentName","fatherName","section","className","phone1","phone2","bankName","accountName","accountNumber","receiptNo","date","time","admissionFee","testCharges","monthlyFee","acDues","amountReceived","previousBalance","balance","lastDate","lateFee","note","status"];
const el=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]||c));
const val=id=>el(id).value;
const num=id=>Math.max(0,Number(val(id)||0));
const money=n=>${JSON.stringify(currencyLabel)}+" "+Math.round(Number(n)||0).toLocaleString();
function loadEditor(){ids.forEach(id=>{if(el(id)) el(id).value=data[id]??""})}
function openEditor(){loadEditor();el("editor").style.display="block"}
function closeEditor(){el("editor").style.display="none"}
function saveEditor(){ids.forEach(id=>{if(el(id)) data[id]=el(id).value});render();closeEditor()}
function amountForCopy(value, studentCopy, status){if(!studentCopy) return money(value); return status==="Paid" ? "PAID" : status==="Partial" ? "PARTIAL" : "PENDING"}
function makeCopy(label, studentCopy){
 const totalFee=num("admissionFee")+num("testCharges")+num("monthlyFee")+num("acDues");
 const balance=num("balance");
 const status=val("status");
 return '<section class="copy">'+
 '<div class="copyTag">'+label+'</div>'+
 '<header class="copyHead"><div><div class="academy">'+esc(val("academyName"))+'</div><div class="sub">Student &amp; Fee Management'+(val("campus")?" · Campus: "+esc(val("campus")):"")+'</div></div><div class="copyTitle"><b>FEE RECEIPT</b>Sr. No. '+esc(val("receiptNo"))+'</div></header>'+
 '<div class="info"><div class="infoGrid">'+
 '<div class="cell"><div class="label">Name</div><div class="value">'+esc(val("studentName"))+'</div></div>'+
 '<div class="cell"><div class="label">F.Name</div><div class="value">'+esc(val("fatherName"))+'</div></div>'+
 '<div class="cell"><div class="label">Section</div><div class="value">'+esc(val("section"))+'</div></div>'+
 '<div class="cell"><div class="label">Class</div><div class="value">'+esc(val("className"))+'</div></div>'+
 '<div class="cell"><div class="label">Contact No. 1</div><div class="value">'+esc(val("phone1"))+'</div></div>'+
 '<div class="cell"><div class="label">Contact No. 2</div><div class="value">'+esc(val("phone2"))+'</div></div>'+
 '<div class="cell"><div class="label">Date</div><div class="value">'+esc(val("date"))+'</div></div>'+
 '<div class="cell"><div class="label">Time</div><div class="value">'+esc(val("time"))+'</div></div>'+
 '</div></div>'+
 '<div class="bank"><div><b>Bank Name</b>'+esc(val("bankName")||"—")+'</div><div><b>Account Name / Title</b>'+esc(val("accountName")||"—")+'</div><div><b>Account Number</b>'+esc(val("accountNumber")||"—")+'</div></div>'+
 '<table class="fees"><thead><tr><th>Fee / Charges</th><th>Amount</th><th>Status / Detail</th></tr></thead><tbody>'+
 '<tr><td>Admission Fee</td><td>'+amountForCopy(num("admissionFee"),studentCopy,status)+'</td><td>'+ (studentCopy ? status.toUpperCase() : "Admission") +'</td></tr>'+
 '<tr><td>Test / Session Charges</td><td>'+amountForCopy(num("testCharges"),studentCopy,status)+'</td><td>'+ (studentCopy ? status.toUpperCase() : "—") +'</td></tr>'+
 '<tr><td>Total Fee</td><td>'+amountForCopy(totalFee,studentCopy,status)+'</td><td>'+ (studentCopy ? status.toUpperCase() : "Total") +'</td></tr>'+
 '<tr><td>Monthly Fee'+(val("section")?" · "+esc(val("section")):"")+'</td><td>'+amountForCopy(num("monthlyFee"),studentCopy,status)+'</td><td>'+ (studentCopy ? status.toUpperCase() : "Monthly") +'</td></tr>'+
 '<tr><td>AC Dues</td><td>'+amountForCopy(num("acDues"),studentCopy,status)+'</td><td>'+ (studentCopy ? "PAID" : "—") +'</td></tr>'+
 '<tr class="received"><td>Amount Received</td><td>'+ (studentCopy ? (status==="Paid" ? "PAID" : status==="Partial" ? "PARTIAL" : "PENDING") : money(num("amountReceived"))) +'</td><td>'+esc(val("status"))+'</td></tr>'+
 '<tr><td>Previous Balance</td><td>'+amountForCopy(num("previousBalance"),studentCopy,status)+'</td><td>'+ (studentCopy ? status.toUpperCase() : "Before payment") +'</td></tr>'+
 '<tr class="total"><td>Balance / Outstanding</td><td>'+ (studentCopy ? (status==="Paid" ? "PAID" : status==="Partial" ? "PARTIAL" : "PENDING") : money(balance)) +'</td><td>'+ (balance>0 ? "Outstanding" : "Cleared") +'</td></tr>'+
 '</tbody></table>'+
 '<div class="bottom"><div class="smallBox"><b>Last Date of Fee Submission</b><span>'+esc(val("lastDate")||"—")+'</span></div><div class="smallBox"><b>Late Fee</b><span>'+amountForCopy(num("lateFee"),studentCopy,status)+'</span></div><div class="smallBox"><b>Payment Date / Time</b><span>'+esc(val("date"))+' · '+esc(val("time"))+'</span></div></div>'+
 '<div class="note"><b>Note:</b> '+esc(val("note")||"—")+'</div>'+
 '<div class="status"><span>'+esc(val("academyName"))+' · '+(studentCopy ? "Student Copy" : "Academy / Campus Copy")+'</span><span class="statusBadge">'+esc(val("status"))+'</span></div>'+
 '<div class="sign"><div class="line">Received / Checked By</div><div class="line">Student / Parent Signature</div></div>'+
 '</section>';
}
function render(){el("sheet").innerHTML=makeCopy("STUDENT COPY",true)+'<div class="cut"><span>✂ CUT / SEPARATE HERE</span></div>'+makeCopy("ACADEMY / CAMPUS COPY",false)}
render();
</script></body></html>`);
  receiptWindow.document.close();
}
