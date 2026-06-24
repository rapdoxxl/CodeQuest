import { Link } from 'react-router-dom'
import { LearningProfile } from '../types'

type LearningAgentPanelProps = {
  profile: LearningProfile | null
  loading?: boolean
}

const riskLabels = {
  low: { text: '稳定', color: '#156c43', background: '#e9f7ef' },
  medium: { text: '需关注', color: '#8a5200', background: '#fff4d6' },
  high: { text: '需干预', color: '#9f1d20', background: '#fde7e9' }
}

const errorTypeLabels: Record<string, string> = {
  empty_answer: '空提交',
  compile_error: '编译问题',
  runtime_error: '运行问题',
  output_mismatch: '输出偏差',
  near_miss: '接近正确',
  answer_mismatch: '结构偏差',
  passed: '已通过',
  hint_used: '查看提示',
  low_star_progress: '低星进度'
}

const formatTime = (value?: string) => {
  if (!value) return '暂无时间'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const renderRate = (label: string, value: number) => {
  const safeValue = Math.max(0, Math.min(100, value || 0))

  return (
    <div style={{ minWidth: '160px', flex: '1 1 180px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
        <strong>{label}</strong>
        <span>{safeValue}%</span>
      </div>
      <div style={{ height: '8px', background: '#e6e6e6', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ width: `${safeValue}%`, height: '100%', background: '#2f6fed' }} />
      </div>
    </div>
  )
}

export default function LearningAgentPanel({ profile, loading = false }: LearningAgentPanelProps) {
  if (loading) {
    return (
      <section style={{ padding: '16px', border: '2px solid #333', borderRadius: '8px' }}>
        <h2>学习画像 Agent</h2>
        <p style={{ marginTop: '8px' }}>正在读取学习画像...</p>
      </section>
    )
  }

  if (!profile) {
    return (
      <section style={{ padding: '16px', border: '2px solid #333', borderRadius: '8px' }}>
        <h2>学习画像 Agent</h2>
        <p style={{ marginTop: '8px' }}>完成一次提交后生成学习画像。</p>
      </section>
    )
  }

  const risk = riskLabels[profile.riskLevel] || riskLabels.low

  return (
    <section style={{ padding: '16px', border: '2px solid #333', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h2>学习画像 Agent</h2>
          <p style={{ marginTop: '8px', lineHeight: 1.7 }}>{profile.agentSummary}</p>
        </div>
        <span
          style={{
            alignSelf: 'flex-start',
            padding: '6px 10px',
            borderRadius: '999px',
            color: risk.color,
            background: risk.background,
            fontWeight: 700
          }}
        >
          风险：{risk.text}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '18px' }}>
        {renderRate('开放关卡进度', profile.completionRate)}
        {renderRate('3 星掌握率', profile.masteryRate)}
        <div style={{ flex: '1 1 160px' }}>
          <strong>学习事件</strong>
          <p style={{ marginTop: '6px', fontSize: '24px', fontWeight: 700 }}>{profile.attempts}</p>
        </div>
      </div>

      <div style={{ marginTop: '18px' }}>
        <h3>路径推荐</h3>
        <p style={{ marginTop: '8px', lineHeight: 1.7 }}>{profile.recommendation.reason}</p>
        {profile.recommendation.levelId && (
          <Link
            to={`/level/${profile.recommendation.levelId}`}
            style={{ display: 'inline-block', marginTop: '8px' }}
          >
            前往第 {profile.recommendation.levelId} 关：{profile.recommendation.title}
          </Link>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '18px' }}>
        <div style={{ border: '1px solid #d0d0d0', borderRadius: '8px', padding: '12px' }}>
          <h3>薄弱知识点</h3>
          {profile.weakKnowledge.length > 0 ? (
            <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: 1.8 }}>
              {profile.weakKnowledge.slice(0, 4).map((item) => (
                <li key={item.name}>
                  {item.name}：{item.weakSignals} 次风险信号
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ marginTop: '8px' }}>暂无明显薄弱点。</p>
          )}
        </div>

        <div style={{ border: '1px solid #d0d0d0', borderRadius: '8px', padding: '12px' }}>
          <h3>稳定优势</h3>
          {profile.strengths.length > 0 ? (
            <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: 1.8 }}>
              {profile.strengths.slice(0, 4).map((item) => (
                <li key={item.name}>
                  {item.name}：{item.count} 次 3 星表现
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ marginTop: '8px' }}>完成更多 3 星关卡后生成。</p>
          )}
        </div>
      </div>

      <div style={{ marginTop: '18px' }}>
        <h3>行动建议</h3>
        <ol style={{ marginTop: '8px', paddingLeft: '22px', lineHeight: 1.8 }}>
          {profile.nextActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ol>
      </div>

      <div style={{ marginTop: '18px' }}>
        <h3>近期学习事件</h3>
        {profile.recentEvents.length > 0 ? (
          <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
            {profile.recentEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 110px 1fr',
                  gap: '8px',
                  alignItems: 'center',
                  borderBottom: '1px solid #ececec',
                  paddingBottom: '8px'
                }}
              >
                <strong>第 {event.levelId} 关</strong>
                <span>{errorTypeLabels[event.errorType] || event.errorType}</span>
                <span>
                  {event.stars} 星；{formatTime(event.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ marginTop: '8px' }}>暂无提交或提示记录。</p>
        )}
      </div>
    </section>
  )
}
