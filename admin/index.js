/* ==========================================================================
   Cafe Isle 관리자 대시보드 로직
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // 1. 주문 데이터 최근 7일 시뮬레이터 (데이터가 없거나 처음 진입 시 차트를 풍성하게 보여주기 위함)
  initSimulatedOrders();

  // 2. 대시보드 렌더링 초기화
  renderDashboard();

  // 3. 다크모드 동기화
  initAdminTheme();

  // 4. 오늘 날짜 노출
  displayTodayDate();

  // 5. 새로고침 버튼 이벤트 바인딩
  setupRefreshButton();
});

/**
 * 오늘 날짜를 YYYY.MM.DD 요일 포맷으로 표시
 */
function displayTodayDate() {
  const dateDisplay = document.getElementById("admin-date-display");
  if (!dateDisplay) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  
  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dayOfWeek = weekDays[now.getDay()];

  dateDisplay.textContent = `${year}.${month}.${date} ${dayOfWeek}`;
}

/**
 * 새로고침 버튼에 수동 리렌더링 이벤트 바인딩
 */
function setupRefreshButton() {
  const refreshBtn = document.getElementById("btn-refresh");
  if (!refreshBtn) return;

  refreshBtn.addEventListener("click", () => {
    // 회전 애니메이션 클래스 임시 추가
    const svgIcon = refreshBtn.querySelector("svg");
    if (svgIcon) {
      svgIcon.style.transition = "transform 0.6s ease";
      svgIcon.style.transform = "rotate(360deg)";
      
      // 애니메이션 복구
      setTimeout(() => {
        svgIcon.style.transition = "none";
        svgIcon.style.transform = "rotate(0deg)";
      }, 600);
    }

    // 대시보드 강제 리렌더링
    renderDashboard();
  });
}

/**
 * 첫 진입 시 더미 데이터를 최근 일주일 데이터로 변환하여 로컬스토리지에 저장
 */
function initSimulatedOrders() {
  const rawOrders = localStorage.getItem("cafe-app-orders");
  
  // 이미 사용자가 커스텀 주문을 생성해 쌓여있다면 시뮬레이션을 건너뜀
  if (!rawOrders) {
    const baseOrders = typeof ORDERS !== "undefined" ? ORDERS : [];
    const now = new Date();
    
    const simulated = baseOrders.map((order, index) => {
      // 인덱스를 기준으로 오늘부터 6일 전까지의 날짜로 고르게 분포
      const dayOffset = index % 7;
      const orderDate = new Date(now.getTime() - (dayOffset * 24 * 60 * 60 * 1000));
      
      // 시간대도 다양하게 설정
      orderDate.setHours(9 + (index * 2) % 12, (index * 15) % 60, 0);

      // 상태도 현실감 있게 배분
      let status = "수령완료";
      if (index === 0) status = "주문완료";
      else if (index === 1) status = "준비중";
      else if (index === 2) status = "주문취소";
      else if (index === 5) status = "제조중";

      return {
        ...order,
        orderDate: orderDate.toISOString(),
        status: status
      };
    });

    localStorage.setItem("cafe-app-orders", JSON.stringify(simulated));
  }
}

/**
 * 대시보드 데이터 연산 및 화면 렌더링 메인 함수
 */
function renderDashboard() {
  const rawOrders = localStorage.getItem("cafe-app-orders");
  const orders = rawOrders ? JSON.parse(rawOrders) : [];
  
  // 등록된 메뉴 정보 가져오기 (js/utils.js 내 getStoredMenus)
  const menus = typeof getStoredMenus === "function" ? getStoredMenus() : [];

  // 1. 상단 요약 카드 집계
  calculateSummaryCards(orders, menus);

  // 2. 실시간 주문 테이블 렌더링
  renderLiveOrdersTable(orders);

  // 3. 최근 7일 매출 차트 렌더링
  renderSalesChart(orders);

  // 4. 인기 메뉴 Top 5 렌더링
  renderPopularMenus(orders, menus);
}

/**
 * 1. 상단 요약 카드 집계 및 렌더링
 */
function calculateSummaryCards(orders, menus) {
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  
  let todaySales = 0;
  let todayOrdersCount = 0;
  let waitingOrdersCount = 0;

  orders.forEach(order => {
    const orderDateStr = order.orderDate.split("T")[0];
    
    // 오늘의 주문 및 매출 집계 (취소된 주문 제외)
    if (orderDateStr === todayStr) {
      todayOrdersCount++;
      if (order.status !== "주문취소") {
        const orderTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        todaySales += orderTotal;
      }
    }

    // 제조 및 준비 대기 중인 주문 집계 (주문완료, 준비중, 제조중 등)
    if (order.status === "주문완료" || order.status === "준비중" || order.status === "제조중") {
      waitingOrdersCount++;
    }
  });

  // DOM 반영
  document.getElementById("today-sales").textContent = formatPrice(todaySales);
  document.getElementById("today-orders-count").textContent = `${todayOrdersCount}건`;
  document.getElementById("waiting-orders-count").textContent = `${waitingOrdersCount}건`;
  document.getElementById("total-menus-count").textContent = `${menus.length}개`;
}

/**
 * 2. 실시간 주문 관리 테이블 렌더링
 */
function renderLiveOrdersTable(orders) {
  const tbody = document.getElementById("live-orders-tbody");
  if (!tbody) return;

  // 전체 주문을 ID 역순 (가장 최신 주문이 위로 오도록) 정렬
  const sortedOrders = [...orders].sort((a, b) => b.id - a.id);

  if (sortedOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-table">현재 접수된 주문이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = sortedOrders.map(order => {
    // 주문 상품 요약텍스트 생성
    let itemsSummary = "";
    if (order.items && order.items.length > 0) {
      const firstItem = order.items[0];
      const optionText = (firstItem.options && firstItem.options.temp) ? ` (${firstItem.options.temp})` : "";
      if (order.items.length === 1) {
        itemsSummary = `${firstItem.name}${optionText} ${firstItem.quantity}개`;
      } else {
        const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
        itemsSummary = `${firstItem.name}${optionText} 외 ${order.items.length - 1}건 (총 ${totalQty}개)`;
      }
    }

    // 결제 총액 계산
    const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // 날짜 포맷팅 (시간 부분만 예쁘게 표출)
    const dateObj = new Date(order.orderDate);
    const dateFormatted = `${dateObj.getMonth() + 1}.${dateObj.getDate()} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

    // 상태 제어 콤보박스 색상 클래스 정의
    let selectColorClass = "completed";
    if (order.status === "주문취소") selectColorClass = "cancelled";
    else if (order.status === "준비중" || order.status === "주문완료" || order.status === "제조중") selectColorClass = "processing";

    return `
      <tr>
        <td><span class="order-num">#${order.id}</span></td>
        <td><span class="order-time">${dateFormatted}</span></td>
        <td><span class="order-items-summary">${itemsSummary}</span></td>
        <td><span class="order-price-val">${formatPrice(totalAmount)}</span></td>
        <td>
          <select class="status-select ${selectColorClass}" data-order-id="${order.id}">
            <option value="주문완료" ${order.status === "주문완료" ? "selected" : ""}>주문완료</option>
            <option value="준비중" ${order.status === "준비중" ? "selected" : ""}>준비중</option>
            <option value="제조중" ${order.status === "제조중" ? "selected" : ""}>제조중</option>
            <option value="수령완료" ${order.status === "수령완료" ? "selected" : ""}>수령완료</option>
            <option value="주문취소" ${order.status === "주문취소" ? "selected" : ""}>주문취소</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');

  // 콤보박스 변경 이벤트 등록
  const selects = tbody.querySelectorAll(".status-select");
  selects.forEach(select => {
    select.addEventListener("change", (e) => {
      const orderId = Number(e.target.getAttribute("data-order-id"));
      const newStatus = e.target.value;
      
      updateOrderStatus(orderId, newStatus);
    });
  });
}

/**
 * 드롭다운 제어로 주문 상태를 로컬스토리지에 저장하고 갱신
 */
function updateOrderStatus(orderId, newStatus) {
  const rawOrders = localStorage.getItem("cafe-app-orders");
  if (!rawOrders) return;

  const orders = JSON.parse(rawOrders);
  const targetOrder = orders.find(o => o.id === orderId);

  if (targetOrder) {
    targetOrder.status = newStatus;
    localStorage.setItem("cafe-app-orders", JSON.stringify(orders));
    
    // 화면 정보 실시간 리프레시 (리렌더링)
    renderDashboard();
  }
}

/**
 * 3. 최근 7일 매출 차트 렌더링 (CSS 높이 비율을 활용한 막대 그래프)
 */
function renderSalesChart(orders) {
  const chartContainer = document.getElementById("sales-bar-chart");
  if (!chartContainer) return;

  const now = new Date();
  const salesByDay = [];

  // 최근 7일(오늘 포함)의 매출 집계용 객체 생성
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    const dayStr = day.toISOString().split("T")[0]; // YYYY-MM-DD
    salesByDay.push({
      dateStr: dayStr,
      label: `${day.getMonth() + 1}.${day.getDate()}`,
      sales: 0
    });
  }

  // 주문들에서 날짜별 매출 계산 (취소된 주문 제외)
  orders.forEach(order => {
    if (order.status === "주문취소") return;

    const orderDateStr = order.orderDate.split("T")[0];
    const matchDay = salesByDay.find(d => d.dateStr === orderDateStr);
    
    if (matchDay) {
      const orderTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      matchDay.sales += orderTotal;
    }
  });

  // 최대 매출액 구하기 (그래프 스케일링 비율 연산용, 최소 10,000원 기준)
  const maxSales = Math.max(...salesByDay.map(d => d.sales), 10000);

  // 차트 바 HTML 동적 빌드
  chartContainer.innerHTML = salesByDay.map(day => {
    // 백분율 높이값 계산 (최대 100%, 최소 2% 부여)
    const heightPercent = Math.max((day.sales / maxSales) * 100, 2);
    
    return `
      <div class="chart-bar-group">
        <div class="chart-bar-wrapper">
          <div class="chart-bar" style="height: ${heightPercent}%;"></div>
          <span class="chart-tooltip">${formatPrice(day.sales)}</span>
        </div>
        <span class="chart-label">${day.label}</span>
      </div>
    `;
  }).join('');
}

/**
 * 4. 인기 메뉴 Top 5 리스트 집계 및 렌더링
 */
function renderPopularMenus(orders, menus) {
  const listContainer = document.getElementById("popular-menus-list");
  if (!listContainer) return;

  const menuSalesMap = {};

  // 주문들의 품목을 훓어서 각 메뉴별 판매량 및 누적액 합산 (취소된 주문 제외)
  orders.forEach(order => {
    if (order.status === "주문취소") return;

    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        if (!item.name) return;
        
        if (!menuSalesMap[item.name]) {
          menuSalesMap[item.name] = {
            qty: 0,
            revenue: 0
          };
        }
        
        menuSalesMap[item.name].qty += item.quantity;
        menuSalesMap[item.name].revenue += (item.price * item.quantity);
      });
    }
  });

  // 객체를 배열로 변환
  const popularArray = [];
  for (const name in menuSalesMap) {
    popularArray.push({
      name: name,
      qty: menuSalesMap[name].qty,
      revenue: menuSalesMap[name].revenue
    });
  }

  // 판매 수량 기준 내림차순 정렬
  popularArray.sort((a, b) => b.qty - a.qty);

  // 상위 5개 추출
  const top5 = popularArray.slice(0, 5);

  if (top5.length === 0) {
    listContainer.innerHTML = `<p class="empty-table" style="font-size: var(--font-size-xs)">인기 메뉴 집계 데이터가 없습니다.</p>`;
    return;
  }

  listContainer.innerHTML = top5.map((item, index) => {
    // menus 목록에서 해당하는 메뉴의 이미지 주소를 찾아옴
    const matchedMenu = menus.find(m => m.name === item.name);
    const imagePath = matchedMenu ? matchedMenu.image : "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=100&auto=format&fit=crop&q=60";

    return `
      <div class="popular-item">
        <div class="menu-rank-info">
          <span class="menu-rank">${index + 1}</span>
          <img 
            src="${imagePath}" 
            alt="${item.name}" 
            class="menu-thumbnail"
            onerror="this.src='https://images.unsplash.com/photo-1541167760496-1628856ab772?w=100&auto=format&fit=crop&q=60'"
          >
          <div class="menu-name-tag">
            <span class="menu-main-name">${item.name}</span>
            <span class="menu-sales-qty">누적 ${item.qty}잔 판매</span>
          </div>
        </div>
        <span class="menu-sales-revenue">${formatPrice(item.revenue)}</span>
      </div>
    `;
  }).join('');
}

/**
 * 5. 다크모드 테마 동기화 (js/theme.js 기반)
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

// 관리자 세션 제어 초기 바인딩
document.addEventListener("DOMContentLoaded", () => {
  initAdminSession();
});

function initAdminSession() {
  const resetBtn = document.getElementById("btn-session-reset-action");

  // 로그아웃 (관리자 모드 탈출 및 임시 데이터 리셋) 동작
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const confirmReset = confirm("관리자 모드에서 로그아웃하시겠습니까?\n(로그아웃 시 테스트용 주문 내역 및 임시 장바구니 데이터가 초기화됩니다.)");
      if (confirmReset) {
        // 테마 설정을 제외한 모든 서비스 데이터 삭제
        const theme = localStorage.getItem("theme");
        localStorage.clear();
        if (theme) {
          localStorage.setItem("theme", theme);
        }
        
        alert("성공적으로 로그아웃되었습니다. 고객 페이지로 이동합니다.");
        window.location.href = "../index.html";
      }
    });
  }
}
