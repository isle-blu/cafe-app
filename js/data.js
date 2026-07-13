/* ==========================================================================
   메뉴 / 카테고리 데이터
   ========================================================================== */

const CATEGORIES = [
  { id: "coffee", name: "커피" },
  { id: "non-coffee", name: "논커피" },
  { id: "tea", name: "티" },
  { id: "dessert", name: "디저트" },
];

const MENUS = [
  {
    id: 1,
    categoryId: "coffee",
    name: "아메리카노",
    price: 4500,
    description: "깊고 진한 에스프레소에 물을 더한 클래식 커피",
    image: "https://images.unsplash.com/photo-1517959105821-eaf2591984ca?q=80&w=2673&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hasTemperatureOption: true,
    isPopular: true,
    isNew: false,
  },
  {
    id: 2,
    categoryId: "coffee",
    name: "카페라떼",
    price: 5000,
    description: "부드러운 우유와 에스프레소의 조화",
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60",
    hasTemperatureOption: true,
    isPopular: true,
    isNew: false,
  },
  {
    id: 3,
    categoryId: "coffee",
    name: "바닐라라떼",
    price: 5500,
    description: "달콤한 바닐라 시럽이 더해진 라떼",
    image: "https://images.unsplash.com/photo-1626595444746-59219e6838ac?q=80&w=1587&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hasTemperatureOption: true,
    isPopular: false,
    isNew: false,
  },
  {
    id: 4,
    categoryId: "coffee",
    name: "카푸치노",
    price: 5000,
    description: "풍성한 우유 거품이 매력적인 커피",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2FwcHVjY2lub3xlbnwwfHwwfHx8MA%3D%3D",
    hasTemperatureOption: true,
    isPopular: false,
    isNew: false,
  },
  {
    id: 5,
    categoryId: "non-coffee",
    name: "초콜릿라떼",
    price: 5500,
    description: "진한 초콜릿과 우유의 달콤한 만남",
    image: "https://images.unsplash.com/photo-1584680744830-465a1dcd78e1?q=80&w=1587&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hasTemperatureOption: true,
    isPopular: false,
    isNew: false,
  },
  {
    id: 6,
    categoryId: "non-coffee",
    name: "딸기스무디",
    price: 6000,
    description: "상큼한 딸기로 만든 시원한 스무디",
    image: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?q=80&w=2671&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hasTemperatureOption: false,
    isPopular: true,
    isNew: true,
  },
  {
    id: 7,
    categoryId: "tea",
    name: "얼그레이",
    price: 4800,
    description: "은은한 베르가못 향의 홍차",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60",
    hasTemperatureOption: true,
    isPopular: false,
    isNew: false,
  },
  {
    id: 8,
    categoryId: "tea",
    name: "캐모마일",
    price: 4800,
    description: "편안한 휴식을 위한 허브티",
    image: "https://images.unsplash.com/photo-1609016617751-e80552ae6ec2?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hasTemperatureOption: true,
    isPopular: false,
    isNew: false,
  },
  {
    id: 9,
    categoryId: "dessert",
    name: "크로플",
    price: 6500,
    description: "바삭하고 촉촉한 크로플",
    image: "https://images.unsplash.com/photo-1714317589223-7d1a2372af3e?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hasTemperatureOption: false,
    isPopular: true,
    isNew: false,
  },
  {
    id: 10,
    categoryId: "dessert",
    name: "치즈케이크",
    price: 7000,
    description: "진하고 부드러운 뉴욕 치즈케이크",
    image: "https://images.unsplash.com/photo-1635327173758-85badf17f995?q=80&w=2627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hasTemperatureOption: false,
    isPopular: false,
    isNew: true,
  },
];

const ORDERS = [
  {
    id: 1001,
    orderDate: "2026-07-05T14:32:00",
    status: "준비중",
    items: [
      { menuId: 1, name: "아메리카노", price: 4500, temperature: "ICE", quantity: 2 },
      { menuId: 9, name: "크로플", price: 6500, temperature: null, quantity: 1 },
    ],
  },
  {
    id: 1002,
    orderDate: "2026-07-03T09:12:00",
    status: "준비중",
    items: [
      { menuId: 2, name: "카페라떼", price: 5000, temperature: "HOT", quantity: 1 },
    ],
  },
  {
    id: 1003,
    orderDate: "2026-06-28T18:47:00",
    status: "주문취소",
    items: [
      { menuId: 6, name: "딸기스무디", price: 6000, temperature: null, quantity: 1 },
      { menuId: 10, name: "치즈케이크", price: 7000, temperature: null, quantity: 1 },
    ],
  },
];

function getStoredMenusRaw() {
  const raw = localStorage.getItem("cafe-app-menus");
  return raw ? JSON.parse(raw) : MENUS;
}

function getCategoryById(categoryId) {
  return CATEGORIES.find((category) => category.id === categoryId) || null;
}

function getMenuById(menuId) {
  const menus = getStoredMenusRaw();
  return menus.find((menu) => menu.id === Number(menuId)) || null;
}

function getMenusByCategory(categoryId) {
  const menus = getStoredMenusRaw();
  if (!categoryId || categoryId === "all") {
    return menus;
  }
  return menus.filter((menu) => menu.categoryId === categoryId);
}

function getStoredOrdersRaw() {
  const raw = localStorage.getItem("cafe-app-orders");
  return raw ? JSON.parse(raw) : ORDERS;
}

function getOrders() {
  const orders = getStoredOrdersRaw();
  return [...orders].sort(
    (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
  );
}

function getOrderById(orderId) {
  const orders = getStoredOrdersRaw();
  return orders.find((order) => order.id === Number(orderId)) || null;
}

function getOrderTotal(order) {
  return order.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}
