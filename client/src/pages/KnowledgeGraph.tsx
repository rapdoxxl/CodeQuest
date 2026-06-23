import { useState, useEffect, useCallback, useRef } from 'react'
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
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotes()
  }, [])

  useEffect(() => {
    const newNodes: Node[] = notes.map((note, index) => ({
      id: note.id.toString(),
      data: { label: note.title },
      position: { x: (index % 5) * 200, y: Math.floor(index / 5) * 150 }
    }))

    const newEdges: Edge[] = notes.flatMap(note =>
      note.links.map(linkedNoteId => ({
        id: `e-${note.id}-${linkedNoteId}`,
        source: note.id.toString(),
        target: linkedNoteId.toString()
      }))
    )

    setNodes(newNodes)
    setEdges(newEdges)
  }, [notes, setNodes, setEdges])

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
      <button onClick={createNote}>新建笔记</button>
      
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
