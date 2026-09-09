import { USER, updateUserData } from '../../user.js';

export function createSelect(lists, currentList, onSwitch) {
    const selectEl = document.createElement('div');
    selectEl.classList.add('custom-select');

    const displayingList = document.createElement('div');
    displayingList.classList.add('displaying-list-option', 'custom-dropdown-option');
    displayingList.textContent = `用${currentList}`;

    let dropdownEl = null;

    displayingList.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dropdownEl) {
            dropdownEl.remove();
            dropdownEl = null;
            return;
        }
        dropdownEl = createDropdown(lists, currentList, (listName) => {
            currentList = listName;
            displayingList.textContent = `用${currentList}`;
            onSwitch(listName);
            dropdownEl?.remove();
            dropdownEl = null;
        });
        if (dropdownEl) selectEl.appendChild(dropdownEl);
    });

    selectEl.appendChild(displayingList);

    // exposed so todo.js can keep this select's label in sync
    // (e.g. after creating a brand-new list via the '+' input)
    selectEl.setDisplayedList = (listName) => {
        currentList = listName;
        displayingList.textContent = `用${currentList}`;
    };

    return selectEl;
}

function createDropdown(lists, currentList, onPick) {
    if (lists.length <= 1) return null;

    const dropdown = document.createElement('div');
    dropdown.classList.add('custom-dropdown');

    lists.forEach((list) => {
        const listName = list.name;
        if (listName === currentList) return;

        const option = createOption(listName, dropdown);
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            onPick(listName);
        });

        dropdown.appendChild(option);
    });

    return dropdown;
}

function createOption(listName, dropdown) {
    const option = document.createElement('div');
    option.classList.add('custom-dropdown-option');

    const title = document.createElement('p');
    title.classList.add('dropdown-option-title');
    title.textContent = listName;

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('dropdown-delete-btn');
    deleteBtn.textContent = 'x';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        const listIndex = USER.todo.lists.findIndex((list) => list.name === listName);
        if (USER.todo.lists.length - 1 <= 0) {
            showToast();
            return;
        }
        USER.todo.lists.splice(listIndex, 1);
        updateUserData();
        option.remove();
        if (USER.todo.lists.length <= 1) dropdown.remove();
    };

    option.append(title, deleteBtn);
    return option;
}
