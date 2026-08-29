// ─────────────────────────────────────────────────────────────
//  Vibrant School — генератор демо-данных учебного центра.
//  Детерминированный (seeded PRNG), чтобы данные не «прыгали»
//  между перезагрузками до первого сохранения в localStorage.
// ─────────────────────────────────────────────────────────────
import { courseDesc, courseName } from './i18n.js'

export const SEED_VERSION = 'vibrant-v2'

export const CENTER = {
  name: 'Vibrant School',
  experienceYears: 10,
  phone: '+998 90 123-45-67',
  address: 'г. Ташкент, ул. Амира Темура 21',
}

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rnd = mulberry32(20260830)
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const int = (min, max) => min + Math.floor(rnd() * (max - min + 1))
const chance = (p) => rnd() < p

const TODAY = new Date('2026-08-30T00:00:00')
const DAY = 86400000
const iso = (d) => new Date(d).toISOString().slice(0, 10)
const shift = (base, days) => iso(new Date(base).getTime() + days * DAY)
const minDate = (a, b) => (a < b ? a : b)

// ─── Курсы ───────────────────────────────────────────────────
export const COURSES = [
  {
    id: 'english',
    short: 'ENG',
    get name() { return courseName('english') },
    get description() { return courseDesc('english') },
    color: '#6366f1',

    levels: ['Beginner', 'Pre-Intermediate', 'Intermediate', 'IELTS 6.5+', 'Multilevel B2', 'Multilevel C1'],
    totalLessons: 72,
    price: 600000,
  },
  {
    id: 'math',
    short: 'MATH',
    get name() { return courseName('math') },
    get description() { return courseDesc('math') },
    color: '#0ea5e9',

    levels: ['5–7 класс', '8–9 класс', '10–11 класс', 'Подготовка к ВУЗу'],
    totalLessons: 64,
    price: 550000,
  },
  {
    id: 'russian',
    short: 'RUS',
    get name() { return courseName('russian') },
    get description() { return courseDesc('russian') },
    color: '#f59e0b',

    levels: ['Начальный', 'Средний', 'Продвинутый'],
    totalLessons: 60,
    price: 500000,
  },
  {
    id: 'native',
    short: 'NAT',
    get name() { return courseName('native') },
    get description() { return courseDesc('native') },
    color: '#10b981',

    levels: ['Начальный', 'Средний', 'Выпускной класс'],
    totalLessons: 56,
    price: 450000,
  },
  {
    id: 'history',
    short: 'HIST',
    get name() { return courseName('history') },
    get description() { return courseDesc('history') },
    color: '#ef4444',

    levels: ['Базовый', 'Углублённый', 'Абитуриент'],
    totalLessons: 52,
    price: 450000,
  },
]

export const courseById = (id) => COURSES.find((c) => c.id === id)

// ─── Имена ───────────────────────────────────────────────────
const MALE = ['Азиз', 'Бекзод', 'Дилшод', 'Жасур', 'Икром', 'Камол', 'Лазиз', 'Мухаммад', 'Нодир', 'Отабек', 'Рустам', 'Санжар', 'Темур', 'Улугбек', 'Фаррух', 'Шохрух', 'Элдор', 'Юсуф', 'Артём', 'Даниил', 'Кирилл', 'Максим', 'Никита', 'Роман', 'Аброр', 'Хуршид']
const FEMALE = ['Азиза', 'Барно', 'Гулнора', 'Дилноза', 'Зарина', 'Камила', 'Лола', 'Малика', 'Нигора', 'Озода', 'Робия', 'Сабина', 'Умида', 'Феруза', 'Шахло', 'Юлдуз', 'Анастасия', 'Виктория', 'Дарья', 'Екатерина', 'Мария', 'София', 'Севара', 'Нилуфар']
const SURNAME = ['Абдуллаев', 'Азимов', 'Бекмуродов', 'Валиев', 'Ганиев', 'Джураев', 'Эргашев', 'Жумаев', 'Зокиров', 'Ибрагимов', 'Каримов', 'Латипов', 'Мирзаев', 'Назаров', 'Обидов', 'Пулатов', 'Рахимов', 'Саидов', 'Тошматов', 'Умаров', 'Файзиев', 'Хакимов', 'Шарипов', 'Юсупов', 'Якубов', 'Иванов', 'Петров', 'Смирнов', 'Кузнецов', 'Соколов']

function person() {
  const female = chance(0.5)
  const first = female ? pick(FEMALE) : pick(MALE)
  const last = pick(SURNAME) + (female ? 'а' : '')
  return { name: last + ' ' + first, female }
}

const phone = () => '+998 ' + int(90, 99) + ' ' + int(100, 999) + '-' + int(10, 99) + '-' + int(10, 99)

const TRANSLIT = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya' }
const translit = (s) => s.toLowerCase().replace(/[а-яё]/g, (ch) => TRANSLIT[ch] ?? ch)

// ─── Учителя ─────────────────────────────────────────────────
const TEACHER_COURSES = [
  'english', 'english', 'english', 'english', 'english', 'english',
  'math', 'math', 'math', 'math',
  'russian', 'russian', 'russian',
  'native', 'native', 'native',
  'history', 'history',
]

function buildTeachers() {
  const used = new Set()
  return TEACHER_COURSES.map((courseId, i) => {
    let p = person()
    let guard = 0
    while (used.has(p.name) && guard++ < 60) p = person()
    used.add(p.name)
    const [last, first] = p.name.split(' ')
    return {
      id: 'T' + String(i + 1).padStart(2, '0'),
      role: 'teacher',
      name: p.name,
      login: translit(first) + '.' + translit(last),
      password: 'teacher',
      courseId,
      title: courseId === 'english' ? pick(['IELTS Trainer', 'Senior Teacher', 'Speaking Coach', 'Multilevel Expert']) : null,
      experience: int(2, 14),
      phone: phone(),
      email: translit(first) + '.' + translit(last) + '@vibrant.uz',
    }
  })
}

// ─── Группы ──────────────────────────────────────────────────
const SCHEDULES = [
  { days: [1, 3, 5], time: '09:00' },
  { days: [1, 3, 5], time: '14:00' },
  { days: [1, 3, 5], time: '18:00' },
  { days: [2, 4, 6], time: '10:00' },
  { days: [2, 4, 6], time: '16:00' },
  { days: [2, 4, 6], time: '19:00' },
  { days: [6, 0], time: '11:00' },
]

function buildGroups(teachers) {
  const groups = []
  let n = 0
  teachers.forEach((t) => {
    const course = courseById(t.courseId)
    const count = t.courseId === 'english' ? 2 : chance(0.5) ? 2 : 1
    for (let k = 0; k < count; k++) {
      n++
      const schedule = pick(SCHEDULES)
      groups.push({
        id: 'G' + String(n).padStart(3, '0'),
        courseId: t.courseId,
        teacherId: t.id,
        name: course.short + '-' + String(n).padStart(2, '0'),
        level: pick(course.levels),
        scheduleDays: schedule.days,
        scheduleTime: schedule.time,
        room: int(1, 12),
        startedAt: shift(TODAY, -int(30, 240)),
        lessonsDone: 0,
      })
    }
  })
  groups.forEach((g) => {
    const total = courseById(g.courseId).totalLessons
    g.lessonsDone = Math.min(total, int(Math.round(total * 0.15), Math.round(total * 0.85)))
  })
  return groups
}

// ─── Ученики, записи на курсы, платежи ───────────────────────
function buildStudents(groups) {
  const students = []
  const enrollments = []
  const payments = []
  let eN = 0
  let pN = 0
  const used = new Set()

  for (let i = 0; i < 118; i++) {
    let p = person()
    let guard = 0
    while (used.has(p.name) && guard++ < 80) p = person()
    used.add(p.name)
    const [last, first] = p.name.split(' ')
    const id = 'S' + String(i + 1).padStart(3, '0')
    const age = chance(0.25) ? int(19, 41) : int(8, 18)

    students.push({
      id,
      role: 'student',
      name: p.name,
      login: translit(first) + '.' + translit(last),
      password: 'student',
      age,
      phone: phone(),
      parentPhone: age < 18 ? phone() : null,
      email: translit(first) + '.' + translit(last) + '@mail.uz',
      joinedAt: shift(TODAY, -int(20, 400)),
      note: '',
    })

    // 1–3 курса на ученика (разные предметы)
    const howMany = chance(0.42) ? 2 : chance(0.12) ? 3 : 1
    const chosen = []
    for (let k = 0; k < howMany; k++) {
      const g = pick(groups)
      if (chosen.some((x) => x.courseId === g.courseId)) continue
      chosen.push(g)
    }

    chosen.forEach((g) => {
      eN++
      const course = courseById(g.courseId)
      // 66% оплачено, 13% истекает на днях, 21% просрочено
      const roll = rnd()
      let paidUntil
      if (roll < 0.66) paidUntil = shift(TODAY, int(6, 34))
      else if (roll < 0.79) paidUntil = shift(TODAY, int(1, 5))
      else paidUntil = shift(TODAY, -int(1, 40))

      const lessons = Math.max(0, g.lessonsDone - int(0, 6))
      const held = Math.max(1, lessons)
      const enrollment = {
        id: 'E' + String(eN).padStart(4, '0'),
        studentId: id,
        groupId: g.id,
        courseId: g.courseId,
        enrolledAt: shift(TODAY, -int(20, 300)),
        paidUntil,
        frozen: chance(0.03),
        pricePerMonth: course.price,
        lessonsCompleted: lessons,
        attendedLessons: Math.round(held * (0.6 + rnd() * 0.4)),
        totalLessonsHeld: held,
      }
      enrollments.push(enrollment)

      const monthsPaid = int(1, 5)
      for (let m = monthsPaid; m >= 1; m--) {
        pN++
        payments.push({
          id: 'P' + String(pN).padStart(4, '0'),
          enrollmentId: enrollment.id,
          studentId: id,
          courseId: g.courseId,
          amount: course.price,
          months: 1,
          method: pick(['cash', 'click', 'payme', 'terminal']),
          paidAt: minDate(shift(paidUntil, -30 * m), iso(TODAY)),
          acceptedBy: 'A01',
          comment: '',
        })
      }
    })
  }
  return { students, enrollments, payments }
}

// ─── Домашние задания ────────────────────────────────────────
const HW_TITLES = {
  english: ['Unit 3: Present Perfect — exercises', 'Essay: Advantages of online learning (250 words)', 'IELTS Writing Task 2 — Opinion essay', 'Vocabulary list 12 + sentences', 'Listening practice: Cambridge Test 4', 'Speaking Part 2 — cue card recording', 'Reading: True / False / Not Given', 'Grammar: Conditionals 1–3', 'Multilevel Writing: Formal letter', 'Phrasal verbs — quiz'],
  math: ['Квадратные уравнения — №112–130', 'Функции и графики: построение', 'Тригонометрия: основные тождества', 'Прогрессии — самостоятельная работа', 'Производная: правила дифференцирования', 'Текстовые задачи на движение', 'Логарифмы — упражнения 45–60', 'Стереометрия: объём тел', 'Вероятность и статистика', 'Контрольная: повторение темы'],
  russian: ['Сочинение-рассуждение (150 слов)', 'Причастный и деепричастный оборот', 'Орфография: Н и НН в суффиксах', 'Изложение по тексту Паустовского', 'Пунктуация в сложном предложении', 'Лексика: паронимы и синонимы', 'Морфологический разбор слов', 'Диктант с грамматическим заданием', 'Стили речи — анализ текста', 'Тест: подготовка к аттестации'],
  native: ['Ona tili: sifat darajalari — mashqlar', 'Insho: «Mening yurtim» (200 so‘z)', 'Sintaktik tahlil — 5 gap', 'Imlo qoidalari: bosh harflar', 'Matn tahlili va reja tuzish', 'Fonetik tahlil — mashq 34', 'Frazeologizmlar lug‘ati', 'Bayon: badiiy matn', 'Nutq uslublari — jadval', 'Nazorat ishi: takrorlash'],
  history: ['Амир Темур: конспект по главе 4', 'Хронология: Великий шёлковый путь', 'Эссе: Джадидское движение', 'Тест: Древний мир (20 вопросов)', 'Карта: государства Средней Азии', 'Реформы XX века — таблица', 'Вторая мировая война: даты', 'Независимость Узбекистана — доклад', 'Исторические источники: анализ', 'Повторение: контрольный тест'],
}

function buildHomework(groups, enrollments) {
  const assignments = []
  const submissions = []
  let aN = 0
  let sN = 0

  groups.forEach((g) => {
    const titles = HW_TITLES[g.courseId]
    const count = int(6, 10)
    for (let i = 0; i < count; i++) {
      aN++
      const dueOffset = -((count - i) * 7) + int(0, 4)
      assignments.push({
        id: 'H' + String(aN).padStart(4, '0'),
        groupId: g.id,
        courseId: g.courseId,
        teacherId: g.teacherId,
        title: titles[i % titles.length],
        description: '',
        maxScore: 100,
        assignedAt: shift(TODAY, dueOffset - 7),
        dueDate: shift(TODAY, dueOffset),
      })
    }
  })

  const byGroup = {}
  assignments.forEach((a) => {
    if (!byGroup[a.groupId]) byGroup[a.groupId] = []
    byGroup[a.groupId].push(a)
  })

  enrollments.forEach((e) => {
    const list = byGroup[e.groupId] || []
    const skill = 0.45 + rnd() * 0.55 // «характер» ученика влияет на оценки
    list.forEach((a) => {
      const overdue = new Date(a.dueDate) < TODAY
      sN++
      let status = 'assigned'
      let score = null
      let feedback = ''
      let submittedAt = null
      let gradedAt = null

      if (overdue) {
        const r = rnd()
        if (r < 0.08 + (1 - skill) * 0.25) {
          status = 'missing'
        } else if (r < 0.26) {
          status = 'submitted'
          submittedAt = shift(a.dueDate, -int(0, 2))
        } else {
          status = 'graded'
          submittedAt = shift(a.dueDate, -int(0, 3))
          gradedAt = shift(a.dueDate, int(1, 3))
          score = Math.max(35, Math.min(100, Math.round(skill * 100 + (rnd() * 24 - 12))))
          feedback = score >= 90 ? 'excellent' : score >= 75 ? 'good' : score >= 60 ? 'ok' : 'weak'
        }
      } else if (chance(0.35)) {
        status = 'submitted'
        submittedAt = shift(TODAY, -int(0, 2))
      }

      submissions.push({
        id: 'SB' + String(sN).padStart(5, '0'),
        assignmentId: a.id,
        studentId: e.studentId,
        enrollmentId: e.id,
        groupId: e.groupId,
        status,
        score,
        feedback,
        submittedAt,
        gradedAt,
        answer: status === 'assigned' ? '' : 'demo',
      })
    })
  })

  return { assignments, submissions }
}

// ─── Администраторы ──────────────────────────────────────────
const ADMINS = [
  { id: 'A01', role: 'admin', name: 'Исломов Исроил', login: 'admin', password: 'admin', title: 'Директор центра', phone: '+998 90 123-45-67' },
  { id: 'A02', role: 'admin', name: 'Рахимова Севара', login: 'reception', password: 'admin', title: 'Администратор ресепшн', phone: '+998 93 555-11-22' },
]

export function buildDatabase() {
  const teachers = buildTeachers()
  const groups = buildGroups(teachers)
  const { students, enrollments, payments } = buildStudents(groups)
  const { assignments, submissions } = buildHomework(groups, enrollments)

  return {
    version: SEED_VERSION,
    admins: ADMINS,
    teachers,
    students,
    groups,
    enrollments,
    payments,
    assignments,
    submissions,
    announcements: [
      { id: 'AN1', key: 'c1', date: shift(TODAY, -2), author: 'A01' },
      { id: 'AN2', key: 'ielts', date: shift(TODAY, -5), author: 'A01' },
      { id: 'AN3', key: 'payment', date: shift(TODAY, -1), author: 'A02' },
    ],
  }
}
