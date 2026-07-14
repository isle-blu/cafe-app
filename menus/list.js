let activeCategoryId = "all";
let categoriesForNav = [];
let currentMenus = [];
let selectedTemp = null;
let selectedQty = 1;
let currentModalMenu = null;

async function renderCategoryNav(containerId, tabClass) {
  const containerEl = document.getElementById(containerId);
  const allTabs = [
    { id: "all", name: "전체" },
    { id: "recommended", name: "추천" },
    ...categoriesForNav,
  ];

  containerEl.innerHTML = allTabs
    .map(
      (category) => `
        <button
          class="${tabClass} ${category.id === activeCategoryId ? "active" : ""}"
          data-category-id="${category.id}"
        >${category.name}</button>
      `
    )
    .join("");

  containerEl.querySelectorAll(`.${tabClass}`).forEach((tab) => {
    tab.addEventListener("click", async () => {
      activeCategoryId = tab.dataset.categoryId;
      await renderCategoryNavs();
      await renderMenuGrid();
    });
  });
}

async function renderCategoryNavs() {
  await renderCategoryNav("category-tabs", "category-tab");
}

function renderMenuCard(menu, categoryById) {
  const category = categoryById.get(menu.categoryId);
  const badgesHtml = `
    ${menu.isPopular ? `<span class="badge badge-popular">인기</span>` : ""}
    ${menu.isNew ? `<span class="badge badge-new">신규</span>` : ""}
    ${menu.isSeason ? `<span class="badge badge-season">시즌</span>` : ""}
  `;

  return `
    <article class="menu-card glass" data-menu-id="${menu.id}">
      <div class="menu-image-container">
        <img
          src="${menu.image}"
          alt="${menu.name}"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60'"
        >
        <div class="menu-badges">${badgesHtml}</div>
        <span class="menu-category-tag">${category ? category.name : ""}</span>
      </div>
      <div class="menu-info">
        <p class="name">${menu.name}</p>
        <p class="desc">${menu.description}</p>
        <div class="menu-meta">
          <span class="price">${formatPrice(menu.price)}</span>
          <div class="quick-cart-controls">
            <button class="btn-quick-cart" data-menu-id="${menu.id}" aria-label="옵션 선택 및 장바구니 담기">
              <i class="fa-solid fa-cart-plus"></i>
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

const RECOMMENDED_SECTIONS = [
  { flag: "isPopular", modifier: "popular", title: "인기 메뉴", icon: "fa-fire" },
  { flag: "isNew", modifier: "new", title: "신규 메뉴", icon: "fa-wand-magic-sparkles" },
  { flag: "isSeason", modifier: "season", title: "시즌 메뉴", icon: "fa-leaf" },
];

async function renderMenuGrid() {
  const gridEl = document.getElementById("menu-grid");
  const menus = await getMenusByCategory(activeCategoryId === "recommended" ? "all" : activeCategoryId);
  currentMenus = menus;

  if (menus.length === 0) {
    gridEl.className = "menu-grid";
    gridEl.innerHTML = `<p class="empty-state">등록된 메뉴가 없습니다.</p>`;
    return;
  }

  const categories = await getCategories();
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  if (activeCategoryId === "recommended") {
    const sections = RECOMMENDED_SECTIONS.map((section) => ({
      ...section,
      menus: menus.filter((menu) => menu[section.flag]),
    })).filter((section) => section.menus.length > 0);

    gridEl.className = "menu-sections";

    if (sections.length === 0) {
      gridEl.innerHTML = `<p class="empty-state">추천 메뉴가 아직 없습니다.</p>`;
    } else {
      gridEl.innerHTML = sections
        .map(
          (section) => `
            <section class="menu-section">
              <h2 class="menu-section-title menu-section-title--${section.modifier}">
                <i class="fa-solid ${section.icon}"></i>
                <span>${section.title}</span>
              </h2>
              <div class="menu-grid">
                ${section.menus.map((menu) => renderMenuCard(menu, categoryById)).join("")}
              </div>
            </section>
          `
        )
        .join("");
    }
  } else {
    gridEl.className = "menu-grid";
    gridEl.innerHTML = menus.map((menu) => renderMenuCard(menu, categoryById)).join("");
  }

  gridEl.querySelectorAll(".menu-card").forEach((card) => {
    card.addEventListener("click", () => {
      window.location.href = `detail.html?id=${card.dataset.menuId}`;
    });
  });

  gridEl.querySelectorAll(".btn-quick-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const menuId = Number(btn.dataset.menuId);
      const menu = currentMenus.find((m) => m.id === menuId);
      if (menu) {
        openOptionModal(menu);
      }
    });
  });
}

function openOptionModal(menu) {
  currentModalMenu = menu;
  selectedQty = 1;
  selectedTemp = menu.hasTemperatureOption ? "ICE" : null;

  document.getElementById("modal-menu-name").textContent = menu.name;
  document.getElementById("modal-menu-price").textContent = formatPrice(menu.price);

  const tempSection = document.getElementById("modal-temp-section");
  if (menu.hasTemperatureOption) {
    tempSection.style.display = "flex";
    updateTempSelection(selectedTemp);
  } else {
    tempSection.style.display = "none";
  }

  updateQtyDisplay();
  updateTotalPrice();

  const modal = document.getElementById("option-modal");
  modal.style.display = "flex";
  modal.offsetHeight; // force reflow
  modal.classList.add("show");
}

function updateTempSelection(temp) {
  selectedTemp = temp;
  const iceBtn = document.querySelector(".temp-btn.ice");
  const hotBtn = document.querySelector(".temp-btn.hot");

  if (temp === "ICE") {
    iceBtn.classList.add("selected");
    hotBtn.classList.remove("selected");
  } else {
    iceBtn.classList.remove("selected");
    hotBtn.classList.add("selected");
  }
}

function updateQtyDisplay() {
  document.getElementById("qty-number").textContent = selectedQty;
}

function updateTotalPrice() {
  const total = currentModalMenu.price * selectedQty;
  document.getElementById("modal-total-price").textContent = formatPrice(total);
}

function closeOptionModal() {
  const modal = document.getElementById("option-modal");
  modal.classList.remove("show");
  setTimeout(() => {
    modal.style.display = "none";
  }, 250);
}

function initModalListeners() {
  document.getElementById("modal-close-btn").addEventListener("click", closeOptionModal);

  document.getElementById("option-modal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("option-modal")) {
      closeOptionModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.getElementById("option-modal").classList.contains("show")) {
      closeOptionModal();
    }
  });

  document.querySelector(".temp-btn.ice").addEventListener("click", () => {
    updateTempSelection("ICE");
    updateTotalPrice();
  });
  document.querySelector(".temp-btn.hot").addEventListener("click", () => {
    updateTempSelection("HOT");
    updateTotalPrice();
  });

  document.getElementById("qty-minus-btn").addEventListener("click", () => {
    if (selectedQty > 1) {
      selectedQty--;
      updateQtyDisplay();
      updateTotalPrice();
    }
  });
  document.getElementById("qty-plus-btn").addEventListener("click", () => {
    if (selectedQty < 10) {
      selectedQty++;
      updateQtyDisplay();
      updateTotalPrice();
    } else {
      alert("한 메뉴당 최대 10잔까지만 주문 가능합니다.");
    }
  });

  document.getElementById("modal-add-cart-btn").addEventListener("click", () => {
    if (currentModalMenu) {
      addToCart({
        menuId: currentModalMenu.id,
        name: currentModalMenu.name,
        price: currentModalMenu.price,
        temperature: selectedTemp,
        quantity: selectedQty,
      });
      updateCartBadge();
      closeOptionModal();

      const tempText = selectedTemp ? ` (${selectedTemp})` : "";
      showToast(`${currentModalMenu.name}${tempText} ${selectedQty}개 장바구니 추가 완료!`);
    }
  });
}

function showToast(message) {
  let toast = document.getElementById("toast-notification");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notification";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");

  if (toast.timeoutId) {
    clearTimeout(toast.timeoutId);
  }

  toast.timeoutId = setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

async function init() {
  categoriesForNav = await getCategories();
  initModalListeners();
  await renderCategoryNavs();
  await renderMenuGrid();
}

init();
