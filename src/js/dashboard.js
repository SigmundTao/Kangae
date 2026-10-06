import { USER } from './user.js';
import { currentTabEl } from './tabs.js';
import { createNewNote } from './editor.js';
import { openSearchMenu } from './search.js';
import { SUPER } from './shortcuts.js';

class DashboardShortcut {
    constructor(shortcutObj) {
        this.img = shortcutObj.img;
        this.name = shortcutObj.name;
        this.key = shortcutObj.key;
    }

    createShortcutEl() {
        const element = document.createElement('div');
        element.classList.add('dashboard-shortcut-el');

        const nameAndIconSpan = document.createElement('span');
        nameAndIconSpan.classList.add('name-icon-span');

        const icon = document.createElement('div');
        icon.classList.add('dashboard-shortcut-icon');
        icon.style.backgroundImage = `url(${this.img})`;
        icon.style.backgroundPosition = 'center';
        icon.style.backgroundSize = 'contain';
        icon.style.backgroundRepeat = 'no-repeat';
        nameAndIconSpan.appendChild(icon);
        const name = document.createElement('p');
        name.classList.add('dashboard-shortcut-name');
        name.textContent = this.name;
        nameAndIconSpan.appendChild(name);

        element.appendChild(nameAndIconSpan);

        const shortcut = document.createElement('p');
        shortcut.classList.add('dashboard-key');
        shortcut.textContent = this.key;
        element.appendChild(shortcut);

        return element;
    }
}

const DASHBOARD_SHORTCUTS = [
    new DashboardShortcut({
        name: 'New File',
        key: `${SUPER} + n`,
        img: '/src/assets/add-file.svg',
    }),
    new DashboardShortcut({
        name: 'Find File',
        key: `${SUPER} + f`,
        img: '/src/assets/search.svg',
    }),
    new DashboardShortcut({
        name: 'Config',
        key: `${SUPER} + m`,
        img: '/src/assets/settings.svg',
    }),
    new DashboardShortcut({
        name: 'Open Command Palette',
        key: `${SUPER} + k`,
        img: '/src/assets/command.svg',
    }),
    new DashboardShortcut({
        name: 'Daily Note',
        key: `${SUPER} + d`,
        img: '/src/assets/dailynote.svg',
    }),
    new DashboardShortcut({
        name: 'Toggle Filetree',
        key: `${SUPER} + i`,
        img: '/src/assets/filetree.svg',
    }),
    new DashboardShortcut({
        name: 'Toggle Toolbar',
        key: `${SUPER} + /`,
        img: '/src/assets/toolbar.svg',
    }),
];

export function createDashboard() {
    currentTabEl.innerHTML = ``;

    const dashboard = document.createElement('div');
    dashboard.classList.add('dashboard');
    currentTabEl.appendChild(dashboard);

    const logo = document.createElement('img');
    logo.src = USER.settings.appearance.dashboardLogo;
    logo.classList.add('dashboard-logo');
    dashboard.appendChild(logo);

    const shorcutHolder = document.createElement('div');
    shorcutHolder.classList.add('dashboard-shortcut-holder');

    DASHBOARD_SHORTCUTS.forEach((shortcut) => {
        shorcutHolder.appendChild(shortcut.createShortcutEl());
    });

    dashboard.appendChild(shorcutHolder);
    currentTabEl.appendChild(dashboard);
}
