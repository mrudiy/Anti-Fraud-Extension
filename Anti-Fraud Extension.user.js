// ==UserScript==
// @name         Anti-Fraud Extension
// @namespace    http://tampermonkey.net/
// @version      4.0.1
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
    const ProjectUrl = window.location.hostname.includes('777.ua')
    ? 'https://admin.777.ua/'
    : 'https://admin.slotoking.ua/';
    const initialUrl = window.location.href;
    const sharedStorageKey = 'highlightRulesShared';
    const languageKey = 'language';
    const ndfDisplayKey = 'ndfDisplay';
    const amountDisplayKey = 'amountDisplay';
    const pendingButtonsDisplayKey = 'pendingButtonsDisplay';
    const clientEmail = "test-sheets@orbital-avatar-417621.iam.gserviceaccount.com";
    const privateKey = `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDfBJ/rNCji7Lqz\ntISIWkJNieayzecS8CKbCh+x+YJG5T22Uykkj61qaE6zklx1QWA0mCbD3XvIHWyZ\n/lmqi1niCgwMrzv5pwrnBIrtLvnirZfVYl8o3AmrzjuqsDDzRCfz3HYBm5FNk899\nr/DfH5P3/cnu+np2tgZCiIZqyPDCwSS+8cg/B8oJi4gljNERXTTaCplkyzuYhybT\nAhR0I09mQi9rl49BH1RIRuzlq+dANyGcT0bHZuu1SkqlwfqC4O2LJXK4ZRtEscyQ\nL9ayKaLwIkdumVyzxhmFeI+AdtN0Ncm3+lE6mIAMv/AXa51A1tAglk2ywV3ylxqT\nljyCwpy3AgMBAAECggEACRm/i4c0XUDlxCw19aPL7YLBbEMkuSFyzWWAskWJQGqz\nCvv3w4CCxhh9kFcE+NqdxLz/ZUy7dAi8rsgHUVigZq3xnJmQq/kEuTVL6gPZufCg\nL9qfds5hLVFGyV9T5V6+9p+PcooDnZPONXB24X6rY2+ddugNE/JiQlgfNr+pEM63\nX9GvGFQhYTgZAcGuYoqZf33FEs8M8IzozYWvx/9CPRlqmjNymOSrBsMIvS7KxZFO\nyUmSUaj1gFGRQUmnCK5kmUm0FT35xAqWv/55XKNgWnmX+Ubp9aGO6KcDE6t3XK52\nj5lPvlYgwUjq3bQGN9WEng4QYkPvjoCGlw1o5mcPQQKBgQD39Yr1HzBWBXJDEjK/\nrtTFwLcezNZwTq+I1V8gy6MgFYmNoMQ/ZPIt0aqJCsGAR3vQA9r8PXIC8OU+m3fU\nbD5FNt9n5SyueH+wDgjAI9M/IcJ9jKL4jaFA/iAlFf/MHevqQFueY6UecSGaPgKh\nhNXO5z3t6SwP+JO8jL0/EErQYQKBgQDmQAfwEGBeF+6OEFGI7IF5ZYd/xWnjvIj2\nHKsXXKakxGvz/iEPTxWkPIg1P5E5FcK4L/v4i12uOIjC428p2oLhy2wKm2AWEcDz\n5a9du4tsFamMqcA4YewgA9O8Mf/I0Iu9gszOH32RNRjAvxB6M01hwWaQMVF8EvUg\nnKABpSRkFwKBgA1sgaVbluZRTSpMZerysBo0oLVOKZ3S5LXnt0qzO5WVFOlR9s3n\nzSSl4TGiH2+ubwmH6+cT/IQkPoTxLb+WTJi6q8WYJp8bbu49FEQyrFESptDdOEV0\nhXJbT6oyUrLeO9NmwI8Gnf3T6hnLmaDc7CZTZormwLfsoTLn+6baXvKBAoGBAOQm\nMHddEtBJsHUOkGw3xbevtgsSZ3FlAOW11IaKpQmBJGMZvlJ4D760yFbTDSheepqd\n2XQXTJV0qXdLe3wibCwmsID2IsjbgLFsN0+OpYFNGbsq/TAhP6Mdh7HkbUrj8oOv\nVxcrtvWqgkODT2V27kdeJy3b4J0r/77308ithZizAoGAIll6hMCpgK31oX0yRcAQ\n2re14VOGQgLwdj2jqywvlBlynR7KWEHxDt5VUdKPXFGvTyQsiK6U66ZiaO5WqyRy\n9Je4hv0JUfmTPHbUZrT72oun6axQ9c0kmgz46YAsQtmiX3hdvNtPPym+Fvokasmb\nV64l1KqOdNici1ftDWTiEsY=\n-----END PRIVATE KEY-----`; // Из JSON файла сервисного аккаунта
    const sheetId = "1zAAQZ3jJNJc5ZBgL6317WJRAwQ3MAh6zjGgbf1QdF1Q";
    const scopes = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive";


    const stylerangePicker = document.createElement('style');
    stylerangePicker.textContent = '@import url("https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.css");';
    document.head.appendChild(stylerangePicker);

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
            const existingButton = document.getElementById('check-button');
            if (existingButton) {
                existingButton.remove();
            }

            const checkButton = document.createElement('button');
            checkButton.id = 'check-button';
            checkButton.type = 'button';
            checkButton.innerText = 'Check';
            checkButton.onclick = () => {
                const date = getCurrentDate();
                const initials = GM_getValue(initialsKey);
                const currentLanguage = GM_getValue(languageKey, 'російська');
                const colorPA = TotalPA < 0.75 ? 'green' : (TotalPA >= 0.75 && TotalPA < 1 ? 'orange' : 'red');
                const formattedBalance = formatAmount(Balance);
                const formattedTotalPending = formatAmount(totalPending);

                let textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | `;

                if (currentLanguage === 'українська') {

                    if (Balance > 1000) {
                        const balanceStyle = Balance > 1000000 ? 'color: red;' : '';
                        textToInsert += `<b>На балансі:</b> <b style="${balanceStyle}">${formattedBalance}₴</b> | `;
                    }

                    if (totalPending > 1) {
                        const pendingStyle = totalPending > 1000000 ? 'color: red;' : '';
                        textToInsert += `<b>На виплаті:</b> <b style="${pendingStyle}">${formattedTotalPending}₴ </b>| `;
                    }

                } else {
                    if (Balance > 1000) {
                        const balanceStyle = Balance > 1000000 ? 'color: red;' : '';
                        textToInsert += `<b>На балансе:</b> <b style="${balanceStyle}">${formattedBalance}₴</b> | `;
                    }

                    if (totalPending > 1000) {
                        const pendingStyle = totalPending > 1000000 ? 'color: red;' : '';
                        textToInsert += `<b>На выплате:</b> <b style="${pendingStyle}">${formattedTotalPending}₴ </b>| `;
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
                    console.log(fraudId)
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
                addFraudPageButton(true, data.fraud_id);
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-warning';
                alertDiv.style.backgroundColor = '#6a0dad'; // Ярко фиолетовый
                alertDiv.style.color = '#fff'; // Текст белый
                alertDiv.style.borderColor = '#5a00a2'; // Темно фиолетовый

                alertDiv.innerHTML = `
                <strong>Увага!</strong> Користувач під наглядом.
                <br><strong>Менеджер:</strong> ${data.manager_name}
                <br><strong>Коментар:</strong> ${data.comment || 'Немає коментарів'}
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
    `;
        createPopup('admin-popup', 'Менеджери', content, () => {});

        loadUsers();

        document.getElementById('add-user-btn').addEventListener('click', createRegisterPopup);
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

        // Додати стилі безпосередньо в документ
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
                <td>${fraud.manager === managerName ? '<button class="delete-fraud">Видалити</button>' : ''}</td>
            `;

                if (fraud.manager === managerName) {
                    myFraudsList.appendChild(row);
                    const deleteButton = row.querySelector('.delete-fraud');
                    if (deleteButton) {
                        deleteButton.addEventListener('click', () => deleteFraud(fraud.id));
                    }
                } else {
                    commonFraudsList.appendChild(row);
                }
            });
        } catch (error) {
            console.error('Error:', error);
        }
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
                alert('Користувача додано до списку!');
                loadFrauds();
                window.location.reload()
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
                alert('Користувача видалено зі списку!');
                loadFrauds();
                window.location.reload()
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
                <p>Кількість Slotoking: ${data.slotoking_count}</p>
                <p>Кількість 777: ${data.seven_count}</p>

                <div style="max-height: 500px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;">  <!-- Контейнер с прокруткой -->
                    <table>
                        <thead>
                            <tr>
                                <th>ID Гравця</th>
                                <th>Проект</th>
                                <th>Коментар</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.entries.map(entry => `
                                <tr>
                                    <td><a href="${entry.url}" target="_blank">${entry.player_id}</a></td>
                                    <td>${entry.project}</td>
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
        console.log(selectedDate)
        fetchStatistics(userId, selectedDate);
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
            console.log(data);

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





    function getCurrentDate() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${day}.${month}.${year}`;
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

    function formatAmount(balance) {
        let formattedBalance;
        const isNegative = balance < 0; // Проверяем, отрицательное ли значение
        const absoluteBalance = Math.abs(balance); // Преобразуем в абсолютное значение

        if (absoluteBalance >= 1000000) {
            formattedBalance = absoluteBalance / 1000000;
            formattedBalance = Number.isInteger(formattedBalance) ? `${formattedBalance} млн` : `${formattedBalance.toFixed(1)} млн`;
        } else if (absoluteBalance >= 1000) {
            formattedBalance = absoluteBalance / 1000;
            formattedBalance = Number.isInteger(formattedBalance) ? `${formattedBalance}к` : `${formattedBalance.toFixed(1)}к`;
        } else {
            formattedBalance = absoluteBalance.toFixed(2); // Возвращаем абсолютное значение, если оно меньше 1000
        }

        return isNegative ? `-${formattedBalance}` : formattedBalance; // Добавляем знак минуса, если значение было отрицательным
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
        popupBox.style.right = ''; // Забираємо значення з правої сторони

        // Розміщуємо попап справа через обчислення left
        const popupWidth = 270;
        popupBox.style.left = `calc(100% - ${popupWidth + 20}px)`; // 20px - відступ від правого краю
        popupBox.style.width = `${popupWidth}px`; // Задаємо ширину попапу

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
        popupBox.style.animation = 'fadeIn 0.5s ease-in-out, borderGlow 2.5s infinite';
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

        const maintext = document.createElement('div');
        maintext.className = 'popup-main-text';
        maintext.innerHTML = `
    ${showAmount ? `<center><b>Баланс: ${formattedBalance}₴</b></center>` : `<center><b>Баланс: ${Balance}₴</b></center>`}
    ${showNDFL ? (showAmount ? `<center><b>НДФЛ: ${formattedNDFL}₴</b></center>` : `<center><b>НДФЛ: ${NDFL}₴</b></center>`) : ''}
    <center><b>
        Month: <span style="color: ${MonthPA < 0.75 ? 'green' : (MonthPA < 1 ? 'orange' : 'red')}">${MonthPA}</span> |
        Total: <span style="color: ${TotalPA < 0.75 ? 'green' : (TotalPA < 1 ? 'orange' : 'red')}">${TotalPA}</span>
    </b></center>
    ${totalPending > 0 ? (showAmount ? `<center><b>На виплаті: ${formattedTotalPending}₴</b></center>` : `<center><b>На виплаті: ${totalPending}₴</b></center>`) : ''}    ${cards.length > 0 ? `
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

        const statusIcon = document.createElement('div');
        statusIcon.style.position = 'absolute';
        statusIcon.style.top = '10px';
        statusIcon.style.left = '10px';
        statusIcon.style.fontSize = '20px';
        statusIcon.style.cursor = 'pointer';
        statusIcon.title = 'Автовиплата';
        statusIcon.innerHTML = checkbox && checkbox.checked ? '<i class="fa fa-check-circle" style="color: green;"></i>' : '<i class="fa fa-times-circle" style="color: red;"></i>';

        statusIcon.onclick = () => {
            checkbox.click();

            setTimeout(() => {
                const confirmButton = document.querySelector('.swal2-confirm');
                if (confirmButton) {
                    confirmButton.click();
                }

                setTimeout(() => {
                    statusIcon.innerHTML = checkbox.checked ? '<i class="fa fa-check-circle" style="color: green;"></i>' : '<i class="fa fa-times-circle" style="color: red;"></i>';
                }, 200);
            }, 200);
        };
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
        cleanButton.innerText = 'Чистий';
        cleanButton.style.cssText = buttonStyle;
        cleanButton.style.backgroundColor = '#28a745';
        cleanButton.onmouseover = () => cleanButton.style.backgroundColor = '#218838';
        cleanButton.onmouseout = () => cleanButton.style.backgroundColor = '#28a745';
        cleanButton.addEventListener('click', () => {
            const date = getCurrentDate();
            const initials = GM_getValue(initialsKey, '');
            const currentLanguage = GM_getValue(languageKey, 'російська');

            let textToInsert;

            const colorPA = TotalPA < 0.75 ? 'green' : (TotalPA >= 0.75 && TotalPA < 1 ? 'orange' : 'red');
            const formattedBalance = formatAmount(Balance);
            const formattedTotalPending = formatAmount(totalPending);


            if (currentLanguage === 'російська') {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | `;
                if (Balance > 1000) {
                    const balanceStyle = Balance > 1000000 ? 'color: red;' : '';
                    textToInsert += `<b>На балансе:</b> <b style="${balanceStyle}">${formattedBalance}₴</b> | `;
                }

                if (totalPending > 1) {
                    const pendingStyle = totalPending > 1000000 ? 'color: red;' : '';
                    textToInsert += `<b>На выплате:</b> <b style="${pendingStyle}">${formattedTotalPending}₴ </b>| `;
                }
                textToInsert += `играет <b><font color="#14b814">своими</font></b> картами, чист`;
            } else if (currentLanguage === 'українська') {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | `;
                if (Balance > 1000) {
                    const balanceStyle = Balance > 1000000 ? 'color: red;' : '';
                    textToInsert += `<b>На балансі:</b> <b style="${balanceStyle}">${formattedBalance}₴</b> | `;
                }

                if (totalPending > 1) {
                    const pendingStyle = totalPending > 1000000 ? 'color: red;' : '';
                    textToInsert += `<b>На виплаті:</b> <b style="${pendingStyle}">${formattedTotalPending}₴ </b>| `;
                }
                textToInsert += `грає <b><font color="#14b814">власними</font></b> картками, чистий`
            }

            insertTextIntoField(textToInsert);
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
            const initials = GM_getValue(initialsKey, '');
            const currentLanguage = GM_getValue(languageKey, 'російська');

            let textToInsert;
            const formattedBalance = formatAmount(Balance);
            const formattedTotalPending = formatAmount(totalPending);
            const colorPA = TotalPA < 0.75 ? 'green' : (TotalPA >= 0.75 && TotalPA < 1 ? 'orange' : 'red');

            if (currentLanguage === 'російська') {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | `;
                if (Balance > 1000) {
                    const balanceStyle = Balance > 1000000 ? 'color: red;' : '';
                    textToInsert += `<b>На балансе:</b> <b style="${balanceStyle}">${formattedBalance}₴</b> | `;
                }

                if (totalPending > 1) {
                    const pendingStyle = totalPending > 1000000 ? 'color: red;' : '';
                    textToInsert += `<b>На выплате:</b> <b style="${pendingStyle}">${formattedTotalPending}₴ </b>| `
                }
                textToInsert += `играет <b><font color="#ff0000">чужими</font></b> картами, <b>авто отключаем</b>`
            }
            else if (currentLanguage === 'українська') {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | `;
                if (Balance > 1000) {
                    const balanceStyle = Balance > 1000000 ? 'color: red;' : '';
                    textToInsert += `<b>На балансі:</b> <b style="${balanceStyle}">${formattedBalance}₴</b> | `;
                }

                if (totalPending > 1) {
                    const pendingStyle = totalPending > 1000000 ? 'color: red;' : '';
                    textToInsert += `<b>На виплаті:</b> <b style="${pendingStyle}">${formattedTotalPending}₴ </b>| `
                }
                textToInsert += `грає <b><font color="#ff0000">чужими</font></b> картками, <b>авто відключаємо</b>`
            }
            insertTextIntoField(textToInsert);
        });
        firstRowButtonContainer.appendChild(foreignButton);

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
            const initials = GM_getValue(initialsKey, '');
            const currentLanguage = GM_getValue(languageKey, 'російська');

            let textToInsert;
            const colorPA = TotalPA < 0.75 ? 'green' : (TotalPA >= 0.75 && TotalPA < 1 ? 'orange' : 'red');

            if (currentLanguage === 'російська') {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | играет <b><font color="#14b814">своими</font></b> картами, чист, много безуспешных попыток депозита своей картой // Без угроз, потом деп прошел`;
            } else if (currentLanguage === 'українська') {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | грає <b><font color="#14b814">власними</font></b> картками, чистий, багато безуспішних спроб депозиту своєю карткою, потім деп пройшов`;
            } else {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | играет <b><font color="#14b814">своими</font></b> картами, чист, много безуспешных попыток депозита своей картой // Без угроз, потом деп прошел`;
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
            const initials = GM_getValue(initialsKey, '');
            const currentLanguage = GM_getValue(languageKey, 'російська');

            let textToInsert;
            const colorPA = TotalPA < 0.75 ? 'green' : (TotalPA >= 0.75 && TotalPA < 1 ? 'orange' : 'red');

            if (currentLanguage === 'російська') {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | много безуспешных попыток депозита <b>неизвестными</b> картами, <b>авто отключаем</b>`;
            } else if (currentLanguage === 'українська') {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | багато безуспішних спроб депозиту <b>невідомими</b> картками, <b>авто відключаємо</b>`;
            } else {
                textToInsert = `${date} проверен антифрод командой/${initials}<br><b>РА: <span style="color: ${colorPA}">${TotalPA}</span></b> | много безуспешных попыток депозита <b>неизвестными</b> картами, <b>авто отключаем</b>`;
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

        const projectImageUrl = window.location.hostname.includes('777.ua')
        ? 'https://admin.slotoking.ua/img/slotoking.png'
        : 'https://admin.777.ua/img/777.png'

        const projectImage = document.createElement('img');
        projectImage.src = projectImageUrl;
        projectImage.style.cursor = 'pointer';
        if (projectImageUrl.includes('slotoking')) {
            projectImage.style.width = '100px';
            projectImage.style.height = 'auto';
        } else if (projectImageUrl.includes('777')) {
            projectImage.style.width = '75px';
            projectImage.style.height = 'auto';
        }
        projectImage.addEventListener('click', () => {

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

            function searchUser(query, fieldType) {
                const searchUrl = window.location.hostname.includes('777.ua')
                ? 'https://admin.slotoking.ua/players/playersItems/search/'
                : 'https://admin.777.ua/players/playersItems/search/';

                GM_xmlhttpRequest({
                    method: "POST",
                    url: searchUrl,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    data: `PlayersSearchForm[${fieldType}]=${encodeURIComponent(query)}`,
                    onload: function(response) {
                        if (response.finalUrl.includes('/update/')) {
                            getUserInfo(response.finalUrl, fieldType);
                        } else {
                            projectButtonContainer.innerHTML += `<div><b>${fieldType === 'inn' ? 'ІПН' : (fieldType === 'email' ? 'E-mail' : 'Телефон')}:</b> не знайдено</div>`;
                        }
                    },
                    onerror: function() {
                        projectButtonContainer.innerHTML += `<div>Ошибка при поиске по ${fieldType === 'email' ? 'E-mail' : 'телефону'}.</div>`;
                    }
                });
            }


            function getUserInfo(url, fieldType) {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: url,
                    onload: function(response) {
                        let tempDiv = document.createElement('div');
                        tempDiv.innerHTML = response.responseText;

                        const playerId = getValueByLabel(tempDiv, 'Номер игрока');

                        let status = 'success';

                        const attentionHeaders = tempDiv.querySelectorAll('h1.attention-header');
                        attentionHeaders.forEach(header => {
                            const headerText = header.textContent.trim();
                            if (headerText.includes('Дубликат')) {
                                status = 'danger';
                            } else if (headerText.includes('Отключен')) {
                                status = 'danger';
                            } else if (headerText.includes('Ограничение по возрасту!')) {
                                status = 'danger';
                            } else if (headerText.includes('Лудоман')) {
                                status = 'info';
                            } else if (headerText.includes('Не подтвержден')) {
                                status = 'danger';
                            }
                        });

                        const surname = getValueByLabel(tempDiv, 'Фамилия');
                        const middleName = getValueByLabel(tempDiv, 'Middle Name');
                        const firstName = getValueByLabel(tempDiv, 'Имя');

                        if (firstName === 'Не заданий' || firstName === 'Не задан') {
                            status = 'default';
                        }

                        const searchTypeLabel = fieldType === 'inn' ? 'ІПН' : (fieldType === 'email' ? 'E-mail' : 'Телефон');

                        projectButtonContainer.innerHTML += `
                <div><b>${searchTypeLabel}:</b> <a class="label label-${status}" href="${url}" target="_blank">${playerId}</a></div>
            `;
                    },
                    onerror: function() {
                        projectButtonContainer.innerHTML += '<div>Ошибка при получении данных пользователя.</div>';
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

                        searchUser(inn, 'inn');
                        searchUser(email, 'email');
                        searchUser(phone, 'phone');
                        setTimeout(function() {
                            processCards();
                        }, 3000);
                    },
                    onerror: function() {
                        projectButtonContainer.innerHTML += '<div>Ошибка при получении данных ИНН.</div>';
                    }
                });
            } else {
                projectButtonContainer.innerHTML += '<div>Не удалось найти URL для запроса.</div>';
            }
        });

        async function processCards() {
            const data = await fetchAllCards();
            const cards = data.cards;

            const searchUrl = window.location.hostname.includes('777.ua')
            ? 'https://admin.slotoking.ua/payments/paymentsItemsOut/requisite/'
            : 'https://admin.777.ua/payments/paymentsItemsOut/requisite/';

            const openUrl = window.location.hostname.includes('777.ua')
            ? 'https://admin.slotoking.ua'
            : 'https://admin.777.ua';

            for (const card of cards) {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: searchUrl,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    data: `PaymentsRequisiteForm[requisite]=${encodeURIComponent(card)}`,
                    onload: function(response) {
                        let tempDiv = document.createElement('div');
                        tempDiv.innerHTML = response.responseText;
                        const table = tempDiv.querySelector('table.items tbody');

                        if (table) {
                            const rows = table.querySelectorAll('tr');

                            rows.forEach((row) => {
                                const playerCard = row.querySelector('td span.player_card');
                                if (playerCard) {
                                    // Клонируем HTML-код карточки для изменения
                                    let cardHtml = playerCard.outerHTML;

                                    // Создаем временный элемент для обработки
                                    let cardTempDiv = document.createElement('div');
                                    cardTempDiv.innerHTML = cardHtml;

                                    // Находим все ссылки внутри cardTempDiv и изменяем их href
                                    cardTempDiv.querySelectorAll('a').forEach(link => {
                                        let href = link.getAttribute('href');
                                        if (href) {
                                            link.setAttribute('href', `${openUrl}${href}`);
                                        }
                                    });

                                    cardHtml = cardTempDiv.innerHTML;
                                    const first6 = card.slice(0, 6);
                                    const last4 = card.slice(-4);

                                    projectButtonContainer.innerHTML += `<b>${first6}|${last4}:</b> ${cardHtml}`;
                                }
                            });
                        }
                    },
                    onerror: function() {
                        console.log(`Ошибка при поиске владельца для карты: ${card}`);
                    }
                });
            }
        }


        popupBox.appendChild(projectButtonContainer);
        projectButtonContainer.appendChild(projectImage);


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
            border-color: gray;
        }
        50% {
            box-shadow: 0 0 15px gray;
            border-color: gray;
        }
        100% {
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
            border-color: gray;
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

                            let cleanBalance = parseFloat(Balance);

                            const profit = (depositsTotal - redeemsTotal);
                            const PrognoseInOut = depositsTotal - (totalPending + redeemsTotal + cleanBalance);
                            const PrognosePA = ((redeemsTotal + totalPending + cleanBalance) / depositsTotal) * 100;
                            const formattedProfit = formatAmount(profit)
                            const formattedPrognoseInOut = formatAmount(PrognoseInOut)
                            const showAmount = GM_getValue(amountDisplayKey, true);



                            fourthRowContainer.removeChild(loader);
                            fourthRowContainer.innerHTML += `
    <div><b>Total InOut: ${showAmount ? formattedProfit : profit.toFixed(2)}₴</b></div>
    ${(totalPending > 1 || cleanBalance > 1) ? `
        <div><b>Prognose InOut: ${showAmount ? formattedPrognoseInOut : PrognoseInOut.toFixed(2)}₴</b></div>
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
                } else {
                    console.warn('Элемент выбора размера страницы не найден');
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

                        const cardLabel = row.querySelector('td:nth-child(10) span.label.label-default');
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

    function observeDOMChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    depositCardChecker();
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function observeDOMChangesTransactions() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    processTableRows();
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

    function sendDataToGoogleSheet(accessToken, data) {
        console.log("Sending data to Google Sheets...");
        fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/INFO!A1:append?valueInputOption=RAW`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken,
            },
            body: JSON.stringify({
                values: [[
                    data.date,
                    data.url,
                    data.project,
                    data.playerID,
                    data.initials,
                    data.comment,
                ]]
            })
        }).then(response => response.json())
            .then(data => {
        })
            .catch((error) => {
            console.error("Error sending data to Google Sheets:", error);
        });
    }

    let isButtonToSaveClicked = false;

    async function getManagerName(token) {
        try {
            const response = await fetch('https://vps65001.hyperhost.name/api/get_manager_name', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ token }) // Отправка токена в теле запроса
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.name) {
                return data.name; // Возвращаем имя пользователя
            } else {
                throw new Error('Name not found in response');
            }
        } catch (error) {
            console.error('Error:', error);
            return null; // Возвращаем null в случае ошибки
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
                if (!isButtonToSaveClicked) {
                    isButtonToSaveClicked = true;
                    getAccessToken().then(accessToken => {
                        const dataToInsert = {
                            date: currentDate,
                            url: url,
                            project: project,
                            playerID: playerID,
                            initials: initials,
                            comment: textarea.value.replace(/\r?\n/g, ""),
                        };

                        const token = localStorage.getItem('authToken');
                        sendDataToServer(dataToInsert, token)
                            .then(response => {
                            console.log('Data sent successfully:', response);
                        })
                            .catch(err => {
                            console.error('Error sending data:', err);
                        });

                        sendDataToGoogleSheet(accessToken, dataToInsert);
                    }).catch(err => {
                        console.error("Error getting Access Token:", err);
                    });
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
                    }, 150);
                }
            }).fail(function(xhr) {
                console.error('Ошибка при выполнении запроса:', xhr.responseText);
            });
        } else {
            console.log('Не удалось найти URL для запроса.');
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


    async function sendActivePageInfo() {
        const token = localStorage.getItem('authToken');
        const currentUrl = window.location.href; // поточний URL сторінки

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

    window.addEventListener('load', async function() {
        const tokenIsValid = await checkToken();
        if (tokenIsValid) {
            sendActivePageInfo();
            if (currentUrl.includes('paymentsItemsOut/index')) {
                calculatePendingAmount();
                setPageSize1k();
            } else if (currentUrl.includes('playersItems/update')) {
                addForeignButton();
                buttonToSave();
                checkUserInFraudList();
                document.addEventListener('keydown', handleShortcut);
                setTimeout(handlePopup, 200);
            } else if (currentUrl.includes('playersItems/balanceLog/')) {
                createFloatingButton(buttonImageUrl);
            } else if (currentUrl.includes('payments/paymentsItemsIn/index/?PaymentsItemsInForm%5Bsearch_login%5D')) {
                depositCardChecker();
                observeDOMChanges();
            } else if (currentUrl.includes('playersItems/transactionLog/')) {
                initTransactionsPage();
                processTableRows();
                observeDOMChangesTransactions();
            };
        }
        else {
            console.log('User is not logged in or token is invalid');
            localStorage.removeItem('authToken');
            createLoginForm();
        }
    }
                           );
})();
