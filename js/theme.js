/* ==========================================================================
   Cafe Isle 전역 테마 관리 스크립트 (다크 모드 / 라이트 모드)
   ========================================================================== */

(function () {
  const THEME_KEY = "cafe-app-theme";

  // 1. 테마 적용 함수
  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      document.body.classList.add("dark-mode");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      document.body.classList.remove("dark-mode");
    }

    // 전역 커스텀 이벤트 발생 (각 페이지에서 테마 전환 시 UI 동기화를 위해 사용)
    const event = new CustomEvent("themechange", { detail: { theme } });
    window.dispatchEvent(event);
  }

  // 2. 현재 설정된 테마 또는 시스템 테마 가져오기
  function getPreferredTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }
    // 시스템 테마 감지
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return systemPrefersDark ? "dark" : "light";
  }

  // 3. 테마 강제 설정 함수 (전역 노출)
  window.setGlobalTheme = function (theme) {
    if (theme === "system") {
      localStorage.removeItem(THEME_KEY);
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      applyTheme(systemTheme);
    } else {
      localStorage.setItem(THEME_KEY, theme);
      applyTheme(theme);
    }
  };

  // 4. 저장된 테마 불러오기 및 즉각 적용 (렌더링 차단 방지)
  const initialTheme = getPreferredTheme();
  
  // DOM 로딩 완료 전 <html> 속성 조작
  document.documentElement.setAttribute("data-theme", initialTheme);

  // 4.5 관리자 페이지 및 고객 전용 서비스 접근 제어 (Auth Guard)
  function runAuthGuard() {
    const pathname = window.location.pathname;
    if (pathname.includes("/login/")) return;

    const rawUser = localStorage.getItem("cafe-app-logged-in-user");
    const loggedInUser = rawUser ? JSON.parse(rawUser) : null;
    
    const isAdminPage = pathname.includes("/admin/");
    const isMyPage = pathname.includes("/my/");
    const isOrdersPage = pathname.includes("/orders/");

    function getRelativeLoginPath() {
      if (pathname.includes("/admin/menus/") || pathname.includes("/admin/orders/")) {
        return "../../login/index.html";
      } else if (
        pathname.includes("/admin/") || 
        pathname.includes("/my/") || 
        pathname.includes("/orders/") || 
        pathname.includes("/menus/") || 
        pathname.includes("/basket/") ||
        pathname.endsWith("/admin") ||
        pathname.endsWith("/my") ||
        pathname.endsWith("/orders") ||
        pathname.endsWith("/menus") ||
        pathname.endsWith("/basket")
      ) {
        return "../login/index.html";
      } else {
        return "login/index.html";
      }
    }

    const loginPath = getRelativeLoginPath();

    if (isAdminPage) {
      if (!loggedInUser || loggedInUser.role !== "admin") {
        alert("관리자 권한이 필요합니다. 로그인 페이지로 이동합니다.");
        window.location.href = loginPath + "?redirect=" + encodeURIComponent(window.location.href);
      }
    } else if (isMyPage || isOrdersPage) {
      if (!loggedInUser) {
        alert("로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.");
        window.location.href = loginPath + "?redirect=" + encodeURIComponent(window.location.href);
      }
    }
  }

  // Run Auth Guard immediately (before DOM loads)
  runAuthGuard();
  
  // DOMContentLoaded 시점에 body 클래스 조작 및 버튼 매핑
  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(initialTheme);
    initThemeToggleButton();
    initAuthUI();
  });

  // 5. 시스템 테마 변경 리스너 (사용자 커스텀 설정이 없을 때만 작동)
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (!savedTheme) {
      applyTheme(e.matches ? "dark" : "light");
    }
  });

  // 6. 테마 토글 버튼 제어 및 전역 이벤트 동기화
  function initThemeToggleButton() {
    const toggleInput = document.getElementById("theme-toggle-btn");
    if (!toggleInput) return;

    // 초기 상태 반영 (다크 모드면 체크 처리)
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    toggleInput.checked = (currentTheme === "dark");

    // 체크 상태 변경 이벤트 바인딩
    toggleInput.addEventListener("change", (e) => {
      const nextTheme = e.target.checked ? "dark" : "light";
      window.setGlobalTheme(nextTheme);
    });

    // 테마 변경 이벤트 리스너 등록 (동기화)
    window.addEventListener("themechange", (e) => {
      toggleInput.checked = (e.detail.theme === "dark");
    });
  }

  // 7. 동적 로그인/로그아웃 버튼 UI 구현
  function initAuthUI() {
    const pathname = window.location.pathname;
    
    // Do not inject button on login or admin pages
    if (pathname.includes("/login/") || pathname.includes("/admin/")) {
      return;
    }

    const headerContainer = document.querySelector(".header-actions") || document.querySelector(".header-controls");
    if (!headerContainer) return;

    // Prevent duplicate injections
    if (document.getElementById("header-auth-action-btn")) return;

    const rawUser = localStorage.getItem("cafe-app-logged-in-user");
    const loggedInUser = rawUser ? JSON.parse(rawUser) : null;

    function getRelativeLoginPath() {
      if (
        pathname.includes("/my/") || 
        pathname.includes("/orders/") || 
        pathname.includes("/menus/") || 
        pathname.includes("/basket/") ||
        pathname.endsWith("/my") ||
        pathname.endsWith("/orders") ||
        pathname.endsWith("/menus") ||
        pathname.endsWith("/basket")
      ) {
        return "../login/index.html";
      } else {
        return "login/index.html";
      }
    }

    const loginPath = getRelativeLoginPath();

    if (loggedInUser) {
      // Create Logout Button
      const logoutBtn = document.createElement("button");
      logoutBtn.id = "header-auth-action-btn";
      logoutBtn.className = "auth-text-btn";
      logoutBtn.setAttribute("aria-label", "로그아웃");
      logoutBtn.setAttribute("title", "로그아웃");
      logoutBtn.textContent = "로그아웃";
      logoutBtn.addEventListener("click", () => {
        if (confirm("로그아웃하시겠습니까?")) {
          localStorage.removeItem("cafe-app-logged-in-user");
          alert("성공적으로 로그아웃되었습니다.");
          // Redirect to home page
          let homePath = pathname.includes("/my/") || pathname.includes("/orders/") || pathname.includes("/menus/") || pathname.includes("/basket/") ? "../" : "";
          window.location.href = homePath + "index.html";
        }
      });
      headerContainer.appendChild(logoutBtn);
    } else {
      // Create Login Button
      const loginBtn = document.createElement("a");
      loginBtn.id = "header-auth-action-btn";
      loginBtn.className = "auth-text-btn";
      loginBtn.setAttribute("href", loginPath + "?redirect=" + encodeURIComponent(window.location.href));
      loginBtn.setAttribute("aria-label", "로그인");
      loginBtn.setAttribute("title", "로그인");
      loginBtn.textContent = "로그인";
      headerContainer.appendChild(loginBtn);
    }
  }
})();
