import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Node,
  Edge,
  Connection
} from 'reactflow'
import 'reactflow/dist/style.css'
import api from '../services/api'
import { Note } from '../types'

export default function KnowledgeGraph() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const filteredNotes = useMemo(() => {
    if (activeFilter === 'all') return notes
    if (activeFilter === 'manual') {
      return notes.filter(note => !note.tags.includes('AI导学') && !note.tags.includes('AI复盘'))
    }

    return notes.filter(note => note.tags.includes(activeFilter))
  }, [activeFilter, notes])

  const filterOptions = [
    { id: 'all', label: '全部', count: notes.length },
    { id: 'AI导学', label: 'AI 导学', count: notes.filter(note => note.tags.includes('AI导学')).length },
    { id: 'AI复盘', label: 'AI 复盘', count: notes.filter(note => note.tags.includes('AI复盘')).length },
    {
      id: 'manual',
      label: '手动笔记',
      count: notes.filter(note => !note.tags.includes('AI导学') && !note.tags.includes('AI复盘')).length
    }
  ]

  useEffect(() => {
    fetchNotes()
  }, [])

  useEffect(() => {
    const visibleNoteIds = new Set(filteredNotes.map(note => note.id))
    const newNodes: Node[] = filteredNotes.map((note, index) => ({
      id: note.id.toString(),
      data: { label: note.title },
      position: { x: (index % 5) * 200, y: Math.floor(index / 5) * 150 }
    }))

    const newEdges: Edge[] = filteredNotes.flatMap(note =>
      note.links
        .filter(linkedNoteId => visibleNoteIds.has(linkedNoteId))
        .map(linkedNoteId => ({
          id: `e-${note.id}-${linkedNoteId}`,
          source: note.id.toString(),
          target: linkedNoteId.toString()
        }))
    )

    setNodes(newNodes)
    setEdges(newEdges)
  }, [filteredNotes, setNodes, setEdges])

  useEffect(() => {
    if (selectedNote && !filteredNotes.some(note => note.id === selectedNote.id)) {
      setSelectedNote(null)
    }
  }, [filteredNotes, selectedNote])

  const fetchNotes = async () => {
    const res = await api.get('/notes')
    setNotes(res.data)
  }

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = (_: any, node: Node) => {
    const note = notes.find(n => n.id === Number(node.id))
    setSelectedNote(note || null)
  }

  const createNote = async () => {
    const title = prompt('笔记标题：')
    if (!title) return
    const content = prompt('笔记内容：')
    if (!content) return
    try {
      await api.post('/notes', { title, content, tags: [], links: [] })
      fetchNotes()
    } catch (err) {
      alert('创建失败')
    }
  }

  const deleteNote = async (noteId: number) => {
    if (!confirm('确定删除？')) return
    try {
      await api.delete(`/notes/${noteId}`)
      setSelectedNote(null)
      fetchNotes()
    } catch (err) {
      alert('删除失败')
    }
  }

  return (
    <div>
      <Link to="/">返回首页</Link>
      <h1>知识图谱</h1>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', margin: '12px 0' }}>
        <button onClick={createNote}>新建笔记</button>
        {filterOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setActiveFilter(option.id)}
            style={{
              fontWeight: activeFilter === option.id ? 700 : 400,
              border: activeFilter === option.id ? '2px solid #333' : '1px solid #aaa',
              background: activeFilter === option.id ? '#eef4ff' : '#fff'
            }}
          >
            {option.label} ({option.count})
          </button>
        ))}
      </div>
      <p style={{ marginBottom: '12px' }}>
        当前显示 {filteredNotes.length} 条笔记。AI 导学和 AI 复盘会自动带标签，便于展示智能体如何沉淀学习资产。
      </p>
      
      <div style={{ display: 'flex', height: '80vh' }}>
        <div ref={reactFlowWrapper} style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
        
        <div style={{ width: '400px', padding: '20px', borderLeft: '1px solid #ccc' }}>
          {selectedNote ? (
            <div>
              <h2>{selectedNote.title}</h2>
              <p>{selectedNote.content}</p>
              <p>标签：{selectedNote.tags.join(', ')}</p>
              <p>创建时间：{new Date(selectedNote.createdAt).toLocaleString()}</p>
              <button onClick={() => deleteNote(selectedNote.id)}>删除</button>
            </div>
          ) : (
            <p>点击节点查看笔记详情</p>
          )}
        </div>
      </div>
    </div>
  )
}
