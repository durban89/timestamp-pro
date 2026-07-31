import { useState, useEffect } from 'react';

export default function BubbleApp() {
  const [timestamp, setTimestamp] = useState('');
  const [copied, setCopied] = useState(false);

  // 1. 监听来自 content.ts 的跨域数据传输
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'INIT_TIMESTAMP') {
        setTimestamp(event.data.value);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!timestamp) return null;

  // 2. 自适应 10 位/13 位数据清洗与日期转换
  const numericVal = parseInt(timestamp.replace(/\D/g, ''), 10);
  const targetDate = timestamp.length <= 10 ? new Date(numericVal * 1000) : new Date(numericVal);
  const formattedTime = targetDate.toLocaleString();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedTime);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClose = () => {
    // 通知父窗口（content.ts）把自己销毁
    window.parent.postMessage({ type: 'CLOSE_BUBBLE' }, '*');
  };

  return (
    // ⭐ 物理隔离：在这里你的 Tailwind 样式拥有绝对控制权！
    <div className="w-[220px] h-[105px] font-mono bg-slate-950 text-slate-100 border border-emerald-500/40 p-2.5 rounded-lg shadow-2xl flex flex-col gap-1.5 select-none text-left box-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between text-slate-500 font-bold border-b border-slate-900 pb-1 text-[10px]">
        <span className="text-emerald-400 tracking-wider">⚡ TIMESTAMP</span>
        <button 
          onClick={handleClose}
          className="text-slate-600 hover:text-rose-400 text-xs transition-colors p-0 m-0 bg-transparent border-none cursor-pointer"
        >
          ✕
        </button>
      </div>
      
      {/* Raw Data */}
      <div className="text-slate-400 text-[11px] m-0 p-0">
        Raw: <span className="text-slate-300 font-medium">{timestamp}</span>
      </div>
      
      {/* Result & Copy */}
      <div 
        onClick={handleCopy}
        className="mt-0.5 p-1.5 bg-slate-900 hover:bg-slate-900/80 rounded border border-slate-950 cursor-pointer flex items-center justify-between group transition-all box-border"
      >
        <span className="text-slate-200 break-all text-[11px] font-semibold flex-1 pr-1 truncate">{formattedTime}</span>
        <span className="text-[9px] text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity shrink-0 bg-slate-950 px-1 py-0.5 rounded border border-slate-800">
          {copied ? '✓' : 'COPY'}
        </span>
      </div>
    </div>
  );
}
