import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import { Achievement, CoachFeedback, Level as LevelType } from '../types'
import { useAuthStore } from '../store/authStore'

type HintItem = {
  stage: number
  stageName: string
  hint: string
  maxStars: number
  hintLevel: number
  hintUsed: boolean
}

type SubmitResult = {
  stars: number
  passed: boolean
  message?: string
  maxStars?: number
  hintUsed?: boolean
  hintLevel?: number
  compileOutput?: string
  runtimeOutput?: string
  actualOutput?: string
  achievements?: Achievement[]
  coach?: CoachFeedback
}

export default function Level() {
  const { id } = useParams<{ id: string }>()
  const [level, setLevel] = useState<LevelType | null>(null)
  const [answer, setAnswer] = useState('')
  const [hints, setHints] = useState<HintItem[]>([])
  const [aiHelp, setAiHelp] = useState('')
  const [aiHelpLoading, setAiHelpLoading] = useState(false)
  const [lockedMessage, setLockedMessage] = useState('')
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [loading, setLoading] = useState(false)
  const updateUser = useAuthStore((state) => state.updateUser)

  const formatErrorBlock = (text?: string) => {
    if (!text) return ''

    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 4)
      .join('\n')
  }

  useEffect(() => {
    if (!id) return

    setLevel(null)
    setAnswer('')
    setHints([])
    setAiHelp('')
    setAiHelpLoading(false)
    setLockedMessage('')
    setResult(null)
    setLoading(false)
    fetchLevel(id)
  }, [id])

  const fetchLevel = async (levelId: string) => {
    try {
      const res = await api.get(`/levels/${levelId}`)
      setLevel(res.data)
      setHints([])
      setAiHelp('')
      setLockedMessage('')
      setAnswer(res.data.starterCode || '')
    } catch (err: any) {
      setLevel(null)
      setAnswer('')
      setResult(null)
      setLockedMessage(err.response?.data?.message || '当前关卡暂未解锁')
    }
  }

  const handleSubmit = async () => {
    if (!level) return
    setLoading(true)
    try {
      const res = await api.post(`/levels/${level.id}/submit`, { answer })
      setResult(res.data)
      setLevel({
        ...level,
        completed: level.completed || res.data.passed,
        stars: Math.max(level.stars || 0, res.data.stars || 0),
        hintUsed: res.data.hintUsed,
        hintLevel: res.data.hintLevel
      })
      if (res.data.user) {
        updateUser(res.data.user)
      }
    } catch (err: any) {
      alert(err.response?.data?.message || '提交失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAiHelp = async () => {
    if (!level) return

    setAiHelpLoading(true)
    try {
      const res = await api.post('/ai/help', { levelId: level.id })
      setAiHelp(res.data.help)
    } catch (err) {
      alert('AI 导学暂时不可用')
    } finally {
      setAiHelpLoading(false)
    }
  }

  const saveAiHelpAsNote = async () => {
    if (!level || !aiHelp) return

    const title = `第${level.number}关 AI 导学：${level.title}`
    const content = [
      aiHelp,
      '',
      `关卡目标：${level.goal || '完成本关核心任务'}`
    ].join('\n')
    const tags = ['AI导学', ...(level.knowledgePoints || []).slice(0, 3)]

    try {
      await api.post('/notes', { title, content, levelId: level.id, tags, links: [] })
      alert('AI 导学已保存到知识图谱！')
    } catch (err) {
      alert('保存 AI 导学失败')
    }
  }

  const handleHint = async (stage: number) => {
    if (!level) return

    const confirmText =
      stage === 1
        ? '方向提示只做思路引导，不会降低本关最高星级。确定查看吗？'
        : stage === 2
          ? '关键概念提示会让本关最高只能获得 2 星。确定查看吗？'
          : '局部代码提示更接近答案，本关最高只能获得 1 星。确定查看吗？'
    const confirmed = window.confirm(confirmText)
    if (!confirmed) return

    try {
      const res = await api.post(`/levels/${level.id}/hint`, { stage })
      setHints((prev) => {
        const next = prev.filter((item) => item.stage !== res.data.stage)
        return [...next, res.data].sort((a, b) => a.stage - b.stage)
      })
      setLevel({ ...level, hintUsed: true, hintLevel: res.data.hintLevel })
    } catch (err) {
      alert('提示暂时不可用')
    }
  }

  const addNote = async () => {
    const title = prompt('笔记标题：')
    if (!title) return
    const content = prompt('笔记内容：')
    if (!content) return
    try {
      await api.post('/notes', { title, content, levelId: level?.id, tags: [] })
      alert('笔记保存成功！')
    } catch (err) {
      alert('保存失败')
    }
  }

  const saveCoachAsNote = async () => {
    if (!level || !result?.coach) return

    const coach = result.coach
    const title = `第${level.number}关 AI 复盘：${level.title}`
    const content = [
      `结果：${result.passed ? '通过' : '未通过'}，获得 ${result.stars} 星。`,
      '',
      `诊断：${coach.diagnosis.title}`,
      ...coach.diagnosis.details.map((item) => `- ${item}`),
      '',
      '引导问题：',
      ...coach.socraticQuestions.map((question, index) => `${index + 1}. ${question}`),
      '',
      `下一步：${coach.nextStep}`,
      '',
      coach.summary.mastered.length > 0
        ? `已掌握：${coach.summary.mastered.join(' / ')}`
        : '已掌握：暂未形成稳定掌握点',
      coach.summary.keepPracticing
    ].join('\n')
    const tags = ['AI复盘', ...(level.knowledgePoints || []).slice(0, 3)]

    try {
      await api.post('/notes', { title, content, levelId: level.id, tags, links: [] })
      alert('AI 复盘已保存到知识图谱！')
    } catch (err) {
      alert('保存 AI 复盘失败')
    }
  }

  const renderCoach = () => {
    if (!result?.coach) {
      return (
        <div style={{ border: '2px solid #333', padding: '16px', marginTop: '16px' }}>
          <h3>AI 辅导区</h3>
          <p>先写一版能运行的代码，提交后我会告诉你：哪里对了、哪里卡住、下一步先改哪一行。</p>
          <p>没思路时先点方向提示。它只帮你把题拆开，不会直接把答案塞给你，也不会扣星。</p>
        </div>
      )
    }

    const coach = result.coach

    return (
      <div style={{ border: '2px solid #333', padding: '16px', marginTop: '16px' }}>
        <h3>AI 辅导区</h3>
        <h4>这次卡在哪里：{coach.diagnosis.title}</h4>
        <ul>
          {coach.diagnosis.details.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>

        <h4>我会这样追问你</h4>
        <ol>
          {coach.socraticQuestions.map((question, index) => (
            <li key={index}>{question}</li>
          ))}
        </ol>
        <p><strong>下一步怎么做：</strong>{coach.nextStep}</p>

        <h4>这关小结</h4>
        {coach.summary.mastered.length > 0 && (
          <p>本关已掌握：{coach.summary.mastered.join(' / ')}</p>
        )}
        <p>{coach.summary.keepPracticing}</p>
        <button type="button" onClick={saveCoachAsNote}>
          保存复盘到知识图谱
        </button>
      </div>
    )
  }

  if (lockedMessage) {
    return (
      <div style={{ padding: '24px' }}>
        <Link to="/map">返回地图</Link>
        <h1>关卡未解锁</h1>
        <p>{lockedMessage}</p>
      </div>
    )
  }

  if (!level) return <div>加载中...</div>

  const currentHintLevel = level.hintLevel || 0
  const currentMaxStars = currentHintLevel >= 3 ? 1 : currentHintLevel >= 2 ? 2 : 3

  return (
    <div style={{ padding: '24px', maxWidth: '980px' }}>
      <nav style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link to="/map">返回地图</Link>
        <Link to="/achievements">成就系统</Link>
      </nav>
      <h1>第{level.number}关：{level.title}</h1>
      <p>难度：{level.difficulty === 'easy' ? '简单' : level.difficulty === 'medium' ? '中等' : '困难'}</p>
      {level.goal && (
        <div>
          <h3>学习目标</h3>
          <p>{level.goal}</p>
        </div>
      )}
      <div>
        <h3>关卡说明</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{level.content}</p>
      </div>
      {level.knowledgePoints && level.knowledgePoints.length > 0 && (
        <div>
          <h3>知识点</h3>
          <p>{level.knowledgePoints.join(' / ')}</p>
        </div>
      )}
      <div>
        <h3>题目</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{level.question}</p>
      </div>
      {level.starterCode && (
        <div>
          <h3>代码模板</h3>
          <pre style={{ background: '#f5f5f5', padding: '12px', whiteSpace: 'pre-wrap' }}>
            {level.starterCode}
          </pre>
        </div>
      )}

      <div style={{ border: '2px solid #333', padding: '12px', margin: '12px 0' }}>
        <h3>课前 AI 导学</h3>
        <p>还没开始写也可以先问我，我会先帮你拆题，不会直接给答案，也不会影响本关星级。</p>
        <button type="button" onClick={handleAiHelp} disabled={aiHelpLoading}>
          {aiHelpLoading ? '正在想...' : '问 AI 导师'}
        </button>
        {aiHelp && (
          <div>
            <pre style={{ background: '#f5f5f5', padding: '12px', marginTop: '12px', whiteSpace: 'pre-wrap' }}>
              {aiHelp}
            </pre>
            <button type="button" onClick={saveAiHelpAsNote}>
              保存导学到知识图谱
            </button>
          </div>
        )}
      </div>

      {currentHintLevel > 0 && (
        <p style={{ color: '#b26a00' }}>
          已查看到第 {currentHintLevel} 段提示，本关当前最高可获得 {currentMaxStars} 星。
        </p>
      )}
      {hints.length > 0 && (
        <div style={{ border: '1px solid #999', padding: '12px', margin: '12px 0' }}>
          <h3>分层提示</h3>
          {hints.map((item) => (
            <div key={item.stage} style={{ marginBottom: '10px' }}>
              <strong>{item.stageName}</strong>
              <p>{item.hint}</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3>提交代码</h3>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="输入你的代码或答案"
          rows={14}
          style={{ width: '100%', fontFamily: 'Consolas, monospace' }}
        />
        <br />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? '提交中...' : '提交答案'}
          </button>
          <button onClick={() => handleHint(1)}>方向提示</button>
          <button onClick={() => handleHint(2)}>关键概念提示</button>
          <button onClick={() => handleHint(3)}>局部代码提示</button>
          <button onClick={addNote}>记笔记</button>
        </div>
      </div>

      {result && (
        <div style={{ marginTop: '16px' }}>
          <h3>结果</h3>
          <p>{result.passed ? '通过' : '未通过'}</p>
          <p>获得商城星星：{'⭐'.repeat(result.stars)}{'☆'.repeat(3 - result.stars)}</p>
          {(result.hintUsed || (result.maxStars ?? 3) !== 3) && (
            <p>提示等级：{result.hintLevel || 0}，本次最高奖励为 {result.maxStars ?? 3} 星。</p>
          )}
          {result.message && <p>{result.message}</p>}
          {result.achievements && result.achievements.length > 0 && (
            <div style={{ border: '1px solid #333', padding: '12px', margin: '12px 0' }}>
              <h4>刚解锁的成就</h4>
              <ul>
                {result.achievements.map((achievement) => (
                  <li key={achievement.key}>{achievement.name}：{achievement.description}</li>
                ))}
              </ul>
              <Link to="/achievements">查看成就系统</Link>
            </div>
          )}
          {result.actualOutput && (
            <div>
              <h4>程序实际输出</h4>
              <pre style={{ background: '#f5f5f5', padding: '12px', whiteSpace: 'pre-wrap' }}>
                {result.actualOutput}
              </pre>
            </div>
          )}
          {result.compileOutput && (
            <div>
              <h4>编译提示</h4>
              <pre style={{ background: '#fff1f0', padding: '12px', whiteSpace: 'pre-wrap' }}>
                {formatErrorBlock(result.compileOutput)}
              </pre>
            </div>
          )}
          {result.runtimeOutput && (
            <div>
              <h4>运行提示</h4>
              <pre style={{ background: '#fff7e6', padding: '12px', whiteSpace: 'pre-wrap' }}>
                {formatErrorBlock(result.runtimeOutput)}
              </pre>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => { setResult(null); setAnswer(level.starterCode || '') }}>重置模板</button>
            {result.passed && level.id < 50 && (
              <Link to={`/level/${level.id + 1}`}>进入下一关</Link>
            )}
            <Link to="/map">返回地图</Link>
          </div>
        </div>
      )}

      {renderCoach()}
    </div>
  )
}
