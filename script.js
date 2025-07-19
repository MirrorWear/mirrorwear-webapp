let CATALOG_URL = 'catalog.json'; // путь к файлу каталога

let catalog = [];
let currentCategory = null;
let currentSubcategory = null;
let cart = [];

async function fetchCatalog() {
    const res = await fetch(CATALOG_URL);
    catalog = await res.json();
    renderCategories();
}

function renderCategories() {
    const categories = [
        { name: 'Мужская одежда', sub: ['Рюкзаки', 'Сумки', 'Обувь'] },
        { name: 'Женская одежда', sub: ['Рюкзаки', 'Сумки', 'Обувь'] },
        { name: 'Аксессуары', sub: [] }
    ];
    let nav = document.getElementById('categories');
    nav.innerHTML = '';
    categories.forEach(cat => {
        let btn = document.createElement('button');
        btn.textContent = cat.name;
        btn.classList.toggle('active', currentCategory === cat.name);
        btn.onclick = () => {
            currentCategory = cat.name;
            currentSubcategory = null;
            renderSubcategories(cat);
        };
        nav.appendChild(btn);
    });
    if (currentCategory) {
        let cat = categories.find(c => c.name === currentCategory);
        renderSubcategories(cat);
    }
}

function renderSubcategories(cat) {
    let nav = document.getElementById('categories');
    // Удаляем старые подкатегории
    [...nav.querySelectorAll('.subcategory')].forEach(el => el.remove());
    if (cat.sub.length) {
        cat.sub.forEach(sub => {
            let btn = document.createElement('button');
            btn.textContent = sub;
            btn.classList.add('subcategory');
            btn.classList.toggle('active', currentSubcategory === sub);
            btn.onclick = () => {
                currentSubcategory = sub;
                renderProducts();
            };
            nav.appendChild(btn);
        });
    } else {
        currentSubcategory = null;
        renderProducts();
    }
    renderProducts();
}

function renderProducts() {
    let main = document.getElementById('products');
    main.innerHTML = '';
    let filtered = catalog.filter(item => {
        if (currentCategory === 'Мужская одежда' && item.gender === 'male' && (!currentSubcategory || item.category === currentSubcategory)) return true;
        if (currentCategory === 'Женская одежда' && item.gender === 'female' && (!currentSubcategory || item.category === currentSubcategory)) return true;
        if (currentCategory === 'Аксессуары' && item.gender === 'unisex') return true;
        return false;
    });
    if (!filtered.length) {
        main.innerHTML = '<p style="color:#bfa000;text-align:center;margin-top:32px;">Нет товаров в этой категории.</p>';
        return;
    }
    filtered.forEach(item => main.appendChild(productCard(item)));
}

function productCard(item) {
    let card = document.createElement('div');
    card.className = 'product-card';

    // Галерея фото
    let gallery = document.createElement('div');
    gallery.className = 'product-gallery';
    let img = document.createElement('img');
    let currentImg = 0;
    img.src = item.images[0];
    gallery.appendChild(img);
    if (item.images.length > 1) {
        let nav = document.createElement('div');
        nav.className = 'gallery-nav';
        let prev = document.createElement('button');
        prev.innerHTML = '←';
        let next = document.createElement('button');
        next.innerHTML = '→';
        prev.onclick = () => {
            currentImg = (currentImg - 1 + item.images.length) % item.images.length;
            img.src = item.images[currentImg];
        };
        next.onclick = () => {
            currentImg = (currentImg + 1) % item.images.length;
            img.src = item.images[currentImg];
        };
        nav.appendChild(prev);
        nav.appendChild(next);
        gallery.appendChild(nav);
    }
    card.appendChild(gallery);

    // Название, артикул, описание, цена
    let h2 = document.createElement('h2');
    h2.textContent = item.name;
    card.appendChild(h2);
    let sku = document.createElement('div');
    sku.className = 'sku';
    sku.textContent = 'Артикул: ' + item.sku;
    card.appendChild(sku);
    let desc = document.createElement('div');
    desc.className = 'desc';
    desc.textContent = item.description;
    card.appendChild(desc);
    let price = document.createElement('div');
    price.className = 'price';
    price.textContent = item.price ? `${item.price} ₽` : '';
    card.appendChild(price);

    // Кнопка в корзину
    let btn = document.createElement('button');
    btn.className = 'add-to-cart';
    btn.textContent = 'В корзину';
    btn.onclick = () => addToCart(item);
    card.appendChild(btn);

    return card;
}

function addToCart(item) {
    let found = cart.find(ci => ci.sku === item.sku);
    if (found) found.qty += 1;
    else cart.push({ ...item, qty: 1 });
    showCart();
}

function showCart() {
    let panel = document.getElementById('cart-panel');
    let itemsDiv = document.getElementById('cart-items');
    let summaryDiv = document.getElementById('cart-summary');
    if (!cart.length) {
        panel.classList.remove('active');
        return;
    }
    panel.classList.add('active');
    itemsDiv.innerHTML = '';
    cart.forEach(item => {
        let line = document.createElement('div');
        line.innerHTML = `
            <b>${item.name}</b> (${item.sku})<br>
            ${item.price} ₽ × ${item.qty}
            <button data-sku="${item.sku}">−</button>
            <button data-sku="${item.sku}" class="plus">+</button>
        `;
        itemsDiv.appendChild(line);
    });
    itemsDiv.querySelectorAll('button').forEach(btn => {
        let sku = btn.getAttribute('data-sku');
        if (btn.classList.contains('plus')) {
            btn.onclick = () => { cart.find(i => i.sku === sku).qty++; showCart(); };
        } else {
            btn.onclick = () => {
                let it = cart.find(i => i.sku === sku);
                it.qty--;
                if (it.qty <= 0) cart = cart.filter(i => i.sku !== sku);
                showCart();
            };
        }
    });
    let total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    summaryDiv.innerHTML = `<b>Итого:</b> ${total} ₽`;
}

document.getElementById('checkout-btn').onclick = function () {
    if (!cart.length) return;
    // Сформировать сообщение для Telegram
    let text = "🛒 Новый заказ%0A";
    cart.forEach(item => {
        text += `${item.name} (${item.sku}) — ${item.qty} шт. × ${item.price}₽%0A`;
    });
    let total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    text += `Итого: ${total}₽%0A`;
    // Изменить username на твой!
    window.open('https://t.me/MirrorWearSupport?text=' + text, '_blank');
};

document.getElementById('clear-cart-btn').onclick = function () {
    cart = [];
    showCart();
};

window.onclick = function(e) {
    let panel = document.getElementById('cart-panel');
    if (panel.classList.contains('active') && !panel.contains(e.target) && e.target.id !== 'checkout-btn') {
        panel.classList.remove('active');
    }
};

// Запуск
fetchCatalog();
