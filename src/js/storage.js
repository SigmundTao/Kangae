import { USER } from './user.js';

export function getFileIndex(id) {
    const index = USER.files.findIndex((i) => i.id === Number(id));
    return index;
}

export function checkForDuplicateTitles(title, id) {
    return USER.files.some((file) => file.id !== id && file.title === title);
}

export function getFormattedDate(dateObj) {
    return formatDateJP(dateObj);
}

function formatDateJP(date) {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

