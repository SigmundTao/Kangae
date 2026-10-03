import { USER } from './user.js';

export const TOAST_TYPES = {
    ERROR: 'Error',
    ALERT: 'Alert',
    WARN: 'Warning',
    DELETE: 'Delete',
};

export function showToast(message, type) {
    const element = createToastElement(message, type);
    document.body.appendChild(element);
    setTimeout(() => element.remove(), 2000);
}

export function confirmDeletion(message) {
    if (USER.doNotShowConfirmationAgain) return Promise.resolve(true);

    return new Promise((resolve) => {
        const toast = createConfirmationToast(message, (confirmed, dontAskAgain) => {
            toast.remove();
            if (confirmed && dontAskAgain) {
                USER.doNotShowConfirmationAgain = true;
            }
            resolve(confirmed);
        });
        document.body.appendChild(toast);
    });
}

function createToastElement(message, type) {
    const containerEl = document.createElement('div');
    containerEl.classList.add('toast-el');

    const messageHolder = document.createElement('div');
    messageHolder.classList.add('toast-message-holder');
    messageHolder.textContent = message;

    containerEl.append(messageHolder);
    return containerEl;
}

function createConfirmationToast(message, onDone) {
    const containerEl = document.createElement('div');
    containerEl.classList.add('toast-el', 'toast-confirm');

    const title = document.createElement('p');
    title.textContent = message;

    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    label.append(checkbox, ' Do not show this again');
    checkbox.addEventListener('change', () => {
        if(checkbox.checked = true) USER.doNotShowConfirmationAgain = true;
        else USER.doNotShowConfirmationAgain = false;
    })

    const btnHolder = document.createElement('div');
    btnHolder.classList.add('confirm-toast-btn-holder');

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => onDone(false, false));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => onDone(true, checkbox.checked));

    btnHolder.append(cancelBtn, deleteBtn);
    containerEl.append(title, label, btnHolder);
    return containerEl;
}
