import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { Level, Progress } from '../types'

export default function LevelMap() {
  const [levels, setLevels] = useState<Level[]>([])
  const [progress, setProgress] = useState<Progress[]>([])

  useEffect(() => {
    fetchLevels()
    fetchProgress()
  }, [])

  const fetchLevels = async () => {
    const res = await api.get('/levels')
    setLevels(res.data)
  }

  const fetchProgress = async () => {
    const res = await api.get('/progress')
    setProgress(res.data)
  }

  const getProgress = (levelId: number) => {
    return progress.find(p => p.levelId === levelId)
  }

  const chapterConfig = [
    { id: 'java-basic', name: 'Java 入门篇' },
    { id: 'java-advanced', name: 'Java 进阶篇' }
  ]
  const chapters = chapterConfig.map(chapter => ({
    ...chapter,
    levels: levels.filter(l => l.chapter === chapter.id)
  }))
  const recommendedLevel = [...levels]
    .sort((a, b) => a.id - b.id)
    .find(level => {
      const p = getProgress(level.id)
      const completed = p?.completed ?? level.completed ?? false
      return !level.locked && !completed
    })

  return (
    <div style={{ padding: '24px' }}>
      <h1>关卡地图</h1>
      <Link to="/">返回首页</Link>
      <div style={{ margin: '16px 0', padding: '12px', border: '2px solid #333', maxWidth: '520px' }}>
        <strong>推荐继续：</strong>
        {recommendedLevel ? (
          <Link to={`/level/${recommendedLevel.id}`} style={{ marginLeft: '8px' }}>
            第 {recommendedLevel.id} 关：{recommendedLevel.title}
          </Link>
        ) : (
          <span style={{ marginLeft: '8px' }}>当前已没有已解锁且未完成的关卡</span>
        )}
      </div>
      
      {chapters.map(chapter => (
        <div key={chapter.id} style={{ marginBottom: '24px' }}>
          <h2>{chapter.name}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {chapter.levels.map(level => {
              const p = getProgress(level.id)
              const locked = level.locked ?? false
              const stars = p?.stars ?? level.stars ?? 0
              const cardStyle = {
                border: '1px solid #000',
                padding: '10px',
                width: '180px',
                minHeight: '112px',
                textDecoration: 'none',
                color: locked ? '#777' : '#000',
                background: locked ? '#f2f2f2' : '#fff',
                opacity: locked ? 0.72 : 1
              }
              const content = (
                <>
                  <div>第 {level.number} 关</div>
                  <div style={{ fontWeight: 'bold', margin: '6px 0' }}>{level.title}</div>
                  <div>{level.draft ? '规划中' : locked ? '未解锁' : stars > 0 ? `⭐`.repeat(stars) : '未完成'}</div>
                  {level.hintUsed && <div style={{ color: '#b26a00', marginTop: '6px' }}>已使用提示</div>}
                </>
              )

              return locked ? (
                <div key={level.id} style={cardStyle}>
                  {content}
                </div>
              ) : (
                <Link key={level.id} to={`/level/${level.id}`} style={cardStyle}>
                  {content}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
