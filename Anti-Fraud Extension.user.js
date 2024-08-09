// ==UserScript==
// @name         Anti-Fraud Extension
// @namespace    http://tampermonkey.net/
// @version      3.3.4
// @description  Расширение для удобства АнтиФрод команды
// @author       Maxim Rudiy
// @match        https://admin.slotoking.ua/*
// @match        https://admin.777.ua/*
// @updateURL 	 https://github.com/mrudiy/Anti-Fraud-Extension/raw/main/Anti-Fraud%20Extension.user.js
// @downloadURL  https://github.com/mrudiy/Anti-Fraud-Extension/raw/main/Anti-Fraud%20Extension.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      admin.777.ua
// @connect      admin.slotoking.ua
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function() {
    'use strict';

    let popupBox;
    const currentUrl = window.location.href;
    const initialsKey = 'userInitials';
    const urlPath = window.location.pathname;
    const userId = urlPath.split('/')[4];
    const ProjectUrl = window.location.hostname.includes('777.ua')
    ? 'https://admin.777.ua/'
    : 'https://admin.slotoking.ua/';
    const initialUrl = window.location.href;
    const sharedStorageKey = 'highlightRulesShared';
    const languageKey = 'language';

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
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(text);
            range.insertNode(textNode);

            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            sel.removeAllRanges();
            sel.addRange(range);

            const event = new Event('input', { bubbles: true });
            range.commonAncestorContainer.dispatchEvent(event);
        }
    }

    function addForeignButton() {
        const formatableTextDiv = document.getElementById('formatable-text-common');
        if (formatableTextDiv) {
            const foreignButton = document.createElement('button');
            foreignButton.type = 'button';
            foreignButton.innerText = 'Чужая';
            foreignButton.onclick = () => {
                const date = getCurrentDateFormatted();
                const textToInsert = `${date} <b><font color="#ff0000">ЧУЖАЯ</font></b>`;
                insertTextAtCursor(textToInsert);
            };

            formatableTextDiv.insertBefore(foreignButton, formatableTextDiv.firstChild);
        }
    }

    function addCheckButton(TotalPA, Balance, totalPending) {
        const formatableTextDiv = document.getElementById('formatable-text-antifraud_manager');
        if (formatableTextDiv) {
            const checkButton = document.createElement('button');
            checkButton.type = 'button';
            checkButton.innerText = 'Check';
            checkButton.onclick = () => {
                const date = getCurrentDate();
                const initials = GM_getValue(initialsKey);
                const currentLanguage = GM_getValue(languageKey, 'російська');

                let textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: ${TotalPA}</b> | `;

                if (currentLanguage === 'українська') {

                    if (Balance > 1) {
                        const balanceStyle = Balance > 1000000 ? 'color: red;' : '';
                        textToInsert += `<b>На балансі:</b> <b style="${balanceStyle}">${Balance}₴</b> | `;
                    }

                    if (totalPending > 1) {
                        const pendingStyle = totalPending > 1000000 ? 'color: red;' : '';
                        textToInsert += `<b>На виплаті:</b> <b style="${pendingStyle}">${totalPending}₴ </b>| `;
                    }
                } else {
                    if (Balance > 1) {
                        const balanceStyle = Balance > 1000000 ? 'color: red;' : '';
                        textToInsert += `<b>На балансе:</b> <b style="${balanceStyle}">${Balance}₴</b> | `;
                    }

                    if (totalPending > 1) {
                        const pendingStyle = totalPending > 1000000 ? 'color: red;' : '';
                        textToInsert += `<b>На выплате:</b> <b style="${pendingStyle}">${totalPending}₴ </b>| `;
                    }
                }

                insertTextIntoField(textToInsert);
            };

            formatableTextDiv.insertBefore(checkButton, formatableTextDiv.firstChild);
        }
    }



    function createSettingsPopup() {
        const settingsPopup = document.createElement('div');
        settingsPopup.style.position = 'fixed';
        settingsPopup.style.top = '10px';
        settingsPopup.style.right = '10px';
        settingsPopup.style.padding = '10px';
        settingsPopup.style.backgroundColor = 'white';
        settingsPopup.style.border = '1px solid black';
        settingsPopup.style.boxShadow = '0px 0px 5px rgba(0, 0, 0, 0.3)';
        settingsPopup.style.zIndex = '10001';
        settingsPopup.style.fontFamily = 'Arial, sans-serif';
        settingsPopup.style.fontSize = '14px';
        settingsPopup.style.borderRadius = '5px';

        const header = document.createElement('h2');
        header.innerText = 'Налаштування';
        header.style.fontSize = '16px';
        settingsPopup.appendChild(header);

        const initialsDisplay = document.createElement('p');
        const userInitials = GM_getValue(initialsKey, '');
        initialsDisplay.innerText = `Ваші ініціали: ${userInitials}`;
        settingsPopup.appendChild(initialsDisplay);

        const languageDisplay = document.createElement('p');
        let currentLanguage = GM_getValue(languageKey, 'російська');
        languageDisplay.innerText = `Встановлена мова: ${currentLanguage}`;
        settingsPopup.appendChild(languageDisplay);

        const initialsButton = document.createElement('button');
        initialsButton.innerText = 'Вказати ініціали';
        initialsButton.style.padding = '8px 16px';
        initialsButton.style.backgroundColor = '#4CAF50';
        initialsButton.style.color = 'white';
        initialsButton.style.border = 'none';
        initialsButton.style.borderRadius = '4px';
        initialsButton.style.cursor = 'pointer';
        initialsButton.addEventListener('click', () => {
            const userInitials = prompt('Введіть свої ініціали (наприклад, РМ):', GM_getValue(initialsKey, ''));
            if (userInitials !== null) {
                GM_setValue(initialsKey, userInitials);
                initialsDisplay.innerText = `Ваші ініціали: ${userInitials}`;
            }
        });
        settingsPopup.appendChild(initialsButton);

        const languageButton = document.createElement('button');
        languageButton.innerText = `Змінити мову на ${currentLanguage === 'російська' ? 'українська' : 'російська'}`;
        languageButton.style.padding = '8px 16px';
        languageButton.style.backgroundColor = '#2196F3';
        languageButton.style.color = 'white';
        languageButton.style.border = 'none';
        languageButton.style.borderRadius = '4px';
        languageButton.style.cursor = 'pointer';
        languageButton.addEventListener('click', () => {
            currentLanguage = currentLanguage === 'російська' ? 'українська' : 'російська';
            GM_setValue(languageKey, currentLanguage);
            languageDisplay.innerText = `Встановлена мова: ${currentLanguage}`;
            languageButton.innerText = `Змінити мову на ${currentLanguage === 'російська' ? 'українська' : 'російська'}`;
        });
        settingsPopup.appendChild(languageButton);

        const closeButton = document.createElement('button');
        closeButton.innerText = 'Закрити';
        closeButton.style.padding = '8px 16px';
        closeButton.style.backgroundColor = '#f44336';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(settingsPopup);
        });
        settingsPopup.appendChild(closeButton);

        document.body.appendChild(settingsPopup);
    }

    function calculatePendingAmount() {
        let totalPending = 0;

        const rows = document.querySelectorAll('tr');
        rows.forEach(row => {
            const statusSpan = row.querySelector('span.label');
            if (statusSpan && (statusSpan.textContent.trim() === 'pending' || statusSpan.textContent.trim() === 'review')) {
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

    function getCurrentDate() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${day}.${month}.${year}`;
    }

    function getBalance() {
        const balanceInput = document.querySelector('#Players_balance');
        if (balanceInput) {
            return balanceInput.value.trim();
        }

        const rows = document.querySelectorAll('tr');
        for (const row of rows) {
            if (row.textContent.includes('Баланс')) {
                const cells = row.querySelectorAll('td');
                if (cells.length > 0) {
                    return cells[0].textContent.trim();
                }
            }
        }

        return '0.00';
    }

    function clickButton() {
        const button = document.querySelector('#show-player-in-out');
        if (button) {
            button.click();
        }
    }

    function getPlayerID() {
        const rows = document.querySelectorAll('tr');
        for (const row of rows) {
            if (row.textContent.includes('Номер игрока')) {
                const cells = row.querySelectorAll('td');
                if (cells.length > 0) {
                    return cells[0].textContent.trim();
                }
            }
        }
        return '0.00';
    }
    function insertTextIntoField(text) {
        const field = document.querySelector('#gateway-method-description-visible-antifraud_manager');
        if (field) {
            field.focus();
            field.innerHTML = text + '<br>' + field.innerHTML;

            const event = new Event('input', { bubbles: true });
            field.dispatchEvent(event);
        }
    }
    let isProfitButtonClicked = false;

    function createPopupBox(MonthPA, TotalPA, Balance, NDFL, totalPending) {
        if (popupBox) {
            return;
        }

        const currentUrl = window.location.href;
        const checkbox = document.getElementById('Players_enabled_autopayouts');

        popupBox = document.createElement('div');
        popupBox.style.position = 'fixed';
        popupBox.style.top = '10px';
        popupBox.style.right = '10px';
        popupBox.style.padding = '10px';
        popupBox.style.backgroundColor = 'white';
        popupBox.style.border = '2px solid black';
        popupBox.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
        popupBox.style.zIndex = '10000';
        popupBox.style.fontFamily = 'Arial, sans-serif';
        popupBox.style.fontSize = '16px';
        popupBox.style.display = 'flex';
        popupBox.style.flexDirection = 'column';
        popupBox.style.alignItems = 'center';
        popupBox.style.borderRadius = '10px';

        const maintext = document.createElement('div');
        maintext.className = 'popup-main-text';
        maintext.innerHTML = `
    <center><b>Баланс: ${Balance}₴</b></center>
    <center><b>НДФЛ: ${NDFL}₴</center></b>
    <center><b>Month: ${MonthPA} | Total: ${TotalPA} |</b></center>
    ${totalPending > 1 ? `<center><b>На виплаті:\n${totalPending}₴</b></center>` : ''}
`;
        popupBox.appendChild(maintext);

        const text = document.createElement('div');
        text.className = 'popup-text';
        text.innerHTML = ``;

        popupBox.appendChild(text);

        const settingsIcon = document.createElement('div');
        settingsIcon.innerHTML = '&#9881;';
        settingsIcon.style.position = 'absolute';
        settingsIcon.style.top = '5px';
        settingsIcon.style.right = '5px';
        settingsIcon.style.cursor = 'pointer';
        settingsIcon.style.fontSize = '18px';
        settingsIcon.title = 'Settings';
        settingsIcon.onclick = () => {
            createSettingsPopup();
        };
        popupBox.appendChild(settingsIcon);

        const statusIcon = document.createElement('div');
        statusIcon.style.position = 'absolute';
        statusIcon.style.top = '5px';
        statusIcon.style.left = '5px';
        statusIcon.style.fontSize = '18px';
        statusIcon.style.cursor = 'pointer';

        const updateStatusIcon = () => {
            if (checkbox) {
                statusIcon.innerHTML = checkbox.checked ? '&#10004;' : '&#10008;';
            } else {
                statusIcon.innerHTML = '&#10008;';
            }
        };
        updateStatusIcon();

        statusIcon.onclick = () => {
            checkbox.click();

            setTimeout(() => {
                const confirmButton = document.querySelector('.swal2-confirm');
                if (confirmButton) {
                    confirmButton.click();
                }

                setTimeout(updateStatusIcon, 200);
            }, 200);
        };

        popupBox.appendChild(statusIcon);


        const firstRowButtonContainer = document.createElement('div');
        firstRowButtonContainer.style.marginTop = '10px';
        firstRowButtonContainer.style.display = 'flex';
        firstRowButtonContainer.style.gap = '10px';

        const cleanButton = document.createElement('button');
        cleanButton.innerText = 'Чистий';
        cleanButton.style.padding = '5px 10px';
        cleanButton.style.backgroundColor = '#4CAF50';
        cleanButton.style.color = 'white';
        cleanButton.style.border = 'none';
        cleanButton.style.borderRadius = '5px';
        cleanButton.style.cursor = 'pointer';
        cleanButton.addEventListener('click', () => {
            const date = getCurrentDate();
            const initials = GM_getValue(initialsKey, '');
            const currentLanguage = GM_getValue(languageKey, 'російська'); 

            let textToInsert;

            if (currentLanguage === 'російська') {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: ${TotalPA}</b> | играет <b><font color="#14b814">своими</font></b> картами, чист`;
            } else if (currentLanguage === 'українська') {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: ${TotalPA}</b> | грає <b><font color="#14b814">власними</font></b> картками, чистий`;
            } else {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: ${TotalPA}</b> | играет <b><font color="#14b814">своими</font></b> картами, чист`;
            }

            insertTextIntoField(textToInsert);
        });
        firstRowButtonContainer.appendChild(cleanButton);

        const foreignButton = document.createElement('button');
        foreignButton.innerText = 'Чужа';
        foreignButton.style.padding = '5px 10px';
        foreignButton.style.backgroundColor = '#f44336';
        foreignButton.style.color = 'white';
        foreignButton.style.border = 'none';
        foreignButton.style.borderRadius = '5px';
        foreignButton.style.cursor = 'pointer';
        foreignButton.addEventListener('click', () => {
            const date = getCurrentDate();
            const initials = GM_getValue(initialsKey, '');
            const currentLanguage = GM_getValue(languageKey, 'російська');

            let textToInsert;

            if (currentLanguage === 'російська') {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: ${TotalPA}</b> | играет <b><font color="#ff0000">чужими</font></b> картами, <b>авто отключаем</b>`;
            } else if (currentLanguage === 'українська') {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: ${TotalPA}</b> | грає <b><font color="#ff0000">чужими</font></b> картками, <b>авто відключаємо</b>`;
            } else {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: ${TotalPA}</b> | играет <b><font color="#ff0000">чужими</font></b> картами, <b>авто отключаем</b>`;
            }

            insertTextIntoField(textToInsert);
        });
        firstRowButtonContainer.appendChild(foreignButton);

        popupBox.appendChild(firstRowButtonContainer);

        const secondRowButtonContainer = document.createElement('div');
        secondRowButtonContainer.style.marginTop = '10px';
        secondRowButtonContainer.style.display = 'flex';
        secondRowButtonContainer.style.gap = '10px';

        const pendingPlusButton = document.createElement('button');
        pendingPlusButton.innerText = 'Pending (+)';
        pendingPlusButton.style.padding = '5px 10px';
        pendingPlusButton.style.backgroundColor = '#4CAF50';
        pendingPlusButton.style.color = 'white';
        pendingPlusButton.style.border = 'none';
        pendingPlusButton.style.borderRadius = '5px';
        pendingPlusButton.style.cursor = 'pointer';
        pendingPlusButton.addEventListener('click', () => {
            const date = getCurrentDate();
            const initials = GM_getValue(initialsKey, '');
            const currentLanguage = GM_getValue(languageKey, 'російська');

            let textToInsert;

            if (currentLanguage === 'російська') {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: ${TotalPA}</b> | играет <b><font color="#14b814">своими</font></b> картами, чист, много безуспешных попыток депозита своей картой // Без угроз, потом деп прошел`;
            } else if (currentLanguage === 'українська') {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: ${TotalPA}</b> | грає <b><font color="#14b814">власними</font></b> картками, чистий, багато безуспішних спроб депозиту своєю карткою, потім деп пройшов`;
            } else {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: ${TotalPA}</b> | играет <b><font color="#14b814">своими</font></b> картами, чист, много безуспешных попыток депозита своей картой // Без угроз, потом деп прошел`;
            }

            insertTextIntoField(textToInsert);
        });
        secondRowButtonContainer.appendChild(pendingPlusButton);

        const pendingMinusButton = document.createElement('button');
        pendingMinusButton.innerText = 'Pending (-)';
        pendingMinusButton.style.padding = '5px 10px';
        pendingMinusButton.style.backgroundColor = '#f44336';
        pendingMinusButton.style.color = 'white';
        pendingMinusButton.style.border = 'none';
        pendingMinusButton.style.borderRadius = '5px';
        pendingMinusButton.style.cursor = 'pointer';
        pendingMinusButton.addEventListener('click', () => {
            const date = getCurrentDate();
            const initials = GM_getValue(initialsKey, '');
            const currentLanguage = GM_getValue(languageKey, 'російська');

            let textToInsert;

            if (currentLanguage === 'російська') {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: ${TotalPA}</b> | много безуспешных попыток депозита <b>неизвестными</b> картами, <b>авто отключаем</b>`;
            } else if (currentLanguage === 'українська') {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: ${TotalPA}</b> | багато безуспішних спроб депозиту <b>невідомими</b> картками, <b>авто відключаємо</b>`;
            } else {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: ${TotalPA}</b> | много безуспешных попыток депозита <b>неизвестными</b> картами, <b>авто отключаем</b>`;
            }

            insertTextIntoField(textToInsert);
        });
        secondRowButtonContainer.appendChild(pendingMinusButton);

        popupBox.appendChild(secondRowButtonContainer);

        const thirdRowButtonContainer = document.createElement('div');
        thirdRowButtonContainer.style.marginTop = '10px';
        thirdRowButtonContainer.style.display = 'flex';
        thirdRowButtonContainer.style.justifyContent = 'center';

        const resultButton = document.createElement('button');
        resultButton.innerText = 'Total InOut';
        resultButton.style.padding = '5px 10px';
        resultButton.style.backgroundColor = '#2196F3';
        resultButton.style.color = 'white';
        resultButton.style.border = 'none';
        resultButton.style.borderRadius = '5px';
        resultButton.style.cursor = 'pointer';
        resultButton.addEventListener('click', () => {
            if (!isProfitButtonClicked) {
                isProfitButtonClicked = true;
                fetchResults();
            }
        });
        thirdRowButtonContainer.appendChild(resultButton);

        const fourthRowContainer = document.createElement('div');
        fourthRowContainer.style.marginTop = '10px';
        fourthRowContainer.style.display = 'flex';
        fourthRowContainer.style.justifyContent = 'center';

        popupBox.appendChild(thirdRowButtonContainer);
        popupBox.appendChild(fourthRowContainer);

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
        `;
            document.head.appendChild(style);

            const playerID = getPlayerID();
            const baseURL = `${ProjectUrl}players/playersDetail/index/`;

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

                            const profit = depositsTotal - redeemsTotal;

                            fourthRowContainer.removeChild(loader);
                            fourthRowContainer.innerHTML += `<div><b>Total InOut: ${profit.toFixed(2)}₴</b></div>`;
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
        const fullProjectUrl = `${ProjectUrl}players/playersItems/transactionLog/${userId}/`;

        console.log('Запрос данных по URL:', fullProjectUrl);

        GM_xmlhttpRequest({
            method: 'GET',
            url: fullProjectUrl,
            onload: function(response) {
                console.log('Получен ответ от сервера');
                const html = response.responseText;

                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                console.log('HTML успешно распарсен');

                const pageSizeSelect = doc.querySelector('#pageSize');
                if (pageSizeSelect) {
                    pageSizeSelect.value = '1000';
                    const event = new Event('change');
                    pageSizeSelect.dispatchEvent(event);
                    console.log('Изменен размер страницы на 1000');
                } else {
                    console.warn('Элемент выбора размера страницы не найден');
                }

                const rows = Array.from(doc.querySelectorAll('tr'));
                console.log('Найдено строк таблицы:', rows.length);

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

                let messageCount = 0;
                const maxMessages = 3;

                const bonusAssignments = {};

                const displayedMessages = {};

                rows.forEach(row => {
                    if (messageCount >= maxMessages) return;

                    const cells = row.querySelectorAll('td');
                    if (cells.length > 0) {
                        const actionType = cells[1] ? cells[1].innerText.trim() : '';
                        const bonusInfo = cells[6] ? cells[6].textContent.trim() : '';
                        const dateTimeStr = cells[5] ? cells[5].textContent.trim() : '';
                        const dateMatch = dateTimeStr.match(/^(\d{2}\/\d{2}\/\d{4})/);
                        const dateStr = dateMatch ? dateMatch[1] : '';

                        if (actionType.includes('Вывод средств')) {
                            withdrawAmount = parseFloat(cells[2] ? cells[2].textContent.replace('-', '').replace(',', '.') : '0');
                            withdrawId = cells[0] ? cells[0].textContent.trim() : '';
                            withdrawText = cells[6] ? cells[6].textContent.trim() : '';
                            waitingForBonus = true;
                        } else if (actionType.includes('Ввод средств')) {
                            withdrawAmount = 0;
                            balanceAfterBonus = 0;
                            waitingForBonus = false;
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
                            bonusText = cells[6] ? cells[6].textContent.trim() : '';
                            const fullDate = cells[5] ? cells[5].textContent.trim() : '';
                            const dateMatch = fullDate.match(/^(\d{2}\/\d{2}\/\d{4})/);
                            bonusDate = dateMatch ? dateMatch[1] : '';

                            console.log('Обнаружено отыгрывание бонуса:', { bonusAmount, balanceAfterBonus, bonusId, bonusText, bonusDate });

                            if (withdrawAmount > balanceAfterBonus) {
                                const message = `Можливе порушення BTR:\n${bonusDate}\nвідіграв ${bonusAmount}₴, виводить ${withdrawAmount}₴`;
                                console.log('Проверка на нарушение BTR:', message);

                                updatePopupBox(balanceAfterBonus, withdrawAmount, bonusId, bonusText, withdrawId, withdrawText, bonusAmount, bonusDate, messageCount);

                                messageCount++;
                            }

                            waitingForBonus = false;
                        } else if (actionType.includes('Присвоение бонуса')) {
                            if (bonusInfo.includes("платеж")) {
                                bonusWithDeposits++;
                                console.log('Обнаружен депозит с бонусом');
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

    function fetchAndProcessPending() {
        return new Promise((resolve, reject) => {
            const PlayerID = getPlayerID();
            const fullProjectUrl = `${ProjectUrl}payments/paymentsItemsOut/index/?PaymentsItemsOutForm%5Bsearch_login%5D=${PlayerID}`;
            let totalPending = 0;

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
                        if (statusSpan && (statusSpan.textContent.trim() === 'pending' || statusSpan.textContent.trim() === 'review')) {
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

                    fetchAndProcessData();
                    resolve(totalPending);
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

                    console.log('Card statuses:', cardStatuses); // Діагностичне повідомлення
                    callback(cardStatuses);
                } else {
                    console.error('Failed to fetch player page:', response.statusText);
                }
            }
        });
    }

    // Функція для оновлення статусу карток на основній сторінці
    function updateCardStatus(cardStatuses) {
        const cardElements = document.querySelectorAll('td span.label');

        cardElements.forEach(span => {
            const cardNumber = span.textContent.trim();
            if (span.closest('td')?.cellIndex === 7) { // Перевірка, чи є це восьма колонка (карти)
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

    function observeDOMChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    depositCardChecker(); // Викликайте вашу функцію при зміні контенту
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


    function handlePopup() {
        const popup = document.querySelector('#swal2-content');
        if (popup) {
            const totalCell = popup.querySelector('table tbody tr:nth-child(2) td:nth-child(2)');
            const monthCell = popup.querySelector('table tbody tr:nth-child(2) td:nth-child(1)');
            if (totalCell && monthCell) {
                const TotalPA = totalCell.textContent.trim();
                const MonthPA = monthCell.textContent.trim();
                const Balance = getBalance();

                const closeButton = document.querySelector('button.swal2-confirm');
                if (closeButton) {
                    closeButton.click();

                    setTimeout(() => {
                        const showBalanceButton = document.querySelector('#show-player-balance-after');
                        if (showBalanceButton) {
                            showBalanceButton.click();

                            setTimeout(() => {
                                const balanceAfterSpan = document.querySelector('#balance-after');
                                if (balanceAfterSpan) {
                                    const NDFL = balanceAfterSpan.textContent.trim();
                                    fetchAndProcessPending().then(totalPending => {
                                        createPopupBox(MonthPA, TotalPA, Balance, NDFL, totalPending);
                                        addCheckButton(TotalPA, Balance, totalPending);
                                    }).catch(error => {
                                        console.error('Error processing pending payments:', error);
                                    });
                                }
                            }, 250);
                        }
                    }, 1);
                }
            }
        }
    }




    window.addEventListener('load', function() {
        if (currentUrl.includes('paymentsItemsOut/index')) {
            calculatePendingAmount();
        } else if (currentUrl.includes('playersItems/update')) {
            clickButton();
            addForeignButton();
            setTimeout(handlePopup, 200);
        } else if (currentUrl.includes('playersItems/balanceLog/')) {
            createFloatingButton(buttonImageUrl);
        } else if (currentUrl.includes('payments/paymentsItemsIn/index/?PaymentsItemsInForm%5Bsearch_login%5D')) {
            depositCardChecker();
            observeDOMChanges();
        } else if (currentUrl.includes('playersItems/transactionLog/')) {
            initTransactionsPage();
            processTableRows();
        };
    }
                           );
})();
