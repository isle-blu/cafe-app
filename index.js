/* ==========================================================================
   Cafe Isle 메인 페이지 로직
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // 1. 장바구니 배지 업데이트 (utils.js에 의해 실행되나 안전하게 확인)
  if (typeof updateCartBadge === "function") {
    updateCartBadge();
  }

  // 2. 추천 메뉴 동적 렌더링
  renderRecommendedMenus();

  // 3. 관리자 대시보드 버튼 제어 (관리자 로그인 시에만 동적 생성 및 노출)
  const rawUser = localStorage.getItem("cafe-app-logged-in-user");
  const loggedInUser = rawUser ? JSON.parse(rawUser) : null;
  if (loggedInUser && loggedInUser.role === "admin") {
    const headerActions = document.querySelector(".header-actions");
    if (headerActions && !document.getElementById("header-admin-btn")) {
      const adminBtn = document.createElement("a");
      adminBtn.id = "header-admin-btn";
      adminBtn.href = "admin/index.html";
      adminBtn.className = "icon-btn header-admin";
      adminBtn.setAttribute("aria-label", "관리자 대시보드");
      adminBtn.innerHTML = `
        <span class="admin-icon">
          <i class="fa-solid fa-gauge" style="font-size: 20px;"></i>
        </span>
      `;
      // 마이페이지 버튼 뒤에 삽입
      const mypageBtn = headerActions.querySelector(".header-my");
      if (mypageBtn) {
        mypageBtn.after(adminBtn);
      } else {
        headerActions.appendChild(adminBtn);
      }
    }
  }
});

/**
 * Supabase에서 메뉴 데이터를 가져와 추천 메뉴 목록을 렌더링합니다.
 */
async function renderRecommendedMenus() {
  const recommendedGrid = document.getElementById("recommended-menu-grid");
  if (!recommendedGrid) return;

  const menus = await getStoredMenus();

  // 추천 메뉴 필터링 (인기, 신규, 시즌 메뉴 중 하나라도 해당하는 메뉴)
  let recommendedItems = menus.filter(menu => menu.isPopular || menu.isNew || menu.isSeason);

  // 만약 추천 메뉴로 등록된 항목이 없으면, 전체 메뉴 중 처음 4개를 표시
  if (recommendedItems.length === 0) {
    recommendedItems = menus.slice(0, 4);
  } else {
    // 최대 4개까지만 홈에 노출
    recommendedItems = recommendedItems.slice(0, 4);
  }

  // 그리드 초기화
  recommendedGrid.innerHTML = "";

  if (recommendedItems.length === 0) {
    recommendedGrid.innerHTML = `<div class="loading-state">등록된 메뉴가 없습니다.</div>`;
    return;
  }

  const categories = await getCategories();
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  // 메뉴 카드 엘리먼트 생성 및 추가
  recommendedItems.forEach(menu => {
    const card = document.createElement("div");
    card.className = "menu-card glass";

    // 카테고리 이름 가져오기
    const category = categoryById.get(menu.categoryId);
    const categoryName = category ? category.name : "";

    // 뱃지 HTML 생성
    let badgesHtml = "";
    if (menu.isPopular) {
      badgesHtml += `<span class="badge badge-popular">인기</span>`;
    }
    if (menu.isNew) {
      badgesHtml += `<span class="badge badge-new">신규</span>`;
    }
    if (menu.isSeason) {
      badgesHtml += `<span class="badge badge-season">시즌</span>`;
    }

    // 가격 포맷팅
    const priceText = typeof formatPrice === "function" ? formatPrice(menu.price) : `${menu.price.toLocaleString()}원`;

    card.innerHTML = `
      <div class="menu-image-container">
        <div class="menu-badges">
          ${badgesHtml}
        </div>
        <img src="${menu.image}" alt="${menu.name}" onerror="this.src='https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60'" />
        <span class="menu-category-tag">${categoryName}</span>
      </div>
      <div class="menu-info">
        <h4 class="name">${menu.name}</h4>
        <p class="desc">${menu.description || ""}</p>
        <div class="menu-meta">
          <span class="price">${priceText}</span>
          ${menu.hasTemperatureOption ? '<span class="option-tag">ICE/HOT</span>' : ''}
        </div>
      </div>
    `;

    // 카드 클릭 시 상세 페이지로 이동
    card.addEventListener("click", () => {
      window.location.href = `menus/detail.html?id=${menu.id}`;
    });

    recommendedGrid.appendChild(card);
  });
}
