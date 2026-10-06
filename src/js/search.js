import { USER, updateUserData } from './user.js';
import { idNum, incrementIdNum, currentFolderId } from './state.js';
import { openFile, renderTabs } from './tabs.js';
import { createNewNote } from './editor.js';
import { getFormattedDate } from './storage.js';
import { renderFiletree } from './filetree.js';
import { clearOpenMenu, setOpenMenu } from './menus.js';

const searchMenu = document.getElementById('search-menu');
const searchBarEl = document.getElementById('search-bar');
const searchResultsEl = document.getElementById('search-results');

let searchResults = [...USER.files];
let searchDebounce;

export function initSearch() {
    searchBarEl.addEventListener('input', handleSearchInput);
    searchMenu.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearchMenu();
    });
}

export function openSearchMenu() {
    searchMenu.classList.add('search-open');
    searchBarEl.value = '';
    searchResultsEl.innerHTML = '';
    displaySearchResults(USER.files, searchResultsEl);
    searchMenu.showModal();
    searchBarEl.focus();
    setOpenMenu('search');
    window.addEventListener('click', () => closeSearchMenu(), { once: true });
}

export function closeSearchMenu() {
    searchMenu.close();
    searchMenu.classList.remove('search-open');
    clearOpenMenu()
}

function handleSearchInput(e) {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
        searchResults = USER.files.filter(
            (item) =>
                item.title.toLowerCase().includes(e.target.value.toLowerCase()) ||
                (item.body && item.body.toLowerCase().includes(e.target.value.toLowerCase()))
        );
        searchResultsEl.innerHTML = '';
        displaySearchResults(searchResults, searchResultsEl);
    }, 300);
}

function createMenuItem(file) {
    const menuItem = document.createElement('div');
    menuItem.classList.add('search-result');
    menuItem.innerHTML = `
        <span class="search-result-span">
            <img src="src/assets/file.svg" class="search-result-img">
            <p class="search-result-text">${file.title}</p>
        </span>
        <div class="search-result-date-container">
            <img src="src/assets/date-icon.svg" class="search-result-img">
            <p>${file.date}</p>
        </div>
    `;
    menuItem.addEventListener('click', () => {
        openFile(file.id);
        closeSearchMenu();
    });
    return menuItem;
}

function displaySearchResults(array, container) {
    if (array.length != 0) {
        array.forEach((item) => container.appendChild(createMenuItem(item)));
    } else {
        const newNoteCard = createNewNoteMenuItem();
        newNoteCard.addEventListener('click', createNoteFromMenu);
        container.appendChild(newNoteCard);
    }
}

function createNoteFromMenu() {
    const date = getFormattedDate(new Date());
    const id = idNum;
    const title = searchBarEl.value.trim('');
    USER.files.push({
        title: title,
        body: '',
        id,
        type: 'note',
        parentId: currentFolderId,
        date,
        lastEdited: date,
        tags: [],
    });

    updateUserData();
    incrementIdNum();
    openFile(id);
    renderFiletree();
    closeSearchMenu();
}

function createNewNoteMenuItem() {
    const menuItem = document.createElement('div');
    menuItem.classList.add('search-result');
    menuItem.classList.add('new-note-card');
    menuItem.innerHTML = `
        <div>${searchBarEl.value}</div>
        <div class="menu-create-note-btn">Create Note</div>
    `;
    return menuItem;
}

searchBarEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.querySelector('.new-note-card')) {
        createNoteFromMenu();
    }
});
