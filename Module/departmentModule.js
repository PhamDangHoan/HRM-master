// CRUD + LEVEL SYSTEM + FOREIGN KEY CHECK + DYNAMIC UI

import * as EmployeeDb from './employeeDbModule.js';      // 👥 CHECK: Employees liên kết
import { refreshDashboard } from '../app.js';             // 🔄 Auto refresh UI

const STORAGE_KEY = 'departments';                       // 💾 LocalStorage key

//  INIT DATA: TẠO DỮ LIỆU MẶC ĐỊNH LẦN ĐẦU
function initData() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        const defaults = [
            { id: 1, name: 'IT', managerId: 1, level: 1.5 },     //  IT: +50% lương
            { id: 2, name: 'HR', managerId: 2, level: 1.2 },     //  HR: +20% lương
            { id: 3, name: 'Finance', managerId: 3, level: 1.7 } //  Finance: +70% lương
        ];
        saveDepartments(defaults);
        console.log('✅ Default departments created');
    }
}
initData();                                              // AUTO RUN: Khi file load

//  CRUD FUNCTIONS: LOCALSTORAGE OPERATIONS

//  GET ALL: Lấy toàn bộ departments
function getAllDepartments() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

//  SAVE: Lưu array vào localStorage
function saveDepartments(depts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(depts));
}

// EXPORT: Cho các module khác dùng
export { getAllDepartments };

// ═══ CREATE ═══
export function addDepartment(name, level = 1) {
    // VALIDATE: Tên rỗng hoặc trùng
    if (name.trim() === '' || getAllDepartments().some(d => d.name === name)) {
        throw new Error('Tên phòng ban không hợp lệ hoặc đã tồn tại');
    }
    
    const depts = getAllDepartments();
    const id = Math.max(...depts.map(d => d.id), 0) + 1; // AUTO ID
    depts.push({ 
        id, 
        name, 
        managerId: null,                                 // DEFAULT: No manager
        level: parseFloat(level) || 1 
    });
    saveDepartments(depts);
    console.log(`✅ Added dept: ${name} (ID: ${id})`);
}

// ═══ UPDATE ═══
export function editDepartment(id, newName, newLevel) {
    if (newName.trim() === '') throw new Error('Tên mới không hợp lệ');
    
    let depts = getAllDepartments();
    const index = depts.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Không tìm thấy phòng ban');
    
    depts[index].name = newName;
    depts[index].level = parseFloat(newLevel) || depts[index].level || 1;
    saveDepartments(depts);
    console.log(`✅ Updated dept ID ${id}`);
}

// ═══ DELETE ═══
export function deleteDepartment(id) {
    // SAFETY CHECK: Có employees thuộc dept này?
    const employees = EmployeeDb.getAllEmployees().filter(e => e.departmentId === id);
    if (employees.length > 0) {
        throw new Error(`Không thể xóa vì ${employees.length} nhân viên liên kết`);
    }
    
    let depts = getAllDepartments();
    depts = depts.filter(d => d.id !== id);
    saveDepartments(depts);
    console.log(`✅ Deleted dept ID ${id}`);
}

//  UI FUNCTIONS: RENDER + INTERACTION

//  DISPLAY TABLE: Danh sách departments
function displayList(container) {
    const depts = getAllDepartments();
    const table = document.createElement('table');
    table.innerHTML = `
        <h3>Danh sách Phòng ban (${depts.length})</h3>
        <thead>
            <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Level (Hệ số)</th>
                <th>Manager</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${depts.map(d => `
                <tr>
                    <td>${d.id}</td>
                    <td>${d.name}</td>
                    <td><strong>${(d.level || 1).toFixed(1)}x</strong></td>
                    <td>${d.managerId || 'Chưa có'}</td>
                    <td>
                        <button onclick="editDept(${d.id})">✏️ Sửa</button>
                        <button onclick="deleteDept(${d.id})">🗑️ Xóa</button>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;
    container.appendChild(table);
}

// GLOBAL EDIT: Trigger edit mode
let editingDeptId = null;
window.editDept = (id) => { 
    editingDeptId = id; 
    createForm(document.getElementById('main-content')); 
};

// GLOBAL DELETE: Confirm + delete
window.deleteDept = (id) => {
    if (confirm(`Xác nhận xóa "${getAllDepartments().find(d => d.id === id)?.name}"?`)) {
        try {
            deleteDepartment(id);
            alert('✅ Xóa thành công!');
            init(document.getElementById('main-content'));
        } catch (e) {
            alert('❌ ' + e.message);
        }
    }
};

// ═══ FORM: ADD/EDIT ═══
function createForm(container) {
    const form = document.createElement('form');
    const dept = editingDeptId ? getAllDepartments().find(d => d.id === editingDeptId) : null;
    
    form.innerHTML = `
        <h3>${editingDeptId ? '✏️ Sửa Phòng ban' : '➕ Thêm Phòng ban'}</h3>
        <input type="text" id="deptName" placeholder="Tên phòng ban" required 
               value="${dept?.name || ''}">
        <input type="number" id="deptLevel" placeholder="Hệ số lương (1.0-2.0)" 
               step="0.1" min="1" max="2" value="${dept?.level || 1}">
        <button type="submit">${editingDeptId ? '✅ Cập nhật' : '➕ Thêm'}</button>
        <button type="button" id="cancel">❌ Hủy</button>
    `;
    container.appendChild(form);

    // SUBMIT
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = form.querySelector('#deptName').value;
        const level = parseFloat(form.querySelector('#deptLevel').value);
        
        try {
            if (editingDeptId) {
                editDepartment(editingDeptId, name, level);
                alert('✅ Cập nhật thành công!');
            } else {
                addDepartment(name, level);
                alert('✅ Thêm thành công!');
            }
            editingDeptId = null;
            init(container);                             // REFRESH UI
        } catch (e) {
            alert('❌ ' + e.message);
        }
    });

    // CANCEL
    form.querySelector('#cancel').addEventListener('click', () => {
        editingDeptId = null;
        init(container);
    });
}

//  INIT: MAIN ENTRY POINT (GỌI TỪ app.js)
export function init(container) {
    console.log('🏢 Department module initializing...');
    
    container.innerHTML = '<h2>🏢 Quản lý Phòng ban</h2>';
    
    // ADD BUTTON
    const addBtn = document.createElement('button');
    addBtn.textContent = '➕ Thêm Phòng ban';
    addBtn.style.cssText = 'background:#4CAF50;color:white;padding:10px;margin:10px;';
    addBtn.addEventListener('click', () => createForm(container));
    container.appendChild(addBtn);
    
    // DISPLAY LIST
    displayList(container);
    
    console.log('✅ Department module loaded');
}