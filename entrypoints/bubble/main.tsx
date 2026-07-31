import React from 'react';
import ReactDOM from 'react-dom/client';
import BubbleApp from './BubbleApp.tsx';
import '@/entrypoints/popup/App.css'; // ⭐ 降维打击：直接共享Popup的Tailwind全局样式表！

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BubbleApp />
  </React.StrictMode>
);