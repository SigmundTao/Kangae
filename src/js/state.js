import { USER } from './user.js';

export let selectedFileId = null;
export let currentFolderId = null;
export let currentAppState = 'Idle';
export let currentTabId = null;
export let draggedElId = null;
export let idNum = USER.files.length > 0 ? Math.max(...USER.files.map((n) => n.id)) + 1 : 1;
export const APP_STATES = ['Idle', 'Editing', 'Creating'];
export let isFileHolderOpen = true;
export const openFolderIds = new Set();
export let currentNoteMode = 'display';
export const openModules = [];
export const MODULE_TYPES = { POMODORO: 'pomodoro', FLASHCARDS: 'flashcards', TODO: 'todo' };
export const NOTE_MODES = { DISPLAY: 'display', EDIT: 'edit' };
const idleScreenEl = document.getElementById('idle-screen');

export function updateTabTitle(noteTitle) {
    document.title = noteTitle ? `${noteTitle} - Kangae` : `Kangae`;
}

export function addOpenModule(moduleTitle) {
    openModules.push(moduleTitle);
}

export function removeOpenModule(moduleTitle) {
    openModules.splice(openModules.findIndex(mod => moduleTitle === mod), 1);
}

export function setCurrentNoteMode(mode) {
    currentNoteMode = mode;
}

/// Tabs
export let tabId = USER.tabs.length > 0 ? Math.max(...USER.tabs.map((n) => n.id)) + 1 : 1;

export function incrementTabId() {
    tabId++;
}

export function getTabIndex(id) {
    return USER.tabs.findIndex((t) => t.id === id);
}

export function getTabIndexFromFileId(fileId) {
    return USER.tabs.findIndex((tab) => tab.file === fileId);
}

export function setCurrentTabId(id) {
    currentTabId = id;
}

export function setAppState(state) {
    if (!APP_STATES.includes(state)) {
        return;
    }
    currentAppState = state;
}

export function getFileIndex(id) {
    return USER.files.findIndex((file) => file.id === Number(id));
}

export function getCurrentFolderContents() {
    return USER.files.filter((f) => f.parentId === currentFolderId);
}

export function setCurrentFolderId(id) {
    currentFolderId = id;
}

export function getSelectedFileId() {
    return selectedFileId;
}

export function setSelectedFileId(id) {
    selectedFileId = id;
}

export function incrementIdNum() {
    idNum++;
}
export function updateEditorVisibility() {
    if (currentAppState !== 'Idle') idleScreenEl.style.display = 'none';
    else {
        idleScreenEl.style.display = 'flex';
    }
}

export function getFileHolderState() {
    return isFileHolderOpen;
}
export function toggleFileHolderState() {
    isFileHolderOpen = !isFileHolderOpen;
}

export function getDraggedElId() {
    return draggedElId;
}
export function setDraggedElid(id) {
    draggedElId = id;
}
