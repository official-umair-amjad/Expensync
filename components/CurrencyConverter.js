// components/CurrencyConverter.js
"use client";
import { useState, useEffect } from 'react';

export default function CurrencyConverter({ totalAmount }) {
  const [currency, setCurrency] = useState('USD');
  const [rate, setRate] = useState(1);

  useEffect(() => {
    async function fetchRate() {
      const res = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${process.env.NEXT_PUBLIC_OER_APP_ID}`);
      const data = await res.json();
      if (data && data.rates && data.rates[currency]) {
        setRate(data.rates[currency]);
      }
    }
    fetchRate();
  }, [currency]);

  const converted = totalAmount * rate;

  return (
    <div>
      <select value={currency} onChange={e => setCurrency(e.target.value)}>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        {/* Add more currencies as needed */}
      </select>
      <p>Total: {converted.toFixed(2)} {currency}</p>
    </div>
  );
}
