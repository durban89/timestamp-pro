export default defineBackground(() => {
  // 监听来自内容脚本（Content Script）的跨进程消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'OPEN_SIDE_PANEL_WITH_TIMESTAMP') {
        const tabId = sender.tab?.id;
        
        if (tabId) {
          // 1. 将抓取到的时间戳安全地写入扩展的全局存储中
          chrome.storage.local.set({ activeTimestamp: message.timestamp }, () => {
            // 2. ⭐ 调用 Chrome 核心 API：为当前标签页强制滑开侧边栏
            chrome.sidePanel.open({ tabId }).catch((err) => {
              console.error('Failed to open side panel:', err);
            });
          });
        }
      }
    });

    chrome.commands.onCommand.addListener((command) => {
      if (command === "toggle-timestamp-panel") {
        // 1. 获取用户当前正在凝视的那个活动的标签页（Active Tab）
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTabId = tabs[0]?.id;
          if (activeTabId) {
            // 2. 向该网页的 content.ts 跨进程发送“快捷键被按下”的指令
            chrome.tabs.sendMessage(activeTabId, { action: "KEYBOARD_TOGGLE_PANEL" }).catch((err) => {
              // 优雅防御：捕获用户在 Chrome 默认空白页或应用商店页（这些页面禁止注入脚本）按下快捷键导致的报错
              console.log("Cannot injection on this page context:", err.message);
            });
          }
        });
      }
    });
});
