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
import { createIcon } from '../icons.js';

class MenuItem {
    constructor(obj){
        this.fn = obj.fn;
        this.text = obj.text;
        this.image = obj.image;
        this.classes = obj.classes;
    };

    createElement(fileID) {
        const btn = document.createElement('div');
        btn.classList.add('rc-menu-item');

        const icon = document.createElement('div');
        icon.classList.add('rc-menu-item-icon');

        const iconContent = createIcon(this.image);
        icon.append(iconContent);

        const label = document.createElement('p');
        label.classList.add('rc-menu-item-label');
        
        if(this.classes.length) {
            this.classes.forEach(c => {
                btn.classList.add(c)
            })
        }

        let labelText = this.text;
        if(labelText === 'Pin' && USER.files[getFileIndex(fileID)].pinned){
            labelText = 'Unpin'
        }
        label.textContent = labelText;

        btn.append(icon, label);
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
            image: 'pencil',
            fn: (fileID, sourceEl) => {
                const file = USER.files[getFileIndex(fileID)];
                changeTitleToInput(sourceEl, file);
            }
        }),

        moveTo: new MenuItem({
            text: 'Move To',
            classes: [],
            image: 'folders',
            fn: (fileID) => {
                createMethodMenu('move', fileID);
            }
        }),

       
        delete: new MenuItem({
            text: 'Delete',
            classes: ['rc-delete-btn'],
            image: 'trash',
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
            image: 'download',
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
            text: 'Merge into',
            classes: [],
            image: 'merge',
            fn: (fileID) => {
                createMethodMenu('merge', fileID);
            }
        }),

        duplicate: new MenuItem({
            text: 'Duplicate',
            classes: [],
            image: 'duplicate',
            fn: (fileID) => {
                duplicateFile(fileID);
            }

        }),

        pin: new MenuItem({
            text: 'Pin note',
            classes: ['rc-pin-btn'],
            image: 'pin',
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
            text: 'Create new note',
            classes: [],
            image: 'add-file',
            fn: (fileID) => {
                createFileInFolder(fileID)
            }
        }),

        deleteAll: new MenuItem({
            text: 'Delete all',
            classes: ['rc-delete-btn'],
            image: 'trash',
            fn: async (fileID) => {
                const file = USER.files[getFileIndex(fileID)];
                const confirmed = await confirmDeletion(`delete "${file.title}"?`);
                if (!confirmed) return;
                
                function deleteFolderChildren(parentFolderID) {
                    const folderChildren = USER.files.filter(f => f.parentId === parentFolderID)

                    folderChildren.forEach(childFile => () => {
                        if(childFile.type === 'folder') {
                            deleteFolderChildren(childFile.id)
                            deleteFile(childFile.id)
                        } else {
                            deleteFile(childFile.id)
                        }
                    })
                }
                
                deleteFolderChildren(fileID);
                deleteFile(fileID);
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
        if(USER.files.length > 1) {
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
