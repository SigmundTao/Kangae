export const USER = JSON.parse(localStorage.getItem('user')) || {
    files: [],
    recentlyDeleted: [],
    doNotShowConfirmationAgain: false,
    tabs: [],
    todo: {
        lists: [{ name: 'todo', tasks: [] }],
    },
    settings: {
        keybinds: [
            { title: 'Create note', keyValue: 'n' },
            { title: 'Create daily note', keyValue: 'd' },
            { title: 'Search', keyValue: 'f' },
            { title: 'Open filetree', keyValue: 'i' },
            { title: 'Focus on note body', keyValue: '7' },
            { title: 'Focus on note title', keyValue: '8' },
            { title: 'Create folder', keyValue: 'c' },
            { title: 'Close current tab', keyValue: 'w' },
            { title: 'Open command palette', keyValue: 'k' },
            { title: 'Open markdown cheat sheet', keyValue: 'e' },
            { title: 'Open dashboard', keyValue: 't' },
            { title: 'Toggle note view', keyValue: 'p' },
            { title: 'Quick capture', keyValue: 'q' },
            { title: 'Open config', keyValue: 'm' },
            { title: 'Open toolbar', keyValue: '/' },
            { title: 'Next tab', keyValue: 'l' },
            { title: 'Previous tab', keyValue: 'h' },
            { title: 'Open todo list module', keyValue: '1' },
            { title: 'Open todo list tab', keyValue: '4' },
            { title: 'Open pomodoro timer module', keyValue: '2' },
            { title: 'Open pomodoro timer tab', keyValue: '5' },
            { title: 'Open flashcard module', keyValue: '3' },
            { title: 'Open flashcard tab', keyValue: '6' },
        ],
        appearance: {
            theme: 'dark',
            font: 'Noto-Serif-JP',
            dashboardLogo: './src/assets/Dashboard-logo.png',
            background: 'default',
        },
        dailyNote: {
            preset: '',
            folder: null,
        },
        pomodoroTimer: {
            pomodoro: 25,
            shortBreak: 5,
            longBreak: 15,
            pomodorosBeforeLongBreak: 4,
        },
        flashcards: {
            packs: [],
        },
    },
    lastLogIn: '',
};

export function updateUserData() {
    localStorage.setItem('user', JSON.stringify(USER));
}

export function updateLastLogIn() {
    const today = new Date();
    if (USER.lastLogIn !== today) USER.lastLogIn = today;
}
