// FULL CRUD + ERROR HANDLING + VALIDATION + UTILITIES
// SINGLE SOURCE OF TRUTH CHO TẤT CẢ EMPLOYEE DATA

const STORAGE_KEY = 'employees';                         //  LocalStorage key

//  INIT DATA: TẠO 5 NHÂN VIỆN MẶC ĐỊNH LẦN ĐẦU
export function initData() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        const defaultEmployees = [
            // IT DEPT (ID=1, Level=1.5x)
            { id: 1, name: 'Nguyễn Văn A', departmentId: 1, positionId: 1, salary: 1000, hireDate: '2023-01-01', bonus: 0, deduction: 0 },
            { id: 2, name: 'Trần Thị B', departmentId: 1, positionId: 2, salary: 1200, hireDate: '2023-02-01', bonus: 0, deduction: 0 },
            
            // HR DEPT (ID=2, Level=1.2x)
            { id: 3, name: 'Lê Văn C', departmentId: 2, positionId: 1, salary: 1100, hireDate: '2023-03-01', bonus: 0, deduction: 0 },
            { id: 4, name: 'Phạm Thị D', departmentId: 2, positionId: 3, salary: 1300, hireDate: '2023-04-01', bonus: 0, deduction: 0 },
            
            // FINANCE DEPT (ID=3, Level=1.7x)
            { id: 5, name: 'Hoàng Văn E', departmentId: 3, positionId: 2, salary: 1400, hireDate: '2023-05-01', bonus: 0, deduction: 0 }
        ];
        saveEmployees(defaultEmployees);
        console.log('✅ Default 5 employees created');
    }
}
initData();                                              //  AUTO RUN khi file load

//  READ: GET ALL EMPLOYEES (SAFE PARSE)
export function getAllEmployees() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
        console.error('❌ Parse error:', e);
        return [];                                       // SAFE: Trả array rỗng
    }
}

//  READ: GET BY ID (THROW nếu KHÔNG TỒN TẠI)
export function getEmployeeById(id) {
    const emp = getAllEmployees().find(e => e.id === id);
    if (!emp) throw new Error(`Employee with id ${id} not found`);
    return emp;
}

// WRITE: SAVE EMPLOYEES (SIZE CHECK + ERROR HANDLING)
export function saveEmployees(employees) {
    try {
        //  SAFETY: Check LocalStorage quota (~5MB)
        const data = JSON.stringify(employees);
        if (data.length > 5 * 1024 * 1024) {             // 5MB limit
            throw new Error('LocalStorage full - Too many employees');
        }
        localStorage.setItem(STORAGE_KEY, data);
        console.log(`✅ Saved ${employees.length} employees`);
    } catch (e) {
        console.error('❌ Save error:', e);
        alert('Lỗi lưu dữ liệu: ' + e.message);
        throw e;                                         // RE-THROW cho caller handle
    }
}

//  CREATE: ADD NEW EMPLOYEE (AUTO ID)
export function addEmployee(employee) {
    const employees = getAllEmployees();
    
    //  AUTO ID: Max(current IDs) + 1
    employee.id = Math.max(...employees.map(e => e.id || 0), 0) + 1;
    
    employees.push(employee);
    saveEmployees(employees);
    console.log(`✅ Added employee ID ${employee.id}: ${employee.name}`);
}

//  UPDATE: MODIFY EXISTING EMPLOYEE
export function updateEmployee(updated) {
    let employees = getAllEmployees();
    const index = employees.findIndex(e => e.id === updated.id);
    
    if (index === -1) throw new Error('Employee not found');
    
    employees[index] = updated;                          // REPLACE toàn bộ object
    saveEmployees(employees);
    console.log(`✅ Updated employee ID ${updated.id}: ${updated.name}`);
}

//  DELETE: REMOVE BY ID
export function deleteEmployee(id) {
    let employees = getAllEmployees();
    const beforeCount = employees.length;
    employees = employees.filter(e => e.id !== id);
    
    if (employees.length === beforeCount) {
        throw new Error(`Employee ID ${id} not found`);
    }
    
    saveEmployees(employees);
    console.log(`✅ Deleted employee ID ${id}`);
}

//  UTILITY FUNCTIONS: FILTER + SORT (HIGHER-ORDER)

// FILTER: Tạo function filter tùy chỉnh
export const filterEmployees = (predicate) => {
    if (typeof predicate !== 'function') {
        throw new Error('Predicate must be function');
    }
    return (employees) => employees.filter(predicate);    // RETURN: Filter function
};

// SORT: Tạo function sort tùy chỉnh  
export const sortEmployees = (comparator) => {
    if (typeof comparator !== 'function') {
        throw new Error('Comparator must be function');
    }
    return (employees) => [...employees].sort(comparator); // RETURN: Sort function
};