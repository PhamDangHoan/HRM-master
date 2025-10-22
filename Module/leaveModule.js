// REQUEST + APPROVE + BALANCE + OVERLAP CHECK + DAY CALCULATION

import * as EmployeeDb from './employeeDbModule.js';      //  Validate Employee

const STORAGE_KEY = 'leaves';                            //  Leave requests
const BALANCE_KEY = 'leaveBalances';                     //  Leave balances
const DEFAULT_BALANCE = { annual: 20, sick: 10 };        //  Default: 20 thường niên + 10 ốm

//  LEAVE STORAGE: CRUD OPERATIONS
function getLeaves() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveLeaves(leaves) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leaves));
}

//  BALANCE STORAGE: GET/SET PER EMPLOYEE
function getLeaveBalance(employeeId) {
    const balances = JSON.parse(localStorage.getItem(BALANCE_KEY)) || {};
    return balances[employeeId] || { ...DEFAULT_BALANCE };   // MERGE: Default + Custom
}

function saveBalance(employeeId, balance) {
    const balances = JSON.parse(localStorage.getItem(BALANCE_KEY)) || {};
    balances[employeeId] = balance;
    localStorage.setItem(BALANCE_KEY, JSON.stringify(balances));
}

//  REQUEST LEAVE: VALIDATE + CHECK OVERLAP + PENDING STATUS
export function requestLeave(employeeId, startDate, endDate, type) {
    //  VALIDATE: Employee tồn tại
    EmployeeDb.getEmployeeById(employeeId);
    
    //  VALIDATE: Start <= End
    if (new Date(startDate) > new Date(endDate)) {
        throw new Error('Ngày bắt đầu phải <= ngày kết thúc');
    }
    
    const leaves = getLeaves();
    
    //  CHECK OVERLAP: Với approved leaves
    const overlap = leaves.some(l => 
        l.employeeId === employeeId && 
        l.status === 'approved' &&
        !(new Date(endDate) < new Date(l.startDate) || new Date(startDate) > new Date(l.endDate))
    );
    if (overlap) throw new Error('Trùng lịch nghỉ đã duyệt');
    
    //  AUTO ID
    const id = Math.max(...leaves.map(l => l.id || 0), 0) + 1;
    
    //  CREATE PENDING REQUEST
    const request = { 
        id, 
        employeeId, 
        startDate, 
        endDate, 
        type, 
        status: 'pending', 
        requestedAt: new Date().toISOString().split('T')[0]
    };
    
    leaves.push(request);
    saveLeaves(leaves);
    console.log(`✅ Requested leave ID ${id} for emp ${employeeId}`);
}

//  APPROVE LEAVE: CHECK BALANCE + DEDUCT DAYS (+1 CHO END DATE)
export function approveLeave(leaveId) {
    let leaves = getLeaves();
    const leave = leaves.find(l => l.id === leaveId);
    
    if (!leave) throw new Error('Không tìm thấy yêu cầu nghỉ phép');
    if (leave.status !== 'pending') throw new Error('Yêu cầu đã được xử lý');
    
    //  FIXED: TÍNH ĐÚNG SỐ NGÀY (+1 CHO END DATE)
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    //  CHECK BALANCE
    const balance = getLeaveBalance(leave.employeeId);
    if (balance[leave.type] < days) {
        throw new Error(
            `❌ Không đủ ngày ${leave.type}: ` +
            `Còn ${balance[leave.type]} ngày, cần ${days} ngày`
        );
    }
    
    //  APPROVE + DEDUCT
    leave.status = 'approved';
    balance[leave.type] -= days;
    saveBalance(leave.employeeId, balance);
    saveLeaves(leaves);
    
    console.log(`✅ Approved leave ${leaveId}: Deducted ${days} ${leave.type} days`);
}

//  ADD BALANCE: NẠP NGÀY NGHỈ THÊM
export function addLeaveBalance(employeeId, type, days) {
    if (days <= 0) throw new Error('Số ngày phải > 0');
    EmployeeDb.getEmployeeById(employeeId);              // VALIDATE Employee
    
    const balance = getLeaveBalance(employeeId);
    const oldBalance = balance[type] || 0;
    balance[type] = oldBalance + days;
    saveBalance(employeeId, balance);
    
    console.log(`✅ Added ${days} ${type} days for emp ${employeeId}. New: ${balance[type]}`);
    return balance[type];                                // RETURN: New total
}

// DISPLAY TABLE: LEAVE REQUESTS + APPROVE BUTTONS
function displayRequests(container) {
    const tableDiv = document.createElement('div');
    tableDiv.innerHTML = '<h3>📋 Danh sách Yêu cầu Nghỉ phép</h3>';
    const leaves = getLeaves();
    
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Nhân viên</th>
                <th>Bắt đầu</th>
                <th>Kết thúc</th>
                <th>Số ngày</th>
                <th>Loại</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
            </tr>
        </thead>
        <tbody>
            ${leaves.length > 0 ? 
                leaves.map(l => {
                    const emp = EmployeeDb.getAllEmployees().find(e => e.id === l.employeeId);
                    const days = Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / (1000 * 60 * 60 * 24)) + 1;
                    return `
                        <tr>
                            <td><strong>${l.id}</strong></td>
                            <td>${emp?.name || l.employeeId}</td>
                            <td>${l.startDate}</td>
                            <td>${l.endDate}</td>
                            <td><strong>${days}</strong></td>
                            <td>${l.type === 'annual' ? '🏖️ Thường niên' : '🤒 Ốm'}</td>
                            <td>
                                <span class="status ${l.status}">${l.status}</span>
                            </td>
                            <td>
                                ${l.status === 'pending' ? 
                                    `<button class="approve-btn" data-id="${l.id}">✅ Duyệt</button>` : 
                                    `<span class="done">✓</span>`
                                }
                            </td>
                        </tr>
                    `;
                }).join('') : 
                '<tr><td colspan="8" style="text-align:center;color:#999;">Chưa có yêu cầu nghỉ phép</td></tr>'
            }
        </tbody>
    `;
    
    tableDiv.appendChild(table);
    container.appendChild(tableDiv);

    // ═══ EVENT: APPROVE BUTTONS ═══
    table.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            try {
                approveLeave(id);
                alert('✅ Duyệt thành công!');
                init(container);                         // REFRESH
            } catch (e) {
                alert('❌ ' + e.message);
            }
        });
    });
}

//  INIT: FULL UI + 2 FORMS + TABLE
export function init(container) {
    console.log('🏖️ Leave module initializing...');
    
    container.innerHTML = '<h2>🏖️ Quản lý Nghỉ phép</h2>';
    
    // ═══ 1. REQUEST FORM ═══
    const requestForm = document.createElement('form');
    requestForm.innerHTML = `
        <h3>📝 Yêu cầu Nghỉ phép Mới</h3>
        <div class="form-row">
            <input type="number" id="empId" placeholder="ID Nhân viên" required>
            <input type="date" id="startDate" required>
            <input type="date" id="endDate" required>
        </div>
        <select id="type">
            <option value="annual">🏖️ Nghỉ thường niên (20 ngày/năm)</option>
            <option value="sick">🤒 Nghỉ ốm (10 ngày/năm)</option>
        </select>
        <button type="submit">📤 Gửi yêu cầu</button>
    `;
    container.appendChild(requestForm);
    
    // ═══ 2. BALANCE FORM ═══
    const balanceForm = document.createElement('form');
    balanceForm.innerHTML = `
        <h3>💳 Nạp Ngày Nghỉ Thêm</h3>
        <div class="form-row">
            <input type="number" id="balanceEmpId" placeholder="ID Nhân viên" required>
            <select id="balanceType">
                <option value="annual">🏖️ Thường niên</option>
                <option value="sick">🤒 Ốm</option>
            </select>
            <input type="number" id="balanceDays" placeholder="Số ngày" min="1" required>
        </div>
        <button type="submit">💳 Nạp ngày</button>
    `;
    container.appendChild(balanceForm);
    
    // ═══ 3. TABLE ═══
    displayRequests(container);
    
    // ═══ EVENTS ═══
    requestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            const id = parseInt(document.getElementById('empId').value);
            const start = document.getElementById('startDate').value;
            const end = document.getElementById('endDate').value;
            const type = document.getElementById('type').value;
            requestLeave(id, start, end, type);
            alert('✅ Yêu cầu gửi thành công! (Pending)');
            requestForm.reset();
            init(container);                         // REFRESH TABLE
        } catch (e) {
            alert('❌ ' + e.message);
        }
    });
    
    balanceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            const id = parseInt(document.getElementById('balanceEmpId').value);
            const type = document.getElementById('balanceType').value;
            const days = parseInt(document.getElementById('balanceDays').value);
            const newBalance = addLeaveBalance(id, type, days);
            alert(`✅ Nạp thành công! Còn ${newBalance} ngày ${type}`);
            balanceForm.reset();
        } catch (e) {
            alert('❌ ' + e.message);
        }
    });
    
    console.log('✅ Leave module loaded');
}