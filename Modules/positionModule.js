import * as EmployeeDb from './employeeDbModule.js';
import { refreshDashboard } from '../app.js';

const STORAGE_KEY = 'positions';

// INIT DATA: 5 VỊ TRÍ MẶC ĐỊNH LẦN ĐẦU
function initData() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        const defaults = [
            { id: 1, title: 'Developer', description: 'Phát triển phần mềm', salaryBase: 1000 },
            { id: 2, title: 'Manager', description: 'Quản lý đội nhóm', salaryBase: 1500 },
            { id: 3, title: 'Analyst', description: 'Phân tích nghiệp vụ', salaryBase: 1200 },
            { id: 4, title: 'Tester', description: 'Kiểm thử phần mềm', salaryBase: 900 },
            { id: 5, title: 'Designer', description: 'Thiết kế giao diện', salaryBase: 1100 }
        ];
        savePositions(defaults);
        console.log('✅ Default 5 positions created');
    }
}
initData();

// STORAGE: SAFE GET/SAVE (ASYNC)
function getAllPositions() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
        console.error('❌ Parse positions error:', e);
        return [];
    }
}

async function savePositions(positions) {
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
        console.log(`✅ Saved ${positions.length} positions`);
    } catch (e) {
        console.error('❌ Save error:', e);
        throw new Error('Lưu vị trí thất bại');
    }
}

export { getAllPositions };

// CREATE: VALIDATE + UNIQUE + AUTO ID
export async function addPosition(title, description, salaryBase) {
    if (!title.trim()) throw new Error('Tiêu đề không được rỗng');
    if (salaryBase <= 0) throw new Error('Lương cơ bản phải > 0');
    
    const positions = getAllPositions();
    if (positions.find(p => p.title === title.trim())) {
        throw new Error('Vị trí đã tồn tại');
    }
    
    const id = Math.max(...positions.map(p => p.id), 0) + 1;
    const newPos = { id, title: title.trim(), description: description.trim(), salaryBase: parseFloat(salaryBase) };
    
    positions.push(newPos);
    await savePositions(positions);
    console.log(`✅ Added position ID ${id}: ${title}`);
}

// UPDATE: PARTIAL UPDATES + VALIDATE
export async function editPosition(id, updates) {
    if (!updates.title?.trim()) throw new Error('Tiêu đề không được rỗng');
    if (updates.salaryBase && updates.salaryBase <= 0) throw new Error('Lương cơ bản phải > 0');
    
    let positions = getAllPositions();
    const index = positions.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Không tìm thấy vị trí');
    
    positions[index] = { ...positions[index], ...updates };
    await savePositions(positions);
    console.log(`✅ Updated position ID ${id}`);
}

// DELETE: FK CHECK (EMPLOYEES)
export async function deletePosition(id) {
    console.log(`🔍 Attempting to delete position ID ${id}`);
    const employees = EmployeeDb.getAllEmployees();
    console.log(`🔍 Employees data:`, employees);
    const empCount = employees.filter(e => e.positionId === id).length;
    if (empCount > 0) {
        console.warn(`⚠️ Cannot delete: ${empCount} employees using position ID ${id}`);
        throw new Error(`Không thể xóa! Có ${empCount} nhân viên đang giữ vị trí này`);
    }
    
    let positions = getAllPositions();
    positions = positions.filter(p => p.id !== id);
    await savePositions(positions);
    console.log(`✅ Deleted position ID ${id}`);
    refreshDashboard();
}

// DISPLAY TABLE: WITH EMPLOYEE COUNT
function displayTable(container) {
    const positions = getAllPositions();
    const employees = EmployeeDb.getAllEmployees();
    
    const table = document.createElement('table');
    table.innerHTML = `
        <h3>💼 Danh sách Vị trí (<strong>${positions.length}</strong>)</h3>
        <thead>
            <tr>
                <th>ID</th>
                <th>Tiêu đề</th>
                <th>Mô tả</th>
                <th>Lương cơ bản</th>
                <th>Số NV</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${positions.map(p => {
                const empCount = employees.filter(e => e.positionId === p.id).length;
                return `
                    <tr>
                        <td><strong>${p.id}</strong></td>
                        <td>${p.title}</td>
                        <td>${p.description}</td>
                        <td><strong>${p.salaryBase.toLocaleString()}$</strong></td>
                        <td><span class="badge">${empCount}</span></td>
                        <td>
                            <button class="edit-btn" data-id="${p.id}">✏️ Sửa</button>
                            <button class="delete-btn" data-id="${p.id}" ${empCount > 0 ? 'disabled' : ''}>🗑️ Xóa</button>
                        </td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;
    container.appendChild(table);

    // Gắn sự kiện cho nút Sửa
    console.log('🔍 Attaching event listeners for edit buttons');
    table.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => {
            console.log(`🔍 Edit button clicked for ID ${button.dataset.id}`);
            const id = parseInt(button.dataset.id);
            editingId = id;
            createForm(container);
        });
    });

    // Gắn sự kiện cho nút Xóa
    console.log('🔍 Attaching event listeners for delete buttons');
    table.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const id = parseInt(button.dataset.id);
            console.log(`🔍 Delete button clicked for ID ${id}`);
            const pos = positions.find(p => p.id === id);
            if (confirm(`Xác nhận xóa "${pos?.title}"?`)) {
                try {
                    await deletePosition(id);
                    alert('✅ Xóa thành công!');
                    init(container);
                } catch (e) {
                    console.error('❌ Delete error:', e);
                    alert('❌ ' + e.message);
                }
            }
        });
    });
}

// CREATE FORM: ADD/EDIT + PREFILL
let editingId = null;

function createForm(container) {
    const form = document.createElement('form');
    const pos = editingId ? getAllPositions().find(p => p.id === editingId) : null;
    const title = editingId ? '✏️ Sửa Vị trí' : '➕ Thêm Vị trí';
    
    form.innerHTML = `
        <h3>${title}</h3>
        <input type="text" id="title" placeholder="Tiêu đề vị trí" required value="${pos?.title || ''}">
        <input type="text" id="description" placeholder="Mô tả công việc" required value="${pos?.description || ''}">
        <input type="number" id="salaryBase" placeholder="Lương cơ bản" min="1" required value="${pos?.salaryBase || ''}">
        <button type="submit">${editingId ? '✅ Cập nhật' : '➕ Thêm'}</button>
        <button type="button" id="cancel">❌ Hủy</button>
    `;
    container.appendChild(form);
    
    // SUBMIT
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const title = form.querySelector('#title').value;
            const description = form.querySelector('#description').value;
            const salaryBase = parseFloat(form.querySelector('#salaryBase').value);
            console.log(`🔍 Submitting form: title=${title}, description=${description}, salaryBase=${salaryBase}`);
            
            if (editingId) {
                await editPosition(editingId, { title, description, salaryBase });
                alert('✅ Cập nhật thành công!');
            } else {
                await addPosition(title, description, salaryBase);
                alert('✅ Thêm thành công!');
            }
            
            editingId = null;
            init(container);
        } catch (e) {
            console.error('❌ Form submission error:', e);
            alert('❌ ' + e.message);
        }
    });
    
    // CANCEL
    form.querySelector('#cancel').addEventListener('click', () => {
        console.log('🔍 Cancel button clicked');
        editingId = null;
        init(container);
    });
}

// INIT: BUTTON + TABLE
export function init(container) {
    console.log('💼 Position module initializing...');
    
    container.innerHTML = '<h2>💼 Quản lý Vị trí</h2>';
    
    // ADD BUTTON
    const addBtn = document.createElement('button');
    addBtn.innerHTML = '➕ Thêm Vị trí';
    addBtn.style.cssText = 'background:#4CAF50;color:white;padding:12px;margin:10px;font-size:16px;';
    addBtn.addEventListener('click', () => {
        console.log('🔍 Add button clicked');
        createForm(container);
    });
    container.appendChild(addBtn);
    
    // TABLE
    displayTable(container);
    
    editingId = null;
    console.log('✅ Position module loaded');
}

export const PositionModule = {
    init,
    addPosition,
    editPosition,
    deletePosition,
    getAllPositions
};