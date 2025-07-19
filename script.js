// Путь к JSON‑файлу с каталогом
const CATALOG_URL = 'catalog.json';

let catalog = [];
let currentCategory = null;
let currentSubcategory = null;
let cart = [];

// Три топ‑категории и их подкатегории
const CATEGORIES = [
  { name: 'Мужская одежда', sub: ['Рюкзаки', 'Сумки', 'Обувь'] },
  { name: 'Женская одежда', sub: ['Рюкзаки', 'Сумки', 'Обувь'] },
  { name: 'Аксессуары',     sub: [] }
];

// 1) Загрузка каталога
async function fetchCatalog() {
  const res = await fetch(CATALOG_URL);
  catalog = await res.json();
  showCategories();
}

// 2) Показать главные категории
function showCategories() {
  currentCategory = null;
  currentSubcategory = null;
  document.getElementById('products').innerHTML = '';
  renderCategoryButtons();
}

// 3) Отрисовка кнопок категорий или подкатегорий + «← Назад»
function renderCategoryButtons() {
  const nav = document.getElementById('categories');
  nav.innerHTML = '';

  if (!currentCategory) {
    // Топ‑уровень: три кнопки
    CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.textContent = cat.name;
      btn.onclick = () => {
        currentCategory = cat.name;
        if (cat.sub.length) renderCategoryButtons(); // покажет «← Назад» + подкатегории
        else renderProducts();
      };
      nav.appendChild(btn);
    });

  } else {
    // Внутри выбранной категории: кнопка «← Назад»
    const back = document.createElement('button');
    back.textContent = '← Назад';
    back.onclick = showCategories;
    nav.appendChild(back);

    // Кнопки подкатегорий (если есть)
    const cat = CATEGORIES.find(c => c.name === currentCategory);
    if (cat.sub.length) {
      cat.sub.forEach(sub => {
        const btn = document.createElement('button');
        btn.textContent = sub;
        btn.onclick = () => {
          currentSubcategory = sub;
          renderProducts();
        };
        nav.appendChild(btn);
      });
    } else {
      // Нет подкатегорий — сразу товары
      renderProducts();
    }
  }
}

// 4) Показать товары по фильтру
function renderProducts() {
  const main = document.getElementById('products');
  main.innerHTML = '';

  const filtered = catalog.filter(item => {
    if (currentCategory === 'Мужская одежда' && item.gender === 'male') {
      return !currentSubcategory || item.category === currentSubcategory;
    }
    if (currentCategory === 'Женская одежда' && item.gender === 'female') {
      return !currentSubcategory || item.category === currentSubcategory;
    }
    if (currentCategory === 'Аксессуары' && item.gender === 'unisex') {
      return true;
    }
    return false;
  });

  if (!filtered.length) {
    main.innerHTML = '<p style="color:#bfa000; text-align:center; margin-top:32px;">Нет товаров в этой категории.</p>';
    return;
  }
  filtered.forEach(item => main.appendChild(productCard(item)));
}

// 5) Карточка товара с галереей и кнопкой «В корзину»
function productCard(item) {
  const card = document.createElement('div');
  card.className = 'product-card';

  // Галерея
  const gallery = document.createElement('div');
  gallery.className = 'product-gallery';
  const img = document.createElement('img');
  let idx = 0;
  img.src = item.images[0];
  gallery.appendChild(img);
  if (item.images.length > 1) {
    const nav = document.createElement('div');
    nav.className = 'gallery-nav';
    const prev = document.createElement('button');
    prev.textContent = '←';
    const next = document.createElement('button');
    next.textContent = '→';
    prev.onclick = () => {
      idx = (idx - 1 + item.images.length) % item.images.length;
      img.src = item.images[idx];
    };
    next.onclick = () => {
      idx = (idx + 1) % item.images.length;
      img.src = item.images[idx];
    };
    nav.append(prev, next);
    gallery.appendChild(nav);
  }
  card.appendChild(gallery);

  // Информация
  const h2 = document.createElement('h2');
  h2.textContent = item.name;
  card.appendChild(h2);

  const sku = document.createElement('div');
  sku.className = 'sku';
  sku.textContent = 'Артикул: ' + item.sku;
  card.appendChild(sku);

  const desc = document.createElement('div');
  desc.className = 'desc';
  desc.textContent = item.description;
  card.appendChild(desc);

  const price = document.createElement('div');
  price.className = 'price';
  price.textContent = item.price ? `${item.price} ₽` : '';
  card.appendChild(price);

  // Кнопка «В корзину»
  const btn = document.createElement('button');
  btn.className = 'add-to-cart';
  btn.textContent = 'В корзину';
  btn.onclick = () => addToCart(item);
  card.appendChild(btn);

  return card;
}

// 6) Добавление в корзину
function addToCart(item) {
  const found = cart.find(ci => ci.sku === item.sku);
  if (found) found.qty++;
  else cart.push({ ...item, qty: 1 });
  showCart();
}

// 7) Показ/скрытие панели корзины
function showCart() {
  const panel   = document.getElementById('cart-panel');
  const items   = document.getElementById('cart-items');
  const summary = document.getElementById('cart-summary');
  if (!cart.length) {
    panel.classList.remove('active');
    return;
  }
  panel.classList.add('active');
  items.innerHTML = '';
  cart.forEach(i => {
    const line = document.createElement('div');
    line.innerHTML = `
      <b>${i.name}</b> (${i.sku}) — ${i.price}₽ × ${i.qty}
      <button data-sku="${i.sku}" class="minus">−</button>
      <button data-sku="${i.sku}" class="plus">+</button>
    `;
    items.appendChild(line);
  });
  // Обработка +/−
  items.querySelectorAll('button').forEach(b => {
    const sku = b.dataset.sku;
    b.onclick = () => {
      const it = cart.find(x => x.sku === sku);
      if (b.classList.contains('plus')) it.qty++;
      else it.qty--;
      cart = cart.filter(x => x.qty > 0);
      showCart();
    };
  });
  const total = cart.reduce((s,x) => s + x.price * x.qty, 0);
  summary.innerHTML = `<b>Итого:</b> ${total} ₽`;
}

// 8) Оформление заказа — открытие чата
document.getElementById('checkout-btn').onclick = () => {
  if (!cart.length) return;
  let text = '🛒 Новый заказ%0A';
  cart.forEach(i => {
    text += `${i.name} (${i.sku}) — ${i.qty}×${i.price}₽%0A`;
  });
  text += `Итого: ${cart.reduce((s,x) => s + x.price*x.qty,0)}₽%0A`;
  // Ваш никнейм в Telegram без @
  window.open('https://t.me/MirrorWearSupport?text=' + text, '_blank');
};

// 9) Очистка корзины
document.getElementById('clear-cart-btn').onclick = () => {
  cart = [];
  showCart();
};

// 10) Закрыть панель при клике вне её
window.onclick = e => {
  const p = document.getElementById('cart-panel');
  if (p.classList.contains('active') && !p.contains(e.target) && e.target.id !== 'checkout-btn') {
    p.classList.remove('active');
  }
};

// Запуск
fetchCatalog();
