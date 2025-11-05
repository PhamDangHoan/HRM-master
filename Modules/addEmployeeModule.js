import * as EmployeeDb from './employeeDbModule.js';     // IMPORT: Module chứa các hàm CRUD cho Employee
import * as Department from './departmentModule.js';     // IMPORT: Module chứa danh sách phòng ban
import * as Position from './positionModule.js';         // IMPORT: Module chứa danh sách vị trí
import { refreshDashboard, debounce } from '../app.js';   // IMPORT: refreshDashboard() để cập nhật UI, debounce() để tối ưu validation

export function init(container) {                        // EXPORT: Hàm chính khởi tạo form thêm nhân viên, nhận container để append form

    // BƯỚC 1: TẠO FORM VỚI HTML TEMPLATE LITERAL
    const form = document.createElement('form');          // TẠO: Element <form> mới
    form.innerHTML = `
        <h2>Thêm Nhân viên</h2>                          // TIÊU ĐỀ: Form thêm nhân viên
        
        <!-- INPUT TÊN -->
        <input type="text" id="name" placeholder="Tên" required>
        <span id="nameError" class="error"></span>       // SPAN: Hiển thị lỗi validation cho tên
        
        <!-- SELECT PHÒNG BAN - DYNAMIC OPTIONS -->
        <select id="departmentId" required>
            <option value="">Chọn phòng ban</option>     // OPTION MẶC ĐỊNH: Chưa chọn
            ${Department.getAllDepartments()             // DYNAMIC: Lấy tất cả phòng ban từ module
                .map(d => `<option value="${d.id}">${d.name}</option>`)  // MAP: Tạo option cho mỗi phòng ban
                .join('')}                               // JOIN: Nối các option thành string HTML
        </select>
        <span id="deptError" class="error"></span>       // SPAN: Lỗi phòng ban
        
        <!-- SELECT VỊ TRÍ - DYNAMIC OPTIONS -->
        <select id="positionId" required>
            <option value="">Chọn vị trí</option>
            ${Position.getAllPositions()                 // DYNAMIC: Lấy tất cả vị trí
                .map(p => `<option value="${p.id}">${p.title}</option>`) // MAP: Tạo option cho mỗi vị trí
                .join('')}
        </select>
        <span id="posError" class="error"></span>        // SPAN: Lỗi vị trí
        
        <!-- INPUT LƯƠNG -->
        <input type="number" id="salary" placeholder="Lương" required min="1">
        <span id="salaryError" class="error"></span>     // SPAN: Lỗi lương
        
        <!-- INPUT NGÀY VÀO LÀM -->
        <input type="date" id="hireDate" required>
        <span id="dateError" class="error"></span>       // SPAN: Lỗi ngày
        
        <button type="submit">Thêm</button>              // BUTTON: Submit form
    `;
    
    // BƯỚC 2: APPEND FORM VÀO CONTAINER (DOM TREE)
    container.appendChild(form);                         // APPEND: Thêm form vào container (thường là <div id="addForm">)
    
    // BƯỚC 3: GET ELEMENTS & ADD EVENT LISTENERS (CHỈ SAU KHI FORM ĐÃ APPEND VÀO DOM)
    // LÝ DO: Đảm bảo các element tồn tại trong DOM trước khi querySelector
    
    // OBJECT: Tập hợp tất cả error spans để dễ quản lý
    const errors = {
        name: form.querySelector('#nameError'),          // GET: Span lỗi tên
        dept: form.querySelector('#deptError'),          // GET: Span lỗi phòng ban
        pos: form.querySelector('#posError'),            // GET: Span lỗi vị trí
        salary: form.querySelector('#salaryError'),      // GET: Span lỗi lương
        date: form.querySelector('#dateError')           // GET: Span lỗi ngày
    };

    // VALIDATION REAL-TIME: KIỂM TRA NGAY KHI USER NHẬP
    
    // VALIDATION TÊN: Real-time khi user gõ
    const nameInput = form.querySelector('#name');       // GET: Input tên
    nameInput.addEventListener('input', debounce(() => { // EVENT: 'input' + debounce (tránh spam validation)
        // LOGIC: Kiểm tra tên rỗng → Hiển thị/làm sạch lỗi
        errors.name.textContent = nameInput.value.trim() === '' ? 'Tên không được rỗng' : '';
    }));

    // VALIDATION LƯƠNG: Real-time khi user gõ số
    const salaryInput = form.querySelector('#salary');   // GET: Input lương
    salaryInput.addEventListener('input', debounce(() => {
        const val = parseFloat(salaryInput.value);       // PARSE: Chuyển string → number
        // LOGIC: Kiểm tra NaN hoặc <= 0 → Hiển thị/làm sạch lỗi
        errors.salary.textContent = isNaN(val) || val <= 0 ? 'Lương phải > 0' : '';
    }));

    // EVENT SUBMIT: XỬ LÝ KHI NHẤN NÚT "THÊM"
    form.addEventListener('submit', (e) => {
        e.preventDefault();                              // NGĂN: Form submit mặc định (reload page)
        
        //COLLECT DATA FROM FORM 
        const data = {
            name: nameInput.value,                       // GET: Tên từ input
            departmentId: parseInt(form.querySelector('#departmentId').value), // PARSE: String → Int
            positionId: parseInt(form.querySelector('#positionId').value),    // PARSE: String → Int
            salary: parseFloat(salaryInput.value),       // PARSE: String → Float
            hireDate: form.querySelector('#hireDate').value, // GET: Ngày dạng 'YYYY-MM-DD'
            bonus: 0,                                    // DEFAULT: Thưởng mặc định = 0
            deduction: 0                                 // DEFAULT: Phạt mặc định = 0
        };

        // CLEAR ALL ERRORS TRƯỚC KHI VALIDATE 
        Object.values(errors).forEach(err => err.textContent = ''); // LOOP: Xóa text tất cả error spans

        //  VALIDATE ALL FIELDS
        let valid = true;                                // FLAG: Form hợp lệ?
        
        if (data.name.trim() === '') {                   // CHECK: Tên rỗng?
            errors.name.textContent = 'Tên không được rỗng'; 
            valid = false;
        }
        if (!data.departmentId) {                        // CHECK: Chưa chọn phòng ban?
            errors.dept.textContent = 'Chọn phòng ban'; 
            valid = false;
        }
        if (!data.positionId) {                          // CHECK: Chưa chọn vị trí?
            errors.pos.textContent = 'Chọn vị trí'; 
            valid = false;
        }
        if (data.salary <= 0 || isNaN(data.salary)) {    // CHECK: Lương không hợp lệ?
            errors.salary.textContent = 'Lương phải > 0'; 
            valid = false;
        }
        if (!data.hireDate || isNaN(Date.parse(data.hireDate))) { // CHECK: Ngày không hợp lệ?
            errors.date.textContent = 'Ngày không hợp lệ'; 
            valid = false;
        }

        // IF VALID → SAVE & REFRESH
        if (valid) {
            try {
                EmployeeDb.addEmployee(data);            // CALL: Lưu nhân viên vào database
                alert('✅ Thêm thành công!');            // SUCCESS: Thông báo
                form.reset();                           // RESET: Xóa tất cả input
                refreshDashboard();                     // REFRESH: Cập nhật bảng dashboard
            } catch (e) {                               // ERROR HANDLING
                alert('❌ Lỗi: ' + e.message);           // ERROR: Hiển thị lỗi từ DB
            }
        }
        // IF !valid → ERRORS hiển thị, user phải sửa
    });
}