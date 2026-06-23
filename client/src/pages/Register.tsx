import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [classId, setClassId] = useState(1)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post('/auth/register', { username, password, gender, classId })
      login(res.data.token, res.data.user)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败')
    }
  }

  return (
    <div>
      <h1>注册 - CodeQuest</h1>
      <form onSubmit={handleSubmit}>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div>
          <label>用户名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label>性别</label>
          <select value={gender} onChange={(e) => setGender(e.target.value as any)}>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>
        <div>
          <label>班级</label>
          <select value={classId} onChange={(e) => setClassId(Number(e.target.value))}>
            <option value={1}>班级1</option>
            <option value={2}>班级2</option>
            <option value={3}>班级3</option>
          </select>
        </div>
        <button type="submit">注册</button>
      </form>
      <p>
        已有账号？ <button onClick={() => navigate('/login')}>去登录</button>
      </p>
    </div>
  )
}
