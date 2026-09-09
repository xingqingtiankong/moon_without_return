"use strict";


const app = document.getElementById("app");
const startScreen = document.getElementById("start-screen");
const startTrigger = document.getElementById("start-trigger");
const authScreen = document.getElementById("auth-screen");
const authTerminal = document.getElementById("auth-terminal");
const authHeadingEnglish = document.getElementById("auth-heading-en");
const authHeadingChinese = document.getElementById("auth-heading-zh");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");
const registerUsername = document.getElementById("register-username");
const registerPassword = document.getElementById("register-password");
const loginSubmit = document.getElementById("login-submit");
const registerSubmit = document.getElementById("register-submit");
const showRegisterButton = document.getElementById("show-register");
const showLoginButton = document.getElementById("show-login");
const feedback = document.getElementById("system-feedback");
const feedbackCode = document.getElementById("feedback-code");
const feedbackMessage = document.getElementById("feedback-message");
const feedbackDetail = document.getElementById("feedback-detail");
const authResult = document.getElementById("auth-result");
const systemTime = document.getElementById("system-time");
const linkStatus = document.getElementById("link-status");


const AppState = {
    screen: "start",
    authMode: "login",
    isTransitioning: false,
    isSubmitting: false
};

const UI_COPY = {
    login: {
        headingEnglish: "IDENTITY VERIFICATION",
        headingChinese: "身份认证",
        standbyCode: "ARCHIVE LINK STANDBY",
        standbyMessage: "等待身份密钥",
        standbyDetail: "输入记录仅在本地终端中验证"
    },
    register: {
        headingEnglish: "IDENTITY REGISTRATION",
        headingChinese: "建立身份档案",
        standbyCode: "NEW ARCHIVE RECORD",
        standbyMessage: "等待身份信息",
        standbyDetail: "建立新的本地月面身份档案"
    }
};


const STORAGE_KEYS = {
    users: "moon_without_return_users",
    currentUser: "moon_without_return_current_user"
};

function loadUsers() {
    try {
        const storedUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || "[]");

        if (!Array.isArray(storedUsers)) {
            return [];
        }

        return storedUsers.filter((user) => (
            user
            && typeof user.username === "string"
            && typeof user.password === "string"
        ));
    } catch (error) {
        console.warn("Unable to read the local identity archive.", error);
        return [];
    }
}

function saveUsers(users) {
    try {
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
        return true;
    } catch (error) {
        console.warn("Unable to write the local identity archive.", error);
        return false;
    }
}

function saveCurrentUser(username) {
    try {
        localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify({
            username,
            authenticatedAt: new Date().toISOString()
        }));
        return true;
    } catch (error) {
        console.warn("Unable to save the current identity.", error);
        return false;
    }
}


function enterAuthenticationScreen() {
    if (AppState.screen !== "start" || AppState.isTransitioning) {
        return;
    }

    AppState.screen = "auth";
    AppState.isTransitioning = true;
    app.dataset.screen = "auth";
    app.classList.add("is-transitioning");
    startScreen.setAttribute("aria-hidden", "true");
    authScreen.setAttribute("aria-hidden", "false");
    linkStatus.textContent = "AUTHENTICATING";
    playStartSound();

    window.setTimeout(() => {
        app.classList.remove("is-transitioning");
        app.classList.add("is-auth");
        AppState.isTransitioning = false;
        loginUsername.focus({preventScroll: true});
    }, 920);
}

function handleStartKey(event) {
    if (AppState.screen !== "start") {
        return;
    }

    if (event.repeat) {
        return;
    }

    enterAuthenticationScreen();
}


function setFormInteractive(form, isInteractive) {
    form.classList.toggle("is-active", isInteractive);
    form.setAttribute("aria-hidden", String(!isInteractive));

    form.querySelectorAll("input, button").forEach((control) => {
        control.disabled = !isInteractive;
    });
}

function switchAuthMode(mode, options = {}) {
    if (AppState.screen !== "auth" || AppState.isSubmitting || mode === AppState.authMode) {
        return;
    }

    const nextCopy = UI_COPY[mode];

    AppState.authMode = mode;
    app.dataset.authMode = mode;
    authHeadingEnglish.textContent = nextCopy.headingEnglish;
    authHeadingChinese.textContent = nextCopy.headingChinese;
    clearFormValidation(loginForm);
    clearFormValidation(registerForm);
    setFormInteractive(loginForm, mode === "login");
    setFormInteractive(registerForm, mode === "register");

    if (!options.preserveFeedback) {
        showFeedback("neutral", nextCopy.standbyCode, nextCopy.standbyMessage, nextCopy.standbyDetail);
    }

    window.setTimeout(() => {
        const targetInput = mode === "login" ? loginUsername : registerUsername;
        targetInput.focus({preventScroll: true});
    }, 330);
}


function handleLogin(event) {
    event.preventDefault();

    if (AppState.screen !== "auth" || AppState.authMode !== "login" || AppState.isSubmitting) {
        return;
    }

    clearFormValidation(loginForm);

    const username = normalizeUsername(loginUsername.value);
    const password = loginPassword.value;
    const validationError = validateLogin(username, password);

    if (validationError) {
        rejectSubmission(validationError);
        return;
    }

    const matchingUser = loadUsers().find((user) => (
        normalizeUsername(user.username).toLocaleLowerCase() === username.toLocaleLowerCase()
        && user.password === password
    ));

    if (!matchingUser) {
        rejectSubmission({
            field: loginPassword,
            code: "ACCESS DENIED",
            message: "身份认证失败",
            detail: "用户名或密码错误"
        });
        return;
    }

    completeAuthentication(matchingUser.username);
}


function handleRegister(event) {
    event.preventDefault();

    if (AppState.screen !== "auth" || AppState.authMode !== "register" || AppState.isSubmitting) {
        return;
    }

    clearFormValidation(registerForm);

    const username = normalizeUsername(registerUsername.value);
    const password = registerPassword.value;
    const users = loadUsers();
    const validationError = validateRegistration(username, password, users);

    if (validationError) {
        rejectSubmission(validationError);
        return;
    }

    const wasSaved = saveUsers([...users, {username, password}]);

    if (!wasSaved) {
        rejectSubmission({
            field: registerUsername,
            code: "ARCHIVE WRITE FAILED",
            message: "身份档案写入失败",
            detail: "浏览器未允许访问本地存储"
        });
        return;
    }

    AppState.isSubmitting = true;
    registerSubmit.disabled = true;
    playConfirmSound();
    showFeedback(
        "success",
        "IDENTITY RECORD CREATED",
        "身份档案建立完成",
        "正在返回身份验证……"
    );

    window.setTimeout(() => {
        AppState.isSubmitting = false;
        registerForm.reset();
        loginUsername.value = username;
        loginPassword.value = "";
        switchAuthMode("login", {preserveFeedback: true});
    }, 1150);
}


function normalizeUsername(username) {
    return username.trim();
}

function validateLogin(username, password) {
    if (!username) {
        return {
            field: loginUsername,
            code: "IDENTITY FIELD EMPTY",
            message: "用户名不能为空",
            detail: "请输入身份档案名称"
        };
    }

    if (!password) {
        return {
            field: loginPassword,
            code: "SECURITY KEY EMPTY",
            message: "密码不能为空",
            detail: "请输入身份密钥"
        };
    }

    return null;
}

function validateRegistration(username, password, users) {
    if (!username) {
        return {
            field: registerUsername,
            code: "IDENTITY FIELD EMPTY",
            message: "用户名不能为空",
            detail: "请为新的身份档案命名"
        };
    }

    if (!password) {
        return {
            field: registerPassword,
            code: "SECURITY KEY EMPTY",
            message: "密码不能为空",
            detail: "请设置身份密钥"
        };
    }

    const isDuplicate = users.some((user) => (
        normalizeUsername(user.username).toLocaleLowerCase() === username.toLocaleLowerCase()
    ));

    if (isDuplicate) {
        return {
            field: registerUsername,
            code: "IDENTITY ALREADY EXISTS",
            message: "用户名已存在",
            detail: "请使用其他身份档案名称"
        };
    }

    return null;
}

function clearFormValidation(form) {
    form.querySelectorAll("input").forEach((input) => {
        input.removeAttribute("aria-invalid");
        input.closest(".terminal-field")?.classList.remove("is-invalid");
    });
}

function markFieldInvalid(field) {
    if (!field) {
        return;
    }

    field.setAttribute("aria-invalid", "true");
    field.closest(".terminal-field")?.classList.add("is-invalid");
    field.focus({preventScroll: true});
}


function showFeedback(type, code, message, detail) {
    feedback.dataset.type = type;
    feedbackCode.textContent = code;
    feedbackMessage.textContent = message;
    feedbackDetail.textContent = detail;
}

function rejectSubmission(error) {
    markFieldInvalid(error.field);
    showFeedback("error", error.code, error.message, error.detail);
    playErrorSound();

    authTerminal.classList.remove("has-error");
    void authTerminal.offsetWidth;
    authTerminal.classList.add("has-error");
}

function clearFieldError(event) {
    const input = event.target;
    const field = input.closest(".terminal-field");

    input.removeAttribute("aria-invalid");
    field?.classList.remove("is-invalid");
}


function completeAuthentication(username) {
    AppState.isSubmitting = true;
    AppState.screen = "authenticated";
    app.dataset.screen = "authenticated";
    app.classList.remove("is-auth");
    app.classList.add("is-authenticated");
    authTerminal.classList.add("is-verified", "is-authenticated");
    authResult.setAttribute("aria-hidden", "false");
    loginSubmit.disabled = true;
    linkStatus.textContent = "LINK ESTABLISHED";
    saveCurrentUser(username);
    playConfirmSound();

    window.setTimeout(() => {
        enterGame();
    }, 1300);
}


function updateSystemClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const clockValue = `${hours}:${minutes}:${seconds}`;

    systemTime.textContent = clockValue;
    systemTime.dateTime = clockValue;
}


function playConfirmSound() {
}

function playErrorSound() {
}

function playStartSound() {
}


function enterGame() {
    document.dispatchEvent(new CustomEvent("moonWithoutReturn:enterGame", {
        detail: {username: normalizeUsername(loginUsername.value)}
    }));
    window.location.href = "../main/index.html";
}


function bindEventListeners() {
    startScreen.addEventListener("click", enterAuthenticationScreen);
    startTrigger.addEventListener("click", enterAuthenticationScreen);
    document.addEventListener("keydown", handleStartKey);
    showRegisterButton.addEventListener("click", () => switchAuthMode("register"));
    showLoginButton.addEventListener("click", () => switchAuthMode("login"));
    loginForm.addEventListener("submit", handleLogin);
    registerForm.addEventListener("submit", handleRegister);

    [loginUsername, loginPassword, registerUsername, registerPassword]
        .forEach((input) => input.addEventListener("input", clearFieldError));

    authTerminal.addEventListener("animationend", () => {
        authTerminal.classList.remove("has-error");
    });
}


function initialize() {
    setFormInteractive(loginForm, true);
    setFormInteractive(registerForm, false);
    updateSystemClock();
    window.setInterval(updateSystemClock, 1000);
    bindEventListeners();
}

initialize();
