// SEARCH → LOAD FORM → DYNAMIC DROPDOWNS → VALIDATE → UPDATE

import * as EmployeeDb from './employeeDbModule.js';      //  CRUD Employee
import * as Department from './departmentModule.js';     //  Department dropdown
import * as Position from './positionModule.js';         //  Position dropdown
import { refreshDashboard } from '../app.js';             //  Auto refresh UI

//  INIT: KHỞI TẠO MODULE (GỌI TỪ app.js)
export function init(container) {
    console.log('✏️ Edit module initializing...');
    
    // ═══ BƯỚC 1: SEARCH FORM ═══
    const searchForm = document.createElement('form');
    searchForm.innerHTML = `
        <h2>🔍 Tìm Nhân viên để Sửa</h2>
        <input type="number" id="empId" placeholder="Nhập ID Nhân viên" required>
        <button type="submit">🔎 Tìm</button>
    `;
    container.appendChild(searchForm);

    // ═══ BƯỚC 2: SEARCH EVENT ═══
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = parseInt(searchForm.querySelector('#empId').value);
        
        try {
            // VALIDATE: Employee tồn tại
            const emp = EmployeeDb.getEmployeeById(id);
            console.log(`✅ Found: ${emp.name} (ID: ${id})`);
            
            // CLEAR & LOAD EDIT FORM
            container.innerHTML = '';
            const editForm = createEditForm(emp);
            container.appendChild(editForm);
            
            // ═══ BƯỚC 3: EDIT SUBMIT ═══
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const updated = collectFormData(editForm, emp);
                
                if (confirm(`✅ Cập nhật thông tin ${updated.name}?`)) {
                    EmployeeDb.updateEmployee(updated);
                    alert('✅ Cập nhật thành công!');
                    refreshDashboard();                      //  BACK TO LIST
                }
            });
            
        } catch (e) {
            alert('❌ ' + e.message);
            console.error('❌ Edit search error:', e);
        }
    });
    
    console.log('✅ Edit module loaded');
}

//  CREATE EDIT FORM: DYNAMIC DROPDOWNS + PRE-FILLED
function createEditForm(emp) {
    const form = document.createElement('form');
    form.innerHTML = `
        <h2>✏️ Sửa Nhân viên: <strong>${emp.name}</strong></h2>
        
        <!-- TÊN -->
        <label>Tên:</label>
        <input type="text" id="name" value="${emp.name}" required>
        
        <!-- PHÒNG BAN - DYNAMIC SELECT -->
        <label>Phòng ban:</label>
        <select id="departmentId" required>
            ${Department.getAllDepartments().map(d => `
                <option value="${d.id}" ${d.id === emp.departmentId ? 'selected' : ''}>
                    ${d.name} (${(d.level || 1).toFixed(1)}x)
                </option>
            `).join('')}
        </select>
        
        <!-- VỊ TRÍ - DYNAMIC SELECT -->
        <label>Vị trí:</label>
        <select id="positionId" required>
            ${Position.getAllPositions().map(p => `
                <option value="${p.id}" ${p.id === emp.positionId ? 'selected' : ''}>
                    ${p.title}
                </option>
            `).join('')}
        </select>
        
        <!-- LƯƠNG -->
        <label>Lương:</label>
        <input type="number" id="salary" value="${emp.salary}" min="1" required>
        
        <!-- NGÀY VÀO -->
        <label>Ngày vào:</label>
        <input type="date" id="hireDate" value="${emp.hireDate}" required>
        
        <!-- BONUS/DEDUCTION (READONLY) -->
        <p><small>💰 Thưởng: ${emp.bonus.toLocaleString()} | 📉 Phạt: ${emp.deduction.toLocaleString()}</small></p>
        
        <button type="submit">✅ Cập nhật</button>
        <button type="button" onclick="refreshDashboard()">🔙 Quay lại</button>
    `;
    return form;
}

//  COLLECT FORM DATA: VALIDATE + FORMAT
function collectFormData(form, originalEmp) {
    return {
        id: originalEmp.id,                                  // KEEP: Original ID
        name: form.querySelector('#name').value.trim(),      // TRIM: Remove spaces
        departmentId: parseInt(form.querySelector('#departmentId').value),
        positionId: parseInt(form.querySelector('#positionId').value),
        salary: parseFloat(form.querySelector('#salary').value),
        hireDate: form.querySelector('#hireDate').value,     // YYYY-MM-DD
        bonus: originalEmp.bonus,                            // KEEP: Không sửa ở đây
        deduction: originalEmp.deduction                     // KEEP: Không sửa ở đây
    };
}