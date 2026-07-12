/* ==========================================================================
   Cafe Isle 관리자 주문 상세 JS
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // 1. 주문 상세 로딩 및 바인딩
  initOrderDetail();

  // 2. 테마 초기화
  initAdminTheme();
});

// 상태 변수
let currentOrder = null;
let allOrders = [];

/**
 * URL 파라미터로부터 id를 추출하여 주문 상세 정보 바인딩
 */
function initOrderDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = Number(urlParams.get("id"));

  const rawOrders = localStorage.getItem("cafe-app-orders");
  allOrders = rawOrders ? JSON.parse(rawOrders) : (typeof ORDERS !== "undefined" ? ORDERS : []);
  
  currentOrder = allOrders.find(o => o.id === orderId);

  renderOrderDetail(currentOrder);
}

/**
 * 상세 내역 바인딩 및 렌더링
 */
function renderOrderDetail(order) {
  const container = document.getElementById("order-detail-container");
  if (!container) return;

  if (!order) {
    container.innerHTML = `
      <div class="error-state">
        <p>해당 주문 내역을 찾을 수 없거나 삭제된 주문입니다.</p>
        <a href="list.html" class="btn btn-outline" style="margin-top: 12px; display: inline-block; width: auto;">주문 목록으로 돌아가기</a>
      </div>
    `;
    return;
  }

  // 총 상품 결제액 및 수량 합계 계산
  const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

  // 날짜 포맷팅
  const dateObj = new Date(order.orderDate);
  const dateFormatted = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

  // 주문 개별 상품 상세 리스트 마크업 생성
  const itemsHtml = order.items.map(item => {
    const optionText = (item.options && item.options.temp) ? `<span class="item-opt-col">${item.options.temp}</span>` : "";
    const itemTotal = item.price * item.quantity;
    
    return `
      <div class="receipt-item-row">
        <div class="item-info-col">
          <span class="item-name-col">${item.name}</span>
          ${optionText}
        </div>
        <div class="item-price-col">
          <span class="item-qty-col">${formatPrice(item.price)} x ${item.quantity}개</span>
          <span class="item-tot-price">${formatPrice(itemTotal)}</span>
        </div>
      </div>
    `;
  }).join('');

  let selectColorClass = "completed";
  if (order.status === "주문취소") selectColorClass = "cancelled";
  else if (order.status === "준비중" || order.status === "제조중") selectColorClass = "processing";

  container.innerHTML = `
    <!-- 1열: 영수증 품목 리스트 -->
    <section class="receipt-card glass">
      <div class="receipt-header">
        <h3>주문 내역 명세서</h3>
        <span class="receipt-order-id">주문번호 #${order.id}</span>
      </div>
      <div class="receipt-items-list">
        ${itemsHtml}
      </div>
    </section>

    <!-- 2열: 메타 정보 및 상태 제어 사이드바 -->
    <div class="control-sidebar-column">
      <!-- 주문 기본 정보 카드 -->
      <div class="meta-info-card glass">
        <h4 class="control-title">주문 기본 정보</h4>
        <div class="meta-list">
          <div class="meta-row">
            <span class="label">주문 일자</span>
            <span class="val">${dateFormatted}</span>
          </div>
          <div class="meta-row">
            <span class="label">총 주문 수량</span>
            <span class="val">${totalQty}개</span>
          </div>
          <div class="meta-row">
            <span class="label">결제 방법</span>
            <span class="val">Cafe Isle Pay</span>
          </div>
          <div class="meta-row" style="margin-top: var(--spacing-sm); border-top: 1px dashed var(--color-border); padding-top: var(--spacing-sm);">
            <span class="label">최종 결제 금액</span>
            <span class="val price-highlight">${formatPrice(totalAmount)}</span>
          </div>
        </div>
      </div>

      <!-- 주문 상태 처리 카드 -->
      <div class="status-control-card glass">
        <h4 class="control-title">주문 상태 업데이트</h4>
        <div class="status-update-form">
          <div class="status-group">
            <label class="status-label" for="status-control-select">현재 처리 상태</label>
            <select id="status-control-select" class="status-select-big ${selectColorClass}">
              <option value="준비중" ${order.status === "준비중" ? "selected" : ""}>준비중</option>
              <option value="제조중" ${order.status === "제조중" ? "selected" : ""}>제조중</option>
              <option value="수령완료" ${order.status === "수령완료" ? "selected" : ""}>수령완료</option>
              <option value="주문취소" ${order.status === "주문취소" ? "selected" : ""}>주문취소</option>
            </select>
          </div>
          <button type="button" class="btn-update-status" id="btn-submit-status">상태 적용하기</button>
        </div>
      </div>
    </div>
  `;

  // 상태 업데이트 및 색상 클래스 동적 리스너
  const selectBig = document.getElementById("status-control-select");
  const submitBtn = document.getElementById("btn-submit-status");

  if (selectBig) {
    selectBig.addEventListener("change", (e) => {
      // 선택 색상 갱신
      selectBig.className = "status-select-big"; // 초기화
      let nextColor = "completed";
      if (e.target.value === "주문취소") nextColor = "cancelled";
      else if (e.target.value === "준비중" || e.target.value === "제조중") nextColor = "processing";
      selectBig.classList.add(nextColor);
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const selectedStatus = selectBig.value;
      saveNewStatus(order.id, selectedStatus);
    });
  }
}

/**
 * 변경된 주문 상태를 로컬스토리지에 저장하고 피드백 제공
 */
function saveNewStatus(orderId, newStatus) {
  const targetIndex = allOrders.findIndex(o => o.id === orderId);
  if (targetIndex !== -1) {
    allOrders[targetIndex].status = newStatus;
    localStorage.setItem("cafe-app-orders", JSON.stringify(allOrders));
    
    alert(`주문 #${orderId}의 상태가 [${newStatus}]로 정상 변경되었습니다.`);
    window.location.href = "list.html";
  }
}

/**
 * 다크모드 테마 초기화
 */
function initAdminTheme() {
  const themeToggle = document.getElementById("theme-toggle-btn");
  const currentTheme = localStorage.getItem("theme") || "light";
  
  if (currentTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    if (themeToggle) themeToggle.checked = true;
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    if (themeToggle) themeToggle.checked = false;
  }

  if (themeToggle) {
    themeToggle.addEventListener("change", (e) => {
      if (e.target.checked) {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
      }
    });
  }
}
