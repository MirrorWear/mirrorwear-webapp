// script.js

document.addEventListener('DOMContentLoaded', () => {

  const CATALOG_URL = 'catalog.json';

  let catalog = [];
  let currentCategory = null;
  let currentSubcategory = null;
  let cart = [];

  const CATEGORIES = [
    { name: 'Мужское', sub: ['Рюкзаки', 'Сумки', 'Обувь'] },
    { name: 'Женское', sub: ['Рюкзаки', 'Сумки', 'Обувь'] },
    { name: 'Аксессуары',     sub: [] }
  ];

  // Загрузить JSON‑каталог и стартовать
  async function fetchCatalog() {
    const res = await fetch(CATALOG_URL);
    catalog = await res.json();
    showCategories();
  }

  // Показать только три топ‑категории
  function showCategories() {
    currentCategory = null;
    currentSubcategory = null;
    document.getElementById('products').innerHTML = '';
    renderCategoryButtons();
  }

  // Нарисовать кнопки (либо топ‑уровня, либо «← Назад» + подкатегорий)
  function renderCategoryButtons() {
    const nav = document.getElementById('categories');
    nav.innerHTML = '';

    if (!currentCategory) {
      // ТОП‑УРОВЕНЬ
      CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.textContent = cat.name;
        btn.classList.toggle('active', false);
        btn.onclick = () => {
          currentCategory = cat.name;
          currentSubcategory = null;
          renderCategoryButtons();
          if (!cat.sub.length) renderProducts();
        };
        nav.appendChild(btn);
      });

    } else {
      // Кнопка «← Назад»
      const back = document.createElement('button');
      back.textContent = '← Назад';
      back.onclick = showCategories;
      nav.appendChild(back);

      // Подкатегории, но скрываем "Обувь"
      const cat = CATEGORIES.find(c => c.name === currentCategory);
      const visibleSubs = cat.sub.filter(sub => sub !== 'Обувь');

      visibleSubs.forEach(sub => {
        const btn = document.createElement('button');
        btn.textContent = sub;
        btn.classList.toggle('active', currentSubcategory === sub);
        btn.onclick = () => {
          currentSubcategory = sub;
          renderProducts();
          renderCategoryButtons();
        };
        nav.appendChild(btn);
      });

      // Если после фильтрации нет подкатегорий — сразу показываем товары
      if (!visibleSubs.length) renderProducts();
    }
  }

  // Отфильтровать и показать карточки товаров
  function renderProducts() {
    const main = document.getElementById('products');
    main.innerHTML = '';

    const filtered = catalog.filter(item => {
      if (currentCategory === 'Мужская одежда' && item.gender === 'male')
        return !currentSubcategory || item.category === currentSubcategory;
      if (currentCategory === 'Женская одежда' && item.gender === 'female')
        return !currentSubcategory || item.category === currentSubcategory;
      if (currentCategory === 'Аксессуары' && item.gender === 'unisex')
        return true;
      return false;
    });

    if (!filtered.length) {
      main.innerHTML = '<p style="color:#bfa000; text-align:center; margin-top:32px;">Нет товаров в этой категории.</p>';
      return;
    }
    filtered.forEach(item => main.appendChild(productCard(item)));
  }

  // Вернуть DOM‑узел карточки товара
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

  // Корзина
  function addToCart(item) {
    const found = cart.find(ci => ci.sku === item.sku);
    if (found) found.qty++;
    else cart.push({ ...item, qty: 1 });
    showCart();
  }

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
    items.querySelectorAll('button').forEach(b => {
      const sku = b.dataset.sku;
      b.onclick = () => {
        const it = cart.find(x => x.sku === sku);
        b.classList.contains('plus') ? it.qty++ : it.qty--;
        cart = cart.filter(x => x.qty > 0);
        showCart();
      };
    });
    const total = cart.reduce((s, x) => s + x.price * x.qty, 0);
    summary.innerHTML = `<b>Итого:</b> ${total} ₽`;
  }

  document.getElementById('checkout-btn').onclick = () => {
    if (!cart.length) return;
    let text = '🛒 Новый заказ%0A';
    cart.forEach(i => {
      text += `${i.name} (${i.sku}) — ${i.qty}×${i.price}₽%0A`;
    });
    const total = cart.reduce((s, x) => s + x.qty * x.price, 0);
    text += `Итого: ${total}₽%0A`;
    window.open(
      'https://t.me/MirrorWearSupport?text=' + encodeURIComponent(text),
      '_blank'
    );
  };

  document.getElementById('clear-cart-btn').onclick = () => {
    cart = [];
    showCart();
  };

  window.addEventListener('click', e => {
    const p = document.getElementById('cart-panel');
    if (
      p.classList.contains('active') &&
      !p.contains(e.target) &&
      e.target.id !== 'checkout-btn'
    ) {
      p.classList.remove('active');
    }
  });

  // Запуск
  fetchCatalog();
});
