/**
 * ui.js
 * Handles Complex Form Interactions and Report Rendering
 */

import { calculateAcademicGrade, ATTR_GRADES } from './grading.js';
import { getCurrentUser } from './auth.js';

// --- CONFIG ---
const PRIMARY_SUBJECTS = [
    'C.R.K', 'Verbal Reasoning', 'Civic Education', 'Moral Value', 'History',
    'Music', 'P.V.S', 'Agricultural Science', 'Diction', 'French',
    'Hand Writing', 'Current Affairs', 'Home Economics', 'Literature',
    'Mathematics', 'Basic Science', 'Social Studies', 'Quantitative Reasoning',
    'Computer', 'English Language', 'P.H.E', 'Vocational Aptitude',
    'Yoruba', 'Project'
];

const NURSERY_SUBJECTS = [
    'Letter Work', 'Health Habit', 'Civic Education', 'Poems', 'Social Habit',
    'French', 'Diction', 'Music', 'P.H.E', 'Hand Writing',
    'Verbal Reasoning', 'Number Work', 'Basic Science', 'Quantitative Reasoning',
    'Fine Art', 'C.R.K', 'Food and Nutrition'
];

const PREP_SUBJECTS = [
    'Letter Work', 'Basic Science', 'Civic Education', 'Social Habit',
    'Music', 'Diction', 'French', 'Hand Writing', 'Health Habit',
    'Verbal Reasoning', 'Number Work', 'Food and Nutrition', 'Poems',
    'Computer', 'Fine Art', 'C.R.K', 'Quantitative Reasoning'
];

const AFFECTIVE_TRAITS = [
    'PUNCTUALITY', 'CLASS ATTENDANCE', 'STUDY HABIT', 'TEAM SPIRIT',
    'RELATIONSHIP WITH OTHERS', 'SELF CONTROL', 'NEATNESS', 'OBEDIENCE', 'AVERAGE RATING'
];

const PSYCHOMOTOR_TRAITS = [
    'ADAPTATION', 'PERCEPTION', 'INITIATIVE', 'PRECISION',
    'NATURALIZATION', 'FLUENCY', 'AVERAGE RATING'
];

// --- ELEMENTS ---
const subjectsContainer = document.getElementById('subjects-container');
const affectiveContainer = document.getElementById('affective-container');
const psychomotorContainer = document.getElementById('psychomotor-container');

// Outputs
const outBody = document.getElementById('academic-body');
const outAffective = document.getElementById('affective-body');
const outPsychomotor = document.getElementById('psychomotor-body');
const chartContainer = document.getElementById('chart-container');

export function init() {
    renderTraitInputs(affectiveContainer, AFFECTIVE_TRAITS, 'aff');
    renderTraitInputs(psychomotorContainer, PSYCHOMOTOR_TRAITS, 'psy');

    // Attach Bio-Data Listeners
    setupBioListeners();
    // Attach Attendance Listeners
    setupAttendanceListeners();
    // Attach Comment Listeners
    setupCommentListeners();

    // Auto-Save Setup
    const container = document.querySelector('.app-container');
    if (container) {
        container.addEventListener('input', handleAutoSave);
        container.addEventListener('change', handleAutoSave);
    }
    loadDraft();

    // Always pre-fill subjects if container is empty OR only has blank rows
    const existingRows = subjectsContainer.querySelectorAll('.subject-row-input');
    const hasRealSubjects = Array.from(existingRows).some(row => {
        const nameInput = row.querySelector('.inp-sub-name');
        return nameInput && nameInput.value.trim() !== '';
    });

    if (!hasRealSubjects) {
        const user = getCurrentUser();
        if (user) {
            // Check for Primary 1-5
            if (/^(primary|basic|year|grade|p)\.?\s*[1-5]/i.test(user.class)) {
                subjectsContainer.innerHTML = '';
                PRIMARY_SUBJECTS.forEach(sub => addSubjectRow(sub));
            }
            // Check for Prep 1-2
            else if (/^(prep)\.?\s*[1-2]/i.test(user.class)) {
                subjectsContainer.innerHTML = '';
                PREP_SUBJECTS.forEach(sub => addSubjectRow(sub));
            }
            // Check for Nursery / Pre-Nursery if NOT Prep
            else if (/^(nursery|pre-nursery|n)\.?\s*[1-3]?/i.test(user.class) || /^(kg|kindergarten)/i.test(user.class)) {
                subjectsContainer.innerHTML = '';
                NURSERY_SUBJECTS.forEach(sub => addSubjectRow(sub));
            }
            else if (subjectsContainer.children.length === 0) {
                addSubjectRow();
            }
        } else if (subjectsContainer.children.length === 0) {
            addSubjectRow();
        }
    }

    // Initial Render
    updateReport();

    // Set Default Principal Signature
    const pSig = document.getElementById('out-principal-sig');
    if (pSig) {
        // Updated to match the found file
        pSig.src = 'assets/signature.png';
        pSig.style.display = 'block';
        pSig.onerror = function () {
            this.style.display = 'none';
        };
    }

    // --- Session Setup Check ---
    setTimeout(() => {
        const sessionInp = document.getElementById('inp-session');
        const termInp = document.getElementById('inp-term');

        // Only run if fields are empty (i.e. not loaded from draft)
        if (!sessionInp.value || !termInp.value) {
            const storedConf = localStorage.getItem('th_config');
            if (storedConf) {
                // Auto-fill from global config
                const c = JSON.parse(storedConf);
                if (c.session) sessionInp.value = c.session;
                if (c.term) termInp.value = c.term;
                if (c.nextTerm && document.getElementById('inp-next-term')) {
                    document.getElementById('inp-next-term').value = c.nextTerm;
                }

                // Trigger updates
                [sessionInp, termInp, document.getElementById('inp-next-term')].forEach(el => {
                    if (el) el.dispatchEvent(new Event('input'));
                });
            } else {
                // Show Setup Modal
                const modal = document.getElementById('setup-modal');
                const btn = document.getElementById('btn-start-session');

                if (modal && btn) {
                    modal.classList.add('active');

                    btn.addEventListener('click', () => {
                        const s = document.getElementById('setup-session').value;
                        const t = document.getElementById('setup-term').value;
                        const nt = document.getElementById('setup-next-term').value;

                        if (s && t) {
                            // Save Global Config
                            const newConf = { session: s, term: t, nextTerm: nt };
                            localStorage.setItem('th_config', JSON.stringify(newConf));

                            // Apply locally
                            sessionInp.value = s;
                            termInp.value = t;
                            const ntInp = document.getElementById('inp-next-term');
                            if (ntInp) ntInp.value = nt;

                            // Trigger updates
                            [sessionInp, termInp, ntInp].forEach(el => {
                                if (el) el.dispatchEvent(new Event('input'));
                            });

                            modal.classList.remove('active');
                        } else {
                            alert("Please enter Current Session and Term to continue.");
                        }
                    });
                }
            }
        }
    }, 500); // Slight delay to ensure draft load is finished
}

// --- POPULATE SUBJECTS (can be called from button) ---
export function populateSubjects() {
    subjectsContainer.innerHTML = '';
    PRIMARY_SUBJECTS.forEach(sub => addSubjectRow(sub));
    updateReport();
}

function renderTraitInputs(container, traits, prefix) {
    container.innerHTML = '';
    traits.forEach((trait, index) => {
        const div = document.createElement('div');
        div.className = 'trait-row';
        div.innerHTML = `
            <span class="trait-label">${trait}</span>
            <select class="trait-select" data-trait="${trait}" data-type="${prefix}">
                <option value="">-</option>
                ${ATTR_GRADES.map(g => `<option value="${g}">${g}</option>`).join('')}
            </select>
        `;
        div.querySelector('select').addEventListener('change', updateReport);
        container.appendChild(div);
    });
}

// --- SUBJECT MANAGEMENT ---
export function addSubjectRow(defaultName = '') {
    const row = document.createElement('div');
    row.className = 'subject-row-input';
    const isPreFilled = defaultName !== '';

    row.innerHTML = `
        <input type="text" class="inp-sub-name" placeholder="Subject Name" value="${defaultName}" 
               ${isPreFilled ? 'readonly style="background-color:#f9fafb; cursor:default; font-weight:500;"' : ''}>
        <input type="number" class="inp-sub-ca" placeholder="CA" min="0" max="40">
        <input type="number" class="inp-sub-exam" placeholder="Ex" min="0" max="60">
        <button class="btn-danger remove-btn" title="Remove">x</button>
    `;

    // Listeners with Validation
    row.querySelectorAll('input').forEach(i => {
        i.addEventListener('input', (e) => {
            const el = e.target;
            if (el.classList.contains('inp-sub-ca')) {
                if (el.value > 40) el.value = 40;
                if (el.value < 0) el.value = 0;
            }
            if (el.classList.contains('inp-sub-exam')) {
                if (el.value > 60) el.value = 60;
                if (el.value < 0) el.value = 0;
            }
            updateReport();
        });
    });
    row.querySelector('.remove-btn').addEventListener('click', () => {
        row.remove();
        updateReport();
    });

    subjectsContainer.appendChild(row);
}

// --- DATA LISTENING ---
function setupBioListeners() {
    const ids = ['name', 'class', 'roll', 'term', 'session', 'next-term', 'age', 'sex', 'adm-no'];
    ids.forEach(id => {
        document.getElementById(`inp-${id}`).addEventListener('input', (e) => {
            document.getElementById(`out-${id}`).textContent = e.target.value.toUpperCase();

            // Update Page Title for PDF Filename
            if (id === 'name' || id === 'class') {
                const n = document.getElementById('inp-name').value;
                const c = document.getElementById('inp-class').value;
                if (n || c) {
                    document.title = `Report - ${n || ''} - ${c || ''}`.trim();
                }
            }
        });
    });
}

function setupAttendanceListeners() {
    const ids = ['days-open', 'days-present'];
    ids.forEach(id => {
        document.getElementById(`inp-${id}`).addEventListener('input', (e) => {
            // Map IDs correctly
            let outId;
            if (id === 'days-open') outId = 'out-opens'; // matches HTML id="out-opens"
            if (id === 'days-present') outId = 'out-present'; // matches HTML id="out-present"

            if (outId) {
                const el = document.getElementById(outId);
                if (el) el.textContent = e.target.value;
            }

            // Calc Absent
            const open = parseInt(document.getElementById('inp-days-open').value) || 0;
            const present = parseInt(document.getElementById('inp-days-present').value) || 0;
            // Absent = Open - Present
            const absent = (open - present > 0) ? (open - present) : 0;
            document.getElementById('out-absent').textContent = absent;
        });
    });
}

function setupCommentListeners() {
    ['teacher-comment', 'principal-comment'].forEach(id => {
        document.getElementById(`inp-${id}`).addEventListener('input', (e) => {
            document.getElementById(`out-${id.replace('inp-', '').replace('comment', 'cmt')}`).textContent = e.target.value.toUpperCase();
        });
    });

    // Signature Listeners
    ['teacher-sig', 'principal-sig'].forEach(id => {
        const el = document.getElementById(`inp-${id}`);
        if (el) {
            el.addEventListener('change', (e) => {
                const file = e.target.files[0];
                // mapped IDs: inp-teacher-sig -> out-teacher-sig, inp-principal-sig -> out-principal-sig
                const imgId = id === 'teacher-sig' ? 'out-teacher-sig' : 'out-principal-sig';
                const img = document.getElementById(imgId);
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        img.src = e.target.result;
                        img.style.display = 'block';
                    }
                    reader.readAsDataURL(file);
                } else {
                    img.style.display = 'none';
                    img.src = '';
                }
            });
        }
    });

    // Logo Listener
    const logoInp = document.getElementById('inp-school-logo');
    if (logoInp) {
        logoInp.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const logoImg = document.querySelector('.logo-box img');
                    if (logoImg) logoImg.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    }
}

// --- RENDER LOGIC ---
function updateReport() {
    // Update Document Title for PDF Filename
    const n = document.getElementById('inp-name').value;
    const c = document.getElementById('inp-class').value;
    if (n || c) {
        document.title = `Report - ${n || ''} - ${c || ''}`.trim();
    }

    // 1. Process Academics
    const rows = document.querySelectorAll('.subject-row-input');
    const subjects = [];
    let grandTotal = 0;
    let subjectCount = 0;

    outBody.innerHTML = '';

    rows.forEach((row, index) => {
        const name = row.querySelector('.inp-sub-name').value;
        const ca = row.querySelector('.inp-sub-ca').value;
        const exam = row.querySelector('.inp-sub-exam').value;

        if (name) {
            const result = calculateAcademicGrade(ca, exam);
            subjects.push({ name, ...result });

            grandTotal += result.total;
            subjectCount++;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align:center">${index + 1}</td>
                <td>${name.toUpperCase()}</td>
                <td class="text-center">${ca || '-'}</td>
                <td class="text-center">${exam || '-'}</td>
                <td class="text-center" style="font-weight:bold">${result.total || '-'}</td>
                <td style="text-align:center; color:${getColor(result.grade)}">${result.grade}</td>
                <td style="font-size:9px">${result.remark}</td>
            `;
            outBody.appendChild(tr);
        }
    });

    // Update Totals
    document.getElementById('out-total').textContent = grandTotal;

    // Average
    const avg = subjectCount ? (grandTotal / subjectCount).toFixed(2) : (0).toFixed(2);
    document.getElementById('out-avg').textContent = avg;

    // Percentage: (Total Obtained / Total Possible) * 100
    // Total Possible = Subject Count * 100
    const totalPossible = subjectCount * 100;
    const percentage = totalPossible ? ((grandTotal / totalPossible) * 100).toFixed(2) : (0).toFixed(2);
    document.getElementById('out-percentage').textContent = percentage + '%';

    // 2. Process Traits
    renderTraitOutput(outAffective, 'aff');
    renderTraitOutput(outPsychomotor, 'psy');

    // 3. Render Chart
    renderChart(subjects);
}

function renderTraitOutput(tableBody, type) {
    tableBody.innerHTML = '';
    const selects = document.querySelectorAll(`.trait-select[data-type="${type}"]`);
    selects.forEach(sel => {
        const trait = sel.getAttribute('data-trait');
        const grade = sel.value;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${trait}</td>
            <td style="text-align:center; font-weight:bold; ${grade ? 'background:' + getTraitColor(grade) : ''}">${grade}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderChart(subjects) {
    chartContainer.innerHTML = '';
    // Limit to first 8 subjects to fit chart
    subjects.slice(0, 8).forEach(sub => {
        const height = sub.total; // 0-100
        const bar = document.createElement('div');
        // Simple CSS bar
        bar.style.height = `${Math.max(height, 1)}%`;
        bar.style.width = '20px';
        bar.style.background = getColor(sub.grade);
        bar.style.display = 'flex';
        bar.style.alignItems = 'flex-end';
        bar.style.justifyContent = 'center';
        bar.style.fontSize = '8px';
        bar.style.color = 'black';
        bar.style.border = '1px solid black';
        bar.title = `${sub.name}: ${sub.total}`;

        // Label inside bar
        bar.innerHTML = `<span style="margin-bottom:-12px; white-space:nowrap; transform:rotate(-90deg)">${sub.name.substring(0, 3)}</span>`;

        chartContainer.appendChild(bar);
    });
}

function getColor(grade) {
    // Color code academic grades
    if (['A1', 'B2', 'B3'].includes(grade)) return '#4ade80'; // Green
    if (['C4', 'C5', 'C6'].includes(grade)) return '#facc15'; // Yellow
    if (['D7'].includes(grade)) return '#fb923c'; // Orange
    return '#f87171'; // Red
}

function getTraitColor(grade) {
    if (grade === 'A') return '#4ade80';
    if (grade === 'B') return '#86efac';
    if (grade === 'C') return '#facc15';
    if (grade === 'D') return '#fb923c';
    return '#f87171';
}

export function resetForm() {
    // Reload page is easiest for full reset
    if (confirm('This will clear all unsaved data and start a NEW report. Continue?')) {
        const user = getCurrentUser();
        if (user) {
            localStorage.removeItem(`th_draft_${user.class}`);
        }
        // Redirect to report.html (strips ?id=...)
        window.location.href = 'report.html';
    }
}

// --- AUTO SAVE LOGIC ---
let saveTimeout;
function handleAutoSave(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveDraft, 1000); // 1s debounce

        // Show saving indicator?
        const indicator = document.getElementById('save-indicator');
        if (indicator) {
            indicator.textContent = 'Saving...';
            indicator.style.opacity = '1';
        }
    }
}

// --- ARCHIVE LOGIC ---
let CURRENT_REPORT_ID = null;

export function manualSave() {
    const user = getCurrentUser();
    if (!user) return;

    // 1. Get Data (Same as draft)
    const data = getFormData();
    if (!data.bio.name) {
        alert('Please enter a Student Name before saving.');
        return;
    }

    // 2. Prepare Archive Object
    const reportId = CURRENT_REPORT_ID || Date.now().toString(); // Use existing or new ID
    const timestamp = new Date().toISOString();

    const archiveRecord = {
        id: reportId,
        name: data.bio.name,
        term: data.bio.term,
        session: data.bio.session,
        timestamp: timestamp,
        data: data
    };

    // 3. Save to LocalStorage List
    const listKey = `th_reports_${user.class}`;
    const rawList = localStorage.getItem(listKey);
    let list = rawList ? JSON.parse(rawList) : [];

    // Update existing or add new
    const existingIndex = list.findIndex(r => r.id === reportId);
    if (existingIndex >= 0) {
        list[existingIndex] = archiveRecord;
    } else {
        list.push(archiveRecord);
    }

    localStorage.setItem(listKey, JSON.stringify(list));

    // Also update current draft so auto-save doesn't overwrite with old data
    localStorage.setItem(`th_draft_${user.class}`, JSON.stringify(data));

    // Set ID if new
    CURRENT_REPORT_ID = reportId;

    // Update Browser URL without reload
    const url = new URL(window.location);
    url.searchParams.set('id', reportId);
    window.history.pushState({}, '', url);

    // Feedback
    const indicator = document.getElementById('save-indicator');
    if (indicator) {
        indicator.textContent = 'Saved! Loading New Form...';
        indicator.style.opacity = '1';
        indicator.style.color = 'green';
        indicator.style.fontWeight = 'bold';
    }

    // Clear Draft so next load is fresh
    localStorage.removeItem(`th_draft_${user.class}`);

    // Redirect to fresh report page after short delay
    setTimeout(() => {
        window.location.href = 'report.html';
    }, 1000);
}

function getFormData() {
    const data = {
        bio: {},
        attendance: {},
        comments: {},
        subjects: [],
        traits: {}
    };

    // Bio
    ['name', 'class', 'roll', 'term', 'session', 'next-term', 'age', 'sex', 'adm-no'].forEach(id => {
        data.bio[id] = document.getElementById(`inp-${id}`)?.value || '';
    });

    // Attendance
    ['days-open', 'days-present'].forEach(id => {
        data.attendance[id] = document.getElementById(`inp-${id}`)?.value || '';
    });

    // Comments
    data.comments.teacher = document.getElementById('inp-teacher-comment')?.value || '';
    data.comments.principal = document.getElementById('inp-principal-comment')?.value || '';

    // Subjects
    document.querySelectorAll('.subject-row-input').forEach(row => {
        data.subjects.push({
            name: row.querySelector('.inp-sub-name').value,
            ca: row.querySelector('.inp-sub-ca').value,
            exam: row.querySelector('.inp-sub-exam').value
        });
    });

    // Traits
    document.querySelectorAll('.trait-select').forEach(sel => {
        const key = `${sel.dataset.type}_${sel.dataset.trait}`;
        data.traits[key] = sel.value;
    });

    // Preserve Position if it exists
    const posEl = document.getElementById('out-position');
    if (posEl && posEl.textContent !== '-') {
        data.position = posEl.textContent;
    }

    return data;
}

function saveDraft() {
    // Re-use logic but just to draft key
    const user = getCurrentUser();
    if (!user) return;
    const data = getFormData();
    localStorage.setItem(`th_draft_${user.class}`, JSON.stringify(data));

    // Update indicator
    const indicator = document.getElementById('save-indicator');
    if (indicator) {
        indicator.textContent = 'Saved (Draft)';
        indicator.style.opacity = '1';
        setTimeout(() => { indicator.style.opacity = '0'; }, 2000);
    }
}

function loadDataIntoForm(data) {
    try {
        // Bio
        Object.keys(data.bio || {}).forEach(id => {
            const el = document.getElementById(`inp-${id}`);
            if (el) {
                el.value = data.bio[id];
                el.dispatchEvent(new Event('input'));
            }
        });

        // Attendance
        Object.keys(data.attendance || {}).forEach(id => {
            const el = document.getElementById(`inp-${id}`);
            if (el) {
                el.value = data.attendance[id];
                el.dispatchEvent(new Event('input'));
            }
        });

        // Comments
        if (data.comments) {
            if (document.getElementById('inp-teacher-comment')) {
                document.getElementById('inp-teacher-comment').value = data.comments.teacher || '';
                document.getElementById('inp-teacher-comment').dispatchEvent(new Event('input'));
            }
            if (document.getElementById('inp-principal-comment')) {
                document.getElementById('inp-principal-comment').value = data.comments.principal || '';
                document.getElementById('inp-principal-comment').dispatchEvent(new Event('input'));
            }
        }

        // Subjects
        if (data.subjects && data.subjects.length > 0) {
            const container = document.getElementById('subjects-container');
            container.innerHTML = ''; // Clear default

            data.subjects.forEach(sub => {
                addSubjectRow(sub.name || ''); // Pass saved name
                const rows = document.querySelectorAll('.subject-row-input');
                const row = rows[rows.length - 1];
                row.querySelector('.inp-sub-ca').value = sub.ca;
                row.querySelector('.inp-sub-exam').value = sub.exam;
            });
        }

        // Traits
        if (data.traits) {
            document.querySelectorAll('.trait-select').forEach(sel => {
                const key = `${sel.dataset.type}_${sel.dataset.trait}`;
                if (data.traits[key] !== undefined) {
                    sel.value = data.traits[key];
                }
            });
        }

        // Position Check
        if (data.position) {
            const posEl = document.getElementById('out-position');
            if (posEl) posEl.textContent = data.position;
        } else {
            const posEl = document.getElementById('out-position');
            if (posEl) posEl.textContent = '-';
        }

        updateReport();

    } catch (e) {
        console.error("Failed to load data", e);
    }
}

function loadDraft() {
    const user = getCurrentUser();
    if (!user) return;

    // Check URL Params
    const urlParams = new URLSearchParams(window.location.search);

    // 1. Force New Report
    if (urlParams.get('new') === 'true') {
        console.log("Forcing New Report");
        localStorage.removeItem(`th_draft_${user.class}`);

        // Clear ID from URL for clean state (optional, but good for refresh)
        const url = new URL(window.location);
        url.searchParams.delete('new');
        window.history.replaceState({}, '', url);
        return; // Don't load anything logic
    }

    // 2. Load Specific ID
    const id = urlParams.get('id');
    if (id) {
        // Load from Archive
        const listKey = `th_reports_${user.class}`;
        const rawList = localStorage.getItem(listKey);
        const list = rawList ? JSON.parse(rawList) : [];
        const report = list.find(r => r.id === id);

        if (report) {
            console.log("Loading from Archive:", id);
            CURRENT_REPORT_ID = id;
            loadDataIntoForm(report.data);
            return;
        } else {
            console.warn("Report ID not found, falling back to draft");
        }
    }

    // Fallback to Draft
    const raw = localStorage.getItem(`th_draft_${user.class}`);
    if (raw) {
        const data = JSON.parse(raw);
        loadDataIntoForm(data);
    }
}
