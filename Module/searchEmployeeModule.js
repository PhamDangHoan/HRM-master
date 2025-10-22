// MULTI-FILTER + LIVE SEARCH + SORT + EXPORT CSV + REAL SALARY + STATS
// REMOVED: Edit/Salary buttons in results table

import * as EmployeeDb from './employeeDbModule.js';      //  Employee data
import * as Department from './departmentModule.js';     //  Department names
import * as Position from './positionModule.js';         //  Position lookup
import { filterEmployees, sortEmployees } from './employeeDbModule.js'; //  Utilities


//  INIT: LIVE SEARCH FORM + RESULTS TABLE
export function init(container) {
    console.log('🔍 Search module initializing...');
    
    //  1. SEARCH FORM
    const form = document.createElement('form');
    form.innerHTML = `
        <h2>🔍 Tìm kiếm Nhân viên <small>(Live Search)</small></h2>
        <div class="search-grid">
            <input type="text" id="name" placeholder="👤 Tên NV" autocomplete="off">
            <select id="departmentId">
                <option value="">🏢 Tất cả PB</option>
                ${Department.getAllDepartments().map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
            </select>
            <select id="positionId">
                <option value="">💼 Tất cả VT</option>
                ${Position.getAllPositions().map(p => `<option value="${p.id}">${p.title}</option>`).join('')}
            </select>
            <input type="date" id="hireDateFrom" placeholder="📅 Từ ngày">
            <input type="date" id="hireDateTo" placeholder="📅 Đến ngày">
            <div class="salary-range">
                <input type="number" id="minSalary" placeholder="💰 Min">
                <input type="number" id="maxSalary" placeholder="💰 Max">
                <span id="salaryError" class="error"></span>
            </div>
            <button type="submit">🔎 Tìm</button>
        </div>
        
        <div class="sort-controls">
            <button type="button" id="sortSalaryAsc" title="Lương tăng dần">📈</button>
            <button type="button" id="sortSalaryDesc" title="Lương giảm dần">📉</button>
            <button type="button" id="sortName" title="Tên A→Z">🔤</button>
            <button type="button" id="sortDate" title="Ngày vào mới→cũ">📅</button>
            <button type="button" id="exportCsv" title="Xuất CSV">📥</button>
        </div>
    `;
    container.appendChild(form);
    
    //  2. RESULTS CONTAINER
    const resultsDiv = document.createElement('div');
    resultsDiv.id = 'searchResults';
    container.appendChild(resultsDiv);
    
    //  3. LIVE SEARCH (100ms debounce)
    const nameInput = form.querySelector('#name');
    let searchTimeout;
    nameInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => performSearch(form, resultsDiv), 100);
    });
    
    //  4. FORM SUBMIT
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        performSearch(form, resultsDiv);
    });
    
    //  5. SORT BUTTONS
    form.querySelector('#sortSalaryAsc').addEventListener('click', () => sortResults(resultsDiv, 'salary', 'asc'));
    form.querySelector('#sortSalaryDesc').addEventListener('click', () => sortResults(resultsDiv, 'salary', 'desc'));
    form.querySelector('#sortName').addEventListener('click', () => sortResults(resultsDiv, 'name', 'asc'));
    form.querySelector('#sortDate').addEventListener('click', () => sortResults(resultsDiv, 'hireDate', 'desc'));
    
    //  6. EXPORT CSV
    form.querySelector('#exportCsv').addEventListener('click', () => exportToCsv(resultsDiv));
    
    //  INITIAL LOAD: Show all
    performSearch(form, resultsDiv);
    
    console.log('✅ Search module loaded');
}

//  PERFORM SEARCH: MULTI-FILTER + REAL SALARY CALC
function performSearch(form, resultsDiv) {
    try {
        // GET FILTER VALUES
        const name = form.querySelector('#name').value.trim();
        const deptId = parseInt(form.querySelector('#departmentId').value) || null;
        const posId = parseInt(form.querySelector('#positionId').value) || null;
        const hireFrom = form.querySelector('#hireDateFrom').value;
        const hireTo = form.querySelector('#hireDateTo').value;
        const minSal = parseFloat(form.querySelector('#minSalary').value) || 0;
        const maxSal = parseFloat(form.querySelector('#maxSalary').value) || Infinity;
        
        // VALIDATE SALARY RANGE
        const error = form.querySelector('#salaryError');
        if (minSal > maxSal) {
            error.textContent = 'Min <= Max';
            return;
        }
        error.textContent = '';
        
        // CREATE PREDICATE
        const predicate = emp => {
            const nameMatch = !name || emp.name.toLowerCase().includes(name.toLowerCase());
            const deptMatch = !deptId || emp.departmentId === deptId;
            const posMatch = !posId || emp.positionId === posId;
            const hireMatch = (!hireFrom || emp.hireDate >= hireFrom) && 
                             (!hireTo || emp.hireDate <= hireTo);
            
            // REAL SALARY: base * deptLevel
            const pos = Position.getAllPositions().find(p => p.id === emp.positionId);
            const dept = Department.getAllDepartments().find(d => d.id === emp.departmentId);
            const baseSalary = pos ? pos.salaryBase : emp.salary;
            const deptFactor = dept?.level || 1;
            const realSalary = baseSalary * deptFactor;
            
            const salaryMatch = realSalary >= minSal && realSalary <= maxSal;
            
            return nameMatch && deptMatch && posMatch && hireMatch && salaryMatch;
        };
        
        // FILTER + DISPLAY
        const results = EmployeeDb.getAllEmployees().filter(predicate);
        displayResults(results, resultsDiv);
        
    } catch (e) {
        console.error('Search error:', e);
        resultsDiv.innerHTML = `<p class="error">❌ Lỗi tìm kiếm: ${e.message}</p>`;
    }
}

//  DISPLAY RESULTS: TABLE + STATS (NO ACTIONS)
function displayResults(results, container) {
    const deptNames = Department.getAllDepartments();
    const posNames = Position.getAllPositions();
    
    // STATS
    const totalSalary = results.reduce((sum, emp) => sum + calculateRealSalary(emp), 0);
    const avgSalary = results.length ? Math.round(totalSalary / results.length) : 0;
    
    container.innerHTML = `
        <div class="results-header">
            <h3>✅ Kết quả tìm kiếm (<strong>${results.length}</strong> NV)</h3>
            <div class="stats">
                <span>💰 Tổng lương: ${totalSalary.toLocaleString()}$</span>
                <span>📊 TB: ${avgSalary.toLocaleString()}$</span>
            </div>
        </div>
        
        ${results.length ? `
        <table>
            <thead>
                <tr>
                    <th>ID</th><th>Tên</th><th>PB</th><th>VT</th>
                    <th>Lương thực tế</th><th>Ngày vào</th>
                </tr>
            </thead>
            <tbody>
                ${results.map(emp => {
                    const dept = deptNames.find(d => d.id === emp.departmentId);
                    const pos = posNames.find(p => p.id === emp.positionId);
                    const realSalary = calculateRealSalary(emp);
                    return `
                        <tr>
                            <td><strong>${emp.id}</strong></td>
                            <td>${emp.name}</td>
                            <td>${dept?.name || 'N/A'}</td>
                            <td>${pos?.title || 'N/A'}</td>
                            <td><strong>${realSalary.toLocaleString()}$</strong></td>
                            <td>${emp.hireDate}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        ` : '<p class="no-results">😔 Không tìm thấy nhân viên nào</p>'}
    `;
}

//  HELPER: CALCULATE REAL SALARY
function calculateRealSalary(emp) {
    const pos = Position.getAllPositions().find(p => p.id === emp.positionId);
    const dept = Department.getAllDepartments().find(d => d.id === emp.departmentId);
    const baseSalary = pos ? pos.salaryBase : emp.salary;
    return Math.round(baseSalary * (dept?.level || 1));
}


//  SORT RESULTS: CLIENT-SIDE RE-SORT
function sortResults(container, field, direction) {
    const table = container.querySelector('table');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    const comparator = direction === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
        let valA, valB;
        if (field === 'name') {
            valA = a.cells[1].textContent;
            valB = b.cells[1].textContent;
            return valA.localeCompare(valB) * comparator;
        } else if (field === 'salary') {
            valA = parseFloat(a.cells[4].textContent.replace(/[^\d]/g, ''));
            valB = parseFloat(b.cells[4].textContent.replace(/[^\d]/g, ''));
            return (valA - valB) * comparator;
        } else if (field === 'hireDate') {
            valA = a.cells[5].textContent;
            valB = b.cells[5].textContent;
            return new Date(valB) - new Date(valA); // Newest first
        }
        return 0;
    });
    
    rows.forEach(row => tbody.appendChild(row));
}

//  EXPORT CSV: DOWNLOAD RESULTS
function exportToCsv(container) {
    const table = container.querySelector('table');
    if (!table || !table.querySelector('tbody tr')) {
        alert('❌ Không có dữ liệu để xuất');
        return;
    }
    
    const rows = Array.from(table.querySelectorAll('tr'));
    let csv = rows.map(row => 
        Array.from(row.cells).map(cell => 
            `"${cell.textContent.replace(/"/g, '""')}"`
        ).join(',')
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nhan_vien_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert(`✅ Xuất ${rows.length} dòng thành công!`);
}

