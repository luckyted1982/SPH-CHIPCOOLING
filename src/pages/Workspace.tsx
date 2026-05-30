export default function Workspace() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center pt-14">
      <div className="text-center">
        <h1 className="text-h2 font-display mb-4" style={{ color: 'var(--text-primary)' }}>
          仿真工作台
        </h1>
        <p className="text-body" style={{ color: 'var(--text-muted)' }}>
          自然语言输入 · 参数配置 · 3D 仿真可视化
        </p>
      </div>
    </div>
  );
}
