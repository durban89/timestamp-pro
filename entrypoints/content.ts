import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import '@/entrypoints/popup/App.css'; 
import TimeBubble from '@/components/TimeBubble';

export default defineContentScript({
  matches: ['<all_urls>'],
  
main(ctx) {
    let iframeContainer: HTMLIFrameElement | null = null;

    const destroyIframe = () => {
      if (iframeContainer) {
        iframeContainer.remove();
        iframeContainer = null;
      }
    };

    document.addEventListener('mouseup', (e: MouseEvent) => {
      const selection = window.getSelection();
      if (!selection) return;

      const selectedText = selection.toString().trim();
      const timestampRegex = /^\d{10}$|^\d{13}$/;
      
      if (!timestampRegex.test(selectedText)) {
        if (selectedText === '') {
          // 如果点击的是我们自己的 Iframe 内部，绝不销毁
          if (e.target === iframeContainer) return;
          destroyIframe();
        }
        return;
      }

      destroyIframe();

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // 1. 物理锁死气泡的长宽（必须和 BubbleApp.tsx 里的外层 div 像素完全一致）
      const bubbleWidth = 222; // 220px + 2px 边框缓冲
      const bubbleHeight = 107;

      let bubbleX = rect.left + window.scrollX;
      let bubbleY = rect.bottom + window.scrollY + 6;

      // 2. 智能避让碰撞算法
      if (rect.bottom + bubbleHeight > window.innerHeight) {
        bubbleY = rect.top + window.scrollY - bubbleHeight - 6;
      }
      if (rect.left + bubbleWidth > window.innerWidth) {
        bubbleX = window.innerWidth + window.scrollX - bubbleWidth - 16;
      }

      // 3. 动态创建完全干净的 Iframe
      iframeContainer = document.createElement('iframe');
      // 通过 WXT 的内置方法获取本地 bubble.html 的安全扩展路径
      iframeContainer.src = browser.runtime.getURL('/bubble.html');
      
      // ⭐ 核心硬核样式：消除 Iframe 默认的白底、边框和滚动条，使其变成全透明“贴纸”
      iframeContainer.style.position = 'absolute';
      iframeContainer.style.top = `${bubbleY}px`;
      iframeContainer.style.left = `${bubbleX}px`;
      iframeContainer.style.width = `${bubbleWidth}px`;
      iframeContainer.style.height = `${bubbleHeight}px`;
      iframeContainer.style.border = 'none';
      iframeContainer.style.backgroundColor = 'transparent';
      iframeContainer.style.overflow = 'hidden';
      iframeContainer.style.zIndex = '2147483647'; // 顶格层级
      iframeContainer.allow = 'clipboard-write'; // 授权 Iframe 写入剪贴板的权限
      
      document.body.appendChild(iframeContainer);

      // 4. ⭐ 大厂级通信规范：当 Iframe 加载完成后，将划词数据安全地“推”进沙箱内部
      iframeContainer.onload = () => {
        iframeContainer?.contentWindow?.postMessage(
          { type: 'INIT_TIMESTAMP', value: selectedText },
          '*'
        );
      };
    });

    // 5. 监听来自 Iframe 内部发来的“关闭自己”的跨域信号
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'CLOSE_BUBBLE') {
        destroyIframe();
      }
    });

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') destroyIframe();
    });

    ctx.onInvalidated(() => destroyIframe());

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "KEYBOARD_TOGGLE_PANEL") {
        // 1. 防御防御：如果屏幕上已经有气泡了，按下快捷键直接将其无痕销毁（Toggle 效果）
        if (iframeContainer) {
          destroyIframe();
          return;
        }

        // 2. 如果屏幕上没有气泡，在浏览器可视区域的正中央，优雅地贴出我们的提效面板
        const bubbleWidth = 222;
        const bubbleHeight = 107;
        
        // 计算 Viewport 视口正中央的绝对坐标（包含滚动条位移）
        const bubbleX = (window.innerWidth - bubbleWidth) / 2 + window.scrollX;
        const bubbleY = (window.innerHeight - bubbleHeight) / 2 + window.scrollY;

        iframeContainer = document.createElement('iframe');
        iframeContainer.src = browser.runtime.getURL('/bubble.html');
        
        iframeContainer.style.position = 'absolute';
        iframeContainer.style.top = `${bubbleY}px`;
        iframeContainer.style.left = `${bubbleX}px`;
        iframeContainer.style.width = `${bubbleWidth}px`;
        iframeContainer.style.height = `${bubbleHeight}px`;
        iframeContainer.style.border = 'none';
        iframeContainer.style.backgroundColor = 'transparent';
        iframeContainer.style.overflow = 'hidden';
        iframeContainer.style.zIndex = '2147483647';
        iframeContainer.allow = 'clipboard-write';
        
        document.body.appendChild(iframeContainer);

        // 3. 页面载入后，默认把当前（now）的最新时间戳直接推给 React 渲染出来
        iframeContainer.onload = () => {
          const currentTimestamp = Math.floor(Date.now() / 1000).toString();
          iframeContainer?.contentWindow?.postMessage(
            { type: 'INIT_TIMESTAMP', value: currentTimestamp },
            '*'
          );
        };
      }
    });
  },
});
