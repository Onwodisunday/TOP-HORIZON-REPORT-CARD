/**
 * auth.js
 * Handles Client-Side Authentication using LocalStorage
 */

const STORAGE_KEY = 'th_users_db';
const DEFAULT_PIN = "1234";

// Initialize DB if empty (Optional: Pre-seed classes)
function getDB() {
    const db = localStorage.getItem(STORAGE_KEY);
    return db ? JSON.parse(db) : {};
}

function saveDB(db) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function register(classId, pin) {
    const db = getDB();
    // Allow overwriting/resetting for now
    db[classId] = pin;
    saveDB(db);
    return true;
}

export function login(classId, pin) {
    const db = getDB();
    const storedPin = db[classId];

    // Check custom PIN first, then default if not set
    if (storedPin) {
        if (storedPin === pin) {
            setSession(classId);
            return true;
        }
    } else {
        // Fallback for demo: if no PIN set, allow default "1234"
        if (pin === DEFAULT_PIN) {
            setSession(classId);
            return true;
        }
    }
    return false;
}

function setSession(classId) {
    const user = {
        class: classId,
        role: 'teacher',
        loginTime: new Date().toISOString()
    };
    sessionStorage.setItem('th_user', JSON.stringify(user));
}

export function logout() {
    sessionStorage.removeItem('th_user');
    window.location.href = 'login.html';
}

export function getCurrentUser() {
    const userStr = sessionStorage.getItem('th_user');
    return userStr ? JSON.parse(userStr) : null;
}

export function checkSession() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}
