// TỔNG HỢP + ROUTING + ERROR HANDLING + GLOBAL FUNCTIONS
import * as Auth from './Modules/authModule.js';                    // XÁC THỰC NGƯỜI DÙNG
import * as EmployeeDb from './Modules/employeeDbModule.js';       // DATABASE NHÂN VIỆN
import * as EmployeeManagement from './Modules/employeeManagementModule.js';  // QUẢN LÝ NHÂN VIỆN
import * as SearchEmployee from './Modules/searchEmployeeModule.js';         // TÌM KIẾM NHÂN VIỆN
import * as Department from './Modules/departmentModule.js';       // PHÒNG BAN
import * as Position from './Modules/positionModule.js';           // VỊ TRÍ
import * as Salary from './Modules/salaryModule.js';               // LƯƠNG THƯỞNG
import * as Attendance from './Modules/attendanceModule.js';       // CHẤM CÔNG
import * as Leave from './Modules/leaveModule.js';                 // NGHỈ PHÉP
import * as Performance from './Modules/performanceModule.js';     // ĐÁNH GIÁ HIỆU SUẤT

// MODULE REGISTRY: DANH SÁCH TẤT CẢ MODULES (ROUTING MAP)
const modules = {
    employeeManagement: EmployeeManagement,
    searchEmployee: SearchEmployee,
    department: Department,
    position: Position,
    salary: Salary,
    attendance: Attendance,
    leave: Leave,
    performance: Performance
};

// GLOBAL ERROR HANDLER: BẮT MỌI LỖI TRONG ỨNG DỤNG
window.onerror = function (message, source, lineno, colno, error) {
    console.error('Global error:', message);
    alert('Đã xảy ra lỗi: ' + message);
};

// SHOW DASHBOARD: HIỂN THỊ GIAO DIỆN CHÍNH SAU LOGIN
export function showDashboard() {
    // HIDE: Auth screens
    document.getElementById('auth-container').style.display = 'none';
    
    // SHOW: Main dashboard
    document.getElementById('dashboard').style.display = 'flex';
    
    // RENDER: Dashboard content
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = ''; // CLEAR: Nội dung cũ
    const employees = EmployeeDb.getAllEmployees();
    const totalSalary = employees.reduce((sum, emp) => {
        const pos = Position.getAllPositions().find(p => p.id === emp.positionId);
        const dept = Department.getAllDepartments().find(d => d.id === emp.departmentId);
        const baseSalary = pos ? pos.salaryBase : emp.salary;
        const deptFactor = dept?.level || 1;
        return sum + Math.round(baseSalary * deptFactor);
    }, 0);
    
    mainContent.innerHTML = `
        <h2>\u{1F4D1} Tóm tắt thông tin</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <p>Tổng Nhân viên</p>
                <h3>${employees.length}</h3>
            </div>
            <div class="stat-card">
                <p>Tổng Lương</p>
                <h3>${totalSalary.toLocaleString()}$</h3>
                
            </div>
            <div class="stat-card">
                <p>Số phòng ban</p>
                <h3>${Department.getAllDepartments().length}</h3>
                
            </div>
            <div class="stat-card">
                <p>Số vị trí</p>
                <h3>${Position.getAllPositions().length}</h3>
                
            </div>
        </div>
    `;
    
    // SETUP: Menu navigation
    setupMenu();
    
    // SETUP: Logout button
    document.getElementById('logout').addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
        location.reload();
    });
    
    console.log('✅ Dashboard loaded');
}

// SETUP MENU: CLICK MENU → LOAD MODULE TƯƠNG ỨNG
function setupMenu() {
    const links = document.querySelectorAll('#sidebar a[data-module]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const moduleName = link.dataset.module;
            document.querySelectorAll('#sidebar a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            loadModule(moduleName);
        });
    });
    
    console.log('✅ Menu setup complete');
}

// LOAD MODULE: CORE ROUTING FUNCTION
function loadModule(moduleName) {
    console.log('Loading module:', moduleName);
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';
    
    if (!modules[moduleName] || typeof modules[moduleName].init !== 'function') {
        mainContent.innerHTML = `<p>Module ${moduleName} không tồn tại!</p>`;
        console.error('❌ Module not found:', moduleName);
        return;
    }
    
    try {
        modules[moduleName].init(mainContent);
        console.log('✅ Module loaded:', moduleName);
    } catch (error) {
        console.error('❌ Error loading module:', moduleName, error);
        mainContent.innerHTML = `<p>Lỗi: ${error.message}</p>`;
    }
}

// EXPORT: REFRESH DASHBOARD - DÙNG TRONG CÁC MODULE
export function refreshDashboard() {
    const activeLink = document.querySelector('#sidebar a.active');
    if (activeLink) {
        loadModule(activeLink.dataset.module);
        console.log('🔄 Dashboard refreshed');
    } else {
        showDashboard(); // Nếu không có module active, quay lại dashboard
    }
}

// EXPORT: DEBOUNCE - TỐI ƯU VALIDATION REAL-TIME
export function debounce(func, delay = 300) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

// MAIN INITIALIZATION: CHẠY KHI PAGE LOAD XONG
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎉 App starting...');
    
    // BƯỚC 1: SETUP AUTH FORMS (login UI)
    Auth.setupAuthForms();
    
    // BƯỚC 2: CHECK LOGIN STATUS → SHOW DASHBOARD HOẶC LOGIN FORM
    if (Auth.isLoggedIn()) {
        console.log('✅ User logged in → Show Dashboard');
        showDashboard();
    } else {
        console.log('🔐 User not logged in → Show Login');
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('login-form').style.display = 'block';
    }
});