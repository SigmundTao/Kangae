import { USER, updateUserData } from '../user.js';
import { createSelect } from './todo/customSelect.js';

// --- cross-instance data sync ---
const todoEvents = new EventTarget();
let instanceCounter = 0;

function broadcastListChanged(listName, sourceId) {
    todoEvents.dispatchEvent(
        new CustomEvent('list-changed', { detail: { listName, sourceId } })
    );
}

function findListIndex(listName) {
    return USER.todo.lists.findIndex((l) => l.name === listName);
}

function findTaskIndex(listName, taskTitle) {
    return USER.todo.lists[findListIndex(listName)].tasks.findIndex(
        (t) => t.taskName === taskTitle
    );
}

function createDefaultInput() {
    const input = document.createElement('input');
    input.classList.add('persistent-todo-input');
    return input;
}

function createTask(listName, taskValue) {
    USER.todo.lists[findListIndex(listName)].tasks.push({
        taskName: taskValue,
        completed: false,
    });
    updateUserData();
}

function removeTask(listName, taskName) {
    USER.todo.lists[findListIndex(listName)].tasks.splice(
        findTaskIndex(listName, taskName), 1
    );
    updateUserData();
}

function createTaskCard(taskDataObj, listName, sourceId) {
    const task = USER.todo.lists[findListIndex(listName)]
        .tasks[findTaskIndex(listName, taskDataObj.taskName)];

    const card = document.createElement('li');
    card.classList.add('task-card');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('task-checkbox');
    checkbox.checked = !!task.completed;
    checkbox.addEventListener('change', () => {
        task.completed = !task.completed;
        updateUserData();
        broadcastListChanged(listName, sourceId);
    });

    const titleCheckboxSpan = document.createElement('span');
    titleCheckboxSpan.classList.add('title-checkbox-span');

    const title = document.createElement('input');
    title.classList.add('todo-title-input');
    title.value = task.taskName;
    title.addEventListener('input', () => {
        task.taskName = title.value;
        updateUserData();
    });
    // sync other instances only once editing is done, not per keystroke
    title.addEventListener('blur', () => broadcastListChanged(listName, sourceId));

    const removeTaskBtn = document.createElement('button');
    removeTaskBtn.textContent = 'x';
    removeTaskBtn.classList.add('remove-task-btn');
    removeTaskBtn.addEventListener('click', () => {
        removeTask(listName, task.taskName);
        card.remove();
        broadcastListChanged(listName, sourceId);
    });

    titleCheckboxSpan.append(checkbox, title);
    card.append(titleCheckboxSpan, removeTaskBtn);
    return card;
}

export function createToDoList() {
    const sourceId = ++instanceCounter;
    let currentList = USER.todo.lists[0].name;

    const toDoList = document.createElement('div');
    toDoList.classList.add('todo-module');

    const listsContainer = document.createElement('div');
    listsContainer.classList.add('list-container');

    const taskContainer = document.createElement('div');
    taskContainer.classList.add('task-container');

    function render() {
        taskContainer.innerHTML = '';
        USER.todo.lists[findListIndex(currentList)].tasks.forEach((task) => {
            taskContainer.appendChild(createTaskCard(task, currentList, sourceId));
        });
    }

    function switchList(listName) {
        currentList = listName;
        render();
    }

    todoEvents.addEventListener('list-changed', (e) => {
        if (e.detail.sourceId === sourceId) return;
        if (e.detail.listName === currentList) render();
    });

    const selectEl = createSelect(USER.todo.lists, currentList, switchList);

    const addListBtn = document.createElement('button');
    addListBtn.classList.add('add-list-btn');
    addListBtn.textContent = '+';
    addListBtn.addEventListener('click', () => {
        if (listsContainer.querySelector('.list-input')) {
            listsContainer.querySelector('.list-input').focus();
            return;
        }
        const input = createListInput((listName) => {
            currentList = listName;
            selectEl.setDisplayedList(listName);
            render();
        });
        listsContainer.appendChild(input);
        input.focus();
    });

    const tasksAndInputContainerEl = document.createElement('div');
    tasksAndInputContainerEl.classList.add('task-input-container');

    const persistentInput = createDefaultInput();
    persistentInput.placeholder = 'Enter task here...';
    persistentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && persistentInput.value.length) {
            createTask(currentList, persistentInput.value.trim());
            render();
            broadcastListChanged(currentList, sourceId);
            persistentInput.value = '';
            persistentInput.focus();
        }
    });

    listsContainer.append(selectEl, addListBtn);
    tasksAndInputContainerEl.append(taskContainer, persistentInput);
    toDoList.append(listsContainer, tasksAndInputContainerEl);

    render();
    return toDoList;
}

function createListInput(onCreate) {
    const input = document.createElement('input');
    input.classList.add('list-input');
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const listName = input.value.trim();
            if (!listName) return;
            USER.todo.lists.push({ name: listName, tasks: [] });
            updateUserData();
            input.remove();
            onCreate(listName); // switches ONLY this instance
        }
    });
    return input;
}
