/* =========================================================
   Pixel Habit Quest — логика приложения
   Чистый JavaScript, без зависимостей и внешних запросов.
   Всё состояние хранится в localStorage.
   ========================================================= */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     Константы и справочники
     --------------------------------------------------------- */
  const STORAGE_KEY = 'pixel-habit-quest:v1';
  const A = './assets/';
  const PERFECT_BONUS = 15;
  const MAX_HAPPINESS = 100;

  const DIFFICULTY = {
    easy: { label: 'Легко', xp: 10 },
    medium: { label: 'Средне', xp: 15 },
    hard: { label: 'Сложно', xp: 20 },
  };

  const HABIT_ICONS = [
    { id: 'water', label: 'Вода' },
    { id: 'fitness', label: 'Спорт' },
    { id: 'book', label: 'Чтение' },
    { id: 'sleep', label: 'Сон' },
    { id: 'food', label: 'Еда' },
    { id: 'music', label: 'Музыка' },
    { id: 'write', label: 'Заметки' },
    { id: 'sparkle', label: 'Другое' },
  ];
  const HABIT_ICON_IDS = HABIT_ICONS.map((i) => i.id);

  const SUGGESTIONS = [
    { name: 'Выпить стакан воды', icon: 'water', level: 'easy' },
    { name: 'Зарядка 10 минут', icon: 'fitness', level: 'medium' },
    { name: 'Почитать 10 минут', icon: 'book', level: 'easy' },
    { name: 'Лечь спать до 23:00', icon: 'sleep', level: 'medium' },
    { name: 'Съесть фрукт', icon: 'food', level: 'easy' },
    { name: 'Записать мысли', icon: 'write', level: 'easy' },
  ];

  const STAGES = [
    { id: 'egg', min: 1, name: 'Яйцо' },
    { id: 'baby', min: 3, name: 'Малыш' },
    { id: 'teen', min: 6, name: 'Подросток' },
    { id: 'king', min: 10, name: 'Король' },
  ];

  const RARITY = {
    common: { label: 'Обычная', order: 0 },
    rare: { label: 'Редкая', order: 1 },
    epic: { label: 'Эпическая', order: 2 },
    legendary: { label: 'Легендарная', order: 3 },
  };

  const FRIENDS = [
    { id: 'mimi', name: 'Мими', avatar: 'friend-mimi.svg', level: 4, pace: 0.9 },
    { id: 'bubo', name: 'Бубо', avatar: 'friend-bubo.svg', level: 7, pace: 1.0 },
    { id: 'lulu', name: 'Лулу', avatar: 'friend-lulu.svg', level: 3, pace: 0.65 },
    { id: 'kiki', name: 'Кики', avatar: 'friend-kiki.svg', level: 11, pace: 1.1 },
  ];
  const FRIEND_BY_ID = Object.fromEntries(FRIENDS.map((f) => [f.id, f]));

  const CHALLENGES = [
    {
      id: 'sprint', title: 'Зефирный спринт',
      desc: 'Будь активен каждый из 3 дней подряд.',
      days: 3, goal: 3, type: 'days', unit: 'дн.', reward: 30,
      friends: ['mimi', 'lulu'],
    },
    {
      id: 'week', title: 'Неделя бодрости',
      desc: 'Сделай 10 отметок за 7 дней.',
      days: 7, goal: 10, type: 'checks', unit: 'отм.', reward: 60,
      friends: ['mimi', 'bubo', 'kiki'],
    },
    {
      id: 'marathon', title: 'Марафон месяца',
      desc: 'Набери 40 отметок за 30 дней.',
      days: 30, goal: 40, type: 'checks', unit: 'отм.', reward: 150,
      friends: ['bubo', 'lulu', 'kiki'],
    },
  ];

  const ACHIEVEMENTS = [
    {
      id: 'first_step', title: 'Первый шаг', desc: 'Отметь свою первую привычку.',
      icon: 'ach-first-step.svg', rarity: 'common', xp: 10,
      progress: (s) => ({ cur: s.stats.totalChecks, max: 1 }),
    },
    {
      id: 'streak_3', title: 'Искорка', desc: 'Серия из 3 дней подряд.',
      icon: 'ach-streak-3.svg', rarity: 'common', xp: 15,
      progress: (s) => ({ cur: bestStreakOf(s), max: 3 }),
    },
    {
      id: 'habits_5', title: 'Коллекционер', desc: 'Создай 5 привычек.',
      icon: 'ach-habits-5.svg', rarity: 'common', xp: 15,
      progress: (s) => ({ cur: s.stats.habitsCreated, max: 5 }),
    },
    {
      id: 'streak_7', title: 'Серия из 7 дней', desc: 'Будь активен 7 дней подряд.',
      icon: 'ach-streak-7.svg', rarity: 'rare', xp: 30,
      progress: (s) => ({ cur: bestStreakOf(s), max: 7 }),
    },
    {
      id: 'perfect_day', title: 'Идеальный день', desc: 'Выполни все привычки за день (от 2 привычек).',
      icon: 'ach-perfect-day.svg', rarity: 'rare', xp: 25,
      progress: (s) => ({ cur: s.stats.perfectDays, max: 1 }),
    },
    {
      id: 'level_5', title: 'Сердце питомца', desc: 'Достигни 5 уровня питомца.',
      icon: 'ach-level-5.svg', rarity: 'rare', xp: 30,
      progress: (s) => ({ cur: s.pet.maxLevel, max: 5 }),
    },
    {
      id: 'team', title: 'Командный игрок', desc: 'Вступи в совместный челлендж.',
      icon: 'ach-team.svg', rarity: 'rare', xp: 20,
      progress: (s) => ({ cur: s.stats.challengesJoined, max: 1 }),
    },
    {
      id: 'master', title: 'Мастер привычек', desc: 'Сделай 50 отметок.',
      icon: 'ach-checks-50.svg', rarity: 'epic', xp: 60,
      progress: (s) => ({ cur: s.stats.totalChecks, max: 50 }),
    },
    {
      id: 'challenge_win', title: 'Победитель', desc: 'Выиграй совместный челлендж.',
      icon: 'ach-challenge-win.svg', rarity: 'epic', xp: 60,
      progress: (s) => ({ cur: s.stats.challengesWon, max: 1 }),
    },
    {
      id: 'level_10', title: 'Королевская особа', desc: 'Достигни 10 уровня и стань королём.',
      icon: 'ach-level-10.svg', rarity: 'epic', xp: 100,
      progress: (s) => ({ cur: s.pet.maxLevel, max: 10 }),
    },
    {
      id: 'streak_30', title: 'Легенда месяца', desc: 'Будь активен 30 дней подряд.',
      icon: 'ach-streak-30.svg', rarity: 'legendary', xp: 200,
      progress: (s) => ({ cur: bestStreakOf(s), max: 30 }),
    },
  ];

  const PHRASES = {
    happy: [
      'Ты лучший! Так держать ♥',
      'Мур-р! Мне сегодня так хорошо!',
      'Я горжусь тобой!',
      'Давай сделаем ещё что-нибудь классное?',
    ],
    ok: [
      'Привет! Что сегодня отметим?',
      'Я рядом. Начнём с чего-нибудь маленького?',
      'Одна привычка — и мне станет веселее!',
    ],
    sad: [
      'Мне немного грустно... Отметим хоть одну привычку?',
      'Я скучала. Давай начнём с малого ♥',
      'Не страшно, что был перерыв. Я всё равно рада тебя видеть.',
    ],
    egg: [
      'Тук-тук... Я скоро вылуплюсь!',
      'В яйце тепло, когда ты занимаешься привычками.',
    ],
    allDone: [
      'Все дела на сегодня сделаны! Можно отдыхать ♥',
      'Вот это день! Я в восторге!',
    ],
    praise: [
      'Ура! Ещё один шаг!',
      'Так держать! Я чувствую, как расту.',
      'Вкуснятина! Спасибо за XP.',
      'Ты молодец!',
    ],
  };

  /* ---------------------------------------------------------
     Утилиты
     --------------------------------------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const pad = (n) => String(n).padStart(2, '0');
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const reduceMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function plural(n, forms) {
    const a = Math.abs(n) % 100;
    const b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  }

  /* --- даты (локальные, формат YYYY-MM-DD) --- */
  const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = (k) => {
    const [y, m, d] = k.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const validKey = (k) => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);
  const todayKey = () => toKey(new Date());
  const addDays = (key, n) => {
    const d = parseKey(key);
    d.setDate(d.getDate() + n);
    return toKey(d);
  };
  const diffDays = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);
  const fmtDate = (key) =>
    new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(parseKey(key));

  /* --- детерминированный «случайный» генератор для демо-друзей --- */
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  const rand01 = (seed) => (hash(seed) % 1000) / 1000;

  /* --- маленькие пиксельные иконки (8×8) --- */
  const BITMAPS = {
    check: ['........', '.......#', '......##', '#....##.', '##..##..', '.####...', '..##....', '........'],
    plus: ['...##...', '...##...', '...##...', '########', '########', '...##...', '...##...', '...##...'],
    edit: ['......#.', '.....###', '....###.', '...###..', '..###...', '.###....', '.##.....', '#.......'],
  };
  function bmp(name) {
    const rows = BITMAPS[name];
    let r = '';
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === '#') r += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      }
    });
    return `<svg class="px-ico" viewBox="0 0 8 8" aria-hidden="true" focusable="false" shape-rendering="crispEdges" fill="currentColor">${r}</svg>`;
  }

  /* ---------------------------------------------------------
     Хранилище (с запасным вариантом, если localStorage недоступен)
     --------------------------------------------------------- */
  const storage = (() => {
    try {
      const t = '__phq_test__';
      window.localStorage.setItem(t, t);
      window.localStorage.removeItem(t);
      return {
        get: (k) => window.localStorage.getItem(k),
        set: (k, v) => window.localStorage.setItem(k, v),
      };
    } catch (e) {
      const mem = {};
      return {
        get: (k) => (k in mem ? mem[k] : null),
        set: (k, v) => { mem[k] = v; },
      };
    }
  })();

  /* ---------------------------------------------------------
     Состояние
     --------------------------------------------------------- */
  function defaultState() {
    const today = todayKey();
    return {
      v: 1,
      createdAt: today,
      pet: { name: 'Зефирка', xp: 0, happiness: 70, maxLevel: 1 },
      habits: [],
      activity: {},
      lastSettled: addDays(today, -1),
      stats: {
        totalChecks: 0, perfectDays: 0, bestStreak: 0,
        habitsCreated: 0, challengesJoined: 0, challengesWon: 0, cheers: 0,
      },
      perfectDates: [],
      achievements: {},
      challenges: {},
      cheersSent: {},
    };
  }

  function normalize(raw) {
    const d = defaultState();
    if (!isObj(raw)) return d;
    const s = { ...d };
    s.createdAt = validKey(raw.createdAt) ? raw.createdAt : d.createdAt;
    s.lastSettled = validKey(raw.lastSettled) ? raw.lastSettled : d.lastSettled;

    const pet = isObj(raw.pet) ? raw.pet : {};
    s.pet = {
      name: typeof pet.name === 'string' && pet.name.trim() ? pet.name.trim().slice(0, 14) : d.pet.name,
      xp: Math.max(0, Number(pet.xp) || 0),
      happiness: clamp(Number.isFinite(Number(pet.happiness)) ? Number(pet.happiness) : d.pet.happiness, 0, MAX_HAPPINESS),
      maxLevel: Math.max(1, Math.floor(Number(pet.maxLevel) || 1)),
    };
    s.pet.maxLevel = Math.max(s.pet.maxLevel, levelInfo(s.pet.xp).level);

    const st = isObj(raw.stats) ? raw.stats : {};
    s.stats = { ...d.stats };
    Object.keys(d.stats).forEach((k) => { s.stats[k] = Math.max(0, Math.floor(Number(st[k]) || 0)); });

    s.habits = Array.isArray(raw.habits)
      ? raw.habits
          .filter((h) => isObj(h) && typeof h.id === 'string')
          .map((h) => {
            const log = {};
            if (isObj(h.log)) {
              Object.keys(h.log).forEach((k) => {
                const v = Number(h.log[k]);
                if (validKey(k) && v > 0) log[k] = Math.round(v);
              });
            }
            return {
              id: h.id,
              name: String(h.name || 'Привычка').slice(0, 30),
              icon: HABIT_ICON_IDS.includes(h.icon) ? h.icon : 'sparkle',
              level: DIFFICULTY[h.level] ? h.level : 'easy',
              createdAt: validKey(h.createdAt) ? h.createdAt : d.createdAt,
              log,
            };
          })
      : [];

    s.activity = {};
    if (isObj(raw.activity)) {
      Object.keys(raw.activity).forEach((k) => {
        const v = Math.floor(Number(raw.activity[k]) || 0);
        if (validKey(k) && v > 0) s.activity[k] = v;
      });
    }
    s.perfectDates = Array.isArray(raw.perfectDates) ? raw.perfectDates.filter(validKey) : [];

    s.achievements = {};
    if (isObj(raw.achievements)) {
      ACHIEVEMENTS.forEach((a) => {
        if (validKey(raw.achievements[a.id])) s.achievements[a.id] = raw.achievements[a.id];
      });
    }
    s.challenges = {};
    if (isObj(raw.challenges)) {
      CHALLENGES.forEach((c) => {
        const ch = raw.challenges[c.id];
        if (isObj(ch) && validKey(ch.joinedAt)) {
          s.challenges[c.id] = {
            joinedAt: ch.joinedAt,
            status: ['active', 'won', 'failed'].includes(ch.status) ? ch.status : 'active',
            wins: Math.max(0, Math.floor(Number(ch.wins) || 0)),
          };
        }
      });
    }
    s.cheersSent = {};
    if (isObj(raw.cheersSent)) {
      FRIENDS.forEach((f) => {
        if (validKey(raw.cheersSent[f.id])) s.cheersSent[f.id] = raw.cheersSent[f.id];
      });
    }
    return s;
  }

  function load() {
    try {
      const raw = storage.get(STORAGE_KEY);
      if (!raw) return defaultState();
      return normalize(JSON.parse(raw));
    } catch (e) {
      return defaultState();
    }
  }

  // Загружается в init(), когда уже определены все вспомогательные функции.
  let state = null;

  function save() {
    try {
      storage.set(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* хранилище переполнено или недоступно — игра продолжает работать в памяти */
    }
  }

  /* ---------------------------------------------------------
     Игровая математика
     --------------------------------------------------------- */
  // Суммарный XP, нужный для достижения уровня L.
  const xpToReach = (L) => 40 * (L - 1) + 10 * (L - 1) * (L - 2);

  function levelInfo(xp) {
    let level = 1;
    while (xp >= xpToReach(level + 1)) level++;
    return { level, base: xpToReach(level), next: xpToReach(level + 1) };
  }

  const stageOf = (level) => [...STAGES].reverse().find((s) => level >= s.min);
  const moodOf = (h) => (h >= 60 ? 'happy' : h >= 30 ? 'ok' : 'sad');

  function habitStreak(h, today) {
    let d = h.log[today] ? today : addDays(today, -1);
    let n = 0;
    while (h.log[d] && n < 4000) {
      n++;
      d = addDays(d, -1);
    }
    return n;
  }

  function globalStreak(s, today) {
    let d = s.activity[today] ? today : addDays(today, -1);
    let n = 0;
    while (s.activity[d] && n < 4000) {
      n++;
      d = addDays(d, -1);
    }
    return n;
  }

  function bestStreakOf(s) {
    return Math.max(s.stats.bestStreak, globalStreak(s, todayKey()));
  }

  const habitXp = (h, streak) => DIFFICULTY[h.level].xp + Math.min(Math.max(streak - 1, 0), 5) * 2;

  /* ---------------------------------------------------------
     Итоги прошедших дней (влияют на счастье питомца)
     --------------------------------------------------------- */
  function settleDays() {
    const today = todayKey();
    const yesterday = addDays(today, -1);
    let from = addDays(state.lastSettled, 1);
    if (diffDays(from, yesterday) > 13) from = addDays(yesterday, -13);
    const before = state.pet.happiness;

    for (let d = from; d <= yesterday; d = addDays(d, 1)) {
      const active = state.habits.filter((h) => h.createdAt <= d);
      if (!active.length) continue;
      const done = active.filter((h) => h.log[d]).length;
      const r = done / active.length;
      const delta = r === 1 ? 6 : r >= 0.5 ? 0 : r > 0 ? -6 : -12;
      state.pet.happiness = clamp(state.pet.happiness + delta, 0, MAX_HAPPINESS);
    }
    state.lastSettled = yesterday;
    return state.pet.happiness - before;
  }

  /* ---------------------------------------------------------
     Челленджи
     --------------------------------------------------------- */
  function challengeEnd(def, ch) {
    return addDays(ch.joinedAt, def.days - 1);
  }

  function challengeProgress(def, ch, today) {
    let cur = 0;
    const end = challengeEnd(def, ch);
    for (let d = ch.joinedAt; d <= end && d <= today; d = addDays(d, 1)) {
      const c = state.activity[d] || 0;
      cur += def.type === 'checks' ? c : c > 0 ? 1 : 0;
    }
    return cur;
  }

  function friendProgress(f, def, ch, today) {
    const e = clamp(diffDays(ch.joinedAt, today) + 1, 1, def.days);
    let best = 0;
    for (let i = 1; i <= e; i++) {
      const base = def.goal * f.pace * (i / def.days);
      const noise = (rand01(`${f.id}|${def.id}|${ch.joinedAt}|${i}`) - 0.5) * 0.14 * def.goal;
      best = Math.max(best, clamp(Math.round(base + noise), 0, def.goal));
    }
    return best;
  }

  function evaluateChallenges(ev) {
    const today = todayKey();
    CHALLENGES.forEach((def) => {
      const ch = state.challenges[def.id];
      if (!ch || ch.status !== 'active') return;
      const cur = challengeProgress(def, ch, today);
      if (cur >= def.goal) {
        const reward = ch.wins ? Math.round(def.reward / 3) : def.reward;
        ch.status = 'won';
        ch.wins = (ch.wins || 0) + 1;
        state.pet.xp += reward;
        state.stats.challengesWon += 1;
        ev.won = ev.won || [];
        ev.won.push({ def, reward });
      } else if (today > challengeEnd(def, ch)) {
        ch.status = 'failed';
        ev.failed = ev.failed || [];
        ev.failed.push(def);
      }
    });
  }

  /* ---------------------------------------------------------
     Лига недели
     --------------------------------------------------------- */
  function weekStartKey(today) {
    const dow = (parseKey(today).getDay() + 6) % 7;
    return addDays(today, -dow);
  }

  function myWeekScore(today) {
    const start = weekStartKey(today);
    let s = 0;
    for (let i = 0; i < 7; i++) {
      const k = addDays(start, i);
      if (k > today) break;
      s += (state.activity[k] || 0) * 10;
    }
    return s;
  }

  function friendWeekScore(f, today) {
    const start = weekStartKey(today);
    const days = diffDays(start, today) + 1;
    let total = 0;
    for (let i = 0; i < days; i++) {
      total += Math.round(f.pace * (8 + rand01(`${f.id}|${start}|${i}`) * 16));
    }
    return total;
  }

  /* ---------------------------------------------------------
     Уровни и достижения
     --------------------------------------------------------- */
  function trackLevel(ev) {
    const lv = levelInfo(state.pet.xp).level;
    if (lv > state.pet.maxLevel) {
      const prevStage = stageOf(state.pet.maxLevel);
      state.pet.maxLevel = lv;
      ev.levelUp = lv;
      const st = stageOf(lv);
      if (st.id !== prevStage.id) {
        ev.evolved = { from: ev.evolved ? ev.evolved.from : prevStage, to: st };
      }
    }
  }

  function checkAchievements(ev) {
    let any = false;
    ACHIEVEMENTS.forEach((a) => {
      if (state.achievements[a.id]) return;
      const p = a.progress(state);
      if (p.cur >= p.max) {
        state.achievements[a.id] = todayKey();
        state.pet.xp += a.xp;
        ev.unlocked = ev.unlocked || [];
        ev.unlocked.push(a);
        any = true;
      }
    });
    return any;
  }

  // Единая точка пересчёта после любого действия.
  function commit(ev) {
    evaluateChallenges(ev);
    trackLevel(ev);
    let guard = 0;
    while (checkAchievements(ev) && guard++ < 10) trackLevel(ev);
    const gs = globalStreak(state, todayKey());
    if (gs > state.stats.bestStreak) state.stats.bestStreak = gs;
    // достижения, зависящие от серии, могли открыться только что
    guard = 0;
    while (checkAchievements(ev) && guard++ < 10) trackLevel(ev);
  }

  /* ---------------------------------------------------------
     Действия
     --------------------------------------------------------- */
  function toggleHabit(id, anchorEl) {
    const h = state.habits.find((x) => x.id === id);
    if (!h) return;
    const today = todayKey();
    const rect = anchorEl ? anchorEl.getBoundingClientRect() : null;
    const ev = { rect };

    if (h.log[today]) {
      const xp = h.log[today];
      delete h.log[today];
      state.pet.xp = Math.max(0, state.pet.xp - xp);
      state.stats.totalChecks = Math.max(0, state.stats.totalChecks - 1);
      const c = (state.activity[today] || 1) - 1;
      if (c > 0) state.activity[today] = c; else delete state.activity[today];
      state.pet.happiness = clamp(state.pet.happiness - 3, 0, MAX_HAPPINESS);
      ev.undo = xp;
      ev.say = 'Ой, отметка снята. Ничего, это бывает.';
    } else {
      const streak = habitStreak(h, today) + 1;
      const xp = habitXp(h, streak);
      h.log[today] = xp;
      state.pet.xp += xp;
      state.stats.totalChecks += 1;
      state.activity[today] = (state.activity[today] || 0) + 1;
      state.pet.happiness = clamp(state.pet.happiness + 3, 0, MAX_HAPPINESS);
      ev.gain = xp;

      const allDone = state.habits.length >= 2 && state.habits.every((x) => x.log[today]);
      if (allDone && !state.perfectDates.includes(today)) {
        state.perfectDates.push(today);
        state.stats.perfectDays += 1;
        state.pet.xp += PERFECT_BONUS;
        state.pet.happiness = clamp(state.pet.happiness + 10, 0, MAX_HAPPINESS);
        ev.perfect = PERFECT_BONUS;
      }
      ev.say = state.habits.every((x) => x.log[today]) ? pick(PHRASES.allDone) : pick(PHRASES.praise);
    }
    commit(ev);
    save();
    renderAll();
    announce(ev);
  }

  function addHabit({ name, icon, level }) {
    const h = {
      id: `h${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim().slice(0, 30),
      icon: HABIT_ICON_IDS.includes(icon) ? icon : 'sparkle',
      level: DIFFICULTY[level] ? level : 'easy',
      createdAt: todayKey(),
      log: {},
    };
    state.habits.push(h);
    state.stats.habitsCreated += 1;
    const ev = { say: 'Новая привычка! Отметь её, когда выполнишь.' };
    commit(ev);
    save();
    renderAll();
    announce(ev);
  }

  function updateHabit(id, { name, icon, level }) {
    const h = state.habits.find((x) => x.id === id);
    if (!h) return;
    h.name = name.trim().slice(0, 30);
    h.icon = HABIT_ICON_IDS.includes(icon) ? icon : h.icon;
    h.level = DIFFICULTY[level] ? level : h.level;
    save();
    renderAll();
  }

  function deleteHabit(id) {
    state.habits = state.habits.filter((x) => x.id !== id);
    save();
    renderAll();
    say('Привычка удалена. Накопленный опыт остался со мной ♥');
  }

  function joinChallenge(id) {
    const def = CHALLENGES.find((c) => c.id === id);
    if (!def) return;
    const prev = state.challenges[id];
    if (prev && prev.status === 'active') return;
    state.challenges[id] = { joinedAt: todayKey(), status: 'active', wins: prev ? prev.wins : 0 };
    state.stats.challengesJoined += 1;
    const ev = { say: `Челлендж «${def.title}» начался! Вместе веселее.` };
    commit(ev); // отметки, сделанные сегодня, сразу засчитываются
    save();
    renderAll();
    announce(ev);
  }

  function cheerFriend(id) {
    const f = FRIEND_BY_ID[id];
    const today = todayKey();
    if (!f || state.cheersSent[id] === today) return;
    state.cheersSent[id] = today;
    state.stats.cheers += 1;
    state.pet.happiness = clamp(state.pet.happiness + 2, 0, MAX_HAPPINESS);
    save();
    renderAll();
    toast(`${A}icon-heart.svg`, `${f.name} получил(а) твоё сердечко!`);
  }

  function renamePet(name) {
    const n = name.trim().slice(0, 14);
    state.pet.name = n || 'Зефирка';
    save();
    renderAll();
  }

  function resetAll() {
    state = defaultState();
    save();
    renderAll();
    say('Начинаем всё заново! Я готова ♥');
    toast(`${A}icon-sprout.svg`, 'Прогресс сброшен. Новое приключение!');
  }

  /* ---------------------------------------------------------
     Отрисовка
     --------------------------------------------------------- */
  function renderIcons() {
    $$('[data-ico]').forEach((el) => {
      if (!el.dataset.rendered) {
        el.innerHTML = bmp(el.dataset.ico);
        el.dataset.rendered = '1';
      }
    });
  }

  function renderHeader() {
    const today = todayKey();
    $('#chip-streak').textContent = String(globalStreak(state, today));
    $('#chip-level').textContent = `Ур. ${levelInfo(state.pet.xp).level}`;
    const label = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    $('#today-date').textContent = label.charAt(0).toUpperCase() + label.slice(1);
  }

  function renderPet() {
    const info = levelInfo(state.pet.xp);
    const stage = stageOf(info.level);
    const mood = moodOf(state.pet.happiness);

    const img = $('#pet-img');
    const src = `${A}pet-${stage.id}-${mood}.svg`;
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    img.alt = `${state.pet.name}: ${stage.name}, настроение — ${mood === 'happy' ? 'радостное' : mood === 'ok' ? 'спокойное' : 'грустное'}`;

    const scene = $('#pet-scene');
    scene.dataset.mood = mood;
    scene.dataset.stage = stage.id;

    $('#pet-name').textContent = state.pet.name;
    $('#pet-stage').textContent = `${stage.name} · ур. ${info.level}`;

    const pct = Math.round(((state.pet.xp - info.base) / (info.next - info.base)) * 100);
    $('#xp-fill').style.width = `${clamp(pct, 0, 100)}%`;
    $('#xp-text').textContent = `${state.pet.xp - info.base} / ${info.next - info.base}`;
    $('#xp-bar').setAttribute('aria-valuenow', String(clamp(pct, 0, 100)));

    const joy = Math.round(state.pet.happiness);
    $('#joy-fill').style.width = `${joy}%`;
    $('#joy-text').textContent = `${joy}%`;
    $('#joy-bar').setAttribute('aria-valuenow', String(joy));

    $('#evo-track').innerHTML = STAGES.map((s) => {
      const reached = info.level >= s.min;
      const current = s.id === stage.id;
      const cls = current ? 'current' : reached ? 'reached' : 'locked';
      return `<li class="${cls}"><img src="${A}pet-${s.id}-happy.svg" alt="" width="40" height="40"><span>${s.name}</span><span>ур. ${s.min}${s.id === 'king' ? '+' : ''}</span></li>`;
    }).join('');
  }

  function weekDots(h, today) {
    let out = '';
    for (let i = 6; i >= 0; i--) {
      const k = addDays(today, -i);
      out += `<i class="${h.log[k] ? 'on' : ''}${i === 0 ? ' today' : ''}"></i>`;
    }
    return out;
  }

  function renderHabits() {
    const today = todayKey();
    const list = $('#habit-list');
    const total = state.habits.length;
    const done = state.habits.filter((h) => h.log[today]).length;
    $('#today-count').textContent = `${done}/${total}`;

    if (!total) {
      list.innerHTML = `<li class="empty pbox"><img src="${A}pet-egg-happy.svg" alt="" width="64" height="64"><p><b>Пока пусто</b><br>Добавь первую привычку — и твой питомец начнёт расти!</p></li>`;
    } else {
      list.innerHTML = state.habits.map((h) => {
        const isDone = !!h.log[today];
        const streak = habitStreak(h, today);
        const xp = isDone ? h.log[today] : habitXp(h, streak + 1);
        const name = esc(h.name);
        return `<li class="habit pbox${isDone ? ' done' : ''}" data-id="${esc(h.id)}">
          <img class="habit-ico" src="${A}habit-${h.icon}.svg" alt="" width="40" height="40">
          <div class="habit-main">
            <div class="habit-name">${name}</div>
            <div class="habit-meta">
              <span class="streak${streak ? '' : ' cold'}" title="Серия: ${streak} ${plural(streak, ['день', 'дня', 'дней'])}"><img src="${A}icon-flame.svg" alt="" width="16" height="16">${streak}</span>
              <span class="xp-pill">${isDone ? 'получено' : 'награда'} +${xp} XP</span>
            </div>
            <div class="week" aria-hidden="true">${weekDots(h, today)}</div>
          </div>
          <button class="icon-btn" type="button" data-action="edit" aria-label="Изменить привычку «${name}»">${bmp('edit')}</button>
          <button class="check-btn" type="button" data-action="toggle" aria-pressed="${isDone}" aria-label="${isDone ? 'Снять отметку' : 'Отметить выполненной'}: ${name}">${bmp('check')}</button>
        </li>`;
      }).join('');
    }

    // быстрые идеи — пока привычек мало
    const used = new Set(state.habits.map((h) => h.name.toLowerCase()));
    const ideas = SUGGESTIONS.filter((s) => !used.has(s.name.toLowerCase()));
    const box = $('#suggest');
    if (total < 3 && ideas.length) {
      box.hidden = false;
      $('#suggest-list').innerHTML = ideas.slice(0, 4).map((s) =>
        `<button class="chip-btn" type="button" data-action="suggest" data-name="${esc(s.name)}"><img src="${A}habit-${s.icon}.svg" alt="" width="20" height="20">${esc(s.name)}</button>`
      ).join('');
    } else {
      box.hidden = true;
    }
  }

  function renderAchievements() {
    const total = ACHIEVEMENTS.length;
    const got = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length;
    $('#ach-summary').textContent = `Собрано ${got} из ${total}`;
    const pct = Math.round((got / total) * 100);
    $('#ach-fill').style.width = `${pct}%`;
    $('#ach-bar').setAttribute('aria-valuenow', String(pct));

    $('#ach-grid').innerHTML = ACHIEVEMENTS.map((a) => {
      const unlockedOn = state.achievements[a.id];
      const p = a.progress(state);
      const cur = Math.min(p.cur, p.max);
      const w = Math.round((cur / p.max) * 100);
      return `<li class="ach pbox r-${a.rarity} ${unlockedOn ? 'unlocked' : 'locked'}">
        <div class="ach-ico"><img src="${A}${a.icon}" alt="" width="64" height="64">${unlockedOn ? '' : '<span class="lock" aria-hidden="true">?</span>'}</div>
        <h3>${esc(a.title)}</h3>
        <p class="ach-desc">${esc(a.desc)}</p>
        <div class="ach-foot"><span class="tag">${RARITY[a.rarity].label}</span><span class="tag xp">+${a.xp} XP</span></div>
        ${unlockedOn
          ? `<p class="ach-date">Получено: ${fmtDate(unlockedOn)}</p>`
          : `<div class="mini-bar" aria-hidden="true"><i style="width:${w}%"></i></div><p class="ach-prog">${cur} / ${p.max}</p>`}
      </li>`;
    }).join('');
  }

  function renderLeague() {
    const today = todayKey();
    const info = levelInfo(state.pet.xp);
    const stage = stageOf(info.level);
    const mood = moodOf(state.pet.happiness);
    const rows = [
      { me: true, id: 'me', name: state.pet.name, level: info.level, avatar: `pet-${stage.id}-${mood}.svg`, score: myWeekScore(today) },
      ...FRIENDS.map((f) => ({ me: false, id: f.id, name: f.name, level: f.level, avatar: f.avatar, score: friendWeekScore(f, today) })),
    ].sort((a, b) => b.score - a.score || (a.me ? -1 : 1));

    $('#league').innerHTML = rows.map((r, i) => {
      const cheered = state.cheersSent[r.id] === today;
      const action = r.me
        ? '<span></span>'
        : `<button class="btn small" type="button" data-action="cheer" data-id="${r.id}"${cheered ? ' disabled' : ''} aria-label="Подбодрить: ${esc(r.name)}">${cheered ? 'Готово' : '♥'}</button>`;
      return `<li class="lg-row pbox${r.me ? ' me' : ''}">
        <span class="lg-rank">${i + 1}</span>
        <img class="av" src="${A}${r.avatar}" alt="" width="40" height="40">
        <span class="lg-name">${esc(r.name)}${r.me ? ' (ты)' : ''}<small>ур. ${r.level}</small></span>
        <span class="lg-score">${r.score}</span>
        ${action}
      </li>`;
    }).join('');
  }

  function renderChallenges() {
    const today = todayKey();
    $('#challenge-list').innerHTML = CHALLENGES.map((def) => {
      const ch = state.challenges[def.id];
      const friends = def.friends.map((id) => FRIEND_BY_ID[id]);
      const meta = `<div class="ch-meta"><span class="tag">${def.days} ${plural(def.days, ['день', 'дня', 'дней'])}</span><span class="tag xp">+${def.reward} XP</span></div>`;
      const head = `<h3>${esc(def.title)}</h3><p class="desc">${esc(def.desc)}</p>${meta}`;
      let body = '';
      let cls = '';

      if (ch && ch.status === 'active') {
        const cur = Math.min(challengeProgress(def, ch, today), def.goal);
        const left = Math.max(0, diffDays(today, challengeEnd(def, ch)) + 1);
        const row = (name, val, me) =>
          `<div class="prog-row${me ? ' me' : ''}"><span class="nm">${esc(name)}</span><div class="bar"><div class="bar-fill" style="width:${Math.round((val / def.goal) * 100)}%"></div></div><span class="num">${val}/${def.goal}</span></div>`;
        body = `<p class="ch-days">Осталось: ${left} ${plural(left, ['день', 'дня', 'дней'])}</p>
          ${row('Ты', cur, true)}
          ${friends.map((f) => row(f.name, friendProgress(f, def, ch, today), false)).join('')}`;
      } else if (ch && ch.status === 'won') {
        cls = ' won';
        body = `<p class="ch-status win">Победа! Челлендж пройден.</p>
          <button class="btn small" type="button" data-action="join" data-id="${def.id}">Сыграть снова</button>`;
      } else if (ch && ch.status === 'failed') {
        body = `<p class="ch-status fail">Время вышло — в следующий раз получится!</p>
          <button class="btn small primary" type="button" data-action="join" data-id="${def.id}">Попробовать снова</button>`;
      } else {
        body = `<div class="ch-people">${friends.map((f) => `<img src="${A}${f.avatar}" alt="${esc(f.name)}" width="30" height="30">`).join('')}<span>уже в игре</span></div>
          <button class="btn primary" type="button" data-action="join" data-id="${def.id}">Вступить</button>`;
      }
      return `<li class="ch pbox${cls}">${head}${body}</li>`;
    }).join('');
  }

  function renderAll() {
    renderHeader();
    renderPet();
    renderHabits();
    renderAchievements();
    renderLeague();
    renderChallenges();
    renderIcons();
  }

  /* ---------------------------------------------------------
     Реплики питомца, тосты и эффекты
     --------------------------------------------------------- */
  function say(text) {
    $('#pet-bubble').textContent = text;
  }

  function greeting() {
    const info = levelInfo(state.pet.xp);
    const mood = moodOf(state.pet.happiness);
    if (!state.habits.length) return `Привет! Я ${state.pet.name}. Добавь первую привычку — и мы начнём!`;
    const today = todayKey();
    if (state.habits.every((h) => h.log[today])) return pick(PHRASES.allDone);
    if (info.level < 3 && mood === 'happy') return pick(PHRASES.egg);
    return pick(PHRASES[mood]);
  }

  function toast(iconSrc, text, rarity) {
    const root = $('#toasts');
    while (root.children.length >= 4) root.removeChild(root.firstChild);
    const el = document.createElement('div');
    el.className = `toast pbox${rarity ? ` ${rarity}` : ''}`;
    el.innerHTML = `<img src="${iconSrc}" alt="" width="36" height="36"><span>${esc(text)}</span>`;
    root.appendChild(el);
    setTimeout(() => el.classList.add('out'), 3600);
    setTimeout(() => el.remove(), 4000);
  }

  function floatText(text, rect, neg) {
    if (!rect || reduceMotion) return;
    const el = document.createElement('div');
    el.className = `float-xp${neg ? ' neg' : ''}`;
    el.textContent = text;
    el.style.left = `${Math.max(8, rect.left - 20)}px`;
    el.style.top = `${rect.top - 6}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  function confetti() {
    if (reduceMotion) return;
    const colors = ['#ff8fbb', '#ffd1e6', '#c2a3f7', '#b8f0d4', '#fff0a8', '#bfe0ff'];
    for (let i = 0; i < 26; i++) {
      const el = document.createElement('i');
      el.className = 'confetti';
      el.style.left = `${window.innerWidth / 2}px`;
      el.style.top = `${Math.round(window.innerHeight * 0.35)}px`;
      el.style.background = colors[i % colors.length];
      el.style.setProperty('--dx', `${Math.round((Math.random() - 0.5) * 340)}px`);
      el.style.setProperty('--dy', `${Math.round(Math.random() * 300 - 120)}px`);
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1100);
    }
  }

  function announce(ev) {
    if (ev.say) say(ev.say);
    if (ev.gain) floatText(`+${ev.gain} XP`, ev.rect);
    if (ev.undo) floatText(`-${ev.undo} XP`, ev.rect, true);
    if (ev.perfect) toast(`${A}ach-perfect-day.svg`, `Идеальный день! Бонус +${ev.perfect} XP`, 'rare');
    (ev.won || []).forEach((w) => toast(`${A}ach-challenge-win.svg`, `Челлендж «${w.def.title}» пройден! +${w.reward} XP`, 'epic'));
    (ev.failed || []).forEach((d) => toast(`${A}icon-cloud.svg`, `Челлендж «${d.title}» закончился. Попробуй ещё раз!`));
    (ev.unlocked || []).forEach((a) => toast(`${A}${a.icon}`, `Достижение: ${a.title} (+${a.xp} XP)`, a.rarity));
    if (ev.levelUp) {
      toast(`${A}icon-heart.svg`, `Новый уровень: ${ev.levelUp}!`);
      confetti();
    }
    if (ev.evolved) showEvolution(ev.evolved.from, ev.evolved.to);
  }

  /* ---------------------------------------------------------
     Модальные окна
     --------------------------------------------------------- */
  let lastFocus = null;

  function closeModal() {
    const root = $('#modal-root');
    root.innerHTML = '';
    document.removeEventListener('keydown', onModalKey, true);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    lastFocus = null;
  }

  function onModalKey(e) {
    const root = $('#modal-root');
    if (!root.firstChild) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeModal();
      return;
    }
    if (e.key === 'Tab') {
      const items = $$('button, input, [href], select, textarea', root).filter((el) => !el.disabled);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function openModal({ title, body, actions, focus }) {
    const root = $('#modal-root');
    if (!root.firstChild) lastFocus = document.activeElement;
    root.innerHTML = `<div class="overlay"><div class="modal pbox" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">${esc(title)}</h2>
      <div class="modal-body">${body}</div>
      <div class="modal-actions">${actions}</div>
    </div></div>`;
    const overlay = $('.overlay', root);
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) closeModal(); });
    $$('[data-close]', root).forEach((b) => b.addEventListener('click', closeModal));
    document.addEventListener('keydown', onModalKey, true);
    const target = focus ? $(focus, root) : $('button', root);
    if (target) target.focus();
    return root;
  }

  function habitModal(habit) {
    const isEdit = !!habit;
    const h = habit || { name: '', icon: 'sparkle', level: 'easy' };
    const iconsHtml = HABIT_ICONS.map((i) =>
      `<label class="opt"><input type="radio" name="icon" value="${i.id}"${i.id === h.icon ? ' checked' : ''}><span class="opt-box" title="${i.label}"><img src="${A}habit-${i.id}.svg" alt="${i.label}" width="36" height="36"></span></label>`
    ).join('');
    const levelsHtml = Object.entries(DIFFICULTY).map(([id, d]) =>
      `<label class="opt"><input type="radio" name="level" value="${id}"${id === h.level ? ' checked' : ''}><span class="opt-box text">${d.label} · ${d.xp} XP</span></label>`
    ).join('');

    const root = openModal({
      title: isEdit ? 'Изменить привычку' : 'Новая привычка',
      body: `<form id="habit-form" autocomplete="off">
        <div class="modal-body">
          <div class="field">
            <label for="habit-name">Название</label>
            <input class="input" id="habit-name" name="name" type="text" maxlength="30" required placeholder="Например: Выпить воды" value="${esc(h.name)}">
          </div>
          <fieldset class="field"><legend>Иконка</legend><div class="opts">${iconsHtml}</div></fieldset>
          <fieldset class="field"><legend>Сложность</legend><div class="opts">${levelsHtml}</div></fieldset>
        </div>
      </form>`,
      actions: `${isEdit ? '<button class="btn danger" type="button" id="habit-delete">Удалить</button>' : ''}
        <button class="btn" type="button" data-close>Отмена</button>
        <button class="btn primary" type="submit" form="habit-form">Сохранить</button>`,
      focus: '#habit-name',
    });

    $('#habit-form', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const name = String(fd.get('name') || '').trim();
      if (!name) {
        $('#habit-name', root).focus();
        return;
      }
      const data = { name, icon: fd.get('icon'), level: fd.get('level') };
      closeModal();
      if (isEdit) updateHabit(habit.id, data); else addHabit(data);
    });

    const del = $('#habit-delete', root);
    if (del) {
      del.addEventListener('click', () => {
        confirmModal({
          title: 'Удалить привычку?',
          text: `«${habit.name}» исчезнет из списка. Накопленный опыт питомца сохранится.`,
          okLabel: 'Удалить',
          onOk: () => deleteHabit(habit.id),
        });
      });
    }
  }

  function confirmModal({ title, text, okLabel, onOk }) {
    const root = openModal({
      title,
      body: `<p>${esc(text)}</p>`,
      actions: `<button class="btn" type="button" data-close>Отмена</button>
        <button class="btn danger" type="button" id="confirm-ok">${esc(okLabel)}</button>`,
    });
    $('#confirm-ok', root).addEventListener('click', () => {
      closeModal();
      onOk();
    });
  }

  function renameModal() {
    const root = openModal({
      title: 'Имя питомца',
      body: `<form id="rename-form" autocomplete="off">
        <div class="field">
          <label for="pet-name-input">Как его зовут?</label>
          <input class="input" id="pet-name-input" type="text" maxlength="14" value="${esc(state.pet.name)}">
        </div></form>`,
      actions: `<button class="btn" type="button" data-close>Отмена</button>
        <button class="btn primary" type="submit" form="rename-form">Сохранить</button>`,
      focus: '#pet-name-input',
    });
    $('#rename-form', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const v = $('#pet-name-input', root).value;
      closeModal();
      renamePet(v);
    });
  }

  function showEvolution(from, to) {
    openModal({
      title: 'Эволюция!',
      body: `<div class="evo-modal">
          <img class="from" src="${A}pet-${from.id}-happy.svg" alt="" width="96" height="96">
          <span class="arrow" aria-hidden="true">&rarr;</span>
          <img class="to" src="${A}pet-${to.id}-happy.svg" alt="" width="96" height="96">
        </div>
        <p class="center"><b>${esc(state.pet.name)}</b> теперь — ${esc(to.name)}! Это всё благодаря твоим привычкам ♥</p>`,
      actions: '<button class="btn primary" type="button" data-close>Ура!</button>',
    });
    confetti();
  }

  /* ---------------------------------------------------------
     Вкладки
     --------------------------------------------------------- */
  function setTab(name, focus) {
    $$('.tab-btn').forEach((b) => {
      const on = b.dataset.tab === name;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    $$('.panel').forEach((p) => { p.hidden = p.id !== `tab-${name}`; });
    window.scrollTo(0, 0);
  }

  /* ---------------------------------------------------------
     События
     --------------------------------------------------------- */
  function bindEvents() {
    $('#habit-list').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const li = btn.closest('.habit');
      if (!li) return;
      const id = li.dataset.id;
      if (btn.dataset.action === 'toggle') toggleHabit(id, btn);
      else if (btn.dataset.action === 'edit') habitModal(state.habits.find((h) => h.id === id));
    });

    $('#suggest-list').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="suggest"]');
      if (!btn) return;
      const s = SUGGESTIONS.find((x) => x.name === btn.dataset.name);
      if (s) addHabit(s);
    });

    $('#add-habit').addEventListener('click', () => habitModal(null));
    $('#pet-rename').addEventListener('click', renameModal);

    const petBtn = $('#pet-btn');
    petBtn.addEventListener('click', () => {
      petBtn.classList.remove('hop');
      void petBtn.offsetWidth; // перезапуск анимации
      petBtn.classList.add('hop');
      say(greeting());
    });
    petBtn.addEventListener('animationend', () => petBtn.classList.remove('hop'));

    $('#league').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="cheer"]');
      if (btn) cheerFriend(btn.dataset.id);
    });
    $('#challenge-list').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="join"]');
      if (btn) joinChallenge(btn.dataset.id);
    });

    $('#reset-btn').addEventListener('click', () => {
      confirmModal({
        title: 'Сбросить прогресс?',
        text: 'Все привычки, опыт, ачивки и челленджи будут удалены. Это нельзя отменить.',
        okLabel: 'Сбросить',
        onOk: resetAll,
      });
    });

    const tabs = $$('.tab-btn');
    tabs.forEach((b, i) => {
      b.addEventListener('click', () => setTab(b.dataset.tab));
      b.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
          setTab(next.dataset.tab, true);
        }
      });
    });

    // синхронизация между вкладками браузера
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        state = load();
        renderAll();
      }
    });
  }

  /* ---------------------------------------------------------
     Смена суток и запуск
     --------------------------------------------------------- */
  let currentDay = todayKey();

  function dayTick() {
    const now = todayKey();
    if (now === currentDay) return;
    currentDay = now;
    settleDays();
    const ev = {};
    commit(ev);
    save();
    renderAll();
    announce(ev);
    say(greeting());
  }

  function init() {
    state = load();
    bindEvents();
    const delta = settleDays();
    const ev = {};
    commit(ev);
    save();
    renderAll();
    announce(ev);
    say(delta < 0 ? 'Тебя не было несколько дней... Я скучала! Начнём с малого?' : greeting());

    setInterval(dayTick, 30000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) dayTick();
    });
  }

  init();
})();
