import { USER, updateUserData } from './user.js';
import {
    MODULE_TYPES,
    NOTE_MODES,
    updateTabTitle,
    selectedFileId,
    openFolderIds,
    setCurrentTabId,
    tabId,
    currentTabId,
    getTabIndex,
    getTabIndexFromFileId,
    incrementTabId,
    setSelectedFileId,
    currentNoteMode,
    setCurrentNoteMode,
} from './state.js';
import { checkForDuplicateTitles, getFileIndex } from './storage.js';
import {
    highlightSelectedFile,
    getTitleInput,
    getBodyInput,
    saveNote,
    saveTitle,
    saveBody,
} from './editor.js';
import { deleteFile } from './filetree.js';
import { md } from './markdown.js';
import { createDashboard } from './dashboard.js';
import {
        createFlashcardModule,
        createState as createFlashcardState,
} from './sidebar/flashcards.js';
import { 
    createPomodoroModule,
    destroyPomodoroTimer,
    updateTabTitle as updatePomodoroTabTitle,
} from './sidebar/pomodoro.js';
import { createToDoList } from './sidebar/todo.js';
import { createTabMenu } from './tabs/tabMenu.js';
import { createIcon } from './icons.js';

const page = document.getElementById('page');
export const currentTabEl = document.getElementById('current-tab');
const tabBar = document.getElementById('tab-bar');
let noteDebounce;
const MODULE_CREATORS = {
    pomodoro: createPomodoroModule,
    todo: createToDoList,
    flashcards: createFlashcardModule,
};

function getTabContainer() {
    return currentTabEl.querySelector('.tab');
}

function getClickCharOffset(e) {
    const blockEl = e.target.closest('[data-line]');
    if (!blockEl) return 0;

    const start = parseInt(blockEl.dataset.start, 10);
    const length = parseInt(blockEl.dataset.length, 10);

    let range = null;
    if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
        if (pos) {
            range = document.createRange();
            range.setStart(blockEl, 0);
            range.setEnd(pos.offsetNode, pos.offset);
        }
    } else if (document.caretRangeFromPoint) {
        const r = document.caretRangeFromPoint(e.clientX, e.clientY);
        if (r) {
            range = document.createRange();
            range.setStart(blockEl, 0);
            range.setEnd(r.startContainer, r.startOffset);
        }
    }

    const ratio = range ? range.toString().length / (blockEl.textContent.length || 1) : 0;
    return Math.round(start + ratio * length);
}

function getCursorLine(textarea) {
    return textarea.value.slice(0, textarea.selectionStart).split('\n').length - 1;
}

function placeCursorAtChar(textarea, charOffset) {
    const clamped = Math.max(0, Math.min(textarea.value.length, charOffset));
    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(clamped, clamped);
}

function getLineFromChar(text, charOffset) {
    return text.slice(0, charOffset).split('\n').length - 1;
}

function scrollToLine(markdownDiv, tab, lineNumber) {
    const blocks = [...markdownDiv.querySelectorAll('[data-line]')];
    let target = blocks[0];
    for (const b of blocks) {
        if (parseInt(b.dataset.line, 10) <= lineNumber) target = b;
        else break;
    }
    if (target) {
        const tabRect = tab.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        tab.scrollTop += targetRect.top - tabRect.top - tab.clientHeight * 0.3;
    }
}

function scrollToTextareaLine(textarea, tab, lineNumber) {
    const style = getComputedStyle(textarea);
    const lineHeight = parseFloat(style.lineHeight) || 24;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const y = paddingTop + lineNumber * lineHeight;
    tab.scrollTop = textarea.offsetTop + y - tab.clientHeight * 0.3;
}

function resizeTextarea(textarea) {
    textarea.style.height = '0px';
    textarea.style.height = `${textarea.scrollHeight}px`;
}

export function createTab(fileId, moduleType = null, isDefaultTab = false) {
    let tab = { file: fileId, id: tabId, moduleType, isDefaultTab};
    if(moduleType) {
        if(moduleType === 'flashcards') {
            tab.state = createFlashcardState()
        }
    }
    USER.tabs.push(tab);
    setCurrentTabId(tabId);
    incrementTabId();
    loadTab(currentTabId);
    renderTabs();
    updateUserData();
}

function syncMarkdownHeight(textarea, markdownDiv) {
    markdownDiv.style.minHeight = `${textarea.scrollHeight}px`;
}

function lineToChar(source, line) {
    const lines = source.split('\n');
    let offset = 0;
    for (let i = 0; i < line; i++) {
        offset += lines[i].length + 1; // +1 for the \n
    }
    return offset;
}

function renderMarkdownWithLines(source) {
    const tokens = md.parse(source, {});
    let html = '';
    let i = 0;

    while (i < tokens.length) {
        const token = tokens[i];

        if (token.level !== 0 || !token.map) {
            i++;
            continue;
        }

        // collect this block's full token set (open + children + close)
        const chunk = [token];
        let j = i + 1;
        if (token.nesting === 1) {
            while (j < tokens.length && !(tokens[j].level === 0 && tokens[j].nesting === -1)) {
                chunk.push(tokens[j]);
                j++;
            }
            if (j < tokens.length) {
                chunk.push(tokens[j]); // the closing token
                j++;
            }
        } else {
            j = i + 1; // self-closing block (e.g. hr, fence)
        }

        const [startLine, endLine] = token.map;
        const startChar = lineToChar(source, startLine);
        const endChar = lineToChar(source, endLine);
        const blockHtml = md.renderer.render(chunk, md.options, {});

        html += `<div data-line="${startLine}" data-start="${startChar}" data-length="${endChar - startChar}">${blockHtml}</div>`;
        i = j;
    }

    return html;
}

export function loadTab(id) {
    const tabIndex = getTabIndex(id);
    if (tabIndex === -1) return;
    const tab = USER.tabs[tabIndex];
    setCurrentTabId(id);

    if (tab.moduleType) {
        createModuleView(tab);
        setSelectedFileId(null);
        highlightSelectedFile();
    } else if (tab.isDefaultTab) {
        createDefaultView();
        setSelectedFileId(null);
        highlightSelectedFile();
    } else {
        const file = USER.files[getFileIndex(tab.file)];
        setSelectedFileId(file.id);
        highlightSelectedFile(file.id);
        createNoteView(file);
    }
}

function createModuleView(tab) {
    updateTabTitle(tab.type);
    currentTabEl.innerHTML = '';
    const content = getModuleContent(tab);
    if(tab.type === MODULE_TYPES.FLASHCARDS) {
        content.classList.add('tab-flashcards');
    }
    currentTabEl.appendChild(content);
    renderTabs();
}

function getModuleContent(tab) {
    if(tab.moduleType === MODULE_TYPES.POMODORO) return createPomodoroModule(tab.id)
    else if(tab.moduleType === MODULE_TYPES.FLASHCARDS) return createFlashcardModule(tab.state)
    else return MODULE_CREATORS[tab.moduleType]?.();
}

export function createDefaultTab() {
    if (checkForDefaultTabs() !== -1) {
        switchToTab(USER.tabs[USER.tabs.findIndex((t) => t.file === null)].id);
        return;
    }
    createTab(null, null, true);
}

export function switchToTab(id) {
    setCurrentTabId(id);
    loadTab(id);
    renderTabs();
}

export function switchToNextTab() {
    const currentIndex = getTabIndex(currentTabId);
    if (currentIndex + 1 > USER.tabs.length - 1) return;
    switchToTab(USER.tabs[currentIndex + 1].id);
}

export function switchToPrevTab() {
    const currentIndex = getTabIndex(currentTabId);
    if (currentIndex - 1 < 0) return;
    switchToTab(USER.tabs[currentIndex - 1].id);
}

export function deleteTab(id) {
    const tabIndex = getTabIndex(id);
    const tab = USER.tabs[tabIndex];
    if (tab?.moduleType === 'pomodoro') {
        destroyPomodoroTimer(id);
    }
    USER.tabs.splice(tabIndex, 1);
    if (USER.tabs.length < 1) {
        currentTabEl.innerHTML = '';
        createDefaultTab();
        highlightSelectedFile(null);
        return;
    }

    if (currentTabId === id) {
        const nextTab = USER.tabs[tabIndex] || USER.tabs[tabIndex - 1];
        switchToTab(nextTab.id);
    } else {
        renderTabs();
    }
}

export function renderTabs() {
    tabBar.innerHTML = '';
    USER.tabs.forEach((tab) => {
        const tabCard = createTabCard(tab);

        if (tab.id === currentTabId) {
            tabCard.classList.add('current-tab');
            const currentFile = USER.files[getFileIndex(tab.file)];

            if (currentFile) {
                let parentId = currentFile.parentId;
                while (parentId) {
                    openFolderIds.add(parentId);
                    const parentFolder = USER.files.find(
                        (f) => f.id === parentId && f.type === 'folder'
                    );
                    parentId = parentFolder ? parentFolder.parentId : null;
                }
            }
        }
        tabBar.appendChild(tabCard);
    });

    const addTabBtn = document.createElement('button');
    addTabBtn.classList.add('add-tab-btn');
    addTabBtn.textContent = '+';
    addTabBtn.addEventListener('click', (e) => {
        if (document.querySelector('.tab-menu')) return;
        page.appendChild(createTabMenu(e.clientX, e.clientY));
    });

    tabBar.appendChild(addTabBtn);
}

function createTabCard(tab) {
    const tabCard = document.createElement('div');
    tabCard.classList.add('tab-card');
    tabCard.id = tab.id;

    const titleSpan = document.createElement('span');
    titleSpan.classList.add('tab-card-title');

    const tabTitle = document.createElement('p');
    tabTitle.id = `tab-title-${tab.id}`;
    
    if (tab.moduleType) {
        tabTitle.textContent = tab.moduleType.charAt(0).toUpperCase() + tab.moduleType.slice(1);
    } else if (!tab.file) {
        tabTitle.textContent = 'Dashboard';
    } else {
        tabTitle.textContent = USER.files[getFileIndex(tab.file)].title;
    }

    const closeTabBtn = document.createElement('button');
    closeTabBtn.classList.add('close-tab-btn');
    closeTabBtn.textContent = 'X';
    closeTabBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTab(tab.id);
        updateUserData();
    });

    tabCard.addEventListener('click', () => switchToTab(tab.id));
    titleSpan.appendChild(tabTitle);
    tabCard.appendChild(titleSpan);
    tabCard.appendChild(closeTabBtn);
    return tabCard;
}

export function openFile(fileId) {
    if (USER.files[getFileIndex(fileId)].type === 'folder') return;
    if (checkIfTabExists(fileId)) {
        const tabIndex = getTabIndexFromFileId(fileId);
        switchToTab(USER.tabs[tabIndex].id);
    } else {
        if (checkForDefaultTabs() !== -1) {
            overwriteDefaultTab(fileId);
            loadTab(USER.tabs[getTabIndexFromFileId(fileId)].id);
            const defaultTabIndex = USER.tabs.findIndex((t) => t.file === fileId);
            switchToTab(USER.tabs[defaultTabIndex].id);
        } else {
            createTab(fileId);
        }
    }
}

export function checkForDefaultTabs() {
    const defaultTab = USER.tabs.findIndex(t => t.isDefaultTab === true);

    if(defaultTab !== -1){
        return 1;
    } else {
        return -1;
    }
}

export function checkIfTabExists(fileId) {
    return USER.tabs.findIndex((t) => t.file === fileId) !== -1;
}

function createDefaultView() {
    updateTabTitle(null);
    createDashboard();
}

function createNoteView(file) {
    updateTabTitle(file.title);
    currentTabEl.innerHTML = '';

    const tab = document.createElement('div');
    tab.classList.add('tab');

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.classList.add('note-title');
    titleInput.value = file.title;

    const persistentTitle = document.createElement('div');
    persistentTitle.textContent = titleInput.value;
    persistentTitle.classList.add('persistent-title');

    const noteContentInput = document.createElement('textarea');
    noteContentInput.classList.add('note-body-input');
    noteContentInput.value = file.body;

    function resizeTextarea() {
        noteContentInput.style.height = '0px';
        noteContentInput.style.height = `${noteContentInput.scrollHeight}px`;
    }

    const markdownDisplay = document.createElement('div');
    markdownDisplay.classList.add('note-body-markdown');
    markdownDisplay.id = 'markdown-div';
    markdownDisplay.addEventListener('click', (e) => {
        if (e.target.matches('input[type="checkbox"]')) {
            toggleCheckboxInBody(file, e.target, markdownDisplay, noteContentInput);
        } else {
            switchToEditMode(noteContentInput, markdownDisplay, getClickCharOffset(e));
        }
    });


    const countHolder = document.createElement('div');
    countHolder.classList.add('count-holder');

    tab.appendChild(titleInput);
    tab.appendChild(noteContentInput);
    tab.appendChild(markdownDisplay);

    currentTabEl.appendChild(countHolder);
    currentTabEl.appendChild(tab);
    currentTabEl.appendChild(persistentTitle);
    resizeTextarea()

    updateCountHolder(countHolder, file, currentNoteMode);
    switchToDisplayMode(noteContentInput, markdownDisplay);

    titleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const failedToSave = saveTitle(file);
            if(failedToSave) return;
            else switchToEditMode(noteContentInput, markdownDisplay);
        }
    });

    noteContentInput.addEventListener('input', () => {
        resizeTextarea();
        syncMarkdownHeight(noteContentInput, markdownDisplay);
        clearTimeout(noteDebounce);

        noteDebounce = setTimeout(() => {
            saveBody(file);
            updateCountHolder(countHolder, file);
        }, 1500);
    });

    titleInput.focus();
}

function toggleCheckboxInBody(file, target, markdownElement, noteBody) {
    const checkboxes = [...markdownElement.querySelectorAll('input[type="checkbox"]')];
    const index = checkboxes.indexOf(target);
    let count = -1;
    file.body = file.body.replace(/- \[(x| )\]/gi, (match) => {
        count++;
        return count === index ? (match.includes('x') ? '- [ ]' : '- [x]') : match;
    });
    noteBody.value = file.body;
    saveNote(file);
    switchToDisplayMode(noteBody, markdownElement);
}

function getMarkdownEl() {
    return document.getElementById('markdown-div');
}

export function toggleNoteView() {
    const bodyInput = getBodyInput();
    const markdownEl = getMarkdownEl();

    if (bodyInput && markdownEl) {
        if (currentNoteMode === 'display') {
            switchToEditMode(bodyInput, markdownEl);
        } else {
            switchToDisplayMode(bodyInput, markdownEl, getCursorLine(bodyInput));
        }
    }
    updateCountHolder(getCountHolder(), USER.files[getFileIndex(selectedFileId)], currentNoteMode);
}

function switchToDisplayMode(bodyInput, markdownDiv, lineOverride = null) {
    const tab = getTabContainer();
    const line = lineOverride !== null ? lineOverride : getCursorLine(bodyInput);

    markdownDiv.innerHTML = renderMarkdownWithLines(bodyInput.value);
    markdownDiv.querySelectorAll('input[type="checkbox"]').forEach((cb) => (cb.disabled = false));
    bodyInput.style.display = 'none';
    markdownDiv.style.display = 'flex';
    setCurrentNoteMode('display');

    requestAnimationFrame(() => scrollToLine(markdownDiv, tab, line));

    setTimeout(() => {
        document.querySelectorAll('.progress-bar-fill').forEach((bar) => {
            bar.style.width = bar.dataset.value + '%';
        });
    }, 0);
}

function switchToEditMode(bodyInput, markdownDiv, charOverride = null) {
    const tab = getTabContainer();
    const charOffset = charOverride !== null ? charOverride : 0;
    const line = getLineFromChar(bodyInput.value, charOffset);

    markdownDiv.style.display = 'none';
    bodyInput.style.display = 'flex';
    setCurrentNoteMode('edit');
    resizeTextarea(bodyInput);

    requestAnimationFrame(() => {
        placeCursorAtChar(bodyInput, charOffset);
        scrollToTextareaLine(bodyInput, tab, line);
    });
}

export function updateCountHolder(holder, file, mode) {
    const iconHolder = document.createElement('div');
    iconHolder.classList.add('note-mode-img');

    let icon;
    if (mode === 'display') icon = createIcon('view');
    else icon = createIcon('pencil');

    iconHolder.append(icon);

    const wordCount = getWordCount(file)
    const wordLabel = wordCount === 1 ? 'Word' : 'Words';
    const wordCountHolder = document.createElement('div');
    wordCountHolder.classList.add('word-count');
    wordCountHolder.textContent = `${wordCount} ${wordLabel}`;

    const charCount = getCharacterCount(file);
    const charLabel = charCount === 1 ? 'Character' : 'Characters'
    const charCountHolder = document.createElement('div');
    charCountHolder.classList.add('char-count');
    charCountHolder.textContent = `${charCount} ${charLabel}`;

    holder.innerHTML = '';
    holder.append(iconHolder, wordCountHolder, charCountHolder);
}

export function getCountHolder() {
    return document.querySelector('.count-holder');
}

export function getWordCount(file) {
    return file.body.split(' ').length;
}

function getCharacterCount(file) {
    return file.body.length;
}

export function overwriteDefaultTab(fileId) {
    const defaultTabIndex = USER.tabs.findIndex(f => f.isDefaultTab === true);

    USER.tabs[defaultTabIndex].file = fileId;
    USER.tabs[defaultTabIndex].isDefaultTab = false;

    updateUserData();
}
