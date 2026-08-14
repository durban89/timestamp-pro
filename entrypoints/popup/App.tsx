import { useState, useEffect } from 'react';
import './App.css';

type TimeMode = 'timestamp' | 'datetime';

interface ConversionResult {
  local: string;
  utc: string;
  relative: string;
  isValid: boolean;
}

export default function App() {
  const [inputValue, setInputValue] = useState<string>('');
  const [timeMode, setTimeMode] = useState<TimeMode>('timestamp');
  const [conversionResult, setConversionResult] = useState<ConversionResult>({
    local: '',
    utc: '',
    relative: '',
    isValid: false,
  });

  const [copyStatus, setCopyStatus] = useState<string>('');

  // 1. 读取网页划词传进来的 timestamp
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage) return;

    chrome.storage.local.get(['activeTimestamp'], (res) => {
      if (res.activeTimestamp) {
        setTimeMode('timestamp');
        setInputValue(String(res.activeTimestamp));
        chrome.storage.local.remove(['activeTimestamp']);
      }
    });

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes.activeTimestamp?.newValue) {
        setTimeMode('timestamp');
        setInputValue(String(changes.activeTimestamp.newValue));
        chrome.storage.local.remove(['activeTimestamp']);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  // 2. 获取当前时间戳
  const setNow = () => {
    const now = new Date();
    setInputValue(timeMode === 'timestamp' ? Math.floor(now.getTime() / 1000).toString() : now.toISOString());
  };

  // 3. 转换计算逻辑
  useEffect(() => {
    if (!inputValue.trim()) {
      setConversionResult({ local: '', utc: '', relative: '', isValid: false });
      return;
    }

    try {
      let targetDate: Date;

      if (timeMode === 'timestamp') {
        const cleanNum = inputValue.replace(/\D/g, '');
        if (!cleanNum) throw new Error('Invalid format');

        const numericValue = parseInt(cleanNum, 10);
        targetDate = cleanNum.length > 10 ? new Date(numericValue) : new Date(numericValue * 1000);
      } else {
        targetDate = new Date(inputValue);
      }

      if (isNaN(targetDate.getTime())) throw new Error('Invalid date');

      const diffMs = targetDate.getTime() - Date.now();
      const diffMins = Math.floor(diffMs / 60000);
      let relativeStr = '';
      if (Math.abs(diffMins) < 1) relativeStr = 'just now';
      else if (diffMins > 0) relativeStr = `In ${diffMins} mins`;
      else relativeStr = `${Math.abs(diffMins)} mins ago`;

      setConversionResult({
        local: targetDate.toLocaleString(),
        utc: targetDate.toUTCString(),
        relative: relativeStr,
        isValid: true,
      });
    } catch (err) {
      setConversionResult(prev => ({ ...prev, isValid: false }));
    }
  }, [inputValue, timeMode]);

  // 4. 复制逻辑
  const handleCopy = async (text: string, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(label);
      setTimeout(() => setCopyStatus(''), 1800);
    } catch (err) {
      console.error('Copy failed: ', err);
    }
  };

  const isStandalone = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'standalone';

  return (
    <div className={isStandalone ? "fixed inset-0 w-screen h-screen flex items-center justify-center bg-slate-950 bg-[radial-gradient(#334155_1px,transparent_1px)] bg-[size:16px_16px]" : ""}>
      <div className="w-[380px] bg-slate-950 text-slate-100 p-4 font-mono select-none antialiased border border-slate-800/80 rounded-2xl shadow-2xl relative overflow-hidden">
        
        {/* 💡 Header 布局重定义：不依赖冗长的 Manifest 名称，使用精细组件徽章 */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
            <span className="text-xs font-bold tracking-widest text-slate-200">
              EPOCH <span className="text-emerald-400 font-semibold text-[10px] bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/50">PRO</span>
            </span>
          </div>

          <button 
            onClick={setNow}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 shadow-xs"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            NOW
          </button>
        </div>

        {/* 模式切换器（Segmented Control） */}
        <div className="grid grid-cols-2 gap-1.5 my-3.5 p-1 bg-slate-900/90 border border-slate-800/80 rounded-xl">
          <button
            onClick={() => { setTimeMode('timestamp'); setInputValue(''); }}
            className={`py-1.5 text-xs rounded-lg font-medium transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 ${
              timeMode === 'timestamp' 
                ? 'bg-slate-800 text-emerald-400 font-semibold shadow-xs border border-emerald-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Timestamp</span>
            <span className="text-[10px] text-slate-500">→ Date</span>
          </button>
          
          <button
            onClick={() => { setTimeMode('datetime'); setInputValue(''); }}
            className={`py-1.5 text-xs rounded-md font-medium transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 ${
              timeMode === 'datetime' 
                ? 'bg-slate-800 text-emerald-400 font-semibold shadow-xs border border-emerald-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Date</span>
            <span className="text-[10px] text-slate-500">→ Timestamp</span>
          </button>
        </div>

        {/* 输入框区域 */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center px-0.5">
            <label className="text-[10px] text-slate-400 font-semibold tracking-wider">
              INPUT {timeMode === 'timestamp' ? 'UNIX TIMESTAMP' : 'DATETIME STRING'}
            </label>
            {inputValue && (
              <button 
                onClick={() => setInputValue('')}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                清空
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={timeMode === 'timestamp' ? 'e.g. 1717113600' : 'e.g. 2026-06-01 12:00:00'}
              className="w-full px-3 py-2 text-xs bg-slate-900/90 border border-slate-800/80 focus:border-emerald-500/60 rounded-xl outline-none text-slate-100 font-mono tracking-wide placeholder-slate-600 transition-all focus:ring-1 focus:ring-emerald-500/30 shadow-inner"
            />
          </div>
        </div>

        {/* 输出结果区 */}
        <div className="mt-3.5 space-y-2">
          {inputValue && !conversionResult.isValid ? (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium tracking-wide flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>格式无效，请输入正确的 {timeMode === 'timestamp' ? '数字时间戳' : '日期字符串'}</span>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Local Time 卡片 */}
              <div
                onClick={() => handleCopy(conversionResult.local, 'local')}
                className="group p-2.5 bg-slate-900/70 border border-slate-800/80 hover:border-emerald-500/40 rounded-xl cursor-pointer transition-all duration-200 relative overflow-hidden active:scale-[0.99]"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-500 font-bold tracking-wider">LOCAL TIME</span>
                  <span className="text-[10px] text-emerald-400 opacity-80 group-hover:opacity-100 transition-opacity font-semibold">
                    {copyStatus === 'local' ? '✓ COPIED' : 'CLICK TO COPY'}
                  </span>
                </div>
                <div className="text-xs text-slate-200 font-semibold break-all">
                  {conversionResult.local || <span className="text-slate-600 font-normal">等待输入...</span>}
                </div>
              </div>

              {/* UTC Time 卡片 */}
              <div
                onClick={() => handleCopy(conversionResult.utc, 'utc')}
                className="group p-2.5 bg-slate-900/70 border border-slate-800/80 hover:border-emerald-500/40 rounded-xl cursor-pointer transition-all duration-200 relative overflow-hidden active:scale-[0.99]"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-500 font-bold tracking-wider">UTC ISO STRING</span>
                  <span className="text-[10px] text-emerald-400 opacity-80 group-hover:opacity-100 transition-opacity font-semibold">
                    {copyStatus === 'utc' ? '✓ COPIED' : 'CLICK TO COPY'}
                  </span>
                </div>
                <div className="text-xs text-slate-200 font-semibold break-all">
                  {conversionResult.utc || <span className="text-slate-600 font-normal">等待输入...</span>}
                </div>
              </div>

              {/* Relative Time 卡片 */}
              <div className="p-2.5 bg-slate-900/40 border border-slate-800/50 rounded-xl flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold tracking-wider">RELATIVE TIME</span>
                <span className="text-xs text-emerald-400 font-semibold">
                  {conversionResult.relative || <span className="text-slate-600 font-normal">--</span>}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer 快捷键提示 */}
        <div className="mt-4 pt-2.5 border-t border-slate-900 text-center">
          <span className="text-[10px] text-slate-600 tracking-wider">
            快捷键 <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400 text-[9px] shadow-xs">Alt + T</kbd> 快速呼出插件
          </span>
        </div>
      </div>
    </div>
  );
}