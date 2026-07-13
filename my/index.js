/* ==========================================================================
   Cafe Isle 마이페이지 로직
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // 상태 관리 상수 및 키
  const USER_KEY = "cafe-app-user";
  const ORDERS_KEY = "cafe-app-orders";
  const COUPONS_KEY = "cafe-app-coupons";
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

  function analyzeOrdersAndStamp() {
    const orders = getLocalData(ORDERS_KEY, []);
    
    let totalCups = 0;
    let totalAmount = 0;

    orders.forEach(order => {
      // 주문 내역 아이템 집계
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const qty = Number(item.quantity) || 0;
          const price = Number(item.price) || 0;
          totalCups += qty;
          totalAmount += (price * qty);
        });
      }
    });





    // 2) 회원 등급 결정
    // 잔수 기준: 0-4 브론즈, 5-14 실버, 15이상 골드
    let grade = "BRONZE";
    let gradeClass = "grade-bronze";

    if (totalCups >= 15) {
      grade = "GOLD";
      gradeClass = "grade-gold";
    } else if (totalCups >= 5) {
      grade = "SILVER";
      gradeClass = "grade-silver";
    }

    userGradeBadgeEl.textContent = grade;
    userGradeBadgeEl.className = `user-grade-badge ${gradeClass}`;

    // 3) 스탬프 및 쿠폰 발급 계산
    // 10잔당 쿠폰 1장씩 자동 발급
    const currentStamps = totalCups % 10;
    const totalCouponRewardCount = Math.floor(totalCups / 10);

    stampCountEl.textContent = currentStamps;
    renderStampGrid(currentStamps);

    // 스탬프 쿠폰 발급 현황 점검
    checkAndIssueStampCoupons(totalCouponRewardCount);

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

  function checkAndIssueStampCoupons(targetCount) {
    let coupons = getLocalData(COUPONS_KEY, null);
    
    // 최초 실행 시 웰컴 쿠폰 발급
    if (!coupons) {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1); // 1달 후 만료
      
      coupons = [
        {
          id: "welcome-10pct",
          name: "신규 가입 감사 10% 할인 쿠폰",
          valueText: "10% 할인",
          isPercent: true,
          expiryDate: expiry.toISOString(),
          type: "welcome"
        }
      ];
      setLocalData(COUPONS_KEY, coupons);
    }

    // 이미 발급받은 스탬프 완성 쿠폰 수 계산
    const currentStampCoupons = coupons.filter(c => c.type === "stamp");
    const diff = targetCount - currentStampCoupons.length;

    if (diff > 0) {
      // 새로운 스탬프 쿠폰 추가 발급
      for (let i = 0; i < diff; i++) {
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 3); // 3달 후 만료
        
        coupons.push({
          id: `stamp-free-drink-${Date.now()}-${i}`,
          name: "스탬프 완성! 무료 음료 쿠폰",
          valueText: "FREE DRINK",
          isPercent: false,
          expiryDate: expiry.toISOString(),
          type: "stamp"
        });
      }
      setLocalData(COUPONS_KEY, coupons);
      
      // 알림 배너 노출
      couponAlertEl.style.display = "block";
      setTimeout(() => {
        couponAlertEl.style.display = "none";
      }, 5000);
    }

    renderCoupons(coupons);
  }

  function renderCoupons(coupons) {
    couponCountEl.textContent = coupons.length;
    couponsListEl.innerHTML = "";

    if (coupons.length === 0) {
      couponsListEl.innerHTML = '<div class="no-coupons">보유하고 계신 쿠폰이 없습니다.</div>';
      return;
    }

    coupons.forEach(coupon => {
      const card = document.createElement("div");
      card.className = "coupon-card glass";

      const left = document.createElement("div");
      left.className = "coupon-left";

      const value = document.createElement("span");
      value.className = "coupon-value";
      if (coupon.valueText === "FREE DRINK") {
        value.classList.add("highlight");
      }
      value.textContent = coupon.valueText;

      const name = document.createElement("span");
      name.className = "coupon-name";
      name.textContent = coupon.name;

      left.appendChild(value);
      left.appendChild(name);

      const right = document.createElement("div");
      right.className = "coupon-right";

      const expiry = document.createElement("span");
      expiry.className = "coupon-expiry";
      expiry.textContent = `${formatDate(coupon.expiryDate)} 까지`;

      const useBtn = document.createElement("button");
      useBtn.className = "coupon-btn";
      useBtn.textContent = "사용하기";
      useBtn.addEventListener("click", () => {
        useCoupon(coupon.id, coupon.name);
      });

      right.appendChild(expiry);
      right.appendChild(useBtn);

      card.appendChild(left);
      card.appendChild(right);
      couponsListEl.appendChild(card);
    });
  }

  function useCoupon(couponId, couponName) {
    if (confirm(`'${couponName}' 쿠폰을 사용하시겠습니까?\n(사용 후에는 복구할 수 없습니다.)`)) {
      let coupons = getLocalData(COUPONS_KEY, []);
      coupons = coupons.filter(c => c.id !== couponId);
      setLocalData(COUPONS_KEY, coupons);
      renderCoupons(coupons);
      alert("쿠폰 사용이 완료되었습니다.");
    }
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
        const totalAmount = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
  analyzeOrdersAndStamp();
});
