let selectedCouponId = "";
const COUPONS_KEY = "cafe-app-coupons";

function getCoupons() {
  let coupons = localStorage.getItem(COUPONS_KEY);
  if (!coupons) {
    // 신규 가입 웰컴 쿠폰 자동 발급
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
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
    localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
  } else {
    coupons = JSON.parse(coupons);
  }
  return coupons;
}

function calculateDiscount(coupon, totalCartPrice) {
  if (!coupon) return { discountAmount: 0, finalPrice: totalCartPrice };

  if (coupon.isPercent) {
    // 10% 할인
    const discountAmount = Math.floor(totalCartPrice * 0.1);
    return {
      discountAmount,
      finalPrice: Math.max(0, totalCartPrice - discountAmount)
    };
  } else {
    // 스탬프 쿠폰: FREE DRINK (무료 음료 1개 쿠폰)
    // 음료 메뉴(디저트 제외)가 포함되어 있는지 확인하고, 아메리카노 가격(4,500원)만큼 고정 할인
    const cart = getCart();
    let hasDrink = false;

    cart.forEach(item => {
      const menu = getMenuById(item.menuId);
      // 디저트가 아니면 음료로 취급
      if (menu && menu.categoryId !== "dessert") {
        hasDrink = true;
      }
    });

    if (!hasDrink) {
      // 음료가 장바구니에 없으면 쿠폰 적용 불가능
      return { discountAmount: 0, finalPrice: totalCartPrice, isInvalid: true };
    }

    const americanoPrice = 4500;
    const discountAmount = Math.min(totalCartPrice, americanoPrice);

    return {
      discountAmount,
      finalPrice: Math.max(0, totalCartPrice - discountAmount)
    };
  }
}

function renderBasket() {
  const listEl = document.getElementById("basket-list");
  const emptyEl = document.getElementById("empty-state");
  const checkoutEl = document.getElementById("checkout-section");
  const totalCountEl = document.getElementById("total-count");
  const totalPriceEl = document.getElementById("total-price");
  const basketTitleEl = document.getElementById("basket-title");
  const contentCardEl = document.getElementById("basket-content-card");

  const cart = getCart();

  if (basketTitleEl) {
    basketTitleEl.textContent = `장바구니 (${cart.length})`;
  }

  if (cart.length === 0) {
    if (contentCardEl) contentCardEl.style.display = "none";
    emptyEl.style.display = "flex";
    return;
  }

  if (contentCardEl) contentCardEl.style.display = "";
  emptyEl.style.display = "none";

  listEl.innerHTML = cart
    .map((item) => {
      // Find full menu details to get the image
      const menu = getMenuById(item.menuId);
      const defaultImage = "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60";
      const imageSrc = menu ? menu.image : defaultImage;

      const optionBadge = item.temperature
        ? `<span class="item-option ${item.temperature.toLowerCase()}">${item.temperature}</span>`
        : "";

      const subtotal = item.price * item.quantity;

      return `
        <article class="basket-item glass" data-menu-id="${item.menuId}" data-temperature="${item.temperature || ""}">
          <div class="item-image-container">
            <img src="${imageSrc}" alt="${item.name}" onerror="this.src='${defaultImage}'">
          </div>
          <div class="item-details">
            <div class="item-title-row">
              <p class="item-name">${item.name}</p>
              ${optionBadge}
            </div>
            <div class="item-meta">
              <div class="quantity-control">
                <button class="btn-decrease" aria-label="수량 감소">-</button>
                <span class="count">${item.quantity}</span>
                <button class="btn-increase" aria-label="수량 증가">+</button>
              </div>
              <div class="price-container">
                <span class="unit-price">개당 ${formatPrice(item.price)}</span>
                <span class="subtotal-price">${formatPrice(subtotal)}</span>
              </div>
            </div>
          </div>
          <button class="btn-remove" aria-label="품목 삭제">✕</button>
        </article>
      `;
    })
    .join("");

  // Update summary info
  totalCountEl.textContent = `${getCartCount()}개`;

  // 쿠폰 렌더링 및 가격 연산
  const totalCartPrice = getCartTotal();
  const coupons = getCoupons();
  const couponSelect = document.getElementById("coupon-select");

  if (couponSelect) {
    couponSelect.innerHTML = '<option value="">적용할 쿠폰을 선택하세요</option>';
    
    // 유효한 쿠폰들만 옵션으로 노출
    const validCoupons = coupons.filter(coupon => new Date(coupon.expiryDate) >= new Date());
    
    if (validCoupons.length === 0) {
      couponSelect.innerHTML = '<option value="">적용 가능한 쿠폰이 없습니다</option>';
    } else {
      validCoupons.forEach(coupon => {
        const opt = document.createElement("option");
        opt.value = coupon.id;
        opt.textContent = `${coupon.name} (${coupon.valueText})`;
        if (coupon.id === selectedCouponId) {
          opt.selected = true;
        }
        couponSelect.appendChild(opt);
      });
    }
  }

  // 할인 계산 및 무효화 체크
  let currentCoupon = coupons.find(c => c.id === selectedCouponId);
  let discountInfo = calculateDiscount(currentCoupon, totalCartPrice);

  if (selectedCouponId && currentCoupon && discountInfo.isInvalid) {
    alert("무료 음료 쿠폰은 음료 메뉴가 포함되어 있어야 적용할 수 있습니다.");
    selectedCouponId = "";
    if (couponSelect) couponSelect.value = "";
    discountInfo = calculateDiscount(null, totalCartPrice);
  }

  const discountRow = document.getElementById("coupon-discount-row");
  const discountAmountEl = document.getElementById("coupon-discount-amount");

  if (discountInfo.discountAmount > 0) {
    if (discountRow) discountRow.style.display = "flex";
    if (discountAmountEl) discountAmountEl.textContent = `-${formatPrice(discountInfo.discountAmount)}`;
    totalPriceEl.textContent = formatPrice(discountInfo.finalPrice);
  } else {
    if (discountRow) discountRow.style.display = "none";
    totalPriceEl.textContent = formatPrice(totalCartPrice);
  }

  bindBasketEvents();
}

function bindBasketEvents() {
  const listEl = document.getElementById("basket-list");

  listEl.querySelectorAll(".basket-item").forEach((itemEl) => {
    const menuId = Number(itemEl.dataset.menuId);
    const temperature = itemEl.dataset.temperature || null;

    // Decrease
    itemEl.querySelector(".btn-decrease").addEventListener("click", () => {
      const cart = getCart();
      const current = cart.find(
        (item) => item.menuId === menuId && item.temperature === temperature
      );
      if (current && current.quantity > 1) {
        updateCartQuantity(menuId, temperature, current.quantity - 1);
        renderBasket();
      }
    });

    // Increase
    itemEl.querySelector(".btn-increase").addEventListener("click", () => {
      const cart = getCart();
      const current = cart.find(
        (item) => item.menuId === menuId && item.temperature === temperature
      );
      if (current) {
        if (current.quantity >= 10) {
          alert("한 메뉴당 최대 10잔까지만 주문 가능합니다.");
          return;
        }
        updateCartQuantity(menuId, temperature, current.quantity + 1);
        renderBasket();
      }
    });

    // Remove
    itemEl.querySelector(".btn-remove").addEventListener("click", () => {
      removeFromCart(menuId, temperature);
      renderBasket();
    });
  });
}

function init() {
  renderBasket();

  // Coupon change event
  const couponSelect = document.getElementById("coupon-select");
  if (couponSelect) {
    couponSelect.addEventListener("change", (e) => {
      selectedCouponId = e.target.value;
      renderBasket();
    });
  }

  // Order click
  const btnOrder = document.getElementById("btn-order");
  const modal = document.getElementById("order-success-modal");
  const btnModalClose = document.getElementById("btn-modal-close");

  if (btnOrder) {
    btnOrder.addEventListener("click", () => {
      let couponInfo = null;
      if (selectedCouponId) {
        const coupons = getCoupons();
        const coupon = coupons.find(c => c.id === selectedCouponId);
        if (coupon) {
          const discountInfo = calculateDiscount(coupon, getCartTotal());
          couponInfo = {
            id: coupon.id,
            name: coupon.name,
            discountAmount: discountInfo.discountAmount,
            finalPrice: discountInfo.finalPrice
          };
        }
      }

      const newOrder = checkoutCart(couponInfo);
      if (newOrder) {
        // 쿠폰 소모 처리
        if (selectedCouponId) {
          let coupons = getCoupons();
          coupons = coupons.filter(c => c.id !== selectedCouponId);
          localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
          selectedCouponId = ""; // 초기화
        }

        // Show success modal
        modal.style.display = "flex";
      }
    });
  }

  if (btnModalClose) {
    btnModalClose.addEventListener("click", () => {
      modal.style.display = "none";
      window.location.href = "../orders/list.html";
    });
  }
}

init();
