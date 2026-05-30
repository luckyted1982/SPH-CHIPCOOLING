import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Sparkles, Cpu, Droplets, Flame, Zap } from 'lucide-react';
import type { ParsedParams } from '@/types';

const QUICK_TAGS = [
  { label: 'CPU风冷', icon: Cpu, text: '模拟一个100W的CPU芯片使用铝散热器风冷冷却' },
  { label: 'GPU水冷', icon: Droplets, text: '模拟一个350W的GPU芯片在水冷头微通道中的散热' },
  { label: '功率器件', icon: Flame, text: '模拟功率器件通过热管的相变换热散热' },
  { label: '浸没冷却', icon: Zap, text: '模拟服务器芯片在绝缘冷却液中的浸没式散热' },
];

interface NLInputPanelProps {
  nlInput: string;
  setNlInput: (v: string) => void;
  parsedResult: ParsedParams | null;
  isParsing: boolean;
  onParse: () => void;
  onApplyTemplate: (text: string) => void;
}

export default function NLInputPanel({
  nlInput,
  setNlInput,
  parsedResult,
  isParsing,
  onParse,
  onApplyTemplate,
}: NLInputPanelProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" style={{ color: 'var(--accent-flow)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          自然语言描述
        </span>
      </div>

      {/* Textarea */}
      <div
        className="relative transition-all duration-200"
        style={{
          borderRadius: 'var(--radius-sm)',
          boxShadow: isFocused ? '0 0 12px rgba(78, 205, 196, 0.1)' : 'none',
        }}
      >
        <textarea
          value={nlInput}
          onChange={(e) => setNlInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="描述你的散热场景，例如：模拟 Intel i9-13900K 在 240mm 水冷下的散热..."
          className="w-full resize-none px-3 py-2.5 text-sm outline-none transition-colors"
          style={{
            height: 80,
            background: 'var(--bg-surface)',
            border: `1px solid ${isFocused ? 'var(--border-active)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Quick tags */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {QUICK_TAGS.map((tag) => {
          const Icon = tag.icon;
          return (
            <button
              key={tag.label}
              onClick={() => onApplyTemplate(tag.text)}
              className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1 text-xs transition-all duration-200 hover:border"
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text-body)',
                borderRadius: 9999,
                borderColor: 'var(--border-active)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.border = '1px solid var(--border-active)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-body)';
                e.currentTarget.style.border = '1px solid transparent';
              }}
            >
              <Icon className="h-3 w-3" />
              {tag.label}
            </button>
          );
        })}
      </div>

      {/* Parse button */}
      <button
        onClick={onParse}
        disabled={isParsing || !nlInput.trim()}
        className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'var(--accent-flow)',
          color: 'var(--bg-abyss)',
          borderRadius: 'var(--radius-sm)',
          height: 36,
        }}
      >
        {isParsing ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--bg-abyss)', borderTopColor: 'transparent' }} />
        ) : (
          <Wand2 className="h-4 w-4" />
        )}
        {isParsing ? '解析中...' : '解析需求'}
      </button>

      {/* Parsed result display */}
      <AnimatePresence>
        {parsedResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="space-y-2 p-3"
              style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-body)' }}>解析结果</span>
                <span
                  className="text-xs font-medium"
                  style={{
                    color: parsedResult.confidence > 0.6 ? 'var(--accent-particle)' : parsedResult.confidence > 0.3 ? 'var(--accent-energy)' : 'var(--accent-thermal)',
                  }}
                >
                  置信度: {(parsedResult.confidence * 100).toFixed(0)}%
                </span>
              </div>
              {parsedResult.chipType && (
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>芯片类型</span>
                  <span style={{ color: 'var(--text-primary)' }}>{parsedResult.chipType.toUpperCase()}</span>
                </div>
              )}
              {parsedResult.power && (
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>功耗</span>
                  <span style={{ color: 'var(--text-primary)' }}>{parsedResult.power} W</span>
                </div>
              )}
              {parsedResult.material && (
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>材料</span>
                  <span style={{ color: 'var(--text-primary)' }}>{parsedResult.material}</span>
                </div>
              )}
              {parsedResult.coolingMethod && (
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>冷却方式</span>
                  <span style={{ color: 'var(--text-primary)' }}>{parsedResult.coolingMethod}</span>
                </div>
              )}
              {parsedResult.missingParams.length > 0 && (
                <div className="text-xs" style={{ color: 'var(--accent-energy)' }}>
                  未识别参数: {parsedResult.missingParams.join(', ')}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
