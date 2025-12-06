/* =========================================
   1. GLOBAL VARIABLES & CONFIG
   ========================================= */
let currentCurrency = localStorage.getItem('appCurrency') || 'ILS';
let currentLang = localStorage.getItem('appLang') || 'he';
let pinCode = localStorage.getItem('appPin') || null;
let currentDate = new Date();
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let chartInstance = null;
let chartType = 'bar';
let postAlertAction = null;
let categorySortable = null;
let pendingAction = null;
let ratesData = {};
let shiftInterval;

// --- DATA INITIALIZATION ---
let appData = {
    categories: [
        { id: 1, name: 'מזון', emoji: '🍕', limit: 2000, items: [] }, 
        { id: 2, name: 'רכב', emoji: '🚗', limit: 800, items: [] }, 
        { id: 3, name: 'חשבונות', emoji: '🏠', limit: 1500, items: [] }
    ],
    goals: [], 
    bank: 0, 
    monthlySalaries: {}, 
    recurringSettings: [], 
    wishlist: [], 
    lastProcessedMonth: "", 
    lastLogin: Date.now(), 
    isPremium: false,
    settings: { theme: 'default', haptics: true, billingDay: 1 }
};

try {
    const stored = JSON.parse(localStorage.getItem('budgetUltimateDataV23'));
    if (stored) {
        appData = { ...appData, ...stored };
        if (!appData.recurringSettings) appData.recurringSettings = [];
        if (!appData.wishlist) appData.wishlist = [];
        if (!appData.settings) appData.settings = { theme: 'default', haptics: true, billingDay: 1 };
        
        appData.recurringSettings.forEach(rec => {
            if(!rec.type) { rec.type = 'fixed'; rec.remaining = 0; rec.totalPayments = 0; }
        });
    }
} catch (e) { console.error("Data Load Error", e); }

/* =========================================
   2. DICTIONARIES (TRANSLATIONS)
   ========================================= */
const translations = {
    he: {
        dir: 'rtl', locale: 'he-IL', remove_pin: "הסר קוד נעילה",
        app_title: "Neto", subtitle: "ניהול תקציב חכם ופשוט", daily_tip: "טיפ יומי", start_btn: "בואו נתחיל",
        menu_title: "תפריט", menu_home: "ראשי", menu_timer: "שעון נוכחות", menu_converter: "ממיר מטבעות", menu_recur: "הוצאות קבועות", menu_calc: "מחשבון שכר", menu_loan: "מחשבון הלוואה", menu_split: "פיצול חשבון", menu_wishlist: "רשימת משאלות", menu_pro: "פרימיום", menu_backup: "גיבוי ושחזור", menu_dark: "מצב לילה", setup_pin: "הגדרת קוד נעילה",
        balance_label: "עו\"ש בבנק", salary_label: "משכורת", filter_all: "כל הקטגוריות", search_ph: "חיפוש הוצאות...", left_to_spend: "נותר לבזבוז:",
        savings_title: "קופות חיסכון", new_goal_btn: "+ יעד חדש", chart_toggle: "החלף תצוגה",
        budget: "תקציב:", add: "הוסף", desc_placeholder: "תיאור", amount_placeholder: "סכום",
        recur_title: "הוצאות קבועות", add_new: "+ הוספה חדשה", recur_name_ph: "שם (למשל: נטפליקס)", save_order: "שמור הוראה",
        active_orders: "רשימת הוראות פעילות", col_name: "שם", col_cat: "קטגוריה", col_amount: "סכום", col_del: "מחק", no_recur: "אין הוראות קבע מוגדרות",
        calc_title: "חישוב שכר", mode_free: "מצב עריכה חופשי", reset: "איפוס", hourly_wage: "שכר לשעה", month: "חודש",
        add_shift_title: "הוספת סוג משמרת", shift_name_ph: "שם", add_step: "+ הוסף מדרגה", save_type: "שמור סוג",
        no_shifts: "אין משמרות מוגדרות", stat_shifts: "משמרות", stat_hours: "שעות", stat_wage: "שכר",
        free_calc_title: "מחשבון חופשי (תוספות)", col_desc: "תיאור", col_hours: "שעות", col_percent: "אחוז %", add_row: "+ הוסף שורה", total_additions: "סה״כ תוספות:",
        full_details: "פירוט מלא", col_type: "סוג", col_qty: "כמות", col_total: "סה״כ", grand_total: "סה״כ כולל",
        settings_title: "הגדרות וגיבוי", backup_btn: "גיבוי מלא (שתף)", restore_btn: "שחזור מגיבוי", export_btn: "ייצוא לאקסל (שתף)", close: "סגור",
        delete_cat_title: "למחוק את הקטגוריה?", delete_cat_msg: "הקטגוריה וכל ההוצאות יימחקו.\nלא ניתן לשחזר!", cancel: "ביטול", yes_delete: "כן, מחק",
        new_goal_title: "יעד חיסכון חדש", goal_name_ph: "שם היעד", goal_target_ph: "סכום יעד", choose_color: "בחר צבע:", save: "שמור",
        deposit_title: "הפקדה ליעד", deposit_amount_ph: "סכום להפקדה", deposit_btn: "הפקד",
        delete_goal_title: "למחוק את היעד?", delete_goal_msg: "פעולה זו לא ניתנת לביטול.",
        delete_shift_title: "למחוק סוג משמרת?", delete_shift_msg: "הנתונים של משמרת זו יימחקו.",
        reset_month_title: "לאפס את החודש?", reset_month_msg: "כל המשמרות יימחקו.", yes_reset: "כן, אפס",
        alert_title: "הודעה", confirm: "אישור",
        new_cat_title: "קטגוריה חדשה", cat_name_ph: "שם", icon_label: "סמל:", icon_ph: "או הקלד...", cat_limit_ph: "תקציב",
        edit_budget_title: "עדכון תקציב", update: "עדכן",
        premium_title: "Premium", premium_title_header: "Premium", upgrade_pro: "שדרוג לפרו", pro_desc: "הסרת פרסומות, גיבוי בענן ותמיכה.", coming_soon: "בקרוב",
        footer_rights: "© All rights reserved for Neto App , Developer: Cohen's.",
        tips: ["הדרך לעושר מתחילה בשקל הראשון שחוסכים.", "לא משנה כמה אתה מרוויח, משנה כמה אתה שומר.", "תקציב הוא לא כלא, הוא המפתח לחופש.", "כסף הוא משרת נהדר אבל אדון נורא.", "השקעה בעצמך מניבה את הריבית הגבוהה ביותר.", "הוצאות קטנות מצטברות להון גדול.", "שליטה בכסף היא שליטה בחיים.", "העושר האמיתי הוא השקט הנפשי.", "אל תקנה מה שאתה לא צריך.", "תקציב חכם היום = חופש כלכלי מחר."],
        pin_enter: "הזן קוד גישה", pin_setup: "בחר קוד גישה חדש", pin_confirm: "אמת קוד גישה", pin_wrong: "קוד שגוי", pin_match_err: "קוד לא תואם",
        converter_title: "ממיר מטבעות", convert_btn: "המר כעת",
        loan_amount: "סכום ההלוואה", loan_interest: "ריבית שנתית (%)", loan_years: "תקופה (שנים)", calculate: "חשב", monthly_payment: "החזר חודשי",
        bill_amount: "סכום החשבון", tip_percent: "טיפ (%)", num_people: "מספר אנשים", total_per_person: "סה״כ לאדם",
        item_name: "שם מוצר", item_price: "מחיר", no_items: "אין פריטים ברשימה",
        wishlist_tip: "לפני שקונים - חושבים פעמיים! 💭",
        type_fixed: "הוראת קבע", type_installments: "תשלומים", num_payments: "מספר תשלומים",
        timer_earned: "רווח מצטבר", timer_start: "כניסה למשמרת", timer_stop: "יציאה"
    },
    en: {
        dir: 'ltr', locale: 'en-US', remove_pin: "Remove PIN Lock",
        app_title: "Neto", subtitle: "Smart Budget Management", daily_tip: "Daily Tip", start_btn: "Let's Start",
        menu_title: "Menu", menu_home: "Dashboard", menu_timer: "Shift Clock", menu_converter: "Currency Converter", menu_recur: "Recurring Expenses", menu_calc: "Salary Calc", menu_loan: "Loan Calc", menu_split: "Split Bill", menu_wishlist: "Wishlist", menu_pro: "Premium", menu_backup: "Backup & Restore", menu_dark: "Dark Mode", setup_pin: "Setup PIN Lock",
        balance_label: "Bank Balance", salary_label: "Salary", filter_all: "All Categories", search_ph: "Search expenses...", left_to_spend: "Left to Spend:",
        savings_title: "Savings Goals", new_goal_btn: "+ New Goal", chart_toggle: "Toggle View",
        budget: "Budget:", add: "Add", desc_placeholder: "Description", amount_placeholder: "Amount",
        recur_title: "Recurring Expenses", add_new: "+ Add New", recur_name_ph: "Name (e.g. Netflix)", save_order: "Save Order",
        active_orders: "Active Orders", col_name: "Name", col_cat: "Category", col_amount: "Amount", col_del: "Del", no_recur: "No active orders defined",
        calc_title: "Salary Calc", mode_free: "Free Edit Mode", reset: "Reset", hourly_wage: "Hourly Wage", month: "Month",
        add_shift_title: "Add Shift Type", shift_name_ph: "Name", add_step: "+ Add Step", save_type: "Save Type",
        no_shifts: "No shifts defined", stat_shifts: "Shifts", stat_hours: "Hours", stat_wage: "Salary",
        free_calc_title: "Free Calculator (Additions)", col_desc: "Desc", col_hours: "Hours", col_percent: "Percent %", add_row: "+ Add Row", total_additions: "Total Additions:",
        full_details: "Full Details", col_type: "Type", col_qty: "Qty", col_total: "Total", grand_total: "Grand Total",
        settings_title: "Settings & Backup", backup_btn: "Full Backup (Share)", restore_btn: "Restore from Backup", export_btn: "Export to CSV (Share)", close: "Close",
        delete_cat_title: "Delete Category?", delete_cat_msg: "Category and all expenses will be deleted.\nCannot be undone!", cancel: "Cancel", yes_delete: "Yes, Delete",
        new_goal_title: "New Savings Goal", goal_name_ph: "Goal Name", goal_target_ph: "Target Amount", choose_color: "Choose Color:", save: "Save",
        deposit_title: "Deposit to Goal", deposit_amount_ph: "Deposit Amount", deposit_btn: "Deposit",
        delete_goal_title: "Delete Goal?", delete_goal_msg: "This action cannot be undone.",
        delete_shift_title: "Delete Shift Type?", delete_shift_msg: "Data for this shift type will be deleted.",
        reset_month_title: "Reset Month?", reset_month_msg: "All shifts will be deleted.", yes_reset: "Yes, Reset",
        alert_title: "Message", confirm: "OK",
        new_cat_title: "New Category", cat_name_ph: "Name", icon_label: "Icon:", icon_ph: "Or type...", cat_limit_ph: "Budget",
        edit_budget_title: "Update Budget", update: "Update",
        premium_title: "Premium", premium_title_header: "Premium", upgrade_pro: "Upgrade to Pro", pro_desc: "Remove ads, cloud backup & support.", coming_soon: "Coming Soon",
        footer_rights: "© All rights reserved for Neto App",
        tips: ["The road to wealth starts with the first coin saved.", "It's not how much you make, it's how much you keep.", "A budget is telling your money where to go instead of wondering where it went.", "Money is a terrible master but an excellent servant.", "Investing in yourself pays the best interest.", "Small expenses add up to a big fortune.", "Mastering money is mastering life.", "True wealth is peace of mind.", "Don't buy what you don't need.", "Smart budgeting today = Financial freedom tomorrow."],
        pin_enter: "Enter PIN", pin_setup: "Choose New PIN", pin_confirm: "Confirm PIN", pin_wrong: "Wrong PIN", pin_match_err: "PINs do not match",
        converter_title: "Currency Converter", convert_btn: "Convert",
        loan_amount: "Loan Amount", loan_interest: "Annual Interest (%)", loan_years: "Term (Years)", calculate: "Calculate", monthly_payment: "Monthly Payment",
        bill_amount: "Bill Amount", tip_percent: "Tip (%)", num_people: "Number of People", total_per_person: "Total Per Person",
        item_name: "Item Name", item_price: "Price", no_items: "No items in wishlist",
        wishlist_tip: "Think twice before buying! 💭",
        type_fixed: "Fixed Recurring", type_installments: "Installments", num_payments: "Number of Payments",
        timer_earned: "Total Earned", timer_start: "Start Shift", timer_stop: "Stop Shift"
    }
};

const currencyNames = {
    USD: { he: "דולר אמריקאי", en: "US Dollar" }, EUR: { he: "אירו", en: "Euro" }, ILS: { he: "שקל חדש", en: "Israeli Shekel" }, GBP: { he: "לירה שטרלינג", en: "British Pound" }, JPY: { he: "יין יפני", en: "Japanese Yen" }, AUD: { he: "דולר אוסטרלי", en: "Australian Dollar" }, CAD: { he: "דולר קנדי", en: "Canadian Dollar" }, CHF: { he: "פרנק שוויצרי", en: "Swiss Franc" }, CNY: { he: "יואן סיני", en: "Chinese Yuan" }, RUB: { he: "רובל רוסי", en: "Russian Ruble" }, BRL: { he: "ריאל ברזילאי", en: "Brazilian Real" }, INR: { he: "רופי הודי", en: "Indian Rupee" }, TRY: { he: "לירה טורקית", en: "Turkish Lira" }, ZAR: { he: "ראנד דרום אפריקאי", en: "South African Rand" }, EGP: { he: "לירה מצרית", en: "Egyptian Pound" }, JOD: { he: "דינר ירדני", en: "Jordanian Dinar" }
};

/* =========================================
   3. HELPER FUNCTIONS
   ========================================= */
function t(key) { 
    if (!translations[currentLang]) currentLang = 'he';
    return translations[currentLang][key] || key; 
}

function formatMoney(n) {
    let loc = 'he-IL';
    if(translations[currentLang]) loc = translations[currentLang].locale;
    return n.toLocaleString(loc, { style: 'currency', currency: currentCurrency, maximumFractionDigits: 0 }); 
}

function triggerHaptic() { if(appData.settings.haptics && navigator.vibrate) navigator.vibrate(10); }

function saveData() { localStorage.setItem('budgetUltimateDataV23', JSON.stringify(appData)); }

// --- Settings Logic ---
function applyTheme(themeName) {
    document.body.classList.remove('theme-ocean', 'theme-forest', 'theme-sunset', 'theme-luxury');
    if(themeName !== 'default') document.body.classList.add('theme-' + themeName);
    appData.settings.theme = themeName;
    saveData();
}

function toggleHaptic() {
    appData.settings.haptics = document.getElementById('haptic-toggle').checked;
    saveData();
    if(appData.settings.haptics) triggerHaptic();
}

function updateBillingDayVal() {
    const val = document.getElementById('billing-day-slider').value;
    document.getElementById('bill-day-val').innerText = val;
}

function saveBillingDay() {
    const val = document.getElementById('billing-day-slider').value;
    appData.settings.billingDay = parseInt(val);
    saveData();
    renderApp();
}

function setCurrency(code) {
    triggerHaptic();
    currentCurrency = code;
    localStorage.setItem('appCurrency', code);
    document.querySelectorAll('[data-curr-btn]').forEach(btn => {
        btn.classList.remove('active');
        if(btn.dataset.currBtn === code) btn.classList.add('active');
    });
    refreshAll();
}

function setLanguage(lang) {
    triggerHaptic();
    currentLang = lang;
    localStorage.setItem('appLang', lang);
    const dir = translations[lang].dir;
    document.documentElement.setAttribute('dir', dir);
    document.querySelectorAll('[data-lang]').forEach(el => { const key = el.getAttribute('data-lang'); if(translations[lang][key]) el.innerText = translations[lang][key]; });
    document.querySelectorAll('[data-lang-placeholder]').forEach(el => { const key = el.getAttribute('data-lang-placeholder'); if(translations[lang][key]) el.placeholder = translations[lang][key]; });
    const arrow = document.getElementById('start-arrow');
    if(arrow) arrow.className = dir === 'rtl' ? 'fas fa-arrow-left' : 'fas fa-arrow-right';
    document.querySelectorAll('[data-lang-btn]').forEach(btn => { btn.classList.remove('active'); if(btn.dataset.langBtn === lang) btn.classList.add('active'); });
    updateTip();
    refreshAll();
}

function refreshAll() {
    if(typeof updateMonthDisplay === 'function') updateMonthDisplay();
    if(typeof renderApp === "function") renderApp();
    if(typeof renderRecurringPage === "function") renderRecurringPage();
    if(typeof renderSavings === "function") renderSavings();
    if(typeof initConverter === "function") initConverter(); 
    if(typeof initSalaryCalculator === "function") initSalaryCalculator();
    if(typeof renderWishlist === "function") renderWishlist();
}

function updateTip() {
    const tips = translations[currentLang].tips;
    const randTip = tips[Math.floor(Math.random() * tips.length)];
    const tipEl = document.getElementById('landing-tip-text');
    const motEl = document.getElementById('motivation-text');
    if(tipEl) tipEl.innerText = randTip;
    if(motEl) motEl.innerText = randTip;
}

// === MAIN LOGIC ===
function renderApp() {
    const startDay = parseInt(appData.settings.billingDay) || 1;
    const key = getMonthKey(currentDate); 
    
    document.getElementById('salary-input').value = (appData.monthlySalaries && appData.monthlySalaries[key]) ? appData.monthlySalaries[key] : '';
    
    const filterCat = document.getElementById('cat-filter'); const currentFilter = filterCat.value;
    filterCat.innerHTML = `<option value="all">${t('filter_all')}</option>` + appData.categories.map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('');
    filterCat.value = currentFilter;

    const container = document.getElementById('categories-container'); container.innerHTML = '';
    let totalExpenses = 0;
    const searchTerm = document.getElementById('search-bar').value.toLowerCase();

    appData.categories.forEach(cat => {
        if(currentFilter !== 'all' && cat.id != currentFilter) return;
        
        let filteredItems = cat.items.filter(item => {
            const d = new Date(item.date);
            let cycleMonth = d.getMonth();
            let cycleYear = d.getFullYear();
            
            if (startDay > 1 && d.getDate() >= startDay) {
                cycleMonth++;
                if (cycleMonth > 11) { cycleMonth = 0; cycleYear++; }
            }
            
            return cycleMonth === currentDate.getMonth() && cycleYear === currentDate.getFullYear();
        });

        if(searchTerm) {
            filteredItems = filteredItems.filter(item => item.text.toLowerCase().includes(searchTerm));
        }

        const catTotal = filteredItems.reduce((sum, item) => sum + item.amount, 0); 
        if(!searchTerm) totalExpenses += catTotal;

        if(searchTerm && filteredItems.length === 0) return;

        const spentPos = Math.abs(Math.min(0, catTotal)); const limit = cat.limit || 1000; const percent = Math.min(100, (spentPos / limit) * 100);
        let colorClass = percent > 100 ? 'bg-red' : (percent > 75 ? 'bg-yellow' : 'bg-green'); let balanceStyle = percent >= 100 ? 'color:var(--danger)' : '';

        const card = document.createElement('div'); card.className = 'category-card animate-item'; card.setAttribute('data-id', cat.id); 
        const deleteBtnHtml = `<div class="cat-delete-main-btn" onclick="deleteCategoryMain(${cat.id})"><i class="fas fa-times"></i></div>`;
        const dragHandleHtml = `<div class="drag-handle"><i class="fas fa-sort"></i></div>`;

        card.innerHTML = `
            ${deleteBtnHtml} ${dragHandleHtml}
            <div class="card-header">
                <div class="cat-info"><div class="cat-emoji">${cat.emoji}</div><div><div style="font-weight:bold">${cat.name}</div><div class="cat-limit" onclick="openLimitModal(${cat.id})">${t('budget')} ${limit} <i class="fas fa-pen" style="font-size:0.7rem"></i></div></div></div>
                <div class="current-spend" style="${balanceStyle}">${formatMoney(catTotal)}</div>
            </div>
            <div class="progress-track"><div class="progress-fill ${colorClass}" style="width:${percent}%"></div></div>
            <ul class="items-list">${filteredItems.map(item => {
                let icon = item.method === 'cash' ? '<i class="fas fa-money-bill-wave pay-method-icon"></i>' : (item.method === 'transfer' ? '<i class="fas fa-university pay-method-icon"></i>' : '<i class="fas fa-credit-card pay-method-icon"></i>');
                let dObj = new Date(item.date);
                let dateStr = dObj.getDate() + '/' + (dObj.getMonth()+1);
                return `<li class="item-row">
                    <span style="display:flex;flex-direction:column;"><span>${item.text} ${item.isAuto ? '<i class="fas fa-robot"></i>' : ''}</span><span style="font-size:0.7rem; opacity:0.6;">${dateStr}</span></span>
                    <div>${icon}<span class="${item.amount < 0 ? 'amount-neg' : 'amount-pos'}">${formatMoney(Math.abs(item.amount))}</span><i class="fas fa-copy" onclick="duplicateItem(${cat.id}, '${item.id}')" style="margin:0 5px; color:#aaa; cursor:pointer;"></i><i class="fas fa-times" onclick="deleteItem(${cat.id}, '${item.id}')" style="margin-right:5px; color:#ccc; cursor:pointer;"></i></div>
                </li>`
            }).join('')}</ul>
            <div class="quick-add"><div class="qa-row"><input id="d-${cat.id}" class="qa-input" placeholder="${t('desc_placeholder')}"></div><div class="qa-row"><input id="a-${cat.id}" type="number" class="qa-input" placeholder="${t('amount_placeholder')}"><select id="m-${cat.id}" class="qa-input" style="flex:0.5"><option value="credit">💳</option><option value="cash">💵</option><option value="transfer">🏦</option></select></div><button class="qa-btn" onclick="addItem(${cat.id})"><i class="fas fa-plus"></i> ${t('add')}</button></div>`;
        container.appendChild(card);
    });

    if(categorySortable) categorySortable.destroy();
    categorySortable = new Sortable(container, { animation: 150, handle: '.drag-handle', onEnd: function (evt) { const item = appData.categories.splice(evt.oldIndex, 1)[0]; appData.categories.splice(evt.newIndex, 0, item); saveData(); } });

    if(!searchTerm) {
        const bank = parseFloat(appData.bank) || 0; 
        const salary = parseFloat(appData.monthlySalaries?.[key]) || 0; 
        const total = bank + salary + totalExpenses;
        const totalSaved = appData.goals.reduce((acc, g) => acc + g.current, 0);
        const leftToSpend = total - totalSaved;
        document.getElementById('global-balance').innerText = formatMoney(total); 
        document.getElementById('global-balance').style.color = total < 0 ? 'var(--danger)' : 'white';
        document.getElementById('left-to-spend').innerText = t('left_to_spend') + ' ' + formatMoney(leftToSpend);
        renderHistoryChart();
    }
    renderSavings();
}

// === PIN LOGIC ===
function checkPinLock() {
    pinCode = localStorage.getItem('appPin');
    if(pinCode) {
        document.getElementById('pin-lock-screen').classList.add('active');
        document.getElementById('pin-title').innerText = t('pin_enter');
        document.getElementById('pin-cancel-btn').style.display = 'none';
        pinInput = "";
        updatePinDots();
        return true; 
    }
    return false;
}
function setupPinCode() { toggleMenu(); pinSetupMode = true; tempPin = ""; pinInput = ""; document.getElementById('pin-lock-screen').classList.add('active'); document.getElementById('pin-title').innerText = t('pin_setup'); document.getElementById('pin-cancel-btn').style.display = 'block'; updatePinDots(); }
function removePinCode() { if (!localStorage.getItem('appPin')) { showAppAlert(t('alert_title'), 'לא מוגדר קוד נעילה', '⚠️'); toggleMenu(); return; } showConfirmDialog("הסרת נעילה", "האם אתה בטוח שברצונך להסיר את קוד הנעילה?", function() { localStorage.removeItem('appPin'); pinCode = null; toggleMenu(); showAppAlert(t('alert_title'), 'קוד הנעילה הוסר בהצלחה', '🔓'); }); }
function cancelPinSetup() { pinSetupMode = false; tempPin = ""; pinInput = ""; document.getElementById('pin-lock-screen').classList.remove('active'); }
let pinInput = ""; let pinSetupMode = false; let tempPin = "";
function pressPin(num) { triggerHaptic(); if(pinInput.length < 4) { pinInput += num; updatePinDots(); if(pinInput.length === 4) setTimeout(handlePinSubmit, 200); } }
function deletePin() { triggerHaptic(); pinInput = pinInput.slice(0, -1); updatePinDots(); }
function updatePinDots() { const dots = document.querySelectorAll('.pin-dot'); dots.forEach((dot, i) => { if(i < pinInput.length) dot.classList.add('filled'); else dot.classList.remove('filled'); dot.classList.remove('error'); }); }
function handlePinSubmit() { if(pinSetupMode) { if(!tempPin) { tempPin = pinInput; pinInput = ""; document.getElementById('pin-title').innerText = t('pin_confirm'); updatePinDots(); } else { if(pinInput === tempPin) { pinCode = pinInput; localStorage.setItem('appPin', pinCode); pinSetupMode = false; document.getElementById('pin-lock-screen').classList.remove('active'); showAppAlert(t('alert_title'), 'PIN Set Successfully!', '🔒'); } else { shakeDots(); document.getElementById('pin-subtitle').innerText = t('pin_match_err'); pinInput = ""; tempPin = ""; setTimeout(() => { document.getElementById('pin-title').innerText = t('pin_setup'); document.getElementById('pin-subtitle').innerText = ""; }, 1000); } } } else { if(pinInput === pinCode) { document.getElementById('pin-lock-screen').classList.remove('active'); } else { shakeDots(); document.getElementById('pin-subtitle').innerText = t('pin_wrong'); pinInput = ""; updatePinDots(); } } }
function shakeDots() { if(appData.settings.haptics && navigator.vibrate) navigator.vibrate([50,50,50]); const dots = document.querySelectorAll('.pin-dot'); dots.forEach(dot => dot.classList.add('error')); setTimeout(updatePinDots, 500); }

// === TIMER LOGIC ===
function initShiftTimer() {
    const storedStart = localStorage.getItem('shiftStartTime');
    if(storedStart) {
        const startTime = parseInt(storedStart);
        const btn = document.getElementById('btn-shift-toggle');
        const circle = document.getElementById('timer-circle');
        if(btn) { btn.innerHTML = '<i class="fas fa-stop"></i>'; btn.classList.remove('btn-start'); btn.classList.add('btn-stop'); }
        if(circle) circle.classList.add('active');
        
        let hourlyRate = 0;
        try { const cfg = JSON.parse(localStorage.getItem('ssc:cfg')); if(cfg && cfg.hourly) hourlyRate = parseFloat(cfg.hourly); } catch(e) {}

        if(shiftInterval) clearInterval(shiftInterval);
        shiftInterval = setInterval(() => {
            const now = Date.now();
            const diff = now - startTime;
            const seconds = Math.floor(diff / 1000);
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            document.getElementById('timer-time').innerText = `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
            if(hourlyRate > 0) {
                const earned = (seconds / 3600) * hourlyRate;
                document.getElementById('timer-money').innerText = formatMoney(earned);
            }
        }, 1000);
    }
}
function toggleShift() {
    triggerHaptic();
    const btn = document.getElementById('btn-shift-toggle');
    const circle = document.getElementById('timer-circle');
    const storedStart = localStorage.getItem('shiftStartTime');
    if(storedStart) {
        const endTime = Date.now();
        const duration = endTime - parseInt(storedStart);
        const hours = duration / (1000 * 60 * 60);
        let hourlyRate = 0;
        try { const cfg = JSON.parse(localStorage.getItem('ssc:cfg')); if(cfg && cfg.hourly) hourlyRate = parseFloat(cfg.hourly); } catch(e) {}
        const earned = hours * hourlyRate;
        localStorage.removeItem('shiftStartTime');
        clearInterval(shiftInterval);
        btn.innerHTML = '<i class="fas fa-play"></i>';
        btn.classList.remove('btn-stop');
        btn.classList.add('btn-start');
        circle.classList.remove('active');
        document.getElementById('timer-time').innerText = "00:00:00";
        document.getElementById('timer-money').innerText = formatMoney(0);
        showAppAlert("משמרת הסתיימה", `זמן: ${hours.toFixed(2)} שעות\nרווח משוער: ${formatMoney(earned)}`, '💰');
    } else {
        localStorage.setItem('shiftStartTime', Date.now());
        btn.innerHTML = '<i class="fas fa-stop"></i>';
        btn.classList.remove('btn-start');
        btn.classList.add('btn-stop');
        circle.classList.add('active');
        initShiftTimer();
    }
}

// === CONVERTER LOGIC ===
function initConverter() {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
        .then(res => res.json())
        .then(data => {
            ratesData = data.rates;
            const apiKeys = Object.keys(ratesData);
            const sel1 = document.getElementById('conv-from');
            const sel2 = document.getElementById('conv-to');
            if(!sel1 || !sel2) return;
            const old1 = sel1.value; const old2 = sel2.value;
            sel1.innerHTML = ''; sel2.innerHTML = '';
            const popularList = Object.keys(currencyNames).filter(code => apiKeys.includes(code));
            const otherList = apiKeys.filter(code => !currencyNames[code]).sort();
            const sortedList = [...popularList, ...otherList];
            sortedList.forEach(cur => {
                const label = currencyNames[cur] ? `${cur} - ${currencyNames[cur][currentLang]}` : cur;
                const opt1 = document.createElement('option'); opt1.value = cur; opt1.text = label;
                const opt2 = document.createElement('option'); opt2.value = cur; opt2.text = label;
                if (currencyNames[cur]) { opt1.style.fontWeight = "bold"; opt1.style.color = "var(--primary)"; opt2.style.fontWeight = "bold"; opt2.style.color = "var(--primary)"; }
                sel1.appendChild(opt1); sel2.appendChild(opt2);
            });
            sel1.value = old1 || 'USD'; sel2.value = old2 || 'ILS';
            convertCurrency();
        })
        .catch(err => { console.log('Offline'); });
}
function convertCurrency() { if(!ratesData || Object.keys(ratesData).length === 0) return; const amount = parseFloat(document.getElementById('conv-amount').value) || 0; const from = document.getElementById('conv-from').value; const to = document.getElementById('conv-to').value; const rateFrom = ratesData[from]; const rateTo = ratesData[to]; const res = (amount / rateFrom) * rateTo; document.getElementById('conv-result-big').innerText = res.toFixed(2) + ' ' + to; document.getElementById('conv-result-sub').innerText = `1 ${from} = ${(rateTo/rateFrom).toFixed(4)} ${to}`; }
function swapCurrencies() { triggerHaptic(); const s1 = document.getElementById('conv-from'); const s2 = document.getElementById('conv-to'); const tmp = s1.value; s1.value = s2.value; s2.value = tmp; convertCurrency(); }

// === OTHER LOGIC (Wishlist, Calc, Recurring) ===
function renderWishlist() {
    const container = document.getElementById('wishlist-container');
    if(!container) return;
    container.innerHTML = '';
    if(!appData.wishlist || appData.wishlist.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; opacity:0.6;">${t('no_items')}</div>`;
        return;
    }
    appData.wishlist.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'wishlist-item animate-item';
        div.innerHTML = `
            <div class="w-info">
                <div class="w-name">${item.name}</div>
                <div class="w-price">${formatMoney(item.price)}</div>
            </div>
            <div class="w-actions">
                <button class="w-btn buy" onclick="openBuyItemModal(${index})"><i class="fas fa-check"></i></button>
                <button class="w-btn del" onclick="deleteWishlistItem(${index})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        container.appendChild(div);
    });
}
function addWishlistItem() { triggerHaptic(); const name = document.getElementById('wish-name').value; const price = parseFloat(document.getElementById('wish-price').value); if(name && price) { appData.wishlist.push({name, price}); saveData(); renderWishlist(); document.getElementById('wish-name').value = ''; document.getElementById('wish-price').value = ''; } }
function deleteWishlistItem(index) { triggerHaptic(); appData.wishlist.splice(index, 1); saveData(); renderWishlist(); }
function openBuyItemModal(index) { document.getElementById('buy-item-index').value = index; const select = document.getElementById('buy-cat-select'); select.innerHTML = appData.categories.map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join(''); document.getElementById('buy-item-modal').classList.add('open'); }
function confirmBuyItem() { triggerHaptic(); const index = parseInt(document.getElementById('buy-item-index').value); const catId = document.getElementById('buy-cat-select').value; const item = appData.wishlist[index]; const cat = appData.categories.find(c => c.id == catId); if(cat && item) { cat.items.push({ id: Date.now().toString(), text: item.name, amount: -Math.abs(item.price), date: currentDate.toISOString(), method: 'credit' }); appData.wishlist.splice(index, 1); saveAndRender(); renderWishlist(); document.getElementById('buy-item-modal').classList.remove('open'); showAppAlert(t('alert_title'), 'Purchased!', '🛍️'); } }

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    if(isDarkMode) document.body.classList.add('dark-mode');
    checkPinLock();
    
    const haptToggle = document.getElementById('haptic-toggle');
    if(haptToggle) haptToggle.checked = appData.settings.haptics;
    applyTheme(appData.settings.theme || 'default');
    
    const billSlider = document.getElementById('billing-day-slider');
    const savedBillDay = appData.settings.billingDay || 1;
    billSlider.value = savedBillDay;
    document.getElementById('bill-day-val').innerText = savedBillDay;

    setLanguage(currentLang);
    setCurrency(currentCurrency);
    document.getElementById('bank-input').value = appData.bank || '';

    checkAndRunRecurring();
    updateMonthDisplay();
    renderApp();
    checkPremiumStatus();
    initSalaryCalculator();
    initConverter();
    renderWishlist();
    initShiftTimer();
    
    appData.lastLogin = Date.now();
    saveData();
});

// Helper Functions
function toggleMenu() { document.getElementById('side-menu').classList.toggle('open'); document.getElementById('menu-overlay').classList.toggle('open'); document.body.classList.toggle('no-scroll'); }
function navTo(pageName) { triggerHaptic(); if(document.getElementById('side-menu').classList.contains('open')) toggleMenu(); if (pageName === 'dashboard') document.getElementById('page-landing').classList.remove('active'); document.querySelectorAll('.page').forEach(el => el.classList.remove('active')); document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active')); document.getElementById(`page-${pageName}`).classList.add('active'); if(pageName === 'dashboard') renderApp(); if(pageName === 'recurring') renderRecurringPage(); if(pageName === 'wishlist') renderWishlist(); if(pageName === 'timer') initShiftTimer(); }
function getMonthKey(date) { return `${date.getMonth()}-${date.getFullYear()}`; }
function updateSalary() { const val = document.getElementById('salary-input').value; const key = getMonthKey(currentDate); if (!appData.monthlySalaries) appData.monthlySalaries = {}; appData.monthlySalaries[key] = val; saveAndRender(); }
function saveAndRender() { appData.bank = document.getElementById('bank-input').value; saveData(); renderApp(); }
function deleteCategoryMain(id) { document.getElementById('delete-cat-target-id').value = id; document.getElementById('delete-category-modal').classList.add('open'); }
function closeDeleteCatModal() { document.getElementById('delete-category-modal').classList.remove('open'); }
function performCategoryDelete() { const id = parseInt(document.getElementById('delete-cat-target-id').value); if(id) { appData.categories = appData.categories.filter(c => c.id !== id); saveAndRender(); closeDeleteCatModal(); showAppAlert(t('alert_title'), 'Deleted', '🗑️'); } }
function openGoalModal() { document.getElementById('goal-modal').classList.add('open'); }
function selectGoalColor(el, color) { document.querySelectorAll('.color-opt').forEach(d => d.classList.remove('selected')); el.classList.add('selected'); document.getElementById('new-goal-color').value = color; }
function confirmAddGoal() { const name = document.getElementById('new-goal-name').value; const target = parseFloat(document.getElementById('new-goal-target').value); const emoji = document.getElementById('new-goal-emoji').value || '💰'; const color = document.getElementById('new-goal-color').value; if(name && target) { appData.goals.push({name, target, current:0, emoji, color}); saveAndRender(); document.getElementById('goal-modal').classList.remove('open'); document.getElementById('new-goal-name').value=''; document.getElementById('new-goal-target').value=''; } }
function openDepositModal(index) { document.getElementById('deposit-goal-index').value = index; document.getElementById('deposit-goal-name').innerText = appData.goals[index].name; document.getElementById('deposit-amount').value = ''; document.getElementById('deposit-modal').classList.add('open'); document.getElementById('deposit-amount').focus(); }
function confirmDeposit() { const index = parseInt(document.getElementById('deposit-goal-index').value); const amount = parseFloat(document.getElementById('deposit-amount').value); if(amount > 0) { appData.goals[index].current += amount; saveAndRender(); document.getElementById('deposit-modal').classList.remove('open'); } }
function deleteGoal(i) { document.getElementById('delete-goal-index').value = i; document.getElementById('delete-confirm-modal').classList.add('open'); }
function confirmDeleteGoal() { const i = parseInt(document.getElementById('delete-goal-index').value); appData.goals.splice(i, 1); saveAndRender(); document.getElementById('delete-confirm-modal').classList.remove('open'); }
function toggleChartType() { chartType = chartType === 'bar' ? 'pie' : 'bar'; renderHistoryChart(); }
function renderHistoryChart() { const ctx = document.getElementById('expenseChart').getContext('2d'); if(chartInstance) chartInstance.destroy(); let config = {}; if (chartType === 'bar') { let labels = [], data = []; for(let i=5; i>=0; i--) { let d = new Date(); d.setMonth(d.getMonth() - i); labels.push(d.toLocaleDateString(translations[currentLang].locale, {month:'short'})); let mTotal = 0; appData.categories.forEach(cat => { cat.items.forEach(item => { let iDate = new Date(item.date); if(iDate.getMonth() === d.getMonth() && iDate.getFullYear() === d.getFullYear()) { if(item.amount < 0) mTotal += Math.abs(item.amount); } }); }); data.push(mTotal); } config = { type: 'bar', data: { labels, datasets: [{ label: t('col_amount'), data, backgroundColor: '#4e54c8', borderRadius: 4 }] }, options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true } } } }; } else { let labels = [], data = []; let colors = ['#ff7675', '#74b9ff', '#55efc4', '#a29bfe', '#ffeaa7', '#fd79a8']; appData.categories.forEach(cat => { let catSum = 0; cat.items.forEach(item => { let iDate = new Date(item.date); if(iDate.getMonth() === currentDate.getMonth() && iDate.getFullYear() === currentDate.getFullYear()) { if(item.amount < 0) catSum += Math.abs(item.amount); } }); if(catSum > 0) { labels.push(cat.name); data.push(catSum); } }); config = { type: 'pie', data: { labels, datasets: [{ data, backgroundColor: colors }] }, options: { maintainAspectRatio: false } }; } chartInstance = new Chart(ctx, config); }
function addItem(catId) { triggerHaptic(); const desc = document.getElementById(`d-${catId}`).value; const amount = document.getElementById(`a-${catId}`).value; const method = document.getElementById(`m-${catId}`).value; if(!desc || !amount) return; const cat = appData.categories.find(c => c.id === catId); const val = parseFloat(amount); cat.items.push({ id: Date.now().toString(), text: desc, amount: -Math.abs(val), date: currentDate.toISOString(), method: method }); saveAndRender(); }
function deleteItem(catId, itemId) { triggerHaptic(); const cat = appData.categories.find(c => c.id === catId); if(!cat) return; const item = cat.items.find(i => i.id === itemId); if(item && item.fromRecurId && appData.recurringSettings) { appData.recurringSettings = appData.recurringSettings.filter(rec => rec.id !== item.fromRecurId); saveData(); } cat.items = cat.items.filter(i => i.id !== itemId); saveAndRender(); }
function duplicateItem(catId, itemId) { triggerHaptic(); const cat = appData.categories.find(c => c.id === catId); if(!cat) return; const item = cat.items.find(i => i.id === itemId); if(!item) return; const newItem = { ...item, id: Date.now().toString(), date: currentDate.toISOString(), isAuto: false, fromRecurId: null }; cat.items.push(newItem); saveAndRender(); showAppAlert(t('alert_title'), 'Item Duplicated', '📄'); }
function openSettingsModal() { toggleMenu(); document.getElementById('settings-modal').classList.add('open'); }
async function exportDataJSON() { const dataStr = JSON.stringify(appData); const file = new File([dataStr], 'budget_backup.json', { type: 'application/json' }); if (typeof Android !== "undefined" && Android.saveFile) { Android.saveFile(dataStr, 'budget_backup.json', "application/json"); } else { if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Backup' }); } catch(err) {} } else { const a = document.createElement('a'); a.href = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr); a.download = 'budget_backup.json'; a.click(); } } }
async function exportToCSV() { let csv = "\uFEFFDate,Category,Desc,Amount,Method\n"; appData.categories.forEach(cat => { cat.items.forEach(i => { csv += `${new Date(i.date).toLocaleDateString()},${cat.name},${i.text},${i.amount},${i.method}\n` }); }); const file = new File([csv], 'export.csv', { type: 'text/csv' }); if (typeof Android !== "undefined" && Android.saveFile) { Android.saveFile(csv, 'budget_export.csv', "text/csv"); } else { if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Export' }); } catch(err) {} } else { const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csv); a.download = 'export.csv'; a.click(); } } }
function importDataJSON(input) { const file = input.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = function(e) { try { const loadedData = JSON.parse(e.target.result); if(loadedData.categories) { appData = loadedData; saveData(); location.reload(); } } catch(err) { alert("Error"); } }; reader.readAsText(file); }
function changeMonth(delta) { triggerHaptic(); currentDate.setMonth(currentDate.getMonth() + delta); updateMonthDisplay(); renderApp(); }
function updateMonthDisplay() { let loc = 'he-IL'; if(translations[currentLang]) loc = translations[currentLang].locale; document.getElementById('current-month-display').innerText = currentDate.toLocaleDateString(loc, { month: 'long', year: 'numeric' }); }
function openCategoryModal() { document.getElementById('cat-modal').classList.add('open'); }
function closeCategoryModal() { document.getElementById('cat-modal').classList.remove('open'); }
function selectEmoji(e) { document.getElementById('new-cat-emoji').value = e; }
function confirmAddCategory() { const name = document.getElementById('new-cat-name').value; const limit = document.getElementById('new-cat-limit').value; const emoji = document.getElementById('new-cat-emoji').value || '📁'; if(name) { appData.categories.push({ id: Date.now(), name, emoji, limit: parseFloat(limit)||1000, items: [] }); saveAndRender(); closeCategoryModal(); } }
function openLimitModal(catId) { const cat = appData.categories.find(c => c.id === catId); document.getElementById('edit-cat-id').value = catId; document.getElementById('limit-modal-cat-name').innerText = cat.name; document.getElementById('edit-cat-limit').value = cat.limit; document.getElementById('limit-modal').classList.add('open'); }
function confirmEditLimit() { const catId = parseInt(document.getElementById('edit-cat-id').value); const newLimit = parseFloat(document.getElementById('edit-cat-limit').value); const cat = appData.categories.find(c => c.id === catId); if(cat && newLimit) { cat.limit = newLimit; saveAndRender(); document.getElementById('limit-modal').classList.remove('open'); } }
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); localStorage.setItem('darkMode', document.body.classList.contains('dark-mode')); }
function checkPremiumStatus() { if(appData.isPremium) { document.querySelectorAll('.ad-spacer').forEach(e=>e.style.display='none'); document.body.style.paddingBottom="80px"; } }

function toggleRecType() { const isInstall = document.getElementById('type-installments').checked; document.getElementById('rec-payments-container').style.display = isInstall ? 'block' : 'none'; }
function renderRecurringPage() { const container = document.getElementById('recurring-list-container'); container.innerHTML = ''; const select = document.getElementById('rec-cat-select'); if(select) select.innerHTML = appData.categories.map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join(''); if (!appData.recurringSettings || appData.recurringSettings.length === 0) { container.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#999;">${t('no_recur')}</td></tr>`; return; } appData.recurringSettings.forEach((rec, index) => { const cat = appData.categories.find(c => c.id == rec.catId); const catName = cat ? (cat.emoji + ' ' + cat.name) : '-'; let nameDisplay = rec.text; if(rec.type === 'installments') { let currentNum = rec.totalPayments - rec.remaining; if(currentNum < 1) currentNum = 1; nameDisplay += ` <small style="color:var(--primary)">(${currentNum}/${rec.totalPayments})</small>`; } else { nameDisplay += ` <small style="opacity:0.5">(∞)</small>`; } const tr = document.createElement('tr'); tr.innerHTML = `<td style="font-weight:bold;">${nameDisplay}</td><td style="color:var(--text-sec); font-size:0.85rem;">${catName}</td><td style="text-align:center; direction:ltr;">${formatMoney(rec.amount)}</td><td style="text-align:center;"><button onclick="deleteRecurring(${index})" style="background:rgba(255, 118, 117, 0.1); color:var(--danger); border:none; width:30px; height:30px; border-radius:50%; cursor:pointer;"><i class="fas fa-trash-alt"></i></button></td>`; container.appendChild(tr); }); }
function addRecurringSetting() { triggerHaptic(); const text = document.getElementById('rec-desc').value; const amount = parseFloat(document.getElementById('rec-amount').value); const catId = document.getElementById('rec-cat-select').value; const isInstallments = document.getElementById('type-installments').checked; const payments = parseInt(document.getElementById('rec-payments').value) || 1; if(!text || !amount) return; const uniqueRecurId = Date.now() + Math.random(); const setting = { id: uniqueRecurId, text, amount, catId, type: isInstallments ? 'installments' : 'fixed', totalPayments: isInstallments ? payments : 0, remaining: isInstallments ? payments : 0 }; appData.recurringSettings.push(setting); const cat = appData.categories.find(c => c.id == catId); if(cat) { let itemText = text + ' (Auto)'; if(isInstallments) { itemText = `${text} (1/${payments})`; setting.remaining--; } cat.items.push({ id: Date.now().toString(), text: itemText, amount: -Math.abs(amount), date: currentDate.toISOString(), isAuto: true, method: 'credit', fromRecurId: uniqueRecurId }); if(isInstallments && setting.remaining <= 0) { appData.recurringSettings = appData.recurringSettings.filter(r => r.id !== uniqueRecurId); } } saveAndRender(); document.getElementById('rec-desc').value = ''; document.getElementById('rec-amount').value = ''; document.getElementById('rec-payments').value = ''; renderRecurringPage(); showAppAlert(t('alert_title'), 'Synced', '✅'); }
function deleteRecurring(index) { triggerHaptic(); const s = appData.recurringSettings[index]; appData.recurringSettings.splice(index, 1); if(s.id) { appData.categories.forEach(cat => { cat.items = cat.items.filter(item => item.fromRecurId !== s.id); }); } saveData(); renderRecurringPage(); saveAndRender(); }
function checkAndRunRecurring() { const now = new Date(); const mKey = `${now.getMonth()}-${now.getFullYear()}`; if(appData.lastProcessedMonth !== mKey) { if (appData.recurringSettings) { appData.recurringSettings.forEach(rec => { const cat = appData.categories.find(c => c.id == rec.catId); if(cat) { let itemText = rec.text; let shouldAdd = true; if(rec.type === 'installments') { if(rec.remaining > 0) { const currentP = (rec.totalPayments - rec.remaining) + 1; itemText = `${rec.text} (${currentP}/${rec.totalPayments})`; rec.remaining--; } else { shouldAdd = false; } } else { itemText += ' (Auto)'; } if(shouldAdd) { cat.items.push({ id: 'auto_'+Date.now()+Math.random(), text: itemText, amount: -Math.abs(rec.amount), date: now.toISOString(), isAuto: true, method:'credit' }); } } }); appData.recurringSettings = appData.recurringSettings.filter(rec => rec.type !== 'installments' || rec.remaining > 0); } appData.lastProcessedMonth = mKey; saveData(); } }
function showAppAlert(title, message, icon = '✅', callback = null) { document.getElementById('alert-title').innerText = title; document.getElementById('alert-message').innerText = message; document.getElementById('alert-icon').innerText = icon; postAlertAction = callback; document.getElementById('custom-alert-modal').classList.add('open'); }
function closeCustomAlert() { document.getElementById('custom-alert-modal').classList.remove('open'); if (postAlertAction) { postAlertAction(); postAlertAction = null; } }
function showConfirmDialog(title, msg, callback) { document.getElementById('gen-confirm-title').innerText = title; document.getElementById('gen-confirm-msg').innerText = msg; pendingAction = callback; document.getElementById('general-confirm-modal').classList.add('open'); }
function closeGeneralConfirm() { document.getElementById('general-confirm-modal').classList.remove('open'); pendingAction = null; }
function performGeneralConfirm() { if (pendingAction) pendingAction(); closeGeneralConfirm(); }

function calcLoan() { triggerHaptic(); const amount = parseFloat(document.getElementById('loan-amount').value); const rate = parseFloat(document.getElementById('loan-rate').value); const years = parseFloat(document.getElementById('loan-years').value); if(amount && rate && years) { const r = rate / 100 / 12; const n = years * 12; const monthly = amount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1); document.getElementById('loan-result').innerText = formatMoney(monthly); } }
function calcSplit() { triggerHaptic(); const amount = parseFloat(document.getElementById('split-amount').value); const tip = parseFloat(document.getElementById('split-tip').value); const people = parseFloat(document.getElementById('split-people').value); if(amount && people) { const total = amount * (1 + tip/100); const perPerson = total / people; document.getElementById('split-result').innerText = formatMoney(perPerson); } }

// SSC
function initSalaryCalculator() {
    const $ = s => document.querySelector(s);
    const ymDefault = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}`;
    const currentMode = localStorage.getItem('ssc:mode') || 'generic';
    const MISHMAR_CATS = [ {id:'m1', name:'בוקר', slices:[{p:100,h:8}]}, {id:'m2', name:'צהריים', slices:[{p:120,h:8}]}, {id:'m3', name:'לילה', slices:[{p:150,h:8}]}, {id:'m4', name:'שישי צהריים', slices:[{p:120,h:3},{p:250,h:5}]}, {id:'m5', name:'שישי/שבת לילה', slices:[{p:300,h:8}]}, {id:'m6', name:'שבת בוקר/צהריים', slices:[{p:225,h:8}]}, {id:'m7', name:'רצף צהריים לבוקר', slices:[{p:125,h:2},{p:150,h:6}]}, {id:'m8', name:'רצף לילה לצהריים', slices:[{p:187,h:2},{p:225,h:6}]}, {id:'m9', name:'כפולה 7-19', slices:[{p:100,h:8},{p:120,h:2},{p:150,h:2}]}, {id:'m10', name:'כפולה 8-20', slices:[{p:100,h:7},{p:125,h:3},{p:150,h:2}]}, {id:'m11', name:'כפולה 9-21', slices:[{p:100,h:6},{p:125,h:4},{p:150,h:2}]}, {id:'m12', name:'חד יומי (06-21)', slices:[{p:100,h:8},{p:125,h:2},{p:150,h:5}]} ];
    const state = { mode: currentMode, hourly: 0, ym: ymDefault, categories: [], counts: {}, quickRows: [] };
    const els = { hourly: $('#ssc_hourly'), month: $('#ssc_month'), grid: $('#ssc_grid'), tShifts: $('#ssc_totalShifts'), tHours: $('#ssc_totalHours'), gTotal: $('#ssc_grandTotal'), details: $('#ssc_details'), dTotal: $('#ssc_detailsTotal'), quick: $('#ssc_quickRows'), quickSum: $('#ssc_quickSum') };
    const badge = document.getElementById('ssc_modeBadge');
    if(state.mode === 'mishmar') { badge.innerText = "מצב משמר 👮‍♂️"; badge.style.background = "rgba(255, 215, 0, 0.3)"; document.getElementById('ssc_editorPanel').style.display = 'none'; } else { badge.innerText = t('mode_free'); badge.style.background = "rgba(255,255,255,0.2)"; document.getElementById('ssc_editorPanel').style.display = 'block'; }
    try{ const cfg=JSON.parse(localStorage.getItem('ssc:cfg')||'{}'); state.hourly=cfg.hourly||0; els.hourly.value=state.hourly||''; els.month.value=state.ym; }catch(e){}
    function loadData(){ if(state.mode === 'mishmar') { state.categories = MISHMAR_CATS; } else { try{state.categories=JSON.parse(localStorage.getItem('ssc:cats_generic')||'[]');}catch{state.categories=[];} if(!state.categories.length) state.categories=[{id:'g1',name:'משמרת רגילה',slices:[{p:100,h:8}]}]; } const storeKey=`ssc:counts:${state.mode}:${state.ym}`; try{state.counts=JSON.parse(localStorage.getItem(storeKey)||'{}');}catch{state.counts={};} const quickKey=`ssc:quick:${state.mode}:${state.ym}`; try{state.quickRows=JSON.parse(localStorage.getItem(quickKey)||'[]');}catch{state.quickRows=[];} }
    function saveData(){ localStorage.setItem('ssc:cfg', JSON.stringify({hourly:state.hourly})); localStorage.setItem(`ssc:counts:${state.mode}:${state.ym}`, JSON.stringify(state.counts)); localStorage.setItem(`ssc:quick:${state.mode}:${state.ym}`, JSON.stringify(state.quickRows)); if(state.mode==='generic') localStorage.setItem('ssc:cats_generic', JSON.stringify(state.categories)); }
    function renderAll(){ els.grid.innerHTML=''; if(!state.categories.length){ document.getElementById('ssc_emptyState').style.display='block'; return;} document.getElementById('ssc_emptyState').style.display='none'; state.categories.forEach(c=>{ const n=state.counts[c.id]||0; const subtotal=payForShift(c)*n; const card=document.createElement('div'); card.className='ssc-card animate-item'; const delBtn = state.mode === 'generic' ? `<button class="ssc-del-cat" onclick="sscDeleteCategory('${c.id}')"><i class="fas fa-times"></i></button>` : ''; card.innerHTML=`${delBtn}<h3>${c.name}</h3><div class="ssc-meta">${getShiftInfo(c).desc}</div><div class="ssc-counter"><div class="ssc-iconbtn" onclick="sscUpdateCount('${c.id}', -1)">−</div><div class="ssc-count">${n}</div><div class="ssc-iconbtn" onclick="sscUpdateCount('${c.id}', 1)">+</div></div><div class="ssc-meta" style="text-align:end">${t('col_total')}: <b>${fmt(subtotal)}</b></div>`; els.grid.appendChild(card); }); renderQuick(); calcAndRenderTotals(); }
    function renderQuick(){ els.quick.innerHTML=''; state.quickRows.forEach((r,i)=>{ const div=document.createElement('div'); div.className='ssc-editor-slice'; div.innerHTML=`<input type="text" class="ssc-inp" value="${r.label||''}" onchange="sscUpdateQuick(${i}, 'label', this.value)" placeholder="${t('col_desc')}" style="flex:2"><input type="number" class="ssc-inp" value="${r.h}" step="0.5" onchange="sscUpdateQuick(${i}, 'h', this.value)" placeholder="${t('col_hours')}" style="flex:1;text-align:center"><input type="number" class="ssc-inp" value="${r.p}" onchange="sscUpdateQuick(${i}, 'p', this.value)" placeholder="${t('col_percent')}" style="flex:1;text-align:center"><button class="ssc-btn-close-slice" onclick="this.parentElement.remove()" style="margin-top:15px"><i class="fas fa-times"></i></button>`; els.quick.appendChild(div); }); }
    function calcAndRenderTotals(){ let shifts=0, hours=0, money=0; let tbodyHtml=''; state.categories.forEach(c=>{ const n=state.counts[c.id]||0; if(n>0){ const info=getShiftInfo(c); const subMoney=payForShift(c)*n; const subHours=info.totalHours*n; shifts+=n; hours+=subHours; money+=subMoney; tbodyHtml+=`<tr><td style="text-align:start">${c.name}</td><td>${n}</td><td>${subHours}</td><td>${fmt(subMoney)}</td></tr>`; } }); let qMoney=0; state.quickRows.forEach(r=>{ qMoney+=(state.hourly*(r.p/100)*r.h); }); if(qMoney>0||state.quickRows.length>0){ money+=qMoney; tbodyHtml+=`<tr><td colspan="3" style="text-align:start">${t('free_calc_title')}</td><td>${fmt(qMoney)}</td></tr>`; } els.tShifts.textContent=shifts; els.tHours.textContent=parseFloat(hours.toFixed(2)); els.gTotal.textContent=fmt(money); els.details.innerHTML=tbodyHtml; els.dTotal.textContent=fmt(money); els.quickSum.textContent=fmt(qMoney); }
    function getShiftInfo(c){ let h=0; const parts=c.slices.map(s=>{ h+=+s.h; return `${s.p}%×${s.h}h`; }); return {totalHours:h, desc:`${h}h (${parts.join(' + ')})`}; }
    function payForShift(c){ if(!state.hourly)return 0; return c.slices.reduce((sum,s)=>sum+(state.hourly*(s.p/100)*s.h),0); }
    function fmt(n){ return formatMoney(n); }
    loadData(); renderAll();
    window.sscUpdateCount=(id,delta)=>{ triggerHaptic(); state.counts[id]=Math.max(0,(state.counts[id]||0)+delta); saveData(); renderAll(); };
    window.sscDeleteCategory=(id)=>{ triggerHaptic(); if(!confirm('Delete?'))return; state.categories=state.categories.filter(c=>c.id!==id); delete state.counts[id]; saveData(); renderAll(); };
    window.sscUpdateQuick=(i,k,v)=>{ state.quickRows[i][k]=(k==='label')?v:+v; saveData(); renderAll(); };
    window.sscRemoveQuick=(i)=>{ state.quickRows.splice(i,1); saveData(); renderAll(); };
    window.sscAddQuickRow = () => { triggerHaptic(); state.quickRows.push({h:0, p:100, label:''}); saveData(); renderQuick(); };
    window.sscResetMonth = () => { document.getElementById('reset-confirm-modal').classList.add('open'); };
    window.performRealReset = () => { state.counts={}; state.quickRows=[]; saveData(); renderAll(); document.getElementById('reset-confirm-modal').classList.remove('open'); };
    window.sscAddEditorSlice = () => { const d=document.createElement('div'); d.className='ssc-editor-slice'; d.innerHTML=`<div style="flex:1"><span style="font-size:10px">%</span><input type="number" class="ssc-inp e-p" value="100"></div><div style="flex:1"><span style="font-size:10px">H</span><input type="number" class="ssc-inp e-h" value="8" step="0.5"></div><button class="ssc-btn-close-slice" onclick="this.parentElement.remove()" style="margin-top:15px"><i class="fas fa-times"></i></button>`; $('#ssc_newShiftSlices').appendChild(d); };
    els.hourly.oninput=()=>{ state.hourly=+els.hourly.value; saveData(); renderAll(); };
    els.month.onchange=()=>{ state.ym=els.month.value; loadData(); renderAll(); };
    $('#ssc_saveTemplateBtn').onclick=()=>{ const name=$('#ssc_newShiftName').value.trim(); const slices=[]; document.querySelectorAll('#ssc_newShiftSlices .ssc-editor-slice').forEach(div=>{ slices.push({p:+div.querySelector('.e-p').value, h:+div.querySelector('.e-h').value}); }); if(name && slices.length){ state.categories.push({id:'g'+Date.now(),name,slices}); saveData(); renderAll(); $('#ssc_newShiftName').value=''; $('#ssc_newShiftSlices').innerHTML=''; window.sscAddEditorSlice(); } };
}

        document.addEventListener('click', function(e) {
            if (e.target && e.target.id === 'ssc_secretBtn') {
                const input = document.getElementById('ssc_secretCode');
                if (!input) return;
                const val = input.value.trim();
                if (val === 'משמר') { localStorage.setItem('ssc:mode', 'mishmar'); showAppAlert('מצב משמר', 'הפרופיל נטען בהצלחה! מרענן...', '👮‍♂️', function() { location.reload(); }); } 
                else if (val === 'רגיל' || val === 'generic') { localStorage.setItem('ssc:mode', 'generic'); showAppAlert('מצב רגיל', 'חזרת למצב עריכה חופשי.', '✏️', function() { location.reload(); }); } 
                else { showAppAlert('שגיאה', 'קוד לא חוקי', '❌'); }
            }
        });
    </script>
</body>
</html>