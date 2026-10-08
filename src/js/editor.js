import { USER, updateUserData } from './user.js';
import {
    openFolderIds,
    getFileIndex,
    idNum,
    currentFolderId,
    incrementIdNum,
    setSelectedFileId,
    setAppState,
    getTabIndexFromFileId,
} from './state.js';
import { getFormattedDate, checkForDuplicateTitles } from './storage.js';
import {
    currentTabEl,
    renderTabs,
    checkForDefaultTabs,
    createTab,
    overwriteDefaultTab,
    loadTab,
} from './tabs.js';
import { renderFiletree } from './filetree.js';
import { rotateElement, removeTextRightToLeft } from './animations.js';
import { showToast, TOAST_TYPES } from './toast.js';

export function highlightSelectedFile(id) {
    document
    .querySelectorAll('.file-card')
    .forEach((card) => card.classList.remove('selected-file'));
    if (!id) return;
    const targets = document.querySelectorAll(`[id="${id}"]`);
    targets.forEach((target) => {
        if (target.classList.contains('file-card')) {
            target.classList.add('selected-file');
        }
    });
}

export function getTitleInput() {
    return document.querySelector('.note-title');
}

export function getBodyInput() {
    return document.querySelector('.note-body-input');
}

function throwDuplicateTitleError(title) {
    showToast(`Cannot save title, ${title} already exists!`, TOAST_TYPES.ALERT);
}

export function saveNote(file) {
    const fileIndex = getFileIndex(file.id);
    if (fileIndex === -1) return;

    saveTitle(file);
    saveBody(file);
}

export function saveTitle(file) {
    const newTitle = getTitleInput().value.trim();
    const bodyInput = getBodyInput();
    const persistentTitle = document.querySelector('.persistent-title');

    if (newTitle === file.title) {
        bodyInput.focus();
    }
    if (checkForDuplicateTitles(newTitle, file.id)) {
        throwDuplicateTitleError(newTitle);
        return true;
    }
    file.title = newTitle;
    file.lastEdited = getFormattedDate(new Date());
    updateUserData();
    persistentTitle.textContent = file.title;
    renderFiletree();
    renderTabs();
    indicateAutoSave();
}

export function saveBody(file) {
    file.body = getBodyInput().value;
    file.lastEdited = getFormattedDate(new Date());
    updateUserData();
    indicateAutoSave();
}

function indicateAutoSave() {
    const saveElement = document.createElement('div');
    saveElement.classList.add('save-hanko');

    currentTabEl.append(saveElement);

    setTimeout(() => {
        saveElement.remove();
    }, 1500)
}

export function createNewNote(isDailyNote = false, parentIdentifier = null) {
    const date = getFormattedDate(new Date());
    const id = idNum;
    let title = getUntitledTitle();
    let body = '';
    let parent = null;
    if (isDailyNote) {
        title = date;
        body = USER.settings.dailyNote.preset;
        parent = USER.settings.dailyNote.folder;
    } else {
      parent = parentIdentifier;
    }

    USER.files.push({
        title: title,
        body: body,
        id,
        type: 'note',
        parentId: parent,
        date,
        lastEdited: date,
        tags: [],
    });

    if (parent !== null) {
        if (!openFolderIds.has(parent)) {
            openFolderIds.add(parent);
        }
    }

    if (checkForDefaultTabs() !== -1) {
        overwriteDefaultTab(id);
        loadTab(USER.tabs[getTabIndexFromFileId(id)].id);
        renderTabs();
    } else {
        createTab(id);
    }
    incrementIdNum();
    updateUserData();
    setSelectedFileId(id);
    setAppState('Editing');
    renderFiletree();
    getTitleInput().focus();
    return id;
}

export function getUntitledTitle() {
    const untitledTitles = new Set(
        USER.files.filter((f) => f.title.startsWith('Untitled')).map((f) => f.title)
    );
    if (!untitledTitles.has('Untitled')) return 'Untitled';
    let i = 1;
    while (untitledTitles.has(`Untitled ${i}`)) {
        if (i > 1000) break;
        i++;
    }
    return `Untitled ${i}`;
}
