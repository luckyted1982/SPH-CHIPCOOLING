export default function Tasks() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center pt-14">
      <div className="text-center">
        <h1 className="text-h2 font-display mb-4" style={{ color: 'var(--text-primary)' }}>
          任务管理
        </h1>
        <p className="text-body" style={{ color: 'var(--text-muted)' }}>
          仿真任务列表 · 历史记录 · 状态追踪 · 结果对比
        </p>
      </div>
    </div>
  );
}
