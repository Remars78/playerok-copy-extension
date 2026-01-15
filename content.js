// content.js - ВЕРСИЯ C ВЫБОРОМ ПОДТИПА (Sub-Type)

// === 1. ПЕРЕМЕННЫЕ ===
let isAutoProcessActive = false; 
let hasPassedCategory = false; 
let hasClickedSubType = false; // Флаг: нажали ли мы уже кнопку подтипа (Ключ/Blox Fruits)

// === 2. НАСТРОЙКИ СЕЛЕКТОРОВ ===
const SELECTORS = {
    source: {
        title: 'h1.MuiTypography-root.mui-19tfdms', 
        description: 'p.MuiTypography-root.mui-1v8lgfg', 
        price: 'span.MuiTypography-root.mui-228xvi',
        gameName: 'p.mui-16g3ovn',       
        categoryName: 'p.mui-1yyp5x8',
        // НОВОЕ: Подтип (тот самый "Ключ" или "Blox Fruits" на странице товара)
        subTypeName: 'span.mui-1292osh' 
    },
    target: {
        titleInput: 'input[name="title"]', 
        descInput: 'textarea[name="description"]', 
        priceInput: '#item-price',
        nextBtnClass: '.mui-f0wsx9',
        // НОВОЕ: Класс кнопок выбора подтипа на странице продажи
        subTypeBtn: '.mui-pv687m' 
    }
};

// === 3. СОЗДАНИЕ КНОПОК ===

function createCopyButton() {
    if (document.getElementById('my-copy-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'my-copy-btn';
    btn.innerText = '📋 COPY FULL';
    btn.className = 'pk-helper-btn';
    btn.onclick = copyProductData;
    document.body.appendChild(btn);
}

function createStartButton(gameName) {
    if (document.getElementById('my-start-btn')) return;
    if (document.getElementById('my-paste-btn')) return; 

    const btn = document.createElement('button');
    btn.id = 'my-start-btn';
    btn.innerText = `▶️ Старт: ${gameName}`;
    btn.className = 'pk-helper-btn';
    btn.style.backgroundColor = '#f0ad4e'; 
    btn.onclick = () => {
        isAutoProcessActive = true; 
        hasPassedCategory = false; 
        hasClickedSubType = false; // Сбрасываем флаг
        btn.innerText = '🤖 Работаю...';
        btn.disabled = true;
        btn.style.opacity = '0.7';
    };
    document.body.appendChild(btn);
}

function createPasteButton() {
    const startBtn = document.getElementById('my-start-btn');
    if (startBtn) startBtn.remove(); 

    if (document.getElementById('my-paste-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'my-paste-btn';
    btn.innerText = '⬇️ ВСТАВИТЬ ДАННЫЕ';
    btn.className = 'pk-helper-btn paste';
    btn.onclick = pasteProductData;
    document.body.appendChild(btn);
}

function showStatus(text) {
    let status = document.getElementById('pk-status');
    if (!status) {
        status = document.createElement('div');
        status.id = 'pk-status';
        status.style.cssText = 'position:fixed; bottom:10px; left:10px; background:rgba(0,0,0,0.8); color:#fff; padding:5px 10px; z-index:9999; border-radius:5px; font-size:12px; pointer-events:none;';
        document.body.appendChild(status);
    }
    status.innerText = text;
}

// === 4. КОПИРОВАНИЕ ===
function copyProductData() {
    try {
        const titleEl = document.querySelector(SELECTORS.source.title);
        const descEl = document.querySelector(SELECTORS.source.description);
        const priceEl = document.querySelector(SELECTORS.source.price);
        const gameEl = document.querySelector(SELECTORS.source.gameName);
        const catEl = document.querySelector(SELECTORS.source.categoryName);
        const subTypeEl = document.querySelector(SELECTORS.source.subTypeName);

        if (!titleEl) return alert('Ошибка: Не нашел заголовок товара');

        const productData = {
            title: titleEl.innerText.trim(),
            description: descEl ? descEl.innerText.trim() : '',
            price: priceEl ? priceEl.innerText.replace(/[^0-9]/g, '') : '',
            game: gameEl ? gameEl.innerText.trim() : null,
            category: catEl ? catEl.innerText.trim() : null,
            subType: subTypeEl ? subTypeEl.innerText.trim() : null // Сохраняем подтип
        };

        chrome.storage.local.set({ 'pk_saved_product': productData }, () => {
            const btn = document.getElementById('my-copy-btn');
            btn.innerText = '✅ OK!';
            btn.style.backgroundColor = '#43b581';
            setTimeout(() => { btn.innerText = '📋 COPY FULL'; btn.style.backgroundColor = ''; }, 1000);
            
            let msg = `Скопировано!\nИгра: ${productData.game}\nКатегория: ${productData.category}`;
            if (productData.subType) msg += `\nПодтип: ${productData.subType}`;
            alert(msg);
        });
    } catch (e) { console.error(e); }
}

// === 5. ВСТАВКА ===
function pasteProductData() {
    chrome.storage.local.get(['pk_saved_product'], (result) => {
        const data = result.pk_saved_product;
        if (!data) return;

        const setNativeValue = (element, value) => {
            if (!element) return;
            const lastValue = element.value;
            element.value = value;
            const event = new Event('input', { bubbles: true });
            const tracker = element._valueTracker;
            if (tracker) tracker.setValue(lastValue);
            element.dispatchEvent(event);
        };

        const titleField = document.querySelector(SELECTORS.target.titleInput);
        const descField = document.querySelector(SELECTORS.target.descInput);
        const priceField = document.querySelector(SELECTORS.target.priceInput);

        if (titleField) setNativeValue(titleField, data.title);
        if (descField) setNativeValue(descField, data.description);
        if (priceField) setNativeValue(priceField, data.price);
    });
}

// === 6. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ КЛИКА ===

function clickByText(textToFind) {
    if (!textToFind) return false;
    const elements = document.querySelectorAll('p, span, div.MuiTypography-root');
    for (let el of elements) {
        if (el.innerText.trim() === textToFind) {
            if (el.offsetParent !== null) { 
                el.click(); 
                if (el.parentElement) el.parentElement.click(); 
                return true;
            }
        }
    }
    return false;
}

function clickNextButton() {
    let nextBtn = document.querySelector(SELECTORS.target.nextBtnClass);
    if (!nextBtn) {
        const buttons = document.querySelectorAll('button');
        for (let btn of buttons) {
            if (btn.innerText.includes('Далее')) {
                nextBtn = btn;
                break;
            }
        }
    }
    if (nextBtn && nextBtn.offsetParent !== null && !nextBtn.disabled) {
        nextBtn.click();
        return true;
    }
    return false;
}

// НОВАЯ ФУНКЦИЯ: Поиск и клик по кнопке подтипа (Файл, Ключ, и т.д.)
function clickSubTypeButton(textToFind) {
    if (!textToFind) return false;
    // Ищем среди конкретных кнопок (div с классом mui-pv687m)
    const buttons = document.querySelectorAll(SELECTORS.target.subTypeBtn);
    
    for (let btn of buttons) {
        // Проверяем, содержит ли кнопка нужный текст
        if (btn.innerText.includes(textToFind)) {
            // Проверяем, не нажата ли она уже (aria-checked)
            const isChecked = btn.getAttribute('aria-checked') === 'true';
            
            if (!isChecked) {
                btn.click();
                return true; // Нажали
            } else {
                return true; // Уже нажата, считаем успехом
            }
        }
    }
    return false;
}

// === 7. ГЛАВНЫЙ ЦИКЛ ===
setInterval(() => {
    const isSellPage = window.location.href.includes('/sell');
    const isProductPage = document.querySelector(SELECTORS.source.title);

    if (!isSellPage) {
        hasPassedCategory = false;
        hasClickedSubType = false;
    }

    // --- СТРАНИЦА ТОВАРА ---
    if (isProductPage) {
        const startBtn = document.getElementById('my-start-btn');
        const pasteBtn = document.getElementById('my-paste-btn');
        if (startBtn) startBtn.remove();
        if (pasteBtn) pasteBtn.remove();
        createCopyButton();
        return; 
    }

    // --- СТРАНИЦА ПРОДАЖИ ---
    if (isSellPage) {
        const copyBtn = document.getElementById('my-copy-btn');
        if (copyBtn) copyBtn.remove();

        chrome.storage.local.get(['pk_saved_product'], (result) => {
            const data = result.pk_saved_product;
            if (!data) return;

            // == ЭТАП 4: ФОРМА ЦЕНЫ (ФИНАЛ) ==
            if (document.querySelector(SELECTORS.target.priceInput)) {
                isAutoProcessActive = false; // Выключаем "беготню" по категориям
                
                // Пытаемся выбрать Подтип (Ключ/Blox Fruits), если он есть в сохраненных
                // Делаем это, только если еще не делали (hasClickedSubType)
                if (data.subType && !hasClickedSubType) {
                    const clicked = clickSubTypeButton(data.subType);
                    if (clicked) {
                        hasClickedSubType = true;
                        showStatus(`Выбрал подраздел: ${data.subType}`);
                    } else {
                         showStatus(`Не нашел кнопку: ${data.subType}`);
                    }
                } else {
                    showStatus('Финиш! Жми Вставить.');
                }
                
                createPasteButton();
                return;
            }

            // == ЭТАП 1: ЖДЕМ СТАРТА ==
            if (!isAutoProcessActive) {
                createStartButton(data.game || 'Авто');
                showStatus('Жду старта...');
            } 
            // == ЭТАП 2/3: РОБОТ БЕГАЕТ ПО МЕНЮ ==
            else {
                if (hasPassedCategory) {
                    showStatus('Выбирай метод/сервер руками...');
                    return; 
                }

                clickByText(data.game);
                
                const isCategoryFound = clickByText(data.category);
                
                if (isCategoryFound) {
                    showStatus(`Выбрал: ${data.category}. Жму Далее.`);
                    const clickedNext = clickNextButton();
                    if (clickedNext) {
                        hasPassedCategory = true; 
                        showStatus('Категория пройдена. Робот спит.');
                    }
                }
            }
        });
    }
}, 1000);