class Calculator {
    constructor(displayElement, historyListElement) {
        this.displayElement = displayElement;
        this.historyListElement = historyListElement;
        this.expression = '';
        this.result = '';
        this.locale = 'en';
        this.history = [];
        this.updateDisplay();
    }
    
    setLocale(lang) {
        this.locale = lang;
        this.updateDisplay();
        this.renderHistory(); 
    }

    toHindi(str) {
        if (!str) return '';
        const hindiDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
        return str.toString().replace(/[0-9]/g, w => hindiDigits[+w]);
    }
    
    formatForDisplay(str) {
        if (!str) return '0';
        if (this.locale === 'hi') {
            return this.toHindi(str);
        }
        return str;
    }

    clear() {
        this.expression = '';
        this.result = '';
        this.updateDisplay();
    }
    
    clearHistory() {
        this.history = [];
        this.renderHistory();
    }

    addToHistory(exp, res) {
        if (!exp || !res || exp === res) return;
        this.history.unshift({ expression: exp, result: res });
        if (this.history.length > 20) this.history.pop();
        this.renderHistory();
    }

    renderHistory() {
        this.historyListElement.innerHTML = '';
        if (this.history.length === 0) {
            this.historyListElement.innerHTML = `<div class="text-center text-sm mt-10 opacity-50 italic" style="color: var(--text-secondary)">No history yet</div>`;
            return;
        }
        this.history.forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item p-3 flex flex-col items-end cursor-pointer hover:bg-white/5 transition-colors';
            const expDisplay = this.formatForDisplay(item.expression);
            const resDisplay = this.formatForDisplay(item.result);
            el.innerHTML = `
                <div class="text-xs opacity-70 mb-1" style="color: var(--text-secondary)">${expDisplay} =</div>
                <div class="text-lg font-medium" style="color: var(--text-primary)">${resDisplay}</div>
            `;
            el.addEventListener('click', () => {
                this.expression = item.result;
                this.updateDisplay();
                document.getElementById('history-toggle').click();
            });
            this.historyListElement.appendChild(el);
        });
    }

    delete() {
        const funcs = ["sin(", "cos(", "tan(", "log(", "sqrt(", "ln("];
        let matched = false;
        for (let f of funcs) {
            if (this.expression.endsWith(f)) {
                this.expression = this.expression.slice(0, -f.length);
                matched = true;
                break;
            }
        }
        if (!matched) {
            this.expression = this.expression.slice(0, -1);
        }
        this.updateDisplay();
    }

    append(val) {
        this.expression += val;
        this.updateDisplay();
    }

    bracket() {
        const openCount = (this.expression.match(/\(/g) || []).length;
        const closeCount = (this.expression.match(/\)/g) || []).length;
        const lastChar = this.expression.slice(-1);
        const isNum = /[0-9.)]/.test(lastChar);
        if (openCount > closeCount && isNum) {
            this.append(')');
        } else {
            this.append('(');
        }
    }

    compute() {
        try {
            let originalExpression = this.expression;
            let evalString = this.expression;

            // Fix: Implicit multiplication for Pi, e, Root, and Brackets
            // Inserts * between a digit and (π, e, √, or open parenthesis)
            evalString = evalString.replace(/(\d)(?=[πe√\(])/g, '$1*');
            // Inserts * between a closing parenthesis and (π, e, √, or open parenthesis)
            evalString = evalString.replace(/(\))(?=[πe√\(])/g, '$1*');

            // Standard replacements
            evalString = evalString.replace(/×/g, '*');
            evalString = evalString.replace(/÷/g, '/');
            evalString = evalString.replace(/−/g, '-');
            evalString = evalString.replace(/π/g, 'Math.PI');
            evalString = evalString.replace(/e/g, 'Math.E');
            
            // Fix: Square Root Replacement
            evalString = evalString.replace(/√/g, 'sqrt'); 
            
            evalString = evalString.replace(/\^/g, '**');
            evalString = evalString.replace(/%/g, '/100');

            const toRad = (deg) => deg * Math.PI / 180;
            const sin = (val) => Math.sin(toRad(val));
            const cos = (val) => Math.cos(toRad(val));
            const tan = (val) => Math.tan(toRad(val));
            const log = (val) => Math.log10(val);
            const ln = (val) => Math.log(val);
            const sqrt = (val) => Math.sqrt(val);

            const computeFunc = new Function(
                'sin', 'cos', 'tan', 'log', 'ln', 'sqrt',
                'return ' + evalString
            );

            let res = computeFunc(sin, cos, tan, log, ln, sqrt);
            res = Math.round(res * 1000000000) / 1000000000;
            
            this.result = res.toString();
            this.addToHistory(originalExpression, this.result);
            this.expression = this.result;
            this.updateDisplay();

        } catch (e) {
            this.expression = "Error";
            this.updateDisplay();
        }
    }

    updateDisplay() {
        if (this.locale === 'hi') {
            this.displayElement.classList.add('font-hindi');
        } else {
            this.displayElement.classList.remove('font-hindi');
        }
        this.displayElement.innerText = this.formatForDisplay(this.expression || '0');
    }
}

const currentOperandTextElement = document.getElementById('current-operand');
const historyListElement = document.getElementById('history-list');
const calculator = new Calculator(currentOperandTextElement, historyListElement);

document.querySelectorAll('button[data-val]').forEach(btn => {
    btn.addEventListener('click', () => {
        calculator.append(btn.getAttribute('data-val'));
    });
});

document.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        if (action === 'clear') calculator.clear();
        if (action === 'delete') calculator.delete();
        if (action === 'equals') calculator.compute();
        if (action === 'bracket') calculator.bracket();
    });
});

const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const body = document.body;
const savedTheme = localStorage.getItem('calculator-theme') || 'dark';
setTheme(savedTheme);

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
});

function setTheme(theme) {
    body.setAttribute('data-theme', theme);
    localStorage.setItem('calculator-theme', theme);
    if (theme === 'dark') {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
}

const langToggleBtn = document.getElementById('lang-toggle');
let currentLang = 'en';
const hindiDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const numButtons = document.querySelectorAll('[data-type="num"]');

langToggleBtn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'hi' : 'en';
    const langIconSpan = langToggleBtn.querySelector('span');
    
    if (currentLang === 'hi') {
        langIconSpan.innerText = 'EN';
        langIconSpan.classList.remove('font-hindi');
        body.classList.add('font-hindi'); 
    } else {
        langIconSpan.innerText = 'अ';
        langIconSpan.classList.add('font-hindi');
        body.classList.remove('font-hindi');
    }
    calculator.setLocale(currentLang);
    numButtons.forEach(btn => {
        const val = btn.getAttribute('data-val');
        if (val === '.') return;
        btn.innerText = currentLang === 'hi' ? hindiDigits[parseInt(val)] : englishDigits[parseInt(val)];
        if (currentLang === 'hi') btn.classList.add('font-hindi');
        else btn.classList.remove('font-hindi');
    });
});

const sciToggleBtn = document.getElementById('sci-toggle');
const sciIcon = document.getElementById('sci-icon'); 
const sciText = document.getElementById('sci-text');
const calculatorFrame = document.getElementById('calculator-frame');
const keypad = document.getElementById('keypad');
let isSciMode = false;

sciToggleBtn.addEventListener('click', () => {
    isSciMode = !isSciMode;
    if (isSciMode) {
        calculatorFrame.classList.remove('sci-hidden');
        calculatorFrame.style.maxWidth = "440px";
        keypad.classList.remove('grid-cols-4');
        keypad.classList.add('grid-cols-5');
        sciToggleBtn.style.width = '100px'; 
        sciToggleBtn.style.borderRadius = '9999px'; 
        sciToggleBtn.style.backgroundColor = 'var(--back-btn-bg)';
        sciToggleBtn.style.color = 'var(--back-btn-text)';
        sciIcon.classList.remove('fa-flask');
        sciIcon.classList.add('fa-chevron-left');
        sciText.classList.remove('opacity-0', 'w-0');
        sciText.classList.add('opacity-100', 'w-auto');
    } else {
        calculatorFrame.classList.add('sci-hidden');
        calculatorFrame.style.maxWidth = "360px";
        keypad.classList.remove('grid-cols-5');
        keypad.classList.add('grid-cols-4');
        sciToggleBtn.style.width = '2.5rem'; 
        sciToggleBtn.style.backgroundColor = 'var(--btn-bg)';
        sciToggleBtn.style.color = 'var(--sci-icon)';
        sciIcon.classList.remove('fa-chevron-left');
        sciIcon.classList.add('fa-flask');
        sciText.classList.remove('opacity-100', 'w-auto');
        sciText.classList.add('opacity-0', 'w-0');
    }
});

const historyToggleBtn = document.getElementById('history-toggle');
const historyView = document.getElementById('history-view');
const clearHistoryBtn = document.getElementById('clear-history');
let isHistoryOpen = false;

historyToggleBtn.addEventListener('click', () => {
    isHistoryOpen = !isHistoryOpen;
    if(isHistoryOpen) {
        historyView.classList.remove('translate-y-full');
        historyToggleBtn.style.backgroundColor = 'var(--history-icon)';
        historyToggleBtn.querySelector('i').style.color = 'white';
    } else {
        historyView.classList.add('translate-y-full');
        historyToggleBtn.style.backgroundColor = 'var(--btn-bg)';
        historyToggleBtn.querySelector('i').style.color = 'var(--history-icon)';
    }
});

clearHistoryBtn.addEventListener('click', () => {
    calculator.clearHistory();
});

document.addEventListener('keydown', (e) => {
    const key = e.key;
    if ((key >= '0' && key <= '9') || key === '.') calculator.append(key);
    if (key === '+' || key === '-') calculator.append(key);
    if (key === '*') calculator.append('×');
    if (key === '/') { e.preventDefault(); calculator.append('÷'); }
    if (key === '(' || key === ')') calculator.append(key);
    if (key === 'Enter' || key === '=') { e.preventDefault(); calculator.compute(); }
    if (key === 'Backspace') calculator.delete();
    if (key === 'Escape') calculator.clear();
});