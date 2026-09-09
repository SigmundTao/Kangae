import { USER, updateUserData } from '../user.js';
import { createSidebarPomodoroModule, destroySidebarPomodoroTimer } from './pomodoro.js';
import { createToDoList } from './todo.js';
import { openModules, removeOpenModule, addOpenModule } from '../state.js';
import { createFlashcardModule } from './flashcards.js';
import { setOpenMenu } from '../menus.js';

const toolbar = document.getElementById('right-sidebar');
const sidebarBtn = document.getElementById('right-sidebar-btn');
const addModuleBtn = document.getElementById('add-module-btn');
export const sidebarContents = document.getElementById('sidebar-contents');

class Module {
    constructor(moduleObj) {
        this.id = moduleObj.id;
        this.title = moduleObj.title;
        this.image = moduleObj.image;
        this.element = moduleObj.element;
    }
    createModule() {
        if (openModules.includes(this.title)) return;
        if (openModules.length >= 4) return;

        addOpenModule(this.title);
        const moduleEl = document.createElement('div');
        moduleEl.classList.add('module');

        const root = this.element();
        moduleEl.appendChild(root);

        const deleteModuleBtn = document.createElement('button');
        deleteModuleBtn.classList.add('delete-module-btn');
        deleteModuleBtn.addEventListener('click', () => {
            if (this.id === 'timer-module') destroySidebarPomodoroTimer();
            moduleEl.remove();
            removeOpenModule(this.title);
        });
        deleteModuleBtn.textContent = 'x';

        moduleEl.appendChild(deleteModuleBtn);
        moduleEl.classList.add('in-sidebar');
        sidebarContents.appendChild(moduleEl);
    }
    createMenuItem() {
        const menuItem = document.createElement('div');
        menuItem.classList.add('module-menu-item');
        menuItem.style.backgroundImage = `url(${this.image})`;
        menuItem.style.backgroundPosition = 'center';
        menuItem.style.backgroundRepeat = 'no-repeat';
        menuItem.style.backgroundSize = 'contain';

        menuItem.addEventListener('click', this.createModule.bind(this));
        menuItem.addEventListener('click', () => {
            removeModuleMenu();
            if (toolbar.classList.contains('closed-sidebar')) {
                openAndCloseSidebar();
            }
        });
        return menuItem;
    }
}

export const modules = [
    new Module({
        id: 'todo-module',
        title: 'todo',
        image: 'src/assets/todo.svg',
        element: createToDoList,
    }),
    new Module({
        id: 'timer-module',
        title: 'timer',
        image: 'src/assets/timer.svg',
        element: createSidebarPomodoroModule,
    }),
    new Module({
        id: 'flashcard-module',
        title: 'flashcards',
        image: 'src/assets/flashcards.svg',
        element: () => createFlashcardModule(true),
    }),
];

export function openAndCloseSidebar() {
    toolbar.classList.toggle('closed-sidebar');
}

export function createModuleMenu(posX, posY) {
    setOpenMenu('module menu');
    const moduleMenuEl = document.createElement('div');
    moduleMenuEl.classList.add('module-menu');

    moduleMenuEl.style.position = 'fixed';
    moduleMenuEl.style.top = `${posY + 15}px`;
    moduleMenuEl.style.left = `${posX + 10}px`;

    modules.forEach((module) => {
        moduleMenuEl.appendChild(module.createMenuItem());
    });

    sidebarContents.appendChild(moduleMenuEl);
}

export function removeModuleMenu() {
    document.querySelector('.module-menu')?.remove();
}

function initAddModuleBtn() {
    addModuleBtn.addEventListener('click', (e) => createModuleMenu(e.clientX, e.clientY));
}

export function initRightSidebar() {
    sidebarBtn.addEventListener('click', openAndCloseSidebar);
    initAddModuleBtn();
}
