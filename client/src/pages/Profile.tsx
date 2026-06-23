import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Profile() {
  const { user } = useAuthStore()
  const starBalance = user?.starBalance ?? user?.totalStars ?? 0

  return (
    <div>
      <Link to="/">返回首页</Link>
      <h1>个人中心</h1>
      
      <div>
        <h2>角色</h2>
        <div style={{ width: '200px', height: '200px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {user?.gender === 'male' ? '👨' : '👩'}
        </div>
        <p>脸型：{user?.skin.face}</p>
        <p>发型：{user?.skin.hair}</p>
        <p>外套：{user?.skin.coat}</p>
      </div>
      
      <div>
        <h2>信息</h2>
        <p>用户名：{user?.username}</p>
        <p>性别：{user?.gender === 'male' ? '男' : '女'}</p>
        <p>班级：班级{user?.classId}</p>
        <p>商城星星：{starBalance} ⭐</p>
        <p>算法天梯积分：{user?.ladderScore ?? 0}</p>
        <p>天梯通过题数：{user?.ladderSolved ?? 0}</p>
      </div>
    </div>
  )
}
