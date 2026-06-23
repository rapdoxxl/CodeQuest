import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { parse } from 'java-parser'
import os from 'os'
import path from 'path'
import { execFile } from 'child_process'
import { existsSync, readdirSync } from 'fs'
import { mkdtemp, rm, writeFile } from 'fs/promises'
import db from './db.js'

const app = express()
const PORT = 5000
const JWT_SECRET = 'codequest-secret-key-2024'

const pathSegments = String(process.env.PATH || '')
  .split(';')
  .map((item) => item.trim())
  .filter(Boolean)

const resolveJavaBinary = (binaryName) => {
  const javaHome = process.env.JAVA_HOME
  if (javaHome) {
    const javaHomeBinary = path.join(javaHome, 'bin', `${binaryName}.exe`)
    if (existsSync(javaHomeBinary)) {
      return javaHomeBinary
    }
  }

  const findJavaBinaryInRoot = (root, maxDepth = 2) => {
    if (!existsSync(root)) return null

    const queue = [{ dir: root, depth: 0 }]
    while (queue.length > 0) {
      const { dir, depth } = queue.shift()
      const binary = path.join(dir, 'bin', `${binaryName}.exe`)
      if (existsSync(binary)) {
        return binary
      }

      if (depth >= maxDepth) continue

      let entries = []
      try {
        entries = readdirSync(dir, { withFileTypes: true })
      } catch {
        continue
      }

      entries
        .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
        .sort((a, b) => {
          const aLatest = a.name.toLowerCase().includes('latest') ? 1 : 0
          const bLatest = b.name.toLowerCase().includes('latest') ? 1 : 0
          if (aLatest !== bLatest) return bLatest - aLatest
          return b.name.localeCompare(a.name, undefined, { numeric: true })
        })
        .forEach((entry) => queue.push({ dir: path.join(dir, entry.name), depth: depth + 1 }))
    }

    return null
  }

  const commonJavaRoots = [
    'C:\\Program Files\\Java',
    'D:\\Program Files\\Java',
    'C:\\Program Files\\Eclipse Adoptium',
    'D:\\Program Files\\Eclipse Adoptium'
  ]

  for (const root of commonJavaRoots) {
    const binary = findJavaBinaryInRoot(root)
    if (binary) {
      return binary
    }
  }

  const oracleJavaRoot = 'C:\\Program Files\\Common Files\\Oracle\\Java'
  if (existsSync(oracleJavaRoot)) {
    const targetDir = readdirSync(oracleJavaRoot)
      .find((item) => item.startsWith('javapath_target_'))

    if (targetDir) {
      const resolvedBinary = path.join(oracleJavaRoot, targetDir, `${binaryName}.exe`)
      if (existsSync(resolvedBinary)) {
        return resolvedBinary
      }
    }
  }

  const jdkBin = pathSegments.find(
    (item) => /\\java\\jdk/i.test(item) && !/javapath/i.test(item)
  )

  if (jdkBin) {
    const resolvedBinary = path.join(jdkBin, `${binaryName}.exe`)
    if (existsSync(resolvedBinary)) {
      return resolvedBinary
    }
  }

  return `${binaryName}.exe`
}

const JAVA_BINARIES = {
  javac: resolveJavaBinary('javac'),
  java: resolveJavaBinary('java')
}

app.use(cors())
app.use(express.json())

const normalizeAnswer = (value = '') =>
  value.toLowerCase().replace(/\s+/g, '').replace(/[;{}()"']/g, '')

const normalizeOutputWhitespace = (value = '') =>
  String(value).replace(/\s+/g, '')

const normalizeOutputLoose = (value = '') =>
  normalizeOutputWhitespace(value).toLowerCase()

const calculateEditDistance = (left = '', right = '') => {
  const a = String(left)
  const b = String(right)
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  const current = Array.from({ length: b.length + 1 }, () => 0)

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost
      )
    }

    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j]
    }
  }

  return previous[b.length]
}

const isTextOutput = (value = '') => /[a-zA-Z\u4e00-\u9fa5]/.test(String(value))

const gradeJavaOutput = (actualOutput = '', expectedOutput = '') => {
  if (actualOutput === expectedOutput) {
    return {
      isCorrect: true,
      stars: 3,
      message: '代码编译并运行成功，输出正确。'
    }
  }

  if (normalizeOutputWhitespace(actualOutput) === normalizeOutputWhitespace(expectedOutput)) {
    return {
      isCorrect: true,
      stars: 2,
      message: '代码已经能正确运行，核心输出正确，但空格或换行格式还不够规范。'
    }
  }

  if (normalizeOutputLoose(actualOutput) === normalizeOutputLoose(expectedOutput)) {
    return {
      isCorrect: true,
      stars: 2,
      message: '代码已经能正确运行，核心输出正确，但大小写或空白格式还需要调整。'
    }
  }

  const normalizedActual = String(actualOutput).trim().toLowerCase()
  const normalizedExpected = String(expectedOutput).trim().toLowerCase()
  const expectedLength = normalizedExpected.length
  const editDistance = calculateEditDistance(normalizedActual, normalizedExpected)
  const maxMinorDistance = Math.max(1, Math.floor(expectedLength * 0.2))

  if (
    expectedLength >= 6 &&
    isTextOutput(expectedOutput) &&
    editDistance <= maxMinorDistance
  ) {
    return {
      isCorrect: true,
      stars: 1,
      message: '代码已经能正确运行，输出和要求很接近，但还有少量字符、标点或大小写差异。'
    }
  }

  return {
    isCorrect: false,
    stars: 0,
    message: '代码可以运行，但输出内容和题目要求不一致，还不能通过本关。'
  }
}

const gradeJavaStaticFallback = (level, answer) => {
  const keywords = Array.isArray(level.answerKeywords) ? level.answerKeywords : []
  if (keywords.length === 0) {
    return {
      isCorrect: false,
      stars: 0,
      message: '当前环境无法调用 JDK 编译器，且本关缺少静态校验规则，暂时不能通过。'
    }
  }

  const normalizedInput = normalizeAnswer(answer)
  const matchedCount = keywords.filter((keyword) =>
    normalizedInput.includes(normalizeAnswer(keyword))
  ).length

  if (matchedCount === keywords.length) {
    return {
      isCorrect: true,
      stars: 2,
      message: '当前环境无法调用 JDK 编译器，已按 Java 语法和关键结构静态校验通过；由于未实际运行，最高获得 2 星。'
    }
  }

  const passThreshold = Math.max(1, Math.ceil(keywords.length * 0.75))
  if (matchedCount >= passThreshold) {
    return {
      isCorrect: true,
      stars: 1,
      message: '当前环境无法调用 JDK 编译器，代码语法可解析，关键结构大部分正确，但还需要补齐细节。'
    }
  }

  return {
    isCorrect: false,
    stars: 0,
    message: '当前环境无法调用 JDK 编译器，静态检查也未能确认关键结构完整。'
  }
}

const extractPrintedStringLiteral = (answer = '') => {
  const match = String(answer).match(/System\s*\.\s*out\s*\.\s*println\s*\(\s*"([^"]*)"\s*\)/)
  return match ? match[1] : null
}

const tokenToChinese = (token = '') => {
  const cleaned = String(token).trim()
  const tokenMap = {
    ';': '分号 `;`',
    ')': '右括号 `)`',
    '(': '左括号 `(`',
    '}': '右花括号 `}`',
    '{': '左花括号 `{`',
    ']': '右中括号 `]`',
    '[': '左中括号 `[`',
    String: '`String`',
    public: '`public`',
    class: '`class`',
    system: '`System`',
    System: '`System`'
  }

  return tokenMap[cleaned] || `\`${cleaned}\``
}

const summarizeJavaError = (rawMessage = '') => {
  const normalized = String(rawMessage).replace(/\r\n/g, '\n').trim()
  if (!normalized) {
    return '语法检查失败，请检查代码格式。'
  }

  const positionMatch = normalized.match(/line:\s*(\d+),\s*column:\s*(\d+)/i)
  const expectMatch = normalized.match(/Expecting\s*-->\s*'([^']*)'\s*<--\s*but found\s*-->\s*'([^']*)'/i)

  const hints = []
  if (positionMatch) {
    hints.push(`第 ${positionMatch[1]} 行第 ${positionMatch[2]} 列附近有语法问题。`)
  } else {
    hints.push('代码里有语法问题。')
  }

  if (expectMatch) {
    const expected = tokenToChinese(expectMatch[1])
    const actual = tokenToChinese(expectMatch[2])
    hints.push(`这里本来应该出现 ${expected}，但实际写成了 ${actual}。`)

    if (expectMatch[1] === ';') {
      hints.push('检查上一条语句结尾是否漏写了分号。')
    } else if (expectMatch[1] === ')') {
      hints.push('检查括号是否成对出现，尤其是 `println(...)` 或 `main(...)`。')
    } else if (expectMatch[1] === '}') {
      hints.push('检查代码块是否正确结束，看看有没有少写 `}`。')
    }
  }

  if (/system/i.test(normalized)) {
    hints.push('Java 区分大小写，请写成 `System.out.println(...)`，不要写成 `system.out.println(...)`。')
  }

  if (/println/i.test(normalized) && /';'/.test(normalized)) {
    hints.push('`System.out.println(\"Hello World\");` 这一行末尾通常需要分号。')
  }

  return hints.slice(0, 4).join('\n') || '语法检查失败，请检查类定义、main 方法和输出语句。'
}

const runExecutable = (command, args, options = {}) =>
  new Promise((resolve) => {
    execFile(
      command,
      args,
      { timeout: 5000, maxBuffer: 1024 * 1024, ...options },
      (error, stdout, stderr) => {
        resolve({
          success: !error,
          stdout: String(stdout || ''),
          stderr: String(stderr || ''),
          errorMessage: error?.message || '',
          errorCode: error?.code
        })
      }
    )
  })

const validateJavaProgram = (answer) => {
  try {
    parse(answer)
  } catch (error) {
    return {
      ok: false,
      message: 'Java 语法不正确，无法通过本关。',
      compileOutput: summarizeJavaError(error?.message || 'Java 语法解析失败。')
    }
  }

  const classOk = /public\s+class\s+Main\b/.test(answer)
  const mainOk = /public\s+static\s+void\s+main\s*\(\s*String\[\]\s+\w+\s*\)/.test(answer)
  const printOk = /System\s*\.\s*out\s*\.\s*println\s*\(/.test(answer)

  if (!classOk || !mainOk || !printOk) {
    return {
      ok: false,
      message: '代码结构不完整，需要包含 Main 类、main 方法和输出语句。',
      compileOutput: '需要包含：public class Main / public static void main(String[] args) / System.out.println(...);'
    }
  }

  return { ok: true }
}

const evaluateJavaLevel = async (level, answer) => {
  if (!answer?.trim()) {
    return { isCorrect: false, stars: 0, message: '请先输入代码后再提交。' }
  }

  const syntaxValidation = validateJavaProgram(answer)
  if (!syntaxValidation.ok) {
    return {
      isCorrect: false,
      stars: 0,
      message: syntaxValidation.message,
      compileOutput: syntaxValidation.compileOutput
    }
  }

  const className = level.className || 'Main'
  const expectedOutput = String(level.expectedOutput || '').replace(/\r\n/g, '\n').trim()
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'codequest-java-'))
  const sourceFile = path.join(tempDir, `${className}.java`)

  try {
    await writeFile(sourceFile, answer, 'utf8')

    const compileResult = await runExecutable(JAVA_BINARIES.javac, [sourceFile], { cwd: tempDir })
    if (!compileResult.success) {
      const compileOutput = (compileResult.stderr || compileResult.stdout || compileResult.errorMessage).trim()
      const infraFailure =
        !compileResult.stderr &&
        !compileResult.stdout &&
        /Command failed:/i.test(compileResult.errorMessage || '')

      if (infraFailure) {
        const inferredOutput = extractPrintedStringLiteral(answer)

        if (inferredOutput !== null) {
          const inferredGrade = gradeJavaOutput(inferredOutput, expectedOutput)
          return {
            ...inferredGrade,
            message:
              inferredGrade.stars === 3
                ? '当前环境无法直接调用 JDK 编译器，已按 Java 语法、结构和输出内容严格校验通过。'
                : inferredGrade.message
          }
        }

        return gradeJavaStaticFallback(level, answer)
      }

      return {
        isCorrect: false,
        stars: 0,
        message: '代码未通过编译，无法获得星星。',
        compileOutput: summarizeJavaError(compileOutput)
      }
    }

    const runResult = await runExecutable(JAVA_BINARIES.java, ['-cp', tempDir, className], { cwd: tempDir })
    if (!runResult.success) {
      return {
        isCorrect: false,
        stars: 0,
        message: '代码可以编译，但运行失败，无法获得星星。',
        runtimeOutput: summarizeJavaError((runResult.stderr || runResult.stdout || runResult.errorMessage).trim())
      }
    }

    const actualOutput = runResult.stdout.replace(/\r\n/g, '\n').trim()
    return {
      ...gradeJavaOutput(actualOutput, expectedOutput),
      actualOutput
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

const evaluateLevelAnswer = async (level, answer) => {
  if (level.language === 'java') {
    return evaluateJavaLevel(level, answer)
  }

  const rawInput = String(answer || '').trim()
  const rawExpected = String(level.answer || '').trim()
  const normalizedInput = normalizeAnswer(rawInput)
  const normalizedExpected = normalizeAnswer(rawExpected)

  if (rawInput === rawExpected) {
    return { isCorrect: true, stars: 3, message: '答案正确。' }
  }

  if (normalizedInput === normalizedExpected) {
    return { isCorrect: true, stars: 2, message: '答案核心正确，但格式、大小写或标点还不够规范。' }
  }

  if (Array.isArray(level.answerKeywords) && level.answerKeywords.length > 0) {
    const matchedCount = level.answerKeywords.filter((keyword) =>
      normalizedInput.includes(normalizeAnswer(keyword))
    ).length

    if (matchedCount === level.answerKeywords.length) {
      return { isCorrect: true, stars: 2, message: '答案基本正确。' }
    }

    const passThreshold = Math.max(1, Math.ceil(level.answerKeywords.length * 0.75))
    if (matchedCount >= passThreshold) {
      return { isCorrect: true, stars: 1, message: '答案部分正确。' }
    }
  }

  const expectedLength = rawExpected.length
  const editDistance = calculateEditDistance(rawInput.toLowerCase(), rawExpected.toLowerCase())
  const maxMinorDistance = Math.max(1, Math.floor(expectedLength * 0.2))

  if (
    expectedLength >= 6 &&
    isTextOutput(rawExpected) &&
    editDistance <= maxMinorDistance
  ) {
    return { isCorrect: true, stars: 1, message: '答案和要求很接近，但还有少量字符、标点或大小写差异。' }
  }

  return { isCorrect: false, stars: 0, message: '答案不正确。' }
}

// 中间件：验证token
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: '未登录' })
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ message: '无效的token' })
  }
}

const getSortedLevels = () => [...db.data.levels].sort((a, b) => a.id - b.id)

const getProgress = (userId, levelId) =>
  db.data.progress.find(p => p.userId === userId && p.levelId === levelId)

const getStarBalance = (user) => user.starBalance ?? user.totalStars ?? 0

const setStarBalance = (user, value) => {
  user.starBalance = value
  user.totalStars = value
}

const ensureProgress = (userId, levelId) => {
  let progress = getProgress(userId, levelId)
  if (!progress) {
    progress = {
      userId,
      levelId,
      stars: 0,
      score: 0,
      completed: false,
      hintUsed: false,
      hintLevel: 0
    }
    db.data.progress.push(progress)
  }
  progress.hintLevel = progress.hintLevel ?? (progress.hintUsed ? 2 : 0)
  progress.hintUsed = progress.hintUsed ?? progress.hintLevel > 0
  return progress
}

const getPreviousLevel = (levelId) => {
  const levels = getSortedLevels()
  const index = levels.findIndex(level => level.id === levelId)
  return index > 0 ? levels[index - 1] : null
}

const isLevelUnlocked = (userId, levelId) => {
  const level = db.data.levels.find(item => item.id === levelId)
  if (!level || level.draft) return false

  const previousLevel = getPreviousLevel(levelId)
  if (!previousLevel) return true

  const previousProgress = getProgress(userId, previousLevel.id)
  return Boolean(previousProgress?.completed)
}

const getHintMaxStars = (hintLevel = 0) => {
  if (hintLevel >= 3) return 1
  if (hintLevel >= 2) return 2
  return 3
}

const getHintStageName = (stage = 1) => {
  if (stage === 1) return '方向提示'
  if (stage === 2) return '关键概念提示'
  return '局部代码提示'
}

const getLevelKnowledgePoints = (level) =>
  Array.isArray(level?.knowledgePoints) ? level.knowledgePoints : []

const getNextId = (items = []) =>
  items.length > 0 ? Math.max(...items.map(item => item.id || 0)) + 1 : 1

const hasKnowledge = (level, keywords = []) => {
  const knowledgeText = getLevelKnowledgePoints(level).join(' ').toLowerCase()
  return keywords.some(keyword => knowledgeText.includes(keyword.toLowerCase()))
}

const buildDirectionHint = (level) => {
  const points = getLevelKnowledgePoints(level).slice(0, 3)
  const focus = points.length > 0 ? `本关重点在 ${points.join('、')}。` : '先把题目拆成输入、处理、输出三步。'

  if (hasKnowledge(level, ['循环', 'for', 'while'])) {
    return `${focus}先别急着写完整代码，先问自己：循环从哪里开始，到哪里结束，每一轮要改变哪个变量？`
  }

  if (hasKnowledge(level, ['数组'])) {
    return `${focus}先确认数组里有哪些元素、要访问哪个下标，或者需要遍历每个元素做什么。`
  }

  if (hasKnowledge(level, ['方法', 'return'])) {
    return `${focus}先分清 main 方法负责调用，另一个方法负责计算并返回结果。`
  }

  if (hasKnowledge(level, ['if', '判断', '比较'])) {
    return `${focus}先把条件用一句话说清楚：什么时候走第一个分支，什么时候走另一个分支。`
  }

  return `${focus}先保证 Main 类和 main 方法结构完整，再在 main 方法里完成题目要求的最小输出。`
}

const buildConceptHint = (level) => {
  if (hasKnowledge(level, ['循环', 'for'])) {
    return 'for 循环通常包含三部分：初始化变量、继续循环的条件、每轮结束后的更新。先确认这三部分是否都写完整。'
  }

  if (hasKnowledge(level, ['while'])) {
    return 'while 循环要特别注意循环条件和变量更新；如果变量没有变化，循环可能无法正确结束。'
  }

  if (hasKnowledge(level, ['数组'])) {
    return 'Java 数组下标从 0 开始；遍历数组时，可以用普通 for，也可以用增强 for 读取每个元素。'
  }

  if (hasKnowledge(level, ['方法', 'return'])) {
    return '有返回值的方法需要写 return；调用方法时，传入的参数类型和数量要与方法定义保持一致。'
  }

  if (hasKnowledge(level, ['String', '字符串'])) {
    return '字符串文本要放在双引号中；比较字符串内容时通常使用 equals()，拼接字符串可以使用 +。'
  }

  if (hasKnowledge(level, ['if', '判断', '比较'])) {
    return 'if 后面的条件必须是 boolean 表达式，比如 score >= 60。条件成立时执行 if 代码块，否则进入 else。'
  }

  return 'Java 程序入口通常是 public static void main(String[] args)，输出可以使用 System.out.println(...)。'
}

const buildLocalCodeHint = (level) =>
  level.hint || '补齐题目要求中的关键表达式即可，不需要改动完整代码结构。'

const buildHintPayload = (level, requestedStage, highestHintLevel) => {
  const stage = Math.min(3, Math.max(1, Number(requestedStage) || 1))
  const hintMap = {
    1: buildDirectionHint(level),
    2: buildConceptHint(level),
    3: buildLocalCodeHint(level)
  }
  const nextHintLevel = Math.max(highestHintLevel || 0, stage)

  return {
    stage,
    stageName: getHintStageName(stage),
    hint: hintMap[stage],
    maxStars: getHintMaxStars(nextHintLevel),
    hintLevel: nextHintLevel,
    hintUsed: nextHintLevel > 0
  }
}

const inferErrorType = (evaluation = {}, stars = 0, answer = '') => {
  if (!String(answer || '').trim()) return 'empty_answer'
  if (evaluation.compileOutput) return 'compile_error'
  if (evaluation.runtimeOutput) return 'runtime_error'
  if (stars >= 3) return 'passed'
  if (stars > 0) return 'near_miss'
  if (evaluation.actualOutput !== undefined) return 'output_mismatch'
  return 'answer_mismatch'
}

const getErrorTypeLabel = (errorType) => {
  const labels = {
    empty_answer: '未提交有效代码',
    compile_error: '编译或语法问题',
    runtime_error: '运行时问题',
    output_mismatch: '输出结果偏差',
    near_miss: '接近正确',
    answer_mismatch: '答案结构偏差',
    passed: '已通过'
  }
  return labels[errorType] || '需要继续检查'
}

const buildSocraticQuestions = (level, errorType) => {
  const questions = []

  if (errorType === 'compile_error') {
    questions.push('Main 类、main 方法、花括号和分号都完整吗？')
    questions.push('报错位置附近，上一行有没有少写符号？')
  } else if (errorType === 'runtime_error') {
    questions.push('程序运行到哪一步会失败？变量在那一刻可能是什么值？')
    questions.push('有没有数组下标越界、除以 0 或空对象调用的风险？')
  } else if (errorType === 'output_mismatch' || errorType === 'near_miss') {
    questions.push('题目要求的输出内容、大小写、空格和换行，你的程序是否完全一致？')
    questions.push('如果只看核心逻辑，当前输出离目标还差哪一小步？')
  } else if (errorType === 'passed') {
    questions.push('如果把题目里的数字换掉，你的代码还成立吗？')
    questions.push('这关用到的模式，能不能迁移到下一道类似题？')
  } else {
    questions.push('题目要求你最终输出什么？中间需要哪些变量或步骤？')
    questions.push('能不能先写出最小可运行版本，再逐步补细节？')
  }

  if (hasKnowledge(level, ['循环', 'for', 'while'])) {
    questions.push('循环变量的初始值、结束条件和更新方向是否匹配题目范围？')
  } else if (hasKnowledge(level, ['数组'])) {
    questions.push('你访问的是第几个元素？对应的数组下标应该是多少？')
  } else if (hasKnowledge(level, ['方法', 'return'])) {
    questions.push('方法应该返回结果，还是直接在方法里输出？')
  } else if (hasKnowledge(level, ['if', '判断', '比较'])) {
    questions.push('条件表达式是否覆盖了题目里的通过和不通过两种情况？')
  }

  return questions.slice(0, 3)
}

const buildCoachFeedback = ({ level, evaluation, stars, answer, hintLevel }) => {
  const errorType = inferErrorType(evaluation, stars, answer)
  const details = []

  if (errorType === 'passed') {
    details.push(stars === 3 ? '本次代码通过，并且输出完全符合要求。' : '本次代码已经达到通过标准，但还有格式或细节可以继续打磨。')
  } else if (evaluation.compileOutput) {
    details.push('代码还没有进入运行阶段，先处理语法或编译问题。')
    details.push(formatSingleLine(evaluation.compileOutput))
  } else if (evaluation.runtimeOutput) {
    details.push('代码可以编译，但运行过程中出现问题。')
    details.push(formatSingleLine(evaluation.runtimeOutput))
  } else if (evaluation.actualOutput !== undefined) {
    details.push('代码可以运行，主要问题集中在输出内容与题目目标不一致。')
    details.push(`当前实际输出：${String(evaluation.actualOutput || '(空输出)').slice(0, 80)}`)
  } else {
    details.push('当前答案还没有满足题目的关键结构或关键输出要求。')
  }

  const knowledgePoints = getLevelKnowledgePoints(level)
  const keepPracticing =
    stars >= 3
      ? '可以继续挑战下一关，保持用“读题-拆步骤-写代码-对输出”的节奏。'
      : `建议先复盘：${knowledgePoints.slice(0, 3).join('、') || '本关核心知识'}。`

  return {
    errorType,
    diagnosis: {
      title: getErrorTypeLabel(errorType),
      details: details.filter(Boolean)
    },
    socraticQuestions: buildSocraticQuestions(level, errorType),
    nextStep:
      errorType === 'passed'
        ? '尝试不用模板重新写一遍，确认自己真正掌握了结构。'
        : '先回答上面的引导问题，再改动最小的一处代码后重新提交。',
    summary: {
      mastered: stars > 0 ? knowledgePoints.slice(0, 3) : [],
      keepPracticing
    },
    hintPolicy: {
      hintLevel: hintLevel || 0,
      maxStars: getHintMaxStars(hintLevel || 0)
    }
  }
}

const formatSingleLine = (value = '') =>
  String(value)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' ')

const recordLearningEvent = ({ userId, level, evaluation, stars, answer, hintLevel }) => {
  db.data.learningEvents = db.data.learningEvents || []
  db.data.learningEvents.push({
    id: getNextId(db.data.learningEvents),
    userId,
    levelId: level.id,
    stars,
    passed: stars >= 1,
    errorType: inferErrorType(evaluation, stars, answer),
    hintLevel: hintLevel || 0,
    knowledgePoints: getLevelKnowledgePoints(level),
    createdAt: new Date().toISOString()
  })
}

const getUnlockedIncompleteLevel = (userId) =>
  getSortedLevels().find((level) => {
    const progress = getProgress(userId, level.id)
    return !level.draft && isLevelUnlocked(userId, level.id) && !progress?.completed
  })

const getLearningRecommendation = (userId, weakPoint = '') => {
  const levels = getSortedLevels().filter(level => !level.draft && isLevelUnlocked(userId, level.id))
  const point = String(weakPoint || '').toLowerCase()
  const matchesPoint = (level) =>
    point && getLevelKnowledgePoints(level).some(item => item.toLowerCase().includes(point) || point.includes(item.toLowerCase()))

  const reviewLevel = levels.find((level) => {
    const progress = getProgress(userId, level.id)
    return progress?.completed && progress.stars < 3 && matchesPoint(level)
  })

  if (reviewLevel) {
    return {
      type: 'review',
      levelId: reviewLevel.id,
      title: reviewLevel.title,
      reason: `${weakPoint} 最近还不够稳定，建议先复习这关，把星级补上来。`
    }
  }

  const practiceLevel = levels.find((level) => {
    const progress = getProgress(userId, level.id)
    return !progress?.completed && matchesPoint(level)
  })

  if (practiceLevel) {
    return {
      type: 'practice',
      levelId: practiceLevel.id,
      title: practiceLevel.title,
      reason: `这关会继续练到 ${weakPoint}，适合作为当前巩固题。`
    }
  }

  const nextLevel = getUnlockedIncompleteLevel(userId)
  if (nextLevel) {
    return {
      type: 'next',
      levelId: nextLevel.id,
      title: nextLevel.title,
      reason: '当前没有明显连续薄弱点，建议继续推进下一关。'
    }
  }

  return {
    type: 'complete',
    levelId: null,
    title: '当前开放关卡已完成',
    reason: '可以回到地图补齐低星关卡，或等待后续开放挑战关。'
  }
}

const buildLearningProfile = (userId) => {
  const events = (db.data.learningEvents || [])
    .filter(event => event.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const pointStats = new Map()
  const strengths = new Map()

  events.forEach((event) => {
    const points = Array.isArray(event.knowledgePoints) ? event.knowledgePoints : []
    points.forEach((point) => {
      if (!pointStats.has(point)) {
        pointStats.set(point, {
          name: point,
          attempts: 0,
          weakSignals: 0,
          lastErrorType: event.errorType,
          lastAt: event.createdAt
        })
      }

      const stat = pointStats.get(point)
      stat.attempts += 1
      if (event.stars < 3) {
        stat.weakSignals += event.stars === 0 ? 2 : 1
        stat.lastErrorType = event.errorType
        stat.lastAt = event.createdAt
      } else {
        strengths.set(point, (strengths.get(point) || 0) + 1)
      }
    })
  })

  db.data.progress
    .filter(item => item.userId === userId && item.completed)
    .forEach((item) => {
      const level = db.data.levels.find(candidate => candidate.id === item.levelId)
      const points = getLevelKnowledgePoints(level)

      points.forEach((point) => {
        if (item.stars >= 3) {
          strengths.set(point, Math.max(strengths.get(point) || 0, 1))
          return
        }

        if (!pointStats.has(point)) {
          pointStats.set(point, {
            name: point,
            attempts: 0,
            weakSignals: 0,
            lastErrorType: 'low_star_progress',
            lastAt: ''
          })
        }

        const stat = pointStats.get(point)
        stat.weakSignals += 1
        stat.lastErrorType = 'low_star_progress'
      })
    })

  const weakKnowledge = [...pointStats.values()]
    .filter(stat => stat.weakSignals > 0)
    .sort((a, b) => b.weakSignals - a.weakSignals || b.attempts - a.attempts)
    .slice(0, 5)

  const topWeakPoint = weakKnowledge[0]?.name || ''
  const completedCount = db.data.progress.filter(item => item.userId === userId && item.completed).length
  const threeStarCount = db.data.progress.filter(item => item.userId === userId && item.completed && item.stars >= 3).length

  return {
    completedCount,
    threeStarCount,
    attempts: events.length,
    weakKnowledge,
    strengths: [...strengths.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count })),
    recommendation: getLearningRecommendation(userId, topWeakPoint),
    recentEvents: events.slice(0, 5)
  }
}

const toPublicLevel = (level, userId) => {
  const progress = getProgress(userId, level.id)
  const { answer, hint, answerKeywords, expectedOutput, ...publicLevel } = level

  return {
    ...publicLevel,
    locked: Boolean(level.draft) || !isLevelUnlocked(userId, level.id),
    completed: Boolean(progress?.completed),
    stars: progress?.stars ?? 0,
    hintUsed: Boolean(progress?.hintUsed),
    hintLevel: progress?.hintLevel ?? (progress?.hintUsed ? 2 : 0)
  }
}

// 获取用户信息
const getUser = (userId) => {
  const user = db.data.users.find(u => u.id === userId)
  if (!user) return null
  const starBalance = getStarBalance(user)

  return {
    id: user.id,
    username: user.username,
    gender: user.gender,
    starBalance,
    totalStars: starBalance,
    totalScore: user.totalScore,
    ladderScore: user.ladderScore ?? 0,
    ladderSolved: user.ladderSolved ?? 0,
    avatarFrame: user.avatarFrame ?? null,
    classId: user.classId,
    skin: {
      face: user.skinFace,
      hair: user.skinHair,
      coat: user.skinCoat
    }
  }
}

// 认证路由
app.post('/api/auth/register', async (req, res) => {
  await db.read()
  const { username, password, gender, classId } = req.body
  
  const existing = db.data.users.find(u => u.username === username)
  if (existing) return res.status(400).json({ message: '用户名已存在' })
  
  const hashedPassword = await bcrypt.hash(password, 10)
  const newId = db.data.users.length > 0 ? Math.max(...db.data.users.map(u => u.id)) + 1 : 1
  
  const newUser = {
    id: newId,
    username,
    password: hashedPassword,
    gender,
    starBalance: 0,
    totalStars: 0,
    totalScore: 0,
    ladderScore: 0,
    ladderSolved: 0,
    avatarFrame: null,
    classId,
    skinFace: '默认脸型',
    skinHair: '默认发型',
    skinCoat: '默认外套',
    createdAt: new Date().toISOString()
  }
  
  db.data.users.push(newUser)
  
  // 赋予默认皮肤
  db.data.userSkins.push({ id: db.data.userSkins.length + 1, userId: newId, skinId: 1 })
  db.data.userSkins.push({ id: db.data.userSkins.length + 1, userId: newId, skinId: 5 })
  db.data.userSkins.push({ id: db.data.userSkins.length + 1, userId: newId, skinId: 9 })
  
  await db.write()
  
  const user = getUser(newId)
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
  
  res.json({ token, user })
})

app.post('/api/auth/login', async (req, res) => {
  await db.read()
  const { username, password } = req.body
  
  const userRow = db.data.users.find(u => u.username === username)
  if (!userRow) return res.status(400).json({ message: '用户不存在' })
  
  const valid = await bcrypt.compare(password, userRow.password)
  if (!valid) return res.status(400).json({ message: '密码错误' })
  
  const user = getUser(userRow.id)
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
  
  res.json({ token, user })
})

// 关卡路由
app.get('/api/levels', auth, async (req, res) => {
  await db.read()
  const levels = getSortedLevels().map(level => toPublicLevel(level, req.userId))
  res.json(levels)
})

app.get('/api/levels/:id', auth, async (req, res) => {
  await db.read()
  const levelId = Number(req.params.id)
  const level = db.data.levels.find(l => l.id === levelId)
  if (!level) return res.status(404).json({ message: '关卡不存在' })
  if (level.draft) return res.status(403).json({ message: '本关正在制作中，暂未开放。' })
  if (!isLevelUnlocked(req.userId, levelId)) {
    const previousLevel = getPreviousLevel(levelId)
    return res.status(403).json({
      message: '请先通关上一关，再进入当前关卡。',
      previousLevelId: previousLevel?.id
    })
  }

  res.json(toPublicLevel(level, req.userId))
})

app.post('/api/levels/:id/hint', auth, async (req, res) => {
  await db.read()
  db.data.learningEvents = db.data.learningEvents || []
  const levelId = Number(req.params.id)
  const requestedStage = Number(req.body?.stage || 1)
  const level = db.data.levels.find(l => l.id === levelId)
  if (!level) return res.status(404).json({ message: '关卡不存在' })
  if (level.draft) return res.status(403).json({ message: '本关正在制作中，暂未开放提示。' })
  if (!isLevelUnlocked(req.userId, levelId)) {
    return res.status(403).json({ message: '请先通关上一关，再查看当前关卡提示。' })
  }

  const progress = ensureProgress(req.userId, levelId)
  const hintPayload = buildHintPayload(level, requestedStage, progress.hintLevel || 0)
  progress.hintLevel = hintPayload.hintLevel
  progress.hintUsed = true
  db.data.learningEvents.push({
    id: getNextId(db.data.learningEvents),
    userId: req.userId,
    levelId,
    stars: 0,
    passed: false,
    errorType: 'hint_used',
    hintLevel: progress.hintLevel,
    knowledgePoints: getLevelKnowledgePoints(level),
    createdAt: new Date().toISOString()
  })
  await db.write()

  res.json(hintPayload)
})

app.post('/api/levels/:id/submit', auth, async (req, res) => {
  await db.read()
  const { answer } = req.body
  const levelId = Number(req.params.id)
  
  const level = db.data.levels.find(l => l.id === levelId)
  const userRow = db.data.users.find(u => u.id === req.userId)
  if (!level) return res.status(404).json({ message: '关卡不存在' })
  if (level.draft) return res.status(403).json({ message: '本关正在制作中，暂未开放提交。' })
  if (!userRow) return res.status(404).json({ message: '用户不存在' })
  if (!isLevelUnlocked(req.userId, levelId)) {
    return res.status(403).json({ message: '请先通关上一关，再提交当前关卡。' })
  }

  const evaluation = await evaluateLevelAnswer(level, answer)
  const existingProgress = getProgress(req.userId, levelId)
  const currentHintLevel = existingProgress?.hintLevel ?? (existingProgress?.hintUsed ? 2 : 0)
  const maxStars = getHintMaxStars(currentHintLevel)
  const stars = Math.min(evaluation.stars, maxStars)
  const message =
    evaluation.stars > stars
      ? `${evaluation.message} 本关已查看${getHintStageName(currentHintLevel)}，本次最高可获得 ${maxStars} 星。`
      : evaluation.message
  
  const score = stars * 10
  
  // 检查现有进度
  if (existingProgress) {
    if (stars > existingProgress.stars) {
      const starDiff = stars - existingProgress.stars
      const scoreDiff = score - existingProgress.score
      
      existingProgress.stars = stars
      existingProgress.score = score
      existingProgress.completed = stars >= 1
      
      setStarBalance(userRow, getStarBalance(userRow) + starDiff)
      userRow.totalScore += scoreDiff
    }
  } else if (stars > 0) {
    db.data.progress.push({
      userId: req.userId,
      levelId,
      stars,
      score,
      completed: stars >= 1,
      hintUsed: currentHintLevel > 0,
      hintLevel: currentHintLevel
    })
    
    setStarBalance(userRow, getStarBalance(userRow) + stars)
    userRow.totalScore += score
  }

  recordLearningEvent({
    userId: req.userId,
    level,
    evaluation,
    stars,
    answer,
    hintLevel: currentHintLevel
  })
  
  await db.write()
  
  const updatedUser = getUser(req.userId)
  const coach = buildCoachFeedback({
    level,
    evaluation,
    stars,
    answer,
    hintLevel: currentHintLevel
  })
  
  res.json({
    stars,
    passed: stars >= 1,
    user: updatedUser,
    message,
    maxStars,
    hintUsed: currentHintLevel > 0,
    hintLevel: currentHintLevel,
    compileOutput: evaluation.compileOutput,
    runtimeOutput: evaluation.runtimeOutput,
    actualOutput: evaluation.actualOutput,
    coach
  })
})

// 进度路由
app.get('/api/progress', auth, async (req, res) => {
  await db.read()
  const progress = db.data.progress.filter(p => p.userId === req.userId)
  res.json(progress)
})

app.get('/api/learning/profile', auth, async (req, res) => {
  await db.read()
  db.data.learningEvents = db.data.learningEvents || []
  res.json(buildLearningProfile(req.userId))
})

// 笔记路由
app.get('/api/notes', auth, async (req, res) => {
  await db.read()
  const notes = db.data.notes
    .filter(n => n.userId === req.userId)
    .map(n => ({
      ...n,
      tags: n.tags || [],
      links: n.links || []
    }))
  res.json(notes)
})

app.post('/api/notes', auth, async (req, res) => {
  await db.read()
  const { title, content, levelId, tags, links } = req.body
  const newId = db.data.notes.length > 0 ? Math.max(...db.data.notes.map(n => n.id)) + 1 : 1
  
  const newNote = {
    id: newId,
    userId: req.userId,
    levelId: levelId || null,
    title,
    content,
    tags: tags || [],
    links: links || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  db.data.notes.push(newNote)
  await db.write()
  
  res.json(newNote)
})

app.delete('/api/notes/:id', auth, async (req, res) => {
  await db.read()
  const noteIndex = db.data.notes.findIndex(n => n.id === Number(req.params.id) && n.userId === req.userId)
  if (noteIndex > -1) {
    db.data.notes.splice(noteIndex, 1)
    await db.write()
  }
  res.json({ success: true })
})

// 商城路由
app.get('/api/shop/skins', async (req, res) => {
  await db.read()
  res.json(db.data.skins)
})

app.get('/api/shop/owned', auth, async (req, res) => {
  await db.read()
  const owned = db.data.userSkins.filter(s => s.userId === req.userId)
  res.json(owned)
})

app.post('/api/shop/buy/:id', auth, async (req, res) => {
  await db.read()
  const skinId = Number(req.params.id)
  const skin = db.data.skins.find(s => s.id === skinId)
  const userRow = db.data.users.find(u => u.id === req.userId)
  if (!skin) return res.status(404).json({ message: '皮肤不存在' })
  if (!userRow) return res.status(404).json({ message: '用户不存在' })
  
  if (getStarBalance(userRow) < skin.price) {
    return res.status(400).json({ message: '星星不足' })
  }
  
  const existing = db.data.userSkins.find(s => s.userId === req.userId && s.skinId === skinId)
  if (existing) {
    return res.status(400).json({ message: '已拥有该皮肤' })
  }
  
  db.data.userSkins.push({
    id: db.data.userSkins.length + 1,
    userId: req.userId,
    skinId
  })
  
  setStarBalance(userRow, getStarBalance(userRow) - skin.price)
  await db.write()
  
  const updatedUser = getUser(req.userId)
  res.json({ user: updatedUser })
})

app.post('/api/shop/equip/:id', auth, async (req, res) => {
  await db.read()
  const skinId = Number(req.params.id)
  const skin = db.data.skins.find(s => s.id === skinId)
  const userRow = db.data.users.find(u => u.id === req.userId)
  if (!skin) return res.status(404).json({ message: '皮肤不存在' })
  if (!userRow) return res.status(404).json({ message: '用户不存在' })
  
  const owned = db.data.userSkins.find(s => s.userId === req.userId && s.skinId === skinId)
  if (!owned) {
    return res.status(400).json({ message: '未拥有该皮肤' })
  }
  
  if (skin.type === 'face') {
    userRow.skinFace = skin.name
  } else if (skin.type === 'hair') {
    userRow.skinHair = skin.name
  } else if (skin.type === 'coat') {
    userRow.skinCoat = skin.name
  }
  
  await db.write()
  
  const updatedUser = getUser(req.userId)
  res.json({ user: updatedUser })
})

// 排行榜路由
app.get('/api/leaderboard/class', auth, async (req, res) => {
  await db.read()
  const user = db.data.users.find(u => u.id === req.userId)
  if (!user) return res.status(404).json({ message: '用户不存在' })

  const ranks = db.data.users
    .filter(u => u.classId === user.classId)
    .map(u => ({
      id: u.id,
      username: u.username,
      ladderScore: u.ladderScore ?? 0,
      ladderSolved: u.ladderSolved ?? 0,
      avatarFrame: u.avatarFrame ?? null,
      skin: {
        face: u.skinFace,
        hair: u.skinHair,
        coat: u.skinCoat
      }
    }))
    .sort((a, b) => b.ladderScore - a.ladderScore || b.ladderSolved - a.ladderSolved)
  
  res.json(ranks)
})

app.get('/api/leaderboard/school', auth, async (req, res) => {
  await db.read()
  const ranks = db.data.users
    .map(u => ({
      id: u.id,
      username: u.username,
      ladderScore: u.ladderScore ?? 0,
      ladderSolved: u.ladderSolved ?? 0,
      avatarFrame: u.avatarFrame ?? null,
      className: db.data.classes.find(c => c.id === u.classId)?.name || '',
      skin: {
        face: u.skinFace,
        hair: u.skinHair,
        coat: u.skinCoat
      }
    }))
    .sort((a, b) => b.ladderScore - a.ladderScore || b.ladderSolved - a.ladderSolved)
    .slice(0, 50)
  
  res.json(ranks)
})

// AI辅导路由
app.post('/api/ai/help', auth, async (req, res) => {
  await db.read()
  const { levelId } = req.body
  const level = db.data.levels.find(l => l.id === levelId)
  if (!level) return res.status(404).json({ message: '关卡不存在' })
  
  const help = [
    `题目：${level.title}`,
    `学习目标：${level.goal || '完成本关核心任务'}`,
    `引导问题：${buildSocraticQuestions(level, 'answer_mismatch').join(' ')}`,
    `方向提示：${buildDirectionHint(level)}`
  ].join('\n\n')
  
  res.json({ help })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
