
// Упрощенная версия - минимальный рабочий код для тестирования

console.log('Playerok Helper: Скрипт загружен!');

// Создаем кнопку сразу при загрузке
function createCopyButton() {
    if (document.getElementById('my-copy-btn')) {
        console.log('Кнопка уже существует');
        return;
    }

    const btn = document.createElement('button');
    btn.id = 'my-copy-btn';
    btn.innerText = '📋 COPY FULL';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.right = '20px';
    btn.style.zIndex = '99999';
    btn.style.padding = '12px 24px';
    btn.style.backgroundColor = '#5865F2';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.cursor = 'pointer';
    btn.style.fontWeight = 'bold';
    btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    btn.style.fontSize = '14px';

    btn.onclick = function() {
        alert('Кнопка работает! Функция копирования будет реализована.');
        console.log('Кнопка нажата!');
    };

    document.body.appendChild(btn);
    console.log('Кнопка копирования создана и видна!');
}

// Проверяем, что мы на сайте Playerok
function checkIfPlayerok() {
    const url = window.location.href;
    const isPlayerok = url.includes('playerok.com');
    console.log('URL:', url);
    console.log('Это Playerok?', isPlayerok);

    if (isPlayerok) {
        createCopyButton();
    } else {
        console.log('Не Playerok, кнопка не создана');
    }
}

// Запускаем при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, запускаем проверку...');
    checkIfPlayerok();
});

// Также проверяем каждую секунду на случай SPA
setInterval(function() {
    checkIfPlayerok();
}, 1000);

// Добавляем стили для кнопки
const style = document.createElement('style');
style.textContent = `
    #my-copy-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 8px rgba(0,0,0,0.15) !important;
    }
`;
document.head.appendChild(style);

console.log('Playerok Helper: Инициализация завершена!');
