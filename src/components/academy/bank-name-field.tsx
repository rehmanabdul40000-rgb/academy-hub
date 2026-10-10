import { useEffect, useState } from "react";

const BANKS = [
  "Meezan Bank",
  "Habib Bank Limited (HBL)",
  "United Bank Limited (UBL)",
  "MCB Bank",
  "Allied Bank",
  "Bank Alfalah",
  "Askari Bank",
  "Faysal Bank",
  "Bank AL Habib",
  "National Bank of Pakistan (NBP)",
  "The Bank of Punjab (BOP)",
  "Habib Metropolitan Bank",
  "Standard Chartered Bank",
  "BankIslami",
  "Dubai Islamic Bank",
  "Soneri Bank",
  "JS Bank",
  "Sindh Bank",
  "First Women Bank",
  "Zarai Taraqiati Bank",
  "Mobilink Microfinance Bank",
  "U Microfinance Bank",
  "JazzCash",
  "Easypaisa",
  "SadaPay",
  "NayaPay",
  "UPaisa",
];

const OTHER = "__other__";
const isKnownBank = (value: string) => BANKS.includes(value);

export function BankNameField({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className: string;
}) {
  const [choice, setChoice] = useState(() =>
    isKnownBank(value) ? value : value ? OTHER : "",
  );

  useEffect(() => {
    if (isKnownBank(value)) {
      setChoice(value);
    } else if (value) {
      setChoice(OTHER);
    } else {
      setChoice((current) => (current === OTHER ? OTHER : ""));
    }
  }, [value]);

  function handleChoice(next: string) {
    setChoice(next);
    if (next !== OTHER) onChange(next);
    else if (isKnownBank(value)) onChange("");
  }

  return (
    <div className="space-y-2">
      <select
        value={choice}
        onChange={(event) => handleChoice(event.target.value)}
        className={className}
        aria-label="Select bank or payment wallet"
      >
        <option value="">Select bank / wallet</option>
        {BANKS.map((bank) => (
          <option key={bank} value={bank}>{bank}</option>
        ))}
        <option value={OTHER}>Other bank / wallet (type manually)</option>
      </select>
      {choice === OTHER && (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter bank or wallet name"
          className={className}
          aria-label="Custom bank or wallet name"
        />
      )}
    </div>
  );
}
