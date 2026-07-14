/* ==========================================================================
   Cafe Isle 마이페이지 로직
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  // 상태 관리 상수 및 키
  const USER_KEY = "cafe-app-user";
  // 기본 사용자 데이터
  const defaultUser = {
    name: "홍길동",
    email: "hong@cafeisle.com",
    phone: "010-1234-5678",
    avatar: "☕"
  };

  // DOM 엘리먼트 참조
  const profileNameEl = document.getElementById("profile-name-display");
  const profileEmailEl = document.getElementById("profile-email-display");
  const profilePhoneEl = document.getElementById("profile-phone-display");
  const profileAvatarEl = document.getElementById("profile-avatar-display");
  const userGradeBadgeEl = document.getElementById("user-grade-badge");

  const stampCountEl = document.getElementById("stamp-count");
  const stampGridEl = document.getElementById("stamp-grid");
  const couponAlertEl = document.getElementById("coupon-alert");

  const couponCountEl = document.getElementById("coupon-count");
  const couponsListEl = document.getElementById("coupons-list");

  // 모달 엘리먼트
  const editProfileModal = document.getElementById("edit-profile-modal");
  const allCouponsModal = document.getElementById("all-coupons-modal");
  const openCouponsModalBtn = document.getElementById("open-coupons-modal-btn");
  const closeCouponsModalBtn = document.getElementById("close-coupons-modal-btn");
  const openEditModalBtn = document.getElementById("open-edit-modal-btn");
  const closeEditModalBtn = document.getElementById("close-edit-modal-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const editProfileForm = document.getElementById("edit-profile-form");

  const inputName = document.getElementById("input-name");
  const inputEmail = document.getElementById("input-email");
  const inputPhone = document.getElementById("input-phone");

  const avatarEditBtn = document.getElementById("avatar-edit-btn");
  const avatarSelectModal = document.getElementById("avatar-select-modal");
  const closeAvatarModalBtn = document.getElementById("close-avatar-modal-btn");
  const avatarOptionsContainer = document.querySelector(".avatar-options");

  /* ---------------- 1. 로컬스토리지 도우미 ---------------- */

  function getLocalData(key, defaultValue) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  }

  function setLocalData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  /* ---------------- 2. 유저 정보 ---------------- */

  let currentUser = getLocalData(USER_KEY, null);
  if (!currentUser) {
    currentUser = defaultUser;
    setLocalData(USER_KEY, currentUser);
  }

  function renderProfile() {
    profileNameEl.textContent = currentUser.name;
    profileEmailEl.textContent = currentUser.email;
    profilePhoneEl.textContent = currentUser.phone;
    profileAvatarEl.textContent = currentUser.avatar || "☕";
  }

  /* ---------------- 3. 주문 내역 분석 & 통계 & 스탬프 & 등급 ---------------- */

  async function analyzeOrdersAndStamp() {
    const userId = await ensureProfileId();
    const orders = await getOrders(userId);
    const menus = await getStoredMenus();
    const menuById = new Map(menus.map((menu) => [menu.id, menu]));

    let totalCups = 0;
    let totalStamps = 0;
    let threeMonthsAmount = 0;

    const threeMonthsAgo = new Date();
    const currentMonth = threeMonthsAgo.getMonth();
    threeMonthsAgo.setMonth(currentMonth - 3);
    // 월말 날짜 오버플로우 방어
    if (threeMonthsAgo.getMonth() !== (currentMonth - 3 + 12) % 12) {
      threeMonthsAgo.setDate(0);
    }

    orders.forEach(order => {
      // 취소된 주문은 집계에서 제외
      if (order.status === "주문취소") return;

      const orderPrice = order.finalPrice !== undefined
        ? Number(order.finalPrice)
        : getOrderTotal(order);

      // 최근 3개월 이내 주문만 누적 결제 금액에 산입
      const orderDate = new Date(order.orderDate);
      if (orderDate >= threeMonthsAgo) {
        threeMonthsAmount += orderPrice;
      }

      // 주문 내역 아이템 집계 (전체 기간에 대해 컵 수 및 스탬프 계산)
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const qty = Number(item.quantity) || 0;
          totalCups += qty;

          // 시즌 메뉴 여부 확인하여 스탬프 적립 수 결정
          const menu = menuById.get(item.menuId);
          const isSeason = menu && menu.isSeason;
          const stampsPerUnit = isSeason ? 2 : 1;
          totalStamps += (qty * stampsPerUnit);
        });
      }
    });

    // 2) 회원 등급 결정
    // 최근 3개월 누적 결제 금액 기준: 
    // 0 ~ 29,999 BASIC / 30,000 ~ 79,999 REGULAR / 80,000 ~ 179,999 GOLD / 180,000 이상 VIP
    let grade = "BASIC";
    let gradeClass = "grade-basic";
    let nextGradeText = "";
    let progressPct = 0;

    if (threeMonthsAmount >= 180000) {
      grade = "VIP";
      gradeClass = "grade-vip";
      nextGradeText = "최상위 VIP 등급입니다! 🎉";
      progressPct = 100;
    } else if (threeMonthsAmount >= 80000) {
      grade = "GOLD";
      gradeClass = "grade-gold";
      const needed = 180000 - threeMonthsAmount;
      nextGradeText = `다음 등급(VIP)까지 ${needed.toLocaleString()}원 남음`;
      progressPct = ((threeMonthsAmount - 80000) / 100000) * 100;
    } else if (threeMonthsAmount >= 30000) {
      grade = "REGULAR";
      gradeClass = "grade-regular";
      const needed = 80000 - threeMonthsAmount;
      nextGradeText = `다음 등급(GOLD)까지 ${needed.toLocaleString()}원 남음`;
      progressPct = ((threeMonthsAmount - 30000) / 50000) * 100;
    } else {
      const needed = 30000 - threeMonthsAmount;
      nextGradeText = `다음 등급(REGULAR)까지 ${needed.toLocaleString()}원 남음`;
      progressPct = (threeMonthsAmount / 30000) * 100;
    }

    userGradeBadgeEl.textContent = grade;
    userGradeBadgeEl.className = `user-grade-badge ${gradeClass}`;

    // 3개월 누적 금액 및 안내 바 UI 렌더링
    const amountDisplayEl = document.getElementById("three-months-amount-display");
    const nextGradeInfoEl = document.getElementById("next-grade-info-display");
    const progressBarEl = document.getElementById("grade-progress-bar");

    if (amountDisplayEl) {
      amountDisplayEl.textContent = formatPrice(threeMonthsAmount);
    }
    if (nextGradeInfoEl) {
      nextGradeInfoEl.textContent = nextGradeText;
    }
    if (progressBarEl) {
      progressBarEl.style.width = `${Math.min(100, Math.max(0, progressPct))}%`;
    }

    // 3) 스탬프 및 쿠폰 발급 계산
    // 10개 스탬프당 쿠폰 1장씩 자동 발급
    const currentStamps = totalStamps % 10;
    const totalCouponRewardCount = Math.floor(totalStamps / 10);

    stampCountEl.textContent = currentStamps;
    renderStampGrid(currentStamps);

    // 계산된 스탬프 현황을 profiles에 미러링 (orders가 원본, 이 값은 조회 편의용 캐시)
    await updateStampCounts(userId, currentStamps, totalStamps);

    // 스탬프 쿠폰 발급 현황 점검
    await checkAndIssueStampCoupons(userId, totalCouponRewardCount);

    // 등급별 월간 혜택 쿠폰 발급 점검 (최근 3개월 결제액도 같이 판단)
    await checkAndIssueGradeCoupons(userId, grade, threeMonthsAmount);

    // 4) 최근 주문 렌더링
    renderRecentOrder(orders);
  }

  function renderStampGrid(count) {
    stampGridEl.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
      const slot = document.createElement("div");
      slot.className = "stamp-slot";
      if (i === 10) {
        slot.classList.add("gift");
      }

      if (i <= count) {
        slot.classList.add("stamped");
        slot.innerHTML = `<i class="fa-solid fa-mug-hot" style="font-size: 1.25rem; color: white;"></i>`;
      } else {
        const numSpan = document.createElement("span");
        numSpan.className = "stamp-number";
        numSpan.textContent = i;
        slot.appendChild(numSpan);
      }

      stampGridEl.appendChild(slot);
    }
  }

  /* ---------------- 4. 쿠폰함 로직 ---------------- */

  async function checkAndIssueStampCoupons(userId, targetCount) {
    // 이미 발급받은(사용 여부 무관) 스탬프 완성 쿠폰 수 계산
    const issuedStampCount = await countIssuedCouponsByType(userId, "stamp");
    const diff = targetCount - issuedStampCount;

    if (diff > 0) {
      // 새로운 스탬프 쿠폰 추가 발급
      const newCoupons = [];
      for (let i = 0; i < diff; i++) {
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 3); // 3달 후 만료

        newCoupons.push({
          name: "스탬프 완성! 무료 음료 쿠폰",
          valueText: "FREE DRINK",
          isPercent: false,
          expiryDate: expiry.toISOString(),
          type: "stamp"
        });
      }
      await issueCoupons(userId, newCoupons);

      // 알림 배너 노출
      couponAlertEl.style.display = "block";
      setTimeout(() => {
        couponAlertEl.style.display = "none";
      }, 5000);
    }

    const coupons = await getStoredCoupons(userId);
    renderCoupons(coupons);
  }

  async function checkAndIssueGradeCoupons(userId, currentGrade, threeMonthsAmount) {
    // 최근 3개월 누적 결제 이력이 전혀 없는 무지출 유저는 월간 쿠폰 지급 대상에서 제외
    if (threeMonthsAmount <= 0) {
      return;
    }

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const { month: lastIssuedMonth, grade: lastIssuedGrade } = await getLastGradeCouponState(userId);

    // 이번 달에 "지금과 같은 등급"으로 이미 받았다면 패스. 등급이 바뀌었으면 재평가해서 새 등급 쿠폰을 발급한다.
    if (lastIssuedMonth === currentYearMonth && lastIssuedGrade === currentGrade) {
      return;
    }

    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1); // 1달 후 만료

    const newIssuedCoupons = [];

    // 등급별 혜택 쿠폰 생성
    if (currentGrade === "BASIC") {
      // 5% 할인 쿠폰 2장
      for (let i = 0; i < 2; i++) {
        newIssuedCoupons.push({
          name: `[BASIC 혜택] 월간 5% 할인 쿠폰`,
          valueText: "5% 할인",
          isPercent: true,
          discountRate: 0.05,
          expiryDate: expiry.toISOString(),
          type: "grade-monthly"
        });
      }
    } else if (currentGrade === "REGULAR") {
      // 10% 할인 쿠폰 2장
      for (let i = 0; i < 2; i++) {
        newIssuedCoupons.push({
          name: `[REGULAR 혜택] 월간 10% 할인 쿠폰`,
          valueText: "10% 할인",
          isPercent: true,
          discountRate: 0.1,
          expiryDate: expiry.toISOString(),
          type: "grade-monthly"
        });
      }
    } else if (currentGrade === "GOLD") {
      // 15% 할인 쿠폰 2장 + 아메리카노 1잔 무료 쿠폰 1장
      for (let i = 0; i < 2; i++) {
        newIssuedCoupons.push({
          name: `[GOLD 혜택] 월간 15% 할인 쿠폰`,
          valueText: "15% 할인",
          isPercent: true,
          discountRate: 0.15,
          expiryDate: expiry.toISOString(),
          type: "grade-monthly"
        });
      }
      newIssuedCoupons.push({
        name: `[GOLD 혜택] 아메리카노 1잔 무료 쿠폰`,
        valueText: "FREE DRINK",
        isPercent: false,
        expiryDate: expiry.toISOString(),
        type: "grade-monthly"
      });
    } else if (currentGrade === "VIP") {
      // 20% 할인 쿠폰 2장 + 아메리카노 1잔 무료 쿠폰 1장
      for (let i = 0; i < 2; i++) {
        newIssuedCoupons.push({
          name: `[VIP 혜택] 월간 20% 할인 쿠폰`,
          valueText: "20% 할인",
          isPercent: true,
          discountRate: 0.2,
          expiryDate: expiry.toISOString(),
          type: "grade-monthly"
        });
      }
      newIssuedCoupons.push({
        name: `[VIP 혜택] 아메리카노 1잔 무료 쿠폰`,
        valueText: "FREE DRINK",
        isPercent: false,
        expiryDate: expiry.toISOString(),
        type: "grade-monthly"
      });
    }

    if (newIssuedCoupons.length > 0) {
      await issueCoupons(userId, newIssuedCoupons);
      await setLastGradeCouponState(userId, currentYearMonth, currentGrade);

      // 알림 배너 노출
      if (couponAlertEl) {
        couponAlertEl.textContent = `🎉 이번 달 [${currentGrade}] 등급 혜택 쿠폰이 발급되었습니다!`;
        couponAlertEl.style.display = "block";
        setTimeout(() => {
          couponAlertEl.style.display = "none";
        }, 6000);
      }

      const coupons = await getStoredCoupons(userId);
      renderCoupons(coupons);
    }
  }

  function createCouponCardMarkup(coupon) {
    const expiryText = `${formatDate(coupon.expiryDate)} 까지`;

    const now = new Date();
    const expiryDate = new Date(coupon.expiryDate);
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
    const diffTime = targetDate - todayDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let ddayText = "";
    let isUrgent = false;
    if (diffDays < 0) {
      ddayText = "만료";
      isUrgent = true;
    } else if (diffDays === 0) {
      ddayText = "D-Day";
      isUrgent = true;
    } else {
      ddayText = `D-${diffDays}`;
      if (diffDays <= 7) {
        isUrgent = true;
      }
    }

    const valueHighlightClass = coupon.valueText === "FREE DRINK" ? " highlight" : "";
    const urgentClass = isUrgent ? " urgent" : "";

    return `
      <div class="coupon-card glass">
        <div class="coupon-left">
          <span class="coupon-value${valueHighlightClass}">${coupon.valueText}</span>
          <span class="coupon-name">${coupon.name}</span>
        </div>
        <div class="coupon-right">
          <span class="coupon-expiry">${expiryText}</span>
          <span class="coupon-dday${urgentClass}">${ddayText}</span>
        </div>
      </div>
    `;
  }

  function renderCoupons(coupons) {
    const sortedCoupons = sortCoupons(coupons);
    const validCount = sortedCoupons.filter(c => new Date(c.expiryDate) >= new Date()).length;
    couponCountEl.textContent = validCount;
    couponsListEl.innerHTML = "";

    // 쿠폰이 있을 때만 전체보기 버튼 노출
    if (openCouponsModalBtn) {
      openCouponsModalBtn.style.display = sortedCoupons.length > 0 ? "block" : "none";
    }

    if (sortedCoupons.length === 0) {
      couponsListEl.innerHTML = '<div class="no-coupons">보유하고 계신 쿠폰이 없습니다.</div>';
      return;
    }

    // 마이페이지 메인 본문에는 최대 3개만 표시 (유효하고 정렬된 순)
    const displayedCoupons = sortedCoupons.slice(0, 3);
    couponsListEl.innerHTML = displayedCoupons.map(createCouponCardMarkup).join('');
  }

  function renderAllCouponsModal(coupons) {
    const couponsListAllEl = document.getElementById("coupons-list-all");
    if (!couponsListAllEl) return;

    couponsListAllEl.innerHTML = "";
    const sortedCoupons = sortCoupons(coupons);
    if (sortedCoupons.length === 0) {
      couponsListAllEl.innerHTML = '<div class="no-coupons">보유하고 계신 쿠폰이 없습니다.</div>';
      return;
    }

    // 전체 쿠폰 렌더링 (유효하고 정렬된 순)
    couponsListAllEl.innerHTML = sortedCoupons.map(createCouponCardMarkup).join('');
  }

  /* ---------------- 5. 프로필 수정 모달 인터랙션 ---------------- */

  openEditModalBtn.addEventListener("click", () => {
    inputName.value = currentUser.name;
    inputEmail.value = currentUser.email;
    inputPhone.value = currentUser.phone;
    editProfileModal.classList.add("active");
  });

  function closeModal() {
    editProfileModal.classList.remove("active");
  }

  closeEditModalBtn.addEventListener("click", closeModal);
  cancelEditBtn.addEventListener("click", closeModal);

  editProfileModal.addEventListener("click", (e) => {
    if (e.target === editProfileModal) {
      closeModal();
    }
  });

  editProfileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    currentUser.name = inputName.value.trim();
    currentUser.email = inputEmail.value.trim();
    currentUser.phone = inputPhone.value.trim();
    
    setLocalData(USER_KEY, currentUser);
    renderProfile();
    closeModal();
  });

  /* ---------------- 6. 아바타 선택 모달 인터랙션 ---------------- */

  avatarEditBtn.addEventListener("click", () => {
    avatarSelectModal.classList.add("active");
  });

  function closeAvatarModal() {
    avatarSelectModal.classList.remove("active");
  }

  closeAvatarModalBtn.addEventListener("click", closeAvatarModal);
  
  avatarSelectModal.addEventListener("click", (e) => {
    if (e.target === avatarSelectModal) {
      closeAvatarModal();
    }
  });

  avatarOptionsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("avatar-option")) {
      const selectedAvatar = e.target.textContent;
      currentUser.avatar = selectedAvatar;
      setLocalData(USER_KEY, currentUser);
      renderProfile();
      closeAvatarModal();
    }
  });

  /* ---------------- 6.5 쿠폰 전체보기 모달 인터랙션 ---------------- */

  if (openCouponsModalBtn) {
    openCouponsModalBtn.addEventListener("click", async () => {
      const userId = await ensureProfileId();
      const coupons = await getStoredCoupons(userId);
      renderAllCouponsModal(coupons);
      allCouponsModal.classList.add("active");
    });
  }

  function closeCouponsModal() {
    allCouponsModal.classList.remove("active");
  }

  if (closeCouponsModalBtn) {
    closeCouponsModalBtn.addEventListener("click", closeCouponsModal);
  }

  if (allCouponsModal) {
    allCouponsModal.addEventListener("click", (e) => {
      if (e.target === allCouponsModal) {
        closeCouponsModal();
      }
    });
  }

  /* ---------------- 7.5 최근 주문 렌더링 함수 ---------------- */

  function renderRecentOrder(orders) {
    const recentOrderContainer = document.getElementById("recent-order-container");
    if (!recentOrderContainer) return;

    if (orders && orders.length > 0) {
      // id 기준 역순 정렬하여 최신 주문 최대 3건 추출
      const sorted = [...orders].sort((a, b) => b.id - a.id);
      const recentOrders = sorted.slice(0, 3);

      const htmlContent = recentOrders.map(order => {
        // 주문 상품 요약 명칭 생성
        let orderSummary = "";
        if (order.items && order.items.length > 0) {
          const firstItem = order.items[0];
          if (order.items.length === 1) {
            orderSummary = `${firstItem.name} ${firstItem.quantity}개`;
          } else {
            const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
            orderSummary = `${firstItem.name} 외 ${order.items.length - 1}건 (총 ${totalQty}개)`;
          }
        }

        // 총 결제 금액 계산
        const totalAmount = order.finalPrice !== undefined ? order.finalPrice : order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // 상태값 별 뱃지 클래스
        let statusClass = "status-completed";
        if (order.status === "주문취소") {
          statusClass = "status-cancelled";
        } else if (order.status === "준비중" || order.status === "주문완료" || order.status === "제조중") {
          statusClass = "status-processing";
        }

        // 날짜 포맷팅
        const orderDateStr = formatDate(order.orderDate);

        // 상세 주문 아이템 목록 마크업 생성
        const itemsHtml = order.items ? `
          <div class="recent-order-items-list">
            ${order.items.map(item => {
              const optionStr = (item.options && item.options.temp) ? `<span class="recent-order-item-opt">${item.options.temp}</span>` : "";
              return `
                <div class="recent-order-item-detail">
                  <div>
                    <span class="recent-order-item-name">${item.name}</span>
                    ${optionStr}
                  </div>
                  <span class="recent-order-item-qty">${item.quantity}잔</span>
                </div>
              `;
            }).join('')}
          </div>
        ` : '';

        return `
          <a href="../orders/detail.html?id=${order.id}" class="recent-order-card">
            <div class="order-card-top">
              <span class="order-date">${orderDateStr}</span>
              <span class="status-badge-recent ${statusClass}">${order.status}</span>
            </div>
            <div class="order-card-body">
              <span class="order-title">${orderSummary}</span>
              <span class="order-price">${formatPrice(totalAmount)}</span>
            </div>
            ${itemsHtml}
          </a>
        `;
      }).join('');

      recentOrderContainer.innerHTML = htmlContent;
    } else {
      recentOrderContainer.innerHTML = `
        <div class="no-recent-order">
          <p>최근 30일 내에 주문한 내역이 없습니다.</p>
          <a href="../menus/list.html" class="btn-shop-now">첫 주문하러 가기</a>
        </div>
      `;
    }
  }

  /* ---------------- 8. 페이지 초기 로딩 실행 ---------------- */

  renderProfile();
  await analyzeOrdersAndStamp();
});
