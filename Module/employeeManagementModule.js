// TABLE VIEW + ADD/EDIT FORM + DYNAMIC SALARY + VALIDATION + ACTIONS

import * as EmployeeDb from './employeeDbModule.js';      //  Employee CRUD
import * as Department from './departmentModule.js';     //  Department lookup
import * as Position from './positionModule.js';         //  Position lookup
import { refreshDashboard, debounce } from '../app.js';   //  Refresh + Debounce

let editingId = null;                                    // GLOBAL: Track edit mode

//  DISPLAY TABLE: DANH SÁCH NHÂN VIỆN VỚI SALARY CALCULATED
function displayEmployeeList(container) {
    const employees = EmployeeDb.getAllEmployees();
    const table = document.createElement('table');
    
    table.innerHTML = `
        <h3>📋 Danh sách Nhân viên (<strong>${employees.length}</strong>)</h3>
        <thead>
            <tr>
                <th>ID</th><th>Tên</th><th>Phòng ban</th><th>Vị trí</th>
                <th>Lương thực tế</th><th>Ngày vào</th><th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${employees.map(emp => {
                // LOOKUP: Position + Department
                const pos = Position.getAllPositions().find(p => p.id === emp.positionId);
                const dept = Department.getAllDepartments().find(d => d.id === emp.departmentId);
                
                // 💰 CALCULATE: baseSalary * deptLevel
                const baseSalary = pos ? pos.salaryBase : 0;
                const deptFactor = dept?.level || 1;
                const realSalary = baseSalary * deptFactor;
                
                return `
                    <tr>
                        <td><strong>${emp.id}</strong></td>
                        <td>${emp.name}</td>
                        <td>${dept?.name || 'N/A'}</td>
                        <td>${pos?.title || 'N/A'}</td>
                        <td><strong>${realSalary.toLocaleString()}$</strong></td>
                        <td>${emp.hireDate}</td>
                        <td>
                            <button class="edit-btn" data-id="${emp.id}">✏️ Sửa</button>
                            <button class="delete-btn" data-id="${emp.id}">🗑️ Xóa</button>
                        </td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;
    
    container.appendChild(table);
    
    // ═══ EVENT: EDIT BUTTONS ═══
    table.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            editingId = parseInt(btn.dataset.id);
            showForm(container, editingId);
        });
    });
    
    // ═══ EVENT: DELETE BUTTONS ═══
    table.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            try {
                const emp = EmployeeDb.getEmployeeById(id);
                if (confirm(`🗑️ Xác nhận xóa <strong>${emp.name}</strong>?`)) {
                    EmployeeDb.deleteEmployee(id);
                    alert('✅ Xóa thành công!');
                    init(container);                         // REFRESH TABLE
                }
            } catch (e) {
                alert('❌ ' + e.message);
            }
        });
    });
    
    console.log(`✅ Displayed ${employees.length} employees`);
}

//  SHOW FORM: ADD/EDIT VỚI AUTO-SALARY + VALIDATION
function showForm(container, id = null) {
    // DYNAMIC: Ngày hiện tại (20/10/2025)
    const currentDate = new Date().toISOString().split('T')[0];
    
    const emp = id ? EmployeeDb.getEmployeeById(id) : null;
    const title = id ? '✏️ Sửa Nhân viên' : '➕ Thêm Nhân viên';

    const form = document.createElement('form');
    form.innerHTML = `
        <h2>${title}</h2>
        
        <!-- TÊN -->
        <label>Tên:</label>
        <input type="text" id="name" placeholder="Tên đầy đủ" required value="${emp?.name || ''}">
        <span id="nameError" class="error"></span>
        
        <!-- PHÒNG BAN -->
        <label>Phòng ban:</label>
        <select id="departmentId" required>
            <option value="">Chọn phòng ban</option>
            ${Department.getAllDepartments().map(d => `
                <option value="${d.id}" ${emp && d.id === emp.departmentId ? 'selected' : ''}>
                    ${d.name} (Level ${(d.level || 1).toFixed(1)}x)
                </option>
            `).join('')}
        </select>
        <span id="deptError" class="error"></span>
        
        <!-- VỊ TRÍ -->
        <label>Vị trí:</label>
        <select id="positionId" required>
            <option value="">Chọn vị trí</option>
            ${Position.getAllPositions().map(p => `
                <option value="${p.id}" ${emp && p.id === emp.positionId ? 'selected' : ''}>
                    ${p.title} (${p.salaryBase.toLocaleString()}$)
                </option>
            `).join('')}
        </select>
        <span id="posError" class="error"></span>
        
        <!-- LƯƠNG (AUTO CALCULATED - READONLY) -->
        <label>Lương thực tế:</label>
        <input type="number" id="salary" placeholder="Auto" readonly>
        <span id="salaryError" class="error"></span>
        
        <!-- NGÀY VÀO -->
        <label>Ngày vào:</label>
        <input type="date" id="hireDate" required max="${currentDate}" value="${emp?.hireDate || ''}">
        <span id="dateError" class="error"></span>
        
        <button type="submit">${id ? '✅ Cập nhật' : '➕ Thêm'}</button>
        <button type="button" id="cancel">❌ Hủy</button>
    `;
    
    container.appendChild(form);

    // ═══ GET ELEMENTS ═══
    const deptSelect = form.querySelector('#departmentId');
    const posSelect = form.querySelector('#positionId');
    const salaryInput = form.querySelector('#salary');

    // ═══ AUTO CALCULATE SALARY ═══
    function updateSalary() {
        const deptId = parseInt(deptSelect.value);
        const posId = parseInt(posSelect.value);
        const pos = Position.getAllPositions().find(p => p.id === posId);
        const dept = Department.getAllDepartments().find(d => d.id === deptId);
        const baseSalary = pos ? pos.salaryBase : 0;
        const deptFactor = dept?.level || 1;
        salaryInput.value = (baseSalary * deptFactor).toLocaleString();
    }

    // ═══ EVENTS: CHANGE → UPDATE SALARY ═══
    deptSelect.addEventListener('change', updateSalary);
    posSelect.addEventListener('change', updateSalary);
    
    // TRIGGER: Load initial salary (for edit)
    if (emp) {
        deptSelect.dispatchEvent(new Event('change'));
        posSelect.dispatchEvent(new Event('change'));
    }

    // ═══ REAL-TIME VALIDATION ═══
    const nameInput = form.querySelector('#name');
    nameInput.addEventListener('input', debounce(() => {
        const error = form.querySelector('#nameError');
        error.textContent = nameInput.value.trim() === '' ? 'Tên không được rỗng' : '';
    }));

    // ═══ SUBMIT ═══
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = collectFormData(form, id ? emp : null);
        
        // VALIDATE
        const errors = validateForm(form, data);
        if (Object.keys(errors).length > 0) return;
        
        try {
            if (id) {
                EmployeeDb.updateEmployee(data);
                alert('✅ Cập nhật thành công!');
            } else {
                EmployeeDb.addEmployee(data);
                alert('✅ Thêm thành công!');
            }
            init(container);                             // REFRESH
        } catch (e) {
            alert('❌ Lỗi: ' + e.message);
        }
    });

    // ═══ CANCEL ═══
    form.querySelector('#cancel').addEventListener('click', () => {
        init(container);
    });
}

// ═══ HELPER: COLLECT DATA ═══
function collectFormData(form, emp) {
    return {
        id: emp?.id,
        name: form.querySelector('#name').value.trim(),
        departmentId: parseInt(form.querySelector('#departmentId').value),
        positionId: parseInt(form.querySelector('#positionId').value),
        salary: parseFloat(form.querySelector('#salary').value.replace(/,/g, '')),
        hireDate: form.querySelector('#hireDate').value,
        bonus: emp?.bonus || 0,
        deduction: emp?.deduction || 0
    };
}

// ═══ HELPER: VALIDATE ═══
function validateForm(form, data) {
    const errors = {};
    if (data.name.trim() === '') errors.name = 'Tên không được rỗng';
    if (!data.departmentId) errors.dept = 'Chọn phòng ban';
    if (!data.positionId) errors.pos = 'Chọn vị trí';
    if (isNaN(data.salary) || data.salary <= 0) errors.salary = 'Lương không hợp lệ';
    if (!data.hireDate) errors.date = 'Chọn ngày vào';
    
    // SHOW ERRORS
    Object.entries(errors).forEach(([field, msg]) => {
        form.querySelector(`#${field}Error`).textContent = msg;
    });
    return errors;
}

//  INIT: MAIN ENTRY POINT
export function init(container) {
    console.log('📋 Employee Management initializing...');
    
    container.innerHTML = '';
    
    // ADD BUTTON
    const addBtn = document.createElement('button');
    addBtn.innerHTML = '➕ Thêm Nhân viên';
    addBtn.style.cssText = 'background:#4CAF50;color:white;padding:12px;font-size:16px;margin:10px;';
    addBtn.addEventListener('click', () => showForm(container));
    container.appendChild(addBtn);
    
    //  TABLE
    displayEmployeeList(container);
    
    editingId = null;                                    // RESET
    console.log('✅ Employee Management loaded');
}