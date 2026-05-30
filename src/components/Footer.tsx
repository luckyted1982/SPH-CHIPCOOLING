import { Link } from 'react-router-dom';
import { Atom, Github, BookOpen, MessageCircle } from 'lucide-react';

const QUICK_LINKS = [
  { path: '/', label: '首页' },
  { path: '/workspace', label: '仿真工作台' },
  { path: '/tasks', label: '任务管理' },
  { path: '/templates', label: '模板库' },
];

const DOC_LINKS = [
  { href: '#', label: 'SPH 方法原理' },
  { href: '#', label: 'API 文档' },
  { href: '#', label: '参数配置指南' },
  { href: '#', label: '故障排查' },
];

const COMMUNITY_LINKS = [
  { href: 'https://github.com/Xiangyu-Hu/SPHinXsys', label: 'GitHub', icon: Github },
  { href: '#', label: '讨论区', icon: MessageCircle },
  { href: '#', label: '文档中心', icon: BookOpen },
];

export default function Footer() {
  return (
    <footer
      className="relative border-t"
      style={{
        background: 'var(--bg-abyss)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-md"
                style={{ background: 'var(--bg-surface)' }}
              >
                <Atom className="h-5 w-5" style={{ color: 'var(--accent-flow)' }} />
              </div>
              <span className="font-display text-lg font-semibold">SPHinXsys</span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
              自然语言驱动的芯片散热仿真平台
              <br />
              基于 SPH 光滑粒子流体动力学方法
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              基于 SPHinXsys 开源仿真引擎
              <br />
              React + Three.js
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              快速链接
            </h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm transition-colors duration-200 hover:text-[var(--text-primary)]"
                    style={{ color: 'var(--text-body)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Documentation */}
          <div>
            <h4 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              技术文档
            </h4>
            <ul className="space-y-2.5">
              {DOC_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm transition-colors duration-200 hover:text-[var(--text-primary)]"
                    style={{ color: 'var(--text-body)' }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              开源社区
            </h4>
            <ul className="space-y-2.5">
              {COMMUNITY_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm transition-colors duration-200 hover:text-[var(--text-primary)]"
                      style={{ color: 'var(--text-body)' }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            &copy; {new Date().getFullYear()} SPHinXsys Team. Licensed under Apache 2.0.
          </p>
          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            SPHinXsys Open Source Simulation Engine &middot; React 19 + Three.js
          </p>
        </div>
      </div>
    </footer>
  );
}
