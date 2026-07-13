/* ==========================================================================
   Cafe Isle 메인 페이지 로직
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // 1. 장바구니 배지 업데이트 (utils.js에 의해 실행되나 안전하게 확인)
  if (typeof updateCartBadge === "function") {
    updateCartBadge();
  }

  // 2. 인기 메뉴 동적 렌더링
  renderPopularMenus();
});

/**
 * 로컬 스토리지 또는 data.js에서 메뉴 데이터를 가져와 인기 메뉴 목록을 렌더링합니다.
 */
function renderPopularMenus() {
  const popularGrid = document.getElementById("popular-menu-grid");
  if (!popularGrid) return;

  // utils.js의 getStoredMenus 함수 사용
  let menus = [];
  if (typeof getStoredMenus === "function") {
    menus = getStoredMenus();
  } else if (typeof getStoredMenusRaw === "function") {
    menus = getStoredMenusRaw();
  } else {
    menus = typeof MENUS !== "undefined" ? MENUS : [];
  }

  // 인기 메뉴 필터링 (isPopular === true)
  let popularItems = menus.filter(menu => menu.isPopular);

  // 만약 인기 메뉴로 등록된 항목이 없으면, 전체 메뉴 중 처음 4개를 표시
  if (popularItems.length === 0) {
    popularItems = menus.slice(0, 4);
  } else {
    // 최대 4개까지만 홈에 노출
    popularItems = popularItems.slice(0, 4);
  }

  // 그리드 초기화
  popularGrid.innerHTML = "";

  if (popularItems.length === 0) {
    popularGrid.innerHTML = `<div class="loading-state">등록된 메뉴가 없습니다.</div>`;
    return;
  }

  // 메뉴 카드 엘리먼트 생성 및 추가
  popularItems.forEach(menu => {
    const card = document.createElement("div");
    card.className = "menu-card glass";
    
    // 카테고리 이름 가져오기
    let categoryName = "";
    if (typeof getCategoryById === "function") {
      const category = getCategoryById(menu.categoryId);
      categoryName = category ? category.name : "";
    } else {
      const categoryMap = {
        coffee: "커피",
        "non-coffee": "논커피",
        tea: "티",
        dessert: "디저트"
      };
      categoryName = categoryMap[menu.categoryId] || "";
    }

    // 뱃지 HTML 생성
    let badgesHtml = "";
    if (menu.isPopular) {
      badgesHtml += `<span class="badge badge-popular">인기</span>`;
    }
    if (menu.isNew) {
      badgesHtml += `<span class="badge badge-new">신규</span>`;
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

    popularGrid.appendChild(card);
  });
}
