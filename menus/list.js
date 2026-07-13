let activeCategoryId = "all";

function renderCategoryNav(containerId, tabClass) {
  const containerEl = document.getElementById(containerId);
  const allTabs = [{ id: "all", name: "전체" }, ...CATEGORIES];

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
    tab.addEventListener("click", () => {
      activeCategoryId = tab.dataset.categoryId;
      renderCategoryNavs();
      renderMenuGrid();
    });
  });
}

function renderCategoryNavs() {
  renderCategoryNav("category-tabs", "category-tab");
  renderCategoryNav("category-sidebar", "sidebar-category");
}

function renderMenuGrid() {
  const gridEl = document.getElementById("menu-grid");
  const menus = getMenusByCategory(activeCategoryId);

  if (menus.length === 0) {
    gridEl.innerHTML = `<p class="empty-state">등록된 메뉴가 없습니다.</p>`;
    return;
  }

  gridEl.innerHTML = menus
    .map((menu) => {
      const category = getCategoryById(menu.categoryId);
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
              ${menu.hasTemperatureOption ? `<span class="option-tag">ICE/HOT</span>` : ""}
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  gridEl.querySelectorAll(".menu-card").forEach((card) => {
    card.addEventListener("click", () => {
      window.location.href = `detail.html?id=${card.dataset.menuId}`;
    });
  });
}

renderCategoryNavs();
renderMenuGrid();
