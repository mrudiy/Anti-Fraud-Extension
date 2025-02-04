// ==UserScript==
// @name         Anti-Fraud Extension
// @namespace    http://tampermonkey.net/
// @version      5.8.1
// @description  Расширение для удобства АнтиФрод команды
// @author       Maxim Rudiy
// @match        https://admin.betking.com.ua/*
// @match        https://admin.vegas.ua/*
// @match        https://admin.777.ua/*
// @match        https://admin.funrize.com/*
// @match        https://admin.nolimitcoins.com/*
// @match        https://admin.taofortune.com/*
// @match        https://admin.funzcity.com/*
// @match        https://admin.wildwinz.com/*
// @match        https://admin.fortunewheelz.com/*
// @match        https://app.powerbi.com/*
// @updateURL 	 https://github.com/mrudiy/Anti-Fraud-Extension/raw/main/Anti-Fraud%20Extension.user.js
// @downloadURL  https://github.com/mrudiy/Anti-Fraud-Extension/raw/main/Anti-Fraud%20Extension.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      admin.777.ua
// @connect      admin.vegas.ua
// @connect      admin.betking.com.ua
// @connect      admin.wildwinz.com
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jsrsasign/10.5.17/jsrsasign-all-min.js
// @require      https://cdn.jsdelivr.net/npm/moment/moment.min.js
// @require      https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.7.1/sweetalert2.all.min.js
// @resource     SWEETALERT2_CSS https://cdnjs.cloudflare.com/ajax/libs/sweetalert2/11.7.1/sweetalert2.min.css
// ==/UserScript==

(function() {
    'use strict';

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
    const kingSheet = 'KING Лютий🐧';
    const sevensSheet = 'SEVENS🎰';
    const vegasSheet = 'VEGAS🎬';
    const currencySymbols = new Map([
        ['UAH', '₴'],
        ['CAD', '$'],
        ['EUR', '€']
    ]);
    const currentVersion = "5.8.1";

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
        row.style.backgroundColor = color;
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
        const rows = document.querySelectorAll('tr');
        rows.forEach(row => {
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
        });
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



    function addCheckButton(TotalPA, Balance, totalPending) {
        const formatableTextDiv = document.getElementById('formatable-text-antifraud_manager');

        if (formatableTextDiv) {
            const existingButton = document.getElementById('check-button');
            if (existingButton) {
                existingButton.remove();
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

                } else {
                    if (Balance > 1000) {
                        const balanceStyle = Balance > 1000000 ? 'color: red;' : '';
                        textToInsert += `<b>На балансе:</b> <b style="${balanceStyle}">${formattedBalance}${currencySymbol}</b> | `;
                    }

                    if (totalPending > 1000) {
                        const pendingStyle = totalPending > 1000000 ? 'color: red;' : '';
                        textToInsert += `<b>На выплате:</b> <b style="${pendingStyle}">${formattedTotalPending}${currencySymbol} </b>| `;
                    }
                }

                insertTextIntoField(textToInsert);
            };

            formatableTextDiv.insertBefore(checkButton, formatableTextDiv.firstChild);
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
                    }
                };
            }
        }
    }

    async function checkUserInFraudList() {
        const token = localStorage.getItem('authToken');
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

                const table = document.querySelector('#yw1');

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

    async function checkUserInChecklist() {
        const token = localStorage.getItem('authToken');
        const playerId = getPlayerID();
        const url = window.location.href;

        function parseDateFromISO(dateString) {
            const [year, month, day] = dateString.split('-');
            return new Date(year, month - 1, day);
        }

        function parseDateFromCustom(dateString) {
            const [day, month, year] = dateString.split('.');
            return new Date(year, month - 1, day);
        }

        function parseDate(dateString) {
            if (!dateString || typeof dateString !== 'string') {
                return null;
            }

            if (dateString.includes('-')) {
                return parseDateFromISO(dateString);
            } else if (dateString.includes('.')) {
                return parseDateFromCustom(dateString);
            } else {
                return null;
            }
        }

        try {
            const response = await fetch('https://vps65001.hyperhost.name/api/check_user_in_checklsit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ player_id: playerId, url: url })
            });

            const data = await response.json();
            console.log(data);
            console.log(data.date);

            const dataDate = parseDate(data.date);
            const dateFromField = parseDate(getDateFromField());
            const currentDate = parseDate(getCurrentDate());

            const isDataDateValid = dataDate !== null;
            const isDateFromFieldValid = dateFromField !== null;
            const isCurrentDateValid = currentDate !== null;

            const isCheckedToday = (isDataDateValid && currentDate && dataDate.getTime() === currentDate.getTime()) ||
                  (isDateFromFieldValid && currentDate && dateFromField.getTime() === currentDate.getTime());

            const observer = new MutationObserver((mutations, obs) => {
                const cleanButton = document.querySelector('.clean-button');
                if (cleanButton) {
                    updateCleanButtonState(cleanButton, isCheckedToday);
                    obs.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            console.log(dataDate, dateFromField, currentDate);

            if (
                (data.checklistExists && isDateFromFieldValid && isDataDateValid && dateFromField <= dataDate) ||
                (data.checklistExists && isCheckedToday && isDataDateValid && currentDate <= dataDate)
            ) {
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-warning';
                alertDiv.style.backgroundColor = '#7fff00';
                alertDiv.style.color = '#000000';
                alertDiv.style.borderColor = '#5a00a2';

                alertDiv.innerHTML =
                    `<strong>Користувач переглянутий.</strong>
            <br><strong>Менеджер:</strong> ${data.manager_name}
            <br><strong>Дата перегляду:</strong> ${data.date} в ${data.time}`;

                const table = document.querySelector('#yw1');

                if (table) {
                    table.parentNode.insertBefore(alertDiv, table);
                } else {
                    console.error('Таблиця не знайдена.');
                }
            }

        } catch (error) {
            console.error('Error:', error);
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
                const token = localStorage.getItem('authToken');

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
                <th><i class="fa fa-chrome" title='Остання вкладка'></i></th>
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
        const token = localStorage.getItem('authToken');
        const today = getCurrentDateRequest();

        try {
            const response = await fetch('https://vps65001.hyperhost.name/api/users', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const users = await response.json();

            const userStatsPromises = users.map(async user => {
                const statsResponse = await fetch(`https://vps65001.hyperhost.name/api/get_statistics/${user.id}?date=${today}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const stats = await statsResponse.json();
                return { ...user, processedToday: stats.total_players || 0 };
            });

            const usersWithStats = await Promise.all(userStatsPromises);

            usersWithStats.sort((a, b) => b.processedToday - a.processedToday);

            const usersList = document.getElementById('users-list');
            usersList.innerHTML = '';

            usersWithStats.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                <td>${user.manager_name}</td>
                <td>${user.status}</td>
                <td>${user.processedToday}</td>
                 <td>
                 ${user.active_url ? `<a href="${user.active_url}" target="_blank">Link</a>` : 'Не відомо'}
                </td>
                <td class="actions">
                    <i class="fa fa-bar-chart get-statistics" title="Статистика"></i>
                    <i class="fa fa-key change-password" title="Скинути пароль"></i>
                    <i class="fa fa-trash delete-user" title="Видалити користувача"></i>
                </td>
            `;
                usersList.appendChild(row);

                row.querySelector('.get-statistics').addEventListener('click', () => getStatistics(user.id));
                row.querySelector('.change-password').addEventListener('click', () => changePassword(user.id));
                row.querySelector('.delete-user').addEventListener('click', () => deleteUser(user.id));
            });
        } catch (error) {
            console.error('Error:', error);
        }
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
        const token = localStorage.getItem('authToken');

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
        const token = localStorage.getItem('authToken');

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

        // Додати стилі безпосередньо в документ
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
        const token = localStorage.getItem('authToken');

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
                    willClose: () => {
                        window.location.reload(); // Перезагрузка страницы
                    }
                });
                loadFrauds(); // Вызываем функцию загрузки фродов
            } else {
                alert('Виникла помилка!.');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function deleteFraud(fraudId) {
        const token = localStorage.getItem('authToken');

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
                    willClose: () => {
                        window.location.reload();
                    }
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
            const response = await fetch('https://vps65001.hyperhost.name/api/register', {
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
.change-password { background-color: #ffc107; }
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
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch(`https://vps65001.hyperhost.name/api/delete_user/${userId}`, {
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
        const token = localStorage.getItem('authToken');

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


    async function getStatistics(userId) {
        const token = localStorage.getItem('authToken');
        const today = getCurrentDateRequest();

        await fetchStatistics(userId, today);
    }

    async function fetchStatistics(userId, selectedDate) {
        const token = localStorage.getItem('authToken');

        try {
            const response = await fetch(`https://vps65001.hyperhost.name/api/get_statistics/${userId}?date=${selectedDate}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (response.ok) {
                const content = `
                <style>
                    #updateButton {
                        background-color: #6a5acd; /* Зеленый цвет фона */
                        color: white; /* Белый текст */
                        padding: 10px 20px; /* Внутренние отступы */
                        border: none; /* Убираем стандартную рамку */
                        border-radius: 5px; /* Закругленные углы */
                        cursor: pointer; /* Изменение курсора при наведении */
                        font-size: 16px; /* Размер текста */
                    }

                    #updateButton:hover {
                        background-color: #5244a8; /* Изменение цвета при наведении */
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse; /* Убираем промежутки между ячейками */
                    }

                    th, td {
                        border: 1px solid #ddd; /* Добавляем границы */
                        padding: 8px; /* Внутренние отступы */
                    }
                </style>

                <label for="datePicker">Оберіть дату:</label>
                <input type="date" id="datePicker" value="${selectedDate}" />
                <button id="updateButton">Оновити</button>

                <p>Кількість всіх гравців: ${data.total_players}</p>
                <p>Кількість Betking: ${data.betking_count}</p>
                <p>Кількість 777: ${data.seven_count}</p>
                <p>Кількість Vegas: ${data.vegas_count}</p>

                <div style="max-height: 500px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;">  <!-- Контейнер с прокруткой -->
                    <table>
                        <thead>
                            <tr>
                                <th>ID Гравця</th>
                                <th>Проект</th>
                                <th>Авто</th>
                                <th>Коментар</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.entries.map(entry => `
                                <tr>
                                    <td><a href="${entry.url}" target="_blank">${entry.player_id}</a></td>
                                    <td>${entry.project}</td>
                                        <td>
        ${entry.autopayment === false ?
                                               '<span style="color: green;">&#10004;</span>' :
                                               '<span style="color: red;">&#10008;</span>'}
    </td>
                                    <td>${entry.comment || ''}</td>
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
                    createPopup('statistics-popup', 'Статистика менеджера', content, () => {
                        document.getElementById('updateButton').addEventListener('click', () => updateStatistics(userId));
                    });
                }

                document.getElementById('updateButton').addEventListener('click', () => updateStatistics(userId));
            } else {
                alert('Помилка: ' + data.error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }


    function updateStatistics(userId) {
        const selectedDate = document.getElementById('datePicker').value;
        fetchStatistics(userId, selectedDate);
    }

    function createStatisticPopup() {
        const token = localStorage.getItem('authToken');
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
        const token = localStorage.getItem('authToken');

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


    function getInnerBalanceValue() {
        const input = document.querySelector('input[data-field="inner_balance"]');
        let innerBalance = 0;

        if (input) {
            const value = input.value;
            innerBalance = parseFloat(value) || 0;
        }

        const holdAmounts = document.querySelectorAll('.hold-amount > span.hold-amount');
        let totalHoldAmount = 0;

        holdAmounts.forEach(hold => {
            const match = hold.textContent.trim().match(/^([\d.]+)/);
            if (match) {
                totalHoldAmount += parseFloat(match[1]) || 0;
            }
        });

        return innerBalance + totalHoldAmount;
    }


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
            const pattern = /Автовиплати відключено антифрод командою .*?\d{2}:\d{2}/;
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



    async function createPopupBox(MonthPA, TotalPA, Balance, NDFL, totalPending, cards) {
        if (popupBox) {
            return;
        }

        const currentUrl = window.location.href;
        const checkbox = document.getElementById('Players_enabled_autopayouts');
        const borderColor = TotalPA < 0.75 ? 'green' : (TotalPA < 1 ? 'orange' : 'red');

        popupBox = document.createElement('div');
        popupBox.style.position = 'fixed';
        popupBox.style.top = '20px';
        popupBox.style.right = '';

        const popupWidth = 270;
        popupBox.style.left = `calc(100% - ${popupWidth + 20}px)`;
        popupBox.style.width = `${popupWidth}px`;

        popupBox.style.padding = '20px';
        popupBox.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        popupBox.style.border = `2px solid ${borderColor}`; 
        popupBox.style.boxShadow = `0px 4px 12px rgba(0, 0, 0, 0.1)`;
        popupBox.style.zIndex = '10000';
        popupBox.style.fontFamily = '"Roboto", sans-serif';
        popupBox.style.fontSize = '16px';
        popupBox.style.display = 'flex';
        popupBox.style.flexDirection = 'column';
        popupBox.style.alignItems = 'center';
        popupBox.style.borderRadius = '10px';
        popupBox.style.animation = 'glow 1s infinite alternate';
        popupBox.style.resize = 'both';
        popupBox.style.overflow = 'auto';

        const showNDFL = GM_getValue(ndfDisplayKey, true);
        const showAmount = GM_getValue(amountDisplayKey, true);
        const formattedBalance = formatAmount(Balance);
        const formattedNDFL = formatAmount(NDFL);
        const formattedTotalPending = formatAmount(totalPending);


        const dragHandle = document.createElement('div');
        dragHandle.style.position = 'absolute';
        dragHandle.style.top = '0';
        dragHandle.style.left = '0';
        dragHandle.style.width = '100%';
        dragHandle.style.height = '20px';
        dragHandle.style.cursor = 'move';
        popupBox.appendChild(dragHandle);

        let isDragging = false;
        let offsetX, offsetY;

        dragHandle.addEventListener('mousedown', function (e) {
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
        const provider = await verificationProvider();
        const maintext = document.createElement('div');
        const currency = getCurrency();
        let currencySymbol = currencySymbols.get(currency) || '';
        maintext.className = 'popup-main-text';
        maintext.innerHTML = `
    ${showAmount ? `<center><b>Баланс: ${formattedBalance}${currencySymbol}</b></center>` : `<center><b>Баланс: ${Balance}${currencySymbol}</b></center>`}
    ${showNDFL && NDFL !== 0 ? (showAmount ? `<center><b>НДФЛ: ${formattedNDFL}${currencySymbol}</b></center>` : `<center><b>НДФЛ: ${NDFL}${currencySymbol}</b></center>`) : ''}
    <center><b>
        Month: <span style="color: ${MonthPA < 0.75 ? 'green' : (MonthPA < 1 ? 'orange' : 'red')}">${MonthPA}</span> |
        Total: <span style="color: ${TotalPA < 0.75 ? 'green' : (TotalPA < 1 ? 'orange' : 'red')}">${TotalPA}</span>
    </b></center>
    ${totalPending > 0 ? (showAmount ? `<center><b>На виплаті: ${formattedTotalPending}${currencySymbol}</b></center>` : `<center><b>На виплаті: ${totalPending}${currencySymbol}</b></center>`) : ''}    ${cards.length > 0 ? `
        <center><b>Картки для верифікації:</b><br>
        ${cards.map(card => `
            <div style="display: inline-block; margin-top: 5px;">
                ${card}
                <button onclick="navigator.clipboard.writeText('${card.replace(/'/g, "\\'")}')"
                        style="border: none; background: none; cursor: pointer; margin-left: 5px;">
                    <span class="fa fa-files-o"></span>
                </button>
            </div>
        `).join('<br>')}
        </center>` : ''}
`;
        if (provider === 'Kycaid' || provider === 'SumSub') {
            maintext.innerHTML += `
            <center>
                <span style="color: red; font-weight: bold;">
                  Верифікація: ${provider}
                </span>
            </center>`;
        }

        popupBox.appendChild(maintext);

        const text = document.createElement('div');
        text.className = 'popup-text';
        text.innerHTML = ``;

        popupBox.appendChild(text);

        const settingsIcon = document.createElement('div');
        settingsIcon.innerHTML = '<i class="fa fa-cog"></i>';
        settingsIcon.style.position = 'absolute';
        settingsIcon.style.top = '10px';
        settingsIcon.style.right = '10px';
        settingsIcon.style.cursor = 'pointer';
        settingsIcon.style.fontSize = '20px';
        settingsIcon.title = 'Налаштування';
        settingsIcon.onclick = () => {
            createSettingsPopup();
        };
        popupBox.appendChild(settingsIcon);

        const statisticIcon = document.createElement('div');
        statisticIcon.innerHTML = '<i class="fa fa-signal"></i>';
        statisticIcon.style.position = 'absolute';
        statisticIcon.style.top = '35px';
        statisticIcon.style.right = '10px';
        statisticIcon.style.cursor = 'pointer';
        statisticIcon.style.fontSize = '20px';
        statisticIcon.title = 'Статистика';
        statisticIcon.onclick = () => {
            createStatisticPopup();
        };
        popupBox.appendChild(statisticIcon);

        const status = await checkUserStatus();

        if (status === 'Admin') {
            const adminIcon = document.createElement('div');
            adminIcon.innerHTML = '<i class="fa fa-users"></i>';
            adminIcon.style.position = 'absolute';
            adminIcon.style.top = '70px';
            adminIcon.style.right = '10px';
            adminIcon.style.cursor = 'pointer';
            adminIcon.style.fontSize = '18px';
            adminIcon.title = 'Користувачі';
            adminIcon.onclick = () => {
                if (document.getElementById('admin-popup')) {
                    return;
                }
                createAdminPopup();
            };
            popupBox.appendChild(adminIcon);
        }

        const showAutopayments = GM_getValue(autoPaymentsDisplayKey, true);

        const statusIcon = document.createElement('div');
        statusIcon.style.position = 'absolute';
        statusIcon.style.top = '10px';
        statusIcon.style.left = '10px';
        statusIcon.style.fontSize = '20px';
        statusIcon.style.cursor = 'pointer';
        statusIcon.title = 'Автовиплата';
        statusIcon.innerHTML = checkbox && checkbox.checked
            ? '<i class="fa fa-check-circle" style="color: green;"></i>'
        : '<i class="fa fa-times-circle" style="color: red;"></i>';

        if (!showAutopayments) {
            statusIcon.style.pointerEvents = 'none';
        } else {
            statusIcon.onclick = () => {
                checkbox.click();

                setTimeout(() => {
                    const confirmButton = document.querySelector('.swal2-confirm');
                    if (confirmButton) {
                        confirmButton.click();
                    }

                    setTimeout(() => {
                        statusIcon.innerHTML = checkbox.checked
                            ? '<i class="fa fa-check-circle" style="color: green;"></i>'
                        : '<i class="fa fa-times-circle" style="color: red;"></i>';
                    }, 200);
                }, 200);
            };
        }

        popupBox.appendChild(statusIcon);


        const fraudIcon = document.createElement('div');
        fraudIcon.style.position = 'absolute';
        fraudIcon.style.top = '40px';
        fraudIcon.style.left = '10px';
        fraudIcon.style.fontSize = '20px';
        fraudIcon.style.cursor = 'pointer';
        fraudIcon.title = 'Нагляд';
        fraudIcon.innerHTML = '<i class="fa fa-eye"></i>';

        fraudIcon.onclick = () => {
            createFraudPopup();
        };
        popupBox.appendChild(fraudIcon);

        const showReminder = GM_getValue(reminderDisplayKey, true);
        const shouldBlink = GM_getValue(reminderBlinkKey, true);
        const hasNewArticles = await checkForNewArticles();

        if (showReminder === true) {
            const reminderIcon = document.createElement('div');
            reminderIcon.style.position = 'absolute';
            reminderIcon.style.top = '70px';
            reminderIcon.style.left = '10px';
            reminderIcon.style.fontSize = '20px';
            reminderIcon.style.cursor = 'pointer';
            reminderIcon.title = 'Памятка';
            reminderIcon.innerHTML = '<i class="fa fa-book"></i>';

            if (hasNewArticles || shouldBlink) {
                reminderIcon.classList.add('blinking');
            }

            reminderIcon.onclick = () => {
                createReminderPopup();
                reminderIcon.classList.remove('blinking');
                GM_setValue(reminderBlinkKey, false);
            };

            popupBox.appendChild(reminderIcon);
        }

        const buttonStyle = `
    font-family: Arial, sans-serif;
    font-size: 15px;
    font-weight: bold;
    color: white;
    padding: 10px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
`;



        const firstRowButtonContainer = document.createElement('div');
        firstRowButtonContainer.style.marginTop = '10px';
        firstRowButtonContainer.style.display = 'flex';
        firstRowButtonContainer.style.gap = '10px';

        const cleanButton = document.createElement('button');
        cleanButton.className = 'clean-button';
        cleanButton.innerText = 'Checked';
        cleanButton.style.cssText = buttonStyle;
        cleanButton.style.backgroundColor = '#28a745';

        cleanButton.addEventListener('click', () => {
            if (cleanButton.disabled) return;

            const initials = GM_getValue(initialsKey, '');
            const currentDate = getCurrentDate();
            const playerID = getPlayerID();
            const project = getProject();
            const url = window.location.href;
            const time = getCurrentTime();

            const dataToInsert = {
                date: currentDate,
                url: url,
                project: project,
                playerID: playerID,
                initials: initials,
                comment: `Переглянутий в ${time}`,
            };

            const token = localStorage.getItem('authToken');

            sendDataToServer(dataToInsert, token)
                .then(response => {
                console.log('Data sent successfully:', response);
                Swal.fire({
                    icon: 'success',
                    title: 'Успішно!',
                    text: 'Користувач позначений як переглянутий',
                    confirmButtonText: 'ОК'
                }).then((result) => {
                    if (result.isConfirmed) {
                        location.reload();
                    }
                });
            })
                .catch(err => {
                console.error('Error sending data:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Помилка!',
                    text: 'Не вдалося надіслати дані.',
                    confirmButtonText: 'ОК'
                });
            });
        });

        firstRowButtonContainer.appendChild(cleanButton);

        const foreignButton = document.createElement('button');
        foreignButton.innerText = 'Чужа';
        foreignButton.style.cssText = buttonStyle;
        foreignButton.style.backgroundColor = '#dc3545';
        foreignButton.onmouseover = () => foreignButton.style.backgroundColor = '#c82333';
        foreignButton.onmouseout = () => foreignButton.style.backgroundColor = '#dc3545';
        foreignButton.addEventListener('click', () => {
            const date = getCurrentDate();
            const time = getCurrentTime();
            const initials = GM_getValue(initialsKey, '');
            const currentLanguage = GM_getValue(languageKey, 'російська');

            let textToInsert;
            const formattedBalance = formatAmount(Balance);
            const formattedTotalPending = formatAmount(totalPending);
            const colorPA = TotalPA < 0.75 ? 'green' : (TotalPA >= 0.75 && TotalPA < 1 ? 'orange' : 'red');

            if (currentLanguage === 'російська') {
                textToInsert = `${date} в ${time} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | `;
                if (Balance > 1000) {
                    const balanceStyle = Balance > 1000000 ? 'color: red;' : '';
                    textToInsert += `<b>На балансе:</b> <b style="${balanceStyle}">${formattedBalance}${currencySymbol}</b> | `;
                }

                if (totalPending > 1) {
                    const pendingStyle = totalPending > 1000000 ? 'color: red;' : '';
                    textToInsert += `<b>На выплате:</b> <b style="${pendingStyle}">${formattedTotalPending}${currencySymbol} </b>| `
                }
                textToInsert += `играет <b><font color="#ff0000">чужими</font></b> картами, <b>авто отключаем</b>`
            }
            else if (currentLanguage === 'українська') {
                textToInsert = `${date} в ${time} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | `;
                if (Balance > 1000) {
                    const balanceStyle = Balance > 1000000 ? 'color: red;' : '';
                    textToInsert += `<b>На балансі:</b> <b style="${balanceStyle}">${formattedBalance}${currencySymbol}</b> | `;
                }

                if (totalPending > 1) {
                    const pendingStyle = totalPending > 1000000 ? 'color: red;' : '';
                    textToInsert += `<b>На виплаті:</b> <b style="${pendingStyle}">${formattedTotalPending}${currencySymbol} </b>| `
                }
                textToInsert += `грає <b><font color="#ff0000">чужими</font></b> картками, <b>авто відключаємо</b>`
            }
            insertTextIntoField(textToInsert);
        });
        popupBox.appendChild(firstRowButtonContainer);

        const secondRowButtonContainer = document.createElement('div');
        secondRowButtonContainer.style.marginTop = '10px';
        secondRowButtonContainer.style.display = 'flex';
        secondRowButtonContainer.style.gap = '10px';

        const showPendingsButton = GM_getValue(pendingButtonsDisplayKey, true);

        const pendingPlusButton = document.createElement('button');
        pendingPlusButton.innerText = 'Pending (+)';
        pendingPlusButton.style.cssText = buttonStyle;
        pendingPlusButton.style.backgroundColor = '#28a745';
        pendingPlusButton.onmouseover = () => pendingPlusButton.style.backgroundColor = '#218838';
        pendingPlusButton.onmouseout = () => pendingPlusButton.style.backgroundColor = '#28a745';
        pendingPlusButton.addEventListener('click', () => {
            const date = getCurrentDate();
            const time = getCurrentTime();
            const initials = GM_getValue(initialsKey, '');
            const currentLanguage = GM_getValue(languageKey, 'російська');

            let textToInsert;
            const colorPA = TotalPA < 0.75 ? 'green' : (TotalPA >= 0.75 && TotalPA < 1 ? 'orange' : 'red');

            if (currentLanguage === 'російська') {
                textToInsert = `${date} в ${time} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | играет <b><font color="#14b814">своими</font></b> картами, чист, много безуспешных попыток депозита своей картой // Без угроз, потом деп прошел`;
            } else if (currentLanguage === 'українська') {
                textToInsert = `${date} в ${time} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | грає <b><font color="#14b814">власними</font></b> картками, чистий, багато безуспішних спроб депозиту своєю карткою, потім деп пройшов`;
            } else {
                textToInsert = `${date} в ${time} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | играет <b><font color="#14b814">своими</font></b> картами, чист, много безуспешных попыток депозита своей картой // Без угроз, потом деп прошел`;
            }

            insertTextIntoField(textToInsert);
        });
        secondRowButtonContainer.appendChild(pendingPlusButton);

        const pendingMinusButton = document.createElement('button');
        pendingMinusButton.innerText = 'Pending (-)';
        pendingMinusButton.style.cssText = buttonStyle;
        pendingMinusButton.style.backgroundColor = '#dc3545';
        pendingMinusButton.onmouseover = () => pendingMinusButton.style.backgroundColor = '#c82333';
        pendingMinusButton.onmouseout = () => pendingMinusButton.style.backgroundColor = '#dc3545';
        pendingMinusButton.addEventListener('click', () => {
            const date = getCurrentDate();
            const time = getCurrentTime();
            const initials = GM_getValue(initialsKey, '');
            const currentLanguage = GM_getValue(languageKey, 'російська');

            let textToInsert;
            const colorPA = TotalPA < 0.75 ? 'green' : (TotalPA >= 0.75 && TotalPA < 1 ? 'orange' : 'red');

            if (currentLanguage === 'російська') {
                textToInsert = `${date} в ${time} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | много безуспешных попыток депозита <b>неизвестными</b> картами, <b>авто отключаем</b>`;
            } else if (currentLanguage === 'українська') {
                textToInsert = `${date} в ${time} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | багато безуспішних спроб депозиту <b>невідомими</b> картками, <b>авто відключаємо</b>`;
            } else {
                textToInsert = `${date} в ${time} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | много безуспешных попыток депозита <b>неизвестными</b> картами, <b>авто отключаем</b>`;
            }

            insertTextIntoField(textToInsert);
        });
        secondRowButtonContainer.appendChild(pendingMinusButton);
        if (showPendingsButton === true){
            popupBox.appendChild(secondRowButtonContainer);}

        const thirdRowButtonContainer = document.createElement('div');
        thirdRowButtonContainer.style.marginTop = '10px';
        thirdRowButtonContainer.style.display = 'flex';
        thirdRowButtonContainer.style.justifyContent = 'center';

        const projectButtonContainer = document.createElement('div');
        projectButtonContainer.style.marginTop = '10px';
        projectButtonContainer.style.display = 'block';
        projectButtonContainer.style.justifyContent = 'center';
        projectButtonContainer.style.alignItems = 'center';
        projectButtonContainer.style.textAlign = 'center';

        const searchImage = document.createElement('img');
        searchImage.src = 'https://cdn-icons-png.flaticon.com/512/64/64673.png';
        searchImage.style.cursor = 'pointer';
        searchImage.width = '50'
        searchImage.height = '50'
        searchImage.addEventListener('click', () => {
            searchImage.remove();

            function getValueByLabel(doc, labelText) {
                const rows = doc.querySelectorAll('tr');
                for (const row of rows) {
                    const th = row.querySelector('th');
                    const td = row.querySelector('td');
                    if (th && th.textContent.trim() === labelText) {
                        const text = td ? td.textContent.trim() : 'Не найдено';
                        return text.split('\n')[0].trim();
                    }
                }
                return 'Не найдено';
            }

            function getFirstValueByLabel(labelText) {
                const rows = document.querySelectorAll('tr');
                for (const row of rows) {
                    const th = row.querySelector('th');
                    const td = row.querySelector('td');
                    if (th && th.textContent.trim() === labelText) {
                        const text = td ? td.textContent.trim() : 'Не найдено';
                        return text.split('\n')[0].trim();
                    }
                }
                return 'Не найдено';
            }

            function searchUser(query, fieldType, projectUrl, projectContainer) {
                const searchTypeLabel = fieldType === 'inn' ? 'ІПН' : (fieldType === 'email' ? 'E-mail' : 'Телефон');

                GM_xmlhttpRequest({
                    method: "POST",
                    url: projectUrl,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    data: `PlayersSearchForm[${fieldType}]=${encodeURIComponent(query)}`,
                    onload: function (response) {
                        if (response.finalUrl.includes('/update/')) {
                            getUserInfo(response.finalUrl, fieldType, projectContainer);
                        } else {
                            const notFoundMessage = document.createElement('div');
                            notFoundMessage.innerHTML = `<b>${searchTypeLabel}:</b> не знайдено`;
                            notFoundMessage.style.textAlign = 'center';
                            projectContainer.appendChild(notFoundMessage);
                        }
                    },
                    onerror: function () {
                        const errorMessage = document.createElement('div');
                        errorMessage.innerHTML = `<b>${searchTypeLabel}:</b> Помилка при пошуку`;
                        errorMessage.style.color = 'red';
                        errorMessage.style.textAlign = 'center';
                        projectContainer.appendChild(errorMessage);
                    }
                });
            }

            function getUserInfo(url, fieldType, projectContainer) {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    onload: function(response) {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = response.responseText;

                        const playerId = getValueByLabel(tempDiv, 'Номер игрока');
                        let status = 'success';
                        const attentionHeaders = tempDiv.querySelectorAll('h1.attention-header');
                        attentionHeaders.forEach(header => {
                            const headerText = header.textContent.trim();
                            if (headerText.includes('Дубликат') || headerText.includes('Отключен') || headerText.includes('Ограничение по возрасту!') || headerText.includes('Не подтвержден')) {
                                status = 'danger';
                            } else if (headerText.includes('Лудоман')) {
                                status = 'info';
                            }
                        });

                        if (status === 'success') {
                            const isNotSpecified = [
                                'Имя',
                                'Middle Name',
                                'Фамилия'
                            ].every(field => {
                                const row = [...tempDiv.querySelectorAll('tr')]
                                .find(row => row.querySelector('th')?.textContent.includes(field));
                                return row && (row.querySelector('td').textContent.trim() === 'Не задан' || row.querySelector('td').textContent.trim() === 'Не заданий');
                            });

                            if (isNotSpecified) {
                                status = 'default';
                            }
                        }
                        const searchTypeLabel = fieldType === 'inn' ? 'ІПН' : (fieldType === 'email' ? 'E-mail' : 'Телефон');

                        const userInfo = document.createElement('div');
                        userInfo.innerHTML = `
                <b>${searchTypeLabel}:</b>
                <a class="label label-${status}" href="${url}" target="_blank">${playerId}</a>
            `;
                        userInfo.style.textAlign = 'center';
                        projectContainer.appendChild(userInfo);
                    },
                    onerror: function() {
                        const errorMessage = document.createElement('div');
                        errorMessage.innerHTML = 'Помилка при отриманні даних користувача.';
                        errorMessage.style.color = 'red';
                        errorMessage.style.textAlign = 'center';
                        projectContainer.appendChild(errorMessage);
                    }
                });
            }



            function getAjaxUrl() {
                const scripts = document.querySelectorAll('script');
                for (const script of scripts) {
                    const scriptContent = script.textContent;
                    if (scriptContent.includes('#credentials-info')) {
                        const urlMatch = scriptContent.match(/url:\s*'([^']+)'/);
                        if (urlMatch) {
                            return urlMatch[1];
                        }
                    }
                }
                return null;
            }

            const url = getAjaxUrl();

            if (url) {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    onload: function(response) {
                        let tempDiv = document.createElement('div');
                        tempDiv.innerHTML = response.responseText;

                        let inn = tempDiv.querySelector('#common_services_players_models_PlayerCredentials_inn').value;
                        const email = getFirstValueByLabel('E-mail');
                        const phone = getFirstValueByLabel('Телефон');

                        const projectUrls = {
                            'betking': 'https://admin.betking.com.ua/players/playersItems/search/',
                            '777': 'https://admin.777.ua/players/playersItems/search/',
                            'vegas': 'https://admin.vegas.ua/players/playersItems/search/'
                        };

                        const currentProject = window.location.hostname.includes('betking')
                        ? 'betking'
                        : (window.location.hostname.includes('777') ? '777' : 'vegas');

                        const otherProjects = Object.keys(projectUrls).filter(project => project !== currentProject);

                        otherProjects.forEach(project => {
                            const projectContainer = document.createElement('div');
                            projectContainer.style.marginBottom = '20px';

                            const projectImage = document.createElement('img');
                            if (project === 'betking') {
                                projectImage.src = 'https://admin.betking.com.ua/img/betking.png';
                                projectImage.style.width = '47px';
                                projectImage.style.height = '47px';
                            } else if (project === '777') {
                                projectImage.src = 'https://admin.777.ua/img/777.png';
                                projectImage.style.width = '75px';
                                projectImage.style.height = 'auto';
                            } else {
                                projectImage.src = 'https://admin.vegas.ua/img/vegas.png';
                                projectImage.style.width = '75px';
                                projectImage.style.height = 'auto';
                            }
                            projectImage.alt = project;
                            projectImage.style.display = 'block';
                            projectImage.style.margin = '0 auto 10px';
                            projectContainer.appendChild(projectImage);

                            projectButtonContainer.appendChild(projectContainer);

                            searchUser(inn, 'inn', projectUrls[project], projectContainer);
                            searchUser(email, 'email', projectUrls[project], projectContainer);
                            searchUser(phone, 'phone', projectUrls[project], projectContainer);

                            processProjectCards(project, projectUrls[project], projectContainer);

                        });
                        processСurrentProjectCards(currentProject, projectUrls[currentProject]);
                    },
                    onerror: function() {
                        projectButtonContainer.innerHTML += '<div>Ошибка при получении данных ИНН.</div>';
                    }
                });
            } else {
                projectButtonContainer.innerHTML += '<div>Не удалось найти URL для запроса.</div>';
            }
        });

        function processProjectCards(project, projectUrl, projectContainer) {
            fetchAllCards().then(data => {
                const cards = data.cards;

                const searchUrl = projectUrl.replace('/players/playersItems/search/', '/payments/paymentsItemsOut/requisite/');
                const openUrl = projectUrl.replace('/players/playersItems/search/', '');

                cards.forEach(card => {
                    const cardContainer = document.createElement('div');

                    GM_xmlhttpRequest({
                        method: "POST",
                        url: searchUrl,
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                        data: `PaymentsRequisiteForm[requisite]=${encodeURIComponent(card)}`,
                        onload: function (response) {
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = response.responseText;
                            const table = tempDiv.querySelector('table.items tbody');

                            if (table) {
                                const rows = table.querySelectorAll('tr');

                                rows.forEach((row) => {
                                    const playerCard = row.querySelector('td span.player_card');
                                    if (playerCard) {
                                        let cardHtml = playerCard.outerHTML;
                                        let cardTempDiv = document.createElement('div');
                                        cardTempDiv.innerHTML = cardHtml;
                                        cardTempDiv.querySelectorAll('a').forEach(link => {
                                            let href = link.getAttribute('href');
                                            if (href) {
                                                link.setAttribute('href', `${openUrl}${href}`);
                                            }
                                        });

                                        cardHtml = cardTempDiv.innerHTML;
                                        let spanElement = cardTempDiv.querySelector('.player_card');

                                        if (spanElement) {
                                            spanElement.removeAttribute('rel');
                                            spanElement.removeAttribute('data-content');
                                        }

                                        cardHtml = cardTempDiv.innerHTML;
                                        const first6 = card.slice(0, 6);
                                        const last4 = card.slice(-4);

                                        projectContainer.innerHTML += `<b>${first6}|${last4}:</b> ${cardHtml}`;
                                    }
                                });
                            }
                        },
                        onerror: function () {
                            const errorDiv = document.createElement('div');
                            errorDiv.textContent = `Помилка пошуку карти: ${card}`;
                            errorDiv.style.color = 'red';
                            cardContainer.appendChild(errorDiv);
                        }
                    });
                });
            });
        }

        function processСurrentProjectCards(project, projectUrl) {
            fetchAllCards().then(data => {
                const cards = data.cards;

                const searchUrl = projectUrl.replace('/players/playersItems/search/', '/payments/paymentsItemsOut/requisite/');
                const openUrl = projectUrl.replace('/players/playersItems/search/', '');

                let projectContainer;
                let foundPlayers = false;

                cards.forEach(card => {
                    GM_xmlhttpRequest({
                        method: "POST",
                        url: searchUrl,
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                        data: `PaymentsRequisiteForm[requisite]=${encodeURIComponent(card)}`,
                        onload: function (response) {
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = response.responseText;
                            const table = tempDiv.querySelector('table.items tbody');

                            if (table) {
                                const rows = table.querySelectorAll('tr');

                                rows.forEach(row => {
                                    const playerCard = row.querySelector('td span.player_card');
                                    if (playerCard) {
                                        if (!projectContainer) {
                                            projectContainer = document.createElement('div');
                                            projectContainer.style.marginBottom = '20px';

                                            const projectImage = document.createElement('img');
                                            if (projectUrl.includes('betking')) {
                                                projectImage.src = 'https://admin.betking.com.ua/img/betking.png';
                                                projectImage.style.width = '47px';
                                                projectImage.style.height = '47px';
                                            } else if (projectUrl.includes('777')) {
                                                projectImage.src = 'https://admin.777.ua/img/777.png';
                                                projectImage.style.width = '75px';
                                                projectImage.style.height = 'auto';
                                            } else {
                                                projectImage.src = 'https://admin.vegas.ua/img/vegas.png';
                                                projectImage.style.width = '75px';
                                                projectImage.style.height = 'auto';
                                            }
                                            projectImage.alt = project;
                                            projectImage.style.display = 'block';
                                            projectImage.style.margin = '0 auto 10px';
                                            projectContainer.appendChild(projectImage);
                                        }

                                        let cardHtml = playerCard.outerHTML;
                                        const cardTempDiv = document.createElement('div');
                                        cardTempDiv.innerHTML = cardHtml;

                                        cardTempDiv.querySelectorAll('a').forEach(link => {
                                            let href = link.getAttribute('href');
                                            if (href) {
                                                link.setAttribute('href', `${openUrl}${href}`);
                                            }
                                        });

                                        cardHtml = cardTempDiv.innerHTML;

                                        const spanElement = cardTempDiv.querySelector('.player_card');
                                        if (spanElement) {
                                            spanElement.removeAttribute('rel');
                                            spanElement.removeAttribute('data-content');
                                        }
                                        cardHtml = cardTempDiv.innerHTML;
                                        const first6 = card.slice(0, 6);
                                        const last4 = card.slice(-4);
                                        if (!cardHtml.includes(userId)) {
                                            projectContainer.innerHTML += `<b>${first6}|${last4}:</b> ${cardHtml}`;
                                            foundPlayers = true;
                                        }
                                    }
                                });
                            }
                        },
                        onerror: function () {
                            console.error(`Ошибка при поиске карты: ${card}`);
                        },
                        onloadend: function () {
                            if (foundPlayers && projectContainer && !projectContainer.parentElement) {
                                projectButtonContainer.appendChild(projectContainer);
                            }
                        }
                    });
                });
            });
        }


        if (!window.location.hostname.includes('admin.wildwinz.com')) {
            popupBox.appendChild(projectButtonContainer);
            projectButtonContainer.appendChild(searchImage);
        }

        const resultButton = document.createElement('button');
        resultButton.innerText = 'Total InOut';
        resultButton.style.cssText = buttonStyle;
        resultButton.style.backgroundColor = '#2196F3';
        resultButton.onmouseover = () => resultButton.style.backgroundColor = '#2f76ae';
        resultButton.onmouseout = () => resultButton.style.backgroundColor = '#2196F3';
        resultButton.addEventListener('click', () => {
            if (!isProfitButtonClicked) {
                isProfitButtonClicked = true;
                fetchResults();
            }
        });
        thirdRowButtonContainer.appendChild(resultButton);

        const fourthRowContainer = document.createElement('div');
        fourthRowContainer.style.marginTop = '10px';
        fourthRowContainer.style.display = 'block';
        fourthRowContainer.style.justifyContent = 'center';
        fourthRowContainer.style.alignItems = 'center';
        fourthRowContainer.style.textAlign = 'center';

        popupBox.appendChild(thirdRowButtonContainer);
        popupBox.appendChild(fourthRowContainer);

        const styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerText = `
    @keyframes borderGlow {
        0% {
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
            border-color: ${borderColor};
        }
        50% {
            box-shadow: 0 0 15px gray;
            border-color: ${borderColor};
        }
        100% {
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
            border-color: ${borderColor};
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
                                        @keyframes glow {
                                        0% { box-shadow: 0 0 5px ${borderColor}; }
                                        100% { box-shadow: 0 0 25px ${borderColor}; }
                                    }


    @keyframes blink-red {
    0% { background-color: transparent; }
    50% { background-color: red; }
    100% { background-color: transparent; }
}

.blinking {
    animation: blink-red 1s infinite;
}

        #players-documents_c6 {
            cursor: pointer;
        }
`;
        document.head.appendChild(styleSheet);
        document.body.appendChild(popupBox);

        function fetchResults() {
            const loader = document.createElement('div');
            loader.style.border = '8px solid #f3f3f3';
            loader.style.borderTop = '8px solid #3498db';
            loader.style.borderRadius = '50%';
            loader.style.width = '50px';
            loader.style.height = '50px';
            loader.style.animation = 'spin 2s linear infinite';
            loader.style.marginBottom = '10px';
            fourthRowContainer.appendChild(loader);

            const style = document.createElement('style');
            style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    #popup-container {
        min-height: 200px;
        overflow-y: auto;
        white-space: normal;
        word-wrap: break-word;
    }
    `;
            document.head.appendChild(style);

            const playerID = getPlayerID();
            const baseURL = `${ProjectUrl}players/playersDetail/index/`;
            console.log(baseURL)
            GM_xmlhttpRequest({
                method: 'POST',
                url: baseURL,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: `PlayersDetailForm%5Blogin%5D=${encodeURIComponent(playerID)}&PlayersDetailForm%5Bperiod%5D=2015.06.09+00%3A00%3A00+-+2025.05.23+23%3A59%3A59&PlayersDetailForm%5Bshow_table%5D=1`,
                onload: function(response) {
                    if (response.status >= 200 && response.status < 300) {

                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, 'text/html');

                        const table = doc.querySelector('.detail-view');
                        let depositsTotal = 0;
                        let redeemsTotal = 0;

                        if (table) {
                            const rows = table.querySelectorAll('tr');

                            rows.forEach(row => {
                                const key = row.querySelector('th')?.textContent.trim();
                                const value = row.querySelector('td')?.textContent.trim();

                                if (key === 'Deposits Total') {
                                    depositsTotal = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
                                } else if (key === 'Redeems Total') {
                                    redeemsTotal = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
                                }
                            });

                            let cleanBalance = parseFloat(Balance);
                            const safeBalance = getInnerBalanceValue();
                            const profit = (depositsTotal - redeemsTotal);
                            const PrognoseInOut = depositsTotal - (totalPending + redeemsTotal + cleanBalance + safeBalance);
                            const PrognosePA = ((redeemsTotal + totalPending + cleanBalance + safeBalance) / depositsTotal) * 100;
                            const formattedProfit = formatAmount(profit)
                            const formattedPrognoseInOut = formatAmount(PrognoseInOut)
                            const showAmount = GM_getValue(amountDisplayKey, true);



                            fourthRowContainer.removeChild(loader);
                            fourthRowContainer.innerHTML += `
    <div><b>Total InOut: ${showAmount ? formattedProfit : profit.toFixed(2)}${currencySymbol}</b></div>
    ${(totalPending > 1 || cleanBalance > 1 || safeBalance > 1) ? `
        <div><b>Prognose InOut: ${showAmount ? formattedPrognoseInOut : PrognoseInOut.toFixed(2)}${currencySymbol}</b></div>
        <div><b>Prognose PA:
            <span style="color: ${PrognosePA < 75 ? 'green' : (PrognosePA < 100 ? 'orange' : 'red')}">
                ${PrognosePA.toFixed(2)}%
            </span>
        </b></div>
    ` : ''}
`;

                        } else {
                            fourthRowContainer.removeChild(loader);
                            fourthRowContainer.innerHTML += 'Таблица с результатами не найдена.';
                        }
                    } else {
                        console.error('Ошибка ответа:', response.statusText);
                        fourthRowContainer.removeChild(loader);
                        fourthRowContainer.innerHTML += `Ошибка получения данных: ${response.statusText}`;
                    }
                },
                onerror: function(error) {
                    console.error('Ошибка запроса:', error);
                    fourthRowContainer.removeChild(loader);
                    fourthRowContainer.innerHTML += 'Ошибка запроса: ' + error.message;
                }
            });
        }
    }

    function updatePopupBox(balanceAfterBonus, withdrawAmount, bonusId, bonusText, withdrawId, withdrawText, bonusAmount, bonusDate, index) {
        if (!popupBox) {
            console.error('Попап не существует');
            return;
        }

        const textElement = popupBox.querySelector('.popup-text');
        if (textElement) {
            const newMessage = document.createElement('div');
            newMessage.style.color = 'red';
            newMessage.style.fontWeight = 'bold';
            newMessage.style.marginTop = '10px';
            newMessage.innerHTML = `
            <center>
            <span id="popup-clickable-text-${index}">
                Можливе порушення BTR:<br>${bonusDate}<br>відіграв ${balanceAfterBonus}₴, виводить ${withdrawAmount}₴
            </span>
            </center>
        `;
            textElement.appendChild(newMessage);

            const clickableText = document.getElementById(`popup-clickable-text-${index}`);
            if (clickableText) {
                clickableText.addEventListener('click', () => {
                    const date = getCurrentDate();
                    const initials = GM_getValue(initialsKey);

                    const textToInsert = `
#<b>${bonusId} | ${bonusText} | ${bonusAmount}₴ | ${balanceAfterBonus}₴<br>
#${withdrawId} | ${withdrawText} | ${withdrawAmount}₴</b>
                `;
                    insertTextIntoField(textToInsert);
                });
            }
        }
    }



    function showBonusViolationMessage(bonusId, dateStr, index) {
        if (!popupBox) {
            console.error('Попап не существует');
            return;
        }

        const textElement = popupBox.querySelector('.popup-text');
        if (textElement) {
            const newMessage = document.createElement('div');
            newMessage.style.color = 'red';
            newMessage.style.fontWeight = 'bold';
            newMessage.style.marginTop = '10px';
            newMessage.innerHTML = `
            <center>
            <span id="popup-bonus-violation-${index}">
                Бонус ${bonusId} присвоєно більше 2 разів за день ${dateStr}
            </span>
            </center>
        `;
            textElement.appendChild(newMessage);

            const clickableText = document.getElementById(`popup-bonus-violation-${index}`);
            if (clickableText) {
                clickableText.addEventListener('click', () => {
                    const textToInsert = `
#<b>Бонус ${bonusId} присвоєно більше 2 разів за день ${dateStr}</b>
                `;
                    insertTextIntoField(textToInsert);
                });
            }
        }
    }

    function showManualBalance(dateStr, bonusInfo) {
        if (!popupBox) {
            console.error('Попап не существует');
            return;
        }

        const textElement = popupBox.querySelector('.popup-text');
        if (textElement) {
            const newMessage = document.createElement('div');
            newMessage.style.color = 'blue';
            newMessage.style.fontWeight = 'bold';
            newMessage.style.marginTop = '10px';
            newMessage.innerHTML = `
            <center>
            <span id="popup-manual-balance">
                 ${bonusInfo} | ${dateStr}
            </span>
            </center>
        `;
            textElement.appendChild(newMessage);
        };
    }

    function updateCleanButtonState(cleanButton, isCheckedToday) {
        if (isCheckedToday) {
            cleanButton.innerText = 'Checked ✔';
            cleanButton.style.backgroundColor = '#d3d3d3';
            cleanButton.style.color = '#000';
            cleanButton.style.border = '2px solid #000';
            cleanButton.disabled = true;
        } else {
            cleanButton.innerText = 'Checked';
            cleanButton.style.backgroundColor = '#28a745';
            cleanButton.disabled = false;
        }

        cleanButton.onmouseover = () => {
            if (!cleanButton.disabled) {
                cleanButton.style.backgroundColor = '#218838';
            }
        };

        cleanButton.onmouseout = () => {
            if (!cleanButton.disabled) {
                cleanButton.style.backgroundColor = '#28a745';
            }
        };
    }

    function showBRP(totalDeposits, bonusWithDeposits, bonusDepositPercentage) {
        const popupText = document.querySelector('.popup-main-text');
        if (popupText) {
            const newLine = document.createElement('div');

            const textColor = bonusDepositPercentage > 50 ? 'maroon' : 'black';

            newLine.innerHTML = `
            <center>
                <b
                    title="Кількість депозитів: ${totalDeposits}\nБонусів з депозитом: ${bonusWithDeposits}"
                    style="color: ${textColor};"
                >
                    BRP: ${bonusDepositPercentage.toFixed(2)}%
                </b>
            </center>
        `;

            popupText.appendChild(newLine);
        } else {
            console.warn('Елемент з класом .popup-main-text не знайдено');
        }
    }


    function fetchAndProcessData() {
        const project = getProject();
        const fullProjectUrl = `${ProjectUrl}players/playersItems/transactionLog/${userId}/`;

        console.log('Запрос данных по URL:', fullProjectUrl);

        GM_xmlhttpRequest({
            method: 'GET',
            url: fullProjectUrl,
            onload: function(response) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, 'text/html');
                const formData = new FormData();
                formData.append('pageSize', '10000');

                GM_xmlhttpRequest({
                    method: 'POST',
                    url: fullProjectUrl,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: new URLSearchParams(formData).toString(),
                    onload: function(response) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, 'text/html');

                        const rows = Array.from(doc.querySelectorAll('tr'));

                        let withdrawAmount = 0;
                        let balanceAfterBonus = 0;
                        let bonusAmount = 0;
                        let waitingForBonus = false;

                        let bonusId = '';
                        let bonusText = '';
                        let withdrawId = '';
                        let withdrawText = '';
                        let bonusDate = '';

                        let totalDeposits = 0;
                        let bonusWithDeposits = 0;
                        let totalWithdrawAmount = 0;

                        let messageCount = 0;
                        const maxMessages = 2;

                        const bonusAssignments = {};
                        const displayedMessages = {};

                        const indexTransactionInfo = 7;
                        const indexDate = 6;

                        rows.forEach(row => {
                            if (messageCount >= maxMessages) return;
                            const cells = row.querySelectorAll('td');
                            if (cells.length > 0) {
                                const actionType = cells[1] ? cells[1].innerText.trim() : '';
                                const bonusInfo = cells[indexTransactionInfo] ? cells[indexTransactionInfo].textContent.trim() : '';
                                const dateTimeStr = cells[indexDate] ? cells[indexDate].textContent.trim() : '';
                                const dateMatch = dateTimeStr.match(/^(\d{2}\/\d{2}\/\d{4})/);
                                const dateStr = dateMatch ? dateMatch[1] : '';

                                if (actionType.includes('Вывод средств')) {
                                    withdrawAmount = parseFloat(cells[2] ? cells[2].textContent.replace('-', '').replace(',', '.') : '0') || 0;
                                    totalWithdrawAmount += withdrawAmount;
                                    withdrawId = cells[0] ? cells[0].textContent.trim() : '';
                                    withdrawText = cells[indexTransactionInfo] ? cells[indexTransactionInfo].textContent.trim() : '';
                                    waitingForBonus = true;

                                } else if (actionType.includes('Ввод средств') || actionType.includes('Purchase')) {
                                    withdrawAmount = 0;
                                    balanceAfterBonus = 0;
                                    waitingForBonus = false;
                                    totalWithdrawAmount = 0
                                    totalDeposits++;
                                } else if (actionType.includes('Ручное начисление баланса')) {
                                    const amount = parseFloat(cells[2] ? cells[2].textContent.replace(',', '.') : '0');
                                    if (amount > 1) {
                                        showManualBalance(dateStr, bonusInfo);
                                    }
                                } else if (actionType.includes('Отыгрывание бонуса') && waitingForBonus) {
                                    bonusAmount = parseFloat(cells[2] ? cells[2].textContent.replace(',', '.') : '0');
                                    balanceAfterBonus = parseFloat(cells[3] ? cells[3].textContent.replace(',', '.') : '0');
                                    bonusId = cells[0] ? cells[0].textContent.trim() : '';
                                    bonusText = cells[indexTransactionInfo] ? cells[indexTransactionInfo].textContent.trim() : '';
                                    const fullDate = cells[indexDate] ? cells[indexDate].textContent.trim() : '';
                                    const dateMatch = fullDate.match(/^(\d{2}\/\d{2}\/\d{4})/);
                                    bonusDate = dateMatch ? dateMatch[1] : '';
                                    if (totalWithdrawAmount > balanceAfterBonus) {
                                        const message = `Можливе порушення BTR:\n${bonusDate}\nвідіграв ${bonusAmount}₴, виводить ${totalWithdrawAmount}₴`;
                                        console.log('Проверка на нарушение BTR:', message);

                                        updatePopupBox(balanceAfterBonus, totalWithdrawAmount, bonusId, bonusText, withdrawId, withdrawText, bonusAmount, bonusDate, messageCount);

                                        messageCount++;
                                    }

                                    waitingForBonus = false;
                                } else if (actionType.includes('Присвоение бонуса') || actionType.includes('Bonus assignment')) {
                                    const paymentMatch = bonusInfo.match(/платеж № (\d+)/);
                                    if (paymentMatch) {
                                        bonusWithDeposits++;
                                    }

                                    const bonusIdMatch = bonusInfo.match(/№ (\d+)/);
                                    if (bonusIdMatch) {
                                        const bonusId = bonusIdMatch[1];

                                        if (!bonusAssignments[bonusId]) {
                                            bonusAssignments[bonusId] = {};
                                        }

                                        if (!bonusAssignments[bonusId][dateStr]) {
                                            bonusAssignments[bonusId][dateStr] = 0;
                                        }

                                        bonusAssignments[bonusId][dateStr]++;

                                        if (bonusAssignments[bonusId][dateStr] > 2) {
                                            const key = `${bonusId}_${dateStr}`;
                                            if (!displayedMessages[key]) {
                                                const additionalMessage = `Бонус ${bonusId} присвоєно більше 2 разів за день ${dateStr}`;
                                                console.log('Проверка на нарушение присвоения бонуса:', additionalMessage);

                                                showBonusViolationMessage(bonusId, dateStr, messageCount);

                                                displayedMessages[key] = true;
                                                messageCount++;
                                            }
                                        }
                                    } else {
                                        console.warn('Не удалось извлечь ID бонуса из строки:', bonusInfo);
                                    }
                                }
                            }
                        });

                        if (totalDeposits > 0) {
                            let bonusDepositPercentage = (bonusWithDeposits / totalDeposits) * 100;
                            console.log(`Загальна кількість депозитів: ${totalDeposits}`);
                            console.log(`Кількість депозитів з бонусом: ${bonusWithDeposits}`);
                            console.log(`BRP - ${bonusDepositPercentage.toFixed(2)}%`);
                            showBRP(totalDeposits, bonusWithDeposits, bonusDepositPercentage);
                        } else {
                            console.log('Депозити відсутні.');
                        }
                    },
                    onerror: function(error) {
                        console.error('Ошибка загрузки данных:', error);
                    }
                });
            }
        });
    }

    function fetchAndProcessPending() {
        return new Promise((resolve, reject) => {
            const PlayerID = getPlayerID();
            const fullProjectUrl = `${ProjectUrl}payments/paymentsItemsOut/index/?PaymentsItemsOutForm%5Bsearch_login%5D=${PlayerID}`;
            let totalPending = 0;
            let cardsSet = new Set();

            GM_xmlhttpRequest({
                method: 'GET',
                url: fullProjectUrl,
                onload: function(response) {
                    const html = response.responseText;

                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    const pageSizeSelect = doc.querySelector('#newPageSize');
                    if (pageSizeSelect) {
                        pageSizeSelect.value = '450';
                        const event = new Event('change', { bubbles: true });
                        pageSizeSelect.dispatchEvent(event);
                    } else {
                        console.warn('Page size selector not found.');
                    }

                    const rows = doc.querySelectorAll('tr');
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

                        const cardLabel = row.querySelector('td:nth-child(10) span.label[style="background-color: #8D8A8E"]');
                        if (cardLabel) {
                            const cardNumber = cardLabel.textContent.trim();
                            cardsSet.add(cardNumber);
                        }
                    });

                    const uniqueCards = Array.from(cardsSet);
                    resolve({ totalPending, cards: uniqueCards });
                },
                onerror: function(error) {
                    console.error('Ошибка загрузки данных:', error);
                    reject(error);
                }
            });
        });
    }


    function fetchAllCards() {
        return new Promise((resolve, reject) => {
            const PlayerID = getPlayerID();
            const fullProjectUrl = `${ProjectUrl}payments/paymentsItemsOut/index/?PaymentsItemsOutForm%5Bsearch_login%5D=${PlayerID}`;
            let cardsSet = new Set();

            GM_xmlhttpRequest({
                method: 'GET',
                url: fullProjectUrl,
                onload: function(response) {
                    const html = response.responseText;

                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    const pageSizeSelect = doc.querySelector('#newPageSize');
                    if (pageSizeSelect) {
                        pageSizeSelect.value = '450';
                        const event = new Event('change', { bubbles: true });
                        pageSizeSelect.dispatchEvent(event);
                    } else {
                        console.warn('Page size selector не найден.');
                    }

                    const rows = doc.querySelectorAll('tr');
                    rows.forEach(row => {
                        const cardLabel = row.querySelector('td:nth-child(10)');
                        if (cardLabel) {
                            const cardNumber = cardLabel.textContent.trim();
                            if (cardNumber) {
                                cardsSet.add(cardNumber);
                            }
                        }
                    });

                    const uniqueCards = Array.from(cardsSet);
                    console.log({ cards: uniqueCards })
                    resolve({ cards: uniqueCards });
                },
                onerror: function(error) {
                    console.error('Ошибка загрузки данных:', error);
                    reject(error);
                }
            });
        });
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

        data.forEach(entry => {
            const round_id = entry.round_id;

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
            }
        }

        return alerts;
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
                `}
            </div>
        `).join('')}
    </div>
`;

        return content;
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

        const roundAlerts = checkRoundIntervals(data);
        const largeBetAlerts = checkLargeBets(data);
        const winResults = calculateWinsByRoundType(data);
        const betResults = calculateBetsByRoundType(data);
        const multipleBetsAlerts = checkMultipleBets(data);
        const anomalousBetIncreasesAlerts = checkAnomalousBetIncreases(data);

        let message = '';

        console.log(largeBetAlerts);
        console.log(anomalousBetIncreasesAlerts);

        if (roundAlerts.length > 0) {
            message += `
        <b>Знайдено можливі відкладені раунди:</b>
        <button class="toggle-button" onclick="toggleContentVisibility(event)">►</button>
        ${createScrollableContent(roundAlerts)}
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
            const response = await fetch('https://vps65001.hyperhost.name/api/get_manager_name', {
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
            const response = await fetch('https://vps65001.hyperhost.name/api/get_manager_id', {
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

                    const token = localStorage.getItem('authToken');
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
            const response = await fetch('https://vps65001.hyperhost.name/api/working', {
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

    function handlePopup() {
        function getInOutUrl() {
            const scripts = document.querySelectorAll('script');
            for (const script of scripts) {
                const scriptContent = script.textContent;
                if (scriptContent.includes('#show-player-in-out')) {
                    const urlMatch = scriptContent.match(/url:\s*'([^']+)'/);
                    if (urlMatch) {
                        return urlMatch[1];
                    }
                }
            }
            return null;
        }

        const url = getInOutUrl();
        if (url) {
            $.ajax({
                type: 'GET',
                url: url,
            }).done(function(data) {
                const TotalPA = data.totalInOut;
                const MonthPA = data.monthInOut;
                const Balance = getBalance();

                const showBalanceButton = document.querySelector('#show-player-balance-after');
                if (showBalanceButton) {
                    showBalanceButton.click();

                    setTimeout(() => {
                        const balanceAfterSpan = document.querySelector('#balance-after');
                        if (balanceAfterSpan) {
                            const NDFL = balanceAfterSpan.textContent.trim();
                            fetchAndProcessPending().then(({ totalPending, cards }) => {
                                console.log(cards);
                                fetchAndProcessData();
                                createPopupBox(MonthPA, TotalPA, Balance, NDFL, totalPending, cards);
                                addCheckButton(TotalPA, Balance, totalPending);
                            }).catch(error => {
                                console.error('Error processing pending payments:', error);
                            });
                        }
                    }, 350);
                }
            }).fail(function(xhr) {
                console.error('Ошибка при выполнении запроса:', xhr.responseText);
            });
        } else {
            console.log('Не удалось найти URL для запроса.');
        }
    }

    function handlePopupWildWinz() {
        function getInOutUrl() {
            const scripts = document.querySelectorAll('script');
            for (const script of scripts) {
                const scriptContent = script.textContent;
                if (scriptContent.includes('#show-player-in-out')) {
                    const urlMatch = scriptContent.match(/url:\s*'([^']+)'/);
                    if (urlMatch) {
                        return urlMatch[1];
                    }
                }
            }
            return null;
        }

        const url = getInOutUrl();
        if (url) {
            $.ajax({
                type: 'GET',
                url: url,
            }).done(function(data) {
                const TotalPA = data.totalInOut;
                const MonthPA = data.monthInOut;
                const Balance = getBalance();

                setTimeout(() => {
                    const NDFL = 0;
                    fetchAndProcessPending().then(({ totalPending, cards }) => {
                        console.log(cards);
                        fetchAndProcessData();
                        createPopupBox(MonthPA, TotalPA, Balance, NDFL, totalPending, cards);
                        addCheckButton(TotalPA, Balance, totalPending);
                    }).catch(error => {
                        console.error('Error processing pending payments:', error);
                    });
                }, 350);

            }).fail(function(xhr) {
                console.error('Ошибка при выполнении запроса:', xhr.responseText);
            });
        }
    }

    async function checkToken() {
        const token = localStorage.getItem('authToken');
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
                localStorage.setItem('authToken', token);
                alert('Авторизація успішна!');
                form.remove();
                window.location.reload()
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
        const token = localStorage.getItem('authToken');

        try {
            const response = await fetch('https://vps65001.hyperhost.name/api/user/status', {
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
        const token = localStorage.getItem('authToken');
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
        const token = localStorage.getItem('authToken');
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

    function activeUrlsManagers() {
        const currentURL = window.location.href;
        const playerId = getPlayerID();

        fetch('https://vps65001.hyperhost.name/api/get_active_users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
            const activeUsers = data.filter(user =>
                                            user.active_url.includes(playerId) || user.active_url.includes(userId)
                                           );

            if (activeUsers.length > 0) {
                const managerNames = activeUsers.map(user => user.manager_name).join(', ');
                console.log(managerNames);

                const targetElement = document.querySelector('tr.even td span.fa');
                const rowElement = targetElement.closest('tr');
                rowElement.style.backgroundColor = '#f8f8d9';

                if (targetElement) {
                    const newSpan = document.createElement('span');
                    newSpan.textContent = `Переглядають: ${managerNames}`;
                    newSpan.style.fontWeight = 'bold';
                    newSpan.style.color = '#007BFF';
                    newSpan.style.marginLeft = '10px';
                    newSpan.style.userSelect = 'none';

                    targetElement.parentNode.appendChild(newSpan);
                }
            }
        })
            .catch(error => console.error('Error:', error));
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
                const token = localStorage.getItem('authToken');
                console.log(token);
                const initials = GM_getValue(initialsKey, '');
                const currentDate = getCurrentDate();
                const playerID = getPlayerID();
                const project = getProject();
                const url = window.location.href;
                const time = getCurrentTime();
                const currentLanguage = GM_getValue(languageKey, 'російська');
                const doneButton = document.querySelector('.btn-update-comment-antifraud_manager');

                const fieldDate = getDateFromField();
                const today = getCurrentDate();

                const gatewayElement = document.getElementById('gateway-method-description-visible-antifraud_manager');
                if (!gatewayElement) {
                    console.warn('Element with id "gateway-method-description-visible-antifraud_manager" not found.');
                    return;
                }
                let insertText = '';
                if (currentLanguage === 'українська') {
                    insertText = `Вимкнув автовиплату в ${time}`;
                } else {
                    insertText = `Отключил автовыплату в ${time}`;
                }

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
                                const updatedSecondLine = `${validBeforePipe} ${insertText} | ${validAfterPipe}`.trim();
                                lines[1] = updatedSecondLine;

                                gatewayElement.innerHTML = lines.join('<br>');
                                gatewayElement.dispatchEvent(new Event('input'));

                                if (doneButton) {
                                    doneButton.click();
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
                                const updatedSecondLine = `${beforePipe} ${afterPipe} ${insertText} |`.trim();
                                lines[1] = updatedSecondLine;
                                gatewayElement.innerHTML = lines.join('<br>');
                                gatewayElement.dispatchEvent(new Event('input'));
                                if (doneButton) {
                                    doneButton.click();
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
                clearInterval(checkInterval);
            }
        }, 500);

        window.addEventListener('beforeunload', () => clearInterval(checkInterval));
    }


    function updateBanButton() {
        const updateButton = document.getElementById('yw2');

        if (updateButton) {
            updateButton.addEventListener('click', function (event) {
                event.preventDefault();

                const statusInput = document.querySelector('input[name="Players[status]"]');
                const currentStatus = statusInput.value;

                const reasonInput = document.querySelector('input[name="Players[inactive_reason]"]');
                const inactiveReason = reasonInput.value;
                const playerID = getPlayerID();

                if (currentStatus === 'UNCONFIRMED' && (inactiveReason === 'VIOLATION_RULES' || inactiveReason === 'VIOLATION_RULES_FRAUD')) {
                    Swal.fire({
                        title: 'Ви бажаєте відправити гравця на верифікацію по схемі юриста?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Так',
                        cancelButtonText: 'Ні'
                    }).then((result) => {
                        if (result.isConfirmed) {
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

                            const selectElement = document.createElement('select');
                            selectElement.id = 'reasonSelect';
                            selectElement.innerHTML = '<option value="">Виберіть причину</option>';
                            reasons.forEach((reason) => {
                                const option = document.createElement('option');
                                option.value = reason;
                                option.textContent = reason;
                                selectElement.appendChild(option);
                            });

                            const confirmButton = Swal.fire({
                                title: 'Виберіть причину:',
                                html: selectElement.outerHTML,
                                showCancelButton: true,
                                confirmButtonText: 'Підтвердити',
                                cancelButtonText: 'Відміна',
                                preConfirm: () => {
                                    const selectedReason = document.getElementById('reasonSelect').value;
                                    if (!selectedReason) {
                                        Swal.showValidationMessage('Будь ласка, виберіть причину!');
                                    }
                                    return selectedReason;
                                }
                            });

                            confirmButton.then((result) => {
                                if (result.isConfirmed) {
                                    const selectedReason = result.value;
                                    const currentDate = getCurrentDate();
                                    const initials = GM_getValue(initialsKey, '');
                                    const project = getProject();
                                    const name = Array.from(document.querySelectorAll('tr'))
                                    .filter(row => ['Имя', 'Middle Name', 'Фамилия'].includes(row.querySelector('th')?.textContent.trim()))
                                    .map(row => row.querySelector('td').textContent.trim())
                                    .join(' ');
                                    const email = Array.from(document.querySelectorAll('tr.even, tr.odd'))
                                    .find(row => row.querySelector('th')?.textContent.trim() === 'E-mail')
                                    ?.querySelector('td > div')
                                    ?.childNodes[0]?.textContent.trim();
                                    console.log(project, vegasSheet)
                                    const sheetName = project === 'betking'
                                    ? kingSheet
                                    : (project === '777'
                                       ? sevensSheet
                                       : (project === 'vegas'
                                          ? vegasSheet
                                          : ''));
                                    getAccessToken().then(accessToken => {
                                        const dataToInsert = {
                                            url: window.location.href,
                                            playerID: playerID,
                                            date: '',
                                            name: name,
                                            email: email,
                                            department: 'Anti Fraud',
                                            reason: selectedReason
                                        };

                                        sendDataToGoogleSheet(accessToken, sheetName, dataToInsert);
                                    }).catch(err => {
                                        console.error("Error getting Access Token:", err);
                                    });

                                    const message = `<strong style="color: purple;">Відправляємо на верифікацію по схемі юриста | ${currentDate} | ${initials} </strong><br><br>`;

                                    const commentField = document.getElementById('gateway-method-description-visible-antifraud_manager');
                                    commentField.innerHTML = message + commentField.innerHTML;

                                    const inputEvent = new Event('input', {
                                        bubbles: true,
                                        cancelable: true,
                                    });
                                    commentField.dispatchEvent(inputEvent);

                                    const updateCommentButton = document.querySelector('.btn-update-comment-antifraud_manager');
                                    if (updateCommentButton) {
                                        updateCommentButton.click();

                                        setTimeout(() => {
                                            updateButton.form.submit();
                                        }, 1500);
                                    } else {
                                        updateButton.form.submit();
                                    }
                                }
                            });
                        }
                    });
                } else {
                    updateButton.form.submit();
                }
            });
        }
    }



    async function checkForUpdates() {
        try {
            const response = await fetch('https://vps65001.hyperhost.name/api/version');
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
    #alert-type-select {
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
`;


        document.head.appendChild(style);

        const content = `
        <select id="project-select" required>
            <option value="" disabled selected>Оберіть проєкт</option>
            <option value="Betking">Betking</option>
            <option value="777">777</option>
            <option value="Vegas">Vegas</option>
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
            <button id="update-deposits-btn">Оновити</button>
        </div>

        <div class="error" id="alert-error-msg"></div>
        <div class="success" id="alert-success-msg"></div>
    `;

        createPopup('alert-settings-popup', 'Налаштування алертів', content, () => {});

        document.getElementById('project-select').addEventListener('change', (e) => {
            document.getElementById('alert-type-select').selectedIndex = 0;
            document.getElementById('alert-type-section').style.display = e.target.value ? 'block' : 'none';
            document.getElementById('pendings-settings').style.display = 'none';
            document.getElementById('payout-settings').style.display = 'none';
            document.getElementById('deposits-settings').style.display = 'none';
        });

        document.getElementById('alert-type-select').addEventListener('change', (e) => {
            const project = document.getElementById('project-select').value;
            const selectedType = e.target.value;
            if (selectedType === 'Pendings') {
                document.getElementById('pendings-settings').style.display = 'block';
                document.getElementById('payout-settings').style.display = 'none';
                document.getElementById('deposits-settings').style.display = 'none';
                loadSettings('Pendings', project);
            } else if (selectedType === 'PayOut') {
                document.getElementById('payout-settings').style.display = 'block';
                document.getElementById('deposits-settings').style.display = 'none';
                document.getElementById('pendings-settings').style.display = 'none';
                loadSettings('PayOut', project);
            } else if (selectedType === 'Deposits') {
                document.getElementById('deposits-settings').style.display = 'block';
                document.getElementById('pendings-settings').style.display = 'none';
                document.getElementById('payout-settings').style.display = 'none';
                loadSettings('Deposits', project);
            }
        });

        document.getElementById('pendings-update-btn').addEventListener('click', () => updateSettings('Pendings'));
        document.getElementById('payout-update-btn').addEventListener('click', () => updateSettings('PayOut'));
        document.getElementById('update-deposits-btn').addEventListener('click', () => updateSettings('Deposits'));
    }

    function loadSettings(alertType, project) {
        const prefix = alertType === 'PayOut' ? 'payout' : 'pendings';

        fetch(`https://vps65001.hyperhost.name/get_settings?alert_type=${alertType}&project=${project}`)
            .then(response => response.json())
            .then(data => {
            if (alertType === 'Deposits') {
                const depositItems = document.querySelectorAll('.deposit-priority-item');
                depositItems.forEach((item, index) => {
                    const priorityData = data.settings ? data.settings[index] : null;

                    if (priorityData) {
                        const amountInput = item.querySelector('.amount-input');
                        const bonusInput = item.querySelector('.bonus-input');
                        const cardSelect = item.querySelector('.card-select');

                        amountInput.value = priorityData.amount || '';
                        bonusInput.value = priorityData.bonusAmount || '';

                        Array.from(cardSelect.options).forEach(option => {
                            option.selected = priorityData.cards.includes(option.value);
                        });
                    }
                });

                const inefficientTransactionInput = document.getElementById('inefficient-transaction-percent');
                if (data.inefficient_transaction_percent !== undefined) {
                    inefficientTransactionInput.value = `${data.inefficient_transaction_percent * 100}%`;
                }
            } else {
                const prioritySelect = document.getElementById(`${prefix}-priority-select`);
                prioritySelect.innerHTML = '';

                const defaultPriorities = [
                    "Приоритет 1 (75к)", "Приоритет 2 (65к)", "Приоритет 3 (60к)",
                    "Приоритет 4 (50к)", "Приоритет 5 (45к)", "Приоритет 6 (30к)",
                    "Приоритет 7 (20к)", "Приоритет 8 (20к)", "n/a"
                ];
                defaultPriorities.forEach(priority => {
                    const option = document.createElement('option');
                    option.value = priority;
                    option.textContent = priority;
                    if (data.priorities && data.priorities.includes(priority)) {
                        option.classList.add('selected');
                    }
                    option.addEventListener('click', () => option.classList.toggle('selected'));
                    prioritySelect.appendChild(option);
                });

                document.getElementById(`${prefix}-total-amount`).value = data.total_amount || '';
                const autoDisableCheckbox = document.getElementById(`${prefix}-auto-disable`);
                if (autoDisableCheckbox) {
                    autoDisableCheckbox.checked = data.auto_disable === "True";
                }
            }
        })
            .catch(error => console.error('Ошибка при загрузке настроек:', error));
    }


    function updateSettings(alertType) {
        const project = document.getElementById('project-select').value;

        if (alertType === 'Deposits') {
            const depositSettings = Array.from(document.querySelectorAll('.deposit-priority-item')).map(item => {
                return {
                    priority: item.querySelector('.priority-label').textContent.trim(),
                    amount: item.querySelector('.amount-input').value.trim(),
                    bonusAmount: item.querySelector('.bonus-input').value.trim(),
                    cards: Array.from(item.querySelector('.card-select').selectedOptions).map(opt => opt.value)
                };
            });

            const inefficientTransactionPercent = document.getElementById('inefficient-transaction-percent').value.trim();

            if (depositSettings.some(setting => !/^\d+$/.test(setting.amount) || !/^\d+$/.test(setting.bonusAmount))) {
                document.getElementById('alert-error-msg').textContent = "Усі поля суми мають бути заповнені коректними числовими значеннями.";
                return;
            }

            if (!/^\d+%$/.test(inefficientTransactionPercent)) {
                document.getElementById('alert-error-msg').textContent = "Введіть коректний відсоток (наприклад, 10%).";
                return;
            }

            const data = {
                alert_type: alertType,
                project: project,
                settings: depositSettings,
                inefficient_transaction_percent: inefficientTransactionPercent
            };

            console.log(data)

            fetch('https://vps65001.hyperhost.name/update_settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
                .then(response => response.json())
                .then(result => {
                if (result.success) {
                    document.getElementById('alert-success-msg').textContent = "Успішно оновлено.";
                    document.getElementById('alert-error-msg').textContent = '';
                } else {
                    document.getElementById('alert-error-msg').textContent = result.message || "Виникла помилка.";
                }
            })
                .catch(error => {
                document.getElementById('alert-error-msg').textContent = "Виникла помилка при відправці даних.";
                console.error('Ошибка:', error);
            });

            return;
        }
        const prefix = alertType === 'PayOut' ? 'payout' : 'pendings';

        const selectedPriorities = Array.from(document.getElementById(`${prefix}-priority-select`).options)
        .filter(option => option.classList.contains('selected'))
        .map(option => option.value);

        const totalAmount = document.getElementById(`${prefix}-total-amount`).value.trim();
        const autoDisable = alertType === 'PayOut' && document.getElementById('payout-auto-disable').checked;

        if (selectedPriorities.length === 0) {
            document.getElementById('alert-error-msg').textContent = "Виберіть хоча б один приорітет.";
            return;
        }

        if (!/^\d+$/.test(totalAmount)) {
            document.getElementById('alert-error-msg').textContent = "Введіть корректну суму (лише цифри).";
            return;
        }

        const data = {
            alert_type: alertType,
            project: project,
            amount: parseInt(totalAmount),
            priorities: selectedPriorities,
            auto_disable: autoDisable
        };

        fetch('https://vps65001.hyperhost.name/update_settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(result => {
            if (result.success) {
                document.getElementById('alert-success-msg').textContent = "Успішно оновлено.";
                document.getElementById('alert-error-msg').textContent = '';
            } else {
                document.getElementById('alert-error-msg').textContent = result.message || "Виникла помилка.";
            }
        })
            .catch(error => {
            document.getElementById('alert-error-msg').textContent = "Виникла помилка при відправці даних.";
            console.error('Ошибка:', error);
        });
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
                                console.log('Найден провайдер:', provider);
                                resolve(provider);
                                return;
                            } else if (!verificationCount && provider === 'SumSub') {
                                console.log('Найден провайдер sumsub без верификаций:', provider);
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

    function goToGoogleSheet() {
        if (document.querySelector('.attention-header')?.textContent.includes('Не подтвержден!')) {
            const targetDiv = document.querySelector('.form-actions');
            if (targetDiv) {
                const button = document.createElement('button');
                button.id = 'custom-verification-button';
                button.className = 'btn btn-info';
                button.innerHTML = '<i class="fa fa-plus"></i> На верифікацію';
                button.style.marginLeft = '10px';
                targetDiv.appendChild(button);

                button.addEventListener('click', (event) => {
                    event.preventDefault();

                    Swal.fire({
                        title: "Відправити на верифікацію",
                        html: `
                        <style>
                            .swal2-popup .swal2-html-container {
                                overflow: visible !important; /* Убираем ограничения области отображения */
                            }
                            .swal2-select {
                                height: auto !important; /* Убираем фиксированную высоту */
                                max-height: 150px; /* Ограничиваем максимальную высоту */
                                width: 85%; /* Растягиваем на всю ширину */
                                margin-bottom: 10px; /* Добавляем отступ */
                                overflow-y: auto; /* Прокрутка при большом количестве элементов */
                                box-sizing: border-box; /* Учитываем паддинги */
                            }
                            select {
                                max-width: 100%; /* Ограничиваем ширину */
                                font-size: 14px; /* Делаем текст аккуратным */
                                padding: 5px; /* Добавляем внутренний отступ */
                            }
                            option {
                                font-size: 14px; /* Текст для опций меньше */
                                padding: 4px; /* Внутренний отступ для опций */
                            }
                        </style>
                        <label for="department-select">Оберіь відділ</label>
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
                        confirmButtonText: "Відправити",
                        cancelButtonText: "Скасувати",
                        preConfirm: () => {
                            const department = document.getElementById('department-select').value;
                            const reason = document.getElementById('reason-select').value;

                            if (!department || !reason) {
                                Swal.showValidationMessage("Будь ласка, оберіть всі параметри");
                                return false;
                            }
                            return { department, reason };
                        }
                    }).then(result => {
                        if (result.isConfirmed) {
                            const { department, reason } = result.value;
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
                            console.log('email', email);


                            const sheetName = project === 'betking'
                            ? kingSheet
                            : (project === '777'
                               ? sevensSheet
                               : (project === 'vegas'
                                  ? vegasSheet
                                  : ''));

                            getAccessToken().then(accessToken => {
                                const dataToInsert = {
                                    url: window.location.href,
                                    playerID: playerID,
                                    date: '',
                                    name: name,
                                    email: email,
                                    department: department,
                                    reason: reason
                                };
                                console.log(dataToInsert)
                                sendDataToGoogleSheet(accessToken, sheetName, dataToInsert);
                            }).catch(err => {
                                console.error("Error getting Access Token:", err);
                            });

                            Swal.fire({
                                icon: "success",
                                title: "Успішно!",
                                text: `Додали у таблицю.\nВідділ: ${department}\nПричина: ${reason}`,
                            });
                        }
                    });
                });
            }
        }
    }

    function makeBonusClickable() {
        document.querySelectorAll('td').forEach(td => {
            const bonusMatch = td.textContent.match(/бонус(а)? №\s*(\d+)/i);
            if (bonusMatch) {
                const bonusNumber = bonusMatch[2];

                const link = document.createElement('a');
                link.href = '#';
                link.textContent = `№ ${bonusNumber}`;
                link.style.color = 'blue';
                link.style.cursor = 'pointer';
                link.addEventListener('click', (event) => {
                    event.preventDefault();
                    fetchBonusInfo(bonusNumber);
                });

                td.innerHTML = td.innerHTML.replace(
                    bonusMatch[0],
                    `бонуса <a href="#" style="color: blue; cursor: pointer;">№ ${bonusNumber}</a>`
                );
                td.querySelector('a').addEventListener('click', (event) => {
                    event.preventDefault();
                    fetchBonusInfo(bonusNumber);
                });
            }
        });
    }

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


    function fetchBonusInfo(bonusNumber) {
        const project = getProject();
        console.log(project)
        const url = `${ProjectUrl}bonuses/bonusesItems/preview/${bonusNumber}/`;

        fetch(url, {
            method: 'POST',
            headers: {
                "accept": "*/*",
                "x-requested-with": "XMLHttpRequest"
            },
            credentials: 'include'
        })
            .then(response => response.text())
            .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            let modalContent = doc.querySelector('.modal-content');

            if (modalContent) {
                const closeButton = modalContent.querySelector('button.close');
                if (closeButton) {
                    closeButton.remove();
                }

                showPopup(modalContent.innerHTML);
            } else {
                alert('Ошибка: не удалось получить данные о бонусе.');
            }
        })
            .catch(error => {
            console.error('Ошибка при запросе бонуса:', error);
        });
    }


    function showPopup(content) {
        let popup = document.getElementById('custom-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'custom-popup';
            popup.style.position = 'fixed';
            popup.style.top = '10%';
            popup.style.left = '50%';
            popup.style.transform = 'translate(-50%, 0)';
            popup.style.backgroundColor = '#fff';
            popup.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
            popup.style.zIndex = '9999';
            popup.style.width = '60%';
            popup.style.padding = '20px';
            popup.style.borderRadius = '8px';
            popup.style.overflowY = 'auto';
            popup.style.maxHeight = '80%';

            const closeButton = document.createElement('button');
            closeButton.textContent = 'Закрыть';
            closeButton.style.position = 'absolute';
            closeButton.style.top = '10px';
            closeButton.style.right = '10px';
            closeButton.style.backgroundColor = 'red';
            closeButton.style.color = 'white';
            closeButton.style.border = 'none';
            closeButton.style.padding = '5px 10px';
            closeButton.style.cursor = 'pointer';
            closeButton.addEventListener('click', () => {
                popup.remove();
            });

            popup.appendChild(closeButton);
            document.body.appendChild(popup);
        }

        popup.innerHTML = content;
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;'; // Крестик
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.backgroundColor = 'transparent';
        closeButton.style.color = 'red';
        closeButton.style.border = 'none';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';

        closeButton.addEventListener('click', () => {
            popup.remove();
        });
        popup.innerHTML = content;
        popup.appendChild(closeButton);
    }

    function addUSACheckButton(TotalPA, moneyFromOfferPercentage, activityMoneyPercentage, totalPendings) {
        const formatableTextDiv = document.getElementById('formatable-text-antifraud_manager');
        if (formatableTextDiv) {
            const existingButton = document.getElementById('check-button');
            if (existingButton) {
                existingButton.remove();
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
                let textToInsert = `${date} в ${time} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span> | Freemoney From Offer: ${moneyFromOfferPercentage}% | Freemoney From Activities: ${activityMoneyPercentage.toFixed(2)}%</b> `;
                if (totalPendings > 1) {
                    const balanceStyle = totalPendings > 2000 ? 'color: red;' : '';
                    textToInsert += `<b>| На выплате:</b> <b style="${balanceStyle}">${totalPendings}$</b> | `;
                }
                insertTextIntoField(textToInsert);
            };

            formatableTextDiv.insertBefore(checkButton, formatableTextDiv.firstChild);
        }
    }

    async function createUSAPopupBox() {
        let popupBox = document.getElementById('custom-popup-box');
        if (popupBox) {
            return;
        }
        async function fetchMonthAndTotalPA() {
            async function getInOutUrl() {
                const scripts = document.querySelectorAll('script');
                for (const script of scripts) {
                    const scriptContent = script.textContent;
                    if (scriptContent.includes('#show-player-in-out')) {
                        const urlMatch = scriptContent.match(/url:\s*'([^']+)'/);
                        if (urlMatch) {
                            return urlMatch[1];
                        }
                    }
                }
                return null;
            }

            try {
                const url = await getInOutUrl();
                if (!url) {
                    console.error('URL не найден');
                    return null;
                }
                const response = await $.ajax({
                    type: 'GET',
                    url: url,
                });
                const { totalInOut: TotalPA, monthInOut: MonthPA } = response;
                if (TotalPA === undefined || MonthPA === undefined) {
                    console.error('Не удалось получить TotalPA или MonthPA');
                    return null;
                }
                return { TotalPA, MonthPA };
            } catch (error) {
                console.error('Ошибка при получении данных:', error);
                return null;
            }
        }
        setTimeout(async function() {

            const result = await fetchMonthAndTotalPA();
            const TotalPA = result.TotalPA;
            const MonthPA = result.MonthPA;

            const entries = document.querySelector('#Players_balance').value.trim();
            const winnings = getWinnings();
            popupBox = document.createElement('div');
            popupBox.style.position = 'fixed';
            popupBox.style.top = '20px';
            popupBox.style.right = '';

            const popupWidth = 305;
            popupBox.style.left = `calc(100% - ${popupWidth + 20}px)`;
            popupBox.style.width = `${popupWidth}px`;

            const dragHandle = document.createElement('div');
            dragHandle.style.position = 'absolute';
            dragHandle.style.top = '0';
            dragHandle.style.left = '0';
            dragHandle.style.width = '100%';
            dragHandle.style.height = '20px';
            dragHandle.style.cursor = 'move';
            popupBox.appendChild(dragHandle);

            let isDragging = false;
            let offsetX, offsetY;

            dragHandle.addEventListener('mousedown', function (e) {
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

            popupBox.style.padding = '20px';
            popupBox.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            popupBox.style.border = `2px solid black`;
            popupBox.style.boxShadow = `0px 4px 12px rgba(0, 0, 0, 0.1)`;
            popupBox.style.zIndex = '10000';
            popupBox.style.fontFamily = '"Roboto", sans-serif';
            popupBox.style.fontSize = '16px';
            popupBox.style.display = 'flex';
            popupBox.style.flexDirection = 'column';
            popupBox.style.alignItems = 'center';
            popupBox.style.borderRadius = '10px';
            popupBox.style.animation = 'glow 1s infinite alternate';
            popupBox.style.resize = 'both';
            popupBox.style.overflow = 'auto';

            const settingsIcon = document.createElement('div');
            settingsIcon.innerHTML = '<i class="fa fa-cog"></i>';
            settingsIcon.style.position = 'absolute';
            settingsIcon.style.top = '10px';
            settingsIcon.style.right = '10px';
            settingsIcon.style.cursor = 'pointer';
            settingsIcon.style.fontSize = '20px';
            settingsIcon.title = 'Налаштування';
            settingsIcon.onclick = () => {
                createSettingsPopup();
            };
            popupBox.appendChild(settingsIcon);

            const statisticIcon = document.createElement('div');
            statisticIcon.innerHTML = '<i class="fa fa-signal"></i>';
            statisticIcon.style.position = 'absolute';
            statisticIcon.style.top = '35px';
            statisticIcon.style.right = '10px';
            statisticIcon.style.cursor = 'pointer';
            statisticIcon.style.fontSize = '20px';
            statisticIcon.title = 'Статистика';
            statisticIcon.onclick = () => {
                createStatisticPopup();
            };
            popupBox.appendChild(statisticIcon);

            const status = await checkUserStatus();
            console.log(status)

            if (status === 'Admin') {
                const adminIcon = document.createElement('div');
                adminIcon.innerHTML = '<i class="fa fa-users"></i>';
                adminIcon.style.position = 'absolute';
                adminIcon.style.top = '70px';
                adminIcon.style.right = '10px';
                adminIcon.style.cursor = 'pointer';
                adminIcon.style.fontSize = '18px';
                adminIcon.title = 'Користувачі';
                adminIcon.onclick = () => {
                    if (document.getElementById('admin-popup')) {
                        return;
                    }
                    createAdminPopup();
                };
                popupBox.appendChild(adminIcon);
            }

            const fraudIcon = document.createElement('div');
            fraudIcon.style.position = 'absolute';
            fraudIcon.style.top = '10px';
            fraudIcon.style.left = '10px';
            fraudIcon.style.cursor = 'pointer';
            fraudIcon.style.fontSize = '20px';
            fraudIcon.title = 'Нагляд';
            fraudIcon.innerHTML = '<i class="fa fa-eye"></i>';

            fraudIcon.onclick = () => {
                createFraudPopup();
            };
            popupBox.appendChild(fraudIcon);

            const showReminder = GM_getValue(reminderDisplayKey, true);

            const shouldBlink = GM_getValue(reminderBlinkKey, true);
            const hasNewArticles = await checkForNewArticles();

            if (showReminder === true) {
                const reminderIcon = document.createElement('div');
                reminderIcon.style.position = 'absolute';
                reminderIcon.style.top = '40px';
                reminderIcon.style.left = '10px';
                reminderIcon.style.fontSize = '20px';
                reminderIcon.style.cursor = 'pointer';
                reminderIcon.title = 'Памятка';
                reminderIcon.innerHTML = '<i class="fa fa-book"></i>';

                if (hasNewArticles || shouldBlink) {
                    reminderIcon.classList.add('blinking');
                }

                reminderIcon.onclick = () => {
                    createReminderPopup();
                    reminderIcon.classList.remove('blinking');
                    GM_setValue(reminderBlinkKey, false);
                };

                popupBox.appendChild(reminderIcon);
            }

            const maintext = document.createElement('div');
            maintext.className = 'popup-main-text';
            maintext.innerHTML = `
                        <center><h3 id="freemoney-info"></center>
                        <center><b>Entries: ${entries}$ | Winnings: ${winnings}$</center>
                        <center>Month: <span style="color: ${MonthPA < 0.75 ? 'green' : (MonthPA >= 0.75 && MonthPA < 1 ? 'orange' : 'red')}">${MonthPA}</span> | Total: <span style="color: ${TotalPA < 0.75 ? 'green' : (TotalPA >= 0.75 && TotalPA < 1 ? 'orange' : 'red')}">${TotalPA}</span></center>
                        <center id="pending-info"></center>
                        <center id="offer-info">Loading deposit analysis...</center>
                        <center id="activitymoney-info"></center>

                    `;
            popupBox.appendChild(maintext);

            const firstRowButtonContainer = document.createElement('div');
            firstRowButtonContainer.style.marginTop = '10px';
            firstRowButtonContainer.style.display = 'flex';
            firstRowButtonContainer.style.gap = '10px';

            popupBox.appendChild(firstRowButtonContainer);

            const cleanButton = document.createElement('button');
            cleanButton.className = 'clean-button';
            cleanButton.innerText = 'Checked';
            cleanButton.style.padding = '5px 10px';
            cleanButton.style.backgroundColor = '#2196F3';
            cleanButton.style.color = 'white';
            cleanButton.style.border = 'none';
            cleanButton.style.borderRadius = '5px';
            cleanButton.style.cursor = 'pointer';

            cleanButton.addEventListener('click', () => {
                if (cleanButton.disabled) return;

                const initials = GM_getValue(initialsKey, '');
                const currentDate = getCurrentDate();
                const playerID = getPlayerID();
                const project = getProject();
                const url = window.location.href;
                const time = getCurrentTime();

                const dataToInsert = {
                    date: currentDate,
                    url: url,
                    project: project,
                    playerID: playerID,
                    initials: initials,
                    comment: `Переглянутий в ${time}`,
                };

                const token = localStorage.getItem('authToken');

                sendDataToServer(dataToInsert, token)
                    .then(response => {
                    console.log('Data sent successfully:', response);
                    Swal.fire({
                        icon: 'success',
                        title: 'Успішно!',
                        text: 'Користувач позначений як переглянутий',
                        confirmButtonText: 'ОК'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            location.reload();
                        }
                    });
                })
                    .catch(err => {
                    console.error('Error sending data:', err);
                    Swal.fire({
                        icon: 'error',
                        title: 'Помилка!',
                        text: 'Не вдалося надіслати дані.',
                        confirmButtonText: 'ОК'
                    });
                });
            });

            firstRowButtonContainer.appendChild(cleanButton);

            const secondRowButtonContainer = document.createElement('div');
            secondRowButtonContainer.style.marginTop = '10px';
            secondRowButtonContainer.style.display = 'block';
            secondRowButtonContainer.style.justifyContent = 'center';
            secondRowButtonContainer.style.alignItems = 'center';
            secondRowButtonContainer.style.textAlign = 'center';
            getPendings(function(totalPending) {

                const pendingInfoElement = document.getElementById('pending-info');
                if (totalPending === 0) {
                    pendingInfoElement.remove();
                } else {
                    pendingInfoElement.textContent = `Total Pending: ${totalPending}$`;
                }
                let isProfitButtonClicked = false;

                const profitButton = document.createElement('button');
                profitButton.innerText = 'Total InOut';
                profitButton.style.padding = '5px 10px';
                profitButton.style.backgroundColor = '#2196F3';
                profitButton.style.color = 'white';
                profitButton.style.border = 'none';
                profitButton.style.borderRadius = '5px';
                profitButton.style.cursor = 'pointer';
                profitButton.addEventListener('click', () => {
                    if (!isProfitButtonClicked) {
                        isProfitButtonClicked = true;
                        fetchProfit(totalPending, winnings);
                    }
                });
                secondRowButtonContainer.appendChild(profitButton);
            })

            popupBox.appendChild(secondRowButtonContainer);


            document.body.appendChild(popupBox);

            analyzePayments(function(offerPercentage, totalMoneyFromOffer, totalDeposits, moneyFromOfferPercentage, totalDepositsAmount, depositsWithOffer) {
                const offerInfoElement = document.getElementById('offer-info');

                if (offerInfoElement) {
                    const colorText = (text, condition) => condition ? `<span style="color: red;">${text}</span>` : text;

                    const offerPercentageText = colorText(`Deposits With Offer: ${offerPercentage}%`, offerPercentage >= 50);
                    const moneyFromOfferPercentageText = colorText(`Money From Offer: ${moneyFromOfferPercentage}%`, moneyFromOfferPercentage >= 25);

                    offerInfoElement.innerHTML = `${offerPercentageText}<br>${moneyFromOfferPercentageText}`;
                    offerInfoElement.title = `Кількість депозитів: ${totalDeposits}\nКількість оферів: ${depositsWithOffer}\nСума депозитів: ${totalDepositsAmount}$\nСума entries: ${totalMoneyFromOffer}$`;
                }
                analyzeTransaction(function(totalUSD) {
                    const activityMoneyInfoElement = document.getElementById('activitymoney-info');
                    const activityMoneyPercentage = totalDepositsAmount > 0 ? (totalUSD / totalDepositsAmount) * 100 : 0;

                    if (activityMoneyInfoElement) {
                        const colorText = (text, condition) => condition ? `<span style="color: red;">${text}</span>` : text;
                        const activityMoneyPercentageText = colorText(`Activity Money: ${activityMoneyPercentage.toFixed(2)}%`, activityMoneyPercentage >= 50);

                        activityMoneyInfoElement.innerHTML = `${activityMoneyPercentageText}`;
                        activityMoneyInfoElement.title = `Activity Money: ${totalUSD}$`;

                        const freeMoneyInfoElement = document.getElementById('freemoney-info');
                        let freeMoneyTotal = activityMoneyPercentage + parseFloat(moneyFromOfferPercentage)
                        let textColor;
                        if (freeMoneyTotal < 10) {
                            textColor = 'green';
                        } else if (freeMoneyTotal >= 10 && freeMoneyTotal < 50) {
                            textColor = 'orange';
                        } else {
                            textColor = 'red';
                        }
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
                            addUSACheckButton(TotalPA, moneyFromOfferPercentage, activityMoneyPercentage, totalPendings);
                        }).catch(error => {
                            console.error('Ошибка при получении данных:', error);
                        });


                    }
                });
            });

            function fetchProfit(totalPending, winnings) {
                const loader = document.createElement('div');
                loader.style.border = '8px solid #f3f3f3';
                loader.style.borderTop = '8px solid #3498db';
                loader.style.borderRadius = '50%';
                loader.style.width = '50px';
                loader.style.height = '50px';
                loader.style.animation = 'spin 2s linear infinite';
                loader.style.marginBottom = '10px';
                secondRowButtonContainer.appendChild(loader);

                const style = document.createElement('style');
                style.textContent = `
                                @keyframes spin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                                #popup-container {
                                    min-height: 200px;
                                    overflow-y: auto;
                                    white-space: normal;
                                    word-wrap: break-word;
                                }
                            `;
                document.head.appendChild(style);

                const playerID = getPlayerID();
                const project = getProject();
                const baseURL = `https://admin.${project}.com/players/playersDetail/index/`;

                GM_xmlhttpRequest({
                    method: 'POST',
                    url: baseURL,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: `PlayersDetailForm%5Blogin%5D=${encodeURIComponent(playerID)}&PlayersDetailForm%5Bperiod%5D=2015.06.09+00%3A00%3A00+-+2025.05.23+23%3A59%3A59&PlayersDetailForm%5Bshow_table%5D=1`,
                    onload: function(response) {
                        if (response.status >= 200 && response.status < 300) {
                            console.log('HTML-ответ:', response.responseText);

                            const parser = new DOMParser();
                            const doc = parser.parseFromString(response.responseText, 'text/html');

                            const table = doc.querySelector('.detail-view');
                            let depositsTotal = 0;
                            let redeemsTotal = 0;

                            if (table) {
                                const rows = table.querySelectorAll('tr');

                                rows.forEach(row => {
                                    const key = row.querySelector('th')?.textContent.trim();
                                    const value = row.querySelector('td')?.textContent.trim();

                                    if (key === 'Deposits Total') {
                                        depositsTotal = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
                                    } else if (key === 'Redeems Total') {
                                        redeemsTotal = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
                                    }
                                });

                                let cleanBalance = parseFloat(winnings);

                                const profit = depositsTotal - redeemsTotal;
                                const PrognoseInOut = depositsTotal - (totalPending + redeemsTotal + cleanBalance);
                                const PrognosePA = ((redeemsTotal + totalPending + cleanBalance) / depositsTotal) * 100;

                                secondRowButtonContainer.removeChild(loader);
                                secondRowButtonContainer.innerHTML += `
                                                <div><b>Total InOut: ${profit.toFixed(2)}$</b></div>
                                                ${(totalPending > 1 || cleanBalance > 1) ? `
                                                    <div><b>Prognose InOut: ${PrognoseInOut.toFixed(2)}$</b></div>
                                                    <div><b>Prognose PA: ${PrognosePA.toFixed(2)}%</b></div>
                                                ` : ''}
                                            `;
                            } else {
                                secondRowButtonContainer.removeChild(loader);
                                secondRowButtonContainer.innerHTML += 'Таблица с результатами не найдена.';
                            }
                        } else {
                            console.error('Ошибка ответа:', response.statusText);
                            document.body.removeChild(loader);
                            secondRowButtonContainer.innerHTML += `Ошибка получения данных: ${response.statusText}`;
                        }
                    },
                    onerror: function(error) {
                        console.error('Ошибка запроса:', error);
                        document.body.removeChild(loader);
                        secondRowButtonContainer.innerHTML += 'Ошибка запроса: ' + error.message;
                    }
                });
            }
            ;
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

    window.addEventListener('load', async function() {
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
                buttonToSave();
                checkUserInFraudList();
                activeUrlsManagers();
                checkUserInChecklist();
                updateBanButton();
                checkForUpdates();
                document.addEventListener('keydown', handleShortcut);
                handlePopup();
                createCheckIPButton();
                checkAutoPayment();
                goToGoogleSheet();
                addAgeToBirthdate();
                const isFastPaintCardsEnabled = GM_getValue(fastPaintCardsDisplayKey, true);
                if (isFastPaintCardsEnabled) {
                    changeCardStatus();
                    new MutationObserver(() => {
                        changeCardStatus();
                    }).observe(document.querySelector('#payments-cards-masks-parent'), { childList: true, subtree: true });
                }
            } else if (currentHost.includes('wildwinz') && currentUrl.includes('players/playersItems/update')) {
                addForeignButton();
                buttonToSave();
                checkUserInFraudList();
                activeUrlsManagers();
                checkUserInChecklist();
                updateBanButton();
                checkForUpdates();
                handlePopupWildWinz();
            } else if (currentHost.endsWith('.com') && currentUrl.includes('players/playersItems/update')) {
                createUSAPopupBox();
                analyzeTransaction();
                buttonToSave();
                checkUserInFraudList();
                checkUserInChecklist();
                activeUrlsManagers();
            } else if (currentHost.endsWith('.com') && currentUrl.includes('playersItems/balanceLog/')) {
                setPageSize1k()
            } else if (currentUrl.includes('c1265a12-4ff3-4b1a-a893-2fa9e9d6a205') || currentUrl.includes('92548677-d140-49c4-b5e5-9015673f461a') || currentUrl.includes('3fe70d7e-65c7-4736-a707-6f40d3de125b') || currentUrl.includes('b301aace-d9bb-4c7e-8efc-5d97782ab294') || currentUrl.includes('72c0a614-e695-4cb9-b884-465b04cfb2c5') || currentUrl.includes('6705e06d-cf36-47e5-ace3-0400e15b2ce2')) {
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
            localStorage.removeItem('authToken');
            createLoginForm();
        }
    });
})();
