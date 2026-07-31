import { useState } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';
import './App.css';

// 严格的TypeScript类型声明
type TimeMode = 'timestamp' | 'datetime';

interface ConversionResult {
  local: string;
  utc: string;
  relative: string;
  isValid: boolean;
}


function App() {
  // 1, 核心状态管理
  const [inputValue, setInputValue] = useState<string>('');
  const [timeMode, setTimeMode] = useState<TimeMode>('timestamp');
  const [conversionResult, setConversionResult] = useState<ConversionResult>({
    local: '',
    utc: '',
    relative: '',
    isValid: false,
  });

  const [copyStatus, setCopyStatus] = useState<string>('');

  useEffect(() => {
    // 1. 页面初次加载时，先读取一次可能已经存在的划词数据
    chrome.storage.local.get(['activeTimestamp'], (res) => {
      if (res.activeTimestamp) {
        setTimeMode('timestamp'); // 强行切到时间戳模式
        setInputValue(res.activeTimestamp);
        // 读取完后顺手清理掉，防止下次误触发
        chrome.storage.local.remove(['activeTimestamp']);
      }
    });

    // 2. 监听存储的变化（当用户在网页上再次划词时触发）
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes.activeTimestamp?.newValue) {
        setTimeMode('timestamp');
        setInputValue(changes.activeTimestamp.newValue);
        chrome.storage.local.remove(['activeTimestamp']);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);


  // 2, 实现一件初始化当前时间戳
  const setNow = () => {
    const now = new Date();
    setInputValue(timeMode === 'timestamp' ? Math.floor(now.getTime() / 1000).toString() : now.toISOString());
  }

  // 3. 高强度核心数据清洗与转换逻辑
  useEffect(() => {
    if (!inputValue.trim()) {
      setConversionResult({
        local: '',
        utc: '',
        relative: '',
        isValid: false,
      });

      return;
    }

    try {
      let targetDate: Date;
      
      if (timeMode === 'timestamp') {
        const cleanNum = inputValue.replace(/\D/g, ''); // 清洗非数字字符
        if (!cleanNum) throw new Error('Invalid format');

        const numericValue = parseInt(cleanNum, 10);

        targetDate = cleanNum.length > 10 ? new Date(numericValue) : new Date(numericValue * 1000);
      } else {
        targetDate = new Date(inputValue);
      }

      if (isNaN(targetDate.getTime())) throw new Error('Invalid date');

      // 计算相对时间
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
      setConversionResult(prev => ({...prev, isvalid: false}));
    }
  }, [inputValue, timeMode]);

  //4, 复制到剪贴板的功能
  const handleCopy = async (text: string, label: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`${label}`);
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="w-[380px] min-h-[420px] bg-slate-950 text-slate-100 p-4 font-mono select-none antialiased">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h1 className="text-sm font-bold tracking-wider text-emerald-400">⚡ TIMESTAMP PRO</h1>
        <button 
          onClick={setNow}
          className="px-2 py-1 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded transition-all duration-200"
        >
          GET NOW
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-2 my-4 p-1 bg-slate-900 border border-slate-800 rounded-lg">
        <button
          onClick={() => { setTimeMode('timestamp'); setInputValue(''); }}
          className={`py-1.5 text-xs rounded-md font-medium transition-all ${timeMode === 'timestamp' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Timestamp → Date
        </button>
        <button
          onClick={() => { setTimeMode('datetime'); setInputValue(''); }}
          className={`py-1.5 text-xs rounded-md font-medium transition-all ${timeMode === 'datetime' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Date → Timestamp
        </button>
      </div>

      {/* Input Section */}
      <div className="space-y-1.5">
        <label className="text-xs text-slate-500 font-semibold tracking-wide">
          INPUT {timeMode === 'timestamp' ? 'UNIX TIMESTAMP' : 'DATETIME STRING'}
        </label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={timeMode === 'timestamp' ? 'e.g. 1717113600' : 'e.g. 2026-06-01 12:00:00'}
          className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-800 focus:border-emerald-500/50 rounded-lg outline-none text-slate-200 font-mono tracking-wide placeholder-slate-700 transition-all"
        />
      </div>

      {/* Output / Results Display */}
      <div className="mt-5 space-y-4">
        {inputValue && !conversionResult.isValid ? (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg font-semibold tracking-wide animate-pulse">
            ✕ INVALID INPUT FORMAT
          </div>
        ) : (
          <div className="space-y-3">
            {/* Local Time Result */}
            <div 
              onClick={() => handleCopy(conversionResult.local, 'local')}
              className="group p-2.5 bg-slate-900/50 border border-slate-900 hover:border-slate-800 rounded-lg cursor-pointer transition-all relative overflow-hidden"
            >
              <div className="text-[10px] text-slate-500 font-bold tracking-wider mb-1">LOCAL TIME</div>
              <div className="text-xs text-slate-300 break-all">{conversionResult.local || '--'}</div>
              <span className="absolute right-2 top-2 text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {copyStatus === 'local' ? '✓ COPIED' : 'CLICK TO COPY'}
              </span>
            </div>

            {/* UTC Time Result */}
            <div 
              onClick={() => handleCopy(conversionResult.utc, 'utc')}
              className="group p-2.5 bg-slate-900/50 border border-slate-900 hover:border-slate-800 rounded-lg cursor-pointer transition-all relative overflow-hidden"
            >
              <div className="text-[10px] text-slate-500 font-bold tracking-wider mb-1">UTC ISO STRING</div>
              <div className="text-xs text-slate-300 break-all">{conversionResult.utc || '--'}</div>
              <span className="absolute right-2 top-2 text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {copyStatus === 'utc' ? '✓ COPIED' : 'CLICK TO COPY'}
              </span>
            </div>

            {/* Relative Time Result */}
            <div className="p-2.5 bg-slate-900/30 border border-slate-950 rounded-lg">
              <div className="text-[10px] text-slate-500 font-bold tracking-wider mb-1">RELATIVE TIME</div>
              <div className="text-xs text-emerald-500/80 font-semibold">{conversionResult.relative || '--'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-2 border-t border-slate-900 text-center">
        <span className="text-[10px] text-slate-600 tracking-wider">
          PRESS <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400 text-[9px] shadow-sm">ALT + T</kbd> TO QUICK TOGGLE
        </span>
      </div>
    </div>
  );
}

export default App;
