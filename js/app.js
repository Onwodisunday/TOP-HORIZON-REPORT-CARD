/**
 * app.js
 * Main Controller
 */

import * as UI from './modules/ui.js';

// Init
console.log('Report Card Generator Initialized');
UI.init();

// Events
document.getElementById('add-subject-btn').addEventListener('click', () => {
    UI.addSubjectRow();
});

document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all data?')) {
        UI.resetForm();
    }
});

const saveBtn = document.getElementById('save-btn');
if (saveBtn) {
    saveBtn.addEventListener('click', () => {
        UI.manualSave();
    });
}
