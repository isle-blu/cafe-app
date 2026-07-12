/* ==========================================================================
   Cafe Isle 관리자 주문 목록 JS
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // 1. 주문 데이터 로드 및 초기화
  initOrdersList();

  // 2. 테마 초기화
  initAdminTheme();
});

// 상태 변수
let allOrders = [];
let currentViewMode = "table"; // 기본 보기 모드: 테이블

/**
 * 로컬스토리지 주문 데이터 로드 및 렌더링
 */
function initOrdersList() {
  const rawOrders = localStorage.getItem("cafe-app-orders");
  allOrders = rawOrders ? JSON.parse(rawOrders) : (typeof ORDERS !== "undefined" ? ORDERS : []);

  // 레거시 '주문완료' 상태 마이그레이션
  let hasLegacyStatus = false;
  allOrders.forEach(order => {
    if (order.status === "주문완료") {
      order.status = "준비중";
      hasLegacyStatus = true;
    }
  });
  if (hasLegacyStatus) {
    localStorage.setItem("cafe-app-orders", JSON.stringify(allOrders));
  }

  // 초기 렌더링
  performFiltering();

  // 이벤트 리스너 바인딩 (실시간 검색 및 필터)
  const searchInput = document.getElementById("search-order-id");
  const statusSelect = document.getElementById("filter-status");

  if (searchInput) {
    searchInput.addEventListener("input", performFiltering);
  }
  if (statusSelect) {
    statusSelect.addEventListener("change", performFiltering);
  }

  // 보기 모드 탭 전환 이벤트 바인딩
  const btnViewTable = document.getElementById("btn-view-table");
  const btnViewTicket = document.getElementById("btn-view-ticket");

  if (btnViewTable && btnViewTicket) {
    btnViewTable.addEventListener("click", () => {
      // 로컬스토리지에서 최신 상태로 동기화
      const rawOrders = localStorage.getItem("cafe-app-orders");
      allOrders = rawOrders ? JSON.parse(rawOrders) : allOrders;

      currentViewMode = "table";
      btnViewTable.classList.add("active");
      btnViewTicket.classList.remove("active");
      document.getElementById("orders-table-view").style.display = "block";
      document.getElementById("orders-ticket-view").style.display = "none";
      performFiltering();
    });

    btnViewTicket.addEventListener("click", () => {
      // 로컬스토리지에서 최신 상태로 동기화
      const rawOrders = localStorage.getItem("cafe-app-orders");
      allOrders = rawOrders ? JSON.parse(rawOrders) : allOrders;

      currentViewMode = "ticket";
      btnViewTicket.classList.add("active");
      btnViewTable.classList.remove("active");
      document.getElementById("orders-table-view").style.display = "none";
      document.getElementById("orders-ticket-view").style.display = "block";
      performFiltering();
    });
  }
}

/**
 * 실시간 필터 및 검색 수행 함수
 */
function performFiltering() {
  const searchQuery = document.getElementById("search-order-id").value.trim();
  const statusFilter = document.getElementById("filter-status").value;

  let filtered = [...allOrders];

  // 1) 주문번호 검색 필터
  if (searchQuery) {
    filtered = filtered.filter(order => String(order.id).includes(searchQuery));
  }

  // 2) 주문 상태 필터
  if (statusFilter !== "ALL") {
    filtered = filtered.filter(order => order.status === statusFilter);
  }

  // 보기 모드 분기 렌더링
  if (currentViewMode === "table") {
    renderOrdersTable(filtered);
  } else {
    renderTicketView(filtered);
  }
}

/**
 * 주문 관리 테이블 동적 렌더링 (테이블형)
 */
function renderOrdersTable(ordersList) {
  const tbody = document.getElementById("orders-list-tbody");
  if (!tbody) return;

  // 최신 주문이 위로 오도록 정렬 (ID 내림차순)
  const sorted = [...ordersList].sort((a, b) => b.id - a.id);

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-table">조건에 맞는 주문 내역이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = sorted.map(order => {
    // 주문 항목 요약 빌드
    let orderSummary = "";
    let totalQty = 0;
    if (order.items && order.items.length > 0) {
      const firstItem = order.items[0];
      totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
      
      const optionText = (firstItem.options && firstItem.options.temp) ? ` (${firstItem.options.temp})` : "";
      if (order.items.length === 1) {
        orderSummary = `${firstItem.name}${optionText}`;
      } else {
        orderSummary = `${firstItem.name}${optionText} 외 ${order.items.length - 1}건`;
      }
    }

    // 결제 총액 계산
    const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // 날짜 및 시간 예쁘게 포맷팅
    const dateObj = new Date(order.orderDate);
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

    // 셀렉트 박스 색상 클래스
    let selectColorClass = "completed";
    if (order.status === "주문취소") selectColorClass = "cancelled";
    else if (order.status === "준비중" || order.status === "제조중") selectColorClass = "processing";

    return `
      <tr>
        <td><span class="order-num">#${order.id}</span></td>
        <td><span class="order-date-text">${dateStr}</span></td>
        <td><span class="order-desc">${orderSummary}</span></td>
        <td><span class="order-total-qty">${totalQty}개</span></td>
        <td><span class="order-sum-price">${formatPrice(totalAmount)}</span></td>
        <td>
          <select class="status-select ${selectColorClass}" data-order-id="${order.id}">
            <option value="준비중" ${order.status === "준비중" ? "selected" : ""}>준비중</option>
            <option value="제조중" ${order.status === "제조중" ? "selected" : ""}>제조중</option>
            <option value="수령완료" ${order.status === "수령완료" ? "selected" : ""}>수령완료</option>
            <option value="주문취소" ${order.status === "주문취소" ? "selected" : ""}>주문취소</option>
          </select>
        </td>
        <td>
          <a href="detail.html?id=${order.id}" class="btn-view-detail">상세조회</a>
        </td>
      </tr>
    `;
  }).join('');

  // 상태값 제어 이벤트 바인딩
  const selects = tbody.querySelectorAll(".status-select");
  selects.forEach(select => {
    select.addEventListener("change", (e) => {
      const orderId = Number(e.target.getAttribute("data-order-id"));
      const newStatus = e.target.value;

      updateOrderStatusInList(orderId, newStatus, e.target);
    });
  });
}

/**
 * 주문서 티켓형 보드 뷰 동적 렌더링 (주문서형)
 */
function renderTicketView(ordersList) {
  const container = document.getElementById("orders-tickets-container");
  if (!container) return;

  // 최신 주문이 위로 오도록 정렬 (ID 내림차순)
  const sorted = [...ordersList].sort((a, b) => b.id - a.id);

  if (sorted.length === 0) {
    container.innerHTML = `<div class="empty-table" style="grid-column: 1 / -1; text-align: center; padding: var(--spacing-xl); color: var(--color-text-light);">조건에 맞는 주문 내역이 없습니다.</div>`;
    return;
  }

  container.innerHTML = sorted.map(order => {
    // 날짜 및 시간 예쁘게 포맷팅
    const dateObj = new Date(order.orderDate);
    const timeStr = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}:${String(dateObj.getSeconds()).padStart(2, '0')}`;
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    // 결제 총액 계산
    const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

    // 주문 개별 항목 목록 빌드
    const itemsHtml = order.items.map(item => {
      const optionDetails = [];
      if (item.options) {
        if (item.options.temp) optionDetails.push(item.options.temp);
        if (item.options.size) optionDetails.push(item.options.size);
      }
      const optionText = optionDetails.length > 0 ? optionDetails.join(" / ") : "";

      return `
        <div class="ticket-item-row">
          <div class="ticket-item-left">
            <span class="ticket-item-name">${item.name}</span>
            ${optionText ? `<span class="ticket-item-options">${optionText}</span>` : ""}
          </div>
          <span class="ticket-item-qty">x${item.quantity}</span>
        </div>
      `;
    }).join('');

    // 상태에 따른 간편 주방 제어 버튼 구성
    let actionBtnHtml = "";
    if (order.status === "준비중") {
      actionBtnHtml = `<button class="btn-status-advance" data-order-id="${order.id}" data-next-status="제조중">☕ 제조시작</button>`;
    } else if (order.status === "제조중") {
      actionBtnHtml = `<button class="btn-status-advance completed" data-order-id="${order.id}" data-next-status="수령완료">✅ 제조완료 (수령대기)</button>`;
    } else if (order.status === "수령완료") {
      actionBtnHtml = `<button class="btn-status-advance done-display" disabled>👍 처리완료 (수령완료)</button>`;
    } else {
      actionBtnHtml = `<button class="btn-status-advance done-display" disabled>❌ 주문 취소됨</button>`;
    }

    return `
      <div class="order-ticket-card" id="ticket-${order.id}">
        <div class="ticket-header">
          <div class="ticket-num-info">
            <span class="ticket-num">주문서 #${order.id}</span>
            <span class="ticket-time">${dateStr} ${timeStr}</span>
          </div>
          <span class="status-badge ${order.status === '주문취소' ? 'cancelled' : (order.status === '수령완료' ? 'completed' : 'processing')}" style="font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600;">
            ${order.status}
          </span>
        </div>
        <div class="ticket-body">
          <div class="ticket-items-list">
            ${itemsHtml}
          </div>
          <div class="ticket-summary">
            <span class="ticket-total-label">총 수량 ${totalQty}개</span>
            <span class="ticket-price">${formatPrice(totalAmount)}</span>
          </div>
        </div>
        <div class="ticket-actions">
          ${actionBtnHtml}
          <a href="detail.html?id=${order.id}" class="btn-view-detail" style="text-align: center; font-size: 11px; padding: 4px; color: var(--color-text-light); text-decoration: underline;">상세 영수증 보기</a>
        </div>
      </div>
    `;
  }).join('');

  // 상태 전진 이벤트 바인딩
  container.querySelectorAll(".btn-status-advance").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const orderId = Number(e.currentTarget.getAttribute("data-order-id"));
      const nextStatus = e.currentTarget.getAttribute("data-next-status");
      if (!orderId || !nextStatus) return;

      // 로컬스토리지 업데이트 실행
      const targetIndex = allOrders.findIndex(o => o.id === orderId);
      if (targetIndex !== -1) {
        allOrders[targetIndex].status = nextStatus;
        localStorage.setItem("cafe-app-orders", JSON.stringify(allOrders));
        
        // 실시간 화면 업데이트(필터 재호출)
        performFiltering();
      }
    });
  });
}

/**
 * 개별 주문의 상태를 로컬스토리지에 실시간 업데이트하고 셀렉트 박스 스타일 리프레시
 */
function updateOrderStatusInList(orderId, newStatus, selectElement) {
  const targetIndex = allOrders.findIndex(o => o.id === orderId);
  if (targetIndex !== -1) {
    allOrders[targetIndex].status = newStatus;
    localStorage.setItem("cafe-app-orders", JSON.stringify(allOrders));

    // 색상 클래스 오버라이드
    selectElement.className = "status-select"; // 초기화
    let selectColorClass = "completed";
    if (newStatus === "주문취소") selectColorClass = "cancelled";
    else if (newStatus === "준비중" || newStatus === "제조중") selectColorClass = "processing";
    selectElement.classList.add(selectColorClass);

    // 전체 리스트 데이터 동기화를 위해 리렌더링 (그리드 뷰 등 동시 싱크)
    performFiltering();
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
