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

function renderOrderList() {
  const listEl = document.getElementById("order-list");
  const orders = getOrders();

  if (orders.length === 0) {
    listEl.innerHTML = `<p class="empty-state">주문 내역이 없습니다.</p>`;
    return;
  }

  listEl.innerHTML = orders
    .map((order) => {
      const isCancelled = order.status === "주문취소";

      return `
        <article class="order-card glass" data-order-id="${order.id}">
          <div class="order-card-header">
            <span class="order-date">${formatDate(order.orderDate)}</span>
            <span class="status-badge ${isCancelled ? "cancelled" : ""}">${order.status}</span>
          </div>
          <p class="order-id">주문번호 #${order.id}</p>
          <p class="order-summary">${buildOrderSummary(order)}</p>
          <div class="order-footer">
            <span class="item-count">${order.items.length}종 ${getOrderItemQuantity(order)}개</span>
            <span class="order-total">${formatPrice(order.finalPrice !== undefined ? order.finalPrice : getOrderTotal(order))}</span>
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
