// CRUD: CheckIn/Out + Báo cáo giờ làm + LocalStorage
import * as EmployeeDb from './employeeDbModule.js';      //  VALIDATE: Employee tồn tại?

//  LOCALSTORAGE CONFIG: LƯU TRỮ DỮ LIỆU CHẤM CÔNG
const STORAGE_KEY = 'attendance';                        // KEY: 'attendance' trong localStorage

//  GETTER: LẤY DANH SÁCH CHẤM CÔNG TỪ LOCALSTORAGE
function getAttendance() {
    // PARSE: JSON từ localStorage → Array | DEFAULT: []
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

//  SETTER: LƯU DANH SÁCH CHẤM CÔNG VÀO LOCALSTORAGE
function saveAttendance(att) {
    // STRINGIFY: Array → JSON → Lưu vào localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(att));
}

//  CHECK IN: NHÂN VIỆN VÀO LÀM
export function checkIn(employeeId) {
    // VALIDATE: Employee tồn tại trong DB
    EmployeeDb.getEmployeeById(employeeId); 
    
    const att = getAttendance();                         // GET: Danh sách hiện tại
    const today = new Date().toISOString().split('T')[0]; // TODAY: 'YYYY-MM-DD'
    
    // CHECK: Đã checkIn hôm nay chưa?
    if (att.some(a => a.employeeId === employeeId && a.date === today)) {
        throw new Error('Đã checkIn hôm nay');           // ERROR: Trùng lặp
    }
    
    // ADD: Record mới {date, employeeId, checkIn: timestamp, checkOut: null}
    att.push({ 
        date: today, 
        employeeId, 
        checkIn: Date.now(),                             // TIMESTAMP: ms từ 1970
        checkOut: null 
    });
    
    saveAttendance(att);                                 // SAVE: Cập nhật localStorage
}

//  CHECK OUT: NHÂN VIỆN TAN LÀM
export function checkOut(employeeId) {
    const att = getAttendance();                         // GET: Danh sách
    const today = new Date().toISOString().split('T')[0]; // TODAY: 'YYYY-MM-DD'
    
    // FIND: Record hôm nay chưa checkOut
    const record = att.find(a => 
        a.employeeId === employeeId && 
        a.date === today && 
        !a.checkOut
    );
    
    if (!record) {                                       // ERROR: Chưa checkIn
        throw new Error('Chưa checkIn hôm nay');
    }
    
    record.checkOut = Date.now();                        // UPDATE: Timestamp checkOut
    saveAttendance(att);                                 // SAVE
}

//  GET REPORT: BÁO CÁO GIỜ LÀM THEO KỲ
// INPUT: employeeId, fromDate, toDate
// OUTPUT: Array {date, checkIn, checkOut, hours}
export function getAttendanceReport(employeeId, from, to) {
    // VALIDATE: from <= to
    if (new Date(from) > new Date(to)) {
        throw new Error('From <= To');
    }
    
    // FILTER: Records trong khoảng thời gian
    const att = getAttendance().filter(a => 
        a.employeeId === employeeId && 
        a.date >= from && 
        a.date <= to
    );
    
    // MAP: Tính giờ làm (ms → hours)
    return att.map(a => {
        const hours = a.checkOut ? 
            (a.checkOut - a.checkIn) / 3600000 : 0;     // 1 hour = 3600000ms
        return { ...a, hours };                          // SPREAD: Giữ nguyên + thêm hours
    });
}

//  DISPLAY UI: FORM + BẢNG BÁO CÁO
function displayFormAndReport(container) {
    // ═══ BƯỚC 1: TẠO FORM ═══
    const form = document.createElement('form');
    form.innerHTML = `
        <!-- INPUT: ID Nhân viên -->
        <input type="number" id="empId" placeholder="ID Nhân viên" required>
        
        <!-- BUTTONS: Check In/Out -->
        <button type="button" id="checkInBtn">Check In</button>
        <button type="button" id="checkOutBtn">Check Out</button>
        <br>
        
        <!-- INPUT: Khoảng thời gian báo cáo -->
        <input type="date" id="fromDate" required>
        <input type="date" id="toDate" required>
        <button type="submit">Xem Báo cáo</button>
    `;
    container.appendChild(form);                         // APPEND: Form vào container

    //  EVENT: SUBMIT → XEM BÁO CÁO 
    form.addEventListener('submit', (e) => {
        e.preventDefault();                              // NGĂN: Reload page
        
        try {
            // GET: Dữ liệu từ form
            const id = parseInt(document.getElementById('empId').value);
            const from = document.getElementById('fromDate').value;
            const to = document.getElementById('toDate').value;
            
            // CALL: Lấy báo cáo
            const report = getAttendanceReport(id, from, to);
            const totalHours = report.reduce((sum, r) => sum + r.hours, 0); // TỔNG GIỜ
            
            // TẠO BẢNG HTML
            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Ngày</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Giờ</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.map(r => `
                        <tr>
                            <td>${r.date}</td>
                            <td>${new Date(r.checkIn).toLocaleTimeString()}</td>
                            <td>${r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : 'N/A'}</td>
                            <td>${r.hours.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3">Tổng giờ</td>
                        <td>${totalHours.toFixed(2)}</td>
                    </tr>
                </tfoot>
            `;
            container.appendChild(table);                    // APPEND: Bảng vào container
        } catch (e) {
            alert(e.message);                            // ERROR: Hiển thị cho user
        }
    });

    // EVENT: CHECK IN BUTTON 
    document.getElementById('checkInBtn').addEventListener('click', () => {
        try {
            const id = parseInt(document.getElementById('empId').value);
            checkIn(id);                                 // CALL: CheckIn
            alert('Check In thành công!');               // SUCCESS
        } catch (e) {
            alert(e.message);                            // ERROR
        }
    });

    // EVENT: CHECK OUT BUTTON 
    document.getElementById('checkOutBtn').addEventListener('click', () => {
        try {
            const id = parseInt(document.getElementById('empId').value);
            checkOut(id);                                // CALL: CheckOut
            alert('Check Out thành công!');              // SUCCESS
        } catch (e) {
            alert(e.message);                            // ERROR
        }
    });
}

//  INIT: KHỞI TẠO MODULE (GỌI TỪ app.js)
export function init(container) {
    // CLEAR & TITLE
    container.innerHTML = '<h2>Theo dõi Chấm công</h2>';
    
    // SETUP UI
    displayFormAndReport(container);
    console.log('✅ Attendance module loaded');
}