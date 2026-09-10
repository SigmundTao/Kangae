import { USER, updateUserData } from '../user.js';
import { showToast, TOAST_TYPES } from '../toast.js';

const TIMER_TYPES = {
    pomodoro: 'pomodoro',
    shortbreak: 'shortbreak',
    longbreak: 'longbreak',
};

const timerSound = new Audio('/src/assets/timer.mp3');

const tabTimers = new Map();
let sidebarTimer = null;

function createTimerState(settings, isInSidebar=false) {
    return {
        settings,
        secondsLeft: settings.pomodoro * 60,
        isGoing: false,
        currentType: TIMER_TYPES.pomodoro,
        pomodoroCounter: 0,
        intervalId: null,
        listeners: new Set(),
        isInSidebar: isInSidebar,
    };
}

function notify(timer) {
    timer.listeners.forEach((fn) => fn());
}

//Tab pomodoro
export function createPomodoroModule(tabId) {
    const settings = USER.settings.pomodoroTimer;

    let timer = tabTimers.get(tabId);
    if (!timer) {
        timer = createTimerState(settings);
        tabTimers.set(tabId, timer);
    }

    return mount(timer, tabId, 'tab');
}

export function updateTabTitle(timer, tabId) {
  const text = formatText(timer.currentType);
  const title = `${text} - ${formatTime(timer.secondsLeft)}`;
  const tabTitle = document.querySelector(`#tab-title-${tabId}`)
  tabTitle.textContent = title;
}

export function destroyPomodoroTimer(tabId) {
    const timer = tabTimers.get(tabId);
    if (!timer) return;
    clearInterval(timer.intervalId);
    tabTimers.delete(tabId);
}

//Sidebar pomodoro
export function createSidebarPomodoroModule() {
    if (!sidebarTimer) {
        sidebarTimer = createTimerState(USER.settings.pomodoroTimer, true);
    }
    return mount(sidebarTimer, 'sidebar', 'sidebar');
}

export function destroySidebarPomodoroTimer() {
    if (!sidebarTimer) return;
    clearInterval(sidebarTimer.intervalId);
    sidebarTimer = null;
}

//engine logic
function mount(timer, key, kind) {
    const root = document.createElement('div');
    root.classList.add('timer-module', `timer-module--${kind}`);
    if (kind === 'tab') root.id = 'timer-root';
    const paint = renderView(root, timer, key);
    timer.listeners.add(paint);
    paint();

    root._onDestroy = () => timer.listeners.delete(paint);

    return root;
}

function renderView(root, timer, key) {
    const timerLabel = document.createElement('p');
    timerLabel.classList.add('timer-label');
    timerLabel.style.fontWeight = 'bold';
    root.appendChild(timerLabel);

    const timerEl = document.createElement('div');
    timerEl.classList.add('timer');
    root.appendChild(timerEl);

    const startStopBtn = document.createElement('button');
    startStopBtn.classList.add('pomodoro-start-stop-btn');
    root.appendChild(startStopBtn);

    function paint() {
        timerLabel.textContent = labelFor(timer.currentType);
        timerEl.textContent = formatTime(timer.secondsLeft);
        startStopBtn.textContent = timer.isGoing ? 'Stop' : 'Start';
    }

    startStopBtn.addEventListener('click', () => {
        timer.isGoing ? stopTimer(timer) : startTimer(timer, key);
    });

    return paint;
}

function startTimer(timer, key) {
    if (timer.isGoing) return;
    timer.isGoing = true;
    timer.intervalId = setInterval(() => {
        timer.secondsLeft--;

        if(!timer.isInSidebar) updateTabTitle(timer, key);

        if (timer.secondsLeft <= 0) {
            stopTimer(timer);
            timerSound.play();
            const message = `${formatText(timer.currentType)} has ended`;
            showToast(message, TOAST_TYPES.ALERT);
            advancePhase(timer);
            startTimer(timer, key);
            return;
        }
        notify(timer);
    }, 1000);
    notify(timer);
}

function formatText (text) {
  if(text === TIMER_TYPES.pomodoro) return 'Focus';
  else if(text === TIMER_TYPES.longbreak) return 'Long Break';
  else if(text === TIMER_TYPES.shortbreak) return 'Short Break';
}

function stopTimer(timer) {
    clearInterval(timer.intervalId);
    timer.intervalId = null;
    timer.isGoing = false;
    notify(timer);
}

function advancePhase(timer) {
    const s = timer.settings;
    if (timer.currentType === TIMER_TYPES.pomodoro) {
        timer.pomodoroCounter++;
        if (timer.pomodoroCounter % s.pomodorosBeforeLongBreak === 0) {
            timer.currentType = TIMER_TYPES.longbreak;
            timer.secondsLeft = s.longBreak * 60;
        } else {
            timer.currentType = TIMER_TYPES.shortbreak;
            timer.secondsLeft = s.shortBreak * 60;
        }
    } else {
        timer.currentType = TIMER_TYPES.pomodoro;
        timer.secondsLeft = s.pomodoro * 60;
    }
    updateUserData();
    notify(timer);
}

function formatTime(t) {
    const m = Math.floor(t / 60);
    const sec = t % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
}

function labelFor(type) {
    if (type === TIMER_TYPES.pomodoro) return '集Focus';
    if (type === TIMER_TYPES.shortbreak) return '息Short Break';
    return '暇Long Break';
}
