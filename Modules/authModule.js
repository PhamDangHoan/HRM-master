// AUTH MODULE - HỆ THỐNG ĐĂNG NHẬP
// LocalStorage + Hashing + Session + Validation

import { showDashboard } from '../app.js';

const USERS_KEY = 'users';                               // KEY: Lưu danh sách users
const SESSION_KEY = 'session';                           // KEY: Lưu session hiện tại
const EXPIRY_HOURS = 1;                                  // SESSION hết hạn: 1 giờ

// PASSWORD HASHER: CLOSURE + SALT + BASE64 (SIMPLE SECURITY)
const createHasher = () => {
    const salt = 'secretSalt';                           // SALT: Bí mật (hardcode cho demo)
    return (password) => btoa(password + salt);          // HASH: password + salt → Base64
};

const hashPassword = createHasher();                     // FACTORY: Tạo hasher instance

// VALIDATION FUNCTIONS: KIỂM TRA INPUT
function validatePassword(password) {
    return password.length >= 6 && !/\s/.test(password); // REGEX: \s = whitespace
}

// INIT DEFAULT USER: Thêm tài khoản mặc định nếu chưa có
function initDefaultUser() {
    const users = getUsers();
    const defaultUser = { username: 'admin', password: hashPassword('123456') };
    if (!users.find(u => u.username === 'admin')) {
        users.push(defaultUser);
        saveUsers(users);
    }
}

initDefaultUser();

// SETUP AUTH FORMS: BIND EVENTS CHO LOGIN
export function setupAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const errorDiv = document.getElementById('loginError');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        errorDiv.textContent = '';

        if (!validatePassword(password)) {
            errorDiv.textContent = 'Mật khẩu phải ít nhất 6 ký tự, không chứa khoảng trắng.';
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1500));

        const users = getUsers();
        const user = users.find(u => 
            u.username === username && 
            u.password === hashPassword(password)
        );
        
        if (user) {
            const expiry = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
            localStorage.setItem(SESSION_KEY, JSON.stringify({ username, expiry }));
            showDashboard(); // Gọi showDashboard từ app.js
        } else {
            errorDiv.textContent = 'Tên đăng nhập hoặc mật khẩu sai.';
        }
    });
}

// USERS CRUD: LOCALSTORAGE HELPER FUNCTIONS
function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// CHECK LOGIN STATUS: KIỂM TRA SESSION CÒN HỢP LỆ?
export function isLoggedIn() {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return false;
    
    const { expiry } = JSON.parse(session);
    if (new Date(expiry) < new Date()) {
        logout();
        return false;
    }
    return true;
}

// LOGOUT: XÓA SESSION
export function logout() {
    localStorage.removeItem(SESSION_KEY);
    console.log('👋 User logged out');
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('auth-container').style.display = 'block';
}