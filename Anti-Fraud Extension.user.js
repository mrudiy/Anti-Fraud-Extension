// ==UserScript==
// @name         Anti-Fraud Extension
// @namespace    http://tampermonkey.net/
// @version      3.0
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

    // Створюємо стилі для підсвічування
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

    function addCheckButton(TotalPA) {
        const formatableTextDiv = document.getElementById('formatable-text-antifraud_manager');
        if (formatableTextDiv) {
            const checkButton = document.createElement('button');
            checkButton.type = 'button';
            checkButton.innerText = 'Check';
            checkButton.onclick = () => {
                const date = getCurrentDate();
                const initials = GM_getValue(initialsKey)
                const textToInsert = `${date} проверен антифрод командой/${initials}<br>РА: ${TotalPA} |`;
                insertTextIntoField(textToInsert);
            };

            formatableTextDiv.insertBefore(checkButton, formatableTextDiv.firstChild);
        }
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

    function handle777() {
        const currentUrl = window.location.href;

        GM_xmlhttpRequest({
            method: 'GET',
            url: currentUrl,
            onload: function(response) {
                if (response.status === 200) {
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    document.body.appendChild(iframe);

                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    iframeDoc.open();
                    iframeDoc.write(response.responseText);
                    iframeDoc.close();

                    const checkbox = iframeDoc.querySelector('#Players_enabled_autopayouts');
                    const updateButton = iframeDoc.querySelector('#yw2');

                    if (!checkbox || !updateButton) {
                        console.error('Checkbox or Update button not found');
                        return;
                    }

                    checkbox.checked = !checkbox.checked;

                    updateButton.click();

                    setTimeout(() => {
                        document.body.removeChild(iframe);
                        location.reload();
                    }, 300);
                } else {
                    console.error('Failed to load page content:', response.status);
                }
            },
            onerror: function(error) {
                console.error('Error occurred:', error);
            }
        });
    }

    function createPopupBox(MonthPA, TotalPA, Balance, NDFL, pendingMessage = '') {
        if (popupBox) {
            return;
        }

        const currentUrl = window.location.href;
        const isSlotoking = currentUrl.includes('slotoking.ua');
        const is777 = currentUrl.includes('777.ua');
        const checkbox = document.getElementById('Players_enabled_autopayouts');
        const isChecked = checkbox && checkbox.checked;

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

        const text = document.createElement('div');
        text.className = 'popup-text';
        text.innerHTML = `
            <center><b>Баланс: ${Balance}₴</b></center>
            <center><b>НДФЛ: ${NDFL}₴</center></b>
            <center><b>Month: ${MonthPA} | Total: ${TotalPA} |</b></center>
            ${pendingMessage ? `<center><b>${pendingMessage}</b></center>` : ''}
        `;
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
            const userInitials = prompt('Введіть свої ініціали (наприклад, РМ):', GM_getValue(initialsKey, ''));
            if (userInitials !== null) {
                GM_setValue(initialsKey, userInitials);
            }
        };
        popupBox.appendChild(settingsIcon);

        const statusIcon = document.createElement('div');
        statusIcon.style.position = 'absolute';
        statusIcon.style.top = '5px';
        statusIcon.style.left = '5px';
        statusIcon.style.fontSize = '18px';
        statusIcon.style.cursor = 'pointer';
        statusIcon.innerHTML = isChecked ? '&#10004;' : '&#10008;';
        statusIcon.onclick = () => {
            if (is777) {
                handle777();
            } else {
                checkbox.click();

                setTimeout(() => {
                    const confirmButton = document.querySelector('.swal2-confirm');
                    if (confirmButton) {
                        confirmButton.click();
                    }
                }, 100); 
            }
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
            const initials = GM_getValue(initialsKey)
            const textToInsert = `${date} проверен антифрод командой/${initials}<br>РА: ${TotalPA} | играет <b><font color="#14b814">своими</font></b> картами, чист`;
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
            const initials = GM_getValue(initialsKey)
            const textToInsert = `${date} проверен антифрод командой/${initials}<br>РА: ${TotalPA} | играет <b><font color="#ff0000">чужими</font></b> картами, <b>авто отключаем</b>`;
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
            const initials = GM_getValue(initialsKey)
            const textToInsert = `${date} проверен антифрод командой/${initials}<br>РА: ${TotalPA} | играет <b><font color="#14b814">своими</font></b> картами, чист, много безуспешных попыток депозита своей картой // Без угроз, потом деп прошел`;
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
            const initials = GM_getValue(initialsKey)
            const textToInsert = `${date} проверен антифрод командой/${initials}<br>РА: ${TotalPA} | много безуспешных попыток депозита <b>неизвестными</b> картами, <b>авто отключаем</b>`;
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

    function updatePopupBox(balanceAfterBonus, withdrawAmount, bonusId, bonusText, withdrawId, withdrawText, bonusAmount, bonusDate) {
        if (!popupBox) {
            console.error('Попап не существует');
            return;
        }

        const textElement = popupBox.querySelector('.popup-text');
        if (textElement) {
            textElement.innerHTML += `
            <div style="color: red; font-weight: bold; margin-top: 10px;">
                <center>
                <span id="popup-clickable-text">
                    Можливе порушення BTR:<br>${bonusDate}<br>відіграв ${balanceAfterBonus}₴, виводить ${withdrawAmount}₴
                </span>
                </center>
            </div>`;

            const clickableText = popupBox.querySelector('#popup-clickable-text');
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

    function fetchAndProcessData() {
        const fullProjectUrl = `${ProjectUrl}players/playersItems/transactionLog/${userId}/`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: fullProjectUrl,
            onload: function(response) {
                const html = response.responseText;

                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const pageSizeSelect = doc.querySelector('#pageSize');
                if (pageSizeSelect) {
                    pageSizeSelect.value = '1000';
                    const event = new Event('change');
                    pageSizeSelect.dispatchEvent(event);
                } else {
                    console.warn('Page size selector not found.');
                }

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

                let messageCount = 0; // Счетчик сообщений
                const maxMessages = 3; // Максимальное количество сообщений

                rows.forEach(row => {
                    if (messageCount >= maxMessages) return; // Прекращение добавления сообщений

                    const cells = row.querySelectorAll('td');
                    if (cells.length > 0) {
                        const actionType = cells[1].innerText.trim();

                        if (actionType.includes('Вывод средств')) {
                            withdrawAmount = parseFloat(cells[2].textContent.replace('-', '').replace(',', '.'));
                            withdrawId = cells[0].textContent.trim();
                            withdrawText = cells[6].textContent.trim();
                            waitingForBonus = true;
                        } else if (actionType.includes('Ввод средств')) {
                            withdrawAmount = 0;
                            balanceAfterBonus = 0;
                            waitingForBonus = false;
                        } else if (actionType.includes('Отыгрывание бонуса') && waitingForBonus) {
                            bonusAmount = parseFloat(cells[2].textContent.replace(',', '.'));
                            balanceAfterBonus = parseFloat(cells[3].textContent.replace(',', '.'));
                            bonusId = cells[0].textContent.trim();
                            bonusText = cells[6].textContent.trim();
                            const fullDate = cells[5].textContent.trim();
                            const dateMatch = fullDate.match(/^(\d{2}\/\d{2}\/\d{4})/);
                            bonusDate = dateMatch ? dateMatch[1] : '';

                            if (withdrawAmount > balanceAfterBonus) {
                                const message = `Можливе порушення BTR:\n${bonusDate}\nвідіграв ${bonusAmount}₴, виводить ${withdrawAmount}₴`;
                                console.log(message);

                                updatePopupBox(balanceAfterBonus, withdrawAmount, bonusId, bonusText, withdrawId, withdrawText, bonusAmount, bonusDate);

                                messageCount++;
                            }

                            waitingForBonus = false;
                        }
                    }
                });
            },
            onerror: function(error) {
                console.error('Ошибка загрузки данных:', error);
            }
        });
    }

    function fetchAndProcessPending() {
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

                // Проверьте, правильно ли получаем элемент и изменяем значение
                const pageSizeSelect = doc.querySelector('#newPageSize');
                if (pageSizeSelect) {
                    console.log('Element found:', pageSizeSelect);
                    pageSizeSelect.value = '450';
                    const event = new Event('change', { bubbles: true });
                    pageSizeSelect.dispatchEvent(event);
                    console.log('Value set to:', pageSizeSelect.value);
                } else {
                    console.warn('Page size selector not found.');
                }

                const rows = doc.querySelectorAll('tr');
                console.log(fullProjectUrl)
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

                let pendingMessage = '';
                if (totalPending > 0) {
                    pendingMessage = `На виплаті:\n${totalPending}₴`;
                }

                fetchAndProcessData();

                if (popupBox) {
                    const textElement = popupBox.querySelector('.popup-text');
                    if (textElement) {
                        textElement.innerHTML += `
                        <center><b>${pendingMessage}</b></center>
                    `;
                    }
                }
            },
            onerror: function(error) {
                console.error('Ошибка загрузки данных:', error);
            }
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

                addCheckButton(TotalPA);

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
                                    fetchAndProcessPending();
                                    createPopupBox(MonthPA, TotalPA, Balance, NDFL);
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
        } else if (currentUrl.includes('playersItems/transactionLog/')) {
            initTransactionsPage();
            processTableRows();
            setTimeout(handlePopup, 200);
        }
    });
})();
