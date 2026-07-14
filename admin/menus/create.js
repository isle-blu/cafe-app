// DOM 요소
const menuForm = document.getElementById("menuForm");
const categorySelect = document.getElementById("categoryId");

const nameInput = document.getElementById("name");
const priceInput = document.getElementById("price");
const imageInput = document.getElementById("image");

// 에러 텍스트 요소
const nameError = document.getElementById("nameError");
const categoryError = document.getElementById("categoryError");
const priceError = document.getElementById("priceError");

// 초기화
document.addEventListener("DOMContentLoaded", async () => {
  await initCategorySelect();
  setupEventListeners();
});

// 카테고리 선택 옵션 로드
async function initCategorySelect() {
  const categories = await getCategories();
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
}

// 이벤트 리스너 설정
function setupEventListeners() {
  menuForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 에러 리셋
    resetErrors();

    // 유효성 검사
    const isValid = validateForm();
    if (!isValid) return;

    // 폼 데이터 수집
    const formData = {
      name: nameInput.value.trim(),
      categoryId: categorySelect.value,
      price: Number(priceInput.value),
      image: imageInput.value.trim(),
      description: document.getElementById("description").value.trim(),
      hasTemperatureOption: document.getElementById("hasTemperatureOption").checked,
      isPopular: document.getElementById("isPopular").checked,
      isNew: document.getElementById("isNew").checked,
      isSeason: document.getElementById("isSeason").checked,
      isActive: document.getElementById("isActive").checked
    };

    // Supabase에 새 메뉴 저장
    await createMenu(formData);

    // 성공 메시지 후 리다이렉트
    alert("새 메뉴가 정상적으로 등록되었습니다! ✨");
    window.location.href = "list.html";
  });
}

// 유효성 검사 함수
function validateForm() {
  let isValid = true;

  // 메뉴명 검사
  if (!nameInput.value.trim()) {
    nameError.textContent = "메뉴 이름을 입력해 주세요.";
    nameInput.focus();
    isValid = false;
  }

  // 카테고리 선택 검사
  if (!categorySelect.value) {
    categoryError.textContent = "카테고리를 선택해 주세요.";
    if (isValid) categorySelect.focus();
    isValid = false;
  }

  // 가격 검사
  const priceVal = Number(priceInput.value);
  if (priceInput.value === "" || isNaN(priceVal) || priceVal < 0) {
    priceError.textContent = "가격을 0원 이상의 올바른 숫자로 입력해 주세요.";
    if (isValid) priceInput.focus();
    isValid = false;
  }

  return isValid;
}

// 에러 메시지 초기화
function resetErrors() {
  nameError.textContent = "";
  categoryError.textContent = "";
  priceError.textContent = "";
}
