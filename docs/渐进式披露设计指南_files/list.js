// 系统已经导入了jquery，layui等库
// 本文件没有定义的函数都在base.js里定义了
var config = {};
var layer = layui.layer;
var isEnabledVoice = false;
var isEnabledChatBuySub = false;
var isBuyCrossChat = false;
var isBuyChatExport = false;
var homeUrl = "/";
var isConfigLoaded = false;
var isLoaded = false;

// ==================== 请求拦截器 ====================
function interceptRequests() {
  const blockRoutes = [
    "/v1/rgstr",
    "/backend-api/ces/v1/m",
    "/backend-api/sentinel/ping",
    "/backend-api/ces/statsc/flush",
    "/ces/statsc/flush",
    "/ces/v1/projects/oai/settings",
  ];
  const blockHosts = [
    "browser-intake-datadoghq.com",
    "www.google-analytics.com",
  ];

  function parseRequestUrl(url) {
    try {
      const parsed = new URL(url, location.origin);
      return {
        pathname: parsed.pathname,
        hostname: parsed.hostname,
      };
    } catch {
      return {
        pathname: url,
        hostname: "",
      };
    }
  }

  function shouldBlockRequest(url) {
    const { pathname, hostname } = parseRequestUrl(url);
    return (
      blockRoutes.some((route) => pathname === route) ||
      blockHosts.includes(hostname)
    );
  }

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url;
    return originalOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    if (shouldBlockRequest(this._url)) {
      return;
    }
    return originalSend.apply(this, args);
  };

  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    if (shouldBlockRequest(url)) {
      return Promise.resolve(new Response("{}", { status: 200 }));
    }
    return originalFetch.apply(this, arguments);
  };

  const originalSendBeacon = navigator.sendBeacon;
  navigator.sendBeacon = function (url, data) {
    if (shouldBlockRequest(url)) {
      return true;
    }
    return originalSendBeacon.apply(this, arguments);
  };
}

// ==================== 禁用 Service Worker ====================
function disableServiceWorker() {
  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
      delete Navigator.prototype.serviceWorker;
    }
  } catch (error) {
    console.error("Failed to disable service worker:", error);
  }
}

var FAQ =
  '\u003cp style="text-align: center;"\u003e\u003cspan style="color: rgb(225, 60, 57); background-color: rgb(252, 251, 207);"\u003e\u003cstrong\u003e管理员暂未配置常见问题\u003c/strong\u003e\u003c/span\u003e\u003c/p\u003e';

const MAIN_MENU_CONTAINER_ID = "main-menu-container";
const MAIN_MENU_BUTTON_ID = "main-menu-toggle";
const MAIN_MENU_PANEL_ID = "main-menu-panel";
const MAIN_MENU_POSITION_KEY = "main-menu-position";
let mainMenuStylesInjected = false;
let mainMenuSignature = null;

const injectMainMenuStyles = () => {
  if (mainMenuStylesInjected) {
    return;
  }

  const style = document.createElement("style");
  style.id = "main-menu-styles";
  style.innerHTML = `
    #${MAIN_MENU_CONTAINER_ID} {
      position: fixed;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      background: #393939;
      padding: 12px 10px;
      border-radius: 25px 0 0 25px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 1000;
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
      user-select: none;
      transition: box-shadow 0.3s ease;
    }

    #${MAIN_MENU_CONTAINER_ID}:hover {
      box-shadow: -4px 0 15px rgba(0, 0, 0, 0.3);
    }

    #${MAIN_MENU_CONTAINER_ID}.menu-dragging {
      cursor: grabbing;
    }

    .main-menu-drag {
      width: 100%;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888;
      font-size: 12px;
      cursor: grab;
      user-select: none;
      margin-bottom: 5px;
      border-bottom: 1px solid #555;
      letter-spacing: -2px;
    }

    .main-menu-drag:active {
      cursor: grabbing;
    }


    .main-menu-button {
      width: 32px;
      height: 32px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: transform 0.2s ease;
    }

    .main-menu-button:hover {
      transform: scale(1.1);
    }

    .main-menu-button svg {
      width: 22px;
      height: 22px;
      stroke: #c9c6be;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
    }

    .main-menu-button:hover svg {
      stroke: #fff;
    }

    .main-menu-button:hover::after {
      content: attr(data-tooltip);
      position: absolute;
      right: 40px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 13px;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      z-index: 1001;
    }




    @media (max-width: 768px) {
      #${MAIN_MENU_CONTAINER_ID} {
        bottom: 20px;
        top: auto;
        transform: none;
        padding: 8px 10px;
        border-radius: 16px 0 0 16px;
      }

      .main-menu-button {
        width: 24px;
        height: 24px;
        touch-action: manipulation;
      }

      .main-menu-button svg {
        width: 18px;
        height: 18px;
      }

    }
  `;

  document.head.appendChild(style);
  mainMenuStylesInjected = true;
};

const makeMainMenuDraggable = (element) => {
  if (!element || element.dataset.draggableBound === "true") {
    return;
  }

  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  const startEvent = isMobileDevice ? "touchstart" : "mousedown";
  const moveEvent = isMobileDevice ? "touchmove" : "mousemove";
  const endEvent = isMobileDevice ? "touchend" : "mouseup";

  let isDragging = false;
  let startY = 0;
  let startTop = 0;
  let hasMoved = false;
  let touchStartTime = 0;

  const getPoint = (event) => {
    if (isMobileDevice) {
      const touch =
        (event.touches && event.touches[0]) ||
        (event.changedTouches && event.changedTouches[0]);
      if (touch) {
        return { x: touch.clientX, y: touch.clientY };
      }
      return { x: 0, y: 0 };
    }

    return { x: event.clientX, y: event.clientY };
  };

  const adjustPosition = () => {
    const rect = element.getBoundingClientRect();
    const maxTop = Math.max(0, window.innerHeight - element.offsetHeight);
    let newTop = rect.top;

    newTop = Math.max(0, Math.min(newTop, maxTop));

    if (newTop !== rect.top) {
      element.style.transform = "none";
      element.style.top = `${newTop}px`;
      element.style.bottom = "auto";
    }
  };

  const handleStart = (event) => {
    const target = event.target;

    if ($(target).closest(".main-menu-button").length > 0) {
      return;
    }

    const dragHandle = element.querySelector(".main-menu-drag");
    const isHandle =
      dragHandle && (target === dragHandle || dragHandle.contains(target));
    const isContainer = target === element;

    // 移动端：只有点击拖动手柄或容器空白区域才能拖动
    if (isMobileDevice) {
      if (!isHandle && !isContainer) {
        return;
      }
    }

    // 添加触觉反馈（如果支持）
    if (navigator.vibrate && isMobileDevice) {
      navigator.vibrate(10);
    }

    isDragging = true;
    hasMoved = false;
    touchStartTime = Date.now();

    const point = getPoint(event);
    startY = point.y;
    startTop = element.getBoundingClientRect().top;

    element.classList.add("menu-dragging");
    element.style.userSelect = "none";
    element.style.transform = "none";
    element.style.transition = "none";

    event.preventDefault();
  };

  const handleMove = (event) => {
    if (!isDragging) {
      return;
    }

    const point = getPoint(event);
    if (!point.y && point.y !== 0) {
      return;
    }

    const deltaY = point.y - startY;
    const threshold = isMobileDevice ? 3 : 5;

    if (!hasMoved && Math.abs(deltaY) < threshold) {
      return;
    }

    hasMoved = true;

    event.preventDefault();
    event.stopPropagation();

    let newTop = startTop + deltaY;
    const maxTop = Math.max(0, window.innerHeight - element.offsetHeight);
    newTop = Math.max(0, Math.min(newTop, maxTop));

    element.style.position = "fixed";
    element.style.bottom = "auto";
    element.style.left = "auto";
    element.style.top = `${newTop}px`;
    element.style.transform = "none";
  };

  const handleEnd = () => {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    element.classList.remove("menu-dragging");
    element.style.userSelect = "";
    element.style.transition = "";

    if (hasMoved) {
      // 添加触觉反馈（如果支持）
      if (navigator.vibrate && isMobileDevice) {
        navigator.vibrate(15);
      }

      const rect = element.getBoundingClientRect();
      localStorage.setItem(
        MAIN_MENU_POSITION_KEY,
        JSON.stringify({ top: Math.max(0, rect.top) }),
      );
    } else {
      // 如果没有移动但是长按，可能是正在尝试拖拽
      const touchDuration = Date.now() - touchStartTime;
      if (touchDuration > 200 && isMobileDevice) {
        // 给出提示反馈
        if (navigator.vibrate) {
          navigator.vibrate(20);
        }
      }
    }

    hasMoved = false;
  };

  element.addEventListener(startEvent, handleStart, { passive: false });
  document.addEventListener(moveEvent, handleMove, { passive: false });
  document.addEventListener(endEvent, handleEnd, { passive: false });

  window.addEventListener("resize", adjustPosition);

  const savedPosition = localStorage.getItem(MAIN_MENU_POSITION_KEY);
  if (savedPosition) {
    try {
      const pos = JSON.parse(savedPosition);
      if (typeof pos.top === "number") {
        element.style.transform = "none";
        element.style.top = `${Math.max(0, pos.top)}px`;
        element.style.bottom = "auto";
      }
    } catch (error) {
      // ignore parsing errors
    }
  }

  setTimeout(adjustPosition, 120);

  element.dataset.draggableBound = "true";
};

const hideMainMenuPanel = () => {
  // 不再需要隐藏面板，因为按钮直接显示
};

const ensureMainMenuElements = () => {
  injectMainMenuStyles();

  let $container = $(`#${MAIN_MENU_CONTAINER_ID}`);
  if ($container.length === 0) {
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    const dragTitle = isMobileDevice ? "长按拖动调整位置" : "拖动调整位置";

    const containerHtml = `
      <div id="${MAIN_MENU_CONTAINER_ID}" aria-live="polite">
        <div class="main-menu-drag" title="${dragTitle}">⋮⋮</div>
      </div>
    `;
    $container = $(containerHtml);
    $("body").append($container);
  }

  if (!$container.data("draggable-init")) {
    makeMainMenuDraggable($container[0]);
    $container.data("draggable-init", true);
  }

  return { $container };
};

const closeChatDialog = () => {
  hideMainMenuPanel();

  if (!isMobile()) {
    $("[data-headlessui-state] nav").parent().addClass("layui-hide");
    $("#headlessui-portal-root").addClass("layui-hide");
  }
};

const showFAQDialog = () => {
  closeChatDialog();
  showIframeDialog("常见问题", FAQ, 600, 1000, FAQ.startsWith("http") ? 2 : 1);
};

const showGoodsDialog = () => {
  if (homeUrl.indexOf("pastel") > -1) {
    closeChatDialog();
    showIframeDialog("站内购买", homeUrl + "#/subscribe", 710, 1125, 2);
  } else {
    layer.msg("当前站点不支持站内购买");
  }
};

const getMenuItemHtml = (text, iconName, onClick, tips) => {
  const tipsAttr = tips
    ? `onmouseenter="layer.tips('${tips}', this, {tips: 1})" onmouseleave="layer.closeAll('tips')"`
    : "";

  return `<a class="main-menu-item" onclick="hideMainMenuPanel();${onClick};" ${tipsAttr}>
              <i class="layui-icon ${iconName} layui-font-20"></i>
              <span>${text}</span>
          </a>`;
};

// 添加显示tips的函数
function showTips(elem) {
  layer.tips(elem.getAttribute("lay-tips"), elem, {
    tips: [1, "#3595CC"], // 1代表上边显示，可以改成1,2,3,4分别代表上右下左
    time: 0, // tips将一直显示，直到鼠标移开
  });
}

const initRegAndLoginButton = () => {
  //移除模型超限制的提示
  const rateElement = document.querySelector(
    "div.flex.w-full.items-start.gap-4.rounded-2xl.border.border-token-border-light",
  );
  if (rateElement) {
    rateElement.style.display = "none";
    rateElement.remove();
  }
  // 屏蔽images按钮
  const imagesElements = document.querySelectorAll('a[href="/images"]');
  imagesElements.forEach((el) => {
    el.style.display = "none";
  });
  const libraryElement = document.querySelector('a[href="/library"]');
  if (libraryElement) {
    libraryElement.style.display = "none";
  }
  const appElement = document.querySelector('a[href="/apps"]');
  if (appElement) {
    appElement.style.display = "none";
  }

  //超出research限制的提示
  const researchEle = document.querySelector(
    "div.absolute.start-0.end-0.bottom-full.z-20",
  );
  if (researchEle) {
    researchEle.style.display = "none";
    researchEle.remove();
  }

  // 移除套餐按钮（如需保留请删除以下注释代码）
  // const planElement = document.querySelector(
  //   "div.flex.w-full.flex-row.flex-wrap-reverse.justify-between"
  // );
  // if (planElement) {
  //   planElement.style.display = "none";
  //   planElement.remove();
  // }

  const { $container } = ensureMainMenuElements();

  const signature = [
    isEnabledChatBuySub ? "1" : "0",
    isBuyCrossChat ? "1" : "0",
    isConfigLoaded ? "1" : "0",
  ].join("|");

  if (mainMenuSignature === signature && $container.data("rendered")) {
    return;
  }

  // 清除现有按钮（除了拖动手柄）
  $container.find(".main-menu-button").remove();

  // 按钮配置
  const buttons = [
    {
      icon: `<svg viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>`,
      tooltip: "回到首页｜Back Home",
      onClick: "goHome()",
    },
    {
      icon: `<svg viewBox="0 0 24 24">
        <path d="M20.5 12c0 4.7-3.8 8.5-8.5 8.5-4.7 0-8.5-3.8-8.5-8.5 0-4.7 3.8-8.5 8.5-8.5 2.3 0 4.4 0.9 6 2.5l2-2" fill="none" stroke-width="2" stroke-linecap="round"/>
        <path d="M21 6.5v-5h-5" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      tooltip: "一键换车｜Change Server",
      onClick: "getIdleCar(homeUrl)",
    },
  ];

  // 导出按钮
  if (isBuyChatExport) {
    buttons.push({
      icon: `<svg viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>`,
      tooltip: "导出对话｜Export Chat",
      onClick: "saveConvToFile()",
    });
  }

  // 常见问题按钮
  buttons.push({
    icon: `<svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <path d="M12 17h.01"/>
    </svg>`,
    tooltip: "常见问题｜FAQ",
    onClick: "showFAQDialog()",
  });

  // 站内购买按钮
  if (isEnabledChatBuySub) {
    buttons.push({
      icon: `<svg viewBox="0 0 24 24">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>`,
      tooltip: "站内购买｜Purchase",
      onClick: "showGoodsDialog()",
    });
  }

  // 换车继续聊按钮
  if (isBuyCrossChat) {
    buttons.push({
      icon: `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M20.5 12c0 4.7-3.8 8.5-8.5 8.5-4.7 0-8.5-3.8-8.5-8.5 0-4.7 3.8-8.5 8.5-8.5 2.3 0 4.4 0.9 6 2.5l2-2" fill="none" stroke-width="2" stroke-linecap="round"/>
        <path d="M21 6.5v-5h-5" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="4" fill="none" stroke-width="2"/>
      </svg>`,
      tooltip:
        "换车继续聊.点击后直接对话，无需点击原对话｜Switch to Continue Chat",
      onClick: "setCrossChat()",
    });
  }

  // 创建按钮元素并添加到容器
  buttons.forEach((button) => {
    const btn = $(
      `<button type="button" class="main-menu-button" data-tooltip="${button.tooltip}" onclick="${button.onClick}">${button.icon}</button>`,
    );
    $container.append(btn);
  });

  $container.data("rendered", true);
  mainMenuSignature = signature;
  if (isConfigLoaded) {
    isLoaded = true;
  }
};

const getUserSettingHtml = (icon, title, desc) => {
  return `<div>
                <i class="layui-icon ${icon} layui-font-28"></i>
            </div>
            <div style="flex: 1;display: flex;flex-direction: column;align-items: flex-start;">
                <div>${title}</div>        
                <div>${desc}</div>
            </div>`;
};

const goHome = () => {
  window.location.href = homeUrl;
};

const logout = () => {
  window.location.href = "/frontend-api/logout";
  $.get("/frontend-api/logout");
  goHome();
};

//移动端左上角菜单点击
$(document).on(
  "click",
  ".draggable.sticky button.inline-flex",
  function (event) {
    event.stopPropagation();
    initRegAndLoginButton();
  },
);

// 移除全局点击事件，因为不再需要隐藏面板

// 移除Escape键事件，因为不再需要隐藏面板
//增加resize事件
// $(window).on("resize", function () {
//     console.log("resize");
//     initRegAndLoginButton();
// });

//iframe弹窗
$(document).on("click", "[data-link]", function (event) {
  event.stopPropagation();
  const url = $(this).data("link");
  goToPage(url);
});

// 清理localStorage中的缓存数据
function clearLocalStorageCache() {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith("cache") || key.startsWith("LSS")) {
      localStorage.removeItem(key);
    }
  });
}

$(function () {
  interceptRequests(); // 初始化请求拦截器
  // 页面进入时清理localStorage缓存
  clearLocalStorageCache();
  // 禁用 Service Worker
  disableServiceWorker();

  getConfig();
  const pathname = window.location.pathname;
  if (
    !(
      pathname == "" ||
      pathname == "/" ||
      pathname.startsWith("/c/") ||
      pathname == "/gpts" ||
      pathname.startsWith("/g/")
    )
  ) {
    return;
  }
  setInterval(() => {
    //   console.log("initRegAndLoginButton");
    initRegAndLoginButton();
  }, 100);
  setTimeout(() => {
    document.head.appendChild(document.createElement("style")).innerHTML =
      "div.h-full[class|=react-scroll-to-bottom--css]>div[class|=react-scroll-to-bottom--css]{overflow-y:auto;height:100%;}";
  }, 3000);
});

function getConfig() {
  const url = `/frontend-api/getConfig`;
  fetch(url)
    .then((response) => response.json())
    .then(({ code, data }) => {
      if (code === 1) {
        isEnabledVoice = data.isEnabledVoice;
        homeUrl = data.theme;
        isEnabledChatBuySub =
          data.isEnabledChatBuySub && homeUrl.indexOf("pastel") > -1;
        isBuyCrossChat = data.isBuyCrossChat;
        isBuyChatExport = data.isBuyChatExport;
        FAQ = data.FAQ;
        // document.cookie = `_account=${data.teamId}; path=/`;
        renderSaveConv();
      } else {
        layer.msg(data);
      }
      isConfigLoaded = true;
      initRegAndLoginButton();
    })
    .catch((error) => {
      console.error("Failed to load config:", error);
      isConfigLoaded = true;
      initRegAndLoginButton();
    });
}

function setVoice() {
  const loadIndex = setLoading("正在进入语音房间...");
  $.ajax({
    url: "/frontend-api/getVoice",
    method: "GET",
    timeout: 0,
  }).done(function (response) {
    console.log(response);
    layer.close(loadIndex);
    if (response.code === 1) {
      window.location.href = `/voice?e=${response.data.e2ee_key}&token=${response.data.token}&s=${response.data.voiceServerUrl}`;
    } else {
      layer.msg(response.msg);
    }
  });
}

const goToPage = (url) => {
  const win = window == window.top ? window : window.top;
  win.location.href = url;
};

function getIdleCar(homeUrl) {
  const loadIndex = setLoading("正在获取最空闲的车...");
  const url = `/frontend-api/getIdleCar`;
  fetch(url)
    .then((response) => response.json())
    .then(({ code, msg }) => {
      console.log(code, msg);
      if (code === 1) {
        window.location.href = "/";
      } else if (code === -1) {
        window.location.href = homeUrl;
      } else {
        alert(msg);
      }
      layer.close(loadIndex);
    })
    .catch(() => {
      layer.close(loadIndex);
      // 处理错误
    });
}

function setCrossChat() {
  convId = window.location.pathname.split("/c/")[1];
  if (!convId) {
    layer.msg("当前未进行任何会话");
    return;
  }
  layer.msg(
    "请不要再次点击原来的对话，系统已经包含了上下文，直接对话即可继续。",
  );
  const url = `/frontend-api/setCrossChat?convId=${convId}`;
  fetch(url)
    .then((response) => response.json())
    .then(({ code, msg }) => {
      if (code === 1) {
        getIdleCar("/");
      } else {
        layer.msg(msg);
      }
    });
}

function checkCarStatus() {
  const url = `/backend-api/models?history_and_training_disabled=false`;
  $.get(url).catch(() => {
    // 处理错误
    layer.msg("当前车队已翻车，正在为您重新分配车队...");
    getIdleCar("/");
  });
}

function saveConvToFile() {
  const convId = window.location.pathname.split("/c/")[1];
  if (!convId) {
    layer.msg("当前未进行任何会话");
    return;
  }

  // 弹窗让用户选择下载格式
  layer.open({
    type: 1,
    title:
      '<i class="layui-icon layui-icon-export" style="margin-right: 8px;"></i>选择导出格式',
    content: `
      <div style="padding: 30px; background: #f8f9fa;">
        <div style="text-align: center; margin-bottom: 30px;">
          <p style="font-size: 16px; color: #333; margin: 0;">请选择要导出的文件格式</p>
          <p style="font-size: 13px; color: #666; margin-top: 8px;">选择适合您需求的格式下载对话内容</p>
        </div>
        <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
          <div style="text-align: center;">
            <button class="layui-btn layui-btn-lg" style="width: 140px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px solid #e6e6e6; background: #fff; color: #333;" 
                    onmouseover="this.style.borderColor='#1890ff'; this.style.background='#f0f7ff';" 
                    onmouseout="this.style.borderColor='#e6e6e6'; this.style.background='#fff';"
                    onclick="downloadConversation('md')">
              <i class="layui-icon layui-icon-file-b" style="font-size: 36px; color: #1890ff; margin-bottom: 8px;"></i>
              <span style="font-size: 14px; font-weight: 500;line-height: 25px;">Markdown</span>
            </button>
            <p style="font-size: 12px; color: #666; margin-top: 10px; max-width: 140px; letter-spacing: 0.5px;">原始格式，支持<br>再次编辑</p>
          </div>
          <div style="text-align: center;">
            <button class="layui-btn layui-btn-lg" style="width: 140px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px solid #e6e6e6; background: #fff; color: #333;" 
                    onmouseover="this.style.borderColor='#ff5722'; this.style.background='#fff5f5';" 
                    onmouseout="this.style.borderColor='#e6e6e6'; this.style.background='#fff';"
                    onclick="downloadConversation('pdf')">
              <i class="layui-icon layui-icon-file" style="font-size: 36px; color: #ff5722; margin-bottom: 8px;"></i>
              <span style="font-size: 14px; font-weight: 500;line-height: 25px;">PDF</span>
            </button>
            <p style="font-size: 12px; color: #666; margin-top: 10px; max-width: 140px; letter-spacing: 0.5px;">便于分享和<br>打印阅读</p>
          </div>
          <div style="text-align: center;">
            <button class="layui-btn layui-btn-lg" style="width: 140px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px solid #e6e6e6; background: #fff; color: #333;" 
                    onmouseover="this.style.borderColor='#5FB878'; this.style.background='#f0fff4';" 
                    onmouseout="this.style.borderColor='#e6e6e6'; this.style.background='#fff';"
                    onclick="downloadConversation('png')">
              <i class="layui-icon layui-icon-picture" style="font-size: 36px; color: #5FB878; margin-bottom: 8px;"></i>
              <span style="font-size: 14px; font-weight: 500;line-height: 25px;">图片</span>
            </button>
            <p style="font-size: 12px; color: #666; margin-top: 10px; max-width: 140px; letter-spacing: 0.5px;">适合社交媒体<br>分享</p>
          </div>
        </div>
      </div>
    `,
    area: ["600px", "350px"],
    shade: 0.3,
    shadeClose: true,
    closeBtn: 1,
    anim: 0,
    skin: "layer-export-dialog",
  });
}

function downloadConversation(format) {
  const convId = window.location.pathname.split("/c/")[1];
  if (!convId) {
    layer.msg("当前未进行任何会话");
    return;
  }

  layer.closeAll(); // 关闭选择格式的弹窗
  const loadIndex = setLoading("正在获取对话数据...");
  const url = `/frontend-api/saveChatgptConvToText?id=${convId}`;

  fetch(url)
    .then((response) => response.json())
    .then(({ code, msg, data }) => {
      console.log(code, msg);
      if (code === 1) {
        const now = new Date().Format("yyyy-MM-dd HH:mm:ss");
        if (format === "md") {
          downloadTextAsFile(data.chat, `${data.title}_${now}.md`);
        } else if (format === "pdf") {
          convertMarkdownToPDF(data.chat, `${data.title}_${now}.pdf`);
        } else if (format === "png") {
          convertMarkdownToImage(data.chat, `${data.title}_${now}.png`);
        }
      } else if (code === -1) {
        goHome();
      } else {
        alert(msg);
      }
      layer.close(loadIndex);
    })
    .catch((error) => {
      layer.close(loadIndex);
      layer.msg("获取对话数据失败: " + error.message);
    });
}

// 预处理 Markdown 文本，转义HTML标签使其显示为文本
function preprocessMarkdown(markdownText) {
  return markdownText;
  // 保护代码块内容
  // const codeBlocks = [];
  // let codeBlockIndex = 0;

  // // 提取代码块（三个反引号）
  // let processedText = markdownText.replace(/```[\s\S]*?```/g, function(match) {
  //   const placeholder = `__CODE_BLOCK_${codeBlockIndex}__`;
  //   codeBlocks[codeBlockIndex] = match;
  //   codeBlockIndex++;
  //   return placeholder;
  // });

  // // 提取行内代码（单个反引号）
  // processedText = processedText.replace(/`[^`\n]+`/g, function(match) {
  //   const placeholder = `__CODE_BLOCK_${codeBlockIndex}__`;
  //   codeBlocks[codeBlockIndex] = match;
  //   codeBlockIndex++;
  //   return placeholder;
  // });

  // // 转义HTML标签（只在非代码块区域）
  // // 将 < 替换为 &lt;，将 > 替换为 &gt;
  // processedText = processedText.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // // 恢复代码块
  // for (let i = 0; i < codeBlocks.length; i++) {
  //   processedText = processedText.replace(`__CODE_BLOCK_${i}__`, codeBlocks[i]);
  // }

  // return processedText;
}

// 将 Markdown 转换为 PDF
function convertMarkdownToPDF(markdownText, filename) {
  try {
    // 检查库是否已加载
    if (!window.jspdf || !window.html2canvas) {
      layer.msg("PDF 转换库未加载，请确保已引入 jsPDF 和 html2canvas 库");
      return;
    }

    const loadIndex = layer.load(2, { shade: [0.3, "#000"] });

    // 预处理 Markdown 文本
    const processedMarkdown = preprocessMarkdown(markdownText);

    // 创建一个临时的 div 来渲染内容
    const tempDiv = document.createElement("div");
    tempDiv.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 794px;
      padding: 40px;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", "微软雅黑", sans-serif;
      font-size: 14px;
      line-height: 1.8;
      color: #333;
    `;

    // 添加样式
    tempDiv.innerHTML = `
      <style>
        * { box-sizing: border-box; }
        h1, h2, h3, h4, h5, h6 { 
          margin-top: 24px; 
          margin-bottom: 16px; 
          font-weight: 600; 
          line-height: 1.25; 
          color: #24292e;
        }
        h1 { font-size: 28px; }
        h2 { font-size: 22px; }
        h3 { font-size: 18px; }
        p { margin-bottom: 16px; }
        code { 
          background: #f6f8fa; 
          padding: 2px 4px; 
          border-radius: 3px; 
          font-family: Consolas, Monaco, monospace;
          font-size: 13px;
          color: #e01e5a;
        }
        pre { 
          background: #f6f8fa; 
          padding: 16px; 
          border-radius: 6px; 
          overflow: auto; 
          margin-bottom: 16px;
          border: 1px solid #e1e4e8;
        }
        pre code {
          background: none;
          padding: 0;
          color: #333 !important;
          font-size: 13px;
          line-height: 1.5;
        }
        blockquote { 
          border-left: 4px solid #0366d6; 
          padding-left: 16px; 
          margin: 0 0 16px 0; 
          color: #6a737d; 
        }
        ul, ol { margin-bottom: 16px; padding-left: 32px; }
        li { margin-bottom: 8px; }
        table { 
          border-collapse: collapse; 
          margin-bottom: 16px; 
          width: 100%; 
        }
        th, td { 
          border: 1px solid #dfe2e5; 
          padding: 8px 12px; 
        }
        th { 
          background: #f6f8fa; 
          font-weight: 600; 
        }
      </style>
    `;

    // 将 Markdown 转换为 HTML
    if (window.markdownit) {
      const md = window.markdownit({
        html: true, // 启用HTML，因为我们已经转义了
        breaks: true,
        linkify: true,
      });

      // 添加标题
      const titleContent = `
        <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e1e4e8;">
          <h1 style="font-size: 32px; margin: 0 0 10px 0;">${filename.replace(".pdf", "").split("_")[0]}</h1>
          <p style="color: #666; font-size: 14px; margin: 0;">导出时间：${new Date().toLocaleString("zh-CN")}</p>
        </div>
      `;

      tempDiv.innerHTML += titleContent + md.render(processedMarkdown);
    } else {
      // 如果没有 markdown-it，使用简单的转换
      tempDiv.innerHTML += processedMarkdown
        .replace(/\n/g, "<br>")
        .replace(/### (.*)/g, "<h3>$1</h3>")
        .replace(/## (.*)/g, "<h2>$1</h2>")
        .replace(/# (.*)/g, "<h1>$1</h1>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
        .replace(/`([^`]+)`/g, "<code>$1</code>");
    }
    document.body.appendChild(tempDiv);

    // 使用 html2canvas 将 HTML 转换为 canvas
    html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 874,
      windowHeight: tempDiv.scrollHeight,
    })
      .then((canvas) => {
        document.body.removeChild(tempDiv);

        // 创建 PDF
        const { jsPDF } = window.jspdf;
        const imgData = canvas.toDataURL("image/png");

        // A4 尺寸
        const pdfWidth = 210;
        const pdfHeight = 297;

        // 计算图片在 PDF 中的尺寸
        const imgWidth = pdfWidth - 20; // 留出边距
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // 创建 PDF 文档
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        let heightLeft = imgHeight;
        let position = 10;

        // 添加第一页
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;

        // 如果内容超过一页，添加新页
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight - 20;
        }

        // 保存 PDF
        pdf.save(filename);
        layer.close(loadIndex);
        layer.msg("PDF 导出成功！");
      })
      .catch((error) => {
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
        layer.close(loadIndex);
        console.error("PDF conversion error:", error);
        layer.msg("PDF 转换失败: " + error.message);
      });
  } catch (error) {
    if (loadIndex) layer.close(loadIndex);
    console.error("PDF conversion error:", error);
    layer.msg("PDF 转换失败: " + error.message);
  }
}

// 将 Markdown 转换为图片
function convertMarkdownToImage(markdownText, filename) {
  try {
    // 检查库是否已加载
    if (!window.markdownit || !window.html2canvas) {
      layer.msg("图片转换库未加载，请确保已引入 html2canvas 和 markdown-it 库");
      return;
    }

    const loadIndex = layer.load(2, { shade: [0.3, "#000"] });

    // 初始化 markdown-it
    const md = window.markdownit({
      html: false, // 禁用HTML标签解析，HTML将作为文本显示
      breaks: true,
      linkify: true,
      typographer: true,
      xhtmlOut: false,
    });

    // 预处理 Markdown 文本
    const processedMarkdown = preprocessMarkdown(markdownText);

    // 创建一个临时的 div 来渲染内容
    const tempDiv = document.createElement("div");
    tempDiv.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 1200px;
      padding: 60px;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;
      font-size: 16px;
      line-height: 1.8;
      color: #333;
      letter-spacing: 0.5px;
      word-spacing: 1px;
    `;

    // 添加样式以美化输出
    tempDiv.innerHTML = `
      <style>
        h1, h2, h3, h4, h5, h6 { 
          margin-top: 32px; 
          margin-bottom: 20px; 
          font-weight: 600; 
          line-height: 1.25; 
          color: #24292e;
        }
        h1 { font-size: 36px; }
        h2 { font-size: 28px; }
        h3 { font-size: 24px; }
        p { margin-bottom: 20px; }
        code { 
          background: #f6f8fa; 
          padding: 3px 6px; 
          border-radius: 3px; 
          font-family: Consolas, Monaco, monospace;
          font-size: 14px;
          color: #e01e5a;
        }
        pre { 
          background: #f6f8fa; 
          padding: 20px; 
          border-radius: 8px; 
          overflow: auto; 
          margin-bottom: 20px;
          border: 1px solid #e1e4e8;
        }
        pre code {
          background: none;
          padding: 0;
          color: #333 !important;
          font-size: 13px;
          line-height: 1.5;
        }
        blockquote { 
          border-left: 4px solid #0366d6; 
          padding-left: 20px; 
          margin: 0 0 20px 0; 
          color: #6a737d; 
          font-style: italic;
        }
        ul, ol { margin-bottom: 20px; padding-left: 40px; }
        li { margin-bottom: 10px; }
        a { color: #0366d6; text-decoration: none; }
        a:hover { text-decoration: underline; }
        table { 
          border-collapse: collapse; 
          margin-bottom: 20px; 
          width: 100%; 
        }
        th, td { 
          border: 1px solid #dfe2e5; 
          padding: 12px 16px; 
        }
        th { 
          background: #f6f8fa; 
          font-weight: 600; 
        }
        hr { 
          border: none; 
          border-top: 2px solid #e1e4e8; 
          margin: 32px 0; 
        }
        img {
          max-width: 100%;
          height: auto;
        }
      </style>
      <div style="margin-bottom: 50px; padding-bottom: 30px; border-bottom: 2px solid #e1e4e8;">
        <h1 style="font-size: 42px; color: #24292e; margin: 0 0 10px 0;">
          ${filename.replace(".png", "").split("_")[0]}
        </h1>
        <p style="color: #586069; font-size: 14px; margin: 0;">
          <span style="margin-right: 20px;">📅 导出时间：${new Date().toLocaleString("zh-CN")}</span>
          <span>📄 格式：PNG 图片</span>
        </p>
      </div>
      <div style="padding-bottom: 40px;">
        ${md ? md.render(processedMarkdown) : processedMarkdown.replace(/\n/g, "<br>")}
      </div>
      <div style="margin-top: 50px; padding-top: 30px; border-top: 2px solid #e1e4e8; text-align: center; color: #586069; font-size: 14px;">
        <p>由 ChatGPT Share 导出 • ${window.location.origin}</p>
      </div>
    `;
    document.body.appendChild(tempDiv);

    // 使用 html2canvas 将 HTML 转换为 canvas
    html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1320,
      windowHeight: tempDiv.scrollHeight,
    })
      .then((canvas) => {
        document.body.removeChild(tempDiv);

        // 将 canvas 转换为图片并下载
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          layer.close(loadIndex);
          layer.msg("图片导出成功！");
        }, "image/png");
      })
      .catch((error) => {
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
        layer.close(loadIndex);
        console.error("Image conversion error:", error);
        layer.msg("图片转换失败: " + error.message);
      });
  } catch (error) {
    if (loadIndex) layer.close(loadIndex);
    console.error("Image conversion error:", error);
    layer.msg("图片转换失败: " + error.message);
  }
}

function renderSaveConv() {
  // 移除独立的导出按钮，已集成到设置菜单中
  const existingSaveBtn = $("#saveConv");
  if (existingSaveBtn.length > 0) {
    existingSaveBtn.remove();
  }
}

function showTips(msg) {
  layer.tips(msg);
}
