import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdir } from 'fs/promises'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const file = path.join(__dirname, '../data/db.json')
const adapter = new JSONFile(file)

// 初始化数据结构
const defaultData = {
  users: [],
  levels: [],
  progress: [],
  skins: [],
  userSkins: [],
  notes: [],
  ladderProblems: [],
  achievements: [],
  userAchievements: [],
  learningEvents: [],
  classes: [
    { id: 1, name: '班级1' },
    { id: 2, name: '班级2' },
    { id: 3, name: '班级3' }
  ]
}

const db = new Low(adapter, defaultData)

const getNextId = (items = []) =>
  items.length > 0 ? Math.max(...items.map(item => item.id || 0)) + 1 : 1

const beginnerLevels = [
  {
    id: 1,
    chapter: 'beginner',
    number: 1,
    title: 'Java 觉醒：你好，世界',
    content:
      '欢迎来到 Java 的第一关。\n本关你将认识 Java 程序最经典的入口结构，并完成你的第一个输出程序。\n\n要求：\n1. 定义一个名为 Main 的类。\n2. 编写 main 方法作为程序入口。\n3. 使用 System.out.println 输出 Hello World。',
    difficulty: 'easy',
    question:
      '请写出一个完整的 Java 程序，运行后在控制台输出：\nHello World',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
    goal: '学会 Java 程序的基本结构，并理解类、main 方法、打印输出三部分。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        \n    }\n}',
    hint: '先保留 Main 类和 main 方法，在 main 方法里使用 System.out.println("Hello World");。',
    language: 'java',
    className: 'Main',
    expectedOutput: 'Hello World',
    knowledgePoints: ['class 类', 'main 方法', 'System.out.println', 'Java 程序入口'],
    answerKeywords: ['class main', 'public static void main', 'system.out.println', 'hello world']
  },
  {
    id: 2,
    chapter: 'beginner',
    number: 2,
    title: '能量水晶：整数变量',
    content:
      '变量可以保存程序运行中的数据。\n本关使用 int 声明一个整数变量，再把变量里的值输出出来。',
    difficulty: 'easy',
    question:
      '请声明一个 int 类型变量 energy，值为 5，并输出这个变量。\n运行后控制台应输出：\n5',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        int energy = 5;\n        System.out.println(energy);\n    }\n}',
    goal: '学会声明 int 变量，并理解变量名可以代表它保存的值。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        int energy = ;\n        System.out.println(energy);\n    }\n}',
    hint: 'int 变量的声明格式是：int energy = 5;。输出变量时不需要加双引号。',
    language: 'java',
    className: 'Main',
    expectedOutput: '5',
    knowledgePoints: ['int', '变量声明', '变量赋值', '输出变量'],
    answerKeywords: ['int energy', '5', 'system.out.println']
  },
  {
    id: 3,
    chapter: 'beginner',
    number: 3,
    title: '符文相加：加法运算',
    content:
      '程序不仅能保存数据，还能对数据进行计算。\n本关用两个整数变量完成一次加法。',
    difficulty: 'easy',
    question:
      '请声明两个整数变量 a 和 b，分别赋值为 3 和 5，输出它们的和。\n运行后控制台应输出：\n8',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        int a = 3;\n        int b = 5;\n        System.out.println(a + b);\n    }\n}',
    goal: '学会使用 + 对整数进行加法运算。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        int a = 3;\n        int b = 5;\n        System.out.println();\n    }\n}',
    hint: '把表达式 a + b 放进 System.out.println(...) 里即可输出计算结果。',
    language: 'java',
    className: 'Main',
    expectedOutput: '8',
    knowledgePoints: ['整数变量', '加法运算', '表达式'],
    answerKeywords: ['int a', 'int b', 'a + b', 'system.out.println']
  },
  {
    id: 4,
    chapter: 'beginner',
    number: 4,
    title: '冒险者名牌：字符串拼接',
    content:
      'String 用来保存文本。\n本关把固定文本和变量拼接起来，生成一句完整问候。',
    difficulty: 'easy',
    question:
      '请声明 String 变量 name，值为 CodeQuest，并输出：\nHello, CodeQuest',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        String name = "CodeQuest";\n        System.out.println("Hello, " + name);\n    }\n}',
    goal: '学会声明 String 变量，并使用 + 拼接字符串。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        String name = "";\n        System.out.println();\n    }\n}',
    hint: '文本需要放在双引号里；"Hello, " + name 可以把问候语和变量拼起来。',
    language: 'java',
    className: 'Main',
    expectedOutput: 'Hello, CodeQuest',
    knowledgePoints: ['String', '字符串字面量', '字符串拼接'],
    answerKeywords: ['string name', 'codequest', 'hello', '+ name']
  },
  {
    id: 5,
    chapter: 'beginner',
    number: 5,
    title: '通行徽章：if 判断',
    content:
      'if 可以让程序根据条件选择不同路线。\n本关判断分数是否达到通关线。',
    difficulty: 'easy',
    question:
      '请声明 int score = 85。\n如果 score 大于等于 60，输出 Pass，否则输出 Fail。\n运行后控制台应输出：\nPass',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        int score = 85;\n        if (score >= 60) {\n            System.out.println("Pass");\n        } else {\n            System.out.println("Fail");\n        }\n    }\n}',
    goal: '学会使用 if / else 和比较运算符 >=。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        int score = 85;\n        if () {\n            System.out.println("Pass");\n        } else {\n            System.out.println("Fail");\n        }\n    }\n}',
    hint: '判断条件可以写成 score >= 60。注意 if 后面的条件需要放在小括号里。',
    language: 'java',
    className: 'Main',
    expectedOutput: 'Pass',
    knowledgePoints: ['if', 'else', '比较运算符', '代码块'],
    answerKeywords: ['if', 'score >= 60', 'pass', 'else']
  },
  {
    id: 6,
    chapter: 'beginner',
    number: 6,
    title: '五步阶梯：for 循环',
    content:
      '循环可以让一段代码重复执行。\n本关用 for 循环连续输出 1 到 5。',
    difficulty: 'easy',
    question:
      '请使用 for 循环输出 1 到 5，每个数字占一行。\n运行后控制台应输出：\n1\n2\n3\n4\n5',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        for (int i = 1; i <= 5; i++) {\n            System.out.println(i);\n        }\n    }\n}',
    goal: '学会 for 循环的初始值、循环条件和更新表达式。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        for (int i = 1; i <= ; i++) {\n            System.out.println(i);\n        }\n    }\n}',
    hint: 'for 循环可以写成 for (int i = 1; i <= 5; i++)，每次循环输出 i。',
    language: 'java',
    className: 'Main',
    expectedOutput: '1\n2\n3\n4\n5',
    knowledgePoints: ['for 循环', '循环变量', '自增 i++', '多行输出'],
    answerKeywords: ['for', 'int i = 1', 'i <= 5', 'i++']
  },
  {
    id: 7,
    chapter: 'beginner',
    number: 7,
    title: '背包格子：数组访问',
    content:
      '数组可以一次保存多个同类型数据。\n本关创建一个整数数组，并读取其中一个元素。',
    difficulty: 'easy',
    question:
      '请创建 int 数组 coins，内容为 2、4、6，并输出第二个元素。\n运行后控制台应输出：\n4',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        int[] coins = {2, 4, 6};\n        System.out.println(coins[1]);\n    }\n}',
    goal: '学会创建数组，并理解 Java 数组下标从 0 开始。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        int[] coins = {2, 4, 6};\n        System.out.println(coins[]);\n    }\n}',
    hint: '数组的第一个元素下标是 0，所以第二个元素是 coins[1]。',
    language: 'java',
    className: 'Main',
    expectedOutput: '4',
    knowledgePoints: ['数组', '数组下标', '元素访问'],
    answerKeywords: ['int[] coins', 'coins[1]', 'system.out.println']
  },
  {
    id: 8,
    chapter: 'beginner',
    number: 8,
    title: '收集金币：累加求和',
    content:
      '循环和变量可以组合使用，逐步累加得到总数。\n本关计算数组中所有金币的总和。',
    difficulty: 'easy',
    question:
      '请创建数组 coins = {1, 2, 3, 4}，用循环计算所有元素之和并输出。\n运行后控制台应输出：\n10',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        int[] coins = {1, 2, 3, 4};\n        int sum = 0;\n        for (int coin : coins) {\n            sum += coin;\n        }\n        System.out.println(sum);\n    }\n}',
    goal: '学会使用累加变量，并用增强 for 遍历数组。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        int[] coins = {1, 2, 3, 4};\n        int sum = 0;\n        for (int coin : coins) {\n            \n        }\n        System.out.println(sum);\n    }\n}',
    hint: '每次循环把当前 coin 加到 sum 上，可以写成 sum += coin;。',
    language: 'java',
    className: 'Main',
    expectedOutput: '10',
    knowledgePoints: ['数组遍历', '增强 for', '累加变量', 'sum += coin'],
    answerKeywords: ['int sum = 0', 'for', 'sum += coin', 'system.out.println']
  },
  {
    id: 9,
    chapter: 'beginner',
    number: 9,
    title: '力量公式：方法调用',
    content:
      '方法可以把一段逻辑封装起来，之后反复调用。\n本关编写一个 square 方法计算平方。',
    difficulty: 'easy',
    question:
      '请编写 static int square(int x) 方法，返回 x * x。\n在 main 方法中输出 square(6) 的结果。\n运行后控制台应输出：\n36',
    answer:
      'public class Main {\n    static int square(int x) {\n        return x * x;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(square(6));\n    }\n}',
    goal: '学会定义静态方法、返回值和方法调用。',
    starterCode:
      'public class Main {\n    static int square(int x) {\n        return ;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(square(6));\n    }\n}',
    hint: '方法体里返回 x * x；main 方法中可以直接调用 square(6)。',
    language: 'java',
    className: 'Main',
    expectedOutput: '36',
    knowledgePoints: ['static 方法', 'return', '参数', '方法调用'],
    answerKeywords: ['static int square', 'return x * x', 'square(6)']
  },
  {
    id: 10,
    chapter: 'beginner',
    number: 10,
    title: '偶数哨塔：循环与判断',
    content:
      '真实程序常常把循环和条件判断组合起来。\n本关在 1 到 5 中找出偶数并输出。',
    difficulty: 'easy',
    question:
      '请使用 for 循环遍历 1 到 5，只输出其中的偶数，每个数字占一行。\n运行后控制台应输出：\n2\n4',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        for (int i = 1; i <= 5; i++) {\n            if (i % 2 == 0) {\n                System.out.println(i);\n            }\n        }\n    }\n}',
    goal: '综合使用 for、if 和取余运算符 %。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        for (int i = 1; i <= 5; i++) {\n            if () {\n                System.out.println(i);\n            }\n        }\n    }\n}',
    hint: '偶数除以 2 的余数是 0，可以用 i % 2 == 0 判断。',
    language: 'java',
    className: 'Main',
    expectedOutput: '2\n4',
    knowledgePoints: ['for 循环', 'if 判断', '取余运算 %', '综合练习'],
    answerKeywords: ['for', 'if', 'i % 2 == 0', 'system.out.println']
  }
]

const javaBasicFlowLevels = [
  {
    id: 11,
    chapter: 'java-basic',
    number: 11,
    title: '守卫评级：else-if 多分支',
    content:
      '当条件不止两种时，可以使用 if / else if / else 形成多分支判断。\n本关根据分数输出等级。',
    difficulty: 'easy',
    question:
      '请声明 int score = 92。\n如果 score >= 90 输出 A，否则如果 score >= 80 输出 B，否则输出 C。\n运行后控制台应输出：\nA',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        int score = 92;\n        if (score >= 90) {\n            System.out.println("A");\n        } else if (score >= 80) {\n            System.out.println("B");\n        } else {\n            System.out.println("C");\n        }\n    }\n}',
    goal: '学会使用 else-if 处理多个判断分支。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        int score = 92;\n        if () {\n            System.out.println("A");\n        } else if () {\n            System.out.println("B");\n        } else {\n            System.out.println("C");\n        }\n    }\n}',
    hint: '先判断最高等级：score >= 90；第二个条件可以写 score >= 80。',
    language: 'java',
    className: 'Main',
    expectedOutput: 'A',
    knowledgePoints: ['else-if', '多分支判断', '条件顺序'],
    answerKeywords: ['else if', 'score >= 90', 'score >= 80', 'system.out.println']
  },
  {
    id: 12,
    chapter: 'java-basic',
    number: 12,
    title: '倒计时门：while 循环',
    content:
      'while 会在条件成立时持续执行代码。\n本关用 while 完成一个简单倒计时。',
    difficulty: 'easy',
    question:
      '请使用 while 循环从 3 倒数到 1，每个数字占一行。\n运行后控制台应输出：\n3\n2\n1',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        int count = 3;\n        while (count >= 1) {\n            System.out.println(count);\n            count--;\n        }\n    }\n}',
    goal: '学会 while 循环和循环变量递减。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        int count = 3;\n        while () {\n            System.out.println(count);\n            \n        }\n    }\n}',
    hint: '循环条件可以写 count >= 1，每次循环后用 count--; 让数字变小。',
    language: 'java',
    className: 'Main',
    expectedOutput: '3\n2\n1',
    knowledgePoints: ['while 循环', '循环条件', '自减 count--'],
    answerKeywords: ['while', 'count >= 1', 'count--', 'system.out.println']
  },
  {
    id: 13,
    chapter: 'java-basic',
    number: 13,
    title: '方阵符文：嵌套循环',
    content:
      '循环里还可以再放循环，这叫嵌套循环。\n本关输出一个 3 行 3 列的星号方阵。',
    difficulty: 'easy',
    question:
      '请使用嵌套 for 循环输出 3 行星号，每行 3 个星号。\n运行后控制台应输出：\n***\n***\n***',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        for (int row = 1; row <= 3; row++) {\n            for (int col = 1; col <= 3; col++) {\n                System.out.print("*");\n            }\n            System.out.println();\n        }\n    }\n}',
    goal: '学会用外层循环控制行、内层循环控制列。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        for (int row = 1; row <= 3; row++) {\n            for (int col = 1; col <= 3; col++) {\n                \n            }\n            System.out.println();\n        }\n    }\n}',
    hint: '内层循环用 System.out.print("*") 不换行；一行结束后再调用 System.out.println() 换行。',
    language: 'java',
    className: 'Main',
    expectedOutput: '***\n***\n***',
    knowledgePoints: ['嵌套循环', 'System.out.print', '换行'],
    answerKeywords: ['for', 'row <= 3', 'col <= 3', 'system.out.print']
  },
  {
    id: 14,
    chapter: 'java-basic',
    number: 14,
    title: '最高金币：数组最大值',
    content:
      '数组经常需要被遍历，找出最大值、最小值或统计结果。\n本关找出金币数组中的最大值。',
    difficulty: 'easy',
    question:
      '请创建 int 数组 coins = {3, 9, 5, 2}，遍历数组并输出最大值。\n运行后控制台应输出：\n9',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        int[] coins = {3, 9, 5, 2};\n        int max = coins[0];\n        for (int coin : coins) {\n            if (coin > max) {\n                max = coin;\n            }\n        }\n        System.out.println(max);\n    }\n}',
    goal: '学会用变量记录当前最大值，并在遍历中更新它。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        int[] coins = {3, 9, 5, 2};\n        int max = coins[0];\n        for (int coin : coins) {\n            if () {\n                \n            }\n        }\n        System.out.println(max);\n    }\n}',
    hint: '如果 coin > max，就把 max 更新为 coin。',
    language: 'java',
    className: 'Main',
    expectedOutput: '9',
    knowledgePoints: ['数组遍历', '最大值', 'if 更新变量'],
    answerKeywords: ['int max = coins[0]', 'for', 'coin > max', 'max = coin']
  },
  {
    id: 15,
    chapter: 'java-basic',
    number: 15,
    title: '最轻背包：数组最小值',
    content:
      '最大值和最小值的思路相似：先设定一个初始值，再遍历比较更新。\n本关找出重量数组中的最小值。',
    difficulty: 'easy',
    question:
      '请创建 int 数组 weights = {8, 6, 4, 7}，遍历数组并输出最小值。\n运行后控制台应输出：\n4',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        int[] weights = {8, 6, 4, 7};\n        int min = weights[0];\n        for (int weight : weights) {\n            if (weight < min) {\n                min = weight;\n            }\n        }\n        System.out.println(min);\n    }\n}',
    goal: '学会用同一套遍历模式解决最小值问题。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        int[] weights = {8, 6, 4, 7};\n        int min = weights[0];\n        for (int weight : weights) {\n            if () {\n                \n            }\n        }\n        System.out.println(min);\n    }\n}',
    hint: '如果 weight < min，就把 min 更新为 weight。',
    language: 'java',
    className: 'Main',
    expectedOutput: '4',
    knowledgePoints: ['数组遍历', '最小值', '比较运算'],
    answerKeywords: ['int min = weights[0]', 'for', 'weight < min', 'min = weight']
  },
  {
    id: 16,
    chapter: 'java-basic',
    number: 16,
    title: '偶数计数器：统计数量',
    content:
      '计数器用于统计满足条件的数据个数。\n本关统计数组中的偶数数量。',
    difficulty: 'easy',
    question:
      '请创建 int 数组 nums = {1, 2, 3, 4, 5, 6}，统计偶数个数并输出。\n运行后控制台应输出：\n3',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        int[] nums = {1, 2, 3, 4, 5, 6};\n        int count = 0;\n        for (int num : nums) {\n            if (num % 2 == 0) {\n                count++;\n            }\n        }\n        System.out.println(count);\n    }\n}',
    goal: '学会用 count 变量统计满足条件的元素数量。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        int[] nums = {1, 2, 3, 4, 5, 6};\n        int count = 0;\n        for (int num : nums) {\n            if () {\n                \n            }\n        }\n        System.out.println(count);\n    }\n}',
    hint: '偶数判断是 num % 2 == 0；计数器加一可以写 count++;。',
    language: 'java',
    className: 'Main',
    expectedOutput: '3',
    knowledgePoints: ['计数器', '取余运算', '数组统计'],
    answerKeywords: ['int count = 0', 'num % 2 == 0', 'count++', 'for']
  },
  {
    id: 17,
    chapter: 'java-basic',
    number: 17,
    title: '百步能量：循环求和',
    content:
      '累加器可以和循环配合，计算一段连续数字的总和。\n本关计算 1 到 100 的和。',
    difficulty: 'easy',
    question:
      '请使用 for 循环计算 1 到 100 的整数和并输出。\n运行后控制台应输出：\n5050',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        int sum = 0;\n        for (int i = 1; i <= 100; i++) {\n            sum += i;\n        }\n        System.out.println(sum);\n    }\n}',
    goal: '强化 for 循环和累加器模式。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        int sum = 0;\n        for (int i = 1; i <= 100; i++) {\n            \n        }\n        System.out.println(sum);\n    }\n}',
    hint: '每轮循环把 i 累加到 sum，可以写 sum += i;。',
    language: 'java',
    className: 'Main',
    expectedOutput: '5050',
    knowledgePoints: ['for 循环', '累加器', '连续整数求和'],
    answerKeywords: ['int sum = 0', 'i <= 100', 'sum += i', 'system.out.println']
  },
  {
    id: 18,
    chapter: 'java-basic',
    number: 18,
    title: '密语长度：字符串长度',
    content:
      '字符串也有可调用的方法。\n本关使用 length() 获取字符串长度。',
    difficulty: 'easy',
    question:
      '请声明 String word = "CodeQuest"，并输出它的长度。\n运行后控制台应输出：\n9',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        String word = "CodeQuest";\n        System.out.println(word.length());\n    }\n}',
    goal: '学会调用字符串的 length() 方法。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        String word = "CodeQuest";\n        System.out.println();\n    }\n}',
    hint: '字符串长度可以通过 word.length() 得到。',
    language: 'java',
    className: 'Main',
    expectedOutput: '9',
    knowledgePoints: ['String 方法', 'length()', '方法调用'],
    answerKeywords: ['string word', 'codequest', 'word.length()', 'system.out.println']
  },
  {
    id: 19,
    chapter: 'java-basic',
    number: 19,
    title: '口令校验：字符串比较',
    content:
      '在 Java 中，字符串内容比较通常使用 equals()，而不是 ==。\n本关检查口令是否正确。',
    difficulty: 'easy',
    question:
      '请声明 String password = "java"。\n如果 password 的内容等于 "java"，输出 Unlocked，否则输出 Locked。\n运行后控制台应输出：\nUnlocked',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        String password = "java";\n        if (password.equals("java")) {\n            System.out.println("Unlocked");\n        } else {\n            System.out.println("Locked");\n        }\n    }\n}',
    goal: '学会使用 equals() 比较字符串内容。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        String password = "java";\n        if () {\n            System.out.println("Unlocked");\n        } else {\n            System.out.println("Locked");\n        }\n    }\n}',
    hint: '字符串内容比较可以写 password.equals("java")。',
    language: 'java',
    className: 'Main',
    expectedOutput: 'Unlocked',
    knowledgePoints: ['String', 'equals()', '字符串比较', 'if 判断'],
    answerKeywords: ['password.equals', 'java', 'unlocked', 'else']
  },
  {
    id: 20,
    chapter: 'java-basic',
    number: 20,
    title: '奖励方法：参数与返回值',
    content:
      '方法可以接收参数，处理后返回结果。\n本关编写一个加分方法，完成入门篇第一阶段收束。',
    difficulty: 'easy',
    question:
      '请编写 static int addBonus(int score) 方法，返回 score + 10。\n在 main 方法中输出 addBonus(85) 的结果。\n运行后控制台应输出：\n95',
    answer:
      'public class Main {\n    static int addBonus(int score) {\n        return score + 10;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(addBonus(85));\n    }\n}',
    goal: '巩固方法参数、返回值和方法调用。',
    starterCode:
      'public class Main {\n    static int addBonus(int score) {\n        return ;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(addBonus(85));\n    }\n}',
    hint: 'addBonus 方法里返回 score + 10；main 方法中输出 addBonus(85)。',
    language: 'java',
    className: 'Main',
    expectedOutput: '95',
    knowledgePoints: ['方法参数', 'return', '返回值', '方法调用'],
    answerKeywords: ['static int addBonus', 'return score + 10', 'addBonus(85)']
  },
  {
    id: 21,
    chapter: 'java-basic',
    number: 21,
    title: '目标搜寻：数组查找',
    content:
      '数组查找是最常见的基础任务之一。\n本关遍历数组，判断目标数字是否存在。',
    difficulty: 'easy',
    question:
      '请创建 int 数组 nums = {4, 8, 15, 16}，判断其中是否包含数字 15。\n如果包含，输出 Found，否则输出 Missing。\n运行后控制台应输出：\nFound',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        int[] nums = {4, 8, 15, 16};\n        boolean found = false;\n        for (int num : nums) {\n            if (num == 15) {\n                found = true;\n            }\n        }\n        if (found) {\n            System.out.println("Found");\n        } else {\n            System.out.println("Missing");\n        }\n    }\n}',
    goal: '学会用 boolean 标记记录查找结果。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        int[] nums = {4, 8, 15, 16};\n        boolean found = false;\n        for (int num : nums) {\n            if () {\n                \n            }\n        }\n        if (found) {\n            System.out.println("Found");\n        } else {\n            System.out.println("Missing");\n        }\n    }\n}',
    hint: '找到目标时让 found = true；循环结束后根据 found 决定输出。',
    language: 'java',
    className: 'Main',
    expectedOutput: 'Found',
    knowledgePoints: ['数组查找', 'boolean', '标记变量', 'if 判断'],
    answerKeywords: ['boolean found', 'num == 15', 'found = true', 'if (found)']
  },
  {
    id: 22,
    chapter: 'java-basic',
    number: 22,
    title: '平均战力：数组平均值',
    content:
      '平均值需要先求和，再除以数据数量。\n本关计算一组分数的整数平均值。',
    difficulty: 'easy',
    question:
      '请创建 int 数组 scores = {70, 80, 90}，计算平均值并输出。\n运行后控制台应输出：\n80',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        int[] scores = {70, 80, 90};\n        int sum = 0;\n        for (int score : scores) {\n            sum += score;\n        }\n        int average = sum / scores.length;\n        System.out.println(average);\n    }\n}',
    goal: '学会使用数组长度 length 参与平均值计算。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        int[] scores = {70, 80, 90};\n        int sum = 0;\n        for (int score : scores) {\n            \n        }\n        int average = ;\n        System.out.println(average);\n    }\n}',
    hint: '先 sum += score，再用 sum / scores.length 得到平均值。',
    language: 'java',
    className: 'Main',
    expectedOutput: '80',
    knowledgePoints: ['数组长度', '平均值', '整数除法', '累加'],
    answerKeywords: ['scores.length', 'sum += score', 'int average', 'system.out.println']
  },
  {
    id: 23,
    chapter: 'java-basic',
    number: 23,
    title: '首字符钥匙：charAt',
    content:
      '字符串可以按位置取出某个字符。\n本关使用 charAt(0) 获取第一个字符。',
    difficulty: 'easy',
    question:
      '请声明 String word = "Code"，并输出它的第一个字符。\n运行后控制台应输出：\nC',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        String word = "Code";\n        System.out.println(word.charAt(0));\n    }\n}',
    goal: '学会使用 charAt(index) 访问字符串中的字符。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        String word = "Code";\n        System.out.println();\n    }\n}',
    hint: '字符串的第一个位置是 0，所以第一个字符是 word.charAt(0)。',
    language: 'java',
    className: 'Main',
    expectedOutput: 'C',
    knowledgePoints: ['String', 'charAt()', '下标'],
    answerKeywords: ['string word', 'word.charAt(0)', 'system.out.println']
  },
  {
    id: 24,
    chapter: 'java-basic',
    number: 24,
    title: '三声号角：循环拼接字符串',
    content:
      '字符串拼接可以放在循环里，逐步构造最终结果。\n本关重复拼接同一个词。',
    difficulty: 'easy',
    question:
      '请使用循环把字符串 Go 拼接 3 次，并输出最终结果。\n运行后控制台应输出：\nGoGoGo',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        String result = "";\n        for (int i = 1; i <= 3; i++) {\n            result += "Go";\n        }\n        System.out.println(result);\n    }\n}',
    goal: '学会在循环中更新字符串变量。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        String result = "";\n        for (int i = 1; i <= 3; i++) {\n            \n        }\n        System.out.println(result);\n    }\n}',
    hint: '每次循环执行 result += "Go";。',
    language: 'java',
    className: 'Main',
    expectedOutput: 'GoGoGo',
    knowledgePoints: ['字符串拼接', 'for 循环', '变量更新'],
    answerKeywords: ['string result', 'i <= 3', 'result +=', 'go']
  },
  {
    id: 25,
    chapter: 'java-basic',
    number: 25,
    title: '较强一击：方法返回较大值',
    content:
      '方法可以封装一段判断逻辑并返回结果。\n本关编写 max 方法返回两个数中较大的一个。',
    difficulty: 'easy',
    question:
      '请编写 static int max(int a, int b) 方法，返回 a 和 b 中较大的数。\n在 main 方法中输出 max(7, 9) 的结果。\n运行后控制台应输出：\n9',
    answer:
      'public class Main {\n    static int max(int a, int b) {\n        if (a > b) {\n            return a;\n        }\n        return b;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(max(7, 9));\n    }\n}',
    goal: '学会在方法中使用 if 和 return 返回不同结果。',
    starterCode:
      'public class Main {\n    static int max(int a, int b) {\n        if () {\n            return ;\n        }\n        return ;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(max(7, 9));\n    }\n}',
    hint: '如果 a > b 就 return a；否则 return b。',
    language: 'java',
    className: 'Main',
    expectedOutput: '9',
    knowledgePoints: ['方法', 'if', 'return', '比较'],
    answerKeywords: ['static int max', 'a > b', 'return a', 'return b']
  },
  {
    id: 26,
    chapter: 'java-basic',
    number: 26,
    title: '偶数法印：boolean 返回值',
    content:
      '方法不仅能返回数字，也能返回 boolean。\n本关编写 isEven 方法判断一个数是否为偶数。',
    difficulty: 'easy',
    question:
      '请编写 static boolean isEven(int n) 方法，当 n 是偶数时返回 true。\n在 main 方法中输出 isEven(8) 的结果。\n运行后控制台应输出：\ntrue',
    answer:
      'public class Main {\n    static boolean isEven(int n) {\n        return n % 2 == 0;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(isEven(8));\n    }\n}',
    goal: '学会让方法返回 boolean 表达式结果。',
    starterCode:
      'public class Main {\n    static boolean isEven(int n) {\n        return ;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(isEven(8));\n    }\n}',
    hint: '偶数判断表达式是 n % 2 == 0，可以直接 return 这个表达式。',
    language: 'java',
    className: 'Main',
    expectedOutput: 'true',
    knowledgePoints: ['boolean', '方法返回值', '取余运算'],
    answerKeywords: ['static boolean isEven', 'n % 2 == 0', 'isEven(8)']
  },
  {
    id: 27,
    chapter: 'java-basic',
    number: 27,
    title: '团队总分：数组作为参数',
    content:
      '方法的参数也可以是数组。\n本关把数组求和逻辑封装到 sum 方法中。',
    difficulty: 'easy',
    question:
      '请编写 static int sum(int[] nums) 方法，返回数组元素总和。\n在 main 方法中创建 {1, 2, 3, 4, 5} 并输出 sum 的结果。\n运行后控制台应输出：\n15',
    answer:
      'public class Main {\n    static int sum(int[] nums) {\n        int total = 0;\n        for (int num : nums) {\n            total += num;\n        }\n        return total;\n    }\n\n    public static void main(String[] args) {\n        int[] nums = {1, 2, 3, 4, 5};\n        System.out.println(sum(nums));\n    }\n}',
    goal: '学会把数组传入方法并返回计算结果。',
    starterCode:
      'public class Main {\n    static int sum(int[] nums) {\n        int total = 0;\n        for (int num : nums) {\n            \n        }\n        return total;\n    }\n\n    public static void main(String[] args) {\n        int[] nums = {1, 2, 3, 4, 5};\n        System.out.println(sum(nums));\n    }\n}',
    hint: '在循环里 total += num，最后 return total。',
    language: 'java',
    className: 'Main',
    expectedOutput: '15',
    knowledgePoints: ['数组参数', '方法封装', '增强 for', 'return'],
    answerKeywords: ['static int sum', 'int[] nums', 'total += num', 'sum(nums)']
  },
  {
    id: 28,
    chapter: 'java-basic',
    number: 28,
    title: '字母追踪：统计字符',
    content:
      '字符串也可以通过循环逐个字符检查。\n本关统计 banana 中字母 a 出现的次数。',
    difficulty: 'easy',
    question:
      '请声明 String word = "banana"，统计字符 a 出现的次数并输出。\n运行后控制台应输出：\n3',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        String word = "banana";\n        int count = 0;\n        for (int i = 0; i < word.length(); i++) {\n            if (word.charAt(i) == \'a\') {\n                count++;\n            }\n        }\n        System.out.println(count);\n    }\n}',
    goal: '学会使用 charAt 和 length 遍历字符串。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        String word = "banana";\n        int count = 0;\n        for (int i = 0; i < word.length(); i++) {\n            if () {\n                \n            }\n        }\n        System.out.println(count);\n    }\n}',
    hint: '用 word.charAt(i) == \'a\' 判断当前字符是不是 a。',
    language: 'java',
    className: 'Main',
    expectedOutput: '3',
    knowledgePoints: ['charAt()', 'length()', '字符比较', '计数器'],
    answerKeywords: ['word.length()', 'word.charAt(i)', "'a'", 'count++']
  },
  {
    id: 29,
    chapter: 'java-basic',
    number: 29,
    title: '反向咒语：字符串反转',
    content:
      '从字符串末尾往前遍历，可以得到反转后的文本。\n本关反转 Java 这个单词。',
    difficulty: 'easy',
    question:
      '请声明 String word = "Java"，使用循环生成反转字符串并输出。\n运行后控制台应输出：\navaJ',
    answer:
      'public class Main {\n    public static void main(String[] args) {\n        String word = "Java";\n        String reversed = "";\n        for (int i = word.length() - 1; i >= 0; i--) {\n            reversed += word.charAt(i);\n        }\n        System.out.println(reversed);\n    }\n}',
    goal: '学会倒序循环处理字符串。',
    starterCode:
      'public class Main {\n    public static void main(String[] args) {\n        String word = "Java";\n        String reversed = "";\n        for (int i = ; i >= 0; i--) {\n            \n        }\n        System.out.println(reversed);\n    }\n}',
    hint: '起点是 word.length() - 1；每轮把 word.charAt(i) 拼到 reversed 后面。',
    language: 'java',
    className: 'Main',
    expectedOutput: 'avaJ',
    knowledgePoints: ['倒序循环', '字符串拼接', 'charAt()'],
    answerKeywords: ['word.length() - 1', 'i--', 'reversed +=', 'word.charAt(i)']
  },
  {
    id: 30,
    chapter: 'java-basic',
    number: 30,
    title: '成绩报告：阶段综合',
    content:
      '本关综合数组、循环、判断和方法，把前面学过的基础模式组合起来。\n你将统计及格人数并计算平均分。',
    difficulty: 'medium',
    question:
      '请编写 static int average(int[] scores) 方法返回平均分。\n在 main 方法中创建 scores = {70, 85, 92, 58}，统计大于等于 60 的及格人数，并输出：\nPassed: 3\nAverage: 76',
    answer:
      'public class Main {\n    static int average(int[] scores) {\n        int sum = 0;\n        for (int score : scores) {\n            sum += score;\n        }\n        return sum / scores.length;\n    }\n\n    public static void main(String[] args) {\n        int[] scores = {70, 85, 92, 58};\n        int passed = 0;\n        for (int score : scores) {\n            if (score >= 60) {\n                passed++;\n            }\n        }\n        System.out.println("Passed: " + passed);\n        System.out.println("Average: " + average(scores));\n    }\n}',
    goal: '综合使用数组遍历、条件统计、方法参数和返回值。',
    starterCode:
      'public class Main {\n    static int average(int[] scores) {\n        int sum = 0;\n        for (int score : scores) {\n            \n        }\n        return ;\n    }\n\n    public static void main(String[] args) {\n        int[] scores = {70, 85, 92, 58};\n        int passed = 0;\n        for (int score : scores) {\n            if () {\n                \n            }\n        }\n        System.out.println("Passed: " + passed);\n        System.out.println("Average: " + average(scores));\n    }\n}',
    hint: 'average 方法里求 sum / scores.length；main 方法里用 score >= 60 判断及格并 passed++。',
    language: 'java',
    className: 'Main',
    expectedOutput: 'Passed: 3\nAverage: 76',
    knowledgePoints: ['阶段综合', '数组参数', '条件统计', '方法返回值'],
    answerKeywords: ['static int average', 'scores.length', 'score >= 60', 'passed++', 'average(scores)']
  }
]

const createDraftLevel = ({ id, chapter, number, title, difficulty = 'medium' }) => ({
  id,
  chapter,
  number,
  title,
  content: '本关正在设计中，后续会补充完整讲解、代码模板和验证规则。',
  difficulty,
  question: '本关正在制作中，请先完成当前已开放的关卡。',
  answer: '',
  goal: '规划中的课程节点。',
  starterCode: '',
  hint: '本关尚未开放。',
  draft: true
})

const javaBasicDraftLevels = Array.from({ length: 20 }, (_, index) => {
  const id = 31 + index
  return createDraftLevel({
    id,
    chapter: 'java-basic',
    number: id,
    title: `Java 入门篇规划关卡 ${id}`,
    difficulty: id <= 35 ? 'easy' : 'medium'
  })
})

const javaAdvancedDraftLevels = Array.from({ length: 50 }, (_, index) => {
  const id = 51 + index
  return createDraftLevel({
    id,
    chapter: 'java-advanced',
    number: index + 1,
    title: `Java 进阶篇规划关卡 ${index + 1}`,
    difficulty: index < 20 ? 'medium' : 'hard'
  })
})

const courseLevels = [
  ...beginnerLevels.map((level) => ({ ...level, chapter: 'java-basic' })),
  ...javaBasicFlowLevels,
  ...javaBasicDraftLevels,
  ...javaAdvancedDraftLevels
]

const defaultAchievements = [
  {
    id: 1,
    key: 'first_clear',
    name: '冒险启程',
    description: '第一次通关主线关卡。',
    category: 'mainline',
    metric: 'completedCount',
    target: 1
  },
  {
    id: 2,
    key: 'first_three_star',
    name: '三星初体验',
    description: '第一次以 3 星完成关卡。',
    category: 'mastery',
    metric: 'threeStarCount',
    target: 1
  },
  {
    id: 3,
    key: 'five_clears',
    name: '新手村熟面孔',
    description: '累计通关 5 个开放关卡。',
    category: 'mainline',
    metric: 'completedCount',
    target: 5
  },
  {
    id: 4,
    key: 'ten_clears',
    name: '稳定推进者',
    description: '累计通关 10 个开放关卡。',
    category: 'mainline',
    metric: 'completedCount',
    target: 10
  },
  {
    id: 5,
    key: 'first_hint',
    name: '会问问题的人',
    description: '第一次使用分层提示。',
    category: 'agent',
    metric: 'hintCount',
    target: 1
  },
  {
    id: 6,
    key: 'ten_learning_events',
    name: '持续练习',
    description: '累计产生 10 次学习事件。',
    category: 'agent',
    metric: 'learningEventCount',
    target: 10
  },
  {
    id: 7,
    key: 'first_ai_help',
    name: '请教 AI 导师',
    description: '第一次使用课前 AI 导学。',
    category: 'agent',
    metric: 'aiHelpCount',
    target: 1
  }
]

function upsertCourseLevels() {
  const nextLevels = [...db.data.levels]

  courseLevels.forEach((courseLevel) => {
    const index = nextLevels.findIndex((level) => level.id === courseLevel.id)
    if (index >= 0) {
      nextLevels[index] = courseLevel
    } else {
      nextLevels.push(courseLevel)
    }
  })

  db.data.levels = nextLevels
    .filter((level) => level.id >= 1 && level.id <= 100)
    .sort((a, b) => a.id - b.id)
}

function upsertAchievements() {
  const nextAchievements = [...db.data.achievements]

  defaultAchievements.forEach((achievement) => {
    const index = nextAchievements.findIndex((item) => item.key === achievement.key)
    if (index >= 0) {
      nextAchievements[index] = { ...nextAchievements[index], ...achievement }
    } else {
      nextAchievements.push(achievement)
    }
  })

  db.data.achievements = nextAchievements
    .filter((achievement) =>
      defaultAchievements.some((item) => item.key === achievement.key)
    )
    .sort((a, b) => a.id - b.id)
}

function normalizeDataShape() {
  db.data.users = db.data.users.map((user) => {
    const starBalance = user.starBalance ?? user.totalStars ?? 0

    return {
      ...user,
      starBalance,
      totalStars: starBalance,
      ladderScore: user.ladderScore ?? 0,
      ladderSolved: user.ladderSolved ?? 0,
      avatarFrame: user.avatarFrame ?? null
    }
  })

  db.data.progress = db.data.progress.map((item) => ({
    ...item,
    hintLevel: item.hintLevel ?? (item.hintUsed ? 2 : 0),
    hintUsed: item.hintUsed ?? Boolean(item.hintLevel)
  }))

  db.data.ladderProblems = db.data.ladderProblems || []
  db.data.achievements = db.data.achievements || []
  db.data.userAchievements = (db.data.userAchievements || []).map((item) => ({
    ...item,
    unlockedAt: item.unlockedAt || new Date().toISOString()
  }))
  db.data.learningEvents = db.data.learningEvents || []
}

async function ensureDemoAccount() {
  const existingDemo = db.data.users.find((user) => user.username === 'demo')
  if (existingDemo) return

  const userId = getNextId(db.data.users)
  const createdAt = new Date().toISOString()
  const password = await bcrypt.hash('123456', 10)

  db.data.users.push({
    id: userId,
    username: 'demo',
    password,
    gender: 'male',
    starBalance: 8,
    totalStars: 8,
    totalScore: 80,
    ladderScore: 120,
    ladderSolved: 3,
    avatarFrame: null,
    classId: 1,
    skinFace: '默认脸型',
    skinHair: '默认发型',
    skinCoat: '默认外套',
    createdAt
  })

  ;[1, 5, 9].forEach((skinId) => {
    db.data.userSkins.push({
      id: getNextId(db.data.userSkins),
      userId,
      skinId
    })
  })

  const demoProgress = [
    { levelId: 1, stars: 3, score: 30, hintLevel: 0 },
    { levelId: 2, stars: 2, score: 20, hintLevel: 2 },
    { levelId: 3, stars: 3, score: 30, hintLevel: 0 }
  ]

  demoProgress.forEach((item) => {
    db.data.progress.push({
      userId,
      levelId: item.levelId,
      stars: item.stars,
      score: item.score,
      completed: true,
      hintUsed: item.hintLevel > 0,
      hintLevel: item.hintLevel
    })
  })

  const addLearningEvent = ({ levelId, stars, errorType, hintLevel = 0 }) => {
    const level = db.data.levels.find((item) => item.id === levelId)
    db.data.learningEvents.push({
      id: getNextId(db.data.learningEvents),
      userId,
      levelId,
      stars,
      passed: stars >= 1,
      errorType,
      hintLevel,
      knowledgePoints: Array.isArray(level?.knowledgePoints) ? level.knowledgePoints : [],
      createdAt: new Date().toISOString()
    })
  }

  addLearningEvent({ levelId: 1, stars: 3, errorType: 'passed' })
  addLearningEvent({ levelId: 2, stars: 0, errorType: 'hint_used', hintLevel: 2 })
  addLearningEvent({ levelId: 2, stars: 2, errorType: 'near_miss', hintLevel: 2 })
  addLearningEvent({ levelId: 3, stars: 3, errorType: 'passed' })
}

// 初始化数据库
async function initDB() {
  await mkdir(path.dirname(file), { recursive: true })
  await db.read()
  normalizeDataShape()
  
  // 初始化皮肤
  if (db.data.skins.length === 0) {
    db.data.skins = [
      { id: 1, name: '默认脸型', type: 'face', price: 0 },
      { id: 2, name: '阳光型', type: 'face', price: 10 },
      { id: 3, name: '酷帅型', type: 'face', price: 20 },
      { id: 4, name: '可爱型', type: 'face', price: 15 },
      { id: 5, name: '默认发型', type: 'hair', price: 0 },
      { id: 6, name: '短发', type: 'hair', price: 10 },
      { id: 7, name: '长发', type: 'hair', price: 15 },
      { id: 8, name: '卷发', type: 'hair', price: 20 },
      { id: 9, name: '默认外套', type: 'coat', price: 0 },
      { id: 10, name: '休闲装', type: 'coat', price: 15 },
      { id: 11, name: '运动装', type: 'coat', price: 20 },
      { id: 12, name: '正装', type: 'coat', price: 30 }
    ]
  }
  
  // 初始化关卡
  if (db.data.levels.length === 0) {
    db.data.levels = courseLevels
  } else {
    upsertCourseLevels()
  }

  if (db.data.achievements.length === 0) {
    db.data.achievements = defaultAchievements
  } else {
    upsertAchievements()
  }

  await ensureDemoAccount()
  
  await db.write()
}

await initDB()

export default db
