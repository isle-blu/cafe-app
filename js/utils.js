/* ==========================================================================
   공통 유틸리티 (장바구니, 포맷 등)
   ========================================================================== */

const CART_STORAGE_KEY = "cafe-app-cart";

/* ---------------- 포맷 ---------------- */

function formatPrice(price) {
  return `${price.toLocaleString("ko-KR")}원`;
}

function formatDate(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

/* ---------------- 장바구니 ---------------- */

function getCart() {
  const raw = localStorage.getItem(CART_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(
    (cartItem) =>
      cartItem.menuId === item.menuId &&
      cartItem.temperature === item.temperature
  );

  if (existing) {
    const newQuantity = existing.quantity + (item.quantity || 1);
    if (newQuantity > 10) {
      existing.quantity = 10;
      alert("장바구니에는 메뉴 당 최대 10잔까지만 담을 수 있습니다.");
    } else {
      existing.quantity = newQuantity;
    }
  } else {
    const quantity = item.quantity || 1;
    if (quantity > 10) {
      alert("한 메뉴당 최대 10잔까지만 주문 가능합니다.");
      cart.push({
        menuId: item.menuId,
        name: item.name,
        price: item.price,
        temperature: item.temperature || null,
        quantity: 10,
      });
    } else {
      cart.push({
        menuId: item.menuId,
        name: item.name,
        price: item.price,
        temperature: item.temperature || null,
        quantity: quantity,
      });
    }
  }

  saveCart(cart);
  return cart;
}

function removeFromCart(menuId, temperature) {
  const cart = getCart().filter(
    (item) => !(item.menuId === menuId && item.temperature === temperature)
  );
  saveCart(cart);
  return cart;
}

function updateCartQuantity(menuId, temperature, quantity) {
  const cart = getCart();
  const target = cart.find(
    (item) => item.menuId === menuId && item.temperature === temperature
  );

  if (target) {
    if (quantity > 10) {
      target.quantity = 10;
      alert("한 메뉴당 최대 10잔까지만 주문 가능합니다.");
    } else {
      target.quantity = Math.max(1, quantity);
    }
    saveCart(cart);
  }

  return cart;
}

function clearCart() {
  saveCart([]);
}

function getCartCount() {
  return getCart().reduce((total, item) => total + item.quantity, 0);
}

function getCartTotal() {
  return getCart().reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}

/* ---------------- 메뉴 데이터 (로컬 스토리지 연동) ---------------- */

const MENUS_STORAGE_KEY = "cafe-app-menus";

// 카테고리별 기본 이미지 매핑
const DEFAULT_IMAGES = {
  coffee: "https://images.unsplash.com/photo-1517959105821-eaf2591984ca?q=80&w=2673&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "non-coffee": "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?q=80&w=2671&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  tea: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60",
  dessert: "https://images.unsplash.com/photo-1714317589223-7d1a2372af3e?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
};

function getStoredMenus() {
  const raw = localStorage.getItem(MENUS_STORAGE_KEY);
  if (!raw) {
    // MENUS 상수는 js/data.js에 존재하므로 전역 변수로 참조
    // 초기 로딩 시 비어있는 이미지를 카테고리 기본 이미지로 채워넣음
    const initialMenus = MENUS.map(menu => ({
      ...menu,
      image: menu.image || DEFAULT_IMAGES[menu.categoryId] || ""
    }));
    localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(initialMenus));
    return initialMenus;
  }
  
  const menus = JSON.parse(raw);
  // 마이그레이션: 로컬스토리지의 기본 메뉴(1~10번)의 이미지를 js/data.js의 최신 이미지 링크로 즉시 동기화
  let updated = false;
  
  menus.forEach(menu => {
    const defaultMenu = MENUS.find(m => m.id === menu.id);
    if (defaultMenu) {
      if (menu.image !== defaultMenu.image || !menu.image) {
        menu.image = defaultMenu.image;
        updated = true;
      }
      if (menu.isSeason === undefined) {
        menu.isSeason = defaultMenu.isSeason || false;
        updated = true;
      }
    } else {
      if (menu.isSeason === undefined) {
        menu.isSeason = false;
        updated = true;
      }
    }
  });
  
  if (updated) {
    localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(menus));
  }
  
  return menus;
}

function saveMenus(menus) {
  localStorage.setItem(MENUS_STORAGE_KEY, JSON.stringify(menus));
}

function getStoredMenuById(id) {
  const menus = getStoredMenus();
  return menus.find((m) => m.id === Number(id)) || null;
}

function createMenu(menuData) {
  const menus = getStoredMenus();
  const nextId = menus.length > 0 ? Math.max(...menus.map(m => m.id)) + 1 : 1;
  const newMenu = {
    id: nextId,
    ...menuData,
    price: Number(menuData.price),
    image: menuData.image || DEFAULT_IMAGES[menuData.categoryId] || ""
  };
  menus.push(newMenu);
  saveMenus(menus);
  return newMenu;
}

function updateMenu(id, menuData) {
  const menus = getStoredMenus();
  const index = menus.findIndex(m => m.id === Number(id));
  if (index !== -1) {
    menus[index] = {
      ...menus[index],
      ...menuData,
      id: Number(id),
      price: Number(menuData.price),
      image: menuData.image || DEFAULT_IMAGES[menuData.categoryId] || ""
    };
    saveMenus(menus);
    return menus[index];
  }
  return null;
}

function deleteMenu(id) {
  const menus = getStoredMenus();
  const filtered = menus.filter(m => m.id !== Number(id));
  saveMenus(filtered);
  return filtered;
}

function checkoutCart() {
  const cart = getCart();
  if (cart.length === 0) return null;

  const rawOrders = localStorage.getItem("cafe-app-orders");
  // ORDERS is from data.js, which is loaded before utils.js or list.js
  const storedOrders = rawOrders ? JSON.parse(rawOrders) : (typeof ORDERS !== "undefined" ? ORDERS : []);
  const nextId = storedOrders.length > 0 ? Math.max(...storedOrders.map(o => o.id)) + 1 : 1001;

  const newOrder = {
    id: nextId,
    orderDate: new Date().toISOString(),
    status: "준비중",
    items: [...cart]
  };

  storedOrders.push(newOrder);
  localStorage.setItem("cafe-app-orders", JSON.stringify(storedOrders));
  clearCart();
  updateCartBadge();
  return newOrder;
}

function updateCartBadge() {
  const badgeEl = document.getElementById("cart-badge");
  if (badgeEl) {
    const count = getCartCount();
    badgeEl.textContent = count;
    badgeEl.setAttribute("data-count", count);
    if (count === 0) {
      badgeEl.style.display = "none";
    } else {
      badgeEl.style.display = "flex";
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", updateCartBadge);
} else {
  updateCartBadge();
}

