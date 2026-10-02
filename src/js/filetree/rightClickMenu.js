import { 
    deleteFile,
    duplicateFile,
    createFileInFolder,
    pinFile,
    unpinFile,
    findFiletreeEl,
    changeTitleToInput,
} from '../filetree.js';
import { USER } from '../user.js';
import { getFileIndex } from '../storage.js';
import { createMethodMenu } from './methodMenu.js';
import { exportSingleFile, exportFiles } from '../export.js';
import { confirmDeletion } from '../toast.js';

class MenuItem {
    constructor(obj){
        this.fn = obj.fn;
        this.text = obj.text;
        this.classes = obj.classes;
    };

    createElement(fileID) {
        const btn = document.createElement('div');
        btn.classList.add('rc-menu-item');
        
        if(this.classes.length) {
            this.classes.forEach(c => {
                btn.classList.add(c)
            })
        }

        let label = this.text;
        if(label === 'Pin' && USER.files[getFileIndex(fileID)].pinned){
            label = 'Unpin'
        }

        btn.textContent = label;
        return btn;
    }

    activate(fileID, sourceEl) {
        this.fn(fileID, sourceEl)
    }
}

const menuItems = {
    both: {
        rename: new MenuItem({
            text: 'Rename',
            classes: ['rc-rename-btn'],
            fn: (fileID, sourceEl) => {
                const file = USER.files[getFileIndex(fileID)];
                changeTitleToInput(sourceEl, file);
            }
        }),

        moveTo: new MenuItem({
            text: 'Move To',
            classes: [],
            fn: (fileID) => {
                createMethodMenu('move', fileID);
            }
        }),

       
        delete: new MenuItem({
            text: 'Delete',
            classes: ['rc-delete-btn'],
            fn: async (fileID) => {
                const file = USER.files[getFileIndex(fileID)];
                const confirmed = await confirmDeletion(`Delete "${file.title}"?`);
                if (!confirmed) return;

                if (file.type === 'folder') {
                    USER.files
                        .filter((f) => f.parentId === fileID)
                        .forEach((item) => { item.parentId = null; });
                }
                deleteFile(fileID);
            }
        }),

        exportFile: new MenuItem({
            text: 'Export',
            classes: [],
            fn: (fileID) => {
                const file = USER.files[getFileIndex(fileID)];
                if(file.type === 'folder') {
                    exportFiles(USER.files.filter(f => f.parentId === fileID), file.title);
                } else {
                    exportSingleFile(file);
                }
            }
        }),
    },
    noteOnly: {
        merge: new MenuItem({
            text: 'Merge Into',
            classes: [],
            fn: (fileID) => {
                createMethodMenu('merge', fileID);
            }
        }),

        duplicate: new MenuItem({
            text: 'Duplicate',
            classes: [],
            fn: (fileID) => {
                duplicateFile(fileID);
            }

        }),

        pin: new MenuItem({
            text: 'Pin',
            classes: ['rc-pin-btn'],
            fn: (fileID) => {
                const file = USER.files[getFileIndex(fileID)];
                if(file.pinned) {
                    unpinFile(file)
                } else {
                    pinFile(file)
                }
            }
        })

    },
    folderOnly: {
        newNoteInFolder: new MenuItem({
            text: 'New Note',
            classes: [],
            fn: (fileID) => {
                createFileInFolder(fileID)
            }
        }),

        deleteAll: new MenuItem({
            text: 'Delete All',
            classes: ['rc-delete-btn'],
            fn: async (fileID) => {
                const file = user.files[getfileindex(fileid)];
                const confirmed = await confirmdeletion(`delete "${file.title}"?`);
                if (!confirmed) return;

                if (file.type === 'folder') {
                    user.files
                        .filter((f) => f.parentid === fileid)
                        .foreach((item) => { item.parentid = null; });
                }
                deletefile(fileID);
    }
        }),
    },
};

export function getMenuBtns(file){
    const buttons = [];
    if(file.type === 'note') {
        buttons.push(menuItems.both.rename)
        if(USER.files.find(file => file.type === 'folder')) {
            buttons.push(menuItems.both.moveTo)
        }
        if(USER.files.length < 1) {
            buttons.push(menuItems.noteOnly.merge)
        }
        buttons.push(menuItems.noteOnly.duplicate)
        buttons.push(menuItems.noteOnly.pin)
        buttons.push(menuItems.both.exportFile)
        buttons.push(menuItems.both.delete)

    } else if(file.type === 'folder') {
        buttons.push(menuItems.both.rename)
        buttons.push(menuItems.both.exportFile)
        if(USER.files.filter(file => file.type === 'folder').length > 1) {
            buttons.push(menuItems.both.moveTo)
        }
        buttons.push(menuItems.folderOnly.newNoteInFolder)
        buttons.push(menuItems.both.delete)
        if(USER.files.filter(f => f.parentId === file.id).length) {
            buttons.push(menuItems.folderOnly.deleteAll)
        }
    }

    return buttons;
}
