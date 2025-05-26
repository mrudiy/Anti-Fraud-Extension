// ==UserScript==
// @name         Anti-Fraud Extension
// @namespace    http://tampermonkey.net/
// @version      6.4
// @description  Anti-Fraud Extension
// @author       Maksym Rudyi
// @match        https://admin.betking.com.ua/*
// @match        https://admin.vegas.ua/*
// @match        https://admin.777.ua/*
// @match        https://admin.funrize.com/*
// @match        https://admin.nolimitcoins.com/*
// @match        https://admin.taofortune.com/*
// @match        https://admin.funzcity.com/*
// @match        https://admin.wildwinz.com/*
// @match        https://admin.fortunewheelz.com/*
// @match        https://admin.jackpotrabbit.com/*
// @match        https://app.powerbi.com/*
// @updateURL 	 https://github.com/mrudiy/Anti-Fraud-Extension/raw/main/Anti-Fraud%20Extension.user.js
// @downloadURL  https://github.com/mrudiy/Anti-Fraud-Extension/raw/main/Anti-Fraud%20Extension.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @connect      admin.777.ua
// @connect      ip-api.com
// @connect      admin.vegas.ua
// @connect      admin.betking.com.ua
// @connect      admin.wildwinz.com
// @connect      admin.funrize.com
// @connect      admin.nolimitcoins.com
// @connect      admin.taofortune.com
// @connect      admin.funzcity.com
// @connect      admin.wildwinz.com
// @connect      admin.fortunewheelz.com
// @connect      admin.jackpotrabbit.com
// @connect      api.easypay.ua
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jsrsasign/10.5.17/jsrsasign-all-min.js
// @require      https://cdn.jsdelivr.net/npm/moment/moment.min.js
// @require      https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.7.1/sweetalert2.all.min.js
// @resource     SWEETALERT2_CSS https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.7.1/sweetalert2.min.css
// ==/UserScript==

(function() {
    'use strict';

    const API_BASE_URL = 'https://vps65001.hyperhost.name';

    let popupBox;
    const currentUrl = window.location.href;
    const initialsKey = 'userInitials';
    const urlPath = window.location.pathname;
    const userId = urlPath.split('/')[4];
    const ProjectUrl = {
        '777.ua': 'https://admin.777.ua/',
        'vegas.ua': 'https://admin.vegas.ua/',
        'wildwinz.com': 'https://admin.wildwinz.com/',
        'com.ua': 'https://admin.betking.com.ua/',
    }[window.location.hostname.split('.').slice(-2).join('.')] || 'https://admin.default.ua/';
    const initialUrl = window.location.href;

    const sharedStorageKey = 'highlightRulesShared';
    const languageKey = 'language';
    const ndfDisplayKey = 'ndfDisplay';
    const reminderBlinkKey = 'reminderDisplayBlinkKey';
    const lastSeenArticleIdKey = 'lastSeenArticleId';
    const amountDisplayKey = 'amountDisplay';
    const pendingButtonsDisplayKey = 'pendingButtonsDisplay';
    const reminderDisplayKey = 'reminderDisplay';
    const autoPaymentsDisplayKey = 'autoPaymentsDisplay';
    const fastPaintCardsDisplayKey = 'fastPaintCardsDisplay';
    const fullNumberCardDisplayKey = 'fullNumberCardDisplay';
    const token = GM_getValue('authToken', null);

    const currencySymbols = new Map([
        ['UAH', '₴'],
        ['CAD', '$'],
        ['EUR', '€']
    ]);
    const currentVersion = "6.4";

    const stylerangePicker = document.createElement('style');
    stylerangePicker.textContent = '@import url("https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.css");';
    document.head.appendChild(stylerangePicker);


    const months = {
        "січня": "01", "января": "01",
        "лютого": "02", "февраля": "02",
        "березня": "03", "марта": "03",
        "квітня": "04", "апреля": "04",
        "травня": "05", "мая": "05",
        "червня": "06", "июня": "06",
        "липня": "07", "июля": "07",
        "серпня": "08", "августа": "08",
        "вересня": "09", "сентября": "09",
        "жовтня": "10", "октября": "10",
        "листопада": "11", "ноября": "11",
        "грудня": "12", "декабря": "12"
    };

    const defaultRules = [
        { text: 'Ввод средств', color: '#7cfc00' },
        { text: 'Вывод средств', color: '#f0e68c' },
        { text: 'Отыгрывание бонуса', color: '#ff69b4' },
        { text: 'Начисление cashback', color: '#ff69b4' },
        { text: 'Присвоение бонуса', color: '#1e90ff' },
        { text: 'Отмена', color: '#ff4500' }
    ];

    function getRules() {
        const rules = localStorage.getItem(sharedStorageKey);
        return rules ? JSON.parse(rules) : defaultRules;
    }

    function saveRules(rules) {
        localStorage.setItem(sharedStorageKey, JSON.stringify(rules));
    }

    function getCurrentDate() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${day}.${month}.${year}`;
    }

    function getProject() {
        const url = window.location.href;
        const match = url.match(/admin\.([^.]+)\./);
        return match ? match[1] : null;
    }

    const style = document.createElement('style');
    style.id = 'dynamic-styles';
    document.head.append(style);

    function applyBackgroundColor(row, color) {
        if (row.style.backgroundColor !== color) {
            row.style.backgroundColor = color;
        }
    }

    function updateColors() {
        const rules = getRules();
        let newStyleContent = `
            tr td {
                background-color: transparent !important;
            }
            #color-popup {
                position: fixed;
                top: 10px;
                right: 10px;
                background: white;
                border: 1px solid #ccc;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                padding: 20px;
                z-index: 1000;
                display: none;
                width: 350px;
                font-family: Arial, sans-serif;
            }
            #color-popup h2 {
                margin-top: 0;
                font-size: 18px;
                text-align: center;
            }
            #color-popup input[type="color"], #color-popup input[type="text"] {
                margin: 5px 0;
                display: block;
                width: calc(100% - 12px);
                padding: 5px;
                border-radius: 5px;
                border: 1px solid #ccc;
                font-size: 14px;
            }
            #color-popup input[type="color"] {
                height: 30px;
            }
            #color-popup button {
                display: block;
                width: calc(100% - 20px);
                margin: 10px auto;
                padding: 10px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.3s;
            }
            #color-popup button:hover {
                background: #0056b3;
            }
            .delete-rule {
                background: #dc3545 !important;
            }
            .delete-rule:hover {
                background: #c82333 !important;
            }
            .popup-rule {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            .popup-rule input {
                flex-grow: 1;
                margin-right: 5px;
            }
            .popup-rule button {
                margin: 0;
                width: auto;
                padding: 5px;
                font-size: 12px;
            }
            .toggle-popup-button {
                position: fixed;
                top: 10px;
                right: 10px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 5px;
                padding: 10px;
                cursor: pointer;
                z-index: 1000;
                font-size: 14px;
                transition: background 0.3s;
            }
            .toggle-popup-button:hover {
                background: #218838;
            }
        `;

        document.getElementById('dynamic-styles').textContent = newStyleContent;
        processTableRows();
    }

    function processTableRows() {
        const rules = getRules();
        const rows = document.querySelectorAll('table.items.table.table-striped.table-hover tbody tr');
        const batchSize = 50;
        let index = 0;

        function processBatch() {
            const end = Math.min(index + batchSize, rows.length);

            for (; index < end; index++) {
                const row = rows[index];
                const cells = row.querySelectorAll('td');
                let colorApplied = false;

                cells.forEach(cell => {
                    rules.forEach(rule => {
                        if (cell.textContent.includes(rule.text)) {
                            applyBackgroundColor(row, rule.color);
                            colorApplied = true;
                        }
                    });
                });

                if (!colorApplied) {
                    row.style.backgroundColor = '';
                }
            }

            if (index < rows.length) {
                requestAnimationFrame(processBatch);
            }
        }

        requestAnimationFrame(processBatch);
    }

    function createTransactionsPopup() {
        const rules = getRules();
        const popup = document.createElement('div');
        popup.id = 'color-popup';
        let rulesHtml = '<h2>Керування кольорами</h2>';

        rules.forEach((rule, index) => {
            rulesHtml += `
                <div class="popup-rule" data-index="${index}">
                    <input type="text" value="${rule.text}" class="rule-text" placeholder="Текст">
                    <input type="color" value="${rule.color}" class="rule-color">
                    <button class="delete-rule">Видалити</button>
                </div>
            `;
        });

        popup.innerHTML = `
            ${rulesHtml}
            <button id="add-rule">Додати правило</button>
            <button id="save-rules">Зберегти</button>
            <button id="close-popup">Закрити</button>
        `;

        document.body.append(popup);

        document.querySelectorAll('.delete-rule').forEach(button => {
            button.addEventListener('click', event => {
                const index = event.target.parentElement.getAttribute('data-index');
                rules.splice(index, 1);
                saveRules(rules);
                updateTransactionsPopup();
                updateColors();
            });
        });

        document.getElementById('add-rule').addEventListener('click', () => {
            rules.push({ text: '', color: '#ffffff' });
            saveRules(rules);
            updateTransactionsPopup();
        });

        document.getElementById('save-rules').addEventListener('click', () => {
            document.querySelectorAll('.popup-rule').forEach(div => {
                const index = div.getAttribute('data-index');
                rules[index].text = div.querySelector('.rule-text').value;
                rules[index].color = div.querySelector('.rule-color').value;
            });
            saveRules(rules);
            updateColors();
        });

        document.getElementById('close-popup').addEventListener('click', () => {
            popup.style.display = 'none';
            document.querySelector('.toggle-popup-button').style.display = 'block';
        });
    }

    async function checkForNewArticles() {
        const articles = await fetchArticles();


        if (articles.length > 0) {
            const latestArticle = articles[0];
            const lastSeenArticleId = GM_getValue(lastSeenArticleIdKey);
            if (latestArticle.id > lastSeenArticleId) {
                GM_setValue(lastSeenArticleIdKey, latestArticle.id);
                GM_setValue(reminderBlinkKey, true);
                return true;
            }
        }
        return false;
    }

    function updateTransactionsPopup() {
        const popup = document.getElementById('color-popup');
        if (popup) {
            document.body.removeChild(popup);
        }
        createTransactionsPopup();
        document.getElementById('color-popup').style.display = 'block';
    }

    function initTransactionsPage() {
        const togglePopupButton = document.createElement('button');
        togglePopupButton.textContent = 'Керувати кольорами';
        togglePopupButton.className = 'toggle-popup-button';
        document.body.append(togglePopupButton);

        togglePopupButton.addEventListener('click', () => {
            const popup = document.getElementById('color-popup');
            if (popup) {
                popup.style.display = 'block';
                togglePopupButton.style.display = 'none';
            } else {
                createTransactionsPopup();
                document.getElementById('color-popup').style.display = 'block';
                togglePopupButton.style.display = 'none';
            }
        });

        updateColors();
    }

    function getCurrentDateFormatted() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${day}${month}${year}`;
    }

    function insertTextAtCursor(text) {
        const div = document.getElementById('gateway-method-description-visible-common');
        if (div) {
            div.focus();
            document.execCommand('insertHTML', false, text);
            syncFields(div.innerHTML, 'common');
        }
    }

    function addForeignButton() {
        const currentLanguage = GM_getValue(languageKey, 'російська');
        const formatableTextDiv = document.getElementById('formatable-text-common');
        if (formatableTextDiv) {
            const isRussian = currentLanguage === 'російська';
            const text = isRussian ? 'Чужая' : 'Чужа';
            const innerText = `${getCurrentDateFormatted()} <b><font color="#ff0000">${text.toUpperCase()}</font></b>`;

            const foreignButton = document.createElement('button');
            foreignButton.type = 'button';
            foreignButton.innerText = text;
            foreignButton.onclick = () => insertTextAtCursor(innerText);

            formatableTextDiv.insertBefore(foreignButton, formatableTextDiv.firstChild);
        }
    }

    function addExcludeButton() {
        const formatableTextDiv = document.getElementById('formatable-text-antifraud_manager');

        if (formatableTextDiv) {
            const existingButton = document.getElementById('exclude-button');
            if (existingButton) {
                existingButton.remove();
            }

            const excludeButton = document.createElement('button');
            excludeButton.id = 'exclude-button';
            excludeButton.type = 'button';
            excludeButton.innerHTML = 'Виключити з моніторингу';
            excludeButton.title = 'Виключити з моніторингу';
            excludeButton.style.marginLeft = '5px';

            excludeButton.onclick = () => {
                const date = getCurrentDate();
                const time = getCurrentTime();
                const initials = GM_getValue(initialsKey);
                let textToInsert = `${date} в ${time} виключений з моніторингу/${initials}<br>`;

                insertTextIntoField(textToInsert);
            };

            const boldButton = formatableTextDiv.querySelector('button[onclick="makeBold()"]');
            if (boldButton) {
                boldButton.insertAdjacentElement('afterend', excludeButton);
            }
        }
    }


    function addCheckButton(TotalPA, Balance, totalPending) {
        const formatableTextDiv = document.getElementById('formatable-text-antifraud_manager');

        if (formatableTextDiv) {
            const existingButton = document.getElementById('check-button');
            if (existingButton) {
                existingButton.remove();
            }

            const existingGreenButton = document.getElementById('green-button');
            if (existingGreenButton) {
                existingGreenButton.remove();
            }

            const checkButton = document.createElement('button');
            checkButton.id = 'check-button';
            checkButton.type = 'button';
            checkButton.innerText = 'Коментар';
            checkButton.onclick = () => {
                const date = getCurrentDate();
                const time = getCurrentTime();
                const initials = GM_getValue(initialsKey);
                const currentLanguage = GM_getValue(languageKey, 'російська');
                const colorPA = TotalPA < 0.75 ? 'green' : (TotalPA >= 0.75 && TotalPA < 1 ? 'orange' : 'red');
                const formattedBalance = formatAmount(Balance);
                const formattedTotalPending = formatAmount(totalPending);
                const currency = getCurrency();
                let currencySymbol = currencySymbols.get(currency) || '';

                const safeBalance = getInnerBalanceValue();
                const formattedSafeBalance = formatAmount(safeBalance);

                let textToInsert = `${date} в ${time} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | `;

                if (currentLanguage === 'українська') {
                    if (Balance > 1000) {
                        const balanceStyle = Balance > 1000000 ? 'color: red;' : '';
                        textToInsert += `<b>На балансі:</b> <b style="${balanceStyle}">${formattedBalance}${currencySymbol}</b> | `;
                    }

                    if (totalPending > 1) {
                        const pendingStyle = totalPending > 1000000 ? 'color: red;' : '';
                        textToInsert += `<b>На виплаті:</b> <b style="${pendingStyle}">${formattedTotalPending}${currencySymbol} </b>| `;
                    }

                    if (safeBalance >= 4200) {
                        const safeStyle = safeBalance > 1000000 ? 'color: red;' : '';
                        textToInsert += `<b>В сейфі:</b> <b style="${safeStyle}">${formattedSafeBalance}${currencySymbol}</b> | `;
                    }
                } else {
                    if (Balance > 1000) {
                        const balanceStyle = Balance > 1000000 ? 'color: red;' : '';
                        textToInsert += `<b>На балансе:</b> <b style="${balanceStyle}">${formattedBalance}${currencySymbol}</b> | `;
                    }

                    if (totalPending > 1000) {
                        const pendingStyle = totalPending > 1000000 ? 'color: red;' : '';
                        textToInsert += `<b>На выплате:</b> <b style="${pendingStyle}">${formattedTotalPending}${currencySymbol} </b>| `;
                    }

                    if (safeBalance >= 4200) {
                        const safeStyle = safeBalance > 1000000 ? 'color: red;' : '';
                        textToInsert += `<b>В сейфе:</b> <b style="${safeStyle}">${formattedSafeBalance}${currencySymbol}</b> | `;
                    }
                }

                insertTextIntoField(textToInsert);
            };

            const greenButton = document.createElement('button');
            greenButton.id = 'green-button';
            greenButton.type = 'button';
            greenButton.innerText = 'Green';
            greenButton.style.marginLeft = '5px';
            greenButton.onclick = () => {
                document.execCommand('foreColor', false, 'green');
            };

            formatableTextDiv.insertBefore(checkButton, formatableTextDiv.firstChild);
            formatableTextDiv.insertBefore(greenButton, checkButton.nextSibling);
        }
    }



    function addFraudPageButton(isInFraudList, fraudId = null) {
        const container = document.querySelector('.form-actions');
        if (container) {
            let button = document.querySelector('#fraud-button');
            if (!button) {
                button = document.createElement('button');
                button.id = 'fraud-button';
                container.appendChild(button);

                const style = document.createElement('style');
                style.textContent = `
            #fraud-button {
                background-color: purple;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin-right: 25px;
                margin-left: 10px;
            }
            #fraud-button i {
                margin-right: 5px;
            }
        `;
                document.head.appendChild(style);
            }

            if (isInFraudList) {
                button.innerHTML = '<i class="fa fa-eye-slash"></i> Видалити';
                button.onclick = async (event) => {
                    event.preventDefault();
                    if (fraudId) {
                        await deleteFraud(fraudId);
                        location.reload();
                    }
                };
            } else {
                button.innerHTML = '<i class="fa fa-eye"></i> Під нагляд';
                button.onclick = async (event) => {
                    event.preventDefault();
                    const comment = await Swal.fire({
                        title: 'Введіть коментар',
                        input: 'text',
                        inputPlaceholder: 'Ваш коментар',
                        showCancelButton: true,
                        confirmButtonText: 'Додати',
                        cancelButtonText: 'Скасувати',
                    }).then(result => result.value);

                    if (comment) {
                        const playerId = getPlayerID();
                        const url = window.location.href;
                        await addFraud(playerId, url, comment);
                        location.reload();
                    }
                };
            }
        }
    }

    const COMBINED_STYLES = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    #popup-container {
        min-height: 200px;
        overflow-y: auto;
        white-space: normal;
        word-wrap: break-word;
        font-family: Arial, sans-serif;
    }
    .profit-section {
        margin: 10px 0;
        padding: 10px;
        border-radius: 5px;
        background-color: #f9f9f9;
        text-align: justify;
    }
    .main-profit {
        border-bottom: 2px solid #3498db;
    }
    .related-projects {
        border-bottom: 1px dashed #ccc;
    }
    .total-profit {
        background-color: #e6f3ff;
        font-weight: bold;
    }
    .project-link {
        color: #2c3e50;
        text-decoration: none;
        font-weight: bold;
    }
    .project-link:hover {
        text-decoration: underline;
        color: #3498db;
    }
`;

    async function checkUserInFraudList() {

        const playerId = getPlayerID();
        const url = window.location.href;

        try {
            const response = await fetch('https://vps65001.hyperhost.name/api/check_user_in_fraud', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ player_id: playerId, url: url })
            });

            const data = await response.json();

            if (data.fraudExists) {

                const formattedDate = new Intl.DateTimeFormat('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(new Date(data.date)).replace(',', '')

                addFraudPageButton(true, data.fraud_id);
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-warning';
                alertDiv.style.backgroundColor = '#6a0dad';
                alertDiv.style.color = '#fff';
                alertDiv.style.borderColor = '#5a00a2';
                console.log(data)
                alertDiv.innerHTML = `
                <strong>Увага!</strong> Користувач під наглядом.
                <br><strong>Менеджер:</strong> ${data.manager_name}
                <br><strong>Коментар:</strong> ${data.comment || 'Немає коментарів'}
                <br><strong>Дата:</strong> ${formattedDate}
            `;

                const table = document.querySelector('.detail-view.table.table-striped');

                if (table) {
                    table.parentNode.insertBefore(alertDiv, table);
                } else {
                    console.error('Таблица не найдена.');
                }
            } else {
                addFraudPageButton(false);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function getDateFromField() {
        const content = document.getElementById("gateway-method-description-visible-antifraud_manager").innerText;
        const firstLine = content.split('\n')[0];
        const dateRegex = /\d{2}\.\d{2}\.\d{4}/;
        const dateMatch = firstLine.match(dateRegex);
        return dateMatch ? dateMatch[0] : null;
    }

    function correctData(dateString) {
        if (!dateString) return null;
        const [day, month, year] = dateString.split('.').map(Number);
        return new Date(year, month - 1, day);
    }

    const parseDateCheck = dateString => {
        if (!dateString || typeof dateString !== 'string') return null;

        if (dateString.includes('-')) {
            const [year, month, day] = dateString.split('-');
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else if (dateString.includes('.')) {
            const [day, month, year] = dateString.split('.');
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        return null;
    };

    const formatDateToDDMMYYYY = date => {
        if (!date || isNaN(date.getTime())) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // +1, так как месяцы 0-11
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    async function checkUserInChecklist() {

        const playerId = getPlayerID();
        const url = window.location.href;

        try {
            const response = await fetch('https://vps65001.hyperhost.name/api/check_user_in_checklsit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ player_id: playerId, url })
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();

            const dataDate = parseDateCheck(data.date);
            const dateFromField = parseDateCheck(getDateFromField());
            const currentDate = parseDateCheck(getCurrentDate());

            const isCheckedToday = (dataDate && currentDate && dataDate.getTime() === currentDate.getTime()) ||
                  (dateFromField && currentDate && dateFromField.getTime() === currentDate.getTime());

            if (data.checklistExists && dataDate && (dateFromField <= dataDate || currentDate <= dataDate)) {
                const alertDiv = document.createElement('div');
                applyStyles(alertDiv, {
                    backgroundColor: '#7fff00',
                    color: '#000000',
                    border: '1px solid #5a00a2',
                    padding: '10px',
                    margin: '10px 0'
                });
                alertDiv.className = 'alert alert-warning';
                alertDiv.innerHTML = `
                <strong>Користувач переглянутий.</strong>
                <br><strong>Менеджер:</strong> ${data.manager_name}
                <br><strong>Дата перегляду:</strong> ${formatDateToDDMMYYYY(dataDate)} в ${data.time}`;

                const table = document.querySelector('.detail-view.table.table-striped');
                if (table) {
                    table.parentNode.insertBefore(alertDiv, table);
                    console.log('Alert added to DOM');
                } else {
                    console.error('Таблиця не знайдена.');
                    document.body.insertBefore(alertDiv, document.body.firstChild); // Добавляем в body, если таблицы нет
                }
            }

            return { isCheckedToday };
        } catch (error) {
            console.error('Ошибка в checkUserInChecklist:', error);
            return { isCheckedToday: false };
        }
    }

    function createSettingsPopup() {
        const settingsPopup = document.createElement('div');
        settingsPopup.style.position = 'fixed';
        settingsPopup.style.top = '10px';
        settingsPopup.style.right = '10px';
        settingsPopup.style.padding = '20px';
        settingsPopup.style.backgroundColor = '#f9f9f9';
        settingsPopup.style.border = '1px solid #ccc';
        settingsPopup.style.boxShadow = '0px 0px 15px rgba(0, 0, 0, 0.2)';
        settingsPopup.style.zIndex = '10001';
        settingsPopup.style.fontFamily = 'Arial, sans-serif';
        settingsPopup.style.fontSize = '14px';
        settingsPopup.style.borderRadius = '8px';

        const header = document.createElement('h2');
        header.innerText = 'Налаштування';
        header.style.fontWeight = 'bold';
        header.style.fontSize = '18px';
        header.style.marginBottom = '15px';
        settingsPopup.appendChild(header);

        const initialsDisplay = document.createElement('p');
        const userInitials = GM_getValue(initialsKey, '');
        initialsDisplay.innerText = `Ваші ініціали: ${userInitials}`;
        initialsDisplay.style.marginBottom = '10px';
        settingsPopup.appendChild(initialsDisplay);

        const languageDisplay = document.createElement('p');
        let currentLanguage = GM_getValue(languageKey, 'російська');
        languageDisplay.innerText = `Встановлена мова: ${currentLanguage}`;
        languageDisplay.style.marginBottom = '10px';
        settingsPopup.appendChild(languageDisplay);

        const shortcutKeyDisplay = document.createElement('p');
        const savedShortcut = GM_getValue('dateShortcut', 'не задано');
        shortcutKeyDisplay.innerText = `Вставка дати: ${savedShortcut}`;
        shortcutKeyDisplay.style.marginBottom = '20px';
        settingsPopup.appendChild(shortcutKeyDisplay);

        const createCheckboxWithLabel = (labelText, isChecked, onChange) => {
            const label = document.createElement('label');
            label.style.display = 'block';
            label.style.marginBottom = '10px';
            label.style.cursor = 'pointer';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = isChecked;
            checkbox.style.marginRight = '10px';
            checkbox.addEventListener('change', onChange);

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(labelText));
            return label;
        };

        settingsPopup.appendChild(
            createCheckboxWithLabel('Показувати НДФЛ', GM_getValue(ndfDisplayKey, true), (e) => {
                GM_setValue(ndfDisplayKey, e.target.checked);
            })
        );

        settingsPopup.appendChild(
            createCheckboxWithLabel('Округляти баланси', GM_getValue(amountDisplayKey, true), (e) => {
                GM_setValue(amountDisplayKey, e.target.checked);
            })
        );

        settingsPopup.appendChild(
            createCheckboxWithLabel('Кнопки Pending', GM_getValue(pendingButtonsDisplayKey, true), (e) => {
                GM_setValue(pendingButtonsDisplayKey, e.target.checked);
            })
        );

        settingsPopup.appendChild(
            createCheckboxWithLabel('Відображати пам`ятку', GM_getValue(reminderDisplayKey, true), (e) => {
                GM_setValue(reminderDisplayKey, e.target.checked);
            })
        );
        settingsPopup.appendChild(
            createCheckboxWithLabel('Кнопка автовиплат', GM_getValue(autoPaymentsDisplayKey, true), (e) => {
                GM_setValue(autoPaymentsDisplayKey, e.target.checked);
            })
        );
        settingsPopup.appendChild(
            createCheckboxWithLabel('Швидкий покрас карток', GM_getValue(fastPaintCardsDisplayKey, true), (e) => {
                GM_setValue(fastPaintCardsDisplayKey, e.target.checked);
            })
        );
        settingsPopup.appendChild(
            createCheckboxWithLabel('Відображати повний номер карток у масках', GM_getValue(fullNumberCardDisplayKey, true), (e) => {
                GM_setValue(fullNumberCardDisplayKey, e.target.checked);
            })
        );

        const createButton = (text, bgColor, onClick) => {
            const button = document.createElement('button');
            button.innerText = text;
            button.style.padding = '10px 20px';
            button.style.backgroundColor = bgColor;
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '4px';
            button.style.cursor = 'pointer';
            button.style.marginRight = '10px';
            button.style.marginTop = '10px';
            button.style.transition = 'background-color 0.3s';
            button.addEventListener('click', onClick);
            return button;
        };

        settingsPopup.appendChild(
            createButton('Вказати ініціали', '#4CAF50', () => {
                const userInitials = prompt('Введіть свої ініціали (наприклад, РМ):', GM_getValue(initialsKey, ''));
                if (userInitials !== null) {
                    GM_setValue(initialsKey, userInitials);
                    initialsDisplay.innerText = `Ваші ініціали: ${userInitials}`;
                }
            })
        );

        const languageButton = createButton(`Змінити мову на ${currentLanguage === 'російська' ? 'українська' : 'російська'}`, '#2196F3', () => {
            currentLanguage = currentLanguage === 'російська' ? 'українська' : 'російська';
            GM_setValue(languageKey, currentLanguage);
            languageDisplay.innerText = `Встановлена мова: ${currentLanguage}`;
            languageButton.innerText = `Змінити мову на ${currentLanguage === 'російська' ? 'українська' : 'російська'}`;
        });

        settingsPopup.appendChild(languageButton);

        settingsPopup.appendChild(
            createButton('Змінити пароль', '#FF5722', () => {
                const newPassword = prompt('Введіть новий пароль:');


                if (newPassword) {
                    fetch('https://vps65001.hyperhost.name/api/change_password_by_user', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ password: newPassword }),
                    })
                        .then(response => {
                        if (response.ok) {
                            alert('Пароль успішно змінено');
                        } else {
                            alert('Сталася помилка при зміні пароля');
                        }
                    })
                        .catch(error => {
                        console.error('Помилка:', error);
                        alert('Сталася помилка при зміні пароля');
                    });
                }
            })
        );

        function getShortcutFromEvent(event) {
            const keys = [];
            if (event.ctrlKey) keys.push('CTRL');
            if (event.altKey) keys.push('ALT');
            if (event.shiftKey) keys.push('SHIFT');
            keys.push(event.code);
            return keys.join(' + ');
        }

        settingsPopup.appendChild(
            createButton('Задати клавіші', '#FF9800', () => {
                alert('Після натискання на "ОК" натисніть бажане поєднання клавіш');
                document.addEventListener('keydown', function captureShortcut(event) {
                    const shortcut = getShortcutFromEvent(event);
                    GM_setValue('dateShortcut', shortcut);
                    shortcutKeyDisplay.innerText = `Вставка дати: ${shortcut}`;
                    document.removeEventListener('keydown', captureShortcut);
                });
            })
        );

        settingsPopup.appendChild(
            createButton('Закрити', '#f44336', () => {
                document.body.removeChild(settingsPopup);
            })
        );

        document.body.appendChild(settingsPopup);
    }



    function calculatePendingAmount() {
        let totalPending = 0;

        const rows = document.querySelectorAll('tr');
        rows.forEach(row => {
            const statusSpan = row.querySelector('span.label');
            if (statusSpan && (statusSpan.textContent.trim() === 'pending' || statusSpan.textContent.trim() === 'review' || statusSpan.textContent.trim() === 'on_hold')) {
                const amountCode = row.querySelector('td:nth-child(5) code');
                if (amountCode) {
                    const amountText = amountCode.textContent.trim().replace('UAH', '').trim();
                    const amount = parseFloat(amountText.replace(',', '.'));
                    if (!isNaN(amount)) {
                        totalPending += amount;
                    }
                }
            }
        });

        const popupBoxWithDraw = document.createElement('div');
        popupBoxWithDraw.style.position = 'fixed';
        popupBoxWithDraw.style.top = '10px';
        popupBoxWithDraw.style.right = '10px';
        popupBoxWithDraw.style.padding = '10px';
        popupBoxWithDraw.style.backgroundColor = 'white';
        popupBoxWithDraw.style.border = '2px solid black';
        popupBoxWithDraw.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
        popupBoxWithDraw.style.zIndex = '10000';
        popupBoxWithDraw.style.fontFamily = 'Arial, sans-serif';
        popupBoxWithDraw.style.fontSize = '16px';
        popupBoxWithDraw.style.display = 'flex';
        popupBoxWithDraw.style.flexDirection = 'column';
        popupBoxWithDraw.style.alignItems = 'center';
        popupBoxWithDraw.style.borderRadius = '10px';

        const text = document.createElement('div');
        text.innerHTML = `<center><b>Сума pending: ${totalPending.toFixed(2)}₴</b></center>`;
        popupBoxWithDraw.appendChild(text);

        document.body.appendChild(popupBoxWithDraw);
    }

    function calculatePendingAmountUSA() {
        let totalPending = 0;

        const rows = document.querySelectorAll('tr');
        rows.forEach(row => {
            const statusSpan = row.querySelector('span.label');
            if (statusSpan && (statusSpan.textContent.trim() === 'pending' || statusSpan.textContent.trim() === 'review' || statusSpan.textContent.trim() === 'on_hold')) {
                const amountCode = row.querySelector('td:nth-child(6) code');
                if (amountCode) {
                    const amountText = amountCode.textContent.trim().replace('USD', '').trim();
                    const amount = parseFloat(amountText.replace(',', '.'));
                    if (!isNaN(amount)) {
                        totalPending += amount;
                    }
                }
            }
        });

        const popupBoxWithDraw = document.createElement('div');
        popupBoxWithDraw.style.position = 'fixed';
        popupBoxWithDraw.style.top = '10px';
        popupBoxWithDraw.style.right = '10px';
        popupBoxWithDraw.style.padding = '10px';
        popupBoxWithDraw.style.backgroundColor = 'white';
        popupBoxWithDraw.style.border = '2px solid black';
        popupBoxWithDraw.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
        popupBoxWithDraw.style.zIndex = '10000';
        popupBoxWithDraw.style.fontFamily = 'Arial, sans-serif';
        popupBoxWithDraw.style.fontSize = '16px';
        popupBoxWithDraw.style.display = 'flex';
        popupBoxWithDraw.style.flexDirection = 'column';
        popupBoxWithDraw.style.alignItems = 'center';
        popupBoxWithDraw.style.borderRadius = '10px';

        const text = document.createElement('div');
        text.innerHTML = `<center><b>Сума pending: ${totalPending.toFixed(2)}$</b></center>`;
        popupBoxWithDraw.appendChild(text);

        document.body.appendChild(popupBoxWithDraw);
    }

    function calculatePendingAmountWildWinz() {
        let totalPendingCAD = 0;
        let totalPendingEUR = 0;

        const rows = document.querySelectorAll('tr');
        rows.forEach(row => {
            const statusSpan = row.querySelector('span.label');
            if (statusSpan && (statusSpan.textContent.trim() === 'pending' || statusSpan.textContent.trim() === 'review' || statusSpan.textContent.trim() === 'on_hold')) {
                const amountCode = row.querySelector('td:nth-child(5) code');
                if (amountCode) {
                    const amountText = amountCode.textContent.trim();
                    const amount = parseFloat(amountText.replace(',', '.').replace(/[^\d.-]/g, '')); // Очистка от валюты и посторонних символов
                    if (!isNaN(amount)) {
                        if (amountText.includes('CAD')) {
                            totalPendingCAD += amount;
                        } else if (amountText.includes('EUR')) {
                            totalPendingEUR += amount;
                        }
                    }
                }
            }
        });

        const popupBoxWithDraw = document.createElement('div');
        popupBoxWithDraw.style.position = 'fixed';
        popupBoxWithDraw.style.top = '10px';
        popupBoxWithDraw.style.right = '10px';
        popupBoxWithDraw.style.padding = '10px';
        popupBoxWithDraw.style.backgroundColor = 'white';
        popupBoxWithDraw.style.border = '2px solid black';
        popupBoxWithDraw.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
        popupBoxWithDraw.style.zIndex = '10000';
        popupBoxWithDraw.style.fontFamily = 'Arial, sans-serif';
        popupBoxWithDraw.style.fontSize = '16px';
        popupBoxWithDraw.style.display = 'flex';
        popupBoxWithDraw.style.flexDirection = 'column';
        popupBoxWithDraw.style.alignItems = 'center';
        popupBoxWithDraw.style.borderRadius = '10px';

        const textCAD = document.createElement('div');
        textCAD.innerHTML = `<center><b>Сума pending CAD: ${totalPendingCAD.toFixed(2)}$</b></center>`;
        popupBoxWithDraw.appendChild(textCAD);

        const textEUR = document.createElement('div');
        textEUR.innerHTML = `<center><b>Сума pending EUR: ${totalPendingEUR.toFixed(2)}€</b></center>`;
        popupBoxWithDraw.appendChild(textEUR);

        document.body.appendChild(popupBoxWithDraw);
    }

    function createPopup(id, headerText, content, onClose) {
        if (document.getElementById(id)) {
            return;
        }

        const popup = document.createElement('div');
        popup.id = id;
        popup.className = 'custom-popup';
        popup.innerHTML = `
        <div class="popup-header">
            ${headerText}
            <span class="close-btn">&times;</span>
        </div>
        <div class="popup-content">
            ${content}
        </div>
        <div class="popup-resize-handle"></div> <!-- Ручка для изменения размера -->
    `;
        document.body.appendChild(popup);

        enableResize(popup);

        popup.querySelector('.close-btn').addEventListener('click', () => {
            popup.remove();
            if (onClose) onClose();
        });

        dragElement(popup);
    }

    function enableResize(popup) {
        const resizeHandle = popup.querySelector('.popup-resize-handle');

        let startX, startY, startWidth, startHeight;

        resizeHandle.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(popup).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(popup).height, 10);
            document.documentElement.addEventListener('mousemove', resizePopup, false);
            document.documentElement.addEventListener('mouseup', stopResizePopup, false);
        });

        function resizePopup(e) {
            popup.style.width = (startWidth + e.clientX - startX) + 'px';
            popup.style.height = (startHeight + e.clientY - startY) + 'px';
        }

        function stopResizePopup() {
            document.documentElement.removeEventListener('mousemove', resizePopup, false);
            document.documentElement.removeEventListener('mouseup', stopResizePopup, false);
        }
    }



    function createAdminPopup() {
        const content = `
    <table id="admin-popup-table">
        <thead>
            <tr>
                <th>Ім'я</th>
                <th>Статус</th>
                <th><i class="fa fa-user" title='Кількість опрацьованих'></i></th>
                <th><i class="fa fa-eye" title='Кількість переглянуитих'></i></th>
                <th><center><i class="fa fa-chrome" title='Остання вкладка'></i></center></th>
                <th class="actions">Дії</th>
            </tr>
        </thead>
        <tbody id="users-list"></tbody>
    </table>
    <button id="add-user-btn">Додати користувача</button>
    <button id="alerts-settings-btn">Налаштування Alerts</button>
    `;
        createPopup('admin-popup', 'Менеджери', content, () => {});

        loadUsers();

        document.getElementById('add-user-btn').addEventListener('click', createRegisterPopup);
        document.getElementById('alerts-settings-btn').addEventListener('click', createAlertSettingsPopup);
    }

    function loadQuillResources() {
        const quillCSS = document.createElement('link');
        quillCSS.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
        quillCSS.rel = 'stylesheet';
        document.head.appendChild(quillCSS);

        const quillJS = document.createElement('script');
        quillJS.src = 'https://cdn.quilljs.com/1.3.6/quill.js';
        document.head.appendChild(quillJS);

        return new Promise((resolve) => {
            quillJS.onload = resolve; // Ждём загрузки скрипта
        });
    }

    async function createReminderPopup() {
        const status = await checkUserStatus();

        fetchArticles().then(articles => {
            let lastSeenArticleId = GM_getValue(lastSeenArticleIdKey);

            if (!lastSeenArticleId && articles.length > 0) {
                const lastArticle = articles[articles.length - 1];
                GM_setValue(lastSeenArticleIdKey, lastArticle.id);
                lastSeenArticleId = lastArticle.id;
            }
            let content = `
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .highlight-red { color: red; }
            .highlight-blue { color: blue; }
            .highlight-green { color: green; }
            .highlight-orange { color: orange; }
            ul { list-style-type: disc; margin-left: 20px; }

            /* Стилизация кнопок */
            .add-article-btn {
                background-color: #4CAF50; /* Зеленый */
                color: white;
                padding: 10px 20px;
                border: none;
                cursor: pointer;
                font-size: 16px;
                border-radius: 5px;
                margin: 5px 0;
                transition: background-color 0.3s ease;
            }
            .add-article-btn:hover {
                background-color: #45a049;
            }

            .save-article-btn {
                background-color: #2196F3; /* Синий */
                color: white;
                padding: 10px 20px;
                border: none;
                cursor: pointer;
                font-size: 16px;
                border-radius: 5px;
                margin: 5px 0;
                transition: background-color 0.3s ease;
            }
            .save-article-btn:hover {
                background-color: #1976D2;
            }

            .edit-article-btn {
                background-color: #FF9800; /* Оранжевый */
                color: white;
                padding: 10px 20px;
                border: none;
                cursor: pointer;
                font-size: 16px;
                border-radius: 5px;
                margin: 5px 0;
                transition: background-color 0.3s ease;
            }
            .edit-article-btn:hover {
                background-color: #FB8C00;
            }

            .delete-article-btn {
                background-color: #F44336; /* Красный */
                color: white;
                padding: 10px 20px;
                border: none;
                cursor: pointer;
                font-size: 16px;
                border-radius: 5px;
                margin: 5px 0;
                transition: background-color 0.3s ease;
            }
            .delete-article-btn:hover {
                background-color: #E53935;
            }

            /* Стилизация поля заголовка */
            input[type="text"] {
                width: 100%;
                padding: 10px;
                margin: 5px 0 20px 0;
                display: inline-block;
                border: 1px solid #ccc;
                border-radius: 4px;
                box-sizing: border-box;
                font-size: 16px;
            }

            /* Стилизация для контейнера редактора */
            #quill-editor {
                height: 300px; /* Увеличен размер редактора */
                margin-bottom: 20px;
            }

            /* Стилизация контейнеров статей */
            .article-container {
                margin-bottom: 20px;
                max-width: 1650px; /* Ограничение ширины контейнера */
                word-wrap: break-word; /* Перенос длинных слов */
                overflow-wrap: break-word; /* Поддержка переноса слов */
            }
        </style>
        `;

            if (status === 'Admin') {
                content += `<button class="add-article-btn" id="add-article-btn">Додати новину</button>`;
            }

            articles.forEach(article => {
                content += `
            <div class="article-container" data-id="${article.id}">
                <h3>${article.title}</h3>
                <div>${article.content}</div>
                ${status === 'Admin' ? `
                    <button class="edit-article-btn">Редагувати</button>
                    <button class="delete-article-btn">Видалити</button>
                ` : ''}
            </div>
            `;
            });

            createPopup('reminder', 'Дошка', content, () => {});

            if (status === 'Admin') {
                document.getElementById('add-article-btn').addEventListener('click', () => {
                    openArticleEditor();
                });

                document.querySelectorAll('.edit-article-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const articleId = e.target.closest('.article-container').dataset.id;
                        openArticleEditor(articleId);
                    });
                });

                document.querySelectorAll('.delete-article-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const articleId = e.target.closest('.article-container').dataset.id;
                        deleteArticle(articleId).then(() => {
                            Swal.fire('Видалено!', '', 'success');
                            closePopup('reminder');
                            createReminderPopup();
                        });
                    });
                });
            }
        });
    }

    function openArticleEditor(articleId = null) {
        let title = '';
        let content = '';

        if (articleId) {
            fetch(`https://vps65001.hyperhost.name/get_article/${articleId}`)
                .then(response => response.json())
                .then(article => {
                title = article.title;
                content = article.content;
                showEditorPopup(title, content, articleId);
            });
        } else {
            showEditorPopup(title, content);
        }
    }

    function showEditorPopup(title, content, articleId = null) {
        const editorContent = `
        <h3>Редагування</h3>
        <input type="text" id="article-title" value="${title}" placeholder="Заголовок" />
        <div id="quill-editor"></div>
        <button class="save-article-btn" id="save-article-btn">Зберегти</button>
    `;
        createPopup('editor', 'Редагування', editorContent, () => {});

        loadQuillResources().then(() => {
            const quill = new Quill('#quill-editor', {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'color': [] }, { 'background': [] }],
                        ['clean']
                    ]
                }
            });

            if (content) {
                quill.clipboard.dangerouslyPasteHTML(content);
            }

            document.getElementById('save-article-btn').addEventListener('click', () => {
                const newTitle = document.getElementById('article-title').value;
                const newContent = quill.root.innerHTML;

                if (articleId) {
                    updateArticle(articleId, newTitle, newContent).then(() => {
                        closePopup('editor');
                        Swal.fire('Збережено!', '', 'success');
                        closePopup('reminder');
                        createReminderPopup();
                    });
                } else {
                    saveArticle(newTitle, newContent).then(() => {
                        closePopup('editor');
                        Swal.fire('Додано!', '', 'success');
                        closePopup('reminder');
                        createReminderPopup();
                    });
                }
            });
        });
    }

    // Получение всех статей
    async function fetchArticles() {
        const response = await fetch('https://vps65001.hyperhost.name/get_articles');
        const data = await response.json();
        return data;
    }

    async function saveArticle(title, content) {
        const response = await fetch('https://vps65001.hyperhost.name/save_article', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                content: content
            })
        });
        const data = await response.json();
        return data;
    }

    async function updateArticle(articleId, title, content) {
        const response = await fetch(`https://vps65001.hyperhost.name/update_article/${articleId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                content: content
            })
        });
        const data = await response.json();
        return data;
    }

    async function deleteArticle(articleId) {
        const response = await fetch(`https://vps65001.hyperhost.name/delete_article/${articleId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        const lastSeenArticleId = GM_getValue(lastSeenArticleIdKey);
        GM_setValue(lastSeenArticleIdKey, lastSeenArticleId - 1);
        return data;
    }

    function closePopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.remove();
        }
    }

    function createFindPopUp() {
        const popupId = 'findPopup';

        const content = `
    <div class="search-container">
        <div class="input-group">
            <input type="text" id="searchSurnameInput" placeholder="Прізвище або ПІБ" class="search-input">
            <input type="text" id="searchIdInput" placeholder="ID гравця" class="search-input">
            <input type="text" id="searchPhoneInput" placeholder="Номер телефону" class="search-input">
            <input type="text" id="searchInnInput" placeholder="ІПН" class="search-input">
            <input type="text" id="searchEmailInput" placeholder="Пошта" class="search-input">
            <input type="text" id="searchNicknameInput" placeholder="Нікнейм" class="search-input">
        </div>
        <div class="button-group">
            <button id="searchBetkingBtn">Betking</button>
            <button id="searchVegasBtn">Vegas</button>
            <button id="search777Btn">777</button>
        </div>
        <div id="searchResults" class="search-results"></div>
    </div>
    `;

        const style = document.createElement('style');
        style.id = 'findPopupStyles';
        style.textContent = `
    .find-popup .search-container {
        padding: 15px;
    }
    .find-popup .input-group {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 15px;
    }
    .find-popup .search-input {
        flex: 1 1 30%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
        min-width: 200px;
    }
    .find-popup .button-group {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-bottom: 15px;
    }
    .find-popup .search-container button {
        padding: 10px 20px;
        border: none;
        border-radius: 25px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    .find-popup .search-container button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .find-popup .search-container button:active {
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
    .find-popup #searchBetkingBtn {
        background-color: #e63946;
        color: #ffd60a;
    }
    .find-popup #searchVegasBtn {
        background-color: #48cae4;
        color: #d00000;
    }
    .find-popup #search777Btn {
        background-color: #1d1d1d;
        color: #d00000;
    }
    .find-popup .search-results {
        margin-top: 10px;
        overflow-x: auto;
        overflow-y: auto;
        max-height: 550px;
    }
    .find-popup.custom-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 1px solid #ccc;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        min-width: 300px;
        min-height: 200px;
    }
    .find-popup .items.table {
        width: 100%;
        border-collapse: collapse;
    }
    .find-popup .items.table th, .find-popup .items.table td {
        padding: 8px;
        border: 1px solid #ddd;
    }
    .find-popup .popup-header {
        padding: 5px 10px;
        background: #f0f0f0;
        cursor: move;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .find-popup .close-btn {
        cursor: pointer;
        font-size: 20px;
    }
    .find-popup .popup-content {
        padding: 10px;
    }
    .find-popup .popup-resize-handle {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 10px;
        height: 10px;
        background: #ccc;
        cursor: se-resize;
    }
    `;
        document.head.appendChild(style);

        createPopup(popupId, 'Швидкий пошук', content);

        const popup = document.getElementById(popupId);
        popup.classList.add('find-popup');

        const searchSurnameInput = document.getElementById('searchSurnameInput');
        const searchIdInput = document.getElementById('searchIdInput');
        const searchPhoneInput = document.getElementById('searchPhoneInput');
        const searchInnInput = document.getElementById('searchInnInput');
        const searchEmailInput = document.getElementById('searchEmailInput');
        const searchNicknameInput = document.getElementById('searchNicknameInput');
        const searchBetkingBtn = document.getElementById('searchBetkingBtn');
        const searchVegasBtn = document.getElementById('searchVegasBtn');
        const search777Btn = document.getElementById('search777Btn');
        const searchResults = document.getElementById('searchResults');
        const ProjectUrl = {
            '777.ua': 'https://admin.777.ua/',
            'vegas.ua': 'https://admin.vegas.ua/',
            'wildwinz.com': 'https://admin.wildwinz.com/',
            'com.ua': 'https://admin.betking.com.ua/',
        }[window.location.hostname.split('.').slice(-2).join('.')] || 'https://admin.default.ua/';

        searchBetkingBtn.addEventListener('click', () => performSearch('betking'));
        searchVegasBtn.addEventListener('click', () => performSearch('vegas'));
        search777Btn.addEventListener('click', () => performSearch('777'));

        searchSurnameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const project = window.location.hostname.includes('777.ua') ? '777' :
                window.location.hostname.includes('vegas.ua') ? 'vegas' :
                'betking';
                performSearch(project);
            }
        });

        function decodeEmail(encoded) {
            if (!encoded) return '';
            const key = parseInt(encoded.substr(0, 2), 16);
            let email = '';
            for (let i = 2; i < encoded.length; i += 2) {
                const byte = parseInt(encoded.substr(i, 2), 16);
                email += String.fromCharCode(byte ^ key);
            }
            return email;
        }

        function decodeEmails(table) {
            const emailCells = table.querySelectorAll('td:nth-child(2)');
            emailCells.forEach(cell => {
                const emailLink = cell.querySelector('a.__cf_email__[data-cfemail]');
                if (emailLink) {
                    const encoded = emailLink.getAttribute('data-cfemail');
                    const decoded = decodeEmail(encoded);
                    cell.textContent = decoded;
                }
            });
        }

        function setLinksTargetBlank(table, projectUrl) {
            const links = table.querySelectorAll('td:nth-child(1) a');
            links.forEach(link => {
                const relativeHref = link.getAttribute('href');
                if (relativeHref) {
                    const absoluteUrl = `${projectUrl}${relativeHref.startsWith('/') ? relativeHref.slice(1) : relativeHref}`;
                    link.setAttribute('href', absoluteUrl);
                    link.setAttribute('target', '_blank');
                    console.log('Updated link:', link.href);
                }
            });
        }

        function performSearch(project) {
            const surnameTerm = searchSurnameInput.value.trim();
            const idTerm = searchIdInput.value.trim();
            const phoneTerm = searchPhoneInput.value.trim();
            const innTerm = searchInnInput.value.trim();
            const emailTerm = searchEmailInput.value.trim();
            const nicknameTerm = searchNicknameInput.value.trim();

            if (!surnameTerm && !idTerm && !phoneTerm && !innTerm && !emailTerm && !nicknameTerm) {
                searchResults.innerHTML = '<p>Введіть дані для пошуку в хоча б одне поле</p>';
                return;
            }

            popup.style.top = '50%';
            popup.style.left = '50%';
            popup.style.transform = 'translate(-50%, -50%)';

            const terms = surnameTerm.split(' ').filter(Boolean);
            let bodyData = '';

            const projectUrls = {
                'betking': 'https://admin.betking.com.ua/',
                'vegas': 'https://admin.vegas.ua/',
                '777': 'https://admin.777.ua/'
            };
            const projectUrl = projectUrls[project];
            if (!projectUrl) {
                console.error(`Не удалось определить projectUrl для проекта ${project}`);
                searchResults.innerHTML = '<p>Помилка: не вдалося визначити домен проекту</p>';
                return;
            }
            const searchUrl = `${projectUrl}players/playersItems/search/`;

            if (surnameTerm) {
                bodyData += `PlayersSearchForm[surname]=${encodeURIComponent(terms[0])}`;
            }
            if (idTerm) {
                bodyData += `${bodyData ? '&' : ''}PlayersSearchForm[number]=${encodeURIComponent(idTerm)}`;
            }
            if (phoneTerm) {
                bodyData += `${bodyData ? '&' : ''}PlayersSearchForm[phone]=${encodeURIComponent(phoneTerm)}`;
            }
            if (innTerm) {
                bodyData += `${bodyData ? '&' : ''}PlayersSearchForm[inn]=${encodeURIComponent(innTerm)}`;
            }
            if (emailTerm) {
                bodyData += `${bodyData ? '&' : ''}PlayersSearchForm[email]=${encodeURIComponent(emailTerm)}`;
            }
            if (nicknameTerm) {
                bodyData += `${bodyData ? '&' : ''}PlayersSearchForm[nickname]=${encodeURIComponent(nicknameTerm)}`;
            }
            bodyData += `${bodyData ? '&' : ''}PlayersSearchForm[document]=&yt0=`;

            console.log('Sending search request with body:', bodyData, 'to URL:', searchUrl);

            searchResults.innerHTML = '<p>Завантаження...</p>';

            GM_xmlhttpRequest({
                method: 'POST',
                url: searchUrl,
                headers: {
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'content-type': 'application/x-www-form-urlencoded',
                    'cache-control': 'no-cache',
                    'pragma': 'no-cache'
                },
                data: bodyData,
                onload: function(response) {
                    const finalUrl = response.finalUrl || searchUrl;
                    const html = response.responseText;
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    console.log('Search response URL:', finalUrl);

                    if (finalUrl.includes('/players/playersItems/update/')) {
                        const playerId = finalUrl.split('/').filter(Boolean).pop();
                        const profileUrl = `${projectUrl}players/playersItems/update/${playerId}/`;
                        console.log('Fetching profile URL for validation:', profileUrl);

                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: profileUrl,
                            headers: {
                                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                                'cache-control': 'no-cache',
                                'pragma': 'no-cache'
                            },
                            onload: function(profileResponse) {
                                const profileHtml = profileResponse.responseText;
                                const parser = new DOMParser();
                                const profileDoc = parser.parseFromString(profileHtml, 'text/html');

                                // Извлекаем данные из таблицы профиля
                                const rows = profileDoc.querySelectorAll('table tr');
                                let profileData = {};

                                rows.forEach(row => {
                                    const th = row.querySelector('th')?.textContent.trim().toLowerCase();
                                    const td = row.querySelector('td')?.textContent.trim();
                                    if (th && td) {
                                        if (th === 'фамилия') profileData.surname = td.toLowerCase();
                                        if (th === 'middle name') profileData.patronymic = td.toLowerCase();
                                        if (th === 'имя') profileData.name = td.toLowerCase();
                                    }
                                });

                                // Подготовка введенных данных для сравнения
                                const terms = surnameTerm ? surnameTerm.split(' ').filter(Boolean).map(t => t.toLowerCase()) : [];
                                const inputData = {
                                    surname: terms[0] || '',
                                    name: terms.length >= 2 ? terms[1] : '',
                                    patronymic: terms.length === 3 ? terms[2] : ''
                                };

                                // Проверка совпадения данных
                                let dataMatches = true;

                                if (surnameTerm) {
                                    if (terms.length === 1 && profileData.surname !== inputData.surname) {
                                        dataMatches = false;
                                    }
                                    if (terms.length === 2 &&
                                        (profileData.surname !== inputData.surname ||
                                         profileData.name !== inputData.name)) {
                                        dataMatches = false;
                                    }
                                    if (terms.length === 3 &&
                                        (profileData.surname !== inputData.surname ||
                                         profileData.name !== inputData.name ||
                                         profileData.patronymic !== inputData.patronymic)) {
                                        dataMatches = false;
                                    }
                                }

                                console.log('Profile data:', profileData);
                                console.log('Input data:', inputData);
                                console.log('Data matches:', dataMatches);

                                if (dataMatches) {
                                    console.log('Opening profile URL:', profileUrl);
                                    window.open(profileUrl, '_blank');
                                } else {
                                    searchResults.innerHTML = '<p>Нічого не знайдено: дані профілю не співпадають з введеними</p>';
                                    setFixedPopupSize(popup);
                                }
                            },
                            onerror: function(error) {
                                searchResults.innerHTML = `<p>Помилка при завантаженні профілю: ${error.responseText || error}</p>`;
                                console.error('Profile fetch error:', error);
                                setFixedPopupSize(popup);
                            }
                        });
                        return;
                    }

                    const table = doc.querySelector('.items.table');
                    if (table) {
                        let rows = table.querySelectorAll('tbody tr');

                        let filteredRows;
                        if (surnameTerm) {
                            if (terms.length === 2) {
                                const surname = terms[0].toLowerCase();
                                const name = terms[1].toLowerCase();

                                filteredRows = Array.from(rows).filter(row => {
                                    const surnameCell = row.cells[6]?.textContent.trim().toLowerCase() || '';
                                    const nameCell = row.cells[4]?.textContent.trim().toLowerCase() || '';

                                    const matchesSurname = surnameCell === surname;
                                    const matchesName = nameCell === name;

                                    console.log('Row data (surname + name):', { surnameCell, nameCell, matchesSurname, matchesName });

                                    return matchesSurname && matchesName;
                                });

                                if (filteredRows.length === 0) {
                                    searchResults.innerHTML = '<p>Нічого не знайдено за прізвищем та ім\'ям</p>';
                                    setFixedPopupSize(popup);
                                    return;
                                }
                            } else if (terms.length === 3) {
                                const surname = terms[0].toLowerCase();
                                const name = terms[1].toLowerCase();
                                const patronymic = terms[2].toLowerCase();

                                filteredRows = Array.from(rows).filter(row => {
                                    const surnameCell = row.cells[6]?.textContent.trim().toLowerCase() || '';
                                    const nameCell = row.cells[4]?.textContent.trim().toLowerCase() || '';
                                    const patronymicCell = row.cells[5]?.textContent.trim().toLowerCase() || '';

                                    const matchesSurname = surnameCell === surname;
                                    const matchesName = nameCell === name;
                                    const matchesPatronymic = patronymicCell === patronymic;

                                    console.log('Row data (full PIB):', { surnameCell, nameCell, patronymicCell, matchesSurname, matchesName, matchesPatronymic });

                                    return matchesSurname && matchesName && matchesPatronymic;
                                });

                                if (filteredRows.length === 0) {
                                    searchResults.innerHTML = '<p>Нічого не знайдено за повним ПІБ</p>';
                                    setFixedPopupSize(popup);
                                    return;
                                }
                            } else {
                                filteredRows = Array.from(rows);
                            }
                        } else {
                            filteredRows = Array.from(rows);
                        }

                        const newTable = document.createElement('table');
                        newTable.className = 'items table table-striped table-hover';
                        newTable.appendChild(table.querySelector('thead').cloneNode(true));
                        const newTbody = document.createElement('tbody');
                        filteredRows.forEach(row => newTbody.appendChild(row.cloneNode(true)));
                        newTable.appendChild(newTbody);

                        decodeEmails(newTable);
                        setLinksTargetBlank(newTable, projectUrl);

                        searchResults.innerHTML = '';
                        if (filteredRows.length > 0) {
                            searchResults.appendChild(newTable);
                            setFixedPopupSize(popup);
                        } else {
                            searchResults.innerHTML = '<p>Нічого не знайдено</p>';
                            setFixedPopupSize(popup);
                        }
                    } else {
                        searchResults.innerHTML = '<p>Нічого не знайдено</p>';
                        setFixedPopupSize(popup);
                    }
                },
                onerror: function(error) {
                    searchResults.innerHTML = `<p>Помилка: ${error.responseText || error}</p>`;
                    console.error('Search error:', error);
                    setFixedPopupSize(popup);
                }
            });
        }

        function setFixedPopupSize(popup) {
            popup.style.width = '1477px';
            popup.style.height = '700px';

            const maxWidth = window.innerWidth;
            const maxHeight = window.innerHeight;
            const popupRect = popup.getBoundingClientRect();

            if (popupRect.right > maxWidth) {
                popup.style.left = `${maxWidth - 1477}px`;
            }
            if (popupRect.bottom > maxHeight) {
                popup.style.top = `${maxHeight - 700}px`;
            }
            if (popupRect.left < 0) {
                popup.style.left = '0px';
            }
            if (popupRect.top < 0) {
                popup.style.top = '0px';
            }
        }
    }

    function createRegisterPopup() {
        const content = `
    <input type="text" id="register-username" placeholder="Логін" required />
    <input type="password" id="register-password" placeholder="Пароль" required />
    <input type="text" id="manager-name" placeholder="Ім'я Фамілія" required />
    <select id="user-status" required>
        <option value="" disabled selected>Статус</option>
        <option value="Manager">Менеджер</option>
        <option value="Admin">Admin</option>
    </select>
    <button id="register-btn">Додати користувача</button>
    <div class="error" id="register-error-msg"></div>
    <div class="success" id="register-success-msg"></div>
    `;
        createPopup('register-popup', 'Додати користувача', content, () => {});

        document.getElementById('register-btn').addEventListener('click', async () => {
            const username = document.getElementById('register-username').value;
            const password = document.getElementById('register-password').value;
            const managerName = document.getElementById('manager-name').value;
            const status = document.getElementById('user-status').value;

            const isRegistered = await registerUser(username, password, managerName, status);

            const errorMsg = document.getElementById('register-error-msg');
            const successMsg = document.getElementById('register-success-msg');

            if (isRegistered) {
                successMsg.textContent = 'Користувача було додано!';
                errorMsg.textContent = '';
                setTimeout(() => {
                    document.getElementById('register-popup').remove();
                }, 2000);
                loadUsers();
            } else {
                errorMsg.textContent = 'Виникла помилка! Такий користувач вже існує.';
                successMsg.textContent = '';
            }
        });
    }

    function dragElement(elmnt) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = elmnt.querySelector('.popup-header');
        header.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    async function loadUsers() {
        const today = getCurrentDateRequest();

        try {
            const usersResponse = await fetch(`${API_BASE_URL}/api/users`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!usersResponse.ok) {
                throw new Error(`Failed to fetch users: ${usersResponse.status}`);
            }
            const users = await usersResponse.json();

            const statsResponse = await fetch(`${API_BASE_URL}/api/get_all_statistics?date=${today}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!statsResponse.ok) {
                throw new Error(`Failed to fetch statistics: ${statsResponse.status}`);
            }
            const stats = await statsResponse.json();

            const usersWithStats = users.map(user => {
                const userStats = stats.find(stat => stat.id === user.id) || {};
                return {
                    ...user,
                    processedToday: userStats.total_players || 0,
                    seenToday: userStats.seen_today || 0
                };
            });

            usersWithStats.sort((a, b) => b.processedToday - a.processedToday);

            const usersList = document.getElementById('users-list');
            usersList.innerHTML = '';

            usersWithStats.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                <td>${user.manager_name}</td>
                <td>${user.status}</td>
                <td>${user.processedToday}</td>
                <td><a href="#" class="seen-today-link">${user.seenToday}</a></td>
                <td>
                    ${user.active_url ? `<i class="fa fa-chrome active-url-btn" title="Відкрити активну вкладку" data-user-id="${user.id}"></i>` : 'Не відомо'}
                </td>
                <td class="actions">
                    <i class="fa fa-bar-chart get-statistics" title="Статистика"></i>
                    <i class="fa fa-cog user-settings" title="Налаштування користувача"></i>
                    <i class="fa fa-trash delete-user" title="Видалити користувача"></i>
                </td>
            `;
                usersList.appendChild(row);

                row.querySelector('.get-statistics').addEventListener('click', () => getStatistics(user.id));
                row.querySelector('.user-settings').addEventListener('click', () =>
                                                                     createUserSettingsPopup(user.id, user.manager_name, user.username, user.status));
                row.querySelector('.delete-user').addEventListener('click', () => deleteUser(user.id));
                row.querySelector('.seen-today-link').addEventListener('click', (e) => {
                    e.preventDefault();
                    fetchSeenEntries(user.id, today);
                });
                const activeUrlBtn = row.querySelector('.active-url-btn');
                if (activeUrlBtn) {
                    activeUrlBtn.addEventListener('click', () => openActiveUrl(user.id));
                }
            });
        } catch (error) {
            console.error('Error loading users:', error);
            const usersList = document.getElementById('users-list');
            usersList.innerHTML = '<tr><td colspan="6">Помилка завантаження даних</td></tr>';
        }
    }

    async function openActiveUrl(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user/active_url/${userId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch active URL: ${response.status}`);
            }

            const data = await response.json();
            if (data.success && data.active_url) {
                window.open(data.active_url, '_blank');
            } else {
                Swal.fire('Помилка', data.message || 'Активна вкладка не знайдена', 'error');
            }
        } catch (error) {
            console.error('Error fetching active URL:', error);
            Swal.fire('Помилка', 'Не вдалося отримати активну вкладку', 'error');
        }
    }

    function createUserSettingsPopup(userId, currentName, currentLogin, currentStatus) {
        const content = `
        <div class="user-settings-form">
            <div class="form-settings-group">
                <label for="user-name">Ім'я користувача:</label>
                <input type="text" id="user-name" value="${currentName || ''}" required>
            </div>
            <div class="form-settings-group">
                <label for="user-login">Логін:</label>
                <input type="text" id="user-login" value="${currentLogin || ''}" required>
            </div>
            <div class="form-settings-group">
                <label for="user-status">Роль:</label>
                <select id="user-status" required>
                    <option value="" disabled>Статус</option>
                    <option value="Manager" ${currentStatus === 'Manager' ? 'selected' : ''}>Менеджер</option>
                    <option value="Admin" ${currentStatus === 'Admin' ? 'selected' : ''}>Admin</option>
                </select>
            </div>
            <button id="reset-password-btn">Скинути пароль</button>
            <button id="save-settings-btn">Зберегти зміни</button>
        </div>
    `;

        createPopup('user-settings-popup', 'Налаштування користувача', content, () => {});

        document.getElementById('reset-password-btn').addEventListener('click', () => changePassword(userId));
        document.getElementById('save-settings-btn').addEventListener('click', async () => {
            const name = document.getElementById('user-name').value.trim();
            const username = document.getElementById('user-login').value.trim(); // Изменено на username
            const status = document.getElementById('user-status').value;

            if (!name || !username || !status) {
                Swal.fire('Помилка', 'Будь ласка, заповніть усі поля', 'error');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        manager_name: name,
                        username: username,
                        status: status
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    Swal.fire('Успіх', 'Налаштування користувача збережено', 'success');
                    document.getElementById('user-settings-popup').remove();
                    loadUsers();
                } else {
                    Swal.fire('Помилка', data.message || 'Не вдалося зберегти зміни', 'error');
                }
            } catch (error) {
                console.error('Error updating user:', error);
                Swal.fire('Помилка', 'Виникла помилка при збереженні налаштувань', 'error');
            }
        });
    }

    async function fetchSeenEntries(userId, selectedDate) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/get_seen_entries/${userId}?date=${selectedDate}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (response.ok) {
                const content = `
                <style>
                    #updateButton {
                        background-color: #6a5acd;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                    }
                    #updateButton:hover {
                        background-color: #5244a8;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                    }
                </style>
                <label for="datePicker">Оберіть дату:</label>
                <input type="date" id="datePicker" value="${selectedDate}" />
                <button id="updateButton">Оновити</button>
                <p>Кількість переглянутих: ${data.total_seen}</p>
                <div style="max-height: 500px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;">
                    <table>
                        <thead>
                            <tr>
                                <th>Проєкт</th>
                                <th>ID Гравця</th>
                                <th>Дата і час</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.seen_entries.map(entry => `
                                <tr>
                                    <td>${entry.project}</td>
                                    <td><a href="${entry.url}" target="_blank">${entry.player_id}</a></td>
                                    <td>${entry.date}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

                const popup = document.getElementById('seen-entries-popup');
                if (popup) {
                    popup.querySelector('.popup-content').innerHTML = content;
                } else {
                    createPopup('seen-entries-popup', 'Переглянуті гравці', content, () => {
                        document.getElementById('updateButton').addEventListener('click', () => updateSeenEntries(userId));
                    });
                }

                document.getElementById('updateButton').addEventListener('click', () => updateSeenEntries(userId));
            } else {
                alert('Помилка: ' + data.error);
            }
        } catch (error) {
            console.error('Error fetching seen entries:', error);
            alert('Помилка завантаження даних');
        }
    }

    function updateSeenEntries(userId) {
        const selectedDate = document.getElementById('datePicker').value;
        fetchSeenEntries(userId, selectedDate);
    }


    function createFraudPopup() {
        const content = `
        <table id="my-frauds-table-popup">
            <thead>
                <tr>
                    <th>Дата</th>
                    <th>Проєкт</th>
                    <th>ID</th>
                    <th>Менеджер</th>
                    <th>Коментар</th>
                    <th>Дії</th>
                </tr>
            </thead>
            <tbody id="my-frauds-list"></tbody>
        </table>

        <table id="common-frauds-table-popup">
            <thead>
                <tr>
                    <th>Дата</th>
                    <th>Проєкт</th>
                    <th>ID</th>
                    <th>Менеджер</th>
                    <th>Коментар</th>
                </tr>
            </thead>
            <tbody id="common-frauds-list"></tbody>
        </table>

        <button id="add-fraud-btn">Під нагляд</button>
    `;

        const style = document.createElement('style');
        style.textContent = `
        /* Стилі для таблиць у попапі */
        #my-frauds-table-popup, #common-frauds-table-popup {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        #my-frauds-table-popup th, #my-frauds-table-popup td,
        #common-frauds-table-popup th, #common-frauds-table-popup td {
            padding: 12px;
            border: 1px solid #ddd;
            text-align: left;
        }
        #my-frauds-table-popup th, #common-frauds-table-popup th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        #my-frauds-table-popup tr:nth-child(even), #common-frauds-table-popup tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        #my-frauds-table-popup tr:hover, #common-frauds-table-popup tr:hover {
            background-color: #f1f1f1;
        }
        .delete-fraud {
            background-color: #f44336;
            color: white;
            border: none;
            padding: 5px 10px;
            cursor: pointer;
            border-radius: 3px;
        }
        .delete-fraud:hover {
            background-color: #c62828;
        }
        .edit-fraud {
    background-color: #FFA500; /* Оранжевый цвет для кнопки */
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 3px;
}

.edit-fraud:hover {
    background-color: #FF8C00; /* Темнее при наведении */
}
        #add-fraud-btn {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            border-radius: 5px;
            font-size: 16px;
            margin-top: 20px;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }
        #add-fraud-btn:hover {
            background-color: #45a049;
        }
    `;
        document.head.appendChild(style);

        loadFrauds();
        createPopup('fraud-popup', 'Під наглядом', content);

        document.getElementById('add-fraud-btn').addEventListener('click', createAddFraudPopup);
    }


    async function loadFrauds() {


        try {
            const response = await fetch('https://vps65001.hyperhost.name/api/frauds', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch frauds: ${response.statusText}`);
            }

            const frauds = await response.json();
            const myFraudsList = document.getElementById('my-frauds-list');
            const commonFraudsList = document.getElementById('common-frauds-list');
            const managerName = await getManagerName(token);

            if (!myFraudsList || !commonFraudsList) {
                console.error('Required elements not found in the DOM.');
                return;
            }

            myFraudsList.innerHTML = '';
            commonFraudsList.innerHTML = '';

            const style = document.createElement('style');
            style.textContent = `
        /* Стилі для таблиць у попапі */
        #my-frauds-table-popup, #common-frauds-table-popup {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        #my-frauds-table-popup th, #my-frauds-table-popup td,
        #common-frauds-table-popup th, #common-frauds-table-popup td {
            padding: 12px;
            border: 1px solid #ddd;
            text-align: left;
        }
        #my-frauds-table-popup th, #common-frauds-table-popup th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        #my-frauds-table-popup tr:nth-child(even), #common-frauds-table-popup tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        #my-frauds-table-popup tr:hover, #common-frauds-table-popup tr:hover {
            background-color: #f1f1f1;
        }
.delete-fraud, .edit-fraud {
    cursor: pointer;
    margin-right: 10px;
    font-size: 18px; /* Можно скорректировать размер иконок */
}

.delete-fraud {
    color: #f44336;
}

.delete-fraud:hover {
    color: #c62828;
}

.edit-fraud {
    color: #4CAF50;
}

.edit-fraud:hover {
    color: #388E3C;
}

        #add-fraud-btn {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            border-radius: 5px;
            font-size: 16px;
            margin-top: 20px;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }
        #add-fraud-btn:hover {
            background-color: #45a049;
        }
    `;

            frauds.forEach(fraud => {
                const row = document.createElement('tr');
                row.innerHTML = `
                <td>${new Date(fraud.date_added).toLocaleDateString()}</td>
                <td>${fraud.project}</td>
                <td><a href="${fraud.url}" target="_blank">${fraud.player_id}</a></td>
                <td>${fraud.manager}</td>
                <td>${fraud.comment || ''}</td>
${fraud.manager === managerName ? `
    <td>
        <i class="fa fa-pencil edit-fraud" title="Редагувати"></i>
        <i class="fa fa-trash delete-fraud" title="Видалити"></i>
    </td>
` : ''}
            `;

                if (fraud.manager === managerName) {
                    myFraudsList.appendChild(row);
                    const deleteButton = row.querySelector('.delete-fraud');
                    const editButton = row.querySelector('.edit-fraud');

                    if (deleteButton) {
                        deleteButton.addEventListener('click', () => deleteFraud(fraud.id));
                    }

                    if (editButton) {
                        editButton.addEventListener('click', () => editFraud(fraud.id, fraud.comment));
                    }

                } else {
                    commonFraudsList.appendChild(row);
                }
            });
        } catch (error) {
            console.error('Error:', error);
        }
    }


    function editFraud(fraudId, currentComment) {


        Swal.fire({
            title: 'Редагувати коментар',
            input: 'textarea',
            inputValue: currentComment,
            showCancelButton: true,
            confirmButtonText: 'Зберегти',
            preConfirm: (newComment) => {
                return fetch(`https://vps65001.hyperhost.name/api/edit_fraud/${fraudId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ comment: newComment })
                })
                    .then(response => response.json())
                    .then(data => {
                    if (data.success) {
                        Swal.fire('Готово!', 'Коментар оновлено.', 'success');
                        loadFrauds();
                    } else {
                        Swal.fire('Помилка!', data.message, 'error');
                    }
                })
                    .catch(error => {
                    console.error('Error:', error);
                    Swal.fire('Помилка!', 'Щось пішло не так!', 'error');
                });
            }
        });
    }


    function createAddFraudPopup() {
        const content = `
        <div id="add-fraud-form">
            <input type="text" id="fraud-player-id" placeholder="ID клієнта" required />
            <input type="text" id="fraud-url" placeholder="Посилання" required />
            <input type="text" id="fraud-comment" placeholder="Коментар" />
            <button id="add-fraud-confirm-btn">Додати</button>
        </div>
    `;

        const style = document.createElement('style');
        style.textContent = `
        #add-fraud-form {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 20px;
            max-width: 400px;
            margin: 0 auto;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        #add-fraud-form input {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            width: 100%;
        }
        #add-fraud-form input:focus {
            border-color: #4CAF50;
            outline: none;
        }
        #add-fraud-confirm-btn {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            border-radius: 5px;
            font-size: 16px;
            transition: background-color 0.3s;
        }
        #add-fraud-confirm-btn:hover {
            background-color: #45a049;
        }
    `;
        document.head.appendChild(style);

        createPopup('add-fraud-popup', 'Додати під нагляд', content);

        document.getElementById('add-fraud-confirm-btn').addEventListener('click', async () => {
            const playerId = document.getElementById('fraud-player-id').value;
            const url = document.getElementById('fraud-url').value;
            const comment = document.getElementById('fraud-comment').value;

            await addFraud(playerId, url, comment);
            document.getElementById('add-fraud-popup').remove();
            loadFrauds();
        });
    }


    async function addFraud(playerId, url, comment) {


        try {
            const response = await fetch('https://vps65001.hyperhost.name/api/add_fraud', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ player_id: playerId, url: url, comment: comment })
            });

            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    title: 'Готово!',
                    text: 'Користувача було додано до списку.',
                    icon: 'success',
                });
                loadFrauds();
            } else {
                alert('Виникла помилка!.');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function deleteFraud(fraudId) {


        try {
            const response = await fetch(`https://vps65001.hyperhost.name/api/delete_fraud/${fraudId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    title: 'Готово!',
                    text: 'Користувача було видалено зі списку.',
                    icon: 'success',
                });
                loadFrauds();
            } else {
                alert('Ошибка: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }


    async function registerUser(username, password, managerName, status) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, managerName, status })
            });
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    }

    const stylePopUps = document.createElement('style');
    stylePopUps.innerHTML = `
.custom-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%); /* Центрирует попап */
    padding: 20px;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    cursor: move;
    resize: both; /* Возможность изменения размера */
    overflow: auto; /* Прокрутка при переполнении */
    max-width: 90vw; /* Ограничение по ширине экрана */
    max-height: 90vh; /* Ограничение по высоте экрана */
    min-width: 150px; /* Минимальная ширина, чтобы избежать слишком узкого попапа */
    min-height: 100px; /* Минимальная высота */
}

.popup-header {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 15px;
    cursor: move;
    user-select: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.popup-header .close-btn {
    font-size: 16px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: #dc3545;
    color: #fff;
    cursor: pointer;
    text-align: center;
    line-height: 1;
}
.popup-header .close-btn:hover {
    background-color: #c82333;
}
#admin-popup-table {
    width: 100%;
    border-collapse: collapse;
}
#admin-popup-table th,
#admin-popup-table td {
    border: 1px solid #ddd;
    padding: 8px;
}
#admin-popup-table th {
    background-color: #f4f4f4;
}
#admin-popup-table tr:nth-child(even) {
    background-color: #f2f2f2; /* Чередование цвета строк */
}
#admin-popup-table tr:hover {
    background-color: #ddd; /* Изменение цвета строки при наведении */
}
#admin-popup-table .actions {
    text-align: center;
}
#admin-popup-table .actions i {
    cursor: pointer;
    margin: 0 5px;
    font-size: 18px;
    padding: 5px;
    border-radius: 4px;
    color: #fff;
}
.get-statistics { background-color: #007bff; }
.user-settings  { background-color: #ffc107; }
.active-url-btn { background-color: #35d300;
    cursor: pointer;
    margin: 0 5px;
    font-size: 18px;
    padding: 5px;
    border-radius: 4px;
    color: #fff;}
.delete-user { background-color: #dc3545; }
#add-user-btn {
    margin-top: 20px;
    padding: 10px;
    background-color: #007bff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}
#add-user-btn:hover {
    background-color: #0056b3;
}
#alerts-settings-btn {
    margin-top: 20px;
    padding: 10px;
    background-color: #8A2BE2;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}
#alerts-settings-btn:hover {
    background-color: #9400D3;
}
#register-popup input, #register-popup select {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
    font-size: 16px;
}
#register-popup button {
    width: 100%;
    padding: 10px;
    background-color: #007BFF;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}
#register-popup button:hover {
    background-color: #0056b3;
}
#register-popup .error {
    color: red;
    margin-top: 10px;
    text-align: center;
}
#register-popup .success {
    color: green;
    margin-top: 10px;
    text-align: center;
}
.user-settings-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 20px;
}

.form-settings-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.form-settings-group label {
    font-weight: bold;
}

.form-settings-group input,
.form-settings-group select {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
}

.form-settings-group select {
    width: 100%;
}

#reset-password-btn,
#save-settings-btn {
    padding: 10px;
    margin-top: 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

#reset-password-btn {
    background-color: #ff4444;
    color: white;
}

#save-settings-btn {
    background-color: #4CAF50;
    color: white;
}

#reset-password-btn:hover {
    background-color: #cc0000;
}

#save-settings-btn:hover {
    background-color: #45a049;
}
.popup-resize-handle {
    width: 10px;
    height: 10px;
    background-color: #ccc;
    position: absolute;
    bottom: 0;
    right: 0;
    cursor: nwse-resize; /* Индикатор изменения размера */
}
        .daterangepicker {
            z-index: 10001 !important; /* Обеспечиваем, чтобы календарь отображался поверх всплывающего окна */
        }
        .swal2-container {
  z-index: 10002; /* Установить более высокий z-index для оповещения */
}
`;
    document.head.appendChild(stylePopUps);



    async function deleteUser(userId) {

        try {
            const response = await fetch(`${API_BASE_URL}/api/delete_user/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                alert('Користувач видалений успішно!');
                loadUsers();
            } else {
                alert('Помилка: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }


    async function changePassword(userId) {


        Swal.fire({
            title: 'Ви впевнені?',
            text: "Ви дійсно бажаєте скинути пароль?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Так, скинути!',
            cancelButtonText: 'Ні, повернутись'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`https://vps65001.hyperhost.name/api/change_password/${userId}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();

                    if (data.success) {
                        Swal.fire('Готово!', `Пароль було змінено. Новий пароль: ${data.new_password}`, 'success');
                    } else {
                        Swal.fire('Помилка', data.message, 'error');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    Swal.fire('Помилка', 'Произошла ошибка при сбросе пароля', 'error');
                }
            }
        });
    }

    function openTlCommentEditor(managerId, entryId, comment) {
        const content = `
        <style>
            #tl-comment-editor {
                height: 200px;
                margin-bottom: 10px;
            }
            .ql-container {
                border-radius: 4px;
            }
            .save-comment-btn, .cancel-comment-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                margin-right: 10px;
            }
            .save-comment-btn {
                background-color: #4CAF50;
                color: white;
            }
            .save-comment-btn:hover {
                background-color: #45a049;
            }
            .cancel-comment-btn {
                background-color: #ff4444;
                color: white;
            }
            .cancel-comment-btn:hover {
                background-color: #cc0000;
            }
        </style>
        <div id="tl-comment-editor">${comment}</div>
        <button class="save-comment-btn">Зберегти</button>
        <button class="cancel-comment-btn">Скасувати</button>
    `;

        createPopup('tl-comment-popup', 'Редагувати коментар TL', content, () => {});

        const quill = new Quill('#tl-comment-editor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    ['link'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'color': ['#ff0000', '#008000', '#ffa500'] }], // Добавляем цвета: красный, зеленый, оранжевый
                    ['clean']
                ]
            }
        });

        if (comment) {
            quill.root.innerHTML = comment;
        }

        document.querySelector('.save-comment-btn').addEventListener('click', async () => {
            const tlComment = quill.root.innerHTML;
            try {
                const response = await fetch(`${API_BASE_URL}/api/working/${entryId}/tl_comment`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ tl_comment: tlComment })
                });

                const data = await response.json();
                if (response.ok) {
                    Swal.fire('Успіх', 'Коментар TL збережено', 'success');
                    document.getElementById('tl-comment-popup').remove();
                    fetchStatistics(managerId, document.getElementById('datePicker').value);
                } else {
                    Swal.fire('Помилка', data.message || 'Не вдалося зберегти коментар', 'error');
                }
            } catch (error) {
                console.error('Error saving TL comment:', error);
                Swal.fire('Помилка', 'Виникла помилка при збереженні коментаря', 'error');
            }
        });

        document.querySelector('.cancel-comment-btn').addEventListener('click', () => {
            document.getElementById('tl-comment-popup').remove();
        });
    }

    async function fetchStatistics(userId, selectedDate, unreadEntryIds = []) {
        try {
            if (!token) {
                throw new Error('Authorization token is missing');
            }

            const userStatus = await checkUserStatus();
            const isAdmin = userStatus === 'Admin';

            if (!window.DOMPurify) {
                const purifyScript = document.createElement('script');
                purifyScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/2.4.1/purify.min.js';
                document.head.appendChild(purifyScript);
                await new Promise((resolve, reject) => {
                    purifyScript.onload = resolve;
                    purifyScript.onerror = () => reject(new Error('Failed to load DOMPurify'));
                });
            }

            if (isAdmin) {
                await loadQuillResources();
            }

            const response = await fetch(`${API_BASE_URL}/api/get_statistics/${userId}?date=${selectedDate}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            console.log(data);

            if (response.ok) {
                const content = `
                <style>
                    #updateButton {
                        background-color: #6a5acd;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                    }
                    #updateButton:hover {
                        background-color: #5244a8;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                    }
                    .tl-comment-placeholder {
                        color: #888;
                        font-size: 12px;
                        font-style: italic;
                        cursor: pointer;
                    }
                    .tl-comment-content {
                        cursor: pointer;
                    }
                    .unread-comment-row {
                        animation: pulseBorder 1.5s infinite;
                    }
                    @keyframes pulseBorder {
                        0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
                        50% { box-shadow: 0 0 0 6px rgba(255, 0, 0, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
                    }
                </style>
                <label for="datePicker">Оберіть дату:</label>
                <input type="date" id="datePicker" value="${selectedDate}" />
                <button id="updateButton">Оновити</button>
                <p>Кількість всіх гравців: ${data.total_players}</p>
                <p>Кількість Betking: ${data.betking_count}</p>
                <p>Кількість 777: ${data.seven_count}</p>
                <p>Кількість Vegas: ${data.vegas_count}</p>
                <div style="max-height: 500px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;">
                    <table>
                        <thead>
                            <tr>
                                <th>ID Гравця</th>
                                <th>Проект</th>
                                <th>Авто</th>
                                <th>Коментар</th>
                                <th>Коментар TL</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.entries.map(entry => `
                                <tr ${!isAdmin && unreadEntryIds.includes(entry.id) ? 'class="unread-comment-row"' : ''}>
                                    <td><a href="${entry.url}" target="_blank">${entry.player_id}</a></td>
                                    <td>${entry.project}</td>
                                    <td>
                                        ${entry.autopayment === false ? '<span style="color: green;">✔</span>' : '<span style="color: red;">❌</span>'}
                                    </td>
                                    <td>${entry.comment || ''}</td>
                                    <td ${!isAdmin && unreadEntryIds.includes(entry.id) ? `class="tl-comment-unread" data-entry-id="${entry.id}"` : ''}>
                                        ${isAdmin ? `
                                            ${entry.tl_comment ?
                                               `<div class="tl-comment-content" data-entry-id="${entry.id}" data-comment="${encodeURIComponent(entry.tl_comment)}">${entry.tl_comment}</div>` :
                                               `<span class="tl-comment-placeholder" data-entry-id="${entry.id}" data-comment="">Хочете щось додати?</span>`
                                               }
                                        ` : `
                                            ${entry.tl_comment ? `<div>${DOMPurify.sanitize(entry.tl_comment)}</div>` : ''}
                                        `}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

                const popup = document.getElementById('statistics-popup');
                if (popup) {
                    popup.querySelector('.popup-content').innerHTML = content;
                } else {
                    createPopup('statistics-popup', 'Статистика менеджера', content, () => {});
                }

                document.getElementById('updateButton').addEventListener('click', () => updateStatistics(userId));

                if (isAdmin) {
                    document.querySelectorAll('.tl-comment-content, .tl-comment-placeholder').forEach(element => {
                        element.addEventListener('click', () => {
                            const entryId = element.getAttribute('data-entry-id');
                            const comment = decodeURIComponent(element.getAttribute('data-comment') || '');
                            openTlCommentEditor(userId, entryId, comment);
                        });
                    });
                } else {
                    document.querySelectorAll('.tl-comment-unread').forEach(element => {
                        element.addEventListener('click', async () => {
                            const entryId = element.getAttribute('data-entry-id');
                            try {
                                await fetch(`${API_BASE_URL}/api/working/${entryId}/mark_read`, {
                                    method: 'PUT',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                element.closest('tr').classList.remove('unread-comment-row');
                                element.classList.remove('tl-comment-unread');
                            } catch (error) {
                                console.error('Error marking comment as read:', error);
                            }
                        });
                    });
                }
            } else {
                Swal.fire('Помилка', data.error || 'Не вдалося завантажити статистику', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Помилка', 'Помилка завантаження статистики', 'error');
        }
    }

    async function getStatistics(userId) {

        const today = getCurrentDateRequest();

        await fetchStatistics(userId, today);
    }

    function updateStatistics(userId) {
        const selectedDate = document.getElementById('datePicker').value;
        fetchStatistics(userId, selectedDate);
    }

    async function checkUnreadTlComments(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/unread_tl_comments/${userId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (response.ok && data.count > 0) {
                const notification = document.createElement('div');
                notification.className = 'tl-notification';
                notification.innerHTML = `
                <div class="tl-notification-content">
                    <h3>Нові коментарі від тімліда</h3>
                    <p>У Вас є <b>${data.count}</b> ${data.count === 1 ? 'коментар' : data.count < 4 ? 'коментарі' : 'коментарів'}. Ознайомтесь!</p>
                    <div class="tl-notification-buttons">
                        <button class="tl-notification-confirm-btn">Переглянути</button>
                        <button class="tl-notification-cancel-btn">Закрити</button>
                    </div>
                </div>
            `;

                document.body.appendChild(notification);

                // Извлекаем все entry_id непрочитанных комментариев
                const unreadEntryIds = data.comments.map(comment => comment.entry_id);

                // Обработчик для кнопки "Переглянути"
                notification.querySelector('.tl-notification-confirm-btn').addEventListener('click', async () => {
                    const firstComment = data.comments[0];
                    await fetchStatistics(userId, firstComment.date, unreadEntryIds); // Передаем массив unreadEntryIds
                    notification.remove();
                });

                // Обработчик для кнопки "Закрити"
                notification.querySelector('.tl-notification-cancel-btn').addEventListener('click', () => {
                    notification.classList.add('tl-notification-closing');
                    setTimeout(() => notification.remove(), 300);
                });
            }
        } catch (error) {
            console.error('Error checking unread TL comments:', error);
        }
        const style = document.createElement('style');
        style.textContent = `
    .tl-notification {
        position: fixed;
        top: 20px;
        left: 20px;
        max-width: 350px;
        background-color: #fff;
        border: 2px solid #ff0000;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out, pulseBorder 1.5s infinite;
        overflow: hidden;
    }
    .tl-notification-content {
        padding: 20px;
    }
    .tl-notification h3 {
        margin: 0 0 10px;
        font-size: 18px;
        color: #333;
    }
    .tl-notification p {
        margin: 0 0 15px;
        font-size: 14px;
        color: #555;
    }
    .tl-notification-buttons {
        display: flex;
        gap: 10px;
    }
    .tl-notification-confirm-btn, .tl-notification-cancel-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
    }
    .tl-notification-confirm-btn {
        background-color: #4CAF50;
        color: white;
    }
    .tl-notification-confirm-btn:hover {
        background-color: #45a049;
    }
    .tl-notification-cancel-btn {
        background-color: #ff4444;
        color: white;
    }
    .tl-notification-cancel-btn:hover {
        background-color: #cc0000;
    }
    @keyframes slideIn {
        from {
            transform: translateX(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    .tl-notification-closing {
        animation: fadeOut 0.3s ease-in forwards;
    }
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
    @keyframes pulseBorder {
        0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
        50% { box-shadow: 0 0 0 6px rgba(255, 0, 0, 0); }
        100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
    }
`;
        document.head.appendChild(style);
    }

    function createStatisticPopup() {

        const today = new Date().toISOString().split('T')[0];

        const content = `
        <style>
            /* Стили только для попапа статистики */
            #statistic-popup .popup-content {
                padding: 20px;
                font-family: Arial, sans-serif;
                color: #333;
            }

            #statistic-popup #dateRangePicker {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-bottom: 10px;
                box-sizing: border-box;
            }

            #statistic-popup #updateStatisticsButton {
                background-color: #007bff;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                margin-bottom: 20px;
                display: block;
                width: 100%;
            }

            #statistic-popup #updateStatisticsButton:hover {
                background-color: #0056b3;
            }

            #statistic-popup table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }

            #statistic-popup th, #statistic-popup td {
                padding: 10px;
                border: 1px solid #ddd;
                text-align: left;
            }

            #statistic-popup th {
                background-color: #f4f4f4;
                font-weight: bold;
            }

            #statistic-popup tbody tr:nth-child(even) {
                background-color: #f9f9f9;
            }

            #statistic-popup tbody tr:hover {
                background-color: #f1f1f1;
            }

            #statistic-popup .crown {
                color: gold;
                font-size: 20px;
                vertical-align: middle;
            }

            #statistic-popup p {
                font-size: 16px;
                margin: 10px 0;
            }
                    .detail-btn {
            background-color: #6a5acd;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 20px;
            display: block;
            width: 100%;
            text-align: center;
        }

        .detail-btn:hover {
            background-color: #5244a8;
        }
        </style>
        <label for="dateRangePicker">Оберіть період:</label>
        <input type="text" id="dateRangePicker" />
        <button id="updateStatisticsButton">Оновити</button>

        <p>Опрацьовано за період: <span id="totalPeriod">0</span></p>
        <p>Опрацьовано всього: <span id="totalAllTime">0</span></p>
        <p>Середнє оброблення на менеджера за період: <span id="averageProcessedPerManager">0</span></p>


        <table id="managersTable">
            <thead>
                <tr>
                    <th>Ім'я Прізвище</th>
                    <th>Опрацьовано за період</th>
                    <th>Опрацьовано за весь час</th>
                    <th>Cередня кількість</th>
                </tr>
            </thead>
            <tbody id="managersList"></tbody>
        </table>

            <button id="detailStatisticsButton" class="detail-btn">Моя статистика</button>

    `;

        createPopup('statistic-popup', 'Статистика', content, () => {});

        $('#dateRangePicker').daterangepicker({
            startDate: today,
            endDate: today,
            locale: {
                format: 'YYYY-MM-DD'
            }
        });

        document.getElementById('updateStatisticsButton').addEventListener('click', updateStatisticPopup);
        document.getElementById('detailStatisticsButton').addEventListener('click', async () => {
            const userId = await getManagerID(token);
            if (userId !== null) {
                getStatistics(userId);
            } else {
                console.error('Не удалось получить ID менеджера');
            }
        });

        loadStatisticData(today, today);
    }


    async function loadStatisticData(startDate, endDate) {


        try {
            const response = await fetch(`https://vps65001.hyperhost.name/api/statistics?start_date=${startDate}&end_date=${endDate}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (response.ok) {
                document.getElementById('totalPeriod').textContent = data.totalForPeriod;
                document.getElementById('totalAllTime').textContent = data.totalAllTime;
                document.getElementById('averageProcessedPerManager').textContent = data.averageProcessedPerManager.toFixed(2);

                const managersList = document.getElementById('managersList');
                managersList.innerHTML = '';

                data.managers.forEach(manager => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                    <td>${manager.name}</td>
                    <td>${manager.processedForPeriod}</td>
                    <td>${manager.processedAllTime}</td>
                    <td>${manager.averageProcessedPerPeriod.toFixed(2)}</td>
                `;
                    managersList.appendChild(row);
                });
            } else {
                alert('Ошибка загрузки данных: ' + data.error);
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
    }



    function updateStatisticPopup() {
        const dateRange = $('#dateRangePicker').data('daterangepicker');
        const startDate = dateRange.startDate.format('YYYY-MM-DD');
        const endDate = dateRange.endDate.format('YYYY-MM-DD');

        loadStatisticData(startDate, endDate);
    }


    function getCurrentTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    function getCurrentDateRequest() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${year}-${month}-${day}`;

    }

    function getBalance() {
        const balanceInput = document.querySelector('#Players_balance');
        if (balanceInput) {
            return balanceInput.value.trim();
        }

        const keywords = ['Баланс', 'Balance'];
        const rows = document.querySelectorAll('tr');
        for (const row of rows) {
            if (keywords.some(keyword => row.textContent.includes(keyword))) {
                const cells = row.querySelectorAll('td');
                if (cells.length > 0) {
                    return cells[0].textContent.trim();
                }
            }
        }

        return '0.00';
    }


    const getInnerBalanceValue = () => {
        const innerBalance = Number(document.querySelector('input[data-field="inner_balance"]')?.value) || 0;

        const totalHoldAmount = Array.from(document.querySelectorAll('.hold-amount > span.hold-amount'))
        .reduce((sum, hold) => {
            const match = hold.textContent.trim().match(/^([\d.]+)/);
            return sum + (match ? Number(match[1]) || 0 : 0);
        }, 0);

        const safeBalance = Number(
            Array.from(document.querySelectorAll('tr'))
            .find(row => row.querySelector('th')?.textContent.trim() === 'Баланс сейфа')
            ?.querySelector('td code')?.textContent.trim()
        ) || 0;

        const totalBalance = innerBalance + totalHoldAmount + safeBalance;
        return totalBalance;
    };


    function getPlayerID() {
        const rows = document.querySelectorAll('tr');
        for (const row of rows) {
            if (row.textContent.includes('Номер игрока') || row.textContent.includes('Player number')) {
                const span = row.querySelector('td span');
                if (span) {
                    return span.textContent.trim();
                }
            }
        }
        return '0.00';
    }

    function getCurrency() {
        const rows = document.querySelectorAll('tr');
        for (const row of rows) {
            if (row.textContent.includes('Валюта') || row.textContent.includes('Currency')) {
                const span = row.querySelector('td');
                if (span) {
                    return span.textContent.trim();
                }
            }
        }
        return '0.00';
    }

    function insertTextIntoField(text) {
        const field = document.querySelector('#gateway-method-description-visible-antifraud_manager');
        if (field) {
            const pattern = /.*?(\d{2}\.\d{2}\.\d{4} в \d{2}:\d{2})?.*?Автовиплати відключено антифрод командою.*?(\d{2}:\d{2})?.*?(?=<br>|<\/[^>]+>|$)/gi;
            field.innerHTML = field.innerHTML.replace(pattern, '').trim();
            field.focus();
            field.innerHTML = text + '<br>' + field.innerHTML;

            const event = new Event('input', { bubbles: true });
            field.dispatchEvent(event);
        }
    }

    let isProfitButtonClicked = false;

    function formatAmount(balance) {
        let formattedBalance;
        const isNegative = balance < 0;
        const absoluteBalance = Math.abs(balance);

        if (absoluteBalance >= 1000000) {
            formattedBalance = absoluteBalance / 1000000;
            formattedBalance = Number.isInteger(formattedBalance) ? `${formattedBalance} млн` : `${formattedBalance.toFixed(1)} млн`;
        } else if (absoluteBalance >= 1000) {
            formattedBalance = absoluteBalance / 1000;
            formattedBalance = Number.isInteger(formattedBalance) ? `${formattedBalance}к` : `${formattedBalance.toFixed(1)}к`;
        } else {
            formattedBalance = absoluteBalance.toFixed(2);
        }

        return isNegative ? `-${formattedBalance}` : formattedBalance;
    }

    function handleShortcut(event) {
        const keys = [];
        if (event.ctrlKey) keys.push('CTRL');
        if (event.altKey) keys.push('ALT');
        if (event.shiftKey) keys.push('SHIFT');
        keys.push(event.code);

        const shortcut = keys.join(' + ');
        const savedShortcut = GM_getValue('dateShortcut', 'не задано');

        if (shortcut === savedShortcut) {
            event.preventDefault();

            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
                const date = getCurrentDateFormatted();
                if (activeElement.isContentEditable) {
                    const selection = window.getSelection();
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(document.createTextNode(date));
                    range.collapse(false);
                    const event = new Event('input', { bubbles: true });
                    activeElement.dispatchEvent(event);
                } else {
                    const startPos = activeElement.selectionStart;
                    const endPos = activeElement.selectionEnd;
                    activeElement.value = activeElement.value.substring(0, startPos) + date + activeElement.value.substring(endPos);
                    activeElement.selectionStart = activeElement.selectionEnd = startPos + date.length;
                    const event = new Event('input', { bubbles: true });
                    activeElement.dispatchEvent(event);
                }
            }
        }
    }

    // Константы стилей
    const POPUP_STYLES = {
        position: 'fixed',
        top: '20px',
        width: '280px',
        padding: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
        zIndex: '10000',
        fontFamily: '"Roboto", sans-serif',
        fontSize: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: '10px',
        resize: 'both',
        overflow: 'auto'
    };

    const BUTTON_STYLES = {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        fontWeight: 'bold',
        color: 'white',
        padding: '10px 12px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
    };

    const ICON_STYLES = {
        position: 'absolute',
        cursor: 'pointer',
        fontSize: '20px'
    };

    // Утилиты
    function applyStyles(element, styles) {
        Object.assign(element.style, styles);
    }

    function getColor(value) {
        return value < 0.75 ? 'green' : (value < 1 ? 'orange' : 'red');
    }

    function formatCurrency(amount, showAmount, currencySymbol) {
        const formattedAmount = Number(amount).toFixed(2);
        return showAmount ? `${formatAmount(amount)}${currencySymbol}` : `${formattedAmount}${currencySymbol}`;
    }

    function createContainer(styles) {
        const container = document.createElement('div');
        applyStyles(container, styles);
        return container;
    }

    async function createPopupBox({ MonthPA, TotalPA, Balance, NDFL, totalPending, cards = [], displayCards = [], isCheckedToday }) {
        if (window.popupBox) {
            console.log('Popup already exists, skipping creation');
            return;
        }

        const popupBox = document.createElement('div');
        window.popupBox = popupBox;
        const popupWidth = parseInt(POPUP_STYLES.width.replace('px', ''), 10);
        applyStyles(popupBox, {
            ...POPUP_STYLES,
            left: `calc(100% - ${popupWidth + 20}px)`,
            border: `2px solid ${getColor(TotalPA)}`,
            animation: 'glow 1s infinite alternate'
        });

        try {
            popupBox.appendChild(createDragHandle(popupBox));
            popupBox.appendChild(await createMainText({ Balance, NDFL, totalPending, MonthPA, TotalPA, cards: displayCards }));
            popupBox.appendChild(createSettingsIcon());
            popupBox.appendChild(createSearchIcon());
            popupBox.appendChild(createStatisticIcon());
            popupBox.appendChild(createStatusIcon());
            popupBox.appendChild(createFraudIcon());
            const reminderIcon = await createReminderIcon();
            popupBox.appendChild(reminderIcon);
            await addAdminIcon(popupBox);
            const buttonRows = createButtonRows({ Balance, totalPending, TotalPA, isCheckedToday });
            popupBox.appendChild(buttonRows);
            const textElement = document.createElement('div');
            textElement.className = 'popup-text';
            popupBox.appendChild(textElement);
            const projectContainer = await createProjectButtonContainer();
            popupBox.appendChild(projectContainer);
            popupBox.appendChild(createTotalInOutRow({ Balance, totalPending }));

            document.body.appendChild(popupBox);
            addGlobalStyles(getColor(TotalPA));
            console.log('Popup creation completed');
        } catch (error) {
            console.error('Error in createPopupBox:', error);
        }
    }

    function createDragHandle(popupBox) {
        const dragHandle = document.createElement('div');
        applyStyles(dragHandle, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '20px',
            cursor: 'move'
        });

        let isDragging = false, offsetX, offsetY;
        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - popupBox.getBoundingClientRect().left;
            offsetY = e.clientY - popupBox.getBoundingClientRect().top;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            if (!isDragging) return;
            popupBox.style.left = `${e.clientX - offsetX}px`;
            popupBox.style.top = `${e.clientY - offsetY}px`;
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        return dragHandle;
    }

    async function createMainText({ Balance, NDFL, totalPending, MonthPA, TotalPA, cards }) {
        const showNDFL = GM_getValue(ndfDisplayKey, true);
        const showAmount = GM_getValue(amountDisplayKey, true);
        const currencySymbol = currencySymbols.get(getCurrency()) || '';
        const provider = await verificationProvider();

        const mainText = document.createElement('div');
        mainText.className = 'popup-main-text';
        mainText.innerHTML = `
        <center><b>Баланс: ${formatCurrency(Balance, showAmount, currencySymbol)}</b></center>
        ${showNDFL && NDFL !== 0 ? `<center><b>НДФЛ: ${formatCurrency(NDFL, showAmount, currencySymbol)}</b></center>` : ''}
        <center><b>Month: <span style="color: ${getColor(MonthPA)}">${MonthPA}</span> | Total: <span style="color: ${getColor(TotalPA)}">${TotalPA}</span></b></center>
        ${totalPending > 0 ? `<center><b>На виплаті: ${formatCurrency(totalPending, showAmount, currencySymbol)}</b></center>` : ''}
        ${cards && Array.isArray(cards) && cards.length > 0 ? `<center><b>Картки для верифікації:</b><br>${cards.map(card => `
            <div style="display: inline-block; margin-top: 5px;">
                ${card}
                <button onclick="navigator.clipboard.writeText('${card.replace(/'/g, "\\'")}')" style="border: none; background: none; cursor: pointer; margin-left: 5px;">
                    <span class="fa fa-files-o"></span>
                </button>
            </div>`).join('<br>')}</center>` : ''}
        ${['Kycaid', 'SumSub'].includes(provider) ? `<center><span style="color: red; font-weight: bold;">Верифікація: ${provider}</span></center>` : ''}
    `;
        return mainText;
    }

    function createSettingsIcon() {
        const icon = document.createElement('div');
        icon.innerHTML = '<i class="fa fa-cog"></i>';
        applyStyles(icon, { ...ICON_STYLES, top: '10px', right: '10px' });
        icon.title = 'Налаштування';
        icon.onclick = createSettingsPopup;
        return icon;
    }

    function createSearchIcon() {
        const icon = document.createElement('div');
        icon.innerHTML = '<i class="fa fa-search"></i>';
        applyStyles(icon, { ...ICON_STYLES,
                           top: '10px',
                           right: '40px'
                          });
        icon.title = 'Швидкий пошук';
        icon.onclick = () => {
            createFindPopUp();
        };
        return icon;
    }

    function createStatisticIcon() {
        const icon = document.createElement('div');
        icon.innerHTML = '<i class="fa fa-signal"></i>';
        applyStyles(icon, { ...ICON_STYLES, top: '35px', right: '10px' });
        icon.title = 'Статистика';
        icon.onclick = createStatisticPopup;
        return icon;
    }

    function createStatusIcon() {
        const checkbox = document.getElementById('Players_enabled_autopayouts');
        const showAutopayments = GM_getValue('autoPaymentsDisplayKey', true);
        const icon = document.createElement('div');
        icon.innerHTML = checkbox?.checked ? '<i class="fa fa-check-circle" style="color: green;"></i>' : '<i class="fa fa-times-circle" style="color: red;"></i>';
        applyStyles(icon, { ...ICON_STYLES, top: '10px', left: '10px' });
        icon.title = 'Автовиплата';

        if (showAutopayments) {
            icon.onclick = () => {
                checkbox.click();
                setTimeout(() => {
                    document.querySelector('.swal2-confirm')?.click();
                    setTimeout(() => {
                        icon.innerHTML = checkbox.checked ? '<i class="fa fa-check-circle" style="color: green;"></i>' : '<i class="fa fa-times-circle" style="color: red;"></i>';
                    }, 200);
                }, 200);
            };
        } else {
            icon.style.pointerEvents = 'none';
        }
        return icon;
    }

    function createFraudIcon() {
        const icon = document.createElement('div');
        icon.innerHTML = '<i class="fa fa-eye"></i>';
        applyStyles(icon, { ...ICON_STYLES, top: '40px', left: '10px' });
        icon.title = 'Нагляд';
        icon.onclick = createFraudPopup;
        return icon;
    }

    async function createReminderIcon() {
        const showReminder = GM_getValue('reminderDisplayKey', true);
        if (!showReminder) return document.createElement('div');

        const hasNewArticles = await checkForNewArticles();
        const shouldBlink = GM_getValue('reminderBlinkKey', true);
        const icon = document.createElement('div');
        icon.innerHTML = '<i class="fa fa-book"></i>';
        applyStyles(icon, { ...ICON_STYLES, top: '70px', left: '10px' });
        icon.title = 'Памятка';
        if (hasNewArticles || shouldBlink) icon.classList.add('blinking');
        icon.onclick = () => {
            createReminderPopup();
            icon.classList.remove('blinking');
            GM_setValue('reminderBlinkKey', false);
        };
        return icon;
    }

    async function addAdminIcon(popupBox) {
        console.log(await checkUserStatus())
        if (await checkUserStatus() !== 'Admin') return;
        const icon = document.createElement('div');
        icon.innerHTML = '<i class="fa fa-users"></i>';
        applyStyles(icon, { ...ICON_STYLES, top: '70px', right: '10px', fontSize: '18px' });
        icon.title = 'Користувачі';
        icon.onclick = () => !document.getElementById('admin-popup') && createAdminPopup();
        popupBox.appendChild(icon);
        addExcludeButton();
    }

    function createButtonRows({ Balance, totalPending, TotalPA, isCheckedToday }) {
        const firstRow = createContainer({ marginTop: '10px', display: 'block', gap: '10px', textAlign: 'center' });
        firstRow.appendChild(createCleanButton(isCheckedToday));

        const secondRow = createContainer({ marginTop: '10px', display: 'flex', gap: '10px' });
        if (GM_getValue(pendingButtonsDisplayKey, true)) {
            secondRow.appendChild(createPendingPlusButton(TotalPA));
            secondRow.appendChild(createPendingMinusButton(TotalPA));
        }

        const container = document.createElement('div');
        container.appendChild(firstRow);
        container.appendChild(secondRow);
        return container;
    }

    function createCleanButton(isCheckedToday) {
        const button = document.createElement('button');
        button.className = 'clean-button';

        const baseStyles = { ...BUTTON_STYLES };

        const stateStyles = isCheckedToday
        ? { innerText: 'Checked ✔', backgroundColor: '#d3d3d3', color: '#000', border: '2px solid #000', disabled: true, cursor: 'default' }
        : { innerText: 'Checked', backgroundColor: '#28a745', disabled: false };

        const finalStyles = { ...baseStyles, ...stateStyles };
        Object.assign(button, finalStyles);
        applyStyles(button, finalStyles);

        button.onmouseover = () => !button.disabled && (button.style.backgroundColor = '#218838');
        button.onmouseout = () => !button.disabled && (button.style.backgroundColor = '#28a745');

        button.addEventListener('click', handleCleanButtonClick);
        return button;
    }

    function createPendingPlusButton(TotalPA) {
        const button = document.createElement('button');
        button.innerText = 'Pending (+)';
        applyStyles(button, { ...BUTTON_STYLES, backgroundColor: '#28a745' });
        button.onmouseover = () => button.style.backgroundColor = '#218838';
        button.onmouseout = () => button.style.backgroundColor = '#28a745';
        button.addEventListener('click', () => handlePendingPlusButtonClick(TotalPA));
        return button;
    }

    function createPendingMinusButton(TotalPA) {
        const button = document.createElement('button');
        button.innerText = 'Pending (-)';
        applyStyles(button, { ...BUTTON_STYLES, backgroundColor: '#dc3545' });
        button.onmouseover = () => button.style.backgroundColor = '#c82333';
        button.onmouseout = () => button.style.backgroundColor = '#dc3545';
        button.addEventListener('click', () => handlePendingMinusButtonClick(TotalPA));
        return button;
    }

    async function createProjectButtonContainer() {
        if (window.location.hostname.includes('admin.wildwinz.com')) return document.createElement('div');

        const container = createContainer({ marginTop: '10px', display: 'block', textAlign: 'center' });
        const searchImage = document.createElement('img');
        searchImage.src = 'https://cdn-icons-png.flaticon.com/512/64/64673.png';
        applyStyles(searchImage, { cursor: 'pointer', width: '50px', height: '50px' });
        searchImage.addEventListener('click', () => handleProjectSearchClick(container, searchImage));
        container.appendChild(searchImage);
        return container;
    }

    function createTotalInOutRow({ Balance, totalPending }) {
        const container = createContainer({ marginTop: '10px', display: 'block', textAlign: 'center' });
        const button = document.createElement('button');
        button.innerText = 'Total InOut';
        applyStyles(button, { ...BUTTON_STYLES, backgroundColor: '#2196F3' });

        button.onmouseover = () => button.style.backgroundColor = '#2f76ae';
        button.onmouseout = () => button.style.backgroundColor = '#2196F3';

        const clickHandler = window.location.hostname.includes('admin.wildwinz.com')
        ? handleTotalInOutClick
        : handleCombinedProfit;

        button.addEventListener('click', () => {
            button.remove();
            clickHandler(container, { Balance, totalPending });
        });

        container.appendChild(button);
        return container;
    }



    function addGlobalStyles(borderColor) {
        const styleSheet = document.createElement('style');
        styleSheet.innerText = `
        @keyframes glow { 0% { box-shadow: 0 0 5px ${borderColor}; } 100% { box-shadow: 0 0 25px ${borderColor}; } }
        @keyframes blink-red { 0% { background-color: transparent; } 50% { background-color: red; } 100% { background-color: transparent; } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .blinking { animation: blink-red 1s infinite; }
        #popup-container { min-height: 200px; overflow-y: auto; white-space: normal; word-wrap: break-word; }
    `;
        document.head.appendChild(styleSheet);
    }

    function handleCleanButtonClick() {
        const dataToInsert = {
            date: getCurrentDate(),
            url: window.location.href,
            project: getProject(),
            playerID: getPlayerID(),
            initials: GM_getValue('initialsKey', ''),
            comment: `Переглянутий в ${getCurrentTime()}`
        };
        sendDataToServer(dataToInsert, token)
            .then(response => {
            Swal.fire({ icon: 'success', title: 'Успішно!', text: 'Користувач позначений як переглянутий' })
                .then(result => result.isConfirmed && location.reload());
        })
            .catch(err => Swal.fire({ icon: 'error', title: 'Помилка!', text: 'Не вдалося надіслати дані.' }));
    }

    function handlePendingPlusButtonClick(TotalPA) {
        const date = getCurrentDate();
        const time = getCurrentTime();
        const initials = GM_getValue('initialsKey', '');
        const language = GM_getValue(languageKey, 'російська');
        const colorPA = getColor(TotalPA);
        const textToInsert = language === 'російська'
        ? `${date} в ${time} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | играет <b><font color="#14b814">своими</font></b> картами, чист, много безуспешных попыток депозита своей картой // Без угроз, потом деп прошел`
        : `${date} в ${time} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | грає <b><font color="#14b814">власними</font></b> картками, чистий, багато безуспішних спроб депозиту своєю карткою, потім деп пройшов`;
        insertTextIntoField(textToInsert);
    }

    function handlePendingMinusButtonClick(TotalPA) {
        const date = getCurrentDate();
        const time = getCurrentTime();
        const initials = GM_getValue('initialsKey', '');
        const language = GM_getValue(languageKey, 'російська');
        const colorPA = getColor(TotalPA);

        const textToInsert = language === 'російська'
        ? `${date} в ${time} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | много безуспешных попыток депозита <b>неизвестными</b> картами, <b>авто отключаем</b>`
        : `${date} в ${time} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | багато безуспішних спроб депозиту <b>невідомими</b> картками, <b>авто відключаємо</b>`;
        insertTextIntoField(textToInsert);
    }

    function createProjectContainer(project, projectUrl) {
        const container = createContainer({ marginBottom: '20px' });
        const image = document.createElement('img');

        if (!projectUrl) {
            console.error(`projectUrl is undefined for project: ${project}`);
            container.innerHTML = `<div>Ошибка: не удалось определить домен для проекта ${project}</div>`;
            return container;
        }

        const domainMatch = projectUrl.match(/https:\/\/[^\/]+/);
        if (!domainMatch) {
            console.error(`Invalid projectUrl for project ${project}: ${projectUrl}`);
            container.innerHTML = `<div>Ошибка: некорректный домен для проекта ${project}</div>`;
            return container;
        }

        const domain = domainMatch[0];
        image.src = `${domain}/img/${project}.png`;

        applyStyles(image, {
            display: 'block',
            margin: '0 auto 10px',
            width: project === 'betking' ? '47px' : '75px',
            height: project === 'betking' ? '47px' : 'auto'
        });
        container.appendChild(image);
        return container;
    }

    function handleProjectSearchClick(container, searchImage) {
        searchImage.remove();
        const projectUrls = {
            'betking': 'https://admin.betking.com.ua/players/playersItems/search/',
            '777': 'https://admin.777.ua/players/playersItems/search/',
            'vegas': 'https://admin.vegas.ua/players/playersItems/search/'
        };

        const currentProject = Object.keys(projectUrls).find(p => window.location.hostname.includes(p)) || 'vegas';
        const otherProjects = Object.keys(projectUrls).filter(p => p !== currentProject);

        const url = getAjaxUrl();
        if (!url) {
            container.innerHTML += '<div>Не удалось найти URL для запроса.</div>';
            return;
        }

        GM_xmlhttpRequest({
            method: 'GET',
            url,
            onload: response => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = response.responseText;
                const inn = tempDiv.querySelector('#common_services_players_models_PlayerCredentials_inn')?.value;
                const email = getFirstValueByLabel('E-mail');
                const phone = getFirstValueByLabel('Телефон');

                otherProjects.forEach(project => {
                    const projectUrl = projectUrls[project];
                    const projectContainer = createProjectContainer(project, projectUrl);
                    container.appendChild(projectContainer);

                    searchUser(inn, 'inn', projectUrl, projectContainer);
                    searchUser(email, 'email', projectUrl, projectContainer);
                    searchUser(phone, 'phone', projectUrl, projectContainer);
                    processProjectCards(project, projectUrl, projectContainer);
                });

                processCurrentProjectCards(currentProject, projectUrls[currentProject], container);
            },
            onerror: () => container.innerHTML += '<div>Ошибка при получении данных ИНН.</div>'
        });
    }

    function searchUser(query, fieldType, projectUrl, container) {
        const searchTypeLabel = fieldType === 'inn' ? 'ІПН' : (fieldType === 'email' ? 'E-mail' : 'Телефон');
        GM_xmlhttpRequest({
            method: 'POST',
            url: projectUrl,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: `PlayersSearchForm[${fieldType}]=${encodeURIComponent(query)}`,
            onload: response => {
                response.finalUrl.includes('/update/')
                    ? getUserInfo(response.finalUrl, fieldType, container)
                : container.innerHTML += `<div><b>${searchTypeLabel}:</b> не знайдено</div>`;
            },
            onerror: () => container.innerHTML += `<div><b>${searchTypeLabel}:</b> Помилка при пошуку</div>`
        });
    }

    function getUserInfo(url, fieldType, container) {
        GM_xmlhttpRequest({
            method: 'GET',
            url,
            onload: response => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = response.responseText;
                const playerId = getValueByLabel(tempDiv, 'Номер игрока');
                let status = determineUserStatus(tempDiv);
                const searchTypeLabel = fieldType === 'inn' ? 'ІПН' : (fieldType === 'email' ? 'E-mail' : 'Телефон');
                container.innerHTML += `<div><b>${searchTypeLabel}:</b> <a class="label label-${status}" href="${url}" target="_blank">${playerId}</a></div>`;
            },
            onerror: () => container.innerHTML += '<div>Помилка при отриманні даних користувача.</div>'
        });
    }

    function determineUserStatus(tempDiv) {
        const attentionHeaders = tempDiv.querySelectorAll('h1.attention-header');
        for (const header of attentionHeaders) {
            const text = header.textContent.trim();
            if (text.includes('Дубликат') || text.includes('Отключен') || text.includes('Ограничение по возрасту!') || text.includes('Не подтвержден')) return 'danger';
            if (text.includes('Лудоман')) return 'info';
        }
        return ['Имя', 'Middle Name', 'Фамилия'].every(field => {
            const row = [...tempDiv.querySelectorAll('tr')].find(r => r.querySelector('th')?.textContent.includes(field));
            return row && ['Не задан', 'Не заданий', ''].includes(row.querySelector('td')?.textContent.trim());
        }) ? 'default' : 'success';
    }

    function processProjectCards(project, projectUrl, container) {
        fetchAllCards().then(data => {
            const cards = data.cards;
            console.log(cards)
            const searchUrl = projectUrl.replace('/players/playersItems/search/', '/payments/paymentsItemsOut/requisite/');
            const openUrl = projectUrl.replace('/players/playersItems/search/', '');
            cards.forEach(card => processCard(card, searchUrl, openUrl, container));
        });
    }

    function processCurrentProjectCards(project, projectUrl, parentContainer) {
        fetchAllCards().then(data => {
            const cards = data.cards;
            const searchUrl = projectUrl.replace('/players/playersItems/search/', '/payments/paymentsItemsOut/requisite/');
            const openUrl = projectUrl.replace('/players/playersItems/search/', '');
            let projectContainer;
            let foundPlayers = false;

            cards.forEach(card => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: searchUrl,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: `PaymentsRequisiteForm[requisite]=${encodeURIComponent(card)}`,
                    onload: response => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = response.responseText;
                        const table = tempDiv.querySelector('table.items tbody');
                        if (!table) return;

                        table.querySelectorAll('tr').forEach(row => {
                            const playerCard = row.querySelector('td span.player_card');
                            if (playerCard && !playerCard.outerHTML.includes(userId)) {
                                if (!projectContainer) {
                                    projectContainer = createProjectContainer(project, projectUrl);
                                }
                                projectContainer.innerHTML += `<b>${card.slice(0, 6)}|${card.slice(-4)}:</b> ${cleanCardHtml(playerCard.outerHTML, openUrl)}`;
                                foundPlayers = true;
                            }
                        });
                    },
                    onloadend: () => foundPlayers && projectContainer && !projectContainer.parentElement && parentContainer.appendChild(projectContainer)
                });
            });
        });
    }

    function processCard(card, searchUrl, openUrl, container) {
        GM_xmlhttpRequest({
            method: 'POST',
            url: searchUrl,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: `PaymentsRequisiteForm[requisite]=${encodeURIComponent(card)}`,
            onload: response => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = response.responseText;
                const table = tempDiv.querySelector('table.items tbody');
                if (!table) return;

                table.querySelectorAll('tr').forEach(row => {
                    const playerCard = row.querySelector('td span.player_card');
                    if (playerCard) {
                        container.innerHTML += `<b>${card.slice(0, 6)}|${card.slice(-4)}:</b> ${cleanCardHtml(playerCard.outerHTML, openUrl)}`;
                    }
                });
            }
        });
    }

    function cleanCardHtml(cardHtml, openUrl) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHtml;
        tempDiv.querySelectorAll('a').forEach(link => link.setAttribute('href', `${openUrl}${link.getAttribute('href')}`));
        const span = tempDiv.querySelector('.player_card');
        if (span) {
            span.removeAttribute('rel');
            span.removeAttribute('data-content');
        }
        return tempDiv.innerHTML;
    }

    const PROJECT_DOMAINS = [
        'https://admin.777.ua/',
        'https://admin.vegas.ua/',
        'https://admin.betking.com.ua/'
    ];

    function insertTextToComment(textToInsert, shouldUpdate) {
        const gatewayElement = document.getElementById('gateway-method-description-visible-antifraud_manager');
        const doneButton = document.querySelector('.btn-update-comment-antifraud_manager');

        if (!gatewayElement) {
            console.warn('Element with id "gateway-method-description-visible-antifraud_manager" not found.');
            return;
        }

        const currentLanguage = GM_getValue(languageKey, 'російська');
        const fieldDate = getDateFromField();
        const today = getCurrentDate();

        if (fieldDate === today) {
            const lines = gatewayElement.innerHTML.trim().split('<br>');
            if (lines.length > 1) {
                let secondLine = lines[1];
                let lastPipeIndex = secondLine.lastIndexOf('|');
                let foundValidIndex = false;

                while (lastPipeIndex !== -1) {
                    const beforePipe = secondLine.slice(0, lastPipeIndex).trim();
                    const afterPipe = secondLine.slice(lastPipeIndex + 1).trim();

                    const beforeMatch = beforePipe.match(/\d{4}$/);
                    const afterMatch = afterPipe.match(/^\d{2}/);

                    if (!(beforeMatch && afterMatch)) {
                        const validBeforePipe = secondLine.slice(0, lastPipeIndex + 1);
                        const validAfterPipe = secondLine.slice(lastPipeIndex + 1).trim();
                        const updatedSecondLine = `${validBeforePipe} ${textToInsert} | ${validAfterPipe}`.trim();
                        lines[1] = updatedSecondLine;

                        gatewayElement.innerHTML = lines.join('<br>');
                        gatewayElement.dispatchEvent(new Event('input'));

                        if (shouldUpdate) {
                            if (doneButton) {
                                doneButton.click();
                            }
                        }

                        foundValidIndex = true;
                        break;
                    }

                    lastPipeIndex = secondLine.lastIndexOf('|', lastPipeIndex - 1);
                }

                if (!foundValidIndex) {
                    console.warn('Valid "|" not found in the second line.');
                }
            } else {
                console.warn('Not enough lines to process the second line.');
            }
        } else {
            const checkButton = document.getElementById('check-button');
            if (checkButton) {
                checkButton.click();

                const lines = gatewayElement.innerHTML.trim().split('<br>');
                if (lines.length > 1) {
                    const secondLine = lines[1];
                    const lastPipeIndex = secondLine.lastIndexOf('|');
                    if (lastPipeIndex !== -1) {
                        const beforePipe = secondLine.slice(0, lastPipeIndex + 1);
                        const afterPipe = secondLine.slice(lastPipeIndex + 1).trim();
                        const updatedSecondLine = `${beforePipe} ${afterPipe} ${textToInsert} |`.trim();
                        lines[1] = updatedSecondLine;
                        gatewayElement.innerHTML = lines.join('<br>');
                        gatewayElement.dispatchEvent(new Event('input'));
                        if (shouldUpdate) {
                            if (doneButton) {
                                doneButton.click();
                            }
                        }
                    } else {
                        console.warn('Symbol "|" not found in the second line.');
                    }
                } else {
                    console.warn('Not enough lines to process the second line.');
                }
            } else {
                console.warn('Button with id "check-button" not found.');
            }
        }
    }

    function getTomorrowDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0'); // Месяц (0-11) + 1, с ведущим нулем
        const day = String(tomorrow.getDate()).padStart(2, '0'); // День с ведущим нулем
        return `${year}.${month}.${day}`;
    }

    async function handleCombinedProfit(container, { Balance, totalPending }) {
        const loader = createLoader();
        container.appendChild(loader);

        const styleElement = document.createElement('style');
        styleElement.textContent = COMBINED_STYLES;
        document.head.appendChild(styleElement);

        try {
            const playerID = getPlayerID();
            const baseURL = `${ProjectUrl}players/playersDetail/index/`;
            const currentPlayerData = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: baseURL,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: `PlayersDetailForm[login]=${encodeURIComponent(playerID)}&PlayersDetailForm[period]=2015.06.09+00:00:00+-+${getTomorrowDate()}+23:59:59&PlayersDetailForm[show_table]=1`,
                    onload: response => {
                        const doc = new DOMParser().parseFromString(response.responseText, 'text/html');
                        const table = doc.querySelector('.detail-view');
                        if (!table) {
                            reject(new Error('Таблица текущего игрока не найдена'));
                            return;
                        }

                        let depositsTotal = 0, redeemsTotal = 0;
                        table.querySelectorAll('tr').forEach(row => {
                            const key = row.querySelector('th')?.textContent.trim();
                            const value = parseFloat(row.querySelector('td')?.textContent.trim().replace(/[^0-9.-]/g, '')) || 0;
                            if (key === 'Deposits Total') depositsTotal = value;
                            if (key === 'Redeems Total') redeemsTotal = value;
                        });

                        const profit = depositsTotal - redeemsTotal;
                        resolve({ deposits: depositsTotal, withdrawals: redeemsTotal, profit });
                    },
                    onerror: error => reject(error)
                });
            });

            const inn = await getPlayerInn();
            if (!inn) {
                handleTotalInOutClick(container, { Balance, totalPending });
                container.removeChild(loader);
                return
            }

            const currentProject = window.location.origin + '/';
            const searchDomains = PROJECT_DOMAINS.filter(domain => domain !== currentProject);
            const foundPlayers = await Promise.all(
                searchDomains.map(domain => searchPlayerByInn(domain, inn))
            );

            const validPlayers = foundPlayers.filter(result => result && result.playerId);
            const relatedResults = await Promise.all(
                validPlayers.map(result => calculateTotalInOut(result.domain, result.playerId))
            );

            const cleanBalance = parseFloat(Balance) || 0;
            const safeBalance = getInnerBalanceValue();
            const profit = currentPlayerData.profit;
            const prognoseInOut = currentPlayerData.deposits - (totalPending + currentPlayerData.withdrawals + cleanBalance + safeBalance);
            const prognosePA = currentPlayerData.deposits ? ((currentPlayerData.withdrawals + totalPending + cleanBalance + safeBalance) / currentPlayerData.deposits) * 100 : 0;
            const showAmount = GM_getValue(amountDisplayKey, true);
            const currencySymbol = currencySymbols.get(getCurrency()) || '';
            const totalProfit = currentPlayerData.profit + relatedResults.reduce((sum, r) => sum + (r.depositsTotal - r.redeemsTotal), 0);
            container.removeChild(loader);
            container.innerHTML = `
            <div class="profit-section main-profit">
                <b class="clickable" data-text='<b>Total InOut: <span style="color: ${getBalanceColor(profit)}">${formatCurrency(profit, showAmount, currencySymbol)}</span></b>'>
                    Total InOut: <span style="color: ${getBalanceColor(profit)}">${formatCurrency(profit, showAmount, currencySymbol)}</span>
                </b><br>
                ${(totalPending > 1 || cleanBalance > 1 || safeBalance > 1) ? `
                    <b class="clickable" data-text='<b>Prognose InOut: <span style="color: ${getBalanceColor(prognoseInOut)}">${formatCurrency(prognoseInOut, showAmount, currencySymbol)}</span></b>'>
                        Prognose InOut: <span style="color: ${getBalanceColor(prognoseInOut)}">${formatCurrency(prognoseInOut, showAmount, currencySymbol)}</span>
                    </b><br>
                    <b class="clickable" data-text='<b>Prognose PA: <span style="color: ${getColor(prognosePA / 100)}">${prognosePA.toFixed(2)}%</span></b>'>
                        Prognose PA: <span style="color: ${getColor(prognosePA / 100)}">${prognosePA.toFixed(2)}%</span>
                    </b>
                ` : ''}
            </div>
            <div class="profit-section related-projects">
                <b>Related Projects:</b><br>
                ${relatedResults.map((proj, index) => {
                const projectName = proj.domain.split('.')[1].toUpperCase();
                const playerId = validPlayers[index].playerId;
                const profit = proj.depositsTotal - proj.redeemsTotal;
                const link = `${proj.domain}players/playersItems/search?PlayersSearchForm[number]=${playerId || 'unknown'}`;
                return `<div><a href="${link}" target="_blank" class="project-link">${projectName} - ${playerId}</a>: <span style="color: ${getBalanceColor(profit)}">${formatCurrency(profit, true, currencySymbol)}</span></div>`;
            }).join('')}
            </div>
            <div class="profit-section total-profit">
                <div><b>Person InOut:</b> <span style="color: ${getBalanceColor(totalProfit)}">${formatCurrency(totalProfit, showAmount, currencySymbol)}</span></div>
            </div>
        `;

            container.querySelectorAll('.clickable').forEach(element => {
                element.addEventListener('click', () => {
                    if (element.dataset.clicked === 'true') return;

                    const formattedText = element.getAttribute('data-text');
                    insertTextToComment(formattedText);
                    element.dataset.clicked = 'true';

                    element.style.opacity = '0.85';
                });
            });

        } catch (error) {
            container.removeChild(loader);
            container.innerHTML = `<div style="color: red;">Ошибка: ${error.message}</div>`;
        }
    }

    function getBalanceColor(amount) {
        return amount >= 0 ? 'green' : 'red';
    }


    function getPlayerInn() {
        return new Promise((resolve, reject) => {
            const scripts = Array.from(document.querySelectorAll('script'));
            const credentialsScript = scripts.find(script =>
                                                   script.textContent.includes('#credentials-info') && script.textContent.includes('/players/playerCredentials/show/')
                                                  );
            if (!credentialsScript) return reject(new Error('Скрипт с URL для ИНН не найден'));

            const urlMatch = credentialsScript.textContent.match(/url:\s*['"]\/players\/playerCredentials\/show\/\d+\/['"]/);
            if (!urlMatch) return reject(new Error('URL для ИНН не найден'));
            const url = urlMatch[0].match(/['"]([^'"]+)['"]/)[1];

            $.ajax({
                url: url,
                method: 'GET',
                success: response => {
                    const doc = new DOMParser().parseFromString(response, 'text/html');
                    const innInput = doc.querySelector('#common_services_players_models_PlayerCredentials_inn');
                    resolve(innInput?.value || null);
                },
                error: () => reject(new Error('Не удалось загрузить ИНН'))
            });
        });
    }

    function searchPlayerByInn(domain, inn) {
        return new Promise(resolve => {
            const url = `${domain}players/playersItems/search?PlayersSearchForm[inn]=${inn}`;
            function handleRequest(currentUrl) {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: currentUrl,
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    onload: response => {
                        if (response.status === 301 || response.status === 302) {
                            const redirectUrlMatch = response.responseHeaders.match(/location: (.+)/i);
                            const redirectUrl = redirectUrlMatch ? redirectUrlMatch[1].trim() : null;
                            if (redirectUrl) handleRequest(redirectUrl);
                            else resolve(null);
                        } else if (response.status === 200) {
                            const doc = new DOMParser().parseFromString(response.responseText, 'text/html');
                            const playerRow = doc.querySelector('tr.even');
                            if (playerRow) {
                                const playerIdSpan = playerRow.querySelector('td span:not(.fa):not(.manager-names)');
                                const playerId = playerIdSpan ? playerIdSpan.textContent.trim() : null;
                                resolve(playerId ? { domain, playerId } : null);
                            } else {
                                resolve(null);
                            }
                        } else {
                            resolve(null);
                        }
                    },
                    onerror: () => resolve(null)
                });
            }
            handleRequest(url);
        });
    }

    function calculateTotalInOut(domain, playerId) {
        return new Promise(resolve => {
            const baseURL = `${domain}players/playersDetail/index/`;
            GM_xmlhttpRequest({
                method: 'POST',
                url: baseURL,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: `PlayersDetailForm[login]=${encodeURIComponent(playerId)}&PlayersDetailForm[period]=2015.06.09+00:00:00+-+${getTomorrowDate()}+23:59:59&PlayersDetailForm[show_table]=1`,
                onload: response => {
                    const doc = new DOMParser().parseFromString(response.responseText, 'text/html');
                    const table = doc.querySelector('.detail-view');
                    let depositsTotal = 0, redeemsTotal = 0;
                    if (table) {
                        table.querySelectorAll('tr').forEach(row => {
                            const key = row.querySelector('th')?.textContent.trim();
                            const value = parseFloat(row.querySelector('td')?.textContent.trim().replace(/[^0-9.-]/g, '')) || 0;
                            if (key === 'Deposits Total') depositsTotal = value;
                            if (key === 'Redeems Total') redeemsTotal = value;
                        });
                    }
                    resolve({ domain, depositsTotal, redeemsTotal, playerId }); // Добавляем playerId в результат
                },
                onerror: () => resolve({ domain, depositsTotal: 0, redeemsTotal: 0, playerId })
            });
        });
    }

    function handleTotalInOutClick(container, { Balance, totalPending }) {
        if (isProfitButtonClicked) return;
        isProfitButtonClicked = true;

        const loader = createLoader();
        container.appendChild(loader);

        const playerID = getPlayerID();
        const baseURL = `${ProjectUrl}players/playersDetail/index/`;
        GM_xmlhttpRequest({
            method: 'POST',
            url: baseURL,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: `PlayersDetailForm[login]=${encodeURIComponent(playerID)}&PlayersDetailForm[period]=2015.06.09+00:00:00+-+${getTomorrowDate()}+23:59:59&PlayersDetailForm[show_table]=1`,
            onload: response => {
                container.removeChild(loader);
                const doc = new DOMParser().parseFromString(response.responseText, 'text/html');
                const table = doc.querySelector('.detail-view');
                if (!table) {
                    container.innerHTML += 'Таблица с результатами не найдена.';
                    return;
                }

                let depositsTotal = 0, redeemsTotal = 0;
                table.querySelectorAll('tr').forEach(row => {
                    const key = row.querySelector('th')?.textContent.trim();
                    const value = parseFloat(row.querySelector('td')?.textContent.trim().replace(/[^0-9.-]/g, '')) || 0;
                    if (key === 'Deposits Total') depositsTotal = value;
                    if (key === 'Redeems Total') redeemsTotal = value;
                });

                const cleanBalance = parseFloat(Balance);
                const safeBalance = getInnerBalanceValue();
                const profit = depositsTotal - redeemsTotal;
                const prognoseInOut = depositsTotal - (totalPending + redeemsTotal + cleanBalance + safeBalance);
                const prognosePA = ((redeemsTotal + totalPending + cleanBalance + safeBalance) / depositsTotal) * 100;
                const showAmount = GM_getValue(amountDisplayKey, true);
                const currencySymbol = currencySymbols.get(getCurrency()) || '';

                container.innerHTML = `
                <div class="profit-section main-profit">
                    <b class="clickable" data-text='<b>Total InOut: <span style="color: ${getBalanceColor(profit)}">${formatCurrency(profit, showAmount, currencySymbol)}</span></b>'>
                        Total InOut: <span style="color: ${getBalanceColor(profit)}">${formatCurrency(profit, showAmount, currencySymbol)}</span>
                    </b><br>
                    ${(totalPending > 1 || cleanBalance > 1 || safeBalance > 1) ? `
                        <b class="clickable" data-text='<b>Prognose InOut: <span style="color: ${getBalanceColor(prognoseInOut)}">${formatCurrency(prognoseInOut, showAmount, currencySymbol)}</span></b>'>
                            Prognose InOut: <span style="color: ${getBalanceColor(prognoseInOut)}">${formatCurrency(prognoseInOut, showAmount, currencySymbol)}</span>
                        </b><br>
                        <b class="clickable" data-text='<b>Prognose PA: <span style="color: ${getColor(prognosePA / 100)}">${prognosePA.toFixed(2)}%</span></b>'>
                            Prognose PA: <span style="color: ${getColor(prognosePA / 100)}">${prognosePA.toFixed(2)}%</span>
                        </b>
                    ` : ''}
                </div>
            `;

                container.querySelectorAll('.clickable').forEach(element => {
                    element.addEventListener('click', () => {
                        const formattedText = element.getAttribute('data-text');
                        insertTextToComment(formattedText, false);
                    });
                });
            },
            onerror: error => {
                container.removeChild(loader);
                container.innerHTML += `Ошибка запроса: ${error.message}`;
            }
        });
    }


    function createLoader() {
        const loader = document.createElement('div');
        applyStyles(loader, {
            border: '8px solid #f3f3f3',
            borderTop: '8px solid #3498db',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 2s linear infinite',
            margin: '10px auto',
            display: 'block'
        });
        return loader;
    }

    function getValueByLabel(doc, labelText) {
        for (const row of doc.querySelectorAll('tr')) {
            const th = row.querySelector('th');
            const td = row.querySelector('td');
            if (th?.textContent.trim() === labelText) return td?.textContent.trim().split('\n')[0].trim() || 'Не найдено';
        }
        return 'Не найдено';
    }

    function getFirstValueByLabel(labelText) {
        for (const row of document.querySelectorAll('tr')) {
            const th = row.querySelector('th');
            const td = row.querySelector('td');
            if (th?.textContent.trim() === labelText) return td?.textContent.trim().split('\n')[0].trim() || 'Не найдено';
        }
        return 'Не найдено';
    }

    function getAjaxUrl() {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            if (script.textContent.includes('#credentials-info')) {
                const urlMatch = script.textContent.match(/url:\s*'([^']+)'/);
                return urlMatch ? urlMatch[1] : null;
            }
        }
        return null;
    }

    const MESSAGE_STYLES = {
        color: 'red',
        fontWeight: 'bold',
        marginTop: '10px'
    };

    function createClickableMessage(id, content, onClick) {
        const message = document.createElement('div');
        applyStyles(message, MESSAGE_STYLES);
        message.innerHTML = `<center><span id="${id}">${content}</span></center>`;

        const clickableText = message.querySelector(`#${id}`);
        if (clickableText) {
            clickableText.addEventListener('click', onClick);
        }
        return message;
    }

    async function updatePopupBox({ balanceAfterBonus, withdrawAmount, bonusId, bonusText, withdrawId, withdrawText, bonusAmount, bonusDate, index }) {
        console.log('Starting updatePopupBox with params:', { balanceAfterBonus, withdrawAmount, bonusId, bonusText, withdrawId, withdrawText, bonusAmount, bonusDate, index });

        if (!window.popupBox) {
            console.error('Попап не существует');
            return;
        }
        console.log('popupBox exists:', window.popupBox); // Проверяем, что попап есть

        const textElement = window.popupBox.querySelector('.popup-text');
        console.log('textElement:', textElement); // Проверяем, найден ли .popup-text

        if (!textElement) {
            console.warn('Элемент .popup-text не найден в попапе');
            return;
        }

        const content = `Можливе порушення BTR:<br>${bonusDate}<br>відіграв ${balanceAfterBonus}₴, виводить ${withdrawAmount}₴`;
        const onClick = () => {
            const textToInsert = `
#<b>${bonusId} | ${bonusText} | ${bonusAmount}₴ | ${balanceAfterBonus}₴<br>
#${withdrawId} | ${withdrawText} | ${withdrawAmount}₴</b>`;
            console.log('Inserting text:', textToInsert);
            insertTextIntoField(textToInsert);
        };

        const message = createClickableMessage(`popup-clickable-text-${index}`, content, onClick);
        console.log('Message created:', message);
        textElement.appendChild(message);
        console.log('Message appended to textElement:', textElement.innerHTML); // Проверяем, добавлено ли
    }

    function showBonusViolationMessage({ bonusId, dateStr, index, count }) {

        if (!window.popupBox) {
            console.error('Попап не существует');
            return;
        }

        const textElement = window.popupBox.querySelector('.popup-text');

        if (!textElement) {
            console.warn('Элемент .popup-text не найден в попапе');
            return;
        }

        const content = `Бонус ${bonusId} присвоєно більше ${count} разів за день ${dateStr}`;
        const onClick = () => insertTextIntoField(`#<b>Бонус ${bonusId} присвоєно більше ${count} разів за день ${dateStr}</b>`);

        textElement.appendChild(createClickableMessage(`popup-bonus-violation-${index}`, content, onClick));
    }

    function showBRP({ totalDeposits, bonusWithDeposits, bonusDepositPercentage }) {
        const popupText = document.querySelector('.popup-main-text');
        if (!popupText) {
            console.warn('Елемент з класом .popup-main-text не знайдено');
            return;
        }

        const textColor = bonusDepositPercentage > 50 ? 'maroon' : 'black';
        const newLine = document.createElement('div');
        newLine.innerHTML = `
        <center>
            <b title="Кількість депозитів: ${totalDeposits}\nБонусів з депозитом: ${bonusWithDeposits}" style="color: ${textColor};">
                BRP: ${bonusDepositPercentage.toFixed(2)}%
            </b>
        </center>`;
        popupText.appendChild(newLine);
    }


    async function fetchTransactionData(url) {
        const response = await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                onload: resolve,
                onerror: reject
            });
        });
        return new DOMParser().parseFromString(response.responseText, 'text/html');
    }

    async function fetchDetailedTransactionData(url, formData) {
        const response = await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: new URLSearchParams(formData).toString(),
                onload: resolve,
                onerror: reject
            });
        });
        return new DOMParser().parseFromString(response.responseText, 'text/html');
    }

    function processTransactionRow(row, state) {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return;

        const actionType = cells[1]?.textContent.trim() || '';
        const bonusInfo = cells[7]?.textContent.trim() || '';
        const dateStr = (cells[6]?.textContent.trim().match(/^(\d{2}\/\d{2}\/\d{4})/) || [])[1] || '';

        if (actionType.includes('Вывод средств')) {
            state.withdrawAmount = parseFloat(cells[2]?.textContent.replace('-', '').replace(',', '.') || '0');
            state.totalWithdrawAmount += state.withdrawAmount;
            state.withdrawId = cells[0]?.textContent.trim() || '';
            state.withdrawText = bonusInfo;
            state.waitingForBonus = true;
        } else if (['Ввод средств', 'Purchase', 'Возврат средств', 'Отмена вывода средств'].some(t => actionType.includes(t))) {
            state.withdrawAmount = 0;
            state.balanceAfterBonus = 0;
            state.waitingForBonus = false;
            state.totalWithdrawAmount = 0;
            state.totalDeposits++;
        } else if (actionType.includes('Ручное начисление баланса')) {
            const amount = parseFloat(cells[2]?.textContent.replace(',', '.') || '0');
            if (amount > 1 && state.manualBalanceCount < 3) { 
                showManualBalance({ dateStr, bonusInfo, index: state.manualBalanceCount++ });
            }
        } else if (actionType.includes('Отыгрывание бонуса') && state.waitingForBonus) {
            state.bonusAmount = parseFloat(cells[2]?.textContent.replace(',', '.') || '0');
            state.balanceAfterBonus = parseFloat(cells[3]?.textContent.replace(',', '.') || '0');
            state.bonusId = cells[0]?.textContent.trim() || '';
            state.bonusText = bonusInfo;
            state.bonusDate = dateStr;
            if (state.totalWithdrawAmount > state.balanceAfterBonus && state.messageCount < 2) {
                updatePopupBox({ ...state, index: state.messageCount++ });
            }
            state.waitingForBonus = false;
        } else if (actionType.includes('Присвоение бонуса') || actionType.includes('Bonus assignment')) {
            if (bonusInfo.match(/платеж № (\d+)/)) state.bonusWithDeposits++;
            const bonusIdMatch = bonusInfo.match(/№ (\d+)/);
            if (bonusIdMatch) {
                const bonusId = bonusIdMatch[1];
                state.bonusAssignments[bonusId] = state.bonusAssignments[bonusId] || {};
                state.bonusAssignments[bonusId][dateStr] = (state.bonusAssignments[bonusId][dateStr] || 0) + 1;
                const bonusCount = state.bonusAssignments[bonusId][dateStr];

                if (bonusCount >= 3 && !state.displayedMessages[`${bonusId}_${dateStr}`] && state.messageCount < 2) {
                    showBonusViolationMessage({
                        bonusId,
                        dateStr,
                        index: state.messageCount++,
                        count: bonusCount
                    });
                    state.displayedMessages[`${bonusId}_${dateStr}`] = true;
                }
            }
        }
    }

    function showManualBalance({ dateStr, bonusInfo, index }) {
        if (!window.popupBox) {
            console.error('Попап не существует');
            return;
        }

        const textElement = window.popupBox.querySelector('.popup-text');
        if (!textElement) return;

        const message = document.createElement('div');
        applyStyles(message, { ...MESSAGE_STYLES, color: 'blue' });
        message.innerHTML = `<center><span id="popup-manual-balance-${index}">${bonusInfo} | ${dateStr}</span></center>`;
        textElement.appendChild(message);
    }

    async function fetchAndProcessData() {
        const project = getProject();
        const url = `${ProjectUrl}players/playersItems/transactionLog/${userId}/`;
        console.log('Запрос данных по URL:', url);

        try {
            const initialDoc = await fetchTransactionData(url);
            const formData = new FormData();
            formData.append('pageSize', '10000');
            const doc = await fetchDetailedTransactionData(url, formData);

            const state = {
                withdrawAmount: 0,
                manualBalanceCount: 0,
                balanceAfterBonus: 0,
                bonusAmount: 0,
                waitingForBonus: false,
                bonusId: '',
                bonusText: '',
                withdrawId: '',
                withdrawText: '',
                bonusDate: '',
                totalDeposits: 0,
                bonusWithDeposits: 0,
                totalWithdrawAmount: 0,
                messageCount: 0,
                bonusAssignments: {},
                displayedMessages: {}
            };

            doc.querySelectorAll('tr').forEach(row => processTransactionRow(row, state));

            if (state.totalDeposits > 0) {
                const bonusDepositPercentage = (state.bonusWithDeposits / state.totalDeposits) * 100;
                console.log(`Загальна кількість депозитів: ${state.totalDeposits}, Бонусів з депозитом: ${state.bonusWithDeposits}, BRP: ${bonusDepositPercentage.toFixed(2)}%`);
                showBRP({ totalDeposits: state.totalDeposits, bonusWithDeposits: state.bonusWithDeposits, bonusDepositPercentage });
            } else {
                console.log('Депозити відсутні.');
            }
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        }
    }

    async function fetchPaymentsData({ searchLogin, includePending = false }) {
        const url = `${ProjectUrl}payments/paymentsItemsOut/index/?PaymentsItemsOutForm%5Bsearch_login%5D=${searchLogin}&newPageSize=2000`;
        try {
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    onload: resolve,
                    onerror: reject
                });
            });

            const doc = new DOMParser().parseFromString(response.responseText, 'text/html');

            const allCardsSet = new Set();
            const displayCardsSet = new Set();
            let totalPending = 0;

            doc.querySelectorAll('tr').forEach(row => {
                const cardLabelSpecific = row.querySelector('td:nth-child(10) span.label[style="background-color: #8D8A8E"]');
                if (cardLabelSpecific?.textContent.trim()) {
                    displayCardsSet.add(cardLabelSpecific.textContent.trim());
                }

                const cardLabel = row.querySelector('td:nth-child(10)');
                if (cardLabel?.textContent.trim()) {
                    allCardsSet.add(cardLabel.textContent.trim());
                }

                if (includePending) {
                    const statusSpan = row.querySelector('span.label');
                    const status = statusSpan?.textContent.trim();
                    if (['pending', 'review', 'on_hold'].includes(status)) {
                        const amountText = row.querySelector('td:nth-child(5) code')?.textContent.trim().replace('UAH', '').replace(',', '.') || '0';
                        totalPending += parseFloat(amountText) || 0;
                    }
                }
            });

            const allCards = Array.from(allCardsSet);
            const displayCards = Array.from(displayCardsSet);
            return includePending
                ? { totalPending, cards: allCards, displayCards }
            : { cards: allCards, displayCards };
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            throw error;
        }
    }
    async function fetchAndProcessPending() {
        return fetchPaymentsData({ searchLogin: getPlayerID(), includePending: true });
    }

    async function fetchAllCards() {
        const result = await fetchPaymentsData({ searchLogin: getPlayerID() });
        console.log('Fetched cards:', result.cards);
        return result;
    }

    function createOrUpdatePopup(message, isLoading = false) {
        let popup = document.getElementById('balance-log-analyzer-popup');

        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'balance-log-analyzer-popup';
            popup.style.position = 'fixed';
            popup.style.top = '10px';
            popup.style.right = '10px';
            popup.style.padding = '10px';
            popup.style.backgroundColor = 'white';
            popup.style.border = '1px solid black';
            popup.style.zIndex = '10000';
            popup.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
            popup.style.borderRadius = '5px';
            document.body.appendChild(popup);
        }

        popup.innerHTML = `
        <div style="font-size: 14px; margin-bottom: 10px;">${message}</div>
        ${isLoading ? '<div class="loader"></div>' : ''}
    `;

        const links = popup.querySelectorAll('a[data-round-id]');
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const roundId = this.getAttribute('data-round-id');
                scrollToRound(roundId);
            });
        });

        const toggleButtons = popup.querySelectorAll('.toggle-button');
        toggleButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                const content = this.nextElementSibling;
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    this.textContent = '▼';
                } else {
                    content.style.display = 'none';
                    this.textContent = '►';
                }
            });
        });

        if (isLoading) {
            let style = document.getElementById('balance-log-analyzer-popup-style');
            if (!style) {
                style = document.createElement('style');
                style.id = 'balance-log-analyzer-popup-style';
                style.innerHTML = `
                .loader {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    animation: spin 2s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
                document.head.appendChild(style);
            }
        }
    }


    function checkMultipleBets(data) {
        const gameBets = {};

        data.forEach(entry => {
            if (entry.type === 'Bet') {
                if (!gameBets[entry.game]) {
                    gameBets[entry.game] = [];
                }
                gameBets[entry.game].push(entry);
            }
        });

        const alerts = [];

        for (const game in gameBets) {
            const bets = gameBets[game];
            let currentPeriod = [];
            let previousGame = null;

            bets.forEach(bet => {
                if (bet.game === previousGame) {
                    currentPeriod.push(bet);
                } else {
                    if (currentPeriod.length >= 1000) {
                        alerts.push(currentPeriod[0]);
                        alerts.push(currentPeriod[currentPeriod.length - 1]);
                    }
                    currentPeriod = [bet];
                }
                previousGame = bet.game;
            });

            if (currentPeriod.length >= 1000) {
                alerts.push(currentPeriod[0]);
                alerts.push(currentPeriod[currentPeriod.length - 1]);
            }
        }

        return alerts;
    }



    function checkAnomalousBetIncreases(data) {
        const gameBets = {};

        data.forEach(entry => {
            if (entry.type === 'Bet') {
                if (!gameBets[entry.game]) {
                    gameBets[entry.game] = [];
                }
                gameBets[entry.game].push(entry);
            }
        });

        const alerts = [];

        for (const game in gameBets) {
            let bets = gameBets[game];
            let previousBet = null;

            for (let i = bets.length - 1; i >= 0; i--) {
                const bet = bets[i];
                if (previousBet && previousBet.amount < 0 && Math.abs(bet.amount) > Math.abs(previousBet.amount) * 500) {
                    alerts.push({ previousBet, bet });
                }
                previousBet = bet;
            }
        }
        return alerts;
    }



    function scrollToRound(roundId) {
        const targetElements = document.querySelectorAll('tr td span.label.label-default');

        let targetElement = null;

        targetElements.forEach(element => {
            if (element.textContent.trim() === roundId) {
                targetElement = element;
                element.closest('tr').style.backgroundColor = '#e0b3ff';
            }
        });

        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            console.warn(`Element with round ID ${roundId} not found.`);
        }
    }

    function setPageSize() {
        let selectElement = document.getElementById('pageSize');
        if (!selectElement) {
            console.error('Select element not found');
            return;
        }

        let option = document.createElement('option');
        option.value = '35000';
        option.text = '35000';
        selectElement.appendChild(option);
        selectElement.value = '35000';
        selectElement.dispatchEvent(new Event('change'));
    }

    function setPageSize1k() {
        let selectElement = document.getElementById('newPageSize');
        if (!selectElement) {
            console.error('Select element not found');
            return;
        }

        let option = document.createElement('option');
        option.value = '500';
        option.text = '500';
        selectElement.appendChild(option);
        selectElement.value = '500';
        selectElement.dispatchEvent(new Event('change'));
    }

    function waitForDataLoad() {
        return new Promise(resolve => {
            setTimeout(resolve, 10000);
        });
    }

    function analyzeTable() {
        let rows = document.querySelectorAll('table tr');

        let data = [];
        rows.forEach(row => {
            let cells = row.querySelectorAll('td');

            if (cells.length >= 10) {
                let date = cells[0].innerText.trim();
                let provider = cells[1].innerText.trim();
                let game = cells[2].innerText.trim();
                let type = cells[3].innerText.trim();
                let amount = parseFloat(cells[4].innerText.trim().replace(/\s/g, '').replace(',', '.'));
                let balance = parseFloat(cells[5].innerText.trim().replace(/\s/g, '').replace(',', '.'));
                let details = cells[6].innerText.trim();
                let round_type = cells[8].innerText.trim();
                let round_id = cells[9].innerText.trim();
                let balance_id = cells[10].innerText.trim();

                if (type === 'Bet') {
                    data.push({
                        date,
                        provider,
                        game,
                        type,
                        amount,
                        balance,
                        details,
                        round_type,
                        round_id,
                        balance_id
                    });
                } else if (type === 'WIN') {
                    data.push({
                        date,
                        provider,
                        game,
                        type,
                        amount,
                        balance,
                        details,
                        round_type,
                        round_id,
                        balance_id
                    });
                }
            } else {
                console.warn('Row skipped due to insufficient cells:', row);
            }
        });

        return data;
    }

    function checkRoundIntervals(data) {
        const roundData = {};
        let pending_balance = 0;

        const excludedProviders = ['pragmatic', 'riverslot', 'booming-games', 'endorphina', 'pateplay'];

        data.forEach(entry => {
            const round_id = entry.round_id;
            console.log(entry.provider)
            if (entry.provider && excludedProviders.includes(entry.provider.toLowerCase())) {
                return;
            }

            if (!roundData[round_id]) {
                roundData[round_id] = { bet: null, win: null };
            }
            if (entry.type === 'Bet' && Math.abs(entry.amount) > 1000) {
                roundData[round_id].bet = entry;
            } else if (entry.type === 'WIN') {
                roundData[round_id].win = entry;
            }
        });

        const alerts = [];
        const pendingRounds = [];

        for (const round_id in roundData) {
            const { bet, win } = roundData[round_id];

            if (bet && win) {
                const betDate = new Date(bet.date);
                const winDate = new Date(win.date);
                const diffMinutes = (winDate - betDate) / 1000 / 60;

                if (diffMinutes > 5) {
                    alerts.push({
                        round_id,
                        game: bet.game,
                        amount: bet.amount,
                        balance: bet.balance,
                        date: bet.date
                    });
                }
            } else if (bet && !win && Math.abs(bet.amount) >= 50000) {
                pendingRounds.push({
                    round_id,
                    game: bet.game,
                    amount: bet.amount,
                    balance: bet.balance,
                    date: bet.date
                });
                pending_balance += Math.abs(bet.amount);
            }
        }

        return {
            delayedRounds: alerts,
            pendingRounds: pendingRounds,
            pendingBalance: pending_balance
        };
    }

    function checkLargeBets(data) {
        const largeBets = data.filter(entry =>
                                      entry.type === 'Bet' &&
                                      (
            (entry.balance > 1 && Math.abs(entry.amount) > 0.25 * entry.balance && Math.abs(entry.amount) > 1000) ||
            (entry.balance === 0	 && Math.abs(entry.amount) > 1000)
        )
                                     );
        return largeBets;
    }

    function createScrollableContent(items) {
        const content = `
        <div style="
            max-height: 300px;
            overflow-y: auto;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 10px;
            margin-top: 10px;
            display: none;
        " class="scrollable-content">
            ${items.map(item => `
                <div style="
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 10px;
                    margin-bottom: 10px;
                ">
                    ${item.message ? item.message : `
                    <strong>Round ID:</strong> <a href="#" data-round-id="${item.round_id}">${item.round_id}</a><br>
                    <strong>Game:</strong> ${item.game}<br>
                    <strong>Bet Amount:</strong> ${item.amount}<br>
                    <strong>Balance:</strong> ${item.balance}<br>
                    <strong>Date:</strong> ${item.date}<br>
                    ${item.type ? `<strong>Type:</strong> ${item.type}<br>` : ''}
                    `}
                </div>
            `).join('')}
        </div>
    `;
        return content;
    }

    function formatRoundData(roundData) {
        const formattedItems = [];

        roundData.delayedRounds.forEach(item => {
            formattedItems.push({
                ...item,
                type: 'Delayed (> 5 min)'
            });
        });

        roundData.pendingRounds.forEach(item => {
            formattedItems.push({
                ...item,
                type: 'Pending (no win)'
            });
        });

        if (roundData.pendingBalance > 0) {
            formattedItems.push({
                message: `<strong>Загальна сума відкладених ставок:</strong> ${roundData.pendingBalance}`
            });
        }

        return formattedItems;
    }

    function toggleContentVisibility(event) {
        const button = event.target;
        const content = button.nextElementSibling;

        if (content.style.display === 'none') {
            content.style.display = 'block';
            button.textContent = '▼';
        } else {
            content.style.display = 'none';
            button.textContent = '►';
        }
    }


    function calculateBetsByRoundType(data) {
        const results = {};

        data.forEach(entry => {
            if (entry.type === 'Bet' && entry.amount < 0) {
                if (!results[entry.game]) {
                    results[entry.game] = { bonusBets: 0, realBets: 0 };
                }

                if (entry.round_type === 'bonus') {
                    results[entry.game].bonusBets += Math.abs(entry.amount);
                } else if (entry.round_type === 'real') {
                    results[entry.game].realBets += Math.abs(entry.amount);
                }
            }
        });

        return results;
    }

    function calculateWinsByRoundType(data) {
        const results = {};

        data.forEach(entry => {
            if (entry.type === 'WIN' && entry.amount > 0) {
                if (!results[entry.game]) {
                    results[entry.game] = { bonus: 0, real: 0 };
                }

                if (entry.round_type === 'bonus') {
                    results[entry.game].bonus += entry.amount;
                } else if (entry.round_type === 'real') {
                    results[entry.game].real += entry.amount;
                }
            }
        });

        return results;
    }

    async function mainBalance() {
        createOrUpdatePopup('<b>Зачекай, будь ласка, аналізую інформацію...</b>', true);
        setPageSize();
        await waitForDataLoad();
        createOrUpdatePopup('<b>Я повністю готовий до роботи.</b>');

        const data = analyzeTable();

        const roundData = checkRoundIntervals(data);
        const largeBetAlerts = checkLargeBets(data);
        const winResults = calculateWinsByRoundType(data);
        const betResults = calculateBetsByRoundType(data);
        const multipleBetsAlerts = checkMultipleBets(data);
        const anomalousBetIncreasesAlerts = checkAnomalousBetIncreases(data);

        let message = '';

        console.log(largeBetAlerts);
        console.log(anomalousBetIncreasesAlerts);

        if (roundData.delayedRounds.length > 0 || roundData.pendingRounds.length > 0) {
            message += `
        <b>Знайдено можливі відкладені раунди:</b>
        <button class="toggle-button" onclick="toggleContentVisibility(event)">►</button>
        ${createScrollableContent(formatRoundData(roundData))}
        <br>
    `;
        } else {
            message += '<b>Відкладених раундів не знайдено</b><br>';
        }

        if (largeBetAlerts.length > 0) {
            message += `
        <b>Знайдено ставки, що перевищують 25% від балансу:</b>
        <button class="toggle-button" onclick="toggleContentVisibility(event)">►</button>
        ${createScrollableContent(largeBetAlerts)}
        <br>
    `;
        } else {
            message += '<b>Великих ставок не знайдено</b><br>';
        }

        if (multipleBetsAlerts.length > 0) {
            message += `
        <b>Знайдено більше 1000 ставок в одній грі:</b>
        <button class="toggle-button" onclick="toggleContentVisibility(event)">►</button>
        ${createScrollableContent(multipleBetsAlerts)}
        <br>
    `;
        } else {
            message += '<b>Більше 1000 ставок не знайдено</b><br>';
        }

        if (anomalousBetIncreasesAlerts.length > 0) {
            message += `
        <b>Знайдено аномальні зростання ставок:</b>
        <button class="toggle-button" onclick="toggleContentVisibility(event)">►</button>
        ${createScrollableContent(anomalousBetIncreasesAlerts.map(alert => ({
                ...alert.previousBet,
                amount: `Previous: ${alert.previousBet.amount}, Current: ${alert.bet.amount}`
            })))}
        <br>
    `;
        } else {
            message += '<b>Аномальних зростань ставок не знайдено</b><br>';
        }

        for (const game in winResults) {
            const winResult = winResults[game];
            const betResult = betResults[game] || { bonusBets: 0, realBets: 0 };
            const ggrBonus = betResult.bonusBets - winResult.bonus;
            const ggrReal = betResult.realBets - winResult.real;

            if (ggrReal < -1000) {
                if (ggrBonus !== 0 && ggrReal < ggrBonus) {
                    const percentageReal = ((ggrReal / ggrBonus) * 100).toFixed(2);
                    if (percentageReal < 0) {
                        let messageForGame = `
                    <b style="color: purple;">GGR:</b><br>
                    <b>Гра:</b> ${game}<br>
                    <b>Сума виграшів bonus:</b> ${winResult.bonus.toFixed(2)}<br>
                    <b>Сума виграшів real:</b> ${winResult.real.toFixed(2)}<br>
                    <b>Сума ставок bonus:</b> ${betResult.bonusBets.toFixed(2)}<br>
                    <b>Сума ставок real:</b> ${betResult.realBets.toFixed(2)}<br>
                    <b>GGR REAL:</b> ${ggrReal.toFixed(2)}<br>
                    <b>GGR BONUS:</b> ${ggrBonus.toFixed(2)}<br>
                    <b>Процент GGR REAL по відношенню до GGR BONUS:</b> ${percentageReal}%<br>
                `;
                        message += `
                    <b>Деталі GGR:</b>
                    <button class="toggle-button" onclick="toggleContentVisibility(event)">►</button>
                    ${createScrollableContent([{ game: game, message: messageForGame }])}
                    <br>
                `;
                    }
                    else {
                        message += '<b>GGR в нормі</b><br>';
                    }
                }
            }
        }

        createOrUpdatePopup(message, false);
    }

    function getCardStatus(playerUrl, callback) {
        GM_xmlhttpRequest({
            method: "GET",
            url: playerUrl,
            onload: function(response) {
                if (response.status === 200) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');
                    const cardRows = doc.querySelectorAll('table.items tbody tr');

                    const cardStatuses = {};
                    cardRows.forEach(row => {
                        const cells = row.children;
                        const cardNumberElement = cells[1]?.querySelector('strong');
                        const cardStatusElement = cells[4]?.querySelector('input');

                        if (cardNumberElement && cardStatusElement) {
                            const cardNumber = cardNumberElement.textContent.trim();
                            const cardStatus = cardStatusElement.value.trim();
                            cardStatuses[cardNumber] = cardStatus;
                        }
                    });
                    callback(cardStatuses);
                } else {
                    console.error('Failed to fetch player page:', response.statusText);
                }
            }
        });
    }

    function updateCardStatus(cardStatuses) {
        const cardElements = document.querySelectorAll('td span.label');

        cardElements.forEach(span => {
            const cardNumber = span.textContent.trim();
            if (span.closest('td')?.cellIndex === 7) {
                if (cardStatuses[cardNumber]) {
                    switch (cardStatuses[cardNumber]) {
                        case 'Чужая':
                            span.className = 'label label-danger';
                            break;
                        case 'Верифицирована':
                            span.className = 'label label-success';
                            break;
                        case 'Не проверена':
                            span.className = 'label label-default';
                            break;
                    }
                } else {
                    span.className = 'label label-warning';
                }
            }
        });

        console.log('Updated card statuses on the main page');
    }

    function depositCardChecker() {
        const playerLink = document.querySelector('tr.odd td span.player_card a');
        if (playerLink) {
            var href = playerLink.getAttribute('href');
            if (href.startsWith('/')) {
                href = href.substring(1);
            }
            const playerUrl = ProjectUrl + href;

            console.log(playerUrl)

            getCardStatus(playerUrl, function(cardStatuses) {
                updateCardStatus(cardStatuses);
            });
        } else {
            console.error('Player link not found');
        }
    }

    function observeDOMChanges(nameFunction) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    nameFunction();
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    var buttonImageUrl = 'https://i.ibb.co/LzhGhY2/image-removebg-preview.png';

    function createFloatingButton(imageUrl) {
        var button = document.createElement('div');
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '10px';
        button.style.width = '105px';
        button.style.height = '105px';
        button.style.backgroundImage = 'url(' + imageUrl + ')';
        button.style.backgroundSize = 'cover';
        button.style.zIndex = '9999';
        button.style.cursor = 'pointer';

        document.body.appendChild(button);

        button.addEventListener('click', function() {
            mainBalance();
            button.remove();
        });
    }

    async function getManagerName(token) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/get_manager_name`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ token })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.name) {
                return data.name;
            } else {
                throw new Error('Name not found in response');
            }
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    }

    async function getManagerID(token) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/get_manager_id`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ token })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data && typeof data.id === 'number') {
                return data.id;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    }

    function buttonToSave() {
        const button = document.querySelector('.btn-update-comment-antifraud_manager');
        const textarea = document.querySelector('#PlayersComments_comment_antifraud_manager');

        const initials = GM_getValue(initialsKey, '');
        const currentDate = getCurrentDate();
        const playerID = getPlayerID();
        const project = getProject();
        const url = window.location.href;

        if (button) {
            button.addEventListener('click', () => {
                const lines = textarea.value.split('<br>');
                const firstLine = lines[0];
                const secondLine = lines[1];
                const dateRegex = /^\d{2}\.\d{2}\.\d{4}/;

                if (dateRegex.test(firstLine) && firstLine.includes(currentDate) && firstLine.includes(initials)) {
                    const dataToInsert = {
                        date: currentDate,
                        url: url,
                        project: project,
                        playerID: playerID,
                        initials: initials,
                        comment: textarea.value.replace(/\r?\n/g, ""),
                    };

                    if (secondLine.includes('автовыплату') || secondLine.includes('автовиплату')) {
                        dataToInsert.autopayment = 1;
                    } else {
                        dataToInsert.autopayment = 0;
                    }


                    console.log(dataToInsert)
                    sendDataToServer(dataToInsert, token)
                        .then(response => {
                        console.log('Data sent successfully:', response);
                    })
                        .catch(err => {
                        console.error('Error sending data:', err);
                    });
                } else {
                    console.log("The first line of the comment does not contain today's date or correct initials.");
                }
            });
        } else {
            console.error("Button not found.");
        }
    }

    async function sendDataToServer(data, accessToken) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/working`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    function getInOutUrl() {
        for (const script of document.querySelectorAll('script')) {
            if (script.textContent.includes('#show-player-in-out')) {
                const urlMatch = script.textContent.match(/url:\s*'([^']+)'/);
                return urlMatch ? urlMatch[1] : null;
            }
        }
        return null;
    }

    // Утилита для выполнения fetch-запроса с обработкой 404
    async function fetchData(url, options = {}) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', ...options.headers },
                credentials: options.credentials || 'same-origin'
            });
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`HTTP 404 for ${url}, returning default values`);
                    return null;
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            if (error.message.includes('404')) {
                console.warn(`Fetch error (404) for ${url}, returning default values`);
                return null;
            }
            throw error;
        }
    }

    async function handlePopup() {
        try {
            const inOutUrl = getInOutUrl();
            if (!inOutUrl) {
                console.log('Не удалось найти URL для запроса inOut.');
                return;
            }

            const [inOutData, balanceData] = await Promise.all([
                fetchData(inOutUrl),
                fetchData(`${ProjectUrl}payments/paymentTaxes/balanceAfter/?playerId=${userId}`, {
                    headers: { 'accept': '*/*', 'x-requested-with': 'XMLHttpRequest' },
                    credentials: 'include'
                })
            ]);

            const params = {
                MonthPA: inOutData?.monthInOut ?? '−',
                TotalPA: inOutData?.totalInOut ?? '−',
                Balance: getBalance(),
                NDFL: balanceData?.balance_after ?? '0'
            };

            const { isCheckedToday } = await checkUserInChecklist();
            params.isCheckedToday = isCheckedToday;
            const { totalPending, cards, displayCards } = await fetchAndProcessPending();
            Object.assign(params, { totalPending, cards, displayCards });

            await createPopupBox(params);
            await fetchAndProcessData();

            if (typeof addCheckButton === 'function') {
                addCheckButton(params.TotalPA, params.Balance, params.totalPending);
            }
        } catch (error) {
            console.error('Ошибка при выполнении handlePopup:', error.message);
        }
    }

    async function handlePopupWildWinz() {
        try {
            const inOutUrl = getInOutUrl();
            if (!inOutUrl) {
                console.log('Не удалось найти URL для запроса inOut.');
                return;
            }

            const [inOutData, balanceData] = await Promise.all([
                fetchData(inOutUrl),
                fetchData(`${ProjectUrl}payments/paymentTaxes/balanceAfter/?playerId=${userId}`, {
                    headers: { 'accept': '*/*', 'x-requested-with': 'XMLHttpRequest' },
                    credentials: 'include'
                })
            ]);

            const params = {
                MonthPA: inOutData?.monthInOut ?? '−',
                TotalPA: inOutData?.totalInOut ?? '−',
                Balance: getBalance(),
                NDFL: balanceData?.balance_after ?? '0'
            };

            const { isCheckedToday } = await checkUserInChecklist();
            params.isCheckedToday = isCheckedToday;
            const { totalPending, cards } = await fetchAndProcessPending();
            Object.assign(params, { totalPending, cards });
            await createPopupBox(params);
            await fetchAndProcessData();
            if (typeof addCheckButton === 'function') {
                addCheckButton(params.TotalPA, params.Balance, params.totalPending);
            }
        } catch (error) {
            console.error('Ошибка при выполнении handlePopupWildWinz:', error.message);
        }
    }

    async function checkToken() {

        if (!token) {
            return false;
        }
        try {
            const response = await fetch('https://vps65001.hyperhost.name/api/check_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    }

    function createLoginForm() {
        const form = document.createElement('div');
        form.innerHTML = `
        <style>
            #login-form {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #f2f2f2;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                font-family: Arial, sans-serif;
                z-index: 9999;
            }
            #login-form h2 {
                margin-bottom: 15px;
                font-size: 22px;
                text-align: center;
            }
            #login-form input[type="text"],
            #login-form input[type="password"] {
                width: 100%;
                padding: 10px;
                margin-bottom: 10px;
                border: 1px solid #ccc;
                border-radius: 4px;
                box-sizing: border-box;
                font-size: 16px;
            }
            #login-form button {
                width: 100%;
                padding: 10px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
            }
            #login-form button:hover {
                background-color: #45a049;
            }
            #login-form .error {
                color: red;
                margin-top: 10px;
                text-align: center;
            }
        </style>
        <div id="login-form">
            <h2>Авторизація</h2>
            <input type="text" id="username" placeholder="Логін" required />
            <input type="password" id="password" placeholder="Пароль" required />
            <button id="login-btn">Увійти</button>
            <div class="error" id="error-msg"></div>
        </div>
    `;

        document.body.appendChild(form);

        document.getElementById('login-btn').addEventListener('click', async () => {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const { success, token } = await authenticate(username, password);

            if (success) {
                GM_setValue('authToken', token);
                alert('Авторизація успішна!');
                form.remove();
                window.location.reload();
            } else {
                document.getElementById('error-msg').textContent = 'Неправильний логін або пароль';
            }
        });
    }

    async function authenticate(username, password) {
        try {
            const response = await fetch('https://vps65001.hyperhost.name/api/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error:', error);
            return { success: false };
        }
    }

    async function checkUserStatus() {


        try {
            const response = await fetch(`${API_BASE_URL}/api/user/status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            return data.status;
        } catch (error) {
            console.error('Error:', error);
            return 'Unknown';
        }
    }

    let highlightedValues = [], managerMap = {};
    const managerColors = {
        "Максим Рудий": "red", "Аліна Панасюк": "blue",
        "Максим Умєренников": "green", "Максим Кислий": "orange",
        "Максим Кириченко": "purple", "Олександр Загоруйко": "pink",
        "Олександр Ярославцев": "magenta"
    };

    async function powerBIfetchHighlightedValues() {
        const sheetName = powerBIgetSheetName(), today = new Date().toISOString().split('T')[0];
        try {
            const response = await fetch(`https://vps65001.hyperhost.name/api/powerbi/get?sheet_name=${encodeURIComponent(sheetName)}`);
            if (response.ok) {
                const data = await response.json();
                highlightedValues = data.filter(item => item.date === today).map(item => item.player_id);
                managerMap = Object.fromEntries(data.map(item => [item.player_id, item.manager_initials]));
                powerBIhighlightSavedCells();
            }
        } catch {}
    }

    async function powerBIsaveHighlightedValue(cellValue) {

        try {
            await fetch('https://vps65001.hyperhost.name/api/powerbi/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ player_id: cellValue, date: new Date().toISOString().split('T')[0], sheet_name: powerBIgetSheetName() })
            });
        } catch {}
    }

    async function powerBIdeleteHighlightedValue(cellValue) {
        try {
            await fetch('https://vps65001.hyperhost.name/api/powerbi/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_id: cellValue, sheet_name: powerBIgetSheetName() })
            });
        } catch {}
    }

    function powerBIapplyStylesToCell(cell, manager) {
        const color = managerColors[manager] || 'purple';
        cell.style.setProperty('background-color', color, 'important');
        cell.style.setProperty('color', 'white', 'important');
    }

    function powerBIhighlightSavedCells() {
        document.querySelectorAll('div[role="gridcell"]').forEach(cell => {
            const cellValue = cell.textContent.trim();
            if (highlightedValues.includes(cellValue)) {
                powerBIapplyStylesToCell(cell, managerMap[cellValue]);
            }
        });

        document.querySelectorAll('div[role="rowheader"]').forEach(header => {
            const headerValue = header.textContent.trim();
            if (highlightedValues.includes(headerValue)) {
                powerBIapplyStylesToCell(header, managerMap[headerValue]);
            }
        });
    }

    function powerBImakeCellsClickable() {
        document.querySelectorAll('div[role="gridcell"]').forEach(cell => {
            if (!cell.classList.contains('clickable-cell')) {
                cell.classList.add('clickable-cell');
                cell.style.cursor = 'pointer';
                cell.addEventListener('click', function() {
                    const cellValue = cell.textContent.trim();
                    if (highlightedValues.includes(cellValue)) {
                        highlightedValues = highlightedValues.filter(value => value !== cellValue);
                        cell.style.removeProperty('background-color');
                        cell.style.removeProperty('color');
                        powerBIdeleteHighlightedValue(cellValue);
                    } else {
                        highlightedValues.push(cellValue);
                        powerBIapplyStylesToCell(cell, managerMap[cellValue]);
                        powerBIsaveHighlightedValue(cellValue);
                    }
                });
            }
        });

        document.querySelectorAll('div[role="rowheader"]').forEach(header => {
            if (!header.classList.contains('clickable-header')) {
                header.classList.add('clickable-header');
                header.style.cursor = 'pointer';
                header.addEventListener('click', function() {
                    const headerValue = header.textContent.trim();
                    if (highlightedValues.includes(headerValue)) {
                        highlightedValues = highlightedValues.filter(value => value !== headerValue);
                        header.style.removeProperty('background-color');
                        header.style.removeProperty('color');
                        powerBIdeleteHighlightedValue(headerValue);
                    } else {
                        highlightedValues.push(headerValue);
                        powerBIapplyStylesToCell(header, managerMap[headerValue]);
                        powerBIsaveHighlightedValue(headerValue);
                    }
                });
            }
        });
    }


    function powerBIgetSheetName() {
        const sheetNameElement = document.querySelector('span[role="heading"][aria-level="1"]');
        return sheetNameElement ? sheetNameElement.textContent.trim() : 'Невідомий лист';
    }


    async function sendActivePageInfo() {

        const currentUrl = window.location.href;

        if (token) {
            await fetch('https://vps65001.hyperhost.name/api/update_active_page', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: currentUrl })
            });
        }
    }

    async function sendPlayerSeenInfo() {
        const currentUrl = window.location.href;
        const project = getProject();
        const date = new Date();
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()} ${getCurrentTime()}`;

        if (!currentUrl.includes('/playersItems/update') && !currentUrl.includes('/user/')) {
            return;
        }

        if (token) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/seen`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: currentUrl,
                        user_id: getPlayerID(),
                        project: project,
                        date: formattedDate
                    })
                });

                const result = await response.json();
                if (result.success) {
                    console.log('Ти молодчинка!');
                } else {
                    console.error('Failed to record player view:', result.message);
                }
            } catch (error) {
                console.error('Error sending player seen info:', error);
            }
        } else {
            console.warn('No auth token found');
        }
    }

    async function activeUrlsManagers() {
        const playerId = getPlayerID();
        const currentManager = await getManagerName(token);

        const table = document.querySelector('.detail-view.table.table-striped');
        let targetElement = null;
        let rowElement = null;

        if (table) {
            targetElement = table.querySelector('tr td span.fa');
            if (targetElement) {
                rowElement = targetElement.closest('tr');
                rowElement.style.backgroundColor = '#f8f8d9';

                let existingSpan = targetElement.parentNode.querySelector('.manager-names');
                if (!existingSpan) {
                    existingSpan = document.createElement('span');
                    existingSpan.className = 'manager-names';
                    existingSpan.style.fontWeight = 'bold';
                    existingSpan.style.color = '#007BFF';
                    existingSpan.style.marginLeft = '10px';
                    existingSpan.style.userSelect = 'none';
                    targetElement.parentNode.appendChild(existingSpan);
                }
                existingSpan.textContent = `Переглядають: ${currentManager}`;

                createStickyRow(rowElement, table);
            }
        }

        try {
            const response = await fetch('https://vps65001.hyperhost.name/api/get_active_users', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();

            const activeUsers = data.filter(user =>
                                            (user.active_url.includes(playerId) || user.active_url.includes(userId)) &&
                                            user.manager_name !== currentManager
                                           );

            if (activeUsers.length > 0 && table && targetElement) {
                const otherManagers = activeUsers.map(user => user.manager_name).join(', ');
                const updatedManagerNames = `${currentManager}, ${otherManagers}`;
                const existingSpan = targetElement.parentNode.querySelector('.manager-names');
                if (existingSpan) {
                    existingSpan.textContent = `Переглядають: ${updatedManagerNames}`;
                }
            }
        } catch (error) {
            console.error('Ошибка запроса:', error);
        }
    }
    function createStickyRow(originalRow, table) {
        if (!originalRow) return;

        if (window.stickyRow) window.stickyRow.remove();

        const stickyRow = document.createElement('tr');
        stickyRow.id = "stickyRow";
        stickyRow.className = originalRow.className;
        stickyRow.style.position = 'fixed';
        stickyRow.style.top = '0px';
        stickyRow.style.left = `${table.getBoundingClientRect().left}px`;
        stickyRow.style.width = `${table.offsetWidth}px`;
        stickyRow.style.backgroundColor = window.getComputedStyle(originalRow).backgroundColor;
        stickyRow.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        stickyRow.style.zIndex = '1000';
        stickyRow.style.display = 'none';
        stickyRow.style.whiteSpace = 'nowrap'; // Предотвращаем перенос текста


        [...originalRow.children].forEach(cell => {
            const newCell = document.createElement(cell.tagName.toLowerCase());
            newCell.innerHTML = cell.innerHTML;
            newCell.style.whiteSpace = 'nowrap';
            newCell.style.padding = '8px';
            stickyRow.appendChild(newCell);
        });

        document.body.appendChild(stickyRow);
        window.stickyRow = stickyRow;

        document.addEventListener('scroll', () => toggleStickyRow(originalRow, stickyRow, table));
        window.addEventListener('resize', () => updateStickyRowPosition(stickyRow, table));

        syncCopyButton(originalRow, stickyRow);
    }

    function toggleStickyRow(originalRow, stickyRow, table) {
        const rect = originalRow.getBoundingClientRect();
        const tableRect = table.getBoundingClientRect();

        if (rect.top < 0 && tableRect.bottom > 0) {
            stickyRow.style.display = 'table-row';
            stickyRow.style.top = `${Math.max(0, tableRect.top)}px`;
            stickyRow.style.left = `${tableRect.left}px`;
            stickyRow.style.width = `${table.offsetWidth}px`;
        } else {
            stickyRow.style.display = 'none';
        }
    }

    function syncCopyButton(originalRow, stickyRow) {
        const originalCopyBtn = originalRow.querySelector('.fa-files-o');
        const stickyCopyBtn = stickyRow.querySelector('.fa-files-o');

        if (!originalCopyBtn || !stickyCopyBtn) return;

        function handleCopyClick(event) {
            event.preventDefault();
            const dataForCopy = originalCopyBtn.getAttribute('data-for-copy');

            if (!dataForCopy) return;

            navigator.clipboard.writeText(dataForCopy).then(() => {
                originalCopyBtn.outerHTML = `<span class="" data-for-copy="${dataForCopy}">Copied!</span>`;
                stickyCopyBtn.outerHTML = `<span class="" data-for-copy="${dataForCopy}">Copied!</span>`;
            }).catch(err => console.error('Ошибка копирования:', err));
        }

        originalCopyBtn.addEventListener('click', handleCopyClick);
        stickyCopyBtn.addEventListener('click', handleCopyClick);
    }

    function updateStickyRowPosition(stickyRow, table) {
        const tableRect = table.getBoundingClientRect();
        stickyRow.style.left = `${tableRect.left}px`;
        stickyRow.style.width = `${table.offsetWidth}px`;
    }

    function changeCardStatus() {
        const container = document.querySelector('#payments-cards-masks-parent');
        const rows = container.querySelectorAll('tr.odd, tr.even');
        const table = document.querySelector('.items');

        ensureHeaders(table);

        rows.forEach((row) => {
            if (row.dataset.processed === "true") return;

            const statusCell = row.querySelector('td input.payment-cards-masks-change-status');
            const markerCell = row.querySelector('.payment-cards-masks-marker');
            const checkbox = row.querySelector('td input[type="checkbox"][name="paymentTokenEnabled"]');

            if (statusCell && markerCell && statusCell.value === 'Не проверена') {
                addIconCells(row, statusCell, markerCell, checkbox);
            } else {
                const emptyCell1 = document.createElement('td');
                const emptyCell2 = document.createElement('td');
                emptyCell1.innerHTML = '&nbsp;';
                emptyCell2.innerHTML = '&nbsp;';
                row.appendChild(emptyCell1);
                row.appendChild(emptyCell2);
            }

            row.dataset.processed = "true";
        });
    }

    function ensureHeaders(table) {
        const headerRow = table.querySelector('thead tr');
        const hasHeader = Array.from(headerRow.querySelectorAll('th')).some(
            (cell) => cell.textContent.trim() === 'Чужая'
        );

        if (!hasHeader) {
            ['Чужая', 'Своя'].forEach((text) => {
                const headerCell = document.createElement('th');
                headerCell.textContent = text;
                headerRow.appendChild(headerCell);
            });
        }
    }

    function createCellWithIcon(type, statusCell, markerCell, checkbox = null) {
        const cell = document.createElement('td');
        if (type === 'other' || type === 'own') {
            const icon = document.createElement('i');
            icon.className = type === 'other' ? 'fa fa-ban' : 'fa fa-check';
            icon.style = `
            cursor: pointer;
            margin: 0 auto;
            font-size: 12px;
            padding: 4.5px 5px;
            border: 2px solid ${type === 'other' ? 'red' : 'green'};
            border-radius: 3px;
            background-color: ${type === 'other' ? 'red' : 'green'};
            color: ${type === 'other' ? 'yellow' : 'white'};
            text-align: center;
        `;

            icon.addEventListener('click', (e) => {
                e.preventDefault();
                const status = type === 'other' ? 'other_person_card' : 'verified';
                const newValue = type === 'other' ? 'Чужая' : 'Верифицирована';
                const color = type === 'other' ? '#D9534F' : '#5CB85C';

                handleIconClick(statusCell, markerCell, checkbox, icon, status, newValue, color);
            });

            cell.appendChild(icon);
        }
        else {
            cell.innerHTML = '&nbsp;';
        }

        return cell;
    }


    function handleIconClick(statusCell, markerCell, checkbox, icon, status, newValue, color) {
        const url = statusCell.getAttribute('data-url');
        if (!url) return alert('Ошибка: Не удалось найти URL для смены статуса.');

        fetch(url, {
            headers: {
                "accept": "*/*",
                "content-type": "application/json",
                "x-requested-with": "XMLHttpRequest"
            },
            method: "POST",
            body: JSON.stringify({ status }),
        })
            .then(response => response.ok ? response.text() : Promise.reject(response))
            .then(() => {
            statusCell.value = newValue;
            markerCell.style.backgroundColor = color;
            icon.remove();

            if (checkbox && status === 'other_person_card' && checkbox.checked) {
                handleCheckboxRequest(checkbox);
            }
        })
            .catch(err => console.error(err));
    }

    function handleCheckboxRequest(checkbox) {
        const url = checkbox.getAttribute('data-url');
        if (!url) return alert('Ошибка: Не удалось найти URL для чекбокса.');

        fetch(url, {
            headers: {
                "accept": "*/*",
                "content-type": "application/json",
                "x-requested-with": "XMLHttpRequest"
            },
            method: "POST"
        })
            .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
            .then((text) => {
            if (text) {
                try {
                    const data = JSON.parse(text);
                    console.log('Ответ для чекбокса:', data);
                } catch {
                    console.warn('Ответ для чекбокса не является JSON:', text);
                }
            } else {
                console.warn('Пустой ответ для чекбокса');
            }

            checkbox.checked = false;
        })
            .catch(err => alert('Ошибка запроса для чекбокса: ' + err.message));
    }

    function addIconCells(row, statusCell, markerCell, checkbox) {
        const otherCell = createCellWithIcon('other', statusCell, markerCell, checkbox);
        const ownCell = createCellWithIcon('own', statusCell, markerCell);

        row.appendChild(otherCell);
        row.appendChild(ownCell);
    }

    function createCheckIPButton() {
        const checkIPButton = document.createElement('button');
        checkIPButton.textContent = 'Check IP';
        checkIPButton.classList.add('btn', 'btn-primary');

        checkIPButton.addEventListener('click', removeNAPlayersAndEmptyBlocks);

        const firstAlert = document.querySelector('.alert.alert-warning');
        if (firstAlert) {
            firstAlert.parentNode.insertBefore(checkIPButton, firstAlert);
        }
    }

    const parseDate = dateString => {
        const [day, month, year, ...timeParts] = dateString.split(' ');
        const monthNumber = months[month] || null;
        if (!monthNumber) return null;
        const formattedDate = `${year}-${monthNumber}-${day}T${timeParts.join(' ')}`;
        return new Date(formattedDate);
    };

    const processPlayerCard = (card, firstThreeLetters, ownerCards, oneWeekAgo) => {
        const content = card.getAttribute('data-content');
        if (content.includes('имя: n/a')) {
            card.parentElement.remove();
            return;
        }

        const cardNameMatch = content.match(/имя: ([^<]+)/);
        if (cardNameMatch) {
            const surnameFromCard = cardNameMatch[1].split(' ')[2]?.toLowerCase();
            if (surnameFromCard?.startsWith(firstThreeLetters)) {
                colorCard(card, 'purple');
            }
        }

        GM_xmlhttpRequest({
            method: "GET",
            url: card.querySelector('a').href,
            onload: function(response) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = response.responseText;

                const targetCards = [...tempDiv.querySelectorAll('#payments-cards-masks-grid tbody tr td:nth-child(2) strong')].map(c => c.textContent.trim());
                const lastActiveDateStr = [...tempDiv.querySelectorAll('tr')].find(row => row.querySelector('th')?.textContent.trim() === 'Последнее изменение баланса')?.querySelector('td')?.textContent.trim();
                const lastActiveDatePlayer = lastActiveDateStr ? parseDate(lastActiveDateStr) : null;

                if (lastActiveDatePlayer >= oneWeekAgo) colorCard(card, 'orange');
                if (targetCards.some(c => ownerCards.includes(c))) colorCard(card, 'brown');
                const alertSuccessLink = card.querySelector('a.alert-success');
                if (alertSuccessLink) {
                    card.parentElement.remove();
                }
            }
        });
    };

    const colorCard = (card, color) => {
        card.querySelectorAll('.alert-success').forEach(link => {
            link.classList.remove('alert-success');
            link.style.color = 'white';
            link.style.backgroundColor = color;
        });
        card.style.backgroundColor = color;
    };

    const removeNAPlayersAndEmptyBlocks = () => {
        document.querySelectorAll('.ajax-load-more').forEach(button => {
            button.click();
        });

        setTimeout(() => {
            const playerCards = document.querySelectorAll('.player_card');
            let firstThreeLetters = '';
            let lastActiveDate;

            document.querySelectorAll('tr').forEach(row => {
                const header = row.querySelector('th');
                const cell = row.querySelector('td');
                if (header && header.textContent.trim() === 'Фамилия' && cell) {
                    firstThreeLetters = cell.textContent.trim().slice(0, 4).toLowerCase();
                }
            });

            const ownerCards = [...document.querySelectorAll('#payments-cards-masks-grid tbody tr td:nth-child(2) strong')].map(cell => cell.textContent.trim());
            const oneWeekAgo = new Date(new Date().setDate(new Date().getDate() - 3));

            playerCards.forEach(card => processPlayerCard(card, firstThreeLetters, ownerCards, oneWeekAgo));
        }, 2000);
    };

    function checkAutoPayment() {
        const checkbox = document.getElementById('Players_enabled_autopayouts');
        if (!checkbox) return console.error('Checkbox element not found.');

        let currentValue = checkbox.checked;

        if (!currentValue) return;

        const checkInterval = setInterval(() => {
            const newValue = checkbox.checked;
            if (!newValue) {


                const time = getCurrentTime();
                const currentLanguage = GM_getValue(languageKey, 'російська');

                const fieldDate = getDateFromField();
                const today = getCurrentDate();

                let insertText = '';
                if (currentLanguage === 'українська') {
                    insertText = `Вимкнув автовиплату в ${time}`;
                } else {
                    insertText = `Отключил автовыплату в ${time}`;
                }
                insertTextToComment(insertText, true);
                clearInterval(checkInterval);
            }
        }, 500);

        window.addEventListener('beforeunload', () => clearInterval(checkInterval));
    }

    function checkBonusButton() {
        const checkbox = document.getElementById('Players_no_bonus');
        if (!checkbox) return console.error('Checkbox element not found.');

        let currentValue = checkbox.checked;

        if (currentValue) return;

        const checkInterval = setInterval(() => {
            const newValue = checkbox.checked;
            if (newValue) {
                const time = getCurrentTime();
                const currentLanguage = GM_getValue(languageKey, 'російська');

                const fieldDate = getDateFromField();
                const today = getCurrentDate();

                let insertText = '';
                if (currentLanguage === 'українська') {
                    insertText = `Відключив бонуси в ${time}`;
                } else {
                    insertText = `Отключил бонусы в ${time}`;
                }
                insertTextToComment(insertText, true);
                clearInterval(checkInterval);
            }
        }, 500);

        window.addEventListener('beforeunload', () => clearInterval(checkInterval));
    }


    async function updateBanButton() {
        const updateButton = document.getElementById('yw2');
        if (!updateButton) return;

        let verificationSheets;
        try {
            const settings = await ApiService.fetchData('/get_settings?alert_type=Verification');
            verificationSheets = settings.sheets || { Betking: '', '777': '', Vegas: '' };
        } catch (error) {
            console.error('Ошибка загрузки настроек верификации:', error);
            verificationSheets = { Betking: '', '777': '', Vegas: '' }; // Fallback
        }

        updateButton.addEventListener('click', (event) => handleBanButtonClick(event, updateButton, verificationSheets));
    }

    async function handleBanButtonClick(event, updateButton, verificationSheets) {
        event.preventDefault();

        const { status, inactiveReason, playerID } = getBanStatus();
        if (!shouldSendToVerification(status, inactiveReason)) {
            updateButton.form.submit();
            return;
        }

        const shouldProceed = await confirmLawyerVerification();
        if (!shouldProceed) return;

        const reason = await selectVerificationReason();
        if (!reason) return;

        await processBanVerification(playerID, reason, updateButton, verificationSheets);
    }

    function getBanStatus() {
        const statusInput = document.querySelector('input[name="Players[status]"]');
        const reasonInput = document.querySelector('input[name="Players[inactive_reason]"]');
        return {
            status: statusInput?.value || '',
            inactiveReason: reasonInput?.value || '',
            playerID: getPlayerID()
        };
    }

    function shouldSendToVerification(status, inactiveReason) {
        return status === 'UNCONFIRMED' &&
            (inactiveReason === 'VIOLATION_RULES' || inactiveReason === 'VIOLATION_RULES_FRAUD');
    }

    function confirmLawyerVerification() {
        return Swal.fire({
            title: 'Ви бажаєте відправити гравця на верифікацію по схемі юриста?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Так',
            cancelButtonText: 'Ні'
        }).then(result => result.isConfirmed);
    }

    function selectVerificationReason() {
        const reasons = [
            'Після рефанду використовує чужу картку',
            'Підозра на малолітнього',
            'Підозра на Лудомана',
            'Схемщик/потенц. фрод',
            'Більше двох чужих карток в місяць',
            'Картка родича, неприбутковий',
            'Недоцільні транзакції',
            'Картковий фрод',
            'Фін претензія',
            'Cascad'
        ];

        return Swal.fire({
            title: 'Виберіть причину:',
            html: `
            <style>
                .swal2-select {
                    width: 80%;
                    padding: 10px;
                    font-size: 16px;
                    box-sizing: border-box;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    background-color: #fff;
                    overflow-x: hidden;
                }
                .swal2-select option {
                    white-space: nowrap;
                    padding: 5px 10px;
                }
            </style>
            <select id="reasonSelect" class="swal2-select">
                <option value="">Виберіть причину</option>
                ${reasons.map(r => `<option value="${r}">${r}</option>`).join('')}
            </select>
        `,
            width: '350px',
            showCancelButton: true,
            confirmButtonText: 'Підтвердити',
            cancelButtonText: 'Відміна',
            preConfirm: () => {
                const selectedReason = document.getElementById('reasonSelect').value;
                if (!selectedReason) {
                    Swal.showValidationMessage('Будь ласка, виберіть причину!');
                    return false;
                }
                return selectedReason;
            }
        }).then(result => result.isConfirmed ? result.value : null);
    }

    async function processBanVerification(playerID, reason, updateButton, verificationSheets) {
        const project = getProject();
        const sheetName = getSheetNameForProject(project, verificationSheets);
        const { name, email } = gatherPlayerData();
        const currentDate = getCurrentDate();
        const initials = GM_getValue(initialsKey);
        try {
            const accessToken = await getAccessToken();
            const dataToInsert = {
                url: window.location.href,
                playerID,
                date: null,
                name,
                email,
                department: 'Anti Fraud',
                reason
            };

            await sendDataToGoogleSheet(accessToken, sheetName, dataToInsert);
            await updateCommentField(currentDate, initials, updateButton);

            Swal.fire({
                icon: 'success',
                title: 'Успішно!',
                text: 'Гравця відправлено на верифікацію.'
            });
        } catch (error) {
            console.error('Ошибка при верификации:', error);
            Swal.fire({
                icon: 'error',
                title: 'Помилка',
                text: 'Не вдалося відправити дані.'
            });
        }
    }

    async function updateCommentField(currentDate, initials, updateButton) {
        const message = `<strong style="color: purple;">${currentDate} | Відправляємо на верифікацію по схемі юриста | ${initials} </strong><br><br>`;
        const commentField = document.getElementById('gateway-method-description-visible-antifraud_manager');
        if (!commentField) throw new Error('Поле комментария не найдено');

        commentField.innerHTML = message + commentField.innerHTML;
        commentField.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));

        const updateCommentButton = document.querySelector('.btn-update-comment-antifraud_manager');
        if (updateCommentButton) {
            updateCommentButton.click();
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        updateButton.form.submit();
    }

    async function checkForUpdates() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/version`);
            const data = await response.json();

            if (data.version && currentVersion !== data.version) {
                const style = document.createElement("style");
                style.textContent = `
                #update-icon {
                    position: fixed;
                    width: 200px;
                    height: 250px;
                    z-index: 1000;
                    cursor: pointer;
                    transition: top 0.3s ease, left 0.3s ease; /* Плавное перемещение */
                }
            `;
                document.head.appendChild(style);

                const img = document.createElement("img");
                img.src = 'https://i.pinimg.com/originals/91/b1/ca/91b1ca6fdbfd199856cb5300e21e85dc.gif';
                img.id = "update-icon";
                document.body.appendChild(img);

                img.addEventListener("click", () => {
                    window.open("https://github.com/mrudiy/Anti-Fraud-Extension/raw/main/Anti-Fraud%20Extension.user.js", "_blank");
                });

                function moveIconSmoothly() {
                    const x = Math.floor(Math.random() * (window.innerWidth - 50));
                    const y = Math.floor(Math.random() * (window.innerHeight - 50));

                    img.style.left = `${x}px`;
                    img.style.top = `${y}px`;

                    setTimeout(moveIconSmoothly, 900);
                }

                moveIconSmoothly();
            }
        } catch (error) {
            console.error("Ошибка при проверке версии:", error);
        }
    }

    const SETTINGS_SECTIONS = {
        Pendings: 'pendings-settings',
        PayOut: 'payout-settings',
        Deposits: 'deposits-settings',
        Verification: 'verification-settings'
    };

    const ALERT_CONFIG = {
        Pendings: {
            fields: {
                priorities: { type: 'multi-select', selector: 'pendings-priority-select', required: true },
                total_amount: { type: 'text', selector: 'pendings-total-amount', required: true, validate: v => /^\d+$/.test(v) },
                manager: { type: 'select', selector: 'pendings-manager-select', required: true }
            },
            apiFields: ['priorities', 'amount', 'manager'],
            requiresProject: true
        },
        PayOut: {
            fields: {
                priorities: { type: 'multi-select', selector: 'payout-priority-select', required: true },
                total_amount: { type: 'text', selector: 'payout-total-amount', required: true, validate: v => /^\d+$/.test(v) },
                auto_disable: { type: 'checkbox', selector: 'payout-auto-disable' },
                manager: { type: 'select', selector: 'payout-manager-select', required: true }
            },
            apiFields: ['priorities', 'amount', 'auto_disable', 'manager'],
            requiresProject: true
        },
        Deposits: {
            fields: {
                settings: {
                    type: 'custom',
                    selector: '.deposit-priority-item',
                    parse: () => Array.from(document.querySelectorAll('.deposit-priority-item')).map(item => ({
                        priority: item.querySelector('.priority-label').textContent.trim(),
                        amount: item.querySelector('.amount-input').value.trim(),
                        bonusAmount: item.querySelector('.bonus-input').value.trim(),
                        cards: Array.from(item.querySelector('.card-select').selectedOptions).map(opt => opt.value)
                    })),
                    validate: settings => settings.every(s => /^\d+$/.test(s.amount) && /^\d+$/.test(s.bonusAmount))
                },
                inefficient_transaction_percent: { type: 'text', selector: 'inefficient-transaction-percent', required: true, validate: v => /^\d+%$/.test(v) },
                manager: { type: 'select', selector: 'deposits-manager-select', required: true }
            },
            apiFields: ['settings', 'inefficient_transaction_percent', 'manager'],
            requiresProject: true
        },
        Verification: {
            fields: {
                sheets: {
                    type: 'custom',
                    selector: '.verification-sheet-input',
                    parse: () => ({
                        Betking: document.getElementById('verification-betking-sheet').value.trim(),
                        '777': document.getElementById('verification-777-sheet').value.trim(),
                        Vegas: document.getElementById('verification-vegas-sheet').value.trim()
                    }),
                    validate: sheets => Object.values(sheets).every(v => v.length > 0)
                }
            },
            apiFields: ['sheets'],
            requiresProject: false
        }
    };

    const byId = (selector) => document.getElementById(selector);
    const hideAllSections = () => Object.values(SETTINGS_SECTIONS).forEach(id => byId(id).style.display = 'none');
    const showSection = (section) => byId(section).style.display = 'block';
    const setMessage = (type, text) => {
        const errorMsg = byId('alert-error-msg');
        const successMsg = byId('alert-success-msg');
        if (type === 'error') {
            errorMsg.textContent = text;
            successMsg.textContent = '';
        } else {
            successMsg.textContent = text;
            errorMsg.textContent = '';
        }
    };

    class ApiService {
        static async fetchData(endpoint, options = {}) {

            const defaultHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
            try {
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    ...options,
                    headers: { ...defaultHeaders, ...options.headers }
                });
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} - ${await response.text()}`);
                return await response.json();
            } catch (error) {
                throw new Error(`Fetch error: ${error.message}`);
            }
        }
    }

    class SettingsManager {
        static priorities = ["Приоритет 1", "Приоритет 2", "Приоритет 3", "Приоритет 4", "Приоритет 5", "Приоритет 6", "Приоритет 7", "Приоритет 8", "n/a"];

        constructor(alertType) {
            this.alertType = alertType;
            this.config = ALERT_CONFIG[alertType];
            this.section = SETTINGS_SECTIONS[alertType];
        }

        async loadManagers() {
            if (this.alertType === 'Verification') return;
            try {
                const data = await ApiService.fetchData('/api/users');
                const managers = data.filter(user => user.status === 'Manager');
                const select = byId(this.config.fields.manager.selector);
                select.innerHTML = '<option value="" disabled selected>Оберіть менеджера</option>';
                managers.forEach(manager => {
                    const option = document.createElement('option');
                    option.value = option.textContent = manager.manager_name;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Ошибка загрузки менеджеров:', error);
                setMessage('error', 'Не вдалося завантажити список менеджерів');
            }
        }

        async loadSettings(project) {
            try {
                const endpoint = this.config.requiresProject
                ? `/get_settings?alert_type=${this.alertType}&project=${project}`
                : `/get_settings?alert_type=${this.alertType}`;
                const data = await ApiService.fetchData(endpoint);
                this.parseSettings(data);
            } catch (error) {
                console.error('Ошибка загрузки настроек:', error);
                setMessage('error', 'Не вдалося завантажити налаштування');
            }
        }

        parseSettings(data) {
            Object.entries(this.config.fields).forEach(([key, field]) => {
                if (field.type === 'multi-select') {
                    const element = byId(field.selector);
                    element.innerHTML = '';
                    SettingsManager.priorities.forEach(priority => {
                        const option = document.createElement('option');
                        option.value = option.textContent = priority;
                        if (data.priorities?.includes(priority)) option.classList.add('selected');
                        option.addEventListener('click', () => option.classList.toggle('selected'));
                        element.appendChild(option);
                    });
                } else if (field.type === 'text') {
                    const element = byId(field.selector);
                    // Исправление: маппим 'amount' из ответа сервера в 'total_amount' для UI
                    if (key === 'total_amount') {
                        element.value = data.amount !== undefined ? data.amount : '';
                    } else if (key === 'inefficient_transaction_percent') {
                        element.value = data[key] ? `${data[key] * 100}%` : '';
                    } else {
                        element.value = data[key] || '';
                    }
                } else if (field.type === 'checkbox') {
                    byId(field.selector).checked = data[key] === true;
                } else if (field.type === 'select') {
                    if (data[key]) byId(field.selector).value = data[key];
                } else if (field.type === 'custom') {
                    if (this.alertType === 'Verification') {
                        byId('verification-betking-sheet').value = data.sheets?.Betking || '';
                        byId('verification-777-sheet').value = data.sheets?.['777'] || '';
                        byId('verification-vegas-sheet').value = data.sheets?.Vegas || '';
                    } else {
                        field.parse().forEach((setting, index) => {
                            const item = document.querySelectorAll(field.selector)[index];
                            const priorityData = data.settings?.[index] || {};
                            item.querySelector('.amount-input').value = priorityData.amount || '';
                            item.querySelector('.bonus-input').value = priorityData.bonusAmount || '';
                            Array.from(item.querySelector('.card-select').options).forEach(opt => {
                                opt.selected = priorityData.cards?.includes(opt.value) || false;
                            });
                        });
                    }
                }
            });
        }

        async updateSettings(project) {
            const settings = this.collectSettings();
            if (!this.validateSettings(settings)) return;
            await this.sendSettings(project, settings);
        }

        collectSettings() {
            const settings = {};
            Object.entries(this.config.fields).forEach(([key, field]) => {
                if (field.type === 'multi-select') {
                    settings[key] = Array.from(byId(field.selector).options)
                        .filter(opt => opt.classList.contains('selected'))
                        .map(opt => opt.value);
                } else if (field.type === 'text') {
                    settings[key] = byId(field.selector).value.trim();
                } else if (field.type === 'checkbox') {
                    settings[key] = byId(field.selector).checked;
                } else if (field.type === 'select') {
                    settings[key] = byId(field.selector).value;
                } else if (field.type === 'custom') {
                    settings[key] = field.parse();
                }
            });
            return settings;
        }

        validateSettings(settings) {
            for (const [key, field] of Object.entries(this.config.fields)) {
                const value = settings[key];
                if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
                    setMessage('error', `Поле "${key}" є обов'язковим`);
                    return false;
                }
                if (field.validate && value && !field.validate(value)) {
                    setMessage('error', `Некоректне значення для "${key}"`);
                    return false;
                }
            }
            return true;
        }

        async sendSettings(project, settings) {
            const payload = { alert_type: this.alertType };
            if (this.config.requiresProject) payload.project = project;
            this.config.apiFields.forEach(field => {
                if (field === 'amount') payload[field] = parseInt(settings['total_amount']);
                else payload[field] = settings[field];
            });

            try {
                const result = await ApiService.fetchData('/update_settings', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                setMessage(result.success ? 'success' : 'error', result.success ? 'Успішно оновлено' : result.message || 'Виникла помилка');
            } catch (error) {
                console.error('Ошибка отправки настроек:', error);
                setMessage('error', 'Виникла помилка при відправці даних');
            }
        }
    }

    function createAlertSettingsPopup() {
        const style = document.createElement('style');
        style.textContent = `
    /* Общий стиль для попапа */
    #alert-settings-popup {
        font-family: Arial, sans-serif;
        padding: 20px;
        max-width: 600px;
        background-color: #f8f9fa;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    /* Стили для выпадающих списков */
    #project-select,
    #alert-type-select,
    #deposits-manager-select,
    #payout-manager-select,
    #pendings-manager-select{
        width: 100%;
        padding: 10px;
        margin: 10px 0;
        border: 1px solid #ced4da;
        border-radius: 5px;
        background-color: #ffffff;
        font-size: 16px;
        appearance: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

     #pendings-priority-select,
    #payout-priority-select {
    width: 100%;
    height: 160px;
    background-color: #f9f9f9;
    border: 1px solid #ccc;
    padding: 5px;
    font-size: 14px;
    box-sizing: border-box;
    max-height: none;
    overflow-y: visible;
  }

    #project-select:focus,
    #alert-type-select:focus,
    #pendings-priority-select:focus,
    #payout-priority-select:focus {
        outline: none;
        border-color: #80bdff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
    }

    /* Стиль для множественного выбора */
    #pendings-priority-select option,
    #payout-priority-select option {
        padding-left: 25px; /* Отступ для галочки */
        position: relative;
    }

    #pendings-priority-select option.selected::before,
    #payout-priority-select option.selected::before {
        content: '✔'; /* Галочка */
        position: absolute;
        left: 5px;
        color: green;
        font-weight: bold;
    }

    /* Стили для кнопок */
    #pendings-update-btn,
    #payout-update-btn {
        display: block;
        width: 100%;
        padding: 10px;
        margin-top: 15px;
        background-color: #28a745;
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s;
    }

    #pendings-update-btn:hover,
    #payout-update-btn:hover {
        background-color: #218838;
    }

    /* Стили для сообщений об ошибках и успехах */
    .error {
        color: #dc3545;
        font-size: 14px;
        margin-top: 10px;
    }

    .success {
        color: #28a745;
        font-size: 14px;
        margin-top: 10px;
    }

    /* Стили для полей ввода */
    #pendings-total-amount,
    #payout-total-amount {
        width: 100%;
        padding: 10px;
        margin: 10px 0;
        border: 1px solid #ced4da;
        border-radius: 5px;
        font-size: 16px;
        background-color: #ffffff;
        color: #495057;
    }

    #pendings-total-amount:focus,
    #payout-total-amount:focus {
        outline: none;
        border-color: #80bdff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
    }

    /* Стиль для контейнера с приоритетом и суммой */
    .priority-amount-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
        max-width: 400px;
    }

    /* Стили для чекбокса автоотключения */
    #payout-auto-disable {
        margin-right: 10px;
        transform: scale(1.2); /* Увеличим чекбокс для лучшей видимости */
    }

    /* Стиль для контейнера чекбокса и подписи */
    .checkbox-container {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
    }

    #alert-error-msg,
    #alert-success-msg {
        font-size: 14px;
        margin-top: 10px;
    }

       #update-deposits-btn {
        display: block;
        width: 100%;
        padding: 10px;
        margin-top: 15px;
        background-color: #28a745;
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s;
    }

    #update-deposits-btn:hover {
        background-color: #218838;
    }

    /* Стили для контейнера "Deposits" */
    .deposit-priority-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 20px;
    }

    .deposit-priority-item {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .priority-label {
        font-weight: bold;
        flex-shrink: 0;
    }

    .amount-input,
    .bonus-input {
        width: 150px;
        padding: 5px;
        border: 1px solid #ced4da;
        border-radius: 5px;
    }

    .card-select {
        width: 100px;
        padding: 5px;
        border: 1px solid #ced4da;
        border-radius: 5px;
    }

    #inefficient-transaction-percent {
        width: 100%;
        padding: 10px;
        margin: 10px 0;
        border: 1px solid #ced4da;
        border-radius: 5px;
        font-size: 16px;
        background-color: #ffffff;
        color: #495057;
    }
    #verification-settings {
            display: none;
            padding: 20px;
        }
        .verification-sheet-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .verification-sheet-input {
            width: 100%;
            padding: 10px;
            margin: 5px 0;
            border: 1px solid #ced4da;
            border-radius: 5px;
        }
        #verification-update-btn {
            display: block;
            width: 100%;
            padding: 10px;
            margin-top: 15px;
            background-color: #28a745;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        #verification-update-btn:hover {
            background-color: #218838;
        }
`;
        document.head.appendChild(style);

        const content = `
<select id="project-select" required>
    <option value="" disabled selected>Оберіть проєкт</option>
    <option value="Betking">Betking</option>
    <option value="777">777</option>
    <option value="Vegas">Vegas</option>
    <option value="Verification">Доп. верифікація</option>
</select>
<div id="alert-type-section" style="display: none;">
    <select id="alert-type-select" required>
        <option value="" disabled selected>Оберіть алерт</option>
        <option value="Pendings">Pendings</option>
        <option value="PayOut">PayOut</option>
        <option value="Deposits">Deposits</option>
    </select>
</div>

        <div id="pendings-settings" style="display: none;">
            <div class="priority-amount-container">
                <label for="pendings-priority-select">Пріоритет:</label>
                <select id="pendings-priority-select" multiple required></select>
                <label for="pendings-total-amount">Сума:</label>
                <input type="text" id="pendings-total-amount">
                <label for="pendings-manager-select" align="center">Відповідальний менеджер:</label>
                <select id="pendings-manager-select" required align="center">
                <option value="" disabled selected>Оберіть менеджера</option>
                </select>
            </div>
            <button id="pendings-update-btn">Оновити</button>
        </div>

        <div id="payout-settings" style="display: none;">
            <div class="priority-amount-container">
                <label for="payout-priority-select">Пріоритет:</label>
                <select id="payout-priority-select" multiple required></select>
                <label for="payout-total-amount">Мінімальна сума виплати:</label>
                <input type="text" id="payout-total-amount">
                <label for="payout-auto-disable">Автоматичне відключення авто:</label>
                <input type="checkbox" id="payout-auto-disable">
                <label for="payout-manager-select" align="center">Відповідальний менеджер:</label>
                <select id="payout-manager-select" required align="center">
                <option value="" disabled selected>Оберіть менеджера</option>
                </select>
            </div>
            <button id="payout-update-btn">Оновити</button>
        </div>

        <div id="deposits-settings" style="display: none;">
            <div class="deposit-priority-container">
                ${["1 (75к)", "2 (65к)", "3 (60к)", "4 (50к)", "5 (45к)", "6 (30к)", "7 (20к)", "8 (20к)"].map(priority => `
                    <div class="deposit-priority-item">
                        <span class="priority-label">Приоритет ${priority}</span>
                        <input type="text" class="amount-input" placeholder="Сума" />
                        <input type="text" class="bonus-input" placeholder="Сума з бонусом" />
                        <select class="card-select" multiple>
                            <option value="foreign">Чужа</option>
                            <option value="own">Своя</option>
                            <option value="unknown">Невідома</option>
                        </select>
                    </div>
                `).join('')}
            </div>
            <label for="inefficient-transaction-percent">Відсоток недоцільних транзакцій:</label>
            <input type="text" id="inefficient-transaction-percent" placeholder="Введіть відсоток (приклад): 10%" />
             <label for="deposits-manager-select" align="center">Відповідальний менеджер:</label>
             <select id="deposits-manager-select" required align="center">
             <option value="" disabled selected>Оберіть менеджера</option>
             </select>
            <button id="update-deposits-btn">Оновити</button>
        </div>

<div id="verification-settings">
            <div class="verification-sheet-container">
                <label for="verification-betking-sheet">Назва листа для Betking:</label>
                <input type="text" id="verification-betking-sheet" class="verification-sheet-input" placeholder="Введіть назву листа">
                <label for="verification-777-sheet">Назва листа для 777:</label>
                <input type="text" id="verification-777-sheet" class="verification-sheet-input" placeholder="Введіть назву листа">
                <label for="verification-vegas-sheet">Назва листа для Vegas:</label>
                <input type="text" id="verification-vegas-sheet" class="verification-sheet-input" placeholder="Введіть назву листа">
            </div>
            <button id="verification-update-btn">Оновити</button>
        </div>
        <div class="error" id="alert-error-msg"></div>
        <div class="success" id="alert-success-msg"></div>

        <div class="error" id="alert-error-msg"></div>
        <div class="success" id="alert-success-msg"></div>
    `;
        createPopup('alert-settings-popup', 'Налаштування алертів', content, () => {});

        byId('project-select').addEventListener('change', async (e) => {
            const selectedValue = e.target.value;
            hideAllSections();

            if (!selectedValue) {
                byId('alert-type-section').style.display = 'none';
                return;
            }

            if (selectedValue === 'Verification') {
                showSection(SETTINGS_SECTIONS.Verification);
                byId('alert-type-section').style.display = 'none'; // Скрываем выбор типа алерта
                const manager = new SettingsManager('Verification');
                await manager.loadSettings(null); // Загружаем настройки без проекта
            } else {
                // Для остальных проектов показываем выбор типа алерта
                byId('alert-type-section').style.display = 'block';
                byId('alert-type-select').selectedIndex = 0; // Сбрасываем выбор типа алерта
            }
        });

        byId('alert-type-select').addEventListener('change', async (e) => {
            hideAllSections();
            const alertType = e.target.value;
            if (!alertType) return;

            const manager = new SettingsManager(alertType);
            showSection(SETTINGS_SECTIONS[alertType]);
            const project = byId('project-select').value;
            if (project) {
                await manager.loadManagers();
                await manager.loadSettings(project);
            }
        });

        ['pendings-update-btn', 'payout-update-btn', 'update-deposits-btn', 'verification-update-btn'].forEach(btn =>
                                                                                                               byId(btn).addEventListener('click', () => {
            const alertType = {
                'pendings-update-btn': 'Pendings',
                'payout-update-btn': 'PayOut',
                'update-deposits-btn': 'Deposits',
                'verification-update-btn': 'Verification'
            }[btn];
            const project = alertType === 'Verification' ? null : byId('project-select').value;
            new SettingsManager(alertType).updateSettings(project);
        })
                                                                                                              );
    }
    function verificationProvider() {
        return new Promise((resolve, reject) => {
            const playerId = getPlayerID();

            const url = `${ProjectUrl}/players/playerIdentityVerification/index/`;

            GM_xmlhttpRequest({
                method: 'POST',
                url: url,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: `backend_modules_players_models_PlayerIdentityVerificationSearchForm[login]=${encodeURIComponent(playerId)}`,
                onload: function (response) {
                    if (response.status === 200) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, 'text/html');

                        const rows = doc.querySelectorAll('tbody tr');
                        for (let row of rows) {
                            const cells = row.querySelectorAll('td');
                            const verificationCount = cells[1]?.textContent.trim();
                            const provider = cells[7]?.textContent.trim();

                            if (verificationCount === '1') {
                                resolve(provider);
                                return;
                            } else if (!verificationCount && provider === 'SumSub') {
                                resolve(provider);
                                return;
                            }
                        }
                        resolve(null);
                    } else {
                        reject(new Error(`Ошибка запроса: ${response.status} ${response.statusText}`));
                    }
                },
                onerror: function (error) {
                    reject(new Error(`Ошибка сети: ${error}`));
                }
            });
        });
    }

    const clientEmail = "test-sheets@orbital-avatar-417621.iam.gserviceaccount.com";
    const privateKey = `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDfBJ/rNCji7Lqz\ntISIWkJNieayzecS8CKbCh+x+YJG5T22Uykkj61qaE6zklx1QWA0mCbD3XvIHWyZ\n/lmqi1niCgwMrzv5pwrnBIrtLvnirZfVYl8o3AmrzjuqsDDzRCfz3HYBm5FNk899\nr/DfH5P3/cnu+np2tgZCiIZqyPDCwSS+8cg/B8oJi4gljNERXTTaCplkyzuYhybT\nAhR0I09mQi9rl49BH1RIRuzlq+dANyGcT0bHZuu1SkqlwfqC4O2LJXK4ZRtEscyQ\nL9ayKaLwIkdumVyzxhmFeI+AdtN0Ncm3+lE6mIAMv/AXa51A1tAglk2ywV3ylxqT\nljyCwpy3AgMBAAECggEACRm/i4c0XUDlxCw19aPL7YLBbEMkuSFyzWWAskWJQGqz\nCvv3w4CCxhh9kFcE+NqdxLz/ZUy7dAi8rsgHUVigZq3xnJmQq/kEuTVL6gPZufCg\nL9qfds5hLVFGyV9T5V6+9p+PcooDnZPONXB24X6rY2+ddugNE/JiQlgfNr+pEM63\nX9GvGFQhYTgZAcGuYoqZf33FEs8M8IzozYWvx/9CPRlqmjNymOSrBsMIvS7KxZFO\nyUmSUaj1gFGRQUmnCK5kmUm0FT35xAqWv/55XKNgWnmX+Ubp9aGO6KcDE6t3XK52\nj5lPvlYgwUjq3bQGN9WEng4QYkPvjoCGlw1o5mcPQQKBgQD39Yr1HzBWBXJDEjK/\nrtTFwLcezNZwTq+I1V8gy6MgFYmNoMQ/ZPIt0aqJCsGAR3vQA9r8PXIC8OU+m3fU\nbD5FNt9n5SyueH+wDgjAI9M/IcJ9jKL4jaFA/iAlFf/MHevqQFueY6UecSGaPgKh\nhNXO5z3t6SwP+JO8jL0/EErQYQKBgQDmQAfwEGBeF+6OEFGI7IF5ZYd/xWnjvIj2\nHKsXXKakxGvz/iEPTxWkPIg1P5E5FcK4L/v4i12uOIjC428p2oLhy2wKm2AWEcDz\n5a9du4tsFamMqcA4YewgA9O8Mf/I0Iu9gszOH32RNRjAvxB6M01hwWaQMVF8EvUg\nnKABpSRkFwKBgA1sgaVbluZRTSpMZerysBo0oLVOKZ3S5LXnt0qzO5WVFOlR9s3n\nzSSl4TGiH2+ubwmH6+cT/IQkPoTxLb+WTJi6q8WYJp8bbu49FEQyrFESptDdOEV0\nhXJbT6oyUrLeO9NmwI8Gnf3T6hnLmaDc7CZTZormwLfsoTLn+6baXvKBAoGBAOQm\nMHddEtBJsHUOkGw3xbevtgsSZ3FlAOW11IaKpQmBJGMZvlJ4D760yFbTDSheepqd\n2XQXTJV0qXdLe3wibCwmsID2IsjbgLFsN0+OpYFNGbsq/TAhP6Mdh7HkbUrj8oOv\nVxcrtvWqgkODT2V27kdeJy3b4J0r/77308ithZizAoGAIll6hMCpgK31oX0yRcAQ\n2re14VOGQgLwdj2jqywvlBlynR7KWEHxDt5VUdKPXFGvTyQsiK6U66ZiaO5WqyRy\n9Je4hv0JUfmTPHbUZrT72oun6axQ9c0kmgz46YAsQtmiX3hdvNtPPym+Fvokasmb\nV64l1KqOdNici1ftDWTiEsY=\n-----END PRIVATE KEY-----`; // Из JSON файла сервисного аккаунта
    const sheetId = "11D8k58HcQOBHlK3CpmaWbFOj8vUk1xhE_5VQ88fxBvk";

    const scopes = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive";

    function getAccessToken() {
        return new Promise((resolve, reject) => {
            console.log("Generating JWT...");
            const iat = Math.floor(Date.now() / 1000);
            const exp = iat + 3600;

            const oHeader = { alg: "RS256", typ: "JWT" };
            const oPayload = {
                iss: clientEmail,
                scope: scopes,
                aud: "https://oauth2.googleapis.com/token",
                exp: exp,
                iat: iat
            };

            const sHeader = JSON.stringify(oHeader);
            const sPayload = JSON.stringify(oPayload);

            const sJWT = KJUR.jws.JWS.sign("RS256", sHeader, sPayload, privateKey);

            fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${sJWT}`
            })
                .then(response => response.json())
                .then(data => {
                if (data.access_token) {
                    resolve(data.access_token);
                } else {
                    reject("No access_token found in response.");
                }
            })
                .catch(err => {
                console.error("Error during token request:", err);
                reject(err);
            });
        });
    }

    function sendDataToGoogleSheet(accessToken, sheetName, data) {
        console.log("Sending data to Google Sheets...");
        fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!A1:append?valueInputOption=RAW`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken,
            },
            body: JSON.stringify({
                values: [[
                    data.url,
                    data.playerID,
                    data.date,
                    data.name,
                    data.email,
                    data.department,
                    data.reason
                ]]
            })
        }).then(response => response.json())
            .then(data => {
        })
            .catch((error) => {
            console.error("Error sending data to Google Sheets:", error);
        });
    }

    async function goToGoogleSheet() {
        const attentionHeader = document.querySelector('.attention-header');
        if (!attentionHeader?.textContent.includes('Не подтвержден!')) return;

        const targetDiv = document.querySelector('.form-actions');
        if (!targetDiv) return;

        const button = createVerificationButton();
        targetDiv.appendChild(button);

        let verificationSheets;
        try {
            const settings = await ApiService.fetchData('/get_settings?alert_type=Verification');
            verificationSheets = settings.sheets || { Betking: '', '777': '', Vegas: '' };
        } catch (error) {
            console.error('Ошибка загрузки настроек верификации:', error);
            verificationSheets = { Betking: '', '777': '', Vegas: '' }; // Fallback
        }

        button.addEventListener('click', (event) => handleVerificationClick(event, verificationSheets));
    }

    function setupModalHandler() {
        const decrementButton = document.querySelector('#decrement-balance');
        if (!decrementButton) return;

        decrementButton.addEventListener('click', () => {
            const waitForModal = setInterval(() => {
                const title = document.querySelector('.swal2-title');
                const confirmButton = document.querySelector('.swal2-confirm');

                if (title && confirmButton && title.textContent === 'Уменьшить Баланс') {
                    if (!confirmButton.dataset.listenerAdded) {
                        confirmButton.dataset.listenerAdded = 'true';
                        confirmButton.addEventListener('click', () => {
                            if (!userId) return;
                            setTimeout(() => updateComment(userId), 1000);
                        });
                    }
                    clearInterval(waitForModal);
                }
            }, 100);
        });
    }

    function fetchTransactionLog(userId) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${ProjectUrl}players/playersItems/transactionLog/${userId}/`,
                onload: function(response) {
                    try {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, 'text/html');
                        const rows = Array.from(doc.querySelectorAll('table.table.table-striped.table-hover tbody tr'));
                        let manualBalance = '';
                        let refundDeposits = [];
                        let safeBalance = [];
                        const today = new Date();
                        const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

                        for (const row of rows) {
                            const cells = row.querySelectorAll('td');
                            if (cells.length < 8) continue;

                            const operation = cells[1].textContent.trim();
                            const amount = cells[2].textContent.trim();
                            const fullDate = cells[6].textContent.trim();
                            const dateOnly = fullDate.split(' ')[0];
                            const comment = cells[7].textContent.trim();
                            const entry = { date: fullDate, comment: comment };

                            if (operation === 'Ручное начисление баланса' && !manualBalance) {
                                manualBalance = `${fullDate} ${comment}`;
                            } else if (operation === 'Рефанд депозита' && dateOnly === todayStr) {
                                refundDeposits.push(entry);
                            } else if (
                                operation === 'Ручное начисление баланса Сейфа' &&
                                dateOnly === todayStr &&
                                parseFloat(amount) < 0
                            ) {
                                safeBalance.push(entry);
                            }
                        }

                        let result = '';
                        if (manualBalance) {
                            result += manualBalance;
                        }
                        if (refundDeposits.length > 0) {
                            if (result) result += '<br>';
                            const firstRefund = refundDeposits[0];
                            const refundNumbers = refundDeposits.map(refund => refund.comment.match(/№\s*(\d+)/)?.[1]).filter(Boolean);
                            result += `${firstRefund.date} Рефанд депозита № ${refundNumbers.join(', № ')}`;
                        }
                        if (safeBalance.length > 0) {
                            if (result) result += '<br>';
                            const firstSafe = safeBalance[0];
                            const safeComments = safeBalance.map(safe => safe.comment).join('; ');
                            result += `${firstSafe.date} ${safeComments}`;
                        }

                        resolve(result || 'Не найдено подходящих операций');
                    } catch (e) {
                        reject(e.message);
                    }
                },
                onerror: function(error) {
                    reject(error.statusText || 'Неизвестная ошибка');
                }
            });
        });
    }


    async function updateComment(userId) {
        const gatewayElement = document.getElementById('gateway-method-description-visible-common');
        if (!gatewayElement) return;

        const doneButton = document.querySelector('.btn-update-comment-common');
        const insertText = await fetchTransactionLog(userId);

        let currentContent = gatewayElement.innerHTML.trim();

        if (currentContent === '') {
            gatewayElement.innerHTML = insertText + '<br>';
        } else {
            gatewayElement.innerHTML = currentContent + '<br>' + insertText + '<br>';
        }

        gatewayElement.dispatchEvent(new Event('input'));

        if (doneButton) doneButton.click();
    }

    function createVerificationButton() {
        const button = document.createElement('button');
        button.id = 'custom-verification-button';
        button.className = 'btn btn-info';
        button.innerHTML = '<i class="fa fa-plus"></i> На верифікацію';
        button.style.marginLeft = '10px';
        return button;
    }

    async function handleVerificationClick(event, verificationSheets) {
        event.preventDefault();

        const { department, reason } = await showVerificationPopup();
        if (!department || !reason) return;

        const playerData = gatherPlayerData();
        const sheetName = getSheetNameForProject(playerData.project, verificationSheets);

        try {
            const accessToken = await getAccessToken();
            const dataToInsert = {
                url: window.location.href,
                playerID: playerData.playerID,
                date: null,
                name: playerData.name,
                email: playerData.email,
                department,
                reason
            };
            console.log('Данные для отправки:', dataToInsert);

            await sendDataToGoogleSheet(accessToken, sheetName, dataToInsert);
            Swal.fire({
                icon: 'success',
                title: 'Успішно!',
                text: `Додали у таблицю.\nВідділ: ${department}\nПричина: ${reason}`,
            });
        } catch (error) {
            console.error('Ошибка при отправке в Google Sheet:', error);
            Swal.fire({
                icon: 'error',
                title: 'Помилка',
                text: 'Не вдалося додати дані до таблиці.',
            });
        }
    }

    function showVerificationPopup() {
        return Swal.fire({
            title: 'Відправити на верифікацію',
            html: `
            <style>
                .swal2-popup .swal2-html-container { overflow: visible !important; }
                .swal2-select {
                    height: auto !important;
                    max-height: 150px;
                    width: 85%;
                    margin-bottom: 10px;
                    overflow-y: auto;
                    box-sizing: border-box;
                    padding: 5px;
                    font-size: 14px;
                }
                option { font-size: 14px; padding: 4px; }
            </style>
            <label for="department-select">Оберіть відділ</label>
            <select id="department-select" class="swal2-select">
                <option value="">Оберіть...</option>
                <option value="PayOut">PayOut</option>
                <option value="Managers">Managers</option>
                <option value="Cascad">Cascad</option>
                <option value="Anti Fraud">Anti Fraud</option>
            </select>
            <label for="reason-select">Вкажіть причину</label>
            <select id="reason-select" class="swal2-select">
                <option value="">Оберіть...</option>
                ${[
                    'Після рефанду використовує чужу картку',
                    'Підозра на малолітнього',
                    'Підозра на Лудомана',
                    'Схемщик/потенц. фрод',
                    'Більше двох чужих карток в місяць',
                    'Картка родича, неприбутковий',
                    'Недоцільні транзакції',
                    'Картковий фрод',
                    'Фін претензія',
                    'Cascad'
                ].map(reason => `<option value="${reason}">${reason}</option>`).join('')}
            </select>
        `,
            showCancelButton: true,
            confirmButtonText: 'Відправити',
            cancelButtonText: 'Скасувати',
            preConfirm: () => {
                const department = document.getElementById('department-select').value;
                const reason = document.getElementById('reason-select').value;
                if (!department || !reason) {
                    Swal.showValidationMessage('Будь ласка, оберіть усі параметри');
                    return false;
                }
                return { department, reason };
            }
        }).then(result => result.isConfirmed ? result.value : {});
    }

    function gatherPlayerData() {
        const playerID = getPlayerID();
        const project = getProject();
        const name = Array.from(document.querySelectorAll('tr'))
        .filter(row => ['Имя', 'Middle Name', 'Фамилия'].includes(row.querySelector('th')?.textContent.trim()))
        .map(row => row.querySelector('td').textContent.trim())
        .join(' ');
        const email = Array.from(document.querySelectorAll('tr.even, tr.odd'))
        .find(row => row.querySelector('th')?.textContent.trim() === 'E-mail')
        ?.querySelector('td > div')
        ?.childNodes[0]?.textContent.trim();

        return { playerID, project, name, email };
    }

    function getSheetNameForProject(project, sheets) {
        const projectMap = {
            'betking': 'Betking',
            '777': '777',
            'vegas': 'Vegas'
        };
        const normalizedProject = projectMap[project.toLowerCase()] || '';
        const sheetName = sheets[normalizedProject] || '';

        if (!sheetName) {
            console.warn(`Название листа для проекта ${project} не найдено в настройках`);
        }
        return sheetName;
    }

    const BONUS_PATTERNS = {
        regular: /бонус(а)? №\s*(\d+)/i,
        sport: /Присвоение бонуса \(ставки на спорт\) №\s*(\d+)/i
    };

    const STYLES = `
    .well { min-height: 20px; padding: 19px; margin-bottom: 20px; background-color: #f5f5f5; border: 1px solid #e3e3e3; border-radius: 4px; }
    .well-sm { padding: 9px; border-radius: 3px; }
    .label { display: inline; padding: .2em .6em .3em; font-size: 75%; font-weight: 700; line-height: 1; color: #fff; text-align: center; white-space: nowrap; vertical-align: baseline; border-radius: .25em; }
    .label-success { background-color: #5cb85c; }
    .col-xs-12 { width: 100%; }
    .col-md-3 { width: 25%; }
    .col-md-5 { width: 41.66667%; }
    .col-md-6 { width: 50%; }
    .row { margin-right: -15px; margin-left: -15px; display: flex; flex-wrap: wrap; }
    .container-fluid { padding-right: 15px; padding-left: 15px; margin-right: auto; margin-left: auto; }
    .modal-header h3 { margin: 0; line-height: 1.42857143; }
    .modal-body { position: relative; padding: 15px; }
    ul.p-rich_text_list__bullet { padding-left: 0; list-style: disc outside; }
`;

    const makeBonusClickable = () => document.querySelectorAll('td').forEach(td => {
        const [type, match] = Object.entries(BONUS_PATTERNS).find(([_, pattern]) => pattern.test(td.textContent)) || [];
        if (!match) return;

        const bonusNumber = match.exec(td.textContent)[type === 'sport' ? 1 : 2];
        const isSportBonus = type === 'sport';
        const replaceText = match.exec(td.textContent)[0];

        td.innerHTML = td.innerHTML.replace(replaceText,
                                            `${isSportBonus ? 'Присвоение бонуса (ставки на спорт)' : 'бонуса'} ` +
                                            `<a href="#" class="bonus-link" data-bonus="${bonusNumber}" data-sport="${isSportBonus}" style="color: blue; cursor: pointer;">№ ${bonusNumber}</a>`
                                           );

        td.querySelector('.bonus-link').addEventListener('click', e => {
            e.preventDefault();
            fetchBonusInfo(bonusNumber, isSportBonus);
        });
    });

    const fetchBonusInfo = (bonusNumber, isSportBonus = false) => fetch(
        `${ProjectUrl}${isSportBonus ? 'sportBetting/sportBettingBonus' : 'bonuses/bonusesItems'}/preview/${bonusNumber}/`,
        { method: 'POST', headers: { "accept": "*/*", "x-requested-with": "XMLHttpRequest" }, credentials: 'include' }
    )
    .then(res => res.text())
    .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        let content;

        if (isSportBonus) {
            content = formatSportBonusContent(doc.querySelector('.popup-content'));
        } else {
            const modalContent = doc.querySelector('.modal-content');
            if (modalContent) {
                // Прибираємо кнопку закриття з HTML
                const closeButton = modalContent.querySelector('.close');
                if (closeButton) closeButton.remove();
                content = modalContent.innerHTML;
            }
        }

        if (content) showPopup(content);
        else alert(`Ошибка: не удалось получить данные о ${isSportBonus ? 'спортивном ' : ''}бонусе.`);
    })
    .catch(error => console.error('Ошибка при запросе бонуса:', error))

    const formatSportBonusContent = popupContent => {
        if (!popupContent) return '';
        const getText = (sel, fallback = '') => popupContent.querySelector(sel)?.textContent || fallback;
        const getHtml = (sel, fallback = '') => popupContent.querySelector(sel)?.innerHTML || fallback;

        return `
        <div class="popup-content">
            <div class="modal-header"><h3>${getText('.modal-header h3', 'Спортивний бонус')}</h3></div>
            <div class="modal-body">
                <div class="container-fluid">
                    <div class="row"><div class="col-xs-12"><div class="well well-sm" style="background:#f5e8e8;">
                        <div><label>Название</label></div><div><span>${getText('.well-sm span')}</span></div>
                    </div></div></div>
                    <div class="row">
                        <div class="col-xs-12 col-md-6"><div class="well well-sm">
                            <div><label>Дата/время с</label></div><div><span>${getText('.col-md-6:nth-child(1) .well-sm span')}</span></div>
                        </div></div>
                        <div class="col-xs-12 col-md-6"><div class="well well-sm">
                            <div><label>Дата/время до</label></div><div><span>${getText('.col-md-6:nth-child(2) .well-sm span')}</span></div>
                        </div></div>
                    </div>
                    <div class="row"><div class="col-xs-12 col-md-3"><div class="well well-sm">
                        <div><label>Тип бонуса</label></div><div><span class="label label-success">${getText('.label-success')}</span></div>
                    </div></div></div>
                    <div class="row"><div class="col-xs-12 col-md-3"><div class="well well-sm">
                        <div><label>Доступно раз</label></div><div><span>${getText('.col-md-3:nth-child(1) .well-sm span')}</span></div>
                    </div></div></div>
                    <div class="row"><div class="col-xs-12 col-md-5"><div class="well well-sm">
                        <div><label>Минимальная сумма депозита</label></div><div><span>${getText('.col-md-5 .well-sm span')}</span></div>
                    </div></div></div>
                    <hr>
                    <div class="row"><div class="col-xs-12"><div class="well well-sm" style="background:#fff;">
                        <div><label>Текст сумма</label></div><div><span>${getText('.row:nth-last-child(3) .well-sm span')}</span></div>
                    </div></div></div>
                    <div class="row"><div class="col-xs-12"><div class="well well-sm" style="background:#fff;">
                        <div><label>Вейджер описание</label></div><div><span>${getText('.row:nth-last-child(2) .well-sm span')}</span></div>
                    </div></div></div>
                    <div class="row"><div class="col-xs-12"><div class="well well-sm" style="background:#fff;">
                        <div><label>Промо описание</label></div><div>${getHtml('.row:last-child .well-sm > div:nth-child(2)')}</div>
                    </div></div></div>
                </div>
            </div>
        </div>
    `.trim();
    };

    const showPopup = content => {
        let popup = document.getElementById('custom-popup');
        if (!popup) {
            popup = document.createElement('div');
            Object.assign(popup.style, {
                position: 'fixed', top: '10%', left: '50%', transform: 'translate(-50%, 0)',
                backgroundColor: '#fff', boxShadow: '0 0 10px rgba(0,0,0,0.5)', zIndex: '9999',
                width: '60%', padding: '20px', borderRadius: '8px', overflowY: 'auto', maxHeight: '80%'
            });
            popup.id = 'custom-popup';
            document.body.appendChild(popup);

            const style = document.createElement('style');
            style.textContent = STYLES;
            popup.appendChild(style);
        }

        popup.innerHTML = content;
        const closeBtn = Object.assign(document.createElement('button'), {
            innerHTML: '×',
            style: 'position: absolute; top: 10px; right: 10px; background: transparent; color: red; border: none; font-size: 24px; cursor: pointer;'
        });
        closeBtn.onclick = () => popup.remove();
        popup.appendChild(closeBtn);
    };

    function addAgeToBirthdate() {
        function calculateAge(birthDate) {
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();

            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            return age;
        }

        const rows = document.querySelectorAll("tr");

        const style = document.createElement('style');
        style.innerHTML = `
        @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
        }
    `;
        document.head.appendChild(style);

        rows.forEach(row => {
            const th = row.querySelector("th");
            if (th && th.textContent.trim() === "День рождения") {
                const td = row.querySelector("td");
                if (td) {
                    const birthDateStr = td.textContent.trim();
                    const birthDateParts = birthDateStr.split(" ");
                    const day = parseInt(birthDateParts[0], 10);
                    const month = months[birthDateParts[1].toLowerCase()];
                    const year = parseInt(birthDateParts[2], 10);

                    const birthDate = new Date(year, month - 1, day);
                    const age = calculateAge(birthDate);

                    const ageSpan = document.createElement("span");
                    ageSpan.textContent = ` | Вік: ${age}`;

                    if (age <= 23 || age >= 60) {
                        ageSpan.style.color = "red";
                        ageSpan.style.fontWeight = "bold";
                        ageSpan.style.animation = "blink 1s infinite";

                    }

                    td.appendChild(ageSpan);
                }
            }
        });
    }

    function addPibRow() {
        const rows = document.querySelectorAll("tr");

        let surname = "";
        let middleName = "";
        let firstName = "";

        rows.forEach(row => {
            const th = row.querySelector("th");
            if (th) {
                if (th.textContent.trim() === "Фамилия" || th.textContent.trim() === "Surname") {
                    surname = row.querySelector("td").textContent.trim();
                } else if (th.textContent.trim() === "Middle Name") {
                    middleName = row.querySelector("td").textContent.trim();
                } else if (th.textContent.trim() === "Имя" || th.textContent.trim() === "Name") {
                    firstName = row.querySelector("td").textContent.trim();
                }
            }
        });

        const pib = `${surname} ${firstName} ${middleName}`;

        const newRow = document.createElement("tr");
        newRow.classList.add("even");

        const th = document.createElement("th");
        th.textContent = "ПІБ";

        const td = document.createElement("td");
        td.textContent = pib;

        newRow.appendChild(th);
        newRow.appendChild(td);

        const commentRow = Array.from(rows).find(row => {
            const th = row.querySelector("th");
            return th && (th.textContent.trim() === "Комментарий" || th.textContent.trim() === "Comment");
        });

        if (commentRow) {
            commentRow.parentNode.insertBefore(newRow, commentRow);
        }
    }

    function disablePromoOffersUSA() {
        const project = getProject();
        const baseHeaders = {
            accept: "*/*",
            "accept-language": "uk,ru-RU;q=0.9,ru;q=0.8,en-US;q=0.7,en;q=0.6",
            "cache-control": "no-cache",
            pragma: "no-cache",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Google Chrome\";v=\"134\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest"
        };

        const baseConfig = {
            referrer: `https://admin.${project}.com/players/playersItems/update/${userId}/`,
            referrerPolicy: "strict-origin-when-cross-origin",
            method: "POST",
            mode: "cors",
            credentials: "include"
        };

        const targetTr = Array.from(document.querySelectorAll('tr'))
        .find(tr => tr.querySelector('th')?.textContent.trim() === 'Лимит промо оферов в день');
        const targetTd = targetTr?.querySelector('td');

        if (!targetTd) {
            console.error('Не найден элемент <td> в строке с "Лимит промо оферов в день"');
            console.log('Найденные <th>:', Array.from(document.querySelectorAll('th')).map(th => th.textContent.trim()));
            return;
        }

        const disableButton = $('<input>', {
            type: 'button',
            value: 'Вимкнути всі активності',
            class: 'btn btn-xs btn-danger',
            css: { 'margin-right': '10px' }
        }).on('click', e => {
            e.preventDefault();
            Swal.fire({
                icon: 'question',
                title: 'Вимкнути всі активності?',
                showCancelButton: true,
                cancelButtonText: 'Відміна',
                confirmButtonText: 'Так',
                preConfirm: async () => {
                    try {
                        const limitResponse = await fetch(
                            `https://admin.${project}.com/players/playersItems/changePromoOfferLimitPerDay/`,
                            {
                                ...baseConfig,
                                headers: { ...baseHeaders, "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
                                body: `playerId=${userId}&offerLimit=0`
                            }
                        ).then(res => res.json());

                        if (!limitResponse.success) throw new Error(limitResponse.message || 'Помилка першого запиту');

                        const featuresResponse = await fetch(
                            `https://admin.${project}.com/players/playersItems/changeRestrictedFeatures/`,
                            {
                                ...baseConfig,
                                headers: { ...baseHeaders, "content-type": "application/json" },
                                body: JSON.stringify({
                                    playerId: userId,
                                    racesBlocked: true,
                                    tournamentsBlocked: true,
                                    jackpotsBlocked: true,
                                    lotteriesBlocked: true,
                                    rankLeagueBlocked: true,
                                    wheelsBlocked: true,
                                    cashbackBlocked: true,
                                    refererBlocked: true,
                                    moneyBoxBlocked: true,
                                    depositStreakBlocked: true,
                                    scratchCardLotteryBlocked: true
                                })
                            }
                        ).then(res => res.json());

                        if (!featuresResponse.success) throw new Error(featuresResponse.message || 'Помилка другого запиту');

                        const bonusResponse = await fetch(
                            `https://admin.${project}.com/players/playersItems/update/${userId}/`,
                            {
                                ...baseConfig,
                                headers: { ...baseHeaders, "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
                                body: `Players[no_bonus]=1`
                            }
                        ).then(res => res.text());

                        if (!bonusResponse) throw new Error('Помилка третього запиту');
                        const currentLanguage = GM_getValue(languageKey, 'російська');
                        let insertText = currentLanguage === 'українська'
                        ? `Відключив всі активності, оффери, бонуси`
                        : `Отключил все активности, офферы, бонусы`;
                        insertTextToComment(insertText, true)
                        Swal.fire({ icon: 'success', title: 'Успішно відключено', width: '200px' })
                            .then(() => location.reload());
                    } catch (error) {
                        Swal.fire({ icon: 'error', title: 'Помилка', text: error.message });
                    }
                }
            });
        });
        targetTd.appendChild(disableButton[0]);
    }

    let previousValues = {
        moneyFromOfferPercentage: 0,
        activityMoneyPercentage: 0,
        totalPendings: 0
    };

    function addUSACheckButton(TotalPA, moneyFromOfferPercentage, activityMoneyPercentage, totalPendings, entries, winnings) {
        const formatableTextDiv = document.getElementById('formatable-text-antifraud_manager');
        if (!formatableTextDiv) return;

        if (moneyFromOfferPercentage !== undefined) previousValues.moneyFromOfferPercentage = moneyFromOfferPercentage;
        if (activityMoneyPercentage !== undefined) previousValues.activityMoneyPercentage = activityMoneyPercentage;
        if (totalPendings !== undefined) previousValues.totalPendings = totalPendings;

        const existingButton = document.getElementById('check-button');
        if (existingButton) {
            existingButton.remove();
        }

        const existingGreenButton = document.getElementById('green-button');
        if (existingGreenButton) {
            existingGreenButton.remove();
        }

        const checkButton = document.createElement('button');
        checkButton.id = 'check-button';
        checkButton.type = 'button';
        checkButton.innerText = 'Коментар';
        checkButton.onclick = () => {
            const date = getCurrentDate();
            const time = getCurrentTime();
            const initials = GM_getValue(initialsKey);
            const currentLanguage = GM_getValue(languageKey, 'російська').toLowerCase();
            const isRussian = currentLanguage === 'російська';

            const colorPA = TotalPA < 0.75 ? 'green' : (TotalPA >= 0.75 && TotalPA < 1 ? 'orange' : 'red');

            let textToInsert = `${date} в ${time} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span> | FM Offer: ${previousValues.moneyFromOfferPercentage}% | FM Activities: ${previousValues.activityMoneyPercentage.toFixed(2)}% | </b>`;

            if (previousValues.totalPendings > 1) {
                const balanceStyle = previousValues.totalPendings > 2000 ? 'color: red;' : '';
                textToInsert += `<b> ${isRussian ? 'На выплате' : 'На виплаті'}:</b> <b style="${balanceStyle}">${previousValues.totalPendings}$</b> | `;
            }

            if (entries > 10 || winnings > 10) {
                let balanceText = `<b>${isRussian ? 'На балансе' : 'На балансі'}:</b> `;
                const parts = [];

                if (entries > 10) {
                    parts.push(`${entries} entries`);
                }
                if (winnings > 10) {
                    parts.push(`${winnings} winings`);
                }

                textToInsert += balanceText + parts.join(' | ') + ' | ';
            }

            insertTextIntoField(textToInsert);
        };

        const greenButton = document.createElement('button');
        greenButton.id = 'green-button';
        greenButton.type = 'button';
        greenButton.innerText = 'Green';
        greenButton.style.marginLeft = '5px';
        greenButton.onclick = () => {
            document.execCommand('foreColor', false, 'green');
        };

        formatableTextDiv.insertBefore(checkButton, formatableTextDiv.firstChild);
        formatableTextDiv.insertBefore(greenButton, checkButton.nextSibling);

        formatableTextDiv.insertBefore(checkButton, formatableTextDiv.firstChild);
    }

    const POPUP_STYLES_USA = {
        position: 'fixed',
        top: '53px',
        left: '1409px',
        width: '310px',
        height: 'auto',
        padding: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        border: '2px solid black',
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
        zIndex: '10000',
        fontFamily: '"Roboto", sans-serif',
        fontSize: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: '10px',
        resize: 'both',
        overflow: 'auto',
        animation: 'glow 1s infinite alternate'
    };

    async function getProjectProfit(project, id) {
        const baseURL = `https://admin.${project}.com/players/playersDetail/index/`;
        const paymentsURL = `https://admin.${project}.com/payments/paymentsItemsOut/index/?PaymentsItemsOutForm%5Bid%5D=&PaymentsItemsOutForm%5Bstatus%5D%5B%5D=pending&PaymentsItemsOutForm%5Bstatus%5D%5B%5D=closed&PaymentsItemsOutForm%5Bsearch_login%5D=${id}&PaymentsItemsOutForm%5Bis_vip%5D=&PaymentsItemsOutForm%5Bsearch_amount%5D=&PaymentsItemsOutForm%5Bsearch_amount_api%5D=&PaymentsItemsOutForm%5Bsearch_date%5D=&PaymentsItemsOutForm%5Bsearch_payed%5D=&PaymentsItemsOutForm%5Bsearch_requisite%5D=&PaymentsItemsOutForm%5Bgateway_id%5D=&PaymentsItemsOutForm%5Bis_auto_payout_allowed%5D=&PaymentsItemsOutForm%5Boutput_id%5D=&ajax=__grid&newPageSize=500`;

        let deposits = 0;
        let withdrawals = 0;

        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: baseURL,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: `PlayersDetailForm%5Blogin%5D=${encodeURIComponent(id)}&PlayersDetailForm%5Bperiod%5D=2015.06.09+00%3A00%3A00+-+${getTomorrowDate()}+23%3A59%3A59&PlayersDetailForm%5Bshow_table%5D=1`,
                onload: (response) => {
                    const doc = new DOMParser().parseFromString(response.responseText, 'text/html');
                    const table = doc.querySelector('.detail-view');
                    if (table) {
                        table.querySelectorAll('tr').forEach(row => {
                            if (row.querySelector('th')?.textContent.trim() === 'Deposits Total') {
                                deposits = parseFloat(row.querySelector('td')?.textContent.trim().replace(/[^0-9.-]/g, '')) || 0;
                            }
                        });
                    }

                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: paymentsURL,
                        onload: (paymentsResponse) => {
                            const paymentsDoc = new DOMParser().parseFromString(paymentsResponse.responseText, 'text/html');
                            const paymentsTable = paymentsDoc.querySelector('.items.table.table-striped.table-hover');
                            if (paymentsTable) {
                                paymentsTable.querySelectorAll('tr').forEach(row => {
                                    const cells = row.querySelectorAll('td');
                                    if (cells.length >= 12) {
                                        const status = cells[1].querySelector('.label')?.textContent.trim();
                                        const gateway = cells[11].textContent.trim();
                                        const amount = parseFloat(cells[6].textContent.trim().replace(/[^0-9.-]/g, '')) || 0;
                                        if (status === 'closed' && gateway !== 'Другое') {
                                            withdrawals += amount;
                                        }
                                    }
                                });
                            }
                            const profit = deposits - withdrawals;
                            console.log(`${project}: Deposits=${deposits}, Withdrawals=${withdrawals}, Profit=${profit}`);
                            resolve({ project, profit, deposits, withdrawals });
                        },
                        onerror: () => resolve({ project, profit: 0, deposits: 0, withdrawals: 0 })
                    });
                },
                onerror: () => resolve({ project, profit: 0, deposits: 0, withdrawals: 0 })
            });
        });
    }

    async function getRelatedAccounts(currentProject, playerID) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `https://admin.${currentProject}.com/fraudDetectors/antifraudBase/personAccounts/?playerId=${userId}`,
                headers: {
                    "accept": "*/*",
                    "content-type": "application/x-www-form-urlencoded",
                    "x-requested-with": "XMLHttpRequest"
                },
                onload: (response) => {
                    if (response.status !== 200) {
                        reject(new Error(`Server error: ${response.status} - ${response.responseText}`));
                        return;
                    }
                    const doc = new DOMParser().parseFromString(response.responseText, 'text/html');
                    const accounts = doc.querySelectorAll('.person-account');
                    const relatedAccounts = [];
                    const projectLinks = {};

                    accounts.forEach(account => {
                        const project = account.querySelector('.person-account__project b')?.textContent.trim();
                        const successLabel = account.querySelector('.person-account__login b.label-success');
                        const id = successLabel?.querySelector('a')?.textContent.trim();
                        const link = successLabel?.querySelector('a')?.getAttribute('href');

                        if (project && id && successLabel) {
                            projectLinks[project] = link;
                            if (project !== currentProject) {
                                relatedAccounts.push({ project, id });
                            }
                        }
                    });
                    resolve({ relatedAccounts, projectLinks });
                },
                onerror: (error) => reject(error)
            });
        });
    }

    function formatProfitOutput(mainResult, relatedProjects, totalProfit, projectLinks, totalPending, winnings) {
        const cleanBalance = parseFloat(winnings) || 0;
        const prognoseInOut = mainResult.deposits - (totalPending + mainResult.withdrawals + cleanBalance);
        const TotalPA = (mainResult.withdrawals / mainResult.deposits) * 100;
        const prognosePA = mainResult.deposits ? ((mainResult.withdrawals + totalPending + cleanBalance) / mainResult.deposits * 100) : 0;

        const mainText = document.querySelector('.popup-main-text');
        if (mainText) {
            const totalPASpan = mainText.querySelector('span:nth-child(2)');
            if (totalPASpan) {
                const newTotalPA = TotalPA / 100;
                totalPASpan.textContent = newTotalPA.toFixed(2);
                totalPASpan.style.color = getColor(newTotalPA);
            }
        }

        addUSACheckButton((TotalPA / 100).toFixed(2));

        let outputHTML = `
        <div class="profit-section main-profit">
            <div>
                <b class="clickable" data-text='<b>Total InOut: <span style="color: ${getBalanceColor(mainResult.profit)}">${mainResult.profit.toFixed(2)}$</span></b>'>
                    Total InOut: <span style="color: ${getBalanceColor(mainResult.profit)}">${mainResult.profit.toFixed(2)}$</span>
                </b>
            </div>
            ${(totalPending > 1 || cleanBalance > 1) ? `
                <div>
                    <b class="clickable" data-text='<b>Prognose InOut: <span style="color: ${getBalanceColor(prognoseInOut)}">${prognoseInOut.toFixed(2)}$</span></b>'>
                        Prognose InOut: <span style="color: ${getBalanceColor(prognoseInOut)}">${prognoseInOut.toFixed(2)}$</span>
                    </b>
                </div>
                <div>
                    <b class="clickable" data-text='<b>Prognose PA: <span style="color: ${getColor(prognosePA / 100)}">${prognosePA.toFixed(2)}%</span></b>'>
                        Prognose PA: <span style="color: ${getColor(prognosePA / 100)}">${prognosePA.toFixed(2)}%</span>
                    </b>
                </div>
            ` : ''}
        </div>
        <div class="profit-section related-projects">
            <b>Related Projects:</b><br>
    `;

        relatedProjects.forEach(proj => {
            const projectName = proj.project.charAt(0).toUpperCase() + proj.project.slice(1);
            let link = projectLinks[proj.project] || '#';
            const playerId = link.split('/players/playersItems/index/?Players[login]=')[1];
            if (link.includes('/players/playersItems/index/?Players[login]=')) {
                link = `https://admin.${proj.project}.com/players/playersItems/search?PlayersSearchForm[number]=${playerId}`;
            }
            outputHTML += `
            <div>
                <a href="${link}" target="_blank" class="project-link">${projectName} (${playerId})</a>: ${proj.profit.toFixed(2)}$</div>
        `;
        });

        outputHTML += `
        </div>
        <div class="profit-section total-profit">
            <div><b>Person InOut:</b> ${totalProfit.toFixed(2)}$</div>
        </div>
    `;

        return outputHTML;
    }

    function modifyPersonAccountsLinks() {
        document.querySelector('.get-person-accounts-button').addEventListener('click', () => {
            const resultDiv = document.getElementById('result');
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(() => {
                    const links = resultDiv.querySelectorAll('.person-account__login a');
                    links.forEach(link => {
                        let href = link.getAttribute('href');
                        if (href.includes('/players/playersItems/index/?Players[login]=')) {
                            const playerId = href.split('/players/playersItems/index/?Players[login]=')[1];
                            const domain = href.split('/players/')[0]; // Берем домен, например https://admin.funzcity.com
                            const newHref = `${domain}/players/playersItems/search?PlayersSearchForm[number]=${playerId}`;
                            link.setAttribute('href', newHref);
                        }
                    });
                });
            });

            observer.observe(resultDiv, { childList: true, subtree: true });

            setTimeout(() => observer.disconnect(), 5000);
        });
    }

    async function fetchProfit(totalPending, winnings, profitButton, container) {
        const loader = document.createElement('div');
        loader.style.cssText = 'border: 8px solid #f3f3f3; border-top: 8px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite; margin: 10px auto;';
        container.appendChild(loader);

        const style = document.createElement('style');
        style.textContent = COMBINED_STYLES;
        document.head.appendChild(style);

        profitButton.remove();

        try {
            const playerID = getPlayerID();
            const currentProject = getProject();
            console.log(`Starting for ${currentProject} with ID ${playerID}`);

            const mainResult = await getProjectProfit(currentProject, playerID);
            const { relatedAccounts, projectLinks } = await getRelatedAccounts(currentProject, playerID);
            const relatedPromises = relatedAccounts.map(acc => getProjectProfit(acc.project, acc.id));
            const relatedResults = await Promise.all(relatedPromises);

            const allProjectsProfit = [mainResult, ...relatedResults];
            const totalProfit = allProjectsProfit.reduce((sum, item) => sum + item.profit, 0);

            container.removeChild(loader);
            container.innerHTML = formatProfitOutput(mainResult, relatedResults, totalProfit, projectLinks, totalPending, winnings);

            container.querySelectorAll('.clickable').forEach(element => {
                element.addEventListener('click', () => {
                    if (element.dataset.clicked === 'true') return;

                    const formattedText = element.getAttribute('data-text');
                    insertTextToComment(formattedText);
                    element.dataset.clicked = 'true';

                    element.style.opacity = '0.85';
                });
            });
        } catch (error) {
            console.error('Error in fetchProfit:', error);
            container.removeChild(loader);
            container.innerHTML = `<div style="color: red;">Error: ${error.message}</div>`;
        }
    }

    function createIcon(iconClass, positionStyles, title, onClick) {
        const icon = document.createElement('div');
        icon.innerHTML = `<i class="fa ${iconClass}"></i>`;
        applyStyles(icon, { ...ICON_STYLES, ...positionStyles });
        icon.title = title;
        icon.onclick = onClick;
        return icon;
    }

    async function createUSAPopupBox() {
        if (document.getElementById('custom-popup-box')) return;

        async function fetchMonthAndTotalPA() {
            const urlMatch = Array.from(document.querySelectorAll('script'))
            .find(script => script.textContent.includes('#show-player-in-out'))
            ?.textContent.match(/url:\s*'([^']+)'/)?.[1];
            if (!urlMatch) return null;

            try {
                const response = await $.ajax({ type: 'GET', url: urlMatch });
                return { TotalPA: response.totalInOut, MonthPA: response.monthInOut };
            } catch (error) {
                console.error('Error fetching PA:', error);
                return null;
            }
        }

        setTimeout(async () => {
            const { TotalPA, MonthPA } = (await fetchMonthAndTotalPA()) || {};
            const entries = document.querySelector('#Players_balance')?.value.trim() || 'N/A';
            const winnings = getWinnings() || 'N/A';

            const popupBox = document.createElement('div');
            const popupWidth = parseInt(POPUP_STYLES_USA.width.replace('px', ''), 10);
            applyStyles(popupBox, {
                ...POPUP_STYLES_USA,
                left: `calc(100% - ${popupWidth + 20}px)`,
                border: `2px solid ${getColor(TotalPA)}`,
                animation: 'glow 1s infinite alternate'
            });
            popupBox.id = 'custom-popup-box';

            const dragHandle = document.createElement('div');
            applyStyles(dragHandle, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '20px',
                cursor: 'move'
            });
            popupBox.appendChild(dragHandle);

            let isDragging = false;
            let offsetX, offsetY;
            dragHandle.addEventListener('mousedown', (e) => {
                isDragging = true;
                offsetX = e.clientX - popupBox.getBoundingClientRect().left;
                offsetY = e.clientY - popupBox.getBoundingClientRect().top;
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });

            function onMouseMove(e) {
                if (!isDragging) return;
                popupBox.style.left = `${e.clientX - offsetX}px`;
                popupBox.style.top = `${e.clientY - offsetY}px`;
            }

            function onMouseUp() {
                isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }

            const mainText = document.createElement('div');
            mainText.className = 'popup-main-text';
            mainText.innerHTML = `
            <center><h3 id="freemoney-info"></h3></center>
            <center><b>Entries: ${entries}$ | Winnings: ${winnings}$</center>
            <center>Month: <span style="color: ${MonthPA < 0.75 ? 'green' : (MonthPA >= 0.75 && MonthPA < 1 ? 'orange' : 'red')}">${MonthPA || 'N/A'}</span> | Total: <span style="color: ${TotalPA < 0.75 ? 'green' : (TotalPA >= 0.75 && TotalPA < 1 ? 'orange' : 'red')}">${TotalPA || 'N/A'}</span></center>
            <center id="pending-info"></center>
            <center id="offer-info">Loading deposit analysis...</center>
            <center id="activitymoney-info"></b></center>
        `;
            popupBox.appendChild(mainText);

            popupBox.appendChild(createSettingsIcon());
            popupBox.appendChild(createStatisticIcon());
            popupBox.appendChild(createIcon('fa-eye', { top: '10px', left: '10px' }, 'Нагляд', () => createFraudPopup()));
            const showReminder = GM_getValue('reminderDisplayKey', true);
            if (showReminder) {
                const reminderIcon = createIcon('fa-book', { top: '40px', left: '10px' }, 'Памятка', () => {
                    createReminderPopup();
                    reminderIcon.classList.remove('blinking');
                    GM_setValue('reminderBlinkKey', false);
                });
                if (await checkForNewArticles() || GM_getValue('reminderBlinkKey', true)) {
                    reminderIcon.classList.add('blinking');
                }
                popupBox.appendChild(reminderIcon);
            }
            await addAdminIcon(popupBox);

            const firstRowButtonContainer = document.createElement('div');
            applyStyles(firstRowButtonContainer, { marginTop: '10px', display: 'flex', gap: '10px' });
            popupBox.appendChild(firstRowButtonContainer);

            const { isCheckedToday } = await checkUserInChecklist();
            firstRowButtonContainer.appendChild(createCleanButton(isCheckedToday));

            const secondRowButtonContainer = document.createElement('div');
            applyStyles(secondRowButtonContainer, { marginTop: '10px', textAlign: 'center' });
            popupBox.appendChild(secondRowButtonContainer);

            getPendings(totalPending => {
                const pendingInfo = document.getElementById('pending-info');
                if (totalPending) pendingInfo.textContent = `Total Pending: ${totalPending}$`;
                else pendingInfo.remove();

                const profitButton = document.createElement('button');
                applyStyles(profitButton, { ...BUTTON_STYLES, backgroundColor: '#2196F3' });
                profitButton.innerText = 'Total InOut';
                profitButton.onmouseover = () => profitButton.style.backgroundColor = '#2f76ae';
                profitButton.onmouseout = () => profitButton.style.backgroundColor = '#2196F3';
                profitButton.addEventListener('click', () => fetchProfit(totalPending, winnings, profitButton, secondRowButtonContainer));
                secondRowButtonContainer.appendChild(profitButton);

                analyzePayments((offerPercentage, totalMoneyFromOffer, totalDeposits, moneyFromOfferPercentage, totalDepositsAmount, depositsWithOffer) => {
                    const offerInfoElement = document.getElementById('offer-info');
                    if (offerInfoElement) {
                        const colorText = (text, condition) => condition ? `<span style="color: red;">${text}</span>` : text;
                        offerInfoElement.innerHTML = `
                        ${colorText(`Deposits With Offer: ${offerPercentage}%`, offerPercentage >= 50)}<br>
                        ${colorText(`Money From Offer: ${moneyFromOfferPercentage}%`, moneyFromOfferPercentage >= 25)}
                    `;
                        offerInfoElement.title = `Кількість депозитів: ${totalDeposits}\nКількість оферів: ${depositsWithOffer}\nСума депозитів: ${totalDepositsAmount}$\nСума entries: ${totalMoneyFromOffer}$`;
                    }

                    analyzeTransaction(totalUSD => {
                        const activityMoneyInfoElement = document.getElementById('activitymoney-info');
                        const activityMoneyPercentage = totalDepositsAmount > 0 ? (totalUSD / totalDepositsAmount) * 100 : 0;
                        if (activityMoneyInfoElement) {
                            const colorText = (text, condition) => condition ? `<span style="color: red;">${text}</span>` : text;
                            activityMoneyInfoElement.innerHTML = colorText(`<b>Activity Money: ${activityMoneyPercentage.toFixed(2)}%</b>`, activityMoneyPercentage >= 50);
                            activityMoneyInfoElement.title = `Activity Money: ${totalUSD}$`;

                            const freeMoneyInfoElement = document.getElementById('freemoney-info');
                            const freeMoneyTotal = activityMoneyPercentage + parseFloat(moneyFromOfferPercentage);
                            const textColor = freeMoneyTotal < 10 ? 'green' : (freeMoneyTotal < 50 ? 'orange' : 'red');
                            freeMoneyInfoElement.innerHTML = `Free Money: ${freeMoneyTotal.toFixed(2)}%`;
                            freeMoneyInfoElement.style.color = textColor;
                            popupBox.style.borderColor = textColor;
                            popupBox.style.animation = `glow 1s infinite alternate`;

                            const style = document.createElement('style');
                            style.textContent = `
                            @keyframes glow {
                                0% { box-shadow: 0 0 5px ${textColor}; }
                                100% { box-shadow: 0 0 25px ${textColor}; }
                            }
                        `;
                            document.head.appendChild(style);

                            getPendingss().then(totalPendings => {
                                addUSACheckButton(TotalPA, moneyFromOfferPercentage, activityMoneyPercentage, totalPendings, entries, winnings);
                            }).catch(error => console.error('Ошибка при получении данных:', error));
                        }
                    });
                });
            });

            document.body.appendChild(popupBox);
        }, 300);
    }

    function analyzePayments(callback) {
        const playerID = getPlayerID();
        const project = getProject();

        if (!project) {
            console.error('Project not found!');
            return;
        }

        const requestUrl = `https://admin.${project}.com/payments/paymentsItemsIn/index/?PaymentsItemsInForm%5Bsearch_login%5D=${playerID}`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: requestUrl,
            onload: function (response) {
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');
                    const formData = new URLSearchParams();
                    formData.append('newPageSize', '10000');

                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: requestUrl,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        data: formData.toString(),
                        onload: function (response) {
                            try {
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(response.responseText, 'text/html');

                                const rows = doc.querySelectorAll('tr.even, tr.odd');
                                let totalDeposits = 0;
                                let totalDepositsAmount = 0;
                                let totalMoneyFromOffer = 0;
                                let depositsWithOffer = 0;

                                rows.forEach(row => {
                                    const status = row.querySelector('td:nth-child(3)')?.textContent.trim();
                                    const depositAmountText = row.querySelector('td:nth-child(5)')?.textContent.trim();
                                    const offerDetailsText = row.querySelector('td:nth-child(7)')?.textContent.trim();

                                    if (status === 'closed') {
                                        totalDeposits++;
                                        const depositAmountMatch = depositAmountText?.match(/([\d.]+) USD/);
                                        const depositAmount = depositAmountMatch ? parseFloat(depositAmountMatch[1]) : 0;

                                        const entriesMatch = offerDetailsText?.match(/(\d+\.?\d*) entries/);
                                        const entriesCount = entriesMatch ? parseFloat(entriesMatch[1]) : 0;

                                        totalDepositsAmount += depositAmount;

                                        if (entriesCount > 0) {
                                            depositsWithOffer++;
                                            totalMoneyFromOffer += entriesCount - depositAmount;
                                        }
                                    }
                                });

                                if (totalDeposits > 0) {
                                    const offerPercentage = (depositsWithOffer / totalDeposits) * 100;
                                    const moneyFromOfferPercentage = (totalMoneyFromOffer / totalDepositsAmount) * 100;

                                    callback(
                                        offerPercentage.toFixed(2),
                                        totalMoneyFromOffer.toFixed(2),
                                        totalDeposits,
                                        moneyFromOfferPercentage.toFixed(2),
                                        totalDepositsAmount.toFixed(2),
                                        depositsWithOffer
                                    );
                                } else {
                                    console.log('No deposits found.');
                                    callback(0, 0, 0, 0, 0, 0);
                                }
                            } catch (error) {
                                console.error('Error processing POST response:', error);
                                callback(0, 0, 0, 0, 0, 0);
                            }
                        },
                        onerror: function () {
                            console.error('POST request failed.');
                            callback(0, 0, 0, 0, 0, 0);
                        },
                    });
                } catch (error) {
                    console.error('Error processing GET response:', error);
                    callback(0, 0, 0, 0, 0, 0);
                }
            },
            onerror: function () {
                console.error('GET request failed.');
                callback(0, 0, 0, 0, 0, 0);
            },
        });
    }


    function analyzeTransaction(callback) {
        const userId = window.location.pathname.split('/')[4];
        const project = getProject();

        const requestUrl = `https://admin.${project}.com/players/playersItems/transactionLog/${userId}`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: requestUrl,
            onload: function(response) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, 'text/html');
                const formData = new FormData();
                formData.append('pageSize', '10000');

                GM_xmlhttpRequest({
                    method: 'POST',
                    url: requestUrl,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: new URLSearchParams(formData).toString(),
                    onload: function(response) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, 'text/html');

                        const rows = doc.querySelectorAll('tbody tr');

                        let totalUSD = 0;

                        rows.forEach((row) => {
                            const secondCell = row.querySelector('td:nth-child(2)');
                            const amountCell = row.querySelector('td:nth-child(3)');
                            const commentCell = row.querySelector('td:nth-child(8)');
                            const secondCellText = secondCell.textContent.trim().toLowerCase();

                            if (secondCell) {
                                if (secondCellText.includes("entries")) {
                                    const entryAmount = parseFloat(amountCell.textContent.trim());
                                    totalUSD += entryAmount;
                                }
                            }

                            if (commentCell) {
                                const commentText = commentCell.textContent.trim();

                                if (commentText.toLowerCase().includes("change balance when exchanging")) {
                                    return;
                                }

                                if (commentText) {
                                    const usdMatch = commentText.match(/(\d+(\.\d+)?)\s*USD/);
                                    if (usdMatch) {
                                        const amount = parseFloat(usdMatch[1]);
                                        totalUSD += amount;
                                    }
                                    if (commentText.toLowerCase().includes("entries") && !secondCellText.includes("entries")) {
                                        const entryAmount = parseFloat(amountCell.textContent.trim());
                                        totalUSD += entryAmount;
                                    }
                                }
                            }
                        });
                        if (callback) {
                            callback(totalUSD.toFixed(2));
                        }
                    }
                });
            }
        });
    }

    function getPendings(callback) {
        const playerID = getPlayerID();
        const project = getProject();
        const baseURL = `https://admin.${project}.com/payments/paymentsItemsOut/index/?PaymentsItemsOutForm%5Bsearch_login%5D=${playerID}`;

        let totalPending = 0;
        console.log(baseURL)

        GM_xmlhttpRequest({
            method: 'GET',
            url: baseURL,
            onload: function(response) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, 'text/html');

                const select = doc.querySelector('#newPageSize');
                if (select) {
                    select.value = '500';
                    const event = new Event('change', { bubbles: true });
                    select.dispatchEvent(event);
                }
                const rows = doc.querySelectorAll('tr');
                rows.forEach(row => {
                    const statusSpan = row.querySelector('span.label');
                    if (statusSpan && (statusSpan.textContent.trim() === 'pending' || statusSpan.textContent.trim() === 'review' || statusSpan.textContent.trim() === 'on_hold')) {
                        const amountCode = row.querySelector('td:nth-child(6) code');
                        if (amountCode) {
                            const amountText = amountCode.textContent.trim().replace('USD', '').trim();
                            const amount = parseFloat(amountText.replace(',', '.'));
                            if (!isNaN(amount)) {
                                totalPending += amount;
                            }
                        }
                    }
                });
                callback(totalPending);
            }
        });
    }

    function getPendingss() {
        return new Promise((resolve, reject) => {
            const playerID = getPlayerID();
            const project = getProject();
            const baseURL = `https://admin.${project}.com/payments/paymentsItemsOut/index/?PaymentsItemsOutForm%5Bsearch_login%5D=${playerID}`;

            let totalPending = 0;

            GM_xmlhttpRequest({
                method: 'GET',
                url: baseURL,
                onload: function(response) {
                    try {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, 'text/html');

                        const select = doc.querySelector('#newPageSize');
                        if (select) {
                            select.value = '500';
                            const event = new Event('change', { bubbles: true });
                            select.dispatchEvent(event);
                        }

                        const rows = doc.querySelectorAll('tr');
                        rows.forEach(row => {
                            const statusSpan = row.querySelector('span.label');
                            if (statusSpan && (statusSpan.textContent.trim() === 'pending' || statusSpan.textContent.trim() === 'review' || statusSpan.textContent.trim() === 'on_hold')) {
                                const amountCode = row.querySelector('td:nth-child(6) code');
                                if (amountCode) {
                                    const amountText = amountCode.textContent.trim().replace('USD', '').trim();
                                    const amount = parseFloat(amountText.replace(',', '.'));
                                    if (!isNaN(amount)) {
                                        totalPending += amount;
                                    }
                                }
                            }
                        });
                        resolve(totalPending);
                    } catch (error) {
                        reject(error);
                    }
                },
                onerror: function() {
                    reject('Error fetching data');
                }
            });
        });
    }

    function getWinnings() {
        const rows = document.querySelectorAll('tr');
        for (const row of rows) {
            if (row.textContent.includes('Winnings')) {
                const cells = row.querySelectorAll('td');
                if (cells.length > 0) {
                    return cells[0].textContent.trim();
                }
            }
        }

        return '0.00';
    }

    function enableFraudButton() {

        const rows = document.querySelectorAll('table.detail-view tbody tr');

        rows.forEach(row => {
            const header = row.querySelector('th');
            if (header && header.textContent.trim() === 'Потенциальный фрод') {
                const td = row.querySelector('td');
                if (td && !td.querySelector('input[type="checkbox"]')) {
                    const fraudButton = document.createElement('button');
                    fraudButton.textContent = 'Fraud';

                    Object.assign(fraudButton.style, {
                        marginLeft: '10px',
                        padding: '6px 12px',
                        backgroundColor: '#ff4d4f',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                    });

                    fraudButton.addEventListener('mouseover', () => {
                        fraudButton.style.backgroundColor = '#ff7875';
                        fraudButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
                        fraudButton.style.transform = 'translateY(-1px)';
                    });

                    fraudButton.addEventListener('mouseout', () => {
                        fraudButton.style.backgroundColor = '#ff4d4f';
                        fraudButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                        fraudButton.style.transform = 'translateY(0)';
                    });

                    fraudButton.addEventListener('click', function() {
                        fetch(`${ProjectUrl}players/playerFeature/suspectedFraud/${userId}/`, {
                            headers: {
                                "accept": "*/*",
                                "accept-language": "uk,ru-RU;q=0.9,ru;q=0.8,en-US;q=0.7,en;q=0.6",
                                "cache-control": "no-cache",
                                "pragma": "no-cache",
                                "priority": "u=1, i",
                                "sec-ch-ua": "\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"",
                                "sec-ch-ua-mobile": "?0",
                                "sec-ch-ua-platform": "\"Windows\"",
                                "sec-fetch-dest": "empty",
                                "sec-fetch-mode": "cors",
                                "sec-fetch-site": "same-origin",
                                "x-requested-with": "XMLHttpRequest"
                            },
                            referrer: window.location.href,
                            referrerPolicy: "strict-origin-when-cross-origin",
                            body: null,
                            method: "GET",
                            mode: "cors",
                            credentials: "include"
                        })
                            .then(response => response.json())
                            .then(data => {
                            window.location.reload();
                        })
                            .catch(error => {
                            console.error('Помилка:', error);
                        });
                    });

                    const span = td.querySelector('span');
                    if (span) {
                        span.insertAdjacentElement('afterend', fraudButton);
                    } else {
                        td.appendChild(fraudButton);
                    }
                }
            }
        });
    }

    function getIPInfo(ip) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `http://ip-api.com/json/${ip}?fields=country,city,isp`,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        if (data.country && data.city && data.isp) {
                            resolve(`${data.country}, ${data.city} (ISP: ${data.isp})`);
                        } else {
                            resolve(`Информация недоступна. Причина: ${data.message || 'неизвестно'}`);
                        }
                    } catch (e) {
                        resolve(`Ошибка парсинга: ${e.message}`);
                    }
                },
                onerror: function(error) {
                    console.log('Ошибка запроса:', error);
                    resolve(`Ошибка запроса: ${error.statusText || 'Неизвестная ошибка'}`);
                }
            });
        });
    }

    function addLocationButton() {
        const rows = document.querySelectorAll('tr td');

        rows.forEach(td => {
            const ipMatch = td.textContent.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
            if (ipMatch) {
                const ip = ipMatch[0];

                const button = document.createElement('button');
                button.textContent = '📍';
                button.type = 'button';
                button.title = 'Показать местоположение';

                Object.assign(button.style, {
                    marginLeft: '8px',
                    padding: '4px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: '#E6E6FA',
                    color: '#fff',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                });

                button.addEventListener('mouseover', () => {
                    button.style.backgroundColor = '#D8BFD8';
                    button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
                });
                button.addEventListener('mouseout', () => {
                    button.style.backgroundColor = '#E6E6FA';
                    button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                });

                button.addEventListener('click', async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const info = await getIPInfo(ip);
                    alert(`IP: ${ip}\n${info}`);
                });

                td.appendChild(button);
            }
        });
    }

    function addMainMenuButtons() {
        const navElement = document.querySelector('div.collapse.navbar-collapse ul.pull-right.nav.navbar-nav');

        if (navElement) {
            const referralItem = document.createElement('li');
            referralItem.innerHTML = `
            <a href="/referrals/referralsStatistics/report">
                <i class="fa fa-users"></i> Реферальна система
            </a>
        `;

            const boostersItem = document.createElement('li');
            boostersItem.innerHTML = `
            <a href="/rankLeague/rankLeaguePlayersBoostersReport/view">
                <i class="fa fa-rocket"></i> Бустери
            </a>
        `;

            navElement.insertBefore(boostersItem, navElement.firstChild);
            navElement.insertBefore(referralItem, navElement.firstChild);

            const offersItem = document.createElement('li');
            if (window.location.href.includes('.com') && !window.location.href.includes('betking')) {
                offersItem.innerHTML = `
                <a href="/cash/promoOffers/index/">
                    <i class="fa fa-gift"></i> Оффери
                </a>
            `;
                navElement.insertBefore(offersItem, navElement.firstChild);
            }
        }
    }

    const checkCardFunction = () => {
        const getPageId = () => GM_getValue('easyPayPageId', null);
        const setPageId = id => GM_setValue('easyPayPageId', id);

        const fetchPageId = callback => {
            console.log('Fetching new PageId...');
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://api.easypay.ua/api/system/createPage',
                headers: { 'PartnerKey': 'easypay-v2', 'locale': 'ua', 'AppId': 'baa6213a-d24d-4ba3-a8ee-51b5f136bbfd', 'content-type': 'application/json' },
                data: '{}',
                onload: r => {
                    const data = JSON.parse(r.responseText);
                    console.log('PageId response:', data);
                    callback(null, setPageId(data.pageId) || getPageId());
                },
                onerror: () => {
                    console.error('PageId fetch failed');
                    callback('PageId error');
                }
            });
        };

        const checkCard = (card, output) => {
            const pageId = getPageId();
            console.log('Checking card:', card, 'PageId:', pageId);

            if (!pageId) {
                console.log('No PageId, fetching new one...');
                return fetchPageId((err, id) => err ? output.textContent = err : checkCard(card, output));
            }

            console.log('Sending card check request...');
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://api.easypay.ua/api/payment/infoCheck',
                headers: {
                    'accept': 'application/json',
                    'appid': 'baa6213a-d24d-4ba3-a8ee-51b5f136bbfd',
                    'content-type': 'application/json; charset=UTF-8',
                    'pageid': pageId,
                    'partnerkey': 'easypay-v2'
                },
                data: JSON.stringify({
                    serviceKey: 'CARDHOLDER-INFO',
                    data: { operation: 'GetCardholderInfo', data: { Pan: card, PanGuid: null, IsFullName: false } }
                }),
                onload: r => {
                    const data = JSON.parse(r.responseText);
                    console.log('Card check response:', data);

                    if (data.error?.errorCode?.includes('PAGE')) {
                        console.log('PageId invalid, refreshing...');
                        return fetchPageId((err, id) => err ? output.textContent = err : checkCard(card, output));
                    }

                    const initials = data.data?.data?.fullname;
                    if (initials) {
                        const date = new Date().toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\./g, '');
                        output.textContent = `${card} ${initials} ${date}`;
                    } else {
                        output.textContent = 'Не знайдено';
                    }
                    console.log('Result displayed:', output.textContent);
                },
                onerror: () => {
                    console.error('Card check request failed');
                    output.textContent = 'Помилка';
                }
            });
        };

        const targetDiv = document.getElementById('formatable-text-common');
        if (targetDiv && !document.getElementById('cardInput')) {
            const parentRow = targetDiv.closest('tr');
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
            <th style="vertical-align: middle;">Пробив картки</th>
            <td>
                <div style="display: flex; gap: 8px; align-items: center; padding: 5px 0;">
                    <div style="position: relative; width: 250px;">
                        <input id="cardInput" placeholder="Номер картки" style="width: 100%; padding: 6px 24px 6px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#4CAF50'" onblur="this.style.borderColor='#ccc'">
                        <span id="clearInput" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); cursor: pointer; font-size: 14px; color: #666; display: none;">✕</span>
                    </div>
                    <button id="checkBtn" style="padding: 6px 12px; background: linear-gradient(45deg, #4CAF50, #45a049); color: white; border: none; border-radius: 4px; font-size: 14px; cursor: pointer; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Пробити</button>
                </div>
                <div id="cardResult" style="margin-top: 5px; font-size: 14px; color: #333; cursor: pointer; user-select: all;" title="Клік для копіювання"></div>
            </td>`;

            parentRow.parentNode.insertBefore(newRow, parentRow);

            const input = document.getElementById('cardInput');
            const clearBtn = document.getElementById('clearInput');
            const btn = document.getElementById('checkBtn');
            const result = document.getElementById('cardResult');

            input.addEventListener('input', () => {
                clearBtn.style.display = input.value ? 'block' : 'none';
            });

            clearBtn.addEventListener('click', () => {
                input.value = '';
                clearBtn.style.display = 'none';
                result.textContent = '';
                input.focus();
            });

            btn.onclick = e => {
                e.preventDefault();
                const card = input.value.trim();
                if (!card) return result.textContent = 'Введи номер!';
                result.textContent = 'Перевіряю...';
                console.log('Button clicked, starting check...');
                checkCard(card, result);
            };

            result.onclick = () => {
                if (result.textContent && !result.textContent.includes('Перевіряю') && !result.textContent.includes('Помилка')) {
                    navigator.clipboard.writeText(result.textContent);
                    result.style.color = '#4CAF50';
                    setTimeout(() => result.style.color = '#333', 500);
                    console.log('Result copied to clipboard');
                }
            };
        }
    };

    function updateCardMasksFromComments() {
        const extractCardNumbers = (text) => {
            // Очищаем текст от HTML и лишних пробелов
            const cleanText = text
            .replace(/<[^>]+>/g, ' ') // Удаляем HTML-теги
            .replace(/\s+/g, ' ')     // Заменяем множественные пробелы на один
            .trim();                  // Удаляем пробелы в начале и конце
            const cardRegex = /\b\d{16}\b/g;
            const matches = cleanText.match(cardRegex) || [];
            return matches;
        };

        const matchMaskWithCard = (mask, card) => {
            const [firstPart, lastPart] = mask.split('|');
            return card.startsWith(firstPart) && card.endsWith(lastPart);
        };

        const commentDiv = document.getElementById('gateway-method-description-visible-common');
        if (!commentDiv) {
            console.log('Comment div not found');
            return;
        }

        const commentText = commentDiv.innerHTML; // Берем innerHTML вместо textContent
        const cardNumbers = extractCardNumbers(commentText);
        console.log('Found cards in comment:', cardNumbers);

        const masksTable = document.querySelector('#payments-cards-masks-grid tbody');
        if (!masksTable) {
            console.log('Masks table not found');
            return;
        }

        const rows = masksTable.getElementsByTagName('tr');
        console.log('Processing', rows.length, 'rows in masks table');

        for (let row of rows) {
            const maskCell = row.cells[1];
            const maskElement = maskCell.querySelector('strong');
            const originalMask = maskElement ? maskElement.textContent : maskCell.textContent;
            console.log('Processing mask:', originalMask);

            for (let card of cardNumbers) {
                if (matchMaskWithCard(originalMask, card)) {
                    console.log('Match found:', originalMask, '->', card);

                    const fullCardSpan = document.createElement('span');
                    fullCardSpan.textContent = card;
                    fullCardSpan.style.cursor = 'pointer';
                    fullCardSpan.style.fontWeight = 'bold';
                    fullCardSpan.title = 'Копіювати';

                    const copiedMessage = document.createElement('span');
                    copiedMessage.textContent = ' Скопійовано!';
                    copiedMessage.style.color = 'green';
                    copiedMessage.style.marginLeft = '8px';
                    copiedMessage.style.fontWeight = 'normal';
                    copiedMessage.style.display = 'none';

                    fullCardSpan.onclick = () => {
                        navigator.clipboard.writeText(card).then(() => {
                            fullCardSpan.style.color = '#6699cc';
                            copiedMessage.style.display = 'inline';
                            setTimeout(() => {
                                fullCardSpan.style.color = '';
                                copiedMessage.style.display = 'none';
                            }, 1000);
                        });
                    };

                    maskCell.innerHTML = '';
                    maskCell.appendChild(fullCardSpan);
                    maskCell.appendChild(copiedMessage);
                    break;
                }
            }

        }
    }

    document.addEventListener('click', (event) => {
        const header = event.target.closest(`#players-documents_c6`);

        if (header) {
            header.style.cursor = 'pointer';

            const documentLinks = document.querySelectorAll('td a.btn.modalPreview[href]');
            documentLinks.forEach(link => {
                if (link.href) {
                    window.open(link.href, '_blank');
                }
            });
        }
    });

    document.addEventListener('click', (event) => {
        const button = event.target.closest('.get-person-accounts-button');

        if (button) {
            setTimeout(() => {
                const resultDiv = document.getElementById('result');
                if (resultDiv && resultDiv.style.display !== 'none') {
                    const links = resultDiv.querySelectorAll('.person-account__login a');
                    links.forEach(link => {
                        let href = link.getAttribute('href');
                        if (href && href.includes('/players/playersItems/index/?Players[login]=')) {
                            const playerId = href.split('/players/playersItems/index/?Players[login]=')[1];
                            const domain = href.split('/players/')[0];
                            const newHref = `${domain}/players/playersItems/search?PlayersSearchForm[number]=${playerId}`;
                            link.setAttribute('href', newHref);
                            console.log(`Ссылка изменена: ${href} -> ${newHref}`); // Для отладки
                        }
                    });
                }
            }, 500);
        }
    });

    window.addEventListener('load', async function() {
        addLocationButton();
        addMainMenuButtons();
        const tokenIsValid = await checkToken();
        const currentHost = window.location.hostname;
        if (tokenIsValid) {
            sendActivePageInfo();
            if (currentHost.includes('wildwinz') && currentUrl.includes('paymentsItemsOut/index')) {
                calculatePendingAmountWildWinz();
            }
            else if (currentHost.endsWith('.com') && currentUrl.includes('paymentsItemsOut/index')) {
                calculatePendingAmountUSA();
            }
            else if (currentHost.endsWith('.ua') && currentUrl.includes('paymentsItemsOut/index')) {
                calculatePendingAmount();
                setPageSize1k();
                checkForUpdates();
            } else if (currentHost.endsWith('.ua') && currentUrl.includes('players/playersItems/update')) {
                addForeignButton();
                enableFraudButton();
                buttonToSave();
                checkUserInFraudList();
                updateBanButton();
                checkForUpdates();
                document.addEventListener('keydown', handleShortcut);
                handlePopup();
                createCheckIPButton();
                checkAutoPayment();
                checkBonusButton();
                goToGoogleSheet();
                addAgeToBirthdate();
                addPibRow();
                checkCardFunction();
                setupModalHandler();
                sendPlayerSeenInfo();
                const isFullNumberCardsEnabled = GM_getValue(fullNumberCardDisplayKey, true);
                if (isFullNumberCardsEnabled) {
                    updateCardMasksFromComments();
                }
                const isFastPaintCardsEnabled = GM_getValue(fastPaintCardsDisplayKey, true);
                if (isFastPaintCardsEnabled) {
                    changeCardStatus();
                    new MutationObserver(() => {
                        changeCardStatus();
                    }).observe(document.querySelector('#payments-cards-masks-parent'), { childList: true, subtree: true });
                }
                await activeUrlsManagers();
                await checkUnreadTlComments(await getManagerID(token))
            } else if (currentHost.includes('wildwinz') && currentUrl.includes('players/playersItems/update')) {
                handlePopupWildWinz();
                addForeignButton();
                buttonToSave();
                checkUserInFraudList();
                await activeUrlsManagers();
                updateBanButton();
                checkForUpdates();
                sendPlayerSeenInfo();
            } else if (currentHost.endsWith('.com') && currentUrl.includes('players/playersItems/update')) {
                createUSAPopupBox();
                analyzeTransaction();
                buttonToSave();
                disablePromoOffersUSA();
                checkUserInFraudList();
                addPibRow();
                sendPlayerSeenInfo();
                checkForUpdates();
                await activeUrlsManagers();
            } else if (currentHost.endsWith('.com') && currentUrl.includes('playersItems/balanceLog/')) {
                setPageSize1k()
            } else if (currentUrl.includes('88beef36-f0a8-476f-a977-a885afe5d23f') ||currentUrl.includes('c1265a12-4ff3-4b1a-a893-2fa9e9d6a205') || currentUrl.includes('92548677-d140-49c4-b5e5-9015673f461a') || currentUrl.includes('3fe70d7e-65c7-4736-a707-6f40d3de125b') || currentUrl.includes('b301aace-d9bb-4c7e-8efc-5d97782ab294') || currentUrl.includes('72c0a614-e695-4cb9-b884-465b04cfb2c5') || currentUrl.includes('6705e06d-cf36-47e5-ace3-0400e15b2ce2')) {
                powerBIfetchHighlightedValues();
                checkForUpdates();
                powerBImakeCellsClickable();
                new MutationObserver(() => {
                    powerBIfetchHighlightedValues();
                    powerBImakeCellsClickable();
                }).observe(document.body, { childList: true, subtree: true });
            }
            else if (currentHost.endsWith('.ua') &&currentUrl.includes('playersItems/balanceLog/')) {
                createFloatingButton(buttonImageUrl);
            } else if (currentUrl.includes('payments/paymentsItemsIn/index/?PaymentsItemsInForm%5Bsearch_login%5D')) {
                depositCardChecker();
                observeDOMChanges(depositCardChecker);
            } else if (currentUrl.includes('playersItems/transactionLog/')) {
                initTransactionsPage();
                processTableRows();
                observeDOMChanges(processTableRows);
                makeBonusClickable();
            }
        } else {
            console.log('User is not logged in or token is invalid');
            GM_deleteValue('authToken');
            createLoginForm();
        }
    });
})();
