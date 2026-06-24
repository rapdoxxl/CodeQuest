import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const fillDemoAccount = () => {
    setUsername('demo')
    setPassword('123456')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post('/auth/login', { username, password })
      login(res.data.token, res.data.user)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败')
    }
  }

  return (
    <div>
      <h1>登录 - CodeQuest</h1>
      <form onSubmit={handleSubmit}>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div style={{ border: '1px solid #333', padding: '12px', marginBottom: '12px', maxWidth: '360px' }}>
          <strong>演示账号</strong>
          <p style={{ marginTop: '6px' }}>用户名：demo；密码：123456</p>
          <button type="button" onClick={fillDemoAccount}>填入演示账号</button>
        </div>
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
        <button type="submit">登录</button>
      </form>
      <p>
        还没账号？ <button onClick={() => navigate('/register')}>去注册</button>
      </p>
    </div>
  )
}
