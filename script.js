// Трекер пресса. Всё хранится в localStorage, никакого сервера не надо.

const STORAGE_KEY = "press-tracker-v1";

// Порядок для интерфейса: с понедельника. Значения — то, что отдаёт Date.getDay().
const WEEK = [
    { index: 1, short: "Пн", full: "Понедельник" },
    { index: 2, short: "Вт", full: "Вторник" },
    { index: 3, short: "Ср", full: "Среда" },
    { index: 4, short: "Чт", full: "Четверг" },
    { index: 5, short: "Пт", full: "Пятница" },
    { index: 6, short: "Сб", full: "Суббота" },
    { index: 0, short: "Вс", full: "Воскресенье" }
];

// План: каждый день свой акцент. sec — длительность для таймера.
const PLAN = {
    1: {
        title: "Верх пресса",
        note: "Скручивания и статика. Тяни грудную клетку к тазу, а не голову к коленям.",
        items: [
            { name: "Скручивания", dose: "3×20" },
            { name: "Скручивания с паузой 2 сек", dose: "2×12" },
            { name: "Планка", dose: "45 сек", sec: 45 },
            { name: "Вакуум живота", dose: "3×15 сек", sec: 15 }
        ]
    },
    2: {
        title: "Низ пресса",
        note: "Поясницу прижимай к полу, ноги опускай медленно. Рывками не надо.",
        items: [
            { name: "Обратные скручивания", dose: "3×15" },
            { name: "Подъём ног лёжа", dose: "3×12" },
            { name: "Ножницы", dose: "3×30 сек", sec: 30 },
            { name: "Планка", dose: "45 сек", sec: 45 }
        ]
    },
    3: {
        title: "Косые",
        note: "Работай за счёт пресса, а не за счёт шеи. Локти не тяни руками.",
        items: [
            { name: "Велосипед", dose: "3×20" },
            { name: "Русские скручивания", dose: "3×15" },
            { name: "Боковая планка", dose: "2×30 сек", sec: 30 },
            { name: "Вакуум живота", dose: "3×15 сек", sec: 15 }
        ]
    },
    4: {
        title: "Верх + низ",
        note: "День плотнее. Если тяжело — уменьши подход, но не бросай технику.",
        items: [
            { name: "Скручивания", dose: "2×25" },
            { name: "Обратные скручивания", dose: "2×15" },
            { name: "Складка (V-up)", dose: "3×10" },
            { name: "Планка", dose: "60 сек", sec: 60 }
        ]
    },
    5: {
        title: "Круг на выносливость",
        note: "3 круга подряд. Отдых между кругами 60 секунд, внутри круга почти без пауз.",
        items: [
            { name: "Скручивания", dose: "20" },
            { name: "Подъём ног", dose: "12" },
            { name: "Велосипед", dose: "20" },
            { name: "Планка", dose: "40 сек", sec: 40 }
        ]
    },
    6: {
        title: "Статика",
        note: "Дыши ровно, тело держи одной линией. Трясёт — это нормально.",
        items: [
            { name: "Планка", dose: "60 сек", sec: 60 },
            { name: "Боковая планка", dose: "2×40 сек", sec: 40 },
            { name: "Лодка", dose: "3×30 сек", sec: 30 },
            { name: "Вакуум живота", dose: "3×20 сек", sec: 20 }
        ]
    },
    0: {
        title: "Лёгкий день",
        note: "Разгрузка и растяжка. Прессу тоже нужен отдых, иначе он не растёт.",
        items: [
            { name: "Планка", dose: "30 сек", sec: 30 },
            { name: "Вакуум живота", dose: "3×15 сек", sec: 15 },
            { name: "Растяжка на пресс лёжа", dose: "3 мин" },
            { name: "Дыхание животом", dose: "2 мин" }
        ]
    }
};

const els = {
    date: document.getElementById("today-date"),
    dayName: document.getElementById("day-name"),
    dayNote: document.getElementById("day-note"),
    progress: document.getElementById("stat-progress"),
    streak: document.getElementById("stat-streak"),
    week: document.getElementById("stat-week"),
    bar: document.getElementById("bar-fill"),
    checklist: document.getElementById("checklist"),
    reset: document.getElementById("reset-day"),
    hint: document.getElementById("today-hint"),
    tabs: document.getElementById("plan-tabs"),
    planBody: document.getElementById("plan-body"),
    history: document.getElementById("history"),
    year: document.getElementById("year")
};

// ===== Хранилище =====

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const data = raw ? JSON.parse(raw) : null;
        if (!data || typeof data !== "object") return { done: {} };
        if (!data.done || typeof data.done !== "object") data.done = {};
        return data;
    } catch (err) {
        // режим инкогнито или мусор в хранилище
        return { done: {} };
    }
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
        console.warn("Не смог сохранить отметки", err);
    }
}

const state = loadState();

// ===== Даты =====

function dateKey(date) {
    const d = date || new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
}

function addDays(date, delta) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    return d;
}

function todayKey() {
    return dateKey(new Date());
}

function dayIndex(date) {
    return (date || new Date()).getDay();
}

function planItems(day) {
    return PLAN[day].items.map((item, i) => ({ ...item, id: `d${day}-${i}` }));
}

function doneToday() {
    return state.done[todayKey()] || [];
}

function isDayFull(key) {
    const day = new Date(key + "T00:00:00").getDay();
    const items = planItems(day);
    const done = state.done[key] || [];
    return items.every((item) => done.includes(item.id));
}

function dayDoneCount(key) {
    return (state.done[key] || []).length;
}

// ===== Серия и неделя =====

function calcStreak() {
    let streak = 0;
    let cursor = new Date();

    // Сегодня ещё может быть не закрыт — тогда считаем серию до вчера.
    if (!isDayFull(dateKey(cursor))) {
        cursor = addDays(cursor, -1);
    }

    while (isDayFull(dateKey(cursor))) {
        streak += 1;
        cursor = addDays(cursor, -1);
        if (streak > 3650) break; // защита от бесконечного цикла
    }

    return streak;
}

function calcWeek() {
    let closed = 0;
    for (let i = 0; i < 7; i++) {
        if (isDayFull(dateKey(addDays(new Date(), -i)))) closed += 1;
    }
    return closed;
}

// ===== Таймеры =====

const timers = new Map();

function clearTimers() {
    timers.forEach((t) => clearInterval(t.id));
    timers.clear();
}

function startTimer(btn, item) {
    const key = item.id;

    if (timers.has(key)) {
        clearInterval(timers.get(key).id);
        timers.delete(key);
        btn.classList.remove("is-running");
        btn.textContent = `▶ ${item.sec} с`;
        return;
    }

    let left = item.sec;
    btn.classList.add("is-running");
    btn.textContent = `${left} с`;

    const tick = setInterval(() => {
        left -= 1;
        if (left <= 0) {
            clearInterval(tick);
            timers.delete(key);
            btn.classList.remove("is-running");
            btn.textContent = "готово";
            toggleDone(item.id, true);
            render();
            return;
        }
        btn.textContent = `${left} с`;
    }, 1000);

    timers.set(key, { id: tick });
}

// ===== Отметки =====

function toggleDone(id, value) {
    const key = todayKey();
    const list = new Set(state.done[key] || []);

    if (value) list.add(id);
    else list.delete(id);

    if (list.size) state.done[key] = [...list];
    else delete state.done[key];

    saveState();
}

// ===== Рендер: сегодня =====

function renderToday() {
    const now = new Date();
    const day = dayIndex(now);
    const plan = PLAN[day];
    const items = planItems(day);
    const done = doneToday();

    els.date.textContent = now.toLocaleDateString("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });
    els.dayName.textContent = plan.title.toLowerCase();
    els.dayNote.textContent = plan.note;

    const percent = Math.round((done.length / items.length) * 100);
    els.progress.textContent = `${percent}%`;
    els.streak.textContent = String(calcStreak());
    els.week.textContent = String(calcWeek());
    els.bar.style.width = `${percent}%`;

    clearTimers();
    els.checklist.innerHTML = items.map((item) => {
        const checked = done.includes(item.id);
        const timer = item.sec
            ? `<button class="item__timer" type="button" data-timer="${item.id}" aria-label="Таймер: ${item.name}, ${item.sec} секунд">▶ ${item.sec} с</button>`
            : "";

        return `
            <li class="item">
                <label class="item__main">
                    <input class="item__check" type="checkbox" data-id="${item.id}"${checked ? " checked" : ""}>
                    <span class="item__name">${item.name}</span>
                    <span class="item__dose">${item.dose}</span>
                </label>
                ${timer}
            </li>`;
    }).join("");

    if (percent === 100) {
        els.hint.textContent = "День закрыт. Так и держи.";
    } else if (percent === 0) {
        els.hint.textContent = "Начни с первого упражнения.";
    } else {
        els.hint.textContent = `Осталось ${items.length - done.length} из ${items.length}.`;
    }
}

// ===== Рендер: план =====

let activePlanDay = null;

function renderPlan() {
    if (activePlanDay === null) activePlanDay = dayIndex(new Date());

    els.tabs.innerHTML = WEEK.map((d) => `
        <button class="tab${d.index === activePlanDay ? " is-active" : ""}" type="button" data-day="${d.index}">
            ${d.short}
        </button>`).join("");

    const plan = PLAN[activePlanDay];
    els.planBody.innerHTML = `
        <p class="plan__title">${plan.title}${activePlanDay === dayIndex(new Date()) ? " · сегодня" : ""}</p>
        <p class="plan__note">${plan.note}</p>
        <ul class="plan__list">
            ${plan.items.map((item) => `<li><b>${item.name}</b><span>${item.dose}</span></li>`).join("")}
        </ul>`;
}

// ===== Рендер: история =====

function renderHistory() {
    const cells = [];

    for (let i = 13; i >= 0; i--) {
        const date = addDays(new Date(), -i);
        const key = dateKey(date);
        const count = dayDoneCount(key);
        const full = isDayFull(key);
        const cls = ["day"];

        if (full) cls.push("is-full");
        else if (count > 0) cls.push("is-part");
        if (key === todayKey()) cls.push("is-today");

        const label = WEEK.find((d) => d.index === date.getDay()).short;
        cells.push(`
            <div class="${cls.join(" ")}" title="${key}: ${count} отмечено">
                <span>${label}</span>
                <span class="day__num">${date.getDate()}</span>
            </div>`);
    }

    els.history.innerHTML = cells.join("");
}

// ===== Общий рендер =====

function render() {
    renderToday();
    renderPlan();
    renderHistory();
}

// ===== События =====

els.checklist.addEventListener("change", (event) => {
    const input = event.target.closest(".item__check");
    if (!input) return;
    toggleDone(input.dataset.id, input.checked);
    renderToday();
});

els.checklist.addEventListener("click", (event) => {
    const btn = event.target.closest(".item__timer");
    if (!btn) return;
    const id = btn.dataset.timer;
    const day = dayIndex(new Date());
    const item = planItems(day).find((x) => x.id === id);
    if (!item || !item.sec) return;
    startTimer(btn, item);
});

els.reset.addEventListener("click", () => {
    if (!confirm("Сбросить отметки за сегодня?")) return;
    delete state.done[todayKey()];
    saveState();
    render();
});

els.tabs.addEventListener("click", (event) => {
    const tab = event.target.closest(".tab");
    if (!tab) return;
    activePlanDay = Number(tab.dataset.day);
    renderPlan();
});

// Смена дня в полночь: проверяем ключ раз в минуту и при возврате на вкладку
let lastKey = todayKey();

function checkDayChange() {
    if (todayKey() !== lastKey) {
        lastKey = todayKey();
        activePlanDay = null;
        render();
    }
}

setInterval(checkDayChange, 60000);
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkDayChange();
});

// ===== Старт =====

els.year.textContent = String(new Date().getFullYear());
render();
