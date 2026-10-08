import { createTab } from '../tabs.js';
import { createNewNote } from '../editor.js';
import { setOpenMenu } from '../menus.js';
import { createState as createFlashcardState } from '../sidebar/flashcards.js';
import { createIcon } from '../icons.js';

class MenuItem {
    constructor(obj) {
        this.id = obj.id;
        this.title = obj.title;
        this.type = obj.type;
        this.img = obj.img;
    }

    createElement() {
        const menuItemEl = document.createElement('div');
        menuItemEl.classList.add('tab-menu-item');

        const title = document.createElement('p');
        title.textContent = this.title;

        const img = document.createElement('div');
        img.classList.add('tab-menu-img');
        const imgContent = createIcon(this.img);
        img.append(imgContent);

        menuItemEl.append(img, title);
        return menuItemEl;
    }
}

const menuItems = [
    new MenuItem({
        id: 'pomodoro',
        title: 'Pomodoro',
        type: 'pomodoro',
        img: 'timer',
    }),
    new MenuItem({
        id: 'flashcards',
        title: 'Flashcards',
        type: 'flashcards',
        img: 'flashcards',
    }),
    new MenuItem({ id: 'todo', title: 'Todo', type: 'todo', img: 'todo' }),
];

export function createTabMenu(posX, posY) {
    setOpenMenu('tab menu')
    const menuEl = document.createElement('div');
    menuEl.classList.add('tab-menu');

    const createNewFile = document.createElement('div');
    createNewFile.classList.add('tab-menu-item');

    const noteIcon = document.createElement('div');
    noteIcon.classList.add('tab-menu-img');
    const iconContent = createIcon('file');
    noteIcon.append(iconContent);

    const text = document.createElement('p');
    text.textContent = 'New note';

    createNewFile.append(noteIcon, text);

    createNewFile.onclick = () => {
        createNewNote(false);
        menuEl.remove();
    };
    menuEl.appendChild(createNewFile);

    menuItems.forEach((item) => {
        const element = item.createElement();
        element.addEventListener('click', () => {
            if(item.type === 'pomodoro'){
                createTab(null, item.type, createFlashcardState())
            }
            createTab(null, item.type);
            menuEl.remove();
        });
        menuEl.appendChild(element);
    });

    menuEl.style.position = 'fixed';
    menuEl.style.top = `${posY + 15}px`;
    menuEl.style.left = `${posX + 5}px`;

    return menuEl;
}
