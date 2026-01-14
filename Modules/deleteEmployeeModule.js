//  DELETE EMPLOYEE MODULE - XÓA NHÂN VIỆN AN TOÀN
// VALIDATE + MANAGER CHECK + CONFIRM + CASCADE REFRESH

import * as EmployeeDb from './employeeDbModule.js';      //  CRUD Employee DB
import * as Department from './departmentModule.js';     //  Check Manager role
import { refreshDashboard } from '../app.js';             //  Auto refresh UI

//  INIT: KHỞI TẠO MODULE (GỌI TỪ app.js)
export function init(container) {
    console.log('🗑️ Delete module initializing...');
    
    // ═══ BƯỚC 1: TẠO FORM SIMPLES ═══
    const form = document.createElement('form');
    form.innerHTML = `
        <h2>Xóa Nhân viên</h2>
        <input type="number" id="empId" placeholder="ID Nhân viên" required>
        <button type="submit">🗑️ Xóa</button>
    `;
    container.appendChild(form);                         // APPEND: Form vào container

    // ═══ BƯỚC 2: EVENT SUBMIT ═══
    form.addEventListener('submit', (e) => {
        e.preventDefault();                              // NGĂN: Reload page
        
        const id = parseInt(form.querySelector('#empId').value); // GET: ID từ input
        
        try {
            // ═══ VALIDATE: Employee tồn tại ═══
            const emp = EmployeeDb.getEmployeeById(id);  // THROW nếu KHÔNG tồn tại
            
            // ═══ CHECK: Có phải MANAGER? ═══
            const isManager = Department.getAllDepartments().some(d => d.managerId === id);
            
            // ═══ DYNAMIC CONFIRM MESSAGE ═══
            const message = isManager ? 
                `⚠️ ${emp.name} là MANAGER của 1+ phòng ban. Xác nhận xóa?` : 
                `Xác nhận xóa ${emp.name}?`;
            
            // ═══ USER CONFIRM ═══
            if (confirm(message)) {
                // ═══ EXECUTE DELETE ═══
                EmployeeDb.deleteEmployee(id);           // DB: Xóa employee
                alert('✅ Xóa thành công!');             // SUCCESS
                form.reset();                           // CLEAR: Input
                refreshDashboard();                     //  UI: Refresh dashboard
            }
            // IF Cancel → Không làm gì
            
        } catch (e) {
            // ═══ ERROR HANDLING ═══
            alert('❌ ' + e.message);                 // User-friendly error
            console.error('❌ Delete error:', e);     // Developer log
        }
    });
    
    console.log('✅ Delete module loaded');
}