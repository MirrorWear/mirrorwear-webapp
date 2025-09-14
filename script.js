// script.js
document.addEventListener('DOMContentLoaded', () => {
  const CATALOG_URL = 'catalog.json';
  let catalog = [];
  let currentCategory = null;
  let currentSubcategory = null;
  let cart = [];

  const CATEGORIES = [
    { name: 'Мужское',    gender: 'male',   sub: ['Рюкзаки', 'Сумки'] },
    { name: 'Женское',    gender: 'female', sub: ['Рюкзаки', 'Сумки'] },
    { name: 'Аксессуары', gender: 'unisex', sub: [] }
  ];

  // === Утилиты ==============================================================
  function navEl() {
    return document.getElementById('categories');
  }

  function clearFocus() {
    document.activeElement?.blur?.();
    const nav = navEl();
    if (nav) nav.querySelectorAll('button, a, .category-btn').forEach(el => el.blur());
  }

  function ensureNoActiveOnRoot() {
    // На корневом уровне не должно быть .active ни у одной кнопки
    const nav = navEl();
    if (!nav) return;
    if (nav.dataset.level === 'root') {
      nav.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
      // страховка на случай, если браузер вернул страницу из BFCache и навесил фокус
      clearFocus();
      // ещё одна микрозадержка — если стили применяются после перерисовки
      setTimeout(() => {
        nav.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
        clearFocus();
      }, 0);
    }
  }

  // При возврате по истории и BFCache снимаем фокус/подсветку
  window.addEventListener('popstate', () => {
    clearFocus();
    ensureNoActiveOnRoot();
  });
  window.addEventListener('pageshow', () => {
    clearFocus();
    ensureNoActiveOnRoot();
  });

  // === 1) Загрузка каталога =================================================
  async function fetchCatalog() {
    const res = await fetch(CATALOG_URL);
    catalog = await res.json();
    showCategories();
  }

  // === 2) Показать корневые категории ======================================
  function showCategories() {
    currentCategory = null;
    currentSubcategory = null;
    document.getElementById('products').innerHTML = '';
    renderCategoryButtons();
    clearFocus();
    ensureNoActiveOnRoot();
  }

  // === 3) Рендер категорий/подкатегорий ====================================
  function renderCategoryButtons() {
    const nav = navEl();
    nav.innerHTML = '';

    // Корень
    if (!currentCategory) {
      nav.dataset.level = 'root';

      CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.textContent = cat.name;
        // На корне запрещаем любые активы
        btn.classList.remove('active');

        btn.onclick = e => {
          e.stopPropagation();
          currentCategory = cat.name;
          currentSubcategory = null;
          renderCategoryButtons();
          if (cat.sub.length === 0) renderProducts();
          btn.blur();
        };

        nav.appendChild(btn);
      });

      // На всякий случай подчистим всё активное
      ensureNoActiveOnRoot();
      return;
    }

    // Подкатегории
    nav.dataset.level = 'sub';

    const back = document.createElement('button');
    back.textContent = '← Назад';
    back.onclick = e => {
      e.stopPropagation();
      showCategories();
      back.blur();
    };
    nav.appendChild(back);

    const catObj = CATEGORIES.find(c => c.name === currentCategory);
    catObj.sub.forEach(sub => {
      const btn = document.createElement('button');
      btn.textContent = sub;
      btn.classList.toggle('active', currentSubcategory === sub);
      btn.onclick = e => {
        e.stopPropagation();
        currentSubcategory = sub;
        renderProducts();
        renderCategoryButtons();
        btn.blur();
      };
      nav.appendChild(btn);
    });

    if (catObj.sub.length === 0) renderProducts();
  }

  // === 4) Рендер товаров ====================================================
  function renderProducts() {
    const main = document.getElementById('products');
    main.innerHTML = '';

    const catObj = CATEGORIES.find(c => c.name === currentCategory);
    if (!catObj) return;

    const filtered = catalog.filter(item => {
      if (item.gender !== catObj.gender) return false;
      if (currentSubcategory && item.category !== currentSubcategory) return false;
      return true;
    });

    if (filtered.length === 0) {
      main.innerHTML = '<p style="color:#bfa000;text-align:center;margin-top:32px;">Нет товаров в этой категории.</p>';
      return;
    }

    filtered.forEach(item => main.appendChild(productCard(item)));
  }

  // === 5) Карточка товара ===================================================
  function productCard(item) {
    const card = document.createElement('div');
    card.className = 'product-card';

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
      const next = document.createElement('button');
      prev.textContent = '←'; next.textContent = '→';
      prev.onclick = () => { idx = (idx - 1 + item.images.length) % item.images.length; img.src = item.images[idx]; };
      next.onclick = () => { idx = (idx + 1) % item.images.length; img.src = item.images[idx]; };
      nav.append(prev, next);
      gallery.appendChild(nav);
    }
    card.appendChild(gallery);

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

    const btn = document.createElement('button');
    btn.className = 'add-to-cart';
    btn.textContent = 'В корзину';
    btn.onclick = e => { e.stopPropagation(); addToCart(item); btn.blur(); };
    card.appendChild(btn);

    return card;
  }

  // === 6) Добавление в корзину =============================================
  function addToCart(item) {
    const found = cart.find(ci => ci.sku === item.sku);
    if (found) found.qty++;
    else cart.push({ ...item, qty: 1 });
    showCart();
  }

  // === 7) Обновление панели корзины ========================================
  function showCart() {
    const items   = document.getElementById('cart-items');
    const summary = document.getElementById('cart-summary');

    if (cart.length === 0) {
      items.innerHTML = '';
      summary.innerHTML = '';
      return;
    }

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
      b.onclick = e => {
        e.stopPropagation();
        const it = cart.find(x => x.sku === sku);
        if (b.classList.contains('plus')) it.qty++;
        else it.qty--;
        cart = cart.filter(x => x.qty > 0);
        showCart();
        b.blur();
      };
    });

    const total = cart.reduce((sum, x) => sum + x.qty * x.price, 0);
    summary.innerHTML = `<b>Итого:</b> ${total} ₽`;
  }

  // === 8) Кнопка «Оформление заказа» =======================================
  const checkoutBtn = document.getElementById('checkout-btn');
  checkoutBtn.textContent = 'Оформление заказа';
  checkoutBtn.onclick = e => {
    e.stopPropagation();
    if (cart.length === 0) return;
    let text = '🛒 Новый заказ%0A';
    cart.forEach(i => { text += `${i.name} (${i.sku}) — ${i.qty}×${i.price}₽%0A`; });
    text += `Итого: ${cart.reduce((s, x) => s + x.qty * x.price, 0)}₽%0A`;
    window.open('https://t.me/MirrorWearSupport?text=' + encodeURIComponent(text), '_blank');
    checkoutBtn.blur();
  };

  // === 9) Очистка корзины ===================================================
  document.getElementById('clear-cart-btn').onclick = e => {
    e.stopPropagation();
    cart = [];
    showCart();
    e.currentTarget.blur?.();
  };

  // === 10) Плавающая кнопка 🛒 — toggle панели =============================
  const openCartBtn = document.createElement('button');
  openCartBtn.id = 'open-cart-btn';
  openCartBtn.className = 'open-cart-btn';
  openCartBtn.textContent = '🛒';
  openCartBtn.title = 'Открыть корзину';
  openCartBtn.onclick = e => {
    e.stopPropagation();
    showCart();
    document.getElementById('cart-panel').classList.toggle('active');
    openCartBtn.blur();
  };
  document.body.appendChild(openCartBtn);

  // === 11) Клик вне панели — скрыть ========================================
  window.addEventListener('click', e => {
    const panel = document.getElementById('cart-panel');
    if (panel.classList.contains('active') && !panel.contains(e.target)) {
      panel.classList.remove('active');
      clearFocus();
      ensureNoActiveOnRoot();
    }
  });

  // === Старт ================================================================
  fetchCatalog();
});

