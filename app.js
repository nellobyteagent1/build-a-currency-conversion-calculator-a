const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'EUR', name: 'Euro', flag: '\u{1F1EA}\u{1F1FA}' },
  { code: 'GBP', name: 'British Pound', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'JPY', name: 'Japanese Yen', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'INR', name: 'Indian Rupee', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'AUD', name: 'Australian Dollar', flag: '\u{1F1E6}\u{1F1FA}' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '\u{1F1E8}\u{1F1E6}' },
  { code: 'CHF', name: 'Swiss Franc', flag: '\u{1F1E8}\u{1F1ED}' },
  { code: 'NZD', name: 'New Zealand Dollar', flag: '\u{1F1F3}\u{1F1FF}' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '\u{1F1F8}\u{1F1EC}' },
  { code: 'HKD', name: 'Hong Kong Dollar', flag: '\u{1F1ED}\u{1F1F0}' },
  { code: 'KRW', name: 'South Korean Won', flag: '\u{1F1F0}\u{1F1F7}' },
  { code: 'MXN', name: 'Mexican Peso', flag: '\u{1F1F2}\u{1F1FD}' },
  { code: 'BRL', name: 'Brazilian Real', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: 'ZAR', name: 'South African Rand', flag: '\u{1F1FF}\u{1F1E6}' },
  { code: 'SEK', name: 'Swedish Krona', flag: '\u{1F1F8}\u{1F1EA}' },
  { code: 'NOK', name: 'Norwegian Krone', flag: '\u{1F1F3}\u{1F1F4}' },
  { code: 'DKK', name: 'Danish Krone', flag: '\u{1F1E9}\u{1F1F0}' },
  { code: 'PLN', name: 'Polish Zloty', flag: '\u{1F1F5}\u{1F1F1}' },
  { code: 'THB', name: 'Thai Baht', flag: '\u{1F1F9}\u{1F1ED}' },
  { code: 'IDR', name: 'Indonesian Rupiah', flag: '\u{1F1EE}\u{1F1E9}' },
  { code: 'MYR', name: 'Malaysian Ringgit', flag: '\u{1F1F2}\u{1F1FE}' },
  { code: 'PHP', name: 'Philippine Peso', flag: '\u{1F1F5}\u{1F1ED}' },
  { code: 'TWD', name: 'Taiwan Dollar', flag: '\u{1F1F9}\u{1F1FC}' },
  { code: 'AED', name: 'UAE Dirham', flag: '\u{1F1E6}\u{1F1EA}' },
  { code: 'SAR', name: 'Saudi Riyal', flag: '\u{1F1F8}\u{1F1E6}' },
  { code: 'NGN', name: 'Nigerian Naira', flag: '\u{1F1F3}\u{1F1EC}' },
  { code: 'KES', name: 'Kenyan Shilling', flag: '\u{1F1F0}\u{1F1EA}' },
  { code: 'GHS', name: 'Ghanaian Cedi', flag: '\u{1F1EC}\u{1F1ED}' }
];

const API_BASE = 'https://open.er-api.com/v6/latest';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const rateCache = {};

const $ = id => document.getElementById(id);
const fromSelect = $('fromCurrency');
const toSelect = $('toCurrency');
const amountInput = $('amount');
const convertBtn = $('convertBtn');
const swapBtn = $('swapBtn');
const loading = $('loading');
const resultBox = $('resultBox');
const resultAmount = $('resultAmount');
const resultRate = $('resultRate');
const resultTime = $('resultTime');
const errorBox = $('errorBox');

function populateSelects() {
  CURRENCIES.forEach(c => {
    const opt1 = new Option(`${c.flag} ${c.code} - ${c.name}`, c.code);
    const opt2 = new Option(`${c.flag} ${c.code} - ${c.name}`, c.code);
    fromSelect.add(opt1);
    toSelect.add(opt2);
  });
  fromSelect.value = 'USD';
  toSelect.value = 'EUR';
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.add('show');
  resultBox.classList.remove('show');
}

function hideError() {
  errorBox.classList.remove('show');
}

function showLoading(show) {
  loading.classList.toggle('show', show);
  convertBtn.disabled = show;
}

function formatNumber(num, code) {
  const decimals = ['JPY', 'KRW', 'IDR', 'VND'].includes(code) ? 0 : 2;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

async function fetchRates(base) {
  const cached = rateCache[base];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rates;
  }
  const res = await fetch(`${API_BASE}/${base}`);
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  const data = await res.json();
  if (data.result !== 'success') throw new Error(data['error-type'] || 'Unknown API error');
  rateCache[base] = { rates: data.rates, timestamp: Date.now() };
  return data.rates;
}

async function convert() {
  hideError();
  const amount = parseFloat(amountInput.value);
  if (isNaN(amount) || amount < 0) {
    showError('Please enter a valid positive number.');
    return;
  }
  const from = fromSelect.value;
  const to = toSelect.value;

  showLoading(true);
  resultBox.classList.remove('show');

  try {
    const rates = await fetchRates(from);
    const rate = rates[to];
    if (!rate) throw new Error(`Rate for ${to} not available.`);
    const converted = amount * rate;

    resultAmount.textContent = `${formatNumber(amount, from)} ${from} = ${formatNumber(converted, to)} ${to}`;
    resultRate.textContent = `1 ${from} = ${formatNumber(rate, to)} ${to}`;
    resultTime.textContent = `Updated ${new Date().toLocaleTimeString()}`;
    resultBox.classList.add('show');
  } catch (err) {
    showError(err.message === 'Failed to fetch'
      ? 'Could not reach exchange rate service. Check your internet connection.'
      : `Error: ${err.message}`);
  } finally {
    showLoading(false);
  }
}

swapBtn.addEventListener('click', () => {
  const tmp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = tmp;
  if (resultBox.classList.contains('show')) convert();
});

convertBtn.addEventListener('click', convert);
amountInput.addEventListener('keydown', e => { if (e.key === 'Enter') convert(); });

populateSelects();
convert(); // auto-convert on load
