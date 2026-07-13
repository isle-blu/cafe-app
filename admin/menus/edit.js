// 상태 관리
let menuId = null;
let currentMenu = null;

// DOM 요소
const menuForm = document.getElementById("menuForm");
const categorySelect = document.getElementById("categoryId");
const formWrapper = document.getElementById("formWrapper");
const cancelBtn = document.getElementById("cancelBtn");
const backBtn = document.getElementById("backBtn");

const nameInput = document.getElementById("name");
const priceInput = document.getElementById("price");
const imageInput = document.getElementById("image");
const descInput = document.getElementById("description");
const hasTempInput = document.getElementById("hasTemperatureOption");
const isPopularInput = document.getElementById("isPopular");
const isNewInput = document.getElementById("isNew");
const isSeasonInput = document.getElementById("isSeason");

// 에러 텍스트 요소
const nameError = document.getElementById("nameError");
const categoryError = document.getElementById("categoryError");
const priceError = document.getElementById("priceError");

// 초기화
document.addEventListener("DOMContentLoaded", () => {
  // URL에서 id 파라미터 파싱
  const urlParams = new URLSearchParams(window.location.search);
  menuId = urlParams.get("id");

  if (!menuId) {
    renderError("잘못된 접근입니다.", "메뉴 ID가 제공되지 않았습니다.");
    return;
  }

  // 기존 데이터 로드
  currentMenu = getStoredMenuById(menuId);

  if (!currentMenu) {
    renderError("메뉴를 찾을 수 없습니다.", `ID: ${menuId}에 해당하는 메뉴 정보가 존재하지 않습니다.`);
    return;
  }

  initCategorySelect();
  fillFormValues();
  setupEventListeners();
});

// 에러 렌더링
function renderError(title, message) {
  formWrapper.innerHTML = `
    <div style="text-align: center; padding: var(--spacing-2xl); color: var(--color-text-light);">
      <h3 style="color: var(--color-danger); font-size: var(--font-size-lg); margin-bottom: var(--spacing-md);"><i class="fa-solid fa-triangle-exclamation" style="color: var(--color-danger); margin-right: 6px;"></i> ${title}</h3>
      <p>${message}</p>
      <a href="list.html" class="btn btn-primary btn-sm" style="margin-top: 20px;">목록으로 돌아가기</a>
    </div>
  `;
}

// 카테고리 선택 옵션 로드
function initCategorySelect() {
  // CATEGORIES는 js/data.js에 정의된 전역 배열
  CATEGORIES.forEach(category => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
}

// 폼에 기존 메뉴 데이터 채우기
function fillFormValues() {
  nameInput.value = currentMenu.name;
  categorySelect.value = currentMenu.categoryId;
  priceInput.value = currentMenu.price;
  imageInput.value = currentMenu.image;
  descInput.value = currentMenu.description || "";
  hasTempInput.checked = currentMenu.hasTemperatureOption;
  isPopularInput.checked = currentMenu.isPopular;
  isNewInput.checked = currentMenu.isNew;
  isSeasonInput.checked = currentMenu.isSeason || false;
  
  // 취소 경로 셋팅
  const backUrl = `detail.html?id=${currentMenu.id}`;
  cancelBtn.setAttribute("onclick", `window.location.href='${backUrl}'`);
  backBtn.setAttribute("href", backUrl);
}

// 이벤트 리스너 설정
function setupEventListeners() {
  menuForm.addEventListener("submit", (e) => {
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
      description: descInput.value.trim(),
      hasTemperatureOption: hasTempInput.checked,
      isPopular: isPopularInput.checked,
      isNew: isNewInput.checked,
      isSeason: isSeasonInput.checked
    };

    // 로컬 스토리지 데이터 업데이트
    updateMenu(menuId, formData);

    // 성공 안내 후 상세 정보 페이지로 이동
    alert("메뉴 정보가 성공적으로 수정되었습니다! ✏️");
    window.location.href = `detail.html?id=${menuId}`;
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
