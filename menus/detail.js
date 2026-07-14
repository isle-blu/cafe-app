function getMenuIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

let state = {
  menu: null,
  temperature: "ICE",
  quantity: 1,
};

async function renderDetail() {
  const container = document.getElementById("menu-detail");
  const menu = state.menu;

  if (!menu) {
    container.innerHTML = `<p class="empty-state">메뉴를 찾을 수 없습니다.</p>`;
    return;
  }

  const category = await getCategoryById(menu.categoryId);
  const totalPrice = menu.price * state.quantity;
  const badgesHtml = `
    ${menu.isPopular ? `<span class="badge badge-popular">인기</span>` : ""}
    ${menu.isNew ? `<span class="badge badge-new">신규</span>` : ""}
    ${menu.isSeason ? `<span class="badge badge-season">시즌</span>` : ""}
  `;

  container.innerHTML = `
    <div class="detail-container">
      <div class="detail-image-container">
        <img
          src="${menu.image}"
          alt="${menu.name}"
          onerror="this.src='https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60'"
        >
        <span class="menu-category-tag">${category ? category.name : ""}</span>
      </div>
      <section class="detail-info glass">
        <div class="badges">${badgesHtml}</div>
        <p class="name">${menu.name}</p>
        <p class="price">${formatPrice(menu.price)}</p>
        <p class="description">${menu.description}</p>
        ${menu.isSeason ? `
          <div class="stamp-benefit-notice" style="font-size: var(--font-size-sm); color: #2b5c8f; margin-top: var(--spacing-sm); font-weight: 500; display: inline-flex; align-items: center; background: rgba(43, 92, 143, 0.1); padding: 6px 12px; border-radius: var(--radius-md);">
            <i class="fa-solid fa-gift" style="margin-right: 6px;"></i>시즌 메뉴 구매 시 스탬프 2개 적립!
          </div>
        ` : ""}
      </section>

      ${
        menu.isActive === false
          ? `
        <div class="empty-state" style="margin: 0 var(--spacing-md);">
          <i class="fa-solid fa-circle-exclamation" style="margin-right: 6px;"></i>현재 판매하지 않는 메뉴입니다.
        </div>
      `
          : `
      ${
        menu.hasTemperatureOption
          ? `
        <div class="option-group">
          <p class="label">온도 선택</p>
          <div class="option-buttons">
            <button class="option-btn ${state.temperature === "ICE" ? "active" : ""}" data-temperature="ICE">ICE</button>
            <button class="option-btn ${state.temperature === "HOT" ? "active" : ""}" data-temperature="HOT">HOT</button>
          </div>
        </div>
      `
          : ""
      }

      <div class="option-group">
        <p class="label">수량</p>
        <div class="quantity-control">
          <button id="decrease-btn">-</button>
          <span class="count">${state.quantity}</span>
          <button id="increase-btn">+</button>
        </div>
      </div>

      <div class="add-to-cart-bar glass">
        <span class="total-price">${formatPrice(totalPrice)}</span>
        <button class="add-to-cart-btn" id="add-to-cart-btn">장바구니 담기</button>
      </div>
      `
      }
    </div>
  `;

  bindDetailEvents();
}

function bindDetailEvents() {
  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.temperature = btn.dataset.temperature;
      renderDetail();
    });
  });

  const decreaseBtn = document.getElementById("decrease-btn");
  const increaseBtn = document.getElementById("increase-btn");

  if (decreaseBtn) {
    decreaseBtn.addEventListener("click", () => {
      state.quantity = Math.max(1, state.quantity - 1);
      renderDetail();
    });
  }

  if (increaseBtn) {
    increaseBtn.addEventListener("click", () => {
      if (state.quantity >= 10) {
        alert("한 메뉴당 최대 10잔까지만 주문 가능합니다.");
        return;
      }
      state.quantity += 1;
      renderDetail();
    });
  }

  const addToCartBtn = document.getElementById("add-to-cart-btn");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      addToCart({
        menuId: state.menu.id,
        name: state.menu.name,
        price: state.menu.price,
        temperature: state.menu.hasTemperatureOption ? state.temperature : null,
        quantity: state.quantity,
      });
      window.location.href = "list.html";
    });
  }
}

async function init() {
  const menuId = getMenuIdFromUrl();
  state.menu = await getMenuById(menuId);
  await renderDetail();
}

init();
