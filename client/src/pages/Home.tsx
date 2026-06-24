import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import { LearningProfile } from '../types'

export default function Home() {
  const { user, logout } = useAuthStore()
  const [profile, setProfile] = useState<LearningProfile | null>(null)
  const starBalance = user?.starBalance ?? user?.totalStars ?? 0

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const profileRes = await api.get('/learning/profile')
        setProfile(profileRes.data)
      } catch {
        setProfile(null)
      }
    }

    fetchDashboard()
  }, [])

  return (
    <div style={{ padding: '24px' }}>
      <h1>CodeQuest - 编程冒险学院</h1>
      <div>
        <p>欢迎，{user?.username}！</p>
        <p>商城星星：{starBalance} ⭐</p>
        <p>算法天梯积分：{user?.ladderScore ?? 0}</p>
      </div>

      <div style={{ margin: '20px 0', padding: '16px', border: '2px solid #333', maxWidth: '720px' }}>
        <h2>学习智能体画像</h2>
        {profile ? (
          <>
            <p>已通关：{profile.completedCount} 关；3 星掌握：{profile.threeStarCount} 关；学习事件：{profile.attempts} 次</p>
            <p>
              当前建议复习：
              {profile.weakKnowledge.length > 0
                ? profile.weakKnowledge.slice(0, 3).map(item => item.name).join(' / ')
                : '暂无明显薄弱点'}
            </p>
            <p>
              稳定优势：
              {profile.strengths.length > 0
                ? profile.strengths.slice(0, 3).map(item => item.name).join(' / ')
                : '完成更多提交后生成'}
            </p>
            <p><strong>路径推荐：</strong>{profile.recommendation.reason}</p>
            {profile.recommendation.levelId && (
              <Link to={`/level/${profile.recommendation.levelId}`}>
                前往第 {profile.recommendation.levelId} 关：{profile.recommendation.title}
              </Link>
            )}
          </>
        ) : (
          <p>完成一次提交后，学习画像 Agent 会开始记录薄弱知识点和推荐路径。</p>
        )}
      </div>

      <nav style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link to="/map">查看全部关卡</Link>
        <Link to="/knowledge">知识图谱</Link>
        <Link to="/achievements">成就系统</Link>
        <Link to="/shop">商城</Link>
        <Link to="/ladder">算法天梯</Link>
        <Link to="/profile">个人中心</Link>
        <button type="button" onClick={logout}>退出登录</button>
      </nav>
    </div>
  )
}
