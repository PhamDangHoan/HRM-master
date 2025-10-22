// BONUS + DEDUCTION + NET CALC + PAYROLL REPORT + BULK UPDATE + CHARTS

import * as EmployeeDb from './employeeDbModule.js';      //  Employee CRUD
import * as Department from './departmentModule.js';     //  Dept level lookup
import * as Position from './positionModule.js';         //  Position base lookup

//  CORE CALCULATION: NET SALARY (REAL + BONUS - DEDUCTION)
export function calculateNetSalary(employee) {
    //  VALIDATE: Bonus/Deduction >= 0
    if (employee.bonus < 0 || employee.deduction < 0) {
        throw new Error('Thưởng và khấu trừ phải >= 0');
    }
    
    //  REAL SALARY: base * deptLevel (từ Employee Management)
    const pos = Position.getAllPositions().find(p => p.id === employee.positionId);
    const dept = Department.getAllDepartments().find(d => d.id === employee.departmentId);
    const baseSalary = pos ? pos.salaryBase : employee.salary;
    const deptFactor = dept?.level || 1;
    const realSalary = baseSalary * deptFactor;
    
    //  NET: real + bonus - deduction
    return Math.round(realSalary + employee.bonus - employee.deduction);
}

//  PAYROLL REPORT: FULL DATA + TOTALS + DEPT BREAKDOWN
export function generatePayrollReport() {
    const employees = EmployeeDb.getAllEmployees();
    const report = employees.map(emp => ({
        ...emp,
        realSalary: calculateNetSalary(emp) + emp.deduction - emp.bonus, // Base before bonus/ded
        netSalary: calculateNetSalary(emp)
    }));
    
    const total = report.reduce((sum, r) => sum + r.netSalary, 0);
    const deptTotals = {};
    report.forEach(r => {
        const deptId = r.departmentId;
        deptTotals[deptId] = (deptTotals[deptId] || 0) + r.netSalary;
    });
    
    return { 
        report, 
        total, 
        deptTotals,
        stats: {
            totalEmployees: report.length,
            avgSalary: Math.round(total / report.length),
            totalBonus: report.reduce((sum, r) => sum + r.bonus, 0),
            totalDeduction: report.reduce((sum, r) => sum + r.deduction, 0)
        }
    };
}

//  DISPLAY REPORT: TABLE + STATS + DEPT CHART
function displayReport(container) {
    const { report, total, stats, deptTotals } = generatePayrollReport();
    const deptNames = Department.getAllDepartments();
    
    const reportDiv = document.createElement('div');
    reportDiv.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>${stats.totalEmployees}</h3>
                <p>Tổng NV</p>
            </div>
            <div class="stat-card">
                <h3>${stats.avgSalary.toLocaleString()}$</h3>
                <p>Lương TB</p>
            </div>
            <div class="stat-card">
                <h3>${stats.totalBonus.toLocaleString()}$</h3>
                <p>Tổng thưởng</p>
            </div>
            <div class="stat-card">
                <h3>${total.toLocaleString()}$</h3>
                <p>Tổng lương</p>
            </div>
        </div>
        
        <h3>💰 Bảng lương chi tiết (${report.length} NV)</h3>
        <table>
            <thead>
                <tr>
                    <th>ID</th><th>Tên</th><th>Phòng ban</th><th>Lương gốc</th>
                    <th>Thưởng</th><th>Khấu trừ</th><th><strong>Lương ròng</strong></th>
                </tr>
            </thead>
            <tbody>
                ${report.map(r => {
                    const dept = deptNames.find(d => d.id === r.departmentId);
                    return `
                        <tr>
                            <td>${r.id}</td>
                            <td>${r.name}</td>
                            <td>${dept?.name || 'N/A'}</td>
                            <td>${r.realSalary.toLocaleString()}</td>
                            <td style="color:green">+${r.bonus.toLocaleString()}</td>
                            <td style="color:red">-${r.deduction.toLocaleString()}</td>
                            <td><strong>${r.netSalary.toLocaleString()}$</strong></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
            <tfoot>
                <tr><td colspan="6"><strong>TỔNG</strong></td><td><strong>${total.toLocaleString()}$</strong></td></tr>
            </tfoot>
        </table>
        
        <h3>📊 Phân bổ theo Phòng ban</h3>
        <div class="dept-chart">
            ${Object.entries(deptTotals).map(([deptId, amount]) => {
                const dept = deptNames.find(d => d.id == deptId);
                return `
                    <div class="dept-bar">
                        <span>${dept?.name || deptId}</span>
                        <div class="bar" style="width: ${Math.min(amount/total*100, 100)}%">
                            ${amount.toLocaleString()}$
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    container.appendChild(reportDiv);
}

//  UPDATE BONUS/DEDUCTION: SINGLE EMPLOYEE
function createUpdateForm(container) {
    const form = document.createElement('form');
    form.innerHTML = `
        <h3>💰 Cập nhật Thưởng/Phạt</h3>
        <div class="form-row">
            <input type="number" id="empId" placeholder="ID Nhân viên" required>
            <input type="number" id="bonus" placeholder="Thưởng" min="0" value="0">
            <input type="number" id="deduction" placeholder="Khấu trừ" min="0" value="0">
        </div>
        <button type="submit">✅ Cập nhật</button>
        <button type="button" id="cancel">❌ Hủy</button>
    `;
    container.appendChild(form);
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            const id = parseInt(document.getElementById('empId').value);
            const bonus = parseFloat(document.getElementById('bonus').value) || 0;
            const deduction = parseFloat(document.getElementById('deduction').value) || 0;
            
            const emp = EmployeeDb.getEmployeeById(id);
            const updated = { ...emp, bonus, deduction };
            EmployeeDb.updateEmployee(updated);
            
            alert(`✅ Cập nhật thành công!\nThưởng: +${bonus.toLocaleString()}$\nKhấu trừ: -${deduction.toLocaleString()}$`);
            form.reset();
            init(container);                              // REFRESH REPORT
        } catch (e) {
            alert('❌ ' + e.message);
        }
    });
    
    form.querySelector('#cancel').addEventListener('click', () => init(container));
}

//  INIT: STATS + TABLE + FORM + CHART
export function init(container) {
    console.log('💰 Salary module initializing...');
    
    container.innerHTML = '<h2>💰 Quản lý Lương</h2>';
    
    //  REPORT FIRST
    displayReport(container);
    
    //  UPDATE FORM
    const addBtn = document.createElement('button');
    addBtn.innerHTML = '➕ Cập nhật Thưởng/Phạt';
    addBtn.style.cssText = 'background:#FF6B35;color:white;padding:12px;margin:10px;font-size:16px;';
    addBtn.addEventListener('click', () => createUpdateForm(container));
    container.appendChild(addBtn);
    
    console.log('✅ Salary module loaded');
}