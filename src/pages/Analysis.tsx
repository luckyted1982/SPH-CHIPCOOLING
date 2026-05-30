import { useParams } from 'react-router-dom';

export default function Analysis() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex min-h-[100dvh] items-center justify-center pt-14">
      <div className="text-center">
        <h1 className="text-h2 font-display mb-4" style={{ color: 'var(--text-primary)' }}>
          结果分析
        </h1>
        <p className="text-body mb-2" style={{ color: 'var(--text-muted)' }}>
          温度云图 · 热阻曲线 · 粒子轨迹回放
        </p>
        <p className="text-caption font-mono" style={{ color: 'var(--text-muted)' }}>
          Task ID: {id}
        </p>
      </div>
    </div>
  );
}
