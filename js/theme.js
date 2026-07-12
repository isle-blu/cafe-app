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
  
  // DOMContentLoaded 시점에 body 클래스 조작 및 버튼 매핑
  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(initialTheme);
    initThemeToggleButton();
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
})();
