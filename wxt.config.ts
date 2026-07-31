import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  runner: {
    disabled: true,
  },
  // ⭐ 确保内容脚本支持注入样式
  manifest: {
    version: '1.0.0',
    name: '⚡ Timestamp Pro - Unix Epoch Converter',
    description: 'Instantly convert Unix timestamps via selection or popup. 10/13-digit smart auto-detection with pure dark extreme theme.',
    icons: {
      '16': 'icon/16.png',
      '32': 'icon/32.png',
      '48': 'icon/48.png',
      '96': 'icon/96.png',
      '128': 'icon/128.png',
    },
    commands: {
      "toggle-timestamp-panel": {
        "suggested_key": {
          "default": "Alt+T",
          "mac": "MacCtrl+T" // Mac 下优雅适配为 Ctrl + T，防止与系统菜单冲突
        },
        "description": "Quickly toggle the Timestamp Conversion Panel"
      }
    },
    permissions: ['storage'],
    web_accessible_resources: [
      {
        // 允许所有网页通过 iframe 加载我们插件内的这两个编译产物
        resources: [
          'bubble.html',
          'assets/*'
        ],
        matches: ['<all_urls>'],
      },
    ],
  },
  vite: () => ({
    server: {
      host: '0.0.0.0', // 监听所有网络接口
      port: 3000,
      hmr: {
        host: 'localhost', // 告诉宿主机的 Chrome 往 localhost 发起连接
        port: 3000,
      },
    },
  }),
});
