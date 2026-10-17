/* =========================================================
   VALYUTA KONVERTORI — asosiy JavaScript kodi
   ========================================================= */

/* 1. Valyutalar ro‘yxati va zaxira kurslar */
const currencies = {
    USD: { name: "AQSh dollari", symbol: "$" },
    UZS: { name: "O‘zbek so‘mi", symbol: "so'm" },
    EUR: { name: "Yevro", symbol: "€" },
    RUB: { name: "Rossiya rubli", symbol: "₽" },
    GBP: { name: "Angliya funti", symbol: "£" }
};

// Zaxira kurslar (1 USD ga nisbatan)
const fallbackRates = {
    USD: 1,
    UZS: 12650,
    EUR: 0.92,
    RUB: 92.5,
    GBP: 0.79
};

/* 2. DOM elementlarini olish */
const amountInput      = document.getElementById("amount");
const fromSelect       = document.getElementById("fromCurrency");
const toSelect         = document.getElementById("toCurrency");
const swapBtn          = document.getElementById("swapBtn");
const convertBtn       = document.getElementById("convertBtn");
const clearBtn         = document.getElementById("clearBtn");
const resultText       = document.getElementById("resultText");
const rateText         = document.getElementById("rateText");
const errorMsg         = document.getElementById("errorMsg");
const updatedTime      = document.getElementById("updatedTime");
const historyList      = document.getElementById("historyList");
const clearHistoryBtn  = document.getElementById("clearHistoryBtn");

/* 3. Global o‘zgaruvchilar */
let currentRates = { ...fallbackRates };
let lastUpdated  = null;

/* 4. Valyuta selectlarini to‘ldirish */
function fillCurrencyOptions() {
    for (const code in currencies) {
        const opt1 = document.createElement("option");
        opt1.value = code;
        opt1.textContent = `${code} — ${currencies[code].name}`;
        fromSelect.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = code;
        opt2.textContent = `${code} — ${currencies[code].name}`;
        toSelect.appendChild(opt2);
    }
}

/* 5. Saqlangan ma’lumotlarni yuklash */
function loadSavedData() {
    const savedFrom = localStorage.getItem("fromCurrency") || "USD";
    const savedTo   = localStorage.getItem("toCurrency")   || "UZS";
    const savedAmt  = localStorage.getItem("amount")       || "1";

    fromSelect.value = savedFrom;
    toSelect.value   = savedTo;
    amountInput.value = savedAmt;

    const savedHistory = JSON.parse(localStorage.getItem("history") || "[]");
    savedHistory.forEach(item => addHistoryItem(item, false));
}

/* 6. Real kurslarni olish (bepul API) */
async function fetchRates() {
    try {
        const response = await fetch("https://open.er-api.com/v6/latest/USD");
        if (!response.ok) throw new Error("API javob bermadi");

        const data = await response.json();
        if (data.result !== "success") throw new Error("API xatoligi");

        const newRates = {};
        for (const code in currencies) {
            newRates[code] = data.rates[code] !== undefined
                ? data.rates[code]
                : fallbackRates[code];
        }

        currentRates = newRates;
        lastUpdated  = new Date();
        updatedTime.textContent =
            "Kurs yangilandi: " + lastUpdated.toLocaleString("uz-UZ");

    } catch (err) {
        console.warn("Real kurs olinmadi, zaxira kurslar ishlatiladi:", err.message);
        currentRates = { ...fallbackRates };
        updatedTime.textContent =
            "⚠️ Real kurs olinmadi. Namunaviy kurslardan foydalanilmoqda.";
    }
}

/* 7. Konvertatsiya funksiyasi */
function convert() {
    errorMsg.textContent = "";

    const amount = parseFloat(amountInput.value);
    const from   = fromSelect.value;
    const to     = toSelect.value;

    if (isNaN(amount) || amount <= 0) {
        errorMsg.textContent = "❗ Iltimos, to‘g‘ri miqdor kiriting (0 dan katta son).";
        resultText.textContent = "Natija: --";
        rateText.textContent = "Kurs: --";
        return;
    }

    if (!currentRates[from] || !currentRates[to]) {
        errorMsg.textContent = "❗ Valyuta kursi topilmadi.";
        return;
    }

    const amountInUSD = amount / currentRates[from];
    const converted   = amountInUSD * currentRates[to];
    const unitRate    = currentRates[to] / currentRates[from];

    resultText.textContent =
        `${amount} ${from} = ${formatNumber(converted)} ${to}`;
    rateText.textContent =
        `1 ${from} = ${formatNumber(unitRate, 4)} ${to}`;

    const historyItem = {
        from, to, amount,
        converted: formatNumber(converted),
        time: new Date().toLocaleString("uz-UZ")
    };
    addHistoryItem(historyItem, true);
    saveSettings();
}

/* 8. Sonlarni chiroyli formatlash */
function formatNumber(num, decimals = 2) {
    return num.toLocaleString("uz-UZ", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/* 9. Tarix elementini qo‘shish */
function addHistoryItem(item, save = true) {
    const li = document.createElement("li");
    li.innerHTML = `
        <div>${item.amount} ${item.from} → ${item.converted} ${item.to}</div>
        <span>${item.time}</span>
    `;
    historyList.prepend(li);

    if (save) {
        const saved = JSON.parse(localStorage.getItem("history") || "[]");
        saved.unshift(item);
        localStorage.setItem("history", JSON.stringify(saved.slice(0, 10)));
    }

    while (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
}

/* 10. Sozlamalarni saqlash */
function saveSettings() {
    localStorage.setItem("fromCurrency", fromSelect.value);
    localStorage.setItem("toCurrency",   toSelect.value);
    localStorage.setItem("amount",       amountInput.value);
}

/* 11. Valyutalarni almashtirish */
function swapCurrencies() {
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    saveSettings();

    if (resultText.textContent !== "Natija: --") {
        convert();
    }
}

/* 12. Tozalash */
function clearInputs() {
    amountInput.value = "";
    resultText.textContent = "Natija: --";
    rateText.textContent   = "Kurs: --";
    errorMsg.textContent   = "";
    amountInput.focus();
}

/* 13. Tarixni tozalash */
function clearHistory() {
    historyList.innerHTML = "";
    localStorage.removeItem("history");
}

/* 14. Hodisalarni ulash */
function attachEvents() {
    convertBtn.addEventListener("click", convert);
    swapBtn.addEventListener("click", swapCurrencies);
    clearBtn.addEventListener("click", clearInputs);
    clearHistoryBtn.addEventListener("click", clearHistory);

    amountInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") convert();
    });

    fromSelect.addEventListener("change", saveSettings);
    toSelect.addEventListener("change", saveSettings);
}

/* 15. Ishga tushirish */
async function init() {
    fillCurrencyOptions();
    loadSavedData();
    attachEvents();
    await fetchRates();

    if (parseFloat(amountInput.value) > 0) convert();
}

document.addEventListener("DOMContentLoaded", init);
