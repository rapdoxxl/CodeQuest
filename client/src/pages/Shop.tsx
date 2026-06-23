import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { Skin } from '../types'
import { useAuthStore } from '../store/authStore'

export default function Shop() {
  const [skins, setSkins] = useState<Skin[]>([])
  const [ownedSkins, setOwnedSkins] = useState<number[]>([])
  const { user, updateUser } = useAuthStore()
  const starBalance = user?.starBalance ?? user?.totalStars ?? 0

  useEffect(() => {
    fetchSkins()
    fetchOwnedSkins()
  }, [])

  const fetchSkins = async () => {
    const res = await api.get('/shop/skins')
    setSkins(res.data)
  }

  const fetchOwnedSkins = async () => {
    const res = await api.get('/shop/owned')
    setOwnedSkins(res.data.map((s: any) => s.skinId))
  }

  const buySkin = async (skin: Skin) => {
    if (!user || starBalance < skin.price) {
      alert('星星不足！')
      return
    }
    try {
      const res = await api.post(`/shop/buy/${skin.id}`)
      updateUser(res.data.user)
      fetchOwnedSkins()
      alert('购买成功！')
    } catch (err) {
      alert('购买失败')
    }
  }

  const equipSkin = async (skin: Skin) => {
    try {
      const res = await api.post(`/shop/equip/${skin.id}`)
      updateUser(res.data.user)
      alert('装备成功！')
    } catch (err) {
      alert('装备失败')
    }
  }

  const skinTypes = ['face', 'hair', 'coat']
  const skinTypeNames = { face: '脸型', hair: '发型', coat: '外套' }

  return (
    <div>
      <Link to="/">返回首页</Link>
      <h1>星星商城</h1>
      <p>商城星星：{starBalance} ⭐</p>
      
      {skinTypes.map(type => (
        <div key={type}>
          <h2>{skinTypeNames[type as keyof typeof skinTypeNames]}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {skins.filter(s => s.type === type).map(skin => (
              <div key={skin.id} style={{ border: '1px solid #000', padding: '10px', width: '150px' }}>
                <div style={{ width: '100px', height: '100px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {skin.name}
                </div>
                <p>{skin.name}</p>
                <p>价格：{skin.price} ⭐</p>
                {ownedSkins.includes(skin.id) ? (
                  <div>
                    <span style={{ color: 'green' }}>已拥有</span>
                    <button onClick={() => equipSkin(skin)}>装备</button>
                  </div>
                ) : (
                  <button onClick={() => buySkin(skin)}>购买</button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
