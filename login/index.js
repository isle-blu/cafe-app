/* ==========================================================================
   Cafe Isle 로그인 페이지 로직 (단일 통합 로그인)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // 로컬스토리지 키
  const LOGGED_IN_USER_KEY = "cafe-app-logged-in-user";
  const USER_PROFILE_KEY = "cafe-app-user";

  // DOM 엘리먼트 참조
  const unifiedForm = document.getElementById("unified-login-form");
  const loginIdInput = document.getElementById("login-id");
  const loginCredentialInput = document.getElementById("login-credential");

  // 1. 리다이렉트 처리 함수
  function handleLoginRedirect(role) {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get("redirect");

    if (role === "admin") {
      // 관리자 로그인 시, 리다이렉트 주소가 관리자 영역(/admin/)인 경우에만 해당 페이지로 이동하고,
      // 그 외(고객 마이페이지 등)의 경우 항상 대시보드로 즉시 이동시킵니다.
      if (redirectUrl && decodeURIComponent(redirectUrl).includes("/admin/")) {
        window.location.href = decodeURIComponent(redirectUrl);
      } else {
        window.location.href = "../admin/index.html";
      }
    } else {
      if (redirectUrl) {
        window.location.href = decodeURIComponent(redirectUrl);
      } else {
        window.location.href = "../index.html";
      }
    }
  }

  // 2. 통합 로그인 처리
  unifiedForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = loginIdInput.value.trim();
    const credential = loginCredentialInput.value.trim();

    if (!id || !credential) {
      alert("아이디와 비밀번호를 입력해 주세요.");
      return;
    }

    // A. 관리자 계정 처리 (아이디가 admin인 경우)
    if (id === "admin") {
      if (credential === "admin") {
        const adminUser = {
          name: "admin",
          email: "owner@cafeisle.com",
          role: "admin",
          avatar: "👑"
        };
        localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(adminUser));
        await getOrCreateProfile(adminUser);
        // 모달/얼럿 대기 없이 즉시 리다이렉트
        handleLoginRedirect("admin");
      } else {
        alert("관리자 비밀번호가 올바르지 않습니다.");
        loginCredentialInput.value = "";
        loginCredentialInput.focus();
      }
      return;
    }

    // B. 테스트 계정 처리 (아이디가 test인 경우)
    if (id === "test") {
      if (credential === "test") {
        const testUser = {
          name: "홍길동",
          email: "hong@cafeisle.com",
          phone: "010-1234-5678",
          role: "member",
          avatar: "☕"
        };
        localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(testUser));
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify({
          name: testUser.name,
          email: testUser.email,
          phone: testUser.phone,
          avatar: testUser.avatar
        }));
        await getOrCreateProfile(testUser);
        // 테스트 계정도 확인창 없이 즉각 로그인/이동
        handleLoginRedirect("member");
      } else {
        alert("테스트 계정 비밀번호가 올바르지 않습니다.");
        loginCredentialInput.value = "";
        loginCredentialInput.focus();
      }
      return;
    }

    // C. 일반 고객 계정 처리
    // 이메일 형식 검증 및 스마트 폴백 처리
    let email = credential;
    if (!credential.includes("@")) {
      email = `${id}@example.com`; // 이메일 형식이 아닐 경우 기본값 자동 생성
    }

    const loggedInUser = {
      name: id,
      email: email,
      role: "member",
      avatar: "☕"
    };
    localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(loggedInUser));

    // 마이페이지 유저 프로필 정보 동기화 (새로운 이름일 경우 덮어씌움)
    const existingProfile = localStorage.getItem(USER_PROFILE_KEY);
    if (!existingProfile || JSON.parse(existingProfile).name !== id) {
      const newProfile = {
        name: id,
        email: email,
        phone: "010-0000-0000",
        avatar: "☕"
      };
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile));
    }

    await getOrCreateProfile(loggedInUser);

    alert(`${id}님, 성공적으로 로그인되었습니다.`);
    handleLoginRedirect("member");
  });
});
