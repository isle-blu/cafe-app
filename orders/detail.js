function getOrderIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function renderOrderDetail() {
  const container = document.getElementById("order-detail");
  const orderId = getOrderIdFromUrl();
  const order = await getOrderById(orderId);

  if (!order) {
    container.innerHTML = `<p class="empty-state">주문을 찾을 수 없습니다.</p>`;
    return;
  }

  const isCancelled = order.status === "주문취소";

  const itemsHtml = order.items
    .map(
      (item) => `
        <div class="item-row glass">
          <div>
            <p class="item-name">${item.name}${item.temperature ? ` (${item.temperature})` : ""}</p>
            <p class="item-option">${formatPrice(item.price)} × ${item.quantity}개</p>
          </div>
          <span class="item-price">${formatPrice(item.price * item.quantity)}</span>
        </div>
      `
    )
    .join("");

  container.innerHTML = `
    <div class="detail-container">
      <section class="detail-summary glass">
        <div class="order-top">
          <span class="order-date">${formatDate(order.orderDate)}</span>
          <span class="status-badge ${isCancelled ? "cancelled" : ""}">${order.status}</span>
        </div>
        <p class="order-id">주문번호 #${order.id}</p>
      </section>

      <div class="item-list">${itemsHtml}</div>

      ${
        order.discountAmount !== undefined && order.discountAmount > 0
          ? `
            <div class="price-summary-box glass" style="display: flex; flex-direction: column; gap: var(--spacing-sm); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-surface); margin-top: var(--spacing-md);">
              <div style="display: flex; justify-content: space-between; font-size: var(--font-size-sm); color: var(--color-text-light);">
                <span>총 주문금액</span>
                <span>${formatPrice(getOrderTotal(order))}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: var(--font-size-sm); color: var(--color-danger);">
                <span>쿠폰 할인 (${order.usedCouponName})</span>
                <span>-${formatPrice(order.discountAmount)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: var(--font-size-md); font-weight: 800; border-top: 1px dashed var(--color-border); padding-top: var(--spacing-sm); color: var(--color-primary-dark);">
                <span>최종 결제금액</span>
                <span style="color: var(--color-primary); font-size: 1.4rem;">${formatPrice(order.finalPrice)}</span>
              </div>
            </div>
            `
          : `
            <div class="total-bar glass">
              <span class="label">총 결제금액</span>
              <span class="amount">${formatPrice(getOrderTotal(order))}</span>
            </div>
            `
      }
    </div>
  `;
}

renderOrderDetail();
