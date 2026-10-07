import { USER } from './user.js';
import { currentTabEl } from './tabs.js';
import { createNewNote } from './editor.js';
import { openSearchMenu } from './search.js';
import { SUPER } from './shortcuts.js';
import { createIcon } from './icons.js';

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
        const iconContent = createIcon(this.img)
        icon.append(iconContent);
        
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
        name: 'New note',
        key: `${SUPER} + n`,
        img: 'file',
    }),
    new DashboardShortcut({
        name: 'Find note',
        key: `${SUPER} + f`,
        img: 'search',
    }),
    new DashboardShortcut({
        name: 'Settings',
        key: `${SUPER} + m`,
        img: 'settings',
    }),
    new DashboardShortcut({
        name: 'Command palette',
        key: `${SUPER} + k`,
        img: 'command',
    }),
    new DashboardShortcut({
        name: 'Daily note',
        key: `${SUPER} + d`,
        img: 'dailynote',
    }),
    new DashboardShortcut({
        name: 'Open filetree',
        key: `${SUPER} + i`,
        img: 'filetree',
    }),
    new DashboardShortcut({
        name: 'Open toolbar',
        key: `${SUPER} + /`,
        img: 'toolbar',
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
