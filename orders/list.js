function buildOrderSummary(order) {
  const firstItem = order.items[0];
  const restCount = order.items.length - 1;
  return restCount > 0
    ? `${firstItem.name} 외 ${restCount}건`
    : firstItem.name;
}

function getOrderItemQuantity(order) {
  return order.items.reduce((total, item) => total + item.quantity, 0);
}

async function renderOrderList() {
  const listEl = document.getElementById("order-list");
  const userId = await ensureProfileId();
  const orders = await getOrders(userId);

  if (orders.length === 0) {
    listEl.innerHTML = `<p class="empty-state">주문 내역이 없습니다.</p>`;
    return;
  }

  listEl.innerHTML = orders
    .map((order) => {
      const isCancelled = order.status === "주문취소";
      const hasCoupon = order.discountAmount !== undefined && order.discountAmount > 0;
      const couponBadge = hasCoupon 
        ? `<span class="coupon-use-badge" style="font-size: 0.68rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: rgba(111, 78, 55, 0.08); color: var(--color-primary); border: 1px solid rgba(111, 78, 55, 0.18); display: inline-flex; align-items: center; height: 18px; box-sizing: border-box;">쿠폰사용</span>`
        : "";

      return `
        <article class="order-card glass" data-order-id="${order.id}">
          <div class="order-card-header">
            <span class="order-date">${formatDate(order.orderDate)}</span>
            <div style="display: flex; gap: var(--spacing-xs); align-items: center;">
              ${couponBadge}
              <span class="status-badge ${isCancelled ? "cancelled" : ""}">${order.status}</span>
            </div>
          </div>
          <p class="order-id">주문번호 #${order.id}</p>
          <p class="order-summary">${buildOrderSummary(order)}</p>
          <div class="order-footer" style="display: flex; justify-content: space-between; align-items: flex-end;">
            <span class="item-count">${order.items.length}종 ${getOrderItemQuantity(order)}개</span>
            <div class="order-price-info" style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
              ${hasCoupon ? `<span class="original-price" style="font-size: 0.8rem; text-decoration: line-through; color: var(--color-text-light); font-weight: 500;">${formatPrice(getOrderTotal(order))}</span>` : ""}
              <span class="order-total">${formatPrice(order.finalPrice !== undefined ? order.finalPrice : getOrderTotal(order))}</span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  listEl.querySelectorAll(".order-card").forEach((card) => {
    card.addEventListener("click", () => {
      window.location.href = `detail.html?id=${card.dataset.orderId}`;
    });
  });
}

renderOrderList();

