import { USER, updateUserData } from './user.js';
import { createNewNote, highlightSelectedFile } from './editor.js';
import {
    currentFolderId,
    isFileHolderOpen,
    toggleFileHolderState,
    incrementIdNum,
    idNum,
    getSelectedFileId,
    setSelectedFileId,
    setAppState,
    setDraggedElid,
    getDraggedElId,
    selectedFileId,
    getTabIndexFromFileId,
    openFolderIds,
} from './state.js';
import { getFileIndex, getFormattedDate } from './storage.js';
import { openFile, checkIfTabExists, deleteTab } from './tabs.js';
import { getMenuBtns } from './filetree/rightClickMenu.js';

export const fileTreeEl = document.getElementById('filetree');
const fileTreeContainerEl = document.getElementById('files-container');
const createNoteBtn = document.getElementById('create-note-btn');
const createFolderBtn = document.getElementById('create-folder-btn');
const pinnedDisplayEl = document.getElementById('pinned');

createNoteBtn.addEventListener('click', () => createNewNote(false));
createFolderBtn.addEventListener('click', createFolder);

fileTreeContainerEl.addEventListener('dragenter', dragEnter);
fileTreeContainerEl.addEventListener('dragover', dragOver);
fileTreeContainerEl.addEventListener('dragleave', dragLeave);
fileTreeContainerEl.addEventListener('drop', drop);
pinnedDisplayEl.addEventListener('dragenter', dragEnter);
pinnedDisplayEl.addEventListener('dragover', dragOver);
pinnedDisplayEl.addEventListener('dragleave', dragLeave);
pinnedDisplayEl.addEventListener('drop', drop);

export function renderFiletree() {
    fileTreeContainerEl.innerHTML = '';
    const sortedFiles = USER.files.toSorted((a, b) => a.title.localeCompare(b.title));
    sortedFiles.forEach((file) => {
        if (file.parentId) return;
        if (file.type === 'folder') {
            renderFolder(file, 0, fileTreeContainerEl);
        } else {
            fileTreeContainerEl.appendChild(renderFile(file));
        }
    });
    renderPinnedFiles()
    highlightSelectedFile(selectedFileId);
}

function renderFolder(folder, depth = 0, container, lastOfFolder) {
    const folderCard = new FileCard(folder, container, lastOfFolder);
    folderCard.element.style.paddingLeft = `${depth * 12}px`;
    container.appendChild(folderCard.element);

    if (!openFolderIds.has(folder.id)) return;

    const folderContents = USER.files
        .filter((f) => f.parentId === folder.id)
        .toSorted((a, b) => a.title.localeCompare(b.title));

    const lastIndex = folderContents.length - 1;

    folderContents.forEach((file, index) => {
        const isLast = index === lastIndex;

        if (file.type === 'folder') {
            renderFolder(file, depth + 1, container, isLast);
        } else {
            const card = renderFile(file, isLast);
            card.style.paddingLeft = `${(depth + 1) * 12}px`;
            container.appendChild(card);
        }
    });
}

function renderFile(file, lastOfFolder) {
    const fileCard = new FileCard(file, fileTreeContainerEl, lastOfFolder);
    return fileCard.element;
}

class FileCard {
    constructor(file, container = fileTreeContainerEl, lastOfFolder) {
        this.file = file;
        this.id = file.id;
        this.container = container;
        this.lastOfFolder = lastOfFolder;
        this.element = this.createElement();
    }

    createElement() {
        const card = document.createElement('div');
        card.id = this.file.id;
        card.addEventListener('click', () => {
            openFile(this.file.id);
        });
        this.addDragEventListner(card);
        const type = this.file.type;
        const imgSrc = returnImgBasedOnFileType(type, this.lastOfFolder, this.id);
        card.classList.add('file-card');
        const fileCardHeader = document.createElement('div');
        fileCardHeader.classList.add('file-card-header');
        fileCardHeader.innerHTML = `
            <img class="file-card-img" src="${imgSrc}">
            <p class="file-name">${this.file.title}</p>
        `;
        card.appendChild(fileCardHeader);

        if (this.file.type === 'folder') {
            this.addDropListener(card);
            card.classList.add('folder');
            fileCardHeader.addEventListener('click', () => {
                if (openFolderIds.has(this.id)) {
                    openFolderIds.delete(this.id);
                } else {
                    openFolderIds.add(this.id);
                }
                renderFiletree();
            });
        }
        return card;
    }

    addDragEventListner(card) {
        card.draggable = 'true';
        card.addEventListener('dragstart', dragstart);
    }

    addDropListener(card) {
        card.addEventListener('dragenter', dragEnter);
        card.addEventListener('dragover', dragOver);
        card.addEventListener('dragleave', dragLeave);
        card.addEventListener('drop', drop);
    }
}

function dragstart(e) {
    setDraggedElid(e.currentTarget.id);
}

function dragEnter(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function dragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function dragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function drop(e) {
    e.currentTarget.classList.remove('drag-over');
    const draggedId = Number(getDraggedElId());
    const targetId = Number(e.currentTarget.id);

    if (draggedId === targetId) return;
    if (isDescendant(draggedId, targetId)) return;

    const draggedFile = USER.files[getFileIndex(draggedId)];
    if (!draggedFile) return;

    if (e.currentTarget.id === 'files-container') {
        draggedFile.parentId = null;
        draggedFile.pinned = false;
    } else if (e.currentTarget.id === 'pinned') {
        draggedFile.pinned = true;
        draggedFile.parentId = null;
        renderFiletree();
    } else {
        if (draggedId === selectedFileId && !openFolderIds.has(targetId)) {
            openFolderIds.add(targetId);
        }
        draggedFile.parentId = targetId;
        draggedFile.pinned = false;
    }
    setDraggedElid(null);
    updateUserData();
    renderFiletree();
}

function isDescendant(draggedId, targetId) {
    let current = USER.files[getFileIndex(targetId)];
    while (current && current.parentId !== null) {
        if (current.parentId === draggedId) return true;
        current = USER.files[getFileIndex(current.parentId)];
    }
    return false;
}

function returnImgBasedOnFileType(fileType, lastOfFolder, fileId) {
    if (lastOfFolder && fileType !== 'folder') return '/src/assets/filetree-el.svg';
    else if (fileType === 'note') return 'src/assets/filetree-file.svg';
    else if (fileType === 'folder') {
        if (openFolderIds.has(fileId)) return 'src/assets/folder-open.svg';
        else return 'src/assets/folder-closed.svg';
    }
}

export function createFolder() {
    removeTempFile();
    const temporaryCard = document.createElement('div');
    temporaryCard.classList.add('file-card', 'temp');
    temporaryCard.innerHTML = `
        <div class="file-card-header temp-card">
            <img class="file-card-img" src="src/assets/folder-closed.svg">
            <input type="text" class="temp-card-input">
        </div>
    `;
    fileTreeContainerEl.appendChild(temporaryCard);
    const input = document.querySelector('.temp-card-input');
    input.focus();

    let completed = false;
    const finish = (save) => {
        if(completed) return;
        
        completed = true;
        const folderName = input.value.trim();

        if(save && folderName) {
            saveFolder(folderName)
            renderFiletree()
        }

        removeTempFile()
    }
    input.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') finish(true);
        else if(e.key === 'Escape') finish(false);
    })
    input.addEventListener('blur', () => finish(true));
}

function removeTempFile() {
    const tempFile = document.querySelector('.temp');
    if (tempFile) tempFile.remove();
}

function saveFolder(folderName) {
    const id = idNum;
    const date = getFormattedDate(new Date());
    USER.files.push({
        title: folderName,
        body: '',
        id,
        type: 'folder',
        parentId: currentFolderId,
        date,
        lastEdited: date,
        tags: [],
    });
    incrementIdNum();
    updateUserData();
}

export function openFileHolder() {
    fileTreeEl.classList.remove('closed');
}

export function closeFileHolder() {
    fileTreeEl.classList.add('closed');
}

export function toggleFileHolder() {
    isFileHolderOpen ? closeFileHolder() : openFileHolder();
    toggleFileHolderState();
}

function createRightClickMenu(posX, posY, file, sourceEl) {
    const menu = document.createElement('div');
    menu.classList.add('right-click-menu');

    const menuBtns = getMenuBtns(file);
    menuBtns.forEach(btn => {
        const btnEl = btn.createElement(file.id);
        btnEl.addEventListener('click', () => {
            btn.activate(file.id, sourceEl)
            menu.remove()
        })
        menu.appendChild(btnEl);
    }) 

    menu.style.left = posX + 'px';
    menu.style.top = posY + 'px';
    menu.style.position = 'fixed';

    return menu;
}

export function createFileInFolder(fileID) {
    createNewNote(false, fileID)
}

export function duplicateFile(fileID) {
    const file = USER.files[getFileIndex(fileID)];
    const id = idNum;
    const date = getFormattedDate(new Date());
    let newTitle = getDuplicateTitle(fileID, file.title);

    USER.files.push({
        title: newTitle,
        body: file.body,
        id,
        type: 'note',
        parentId: file.parentId,
        date,
        lastEdited: date,
    });

    updateUserData();
    incrementIdNum();
    renderFiletree();
    openFile(id);
}

function getDuplicateTitle(ID, title, attempt=2) {
    const titleTarget = `${title} ${attempt}`;
    const duplicate = USER.files.find(file => file.title === titleTarget && file.id != ID);

    if(duplicate) {
        return getDuplicateTitle(ID, title, (attempt + 1))

    } else {
        return titleTarget;
    }
}

export function deleteFile(id) {
    const file = USER.files[getFileIndex(id)];
    if (file.pinned) {
        unpinFile(file);
    }
    file.dateOfDeletion = new Date();
    USER.recentlyDeleted.push(file);
    if (USER.recentlyDeleted.length > 50) USER.recentlyDeleted.shift();
    USER.files.splice(getFileIndex(id), 1);
    updateUserData();
    renderFiletree();
    if (id === getSelectedFileId()) {
        setSelectedFileId(null);
        setAppState('Idle');
    }
    if (checkIfTabExists(id)) {
        deleteTab(USER.tabs[getTabIndexFromFileId(id)].id);
    }
}

export function changeTitleToInput(element, file) {
    const existingTemp = document.querySelector('.temp-card');
    if (existingTemp) {
        existingTemp.remove();
        renderFiletree();
        element = document.getElementById(file.id);
    }

    element.innerHTML = ``;
    let imgSrc = 'src/assets/filetree-file.svg';
    if (file.type === 'folder') imgSrc = 'src/assets/folder-closed.svg';

    const tempCard = document.createElement('div');
    tempCard.innerHTML = `
        <div class="file-card-header temp-card">
            <img class="file-card-img" src="${imgSrc}">
            <input type="text" class="temp-card-input" value="${file.title}">
        </div>`;

    const parentPadLeft = getComputedStyle(element).paddingLeft;
    tempCard.style.setProperty('--indent', parentPadLeft);
    element.appendChild(tempCard);

    const input = tempCard.querySelector('.temp-card-input');

    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            file.title = input.value;
            updateUserData();
            renderFiletree();
        }
    });
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
}

export function findFiletreeEl(fileId) {
    const fileCards = document.querySelectorAll('.file-card');
    return Array.from(fileCards).find((card) => card.id === String(fileId));
}

fileTreeContainerEl.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    const file = event.target.closest('.file-card');
    if (!file) return;
    document.querySelector('.right-click-menu')?.remove();
    const menu = createRightClickMenu(
        event.clientX,
        event.clientY,
        USER.files[getFileIndex(Number(file.id))],
        file,
    );

    fileTreeEl.appendChild(menu);

    const menuRect = menu.getBoundingClientRect()
    if(menuRect.bottom > window.innerHeight) {
        menu.style.top = (event.clientY - menuRect.height - 10) + 'px';
    }

    menu.addEventListener('click', (e) => e.stopPropagation());
    window.addEventListener('click', () => menu.remove(), { once: true });
});

pinnedDisplayEl.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    const file = event.target.closest('.file-card');
    if (!file) return;
    document.querySelector('.right-click-menu')?.remove();
    const menu = createRightClickMenu(
        event.clientX,
        event.clientY,
        USER.files[getFileIndex(Number(file.id))],
        file,
    );
    fileTreeEl.appendChild(menu);

    const menuRect = menu.getBoundingClientRect()
    if(menuRect.bottom > window.innerHeight) {
        menu.style.top = (event.clientY - menuRect.height - 10) + 'px';
    }

    menu.addEventListener('click', (e) => e.stopPropagation());
    window.addEventListener('click', () => menu.remove(), { once: true });
});

export function unpinFile(file) {
    file.pinned = false;
    updateUserData();
    renderFiletree();
}

export function pinFile(file) {
    file.pinned = true;
    updateUserData();
    renderFiletree();
}

export function renderPinnedFiles() {
    pinnedDisplayEl.innerHTML = '';
    const pinnedFiles = USER.files.filter((f) => f.pinned === true);

    if (pinnedFiles.length < 1) {
        pinnedDisplayEl.style.display = 'none';
        return;
    }

    pinnedDisplayEl.style.display = 'block';

    pinnedFiles.forEach((file) => {
        if (file.type === 'folder') {
            renderFolder(file, 0, pinnedDisplayEl);
        } else {
            pinnedDisplayEl.appendChild(renderFile(file));
        }
    });
    highlightSelectedFile(getSelectedFileId());
}
