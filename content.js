
// content.js - УЛУЧШЕННАЯ ВЕРСИЯ C ВЫБОРОМ ПОДТИПА (Sub-Type)
// Включает улучшенную обработку ошибок, валидацию данных и пользовательский интерфейс

// === 1. ПЕРЕМЕННЫЕ ===
let isAutoProcessActive = false;
let hasPassedCategory = false;
let hasClickedSubType = false; // Флаг: нажали ли мы уже кнопку подтипа (Ключ/Blox Fruits)
let retryCount = 0;
const MAX_RETRIES = 3;

// === 2. НАСТРОЙКИ СЕЛЕКТОРОВ ===
const SELECTORS = {
    source: {
        title: 'h1.MuiTypography-root.mui-19tfdms, h1.product-title, h1[itemprop="name"], h1',
        description: 'p.MuiTypography-root.mui-1v8lgfg, .product-description, [itemprop="description"]',
        price: 'span.MuiTypography-root.mui-228xvi, .product-price, [itemprop="price"]',
        gameName: 'p.mui-16g3ovn, .game-name, [data-testid="game-name"]',
        categoryName: 'p.mui-1yyp5x8, .category-name, [data-testid="category-name"]',
        // НОВОЕ: Подтип (тот самый "Ключ" или "Blox Fruits" на странице товара)
        subTypeName: 'span.mui-1292osh, .sub-type, [data-testid="sub-type"]'
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
    btn.title = 'Скопировать данные товара';
    btn.onclick = copyProductData;
    btn.style.zIndex = '99999'; // Убедимся, что кнопка всегда видна
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.right = '20px';
    document.body.appendChild(btn);

    console.log('Кнопка копирования создана');

    return btn;
}

function createStartButton(gameName) {
    if (document.getElementById('my-start-btn')) return;
    if (document.getElementById('my-paste-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'my-start-btn';
    btn.innerText = `▶️ Старт: ${gameName}`;
    btn.className = 'pk-helper-btn';
    btn.title = 'Начать автоматическое заполнение';
    btn.style.backgroundColor = '#f0ad4e';
    btn.onclick = () => {
        const confirmed = confirm('Начать автоматическое заполнение? Это переместит вас по категориям.');
        if (!confirmed) return;

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
    btn.title = 'Вставить скопированные данные';
    btn.onclick = pasteProductData;
    document.body.appendChild(btn);

    // Создаем кнопку истории
    createHistoryButton();
}

function createHistoryButton() {
    if (document.getElementById('my-history-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'my-history-btn';
    btn.innerText = '📚 ИСТОРИЯ';
    btn.className = 'pk-helper-btn';
    btn.title = 'Посмотреть историю скопированных товаров';
    btn.style.bottom = '140px';
    btn.style.backgroundColor = '#6c757d';
    btn.onclick = showProductHistory;
    document.body.appendChild(btn);
}

function showProductHistory() {
    chrome.storage.local.get(['pk_product_history'], (result) => {
        const history = result.pk_product_history || [];

        if (history.length === 0) {
            showStatus('История пуста');
            return;
        }

        let historyMessage = '📚 История скопированных товаров:\n\n';
        history.forEach((product, index) => {
            historyMessage += `${index + 1}. ${product.title}\n`;
            historyMessage += `   Игра: ${product.game}\n`;
            historyMessage += `   Категория: ${product.category}\n`;
            if (product.subType) historyMessage += `   Подтип: ${product.subType}\n`;
            if (product.price) historyMessage += `   Цена: ${product.price}\n`;
            historyMessage += `   ${new Date(product.timestamp).toLocaleString()}\n\n`;
        });

        // Показываем историю в alert (можно заменить на модальное окно)
        alert(historyMessage);
    });
}

function showStatus(text, isError = false) {
    let status = document.getElementById('pk-status');
    if (!status) {
        status = document.createElement('div');
        status.id = 'pk-status';
        status.style.cssText = 'position:fixed; bottom:10px; left:10px; background:rgba(0,0,0,0.8); color:#fff; padding:5px 10px; z-index:9999; border-radius:5px; font-size:12px; pointer-events:none; transition: all 0.3s;';
        document.body.appendChild(status);
    }
    status.innerText = text;
    status.style.backgroundColor = isError ? 'rgba(255,0,0,0.8)' : 'rgba(0,0,0,0.8)';
    status.style.opacity = '1';

    // Автоматическое скрытие через 5 секунд (кроме ошибок)
    if (!isError) {
        setTimeout(() => {
            status.style.opacity = '0';
        }, 5000);
    }
}

function showError(text) {
    showStatus(text, true);
    console.error('Playerok Helper Error:', text);
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

        console.log('Found elements:', {
            title: !!titleEl,
            description: !!descEl,
            price: !!priceEl,
            game: !!gameEl,
            category: !!catEl,
            subType: !!subTypeEl
        });

        if (!titleEl) {
            showError('Ошибка: Не нашел заголовок товара');
            return;
        }

        // Проверка обязательных полей
        const missingFields = [];
        if (!gameEl) missingFields.push('название игры');
        if (!catEl) missingFields.push('категория');

        if (missingFields.length > 0) {
            showError(`Ошибка: Не найдены обязательные поля: ${missingFields.join(', ')}`);
            return;
        }

        const productData = {
            title: titleEl.innerText.trim(),
            description: descEl ? descEl.innerText.trim() : '',
            price: priceEl ? priceEl.innerText.replace(/[^0-9]/g, '') : '',
            game: gameEl ? gameEl.innerText.trim() : null,
            category: catEl ? catEl.innerText.trim() : null,
            subType: subTypeEl ? subTypeEl.innerText.trim() : null,
            timestamp: new Date().toISOString() // Добавляем метку времени
        };

        // Валидация данных
        if (!productData.title || productData.title.length < 3) {
            showError('Ошибка: Невалидное название товара');
            return;
        }

        if (productData.price && isNaN(parseInt(productData.price))) {
            showError('Ошибка: Невалидная цена');
            return;
        }

        // Сохраняем текущий продукт и добавляем в историю
        chrome.storage.local.get(['pk_saved_product', 'pk_product_history'], (result) => {
            const currentProduct = result.pk_saved_product || {};
            const productHistory = result.pk_product_history || [];

            // Обновляем историю (максимум 5 последних продуктов)
            productHistory.unshift(productData);
            if (productHistory.length > 5) {
                productHistory.pop();
            }

            chrome.storage.local.set({
                'pk_saved_product': productData,
                'pk_product_history': productHistory
            }, () => {
                const btn = document.getElementById('my-copy-btn');
                if (btn) {
                    btn.innerText = '✅ OK!';
                    btn.style.backgroundColor = '#43b581';
                    btn.classList.add('success-pulse');
                    setTimeout(() => {
                        btn.innerText = '📋 COPY FULL';
                        btn.style.backgroundColor = '';
                        btn.classList.remove('success-pulse');
                    }, 1000);
                }

                let msg = `✅ Успешно скопировано!\nИгра: ${productData.game}\nКатегория: ${productData.category}`;
                if (productData.subType) msg += `\nПодтип: ${productData.subType}`;
                if (productData.price) msg += `\nЦена: ${productData.price}`;
                msg += `\n📚 История: ${productHistory.length}/5`;
                showStatus(msg);
            });
        });
    } catch (e) {
        showError(`Неизвестная ошибка: ${e.message}`);
        console.error('Copy error:', e);
    }
}

// === 5. ВСТАВКА ===
function pasteProductData() {
    chrome.storage.local.get(['pk_saved_product', 'pk_product_history'], (result) => {
        const data = result.pk_saved_product;
        if (!data) {
            showError('Нет сохраненных данных для вставки');
            return;
        }

        const setNativeValue = (element, value) => {
            if (!element) return;
            const lastValue = element.value;
            element.value = value;
            const event = new Event('input', { bubbles: true });
            const tracker = element._valueTracker;
            if (tracker) tracker.setValue(lastValue);
            element.dispatchEvent(event);
        };

        const titleField = getCachedElement(SELECTORS.target.titleInput, 'titleField');
        const descField = getCachedElement(SELECTORS.target.descInput, 'descField');
        const priceField = getCachedElement(SELECTORS.target.priceInput, 'priceField');

        if (titleField) setNativeValue(titleField, data.title);
        if (descField) setNativeValue(descField, data.description);
        if (priceField) setNativeValue(priceField, data.price);

        showStatus(`✅ Данные вставлены: ${data.title}`);

        // Показываем уведомление о возможности выбора из истории
        const history = result.pk_product_history || [];
        if (history.length > 1) {
            setTimeout(() => {
                showStatus(`💡 Нажмите "📚 ИСТОРИЯ" чтобы выбрать другой товар (${history.length} шт.)`);
            }, 2000);
        }
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

// Новая функция: Кэширование DOM элементов для улучшения производительности
function getCachedElement(selector, cacheKey) {
    if (!window.pkElementCache) {
        window.pkElementCache = {};
    }

    if (window.pkElementCache[cacheKey]) {
        return window.pkElementCache[cacheKey];
    }

    const element = document.querySelector(selector);
    if (element) {
        window.pkElementCache[cacheKey] = element;
    }
    return element;
}

// Новая функция: Очистка кэша при смене страницы
function clearElementCache() {
    if (window.pkElementCache) {
        window.pkElementCache = {};
    }
}

// Новая функция: Проверка видимости элемента
function isElementVisible(element) {
    if (!element) return false;
    return element.offsetParent !== null &&
           getComputedStyle(element).display !== 'none' &&
           getComputedStyle(element).visibility !== 'hidden';
}

// === 7. ГЛАВНЫЙ ЦИКЛ ===
setInterval(() => {
    const isSellPage = window.location.href.includes('/sell');

    if (!isSellPage) {
        hasPassedCategory = false;
        hasClickedSubType = false;
        retryCount = 0;
        clearElementCache(); // Очищаем кэш при смене страницы
    }

    // Логика для страницы продажи остается в функции checkPageType
}, 1000);

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Playerok Helper загружен, URL:', window.location.href);

    // Создаем кнопку сразу, но делаем ее невидимой
    createCopyButton();
    const copyBtn = document.getElementById('my-copy-btn');
    if (copyBtn) {
        copyBtn.style.display = 'none'; // Скрываем сначала
    }

    checkPageType(); // Проверяем тип страницы
});

// Функция для проверки типа страницы
function checkPageType() {
    const url = window.location.href;
    console.log('Проверка URL:', url);

    // Проверяем различные паттерны URL для страницы товара
    const isProductPage = url.includes('/product/') ||
                         url.includes('/item/') ||
                         url.includes('/game/') ||
                         url.includes('/shop/') ||
                         (url.includes('playerok.com') && !url.includes('/sell') && !url.includes('/profile'));

    console.log('Это страница товара?', isProductPage);

    const copyBtn = document.getElementById('my-copy-btn');
    if (copyBtn) {
        if (isProductPage) {
            copyBtn.style.display = 'block';
            console.log('Кнопка копирования показана');
        } else {
            copyBtn.style.display = 'none';
            console.log('Кнопка копирования скрыта');
        }
    }

    // Для страницы продажи удаляем кнопку полностью
    if (url.includes('/sell')) {
        if (copyBtn) {
            copyBtn.remove();
            console.log('Кнопка копирования удалена на странице продажи');
        }
        // Создаем кнопки для страницы продажи
        chrome.storage.local.get(['pk_saved_product'], (result) => {
            const data = result.pk_saved_product;
            if (data) {
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
                        } else {
                            retryCount++;
                            if (retryCount >= MAX_RETRIES) {
                                showError(`Не удалось нажать "Далее" после ${MAX_RETRIES} попыток`);
                                isAutoProcessActive = false;
                                retryCount = 0;
                            }
                        }
                    } else {
                        retryCount++;
                        if (retryCount >= MAX_RETRIES) {
                            showError(`Не удалось найти категорию "${data.category}" после ${MAX_RETRIES} попыток`);
                            isAutoProcessActive = false;
                            retryCount = 0;
                        }
                    }
                }
            }
        });
    }
}

// Обновляем проверку при изменении URL (для SPA)
window.addEventListener('popstate', checkPageType);
window.addEventListener('pushstate', checkPageType);
window.addEventListener('replacestate', checkPageType);

// Проверяем изменения URL каждую секунду (на случай, если SPA не использует history API)
setInterval(checkPageType, 1000);
