import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Workspace = lazy(() => import('./pages/Workspace'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Templates = lazy(() => import('./pages/Templates'));
const Analysis = lazy(() => import('./pages/Analysis'));

function App() {
  return (
    <HashRouter>
      <Layout>
        <Suspense
          fallback={
            <div
              className="flex min-h-[100dvh] items-center justify-center"
              style={{ background: 'var(--bg-abyss)' }}
            >
              <div className="flex flex-col items-center gap-4">
                <div
                  className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                  style={{ borderColor: 'var(--accent-flow)', borderTopColor: 'transparent' }}
                />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  加载中...
                </span>
              </div>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/analysis/:id" element={<Analysis />} />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  );
}

export default App;
