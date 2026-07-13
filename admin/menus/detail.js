// 상태 관리
let menuId = null;
let currentMenu = null;

// DOM 요소
const detailCard = document.getElementById("detailCard");
const deleteModal = document.getElementById("deleteModal");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

// 초기화 실행
document.addEventListener("DOMContentLoaded", () => {
  // URL에서 id 파라미터 파싱
  const urlParams = new URLSearchParams(window.location.search);
  menuId = urlParams.get("id");

  if (!menuId) {
    renderError("잘못된 접근입니다.", "메뉴 ID가 제공되지 않았습니다.");
    return;
  }

  // 데이터 로드
  currentMenu = getStoredMenuById(menuId);

  if (!currentMenu) {
    renderError("메뉴를 찾을 수 없습니다.", `ID: ${menuId}에 해당하는 메뉴 정보가 존재하지 않습니다.`);
    return;
  }

  renderMenuDetail();
  setupEventListeners();
});

// 에러 메시지 렌더링
function renderError(title, message) {
  detailCard.innerHTML = `
    <div class="error-message">
      <h3><i class="fa-solid fa-triangle-exclamation" style="color: var(--color-danger); margin-right: 6px;"></i> ${title}</h3>
      <p>${message}</p>
      <a href="list.html" class="btn btn-primary btn-sm" style="margin-top: 20px;">목록으로 돌아가기</a>
    </div>
  `;
}

// 이벤트 리스너 설정
function setupEventListeners() {
  confirmDeleteBtn.addEventListener("click", () => {
    if (menuId) {
      deleteMenu(menuId);
      closeDeleteModal();
      // 삭제 성공 후 목록 페이지로 이동
      window.location.href = "list.html";
    }
  });
}

// 상세 정보 렌더링
function renderMenuDetail() {
  const category = getCategoryById(currentMenu.categoryId);
  const categoryName = category ? category.name : "미지정";

  // 배지 HTML 생성
  let badgesHtml = "";
  if (currentMenu.isPopular) {
    badgesHtml += `<span class="badge badge-popular">인기</span>`;
  }
  if (currentMenu.isNew) {
    badgesHtml += `<span class="badge badge-new">신규</span>`;
  }

  detailCard.innerHTML = `
    <div class="detail-image-box">
      <img src="${currentMenu.image}" alt="${currentMenu.name}" onerror="this.src='https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60'">
    </div>
    <div class="detail-info-box">
      <div class="detail-header">
        <div class="detail-header-tags">
          <span class="detail-category">${categoryName}</span>
          <div class="detail-badges-inline">${badgesHtml}</div>
        </div>
        <h3 class="detail-name">${currentMenu.name}</h3>
      </div>
      
      <p class="detail-desc">${currentMenu.description || "설명이 등록되지 않았습니다."}</p>
      
      <div class="detail-meta-list">
        <div class="meta-item">
          <span class="meta-label">판매 가격</span>
          <span class="meta-value price">${formatPrice(currentMenu.price)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">온도 옵션</span>
          <span class="meta-value">${currentMenu.hasTemperatureOption ? "ICE / HOT 선택 가능" : "온도 선택 불가 (고정)"}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">인기 상품 설정</span>
          <span class="meta-value">${currentMenu.isPopular ? `설정됨 <i class="fa-solid fa-fire" style="color: #e63946; margin-left: 4px;"></i>` : "일반"}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">신규 상품 설정</span>
          <span class="meta-value">${currentMenu.isNew ? `설정됨 <i class="fa-solid fa-star" style="color: #fca311; margin-left: 4px;"></i>` : "일반"}</span>
        </div>
      </div>

      <div class="detail-actions-footer">
        <button class="btn btn-secondary" onclick="window.location.href='list.html'">
          <i class="fa-solid fa-list" style="margin-right: 6px;"></i> 목록으로
        </button>
        <button class="btn btn-primary" onclick="goToEdit(${currentMenu.id})">
          <i class="fa-solid fa-pen-to-square" style="margin-right: 6px;"></i> 수정하기
        </button>
        <button class="btn btn-danger" onclick="openDeleteModal()">
          <i class="fa-solid fa-trash" style="margin-right: 6px;"></i> 삭제하기
        </button>
      </div>
    </div>
  `;
}

// 수정 화면 이동 헬퍼
function goToEdit(id) {
  window.location.href = `edit.html?id=${id}`;
}

// 모달 관리
function openDeleteModal() {
  deleteModal.classList.add("active");
}

function closeDeleteModal() {
  deleteModal.classList.remove("active");
}
