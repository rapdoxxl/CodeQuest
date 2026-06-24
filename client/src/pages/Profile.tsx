import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import LearningAgentPanel from '../components/LearningAgentPanel'
import api from '../services/api'
import { LearningProfile } from '../types'

export default function Profile() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<LearningProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const starBalance = user?.starBalance ?? user?.totalStars ?? 0

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/learning/profile')
        setProfile(res.data)
      } catch {
        setProfile(null)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [])

  return (
    <div style={{ padding: '24px', maxWidth: '980px' }}>
      <Link to="/">返回首页</Link>
      <h1>个人中心</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '18px' }}>
        <div style={{ border: '2px solid #333', borderRadius: '8px', padding: '16px' }}>
          <h2>角色</h2>
          <div style={{ width: '160px', height: '160px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', marginTop: '12px' }}>
            {user?.gender === 'male' ? '男' : '女'}
          </div>
          <p style={{ marginTop: '12px' }}>脸型：{user?.skin.face}</p>
          <p>发型：{user?.skin.hair}</p>
          <p>外套：{user?.skin.coat}</p>
        </div>

        <div style={{ border: '2px solid #333', borderRadius: '8px', padding: '16px' }}>
          <h2>信息</h2>
          <p style={{ marginTop: '12px' }}>用户名：{user?.username}</p>
          <p>性别：{user?.gender === 'male' ? '男' : '女'}</p>
          <p>班级：班级{user?.classId}</p>
          <p>商城星星：{starBalance}</p>
          <p>算法天梯积分：{user?.ladderScore ?? 0}</p>
          <p>天梯通过题数：{user?.ladderSolved ?? 0}</p>
        </div>
      </div>

      <div style={{ marginTop: '18px' }}>
        <LearningAgentPanel profile={profile} loading={profileLoading} />
      </div>
    </div>
  )
}
