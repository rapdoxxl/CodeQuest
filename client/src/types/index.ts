export interface Level {
  id: number
  chapter: string
  number: number
  title: string
  content: string
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  answer?: string
  goal?: string
  starterCode?: string
  knowledgePoints?: string[]
  language?: string
  className?: string
  expectedOutput?: string
  locked?: boolean
  completed?: boolean
  stars?: number
  hintUsed?: boolean
  hintLevel?: number
  draft?: boolean
}

export interface Progress {
  userId: number
  levelId: number
  stars: number
  score: number
  completed: boolean
  hintUsed?: boolean
  hintLevel?: number
}

export interface CoachFeedback {
  errorType: string
  diagnosis: {
    title: string
    details: string[]
  }
  socraticQuestions: string[]
  nextStep: string
  summary: {
    mastered: string[]
    keepPracticing: string
  }
  hintPolicy: {
    hintLevel: number
    maxStars: number
  }
}

export interface LearningProfile {
  completedCount: number
  threeStarCount: number
  openLevelCount: number
  completionRate: number
  masteryRate: number
  riskLevel: 'low' | 'medium' | 'high'
  agentSummary: string
  nextActions: string[]
  attempts: number
  weakKnowledge: Array<{
    name: string
    attempts: number
    weakSignals: number
    lastErrorType: string
    lastAt: string
  }>
  strengths: Array<{
    name: string
    count: number
  }>
  recommendation: {
    type: string
    levelId: number | null
    title: string
    reason: string
  }
  recentEvents: Array<{
    id: number
    levelId: number
    stars: number
    passed: boolean
    errorType: string
    hintLevel: number
    knowledgePoints: string[]
    createdAt: string
  }>
}

export interface Note {
  id: number
  userId: number
  levelId: number | null
  title: string
  content: string
  tags: string[]
  links: number[]
  createdAt: string
  updatedAt: string
}

export interface Skin {
  id: number
  name: string
  type: 'face' | 'hair' | 'coat'
  price: number
  image: string
}

export interface UserSkin {
  id: number
  userId: number
  skinId: number
}

export interface Class {
  id: number
  name: string
}
