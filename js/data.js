/* ==========================================================================
   메뉴 / 카테고리 / 주문 데이터 (Supabase 연동)
   ========================================================================== */

let _categoriesCache = null;

async function getCategories() {
  if (_categoriesCache) return _categoriesCache;
  const { data, error } = await supabaseClient.from("categories").select("*");
  if (error) {
    console.error(error);
    return [];
  }
  _categoriesCache = data;
  return data;
}

async function getCategoryById(categoryId) {
  const categories = await getCategories();
  return categories.find((category) => category.id === categoryId) || null;
}

function mapMenuRow(row) {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    price: row.price,
    description: row.description,
    image: row.image,
    hasTemperatureOption: row.has_temperature_option,
    isPopular: row.is_popular,
    isNew: row.is_new,
    isSeason: row.is_season,
  };
}

async function getMenuById(menuId) {
  const { data, error } = await supabaseClient
    .from("menus")
    .select("*")
    .eq("id", Number(menuId))
    .maybeSingle();

  if (error || !data) return null;
  return mapMenuRow(data);
}

async function getMenusByCategory(categoryId) {
  let query = supabaseClient.from("menus").select("*").order("id");
  if (categoryId && categoryId !== "all") {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;
  if (error) {
    console.error(error);
    return [];
  }
  return data.map(mapMenuRow);
}

function mapOrderRow(row) {
  const items = (row.order_items || [])
    .slice()
    .sort((a, b) => a.id - b.id)
    .map((item) => ({
      menuId: item.menu_id,
      name: item.name,
      price: item.price,
      temperature: item.temperature,
      quantity: item.quantity,
    }));

  return {
    id: row.id,
    orderDate: row.order_date,
    status: row.status,
    items,
    usedCouponId: row.used_coupon_id || undefined,
    usedCouponName: row.used_coupon_name || undefined,
    discountAmount: row.discount_amount || undefined,
    finalPrice:
      row.final_price !== null && row.final_price !== undefined
        ? row.final_price
        : undefined,
  };
}

// userId를 넘기면 해당 유저의 주문만, 생략하면(관리자용) 전체 주문을 반환합니다.
async function getOrders(userId) {
  let query = supabaseClient
    .from("orders")
    .select("*, order_items(*)")
    .order("order_date", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) {
    console.error(error);
    return [];
  }
  return data.map(mapOrderRow);
}

async function getOrderById(orderId) {
  const { data, error } = await supabaseClient
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", Number(orderId))
    .maybeSingle();

  if (error || !data) return null;
  return mapOrderRow(data);
}

async function updateOrderStatus(orderId, newStatus) {
  const { error } = await supabaseClient
    .from("orders")
    .update({ status: newStatus })
    .eq("id", Number(orderId));

  if (error) console.error(error);
}

function getOrderTotal(order) {
  return order.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}
