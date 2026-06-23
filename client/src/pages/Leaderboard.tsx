import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function Leaderboard() {
  const [classRank, setClassRank] = useState<any[]>([])
  const [schoolRank, setSchoolRank] = useState<any[]>([])

  useEffect(() => {
    fetchRankings()
  }, [])

  const fetchRankings = async () => {
    const [classRes, schoolRes] = await Promise.all([
      api.get('/leaderboard/class'),
      api.get('/leaderboard/school')
    ])
    setClassRank(classRes.data)
    setSchoolRank(schoolRes.data)
  }

  return (
    <div>
      <Link to="/">返回首页</Link>
      <h1>算法天梯</h1>
      <p>题库与复杂度评分沙箱准备中，当前榜单预留展示位。</p>
      
      <div style={{ display: 'flex', gap: '40px' }}>
        <div style={{ flex: 1 }}>
          <h2>班级天梯榜</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>排名</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>装扮</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>用户名</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>天梯分</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>通过题数</th>
              </tr>
            </thead>
            <tbody>
              {classRank.map((user, index) => (
                <tr key={user.id}>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                    {index + 1}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    {user.skin?.face} / {user.skin?.hair} / {user.skin?.coat}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.username}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                    {user.ladderScore ?? 0}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                    {user.ladderSolved ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ flex: 1 }}>
          <h2>全校天梯榜</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>排名</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>装扮</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>用户名</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>班级</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>天梯分</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>通过题数</th>
              </tr>
            </thead>
            <tbody>
              {schoolRank.map((user, index) => (
                <tr key={user.id}>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                    {index + 1}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    {user.skin?.face} / {user.skin?.hair} / {user.skin?.coat}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.username}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                    {user.className}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                    {user.ladderScore ?? 0}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                    {user.ladderSolved ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
