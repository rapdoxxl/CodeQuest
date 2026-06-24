import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { AchievementSummary } from '../types'

const categoryLabels = {
  mainline: '主线通关',
  mastery: '掌握表现',
  agent: '学习智能体'
}

const formatDate = (value: string | null) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function Achievements() {
  const [summary, setSummary] = useState<AchievementSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await api.get('/achievements')
        setSummary(res.data)
      } catch {
        setSummary(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAchievements()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <Link to="/">返回首页</Link>
        <h1>成就系统</h1>
        <p>正在读取成就...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '980px' }}>
      <Link to="/">返回首页</Link>
      <h1>成就系统</h1>
      <p style={{ marginTop: '8px' }}>
        已解锁 {summary?.unlockedCount ?? 0} / {summary?.totalCount ?? 0} 个成就。
      </p>

      {!summary ? (
        <p style={{ marginTop: '16px' }}>成就数据暂时读取失败，请稍后再试。</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginTop: '18px' }}>
          {summary.achievements.map((achievement) => (
            <article
              key={achievement.key}
              style={{
                border: '2px solid #333',
                borderRadius: '8px',
                padding: '14px',
                background: achievement.unlocked ? '#fff' : '#f4f4f4',
                opacity: achievement.unlocked ? 1 : 0.72
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <strong>{achievement.name}</strong>
                <span>{achievement.unlocked ? '已解锁' : '未解锁'}</span>
              </div>
              <p style={{ marginTop: '8px', lineHeight: 1.6 }}>{achievement.description}</p>
              <p style={{ marginTop: '8px' }}>
                分类：{categoryLabels[achievement.category] || achievement.category}
              </p>
              {achievement.unlockedAt && (
                <p style={{ marginTop: '4px' }}>解锁时间：{formatDate(achievement.unlockedAt)}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
