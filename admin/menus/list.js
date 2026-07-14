// 전역 메뉴 데이터 및 상태 관리
let currentMenus = [];
let activeCategory = "all";
let searchKeyword = "";
let currentViewMode = "grid";

// DOM 요소
const menuGrid = document.getElementById("menuGrid");
const emptyState = document.getElementById("emptyState");
const categoryFilters = document.getElementById("categoryFilters");
const searchInput = document.getElementById("searchInput");
const viewToggle = document.getElementById("viewToggle");

// 초기화 실행
document.addEventListener("DOMContentLoaded", async () => {
  // Supabase로부터 메뉴 데이터를 불러옴
  currentMenus = await getStoredMenus();

  await initCategoryFilters();
  initViewMode();
  renderMenus();
  setupEventListeners();
});

// 카테고리 필터 버튼 렌더링
async function initCategoryFilters() {
  const categories = await getCategories();
  categories.forEach(category => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.setAttribute("data-category", category.id);
    btn.textContent = category.name;
    categoryFilters.appendChild(btn);
  });
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 카테고리 필터 버튼 클릭
  categoryFilters.addEventListener("click", (e) => {
    if (e.target.classList.contains("filter-btn")) {
      // 기존 active 제거
      const activeBtn = categoryFilters.querySelector(".filter-btn.active");
      if (activeBtn) activeBtn.classList.remove("active");

      // 현재 버튼 active 추가
      e.target.classList.add("active");
      activeCategory = e.target.getAttribute("data-category");
      renderMenus();
    }
  });

  // 검색어 입력
  searchInput.addEventListener("input", (e) => {
    searchKeyword = e.target.value.trim().toLowerCase();
    renderMenus();
  });

  // 뷰 모드 토글 클릭
  if (viewToggle) {
    viewToggle.addEventListener("click", (e) => {
      const btn = e.target.closest(".toggle-btn");
      if (btn) {
        currentViewMode = btn.getAttribute("data-view");
        localStorage.setItem("admin-menu-view-mode", currentViewMode);
        updateViewToggleUI();
        applyViewModeClass();
      }
    });
  }
}

// 뷰 모드 초기화 및 헬퍼 함수
function initViewMode() {
  currentViewMode = localStorage.getItem("admin-menu-view-mode") || "grid";
  updateViewToggleUI();
  applyViewModeClass();
}

function updateViewToggleUI() {
  if (!viewToggle) return;
  const buttons = viewToggle.querySelectorAll(".toggle-btn");
  buttons.forEach(btn => {
    if (btn.getAttribute("data-view") === currentViewMode) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function applyViewModeClass() {
  if (!menuGrid) return;
  const section = document.querySelector(".menu-grid-section");
  if (currentViewMode === "list") {
    menuGrid.classList.add("view-list");
    if (section) section.classList.add("view-list-mode");
  } else {
    menuGrid.classList.remove("view-list");
    if (section) section.classList.remove("view-list-mode");
  }
}

// 메뉴 목록 렌더링
async function renderMenus() {
  // 필터링 적용
  const filteredMenus = currentMenus.filter(menu => {
    const matchCategory = activeCategory === "all" || menu.categoryId === activeCategory;
    const matchSearch = menu.name.toLowerCase().includes(searchKeyword);
    return matchCategory && matchSearch;
  });

  // 화면 비우기
  menuGrid.innerHTML = "";

  if (filteredMenus.length === 0) {
    menuGrid.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  menuGrid.style.display = "";
  emptyState.style.display = "none";

  const categories = await getCategories();
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  filteredMenus.forEach(menu => {
    const category = categoryById.get(menu.categoryId);
    const categoryName = category ? category.name : "미지정";

    // 카드 엘리먼트 생성
    const card = document.createElement("div");
    card.className = "menu-card glass" + (menu.isActive === false ? " inactive" : "");

    // 배지 HTML 생성
    let badgesHtml = "";
    if (menu.isActive === false) {
      badgesHtml += `<span class="badge badge-inactive">비공개</span>`;
    }
    if (menu.isPopular) {
      badgesHtml += `<span class="badge badge-popular">인기</span>`;
    }
    if (menu.isNew) {
      badgesHtml += `<span class="badge badge-new">신규</span>`;
    }
    if (menu.isSeason) {
      badgesHtml += `<span class="badge badge-season">시즌</span>`;
    }

    card.innerHTML = `
      <div class="menu-image-container">
        <img src="${menu.image}" alt="${menu.name}" onerror="this.src='https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60'">
      </div>
      <div class="menu-info">
        <div class="menu-info-header">
          <span class="menu-category-tag">${categoryName}</span>
          <div class="menu-badges">${badgesHtml}</div>
        </div>
        <h3 class="menu-name">${menu.name}</h3>
        <div class="menu-meta">
          <span class="menu-price">${formatPrice(menu.price)}</span>
          <span class="menu-options">${menu.hasTemperatureOption ? "ICE/HOT" : "단일온도"}</span>
        </div>
      </div>
      <div class="menu-actions">
        <div class="action-btn" onclick="goToDetail(${menu.id})"><i class="fa-solid fa-circle-info" style="margin-right: 4px;"></i>상세</div>
        <div class="action-btn" onclick="goToEdit(${menu.id})"><i class="fa-solid fa-pen-to-square" style="margin-right: 4px;"></i>수정</div>
        <div class="action-btn" onclick="toggleMenuActive(${menu.id})">
          ${menu.isActive === false
            ? '<i class="fa-solid fa-eye" style="margin-right: 4px;"></i>공개 전환'
            : '<i class="fa-solid fa-eye-slash" style="margin-right: 4px;"></i>비공개 전환'}
        </div>
      </div>
    `;

    menuGrid.appendChild(card);
  });
}

// 페이지 이동 헬퍼
function goToDetail(id) {
  window.location.href = `detail.html?id=${id}`;
}

function goToEdit(id) {
  window.location.href = `edit.html?id=${id}`;
}

// 공개/비공개 즉시 전환
async function toggleMenuActive(id) {
  const menu = currentMenus.find((m) => m.id === id);
  if (!menu) return;

  const nextActive = !menu.isActive;
  await setMenuActive(id, nextActive);
  menu.isActive = nextActive;
  renderMenus();
}
