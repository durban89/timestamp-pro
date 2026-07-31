import React, { useState } from 'react';

interface TimeBubbleProps {
  timestamp: string;
  x: number;
  y: number;
  onClose: () => void;
}

export default function TimeBubble({ timestamp, x, y, onClose }: TimeBubbleProps) {
  const [copied, setCopied] = useState(false);

  const numericVal = parseInt(timestamp.replace(/\D/g, ''), 10);
  const targetDate = timestamp.length <= 10 ? new Date(numericVal * 1000) : new Date(numericVal);
  const formattedTime = targetDate.toLocaleString();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(formattedTime);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: `${y}px`,
        left: `${x}px`,
        zIndex: 2147483647,
        // ⭐ 强行锁定基础盒模型与行高，彻底隔绝外部网页的样式污染
        boxSizing: 'border-box',
        fontSize: '12px',
        lineHeight: '1.2',
        padding: '8px 12px',
        width: '210px',
      }}
      className="font-mono bg-slate-950 text-slate-100 border border-emerald-500/30 rounded-lg shadow-2xl flex flex-col gap-1.5 select-none text-left"
    >
      {/* 头部区域 */}
      <div 
        style={{ boxSizing: 'border-box', margin: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'between' }}
        className="text-slate-500 font-bold border-b border-slate-900 pb-1.5 text-[10px] w-full"
      >
        <span className="text-emerald-400 tracking-wider flex-1">⚡ TIMESTAMP</span>
        {/* ⭐ 重点调教：强行把 button 的默认 margin/padding 归零，锁定长宽 */}
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: 'pointer',
            fontSize: '11px',
            lineHeight: '1',
            width: '12px',
            height: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="text-slate-600 hover:text-rose-400 transition-colors font-sans"
        >
          ✕
        </button>
      </div>
      
      {/* 原始内容 */}
      <div style={{ boxSizing: 'border-box', margin: 0, padding: 0 }} className="text-slate-400 text-[11px] mt-0.5">
        Raw: <span className="text-slate-300 font-medium">{timestamp}</span>
      </div>
      
      {/* 转换结果区域 */}
      <div 
        onClick={handleCopy}
        style={{ boxSizing: 'border-box', margin: '4px 0 0 0', padding: '6px 8px' }}
        className="bg-slate-900 hover:bg-slate-900/80 rounded border border-slate-950 cursor-pointer flex items-center justify-between group transition-all"
      >
        <span style={{ lineHeight: '1.3' }} className="text-slate-200 break-all text-[11px] font-semibold flex-1 pr-1">{formattedTime}</span>
        <span 
          style={{ padding: '2px 4px', fontSize: '9px', lineHeight: '1' }}
          className="text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity shrink-0 bg-slate-950 rounded border border-slate-800"
        >
          {copied ? '✓' : 'COPY'}
        </span>
      </div>
    </div>
  );
}
