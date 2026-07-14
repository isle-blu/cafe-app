/* ==========================================================================
   공통 유틸리티 (장바구니, 포맷, 프로필/메뉴/쿠폰 Supabase 연동)
   ========================================================================== */

const CART_STORAGE_KEY = "cafe-app-cart";

/* ---------------- 포맷 ---------------- */

function formatPrice(price) {
  return `${price.toLocaleString("ko-KR")}원`;
}

function formatDate(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

/* ---------------- 장바구니 (주문 전까지는 로컬 상태로만 관리) ---------------- */

function getCart() {
  const raw = localStorage.getItem(CART_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(
    (cartItem) =>
      cartItem.menuId === item.menuId &&
      cartItem.temperature === item.temperature
  );

  if (existing) {
    const newQuantity = existing.quantity + (item.quantity || 1);
    if (newQuantity > 10) {
      existing.quantity = 10;
      alert("장바구니에는 메뉴 당 최대 10잔까지만 담을 수 있습니다.");
    } else {
      existing.quantity = newQuantity;
    }
  } else {
    const quantity = item.quantity || 1;
    if (quantity > 10) {
      alert("한 메뉴당 최대 10잔까지만 주문 가능합니다.");
      cart.push({
        menuId: item.menuId,
        name: item.name,
        price: item.price,
        temperature: item.temperature || null,
        quantity: 10,
      });
    } else {
      cart.push({
        menuId: item.menuId,
        name: item.name,
        price: item.price,
        temperature: item.temperature || null,
        quantity: quantity,
      });
    }
  }

  saveCart(cart);
  return cart;
}

function removeFromCart(menuId, temperature) {
  const cart = getCart().filter(
    (item) => !(item.menuId === menuId && item.temperature === temperature)
  );
  saveCart(cart);
  return cart;
}

function updateCartQuantity(menuId, temperature, quantity) {
  const cart = getCart();
  const target = cart.find(
    (item) => item.menuId === menuId && item.temperature === temperature
  );

  if (target) {
    if (quantity > 10) {
      target.quantity = 10;
      alert("한 메뉴당 최대 10잔까지만 주문 가능합니다.");
    } else {
      target.quantity = Math.max(1, quantity);
    }
    saveCart(cart);
  }

  return cart;
}

function clearCart() {
  saveCart([]);
}

function getCartCount() {
  return getCart().reduce((total, item) => total + item.quantity, 0);
}

function getCartTotal() {
  return getCart().reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}

function updateCartBadge() {
  const badgeEl = document.getElementById("cart-badge");
  if (badgeEl) {
    const count = getCartCount();
    badgeEl.textContent = count;
    badgeEl.setAttribute("data-count", count);
    if (count === 0) {
      badgeEl.style.display = "none";
    } else {
      badgeEl.style.display = "flex";
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", updateCartBadge);
} else {
  updateCartBadge();
}

/* ---------------- 프로필 (Supabase Auth 미사용, 브라우저=유저 프로필 연동) ---------------- */

const PROFILE_ID_KEY = "cafe-app-profile-id";

function mapProfileRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    avatar: row.avatar,
    role: row.role,
  };
}

// 이메일 기준으로 프로필을 찾고, 없으면 새로 생성합니다. (로그인 시 호출)
async function getOrCreateProfile({ name, email, phone, avatar, role }) {
  const { data: existing, error: selectError } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (selectError) console.error(selectError);

  if (existing) {
    const updates = {};
    if (name && name !== existing.name) updates.name = name;
    if (phone && phone !== existing.phone) updates.phone = phone;
    if (avatar && avatar !== existing.avatar) updates.avatar = avatar;

    let finalRow = existing;
    if (Object.keys(updates).length > 0) {
      const { data: updated, error: updateError } = await supabaseClient
        .from("profiles")
        .update(updates)
        .eq("id", existing.id)
        .select()
        .single();
      if (!updateError && updated) finalRow = updated;
    }

    localStorage.setItem(PROFILE_ID_KEY, finalRow.id);
    return mapProfileRow(finalRow);
  }

  const { data: created, error: insertError } = await supabaseClient
    .from("profiles")
    .insert({ name, email, phone, avatar, role: role || "member" })
    .select()
    .single();

  if (insertError || !created) {
    console.error(insertError);
    return null;
  }

  localStorage.setItem(PROFILE_ID_KEY, created.id);
  return mapProfileRow(created);
}

function getStoredProfileId() {
  return localStorage.getItem(PROFILE_ID_KEY);
}

// 로그인 여부와 무관하게, 이 브라우저의 주문/쿠폰을 귀속시킬 프로필을 보장합니다.
async function ensureProfileId() {
  const existingId = getStoredProfileId();
  if (existingId) {
    // 캐시된 id가 가리키는 프로필이 실제로 존재하는지 확인 (DB에서 삭제된 경우 대비)
    const { data } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("id", existingId)
      .maybeSingle();
    if (data) return existingId;
    localStorage.removeItem(PROFILE_ID_KEY);
  }

  const raw = localStorage.getItem("cafe-app-user");
  const user = raw
    ? JSON.parse(raw)
    : {
        name: "홍길동",
        email: "hong@cafeisle.com",
        phone: "010-1234-5678",
        avatar: "☕",
      };

  const profile = await getOrCreateProfile(user);
  return profile ? profile.id : null;
}

async function getLastGradeCouponState(userId) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("last_grade_coupon_month, last_grade_coupon_grade")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return { month: null, grade: null };
  return { month: data.last_grade_coupon_month, grade: data.last_grade_coupon_grade };
}

async function setLastGradeCouponState(userId, yearMonth, grade) {
  const { error } = await supabaseClient
    .from("profiles")
    .update({ last_grade_coupon_month: yearMonth, last_grade_coupon_grade: grade })
    .eq("id", userId);
  if (error) console.error(error);
}

// orders 기록이 항상 원본(source of truth)이며, 이 값은 매번 재계산된 결과를 DB에
// 미러링해두어 조회 편의를 위한 캐시일 뿐입니다.
async function updateStampCounts(userId, currentStamps, totalStamps) {
  const { error } = await supabaseClient
    .from("profiles")
    .update({ current_stamps: currentStamps, total_stamps: totalStamps })
    .eq("id", userId);
  if (error) console.error(error);
}

/* ---------------- 메뉴 데이터 (Supabase 연동) ---------------- */

// 카테고리별 기본 이미지 매핑
const DEFAULT_IMAGES = {
  coffee: "https://images.unsplash.com/photo-1517959105821-eaf2591984ca?q=80&w=2673&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "non-coffee": "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?q=80&w=2671&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  tea: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60",
  dessert: "https://images.unsplash.com/photo-1714317589223-7d1a2372af3e?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
};

function mapMenuFormToRow(menuData) {
  return {
    category_id: menuData.categoryId,
    name: menuData.name,
    price: Number(menuData.price),
    description: menuData.description,
    image: menuData.image || DEFAULT_IMAGES[menuData.categoryId] || "",
    has_temperature_option: !!menuData.hasTemperatureOption,
    is_popular: !!menuData.isPopular,
    is_new: !!menuData.isNew,
    is_season: !!menuData.isSeason,
    is_active: menuData.isActive !== false,
  };
}

async function getStoredMenus() {
  return getMenusByCategory("all");
}

async function getStoredMenuById(id) {
  return getMenuById(id);
}

async function createMenu(menuData) {
  const row = mapMenuFormToRow(menuData);
  const { data, error } = await supabaseClient
    .from("menus")
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    console.error(error);
    return null;
  }
  return mapMenuRow(data);
}

async function updateMenu(id, menuData) {
  const row = mapMenuFormToRow(menuData);
  const { data, error } = await supabaseClient
    .from("menus")
    .update(row)
    .eq("id", Number(id))
    .select()
    .single();

  if (error || !data) {
    console.error(error);
    return null;
  }
  return mapMenuRow(data);
}

async function setMenuActive(id, isActive) {
  const { error } = await supabaseClient
    .from("menus")
    .update({ is_active: isActive })
    .eq("id", Number(id));
  if (error) console.error(error);
}

/* ---------------- 주문 생성 (Supabase 연동) ---------------- */

async function checkoutCart(couponInfo, userId) {
  const cart = getCart();
  if (cart.length === 0) return null;

  const orderRow = {
    user_id: userId || null,
    status: "준비중",
  };

  if (couponInfo) {
    orderRow.used_coupon_id = couponInfo.id;
    orderRow.used_coupon_name = couponInfo.name;
    orderRow.discount_amount = couponInfo.discountAmount;
    orderRow.final_price = couponInfo.finalPrice;
  }

  const { data: order, error } = await supabaseClient
    .from("orders")
    .insert(orderRow)
    .select()
    .single();

  if (error || !order) {
    console.error(error);
    return null;
  }

  const itemRows = cart.map((item) => ({
    order_id: order.id,
    menu_id: item.menuId,
    name: item.name,
    price: item.price,
    temperature: item.temperature,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabaseClient
    .from("order_items")
    .insert(itemRows);

  if (itemsError) {
    console.error(itemsError);
    // 자식 아이템 적재 실패 시 빈 껍데기 주문이 DB에 남지 않도록 부모 주문을 롤백
    await supabaseClient.from("orders").delete().eq("id", order.id);
    return null;
  }

  if (couponInfo && couponInfo.id) {
    await markCouponUsed(couponInfo.id);
  }

  clearCart();
  updateCartBadge();

  return {
    id: order.id,
    orderDate: order.order_date,
    status: order.status,
    items: cart,
    usedCouponId: order.used_coupon_id || undefined,
    usedCouponName: order.used_coupon_name || undefined,
    discountAmount: order.discount_amount || undefined,
    finalPrice:
      order.final_price !== null && order.final_price !== undefined
        ? order.final_price
        : undefined,
  };
}

/* ---------------- 쿠폰 데이터 (Supabase 연동) ---------------- */

function mapCouponRow(row) {
  return {
    id: row.id,
    name: row.name,
    valueText: row.value_text,
    isPercent: row.is_percent,
    discountRate:
      row.discount_rate !== null && row.discount_rate !== undefined
        ? Number(row.discount_rate)
        : undefined,
    expiryDate: row.expiry_date,
    type: row.type,
  };
}

// 사용 가능한(미사용) 쿠폰 목록을 반환하고, 최초 진입 시 웰컴 쿠폰을 자동 발급합니다.
async function getStoredCoupons(userId) {
  if (!userId) return [];

  const { data, error } = await supabaseClient
    .from("coupons")
    .select("*")
    .eq("user_id", userId)
    .is("used_at", null);

  if (error) {
    console.error(error);
    return [];
  }

  if (data.length === 0 && (await countIssuedCouponsByType(userId, "welcome")) === 0) {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);

    const { data: created, error: insertError } = await supabaseClient
      .from("coupons")
      .insert({
        user_id: userId,
        name: "신규 가입 감사 10% 할인 쿠폰",
        value_text: "10% 할인",
        is_percent: true,
        discount_rate: 0.1,
        expiry_date: expiry.toISOString(),
        type: "welcome",
      })
      .select();

    if (insertError) {
      console.error(insertError);
      return [];
    }
    return (created || []).map(mapCouponRow);
  }

  return data.map(mapCouponRow);
}

async function issueCoupons(userId, coupons) {
  if (!userId || coupons.length === 0) return;

  const rows = coupons.map((coupon) => ({
    user_id: userId,
    name: coupon.name,
    value_text: coupon.valueText,
    is_percent: coupon.isPercent,
    discount_rate: coupon.discountRate,
    expiry_date: coupon.expiryDate,
    type: coupon.type,
  }));

  const { error } = await supabaseClient.from("coupons").insert(rows);
  if (error) console.error(error);
}

async function markCouponUsed(couponId) {
  const { error } = await supabaseClient
    .from("coupons")
    .update({ used_at: new Date().toISOString() })
    .eq("id", couponId);
  if (error) console.error(error);
}

// 유효기간과 무관하게, 이 유저에게 발급된 적 있는 특정 타입 쿠폰의 총 개수 (중복 발급 방지용)
async function countIssuedCouponsByType(userId, type) {
  const { count, error } = await supabaseClient
    .from("coupons")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", type);

  if (error) {
    console.error(error);
    return 0;
  }
  return count || 0;
}

function sortCoupons(couponsList) {
  const now = new Date();
  return [...couponsList].sort((a, b) => {
    const aExpired = new Date(a.expiryDate) < now;
    const bExpired = new Date(b.expiryDate) < now;

    if (aExpired !== bExpired) {
      return aExpired ? 1 : -1; // 유효한 쿠폰 우선
    }

    // 둘 다 유효하거나 둘 다 만료되었을 때, 만료일 오름차순 (임박일 우선)
    return new Date(a.expiryDate) - new Date(b.expiryDate);
  });
}
