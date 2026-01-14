// RATING 1-5 + FEEDBACK + AVERAGE + TOP PERFORMERS + STARS UI

import * as EmployeeDb from './employeeDbModule.js';      //  Employee lookup

const STORAGE_KEY = 'reviews';                           //  Reviews storage

//  REVIEW STORAGE: CRUD OPERATIONS
function getReviews() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveReviews(reviews) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

//  ADD REVIEW: VALIDATE + AUTO DATE
export function addReview(employeeId, rating, feedback) {
    //  VALIDATE: Employee exists
    EmployeeDb.getEmployeeById(employeeId);
    
    //  VALIDATE: Rating 1-5
    if (rating < 1 || rating > 5) {
        throw new Error('Điểm đánh giá phải từ 1 đến 5');
    }
    
    //  VALIDATE: Feedback không rỗng
    if (feedback.trim() === '') {
        throw new Error('Phản hồi không được để trống');
    }
    
    const reviews = getReviews();
    const review = { 
        id: Math.max(...reviews.map(r => r.id || 0), 0) + 1,
        employeeId, 
        date: new Date().toISOString().split('T')[0],  // TODAY: 2025-10-20
        rating: parseInt(rating),
        feedback: feedback.trim()
    };
    
    reviews.push(review);
    saveReviews(reviews);
    console.log(`✅ Added review ID ${review.id} for emp ${employeeId}: ${rating}/5`);
}

//  AVERAGE RATING: PER EMPLOYEE
export function getAverageRating(employeeId) {
    const reviews = getReviews().filter(r => r.employeeId === employeeId);
    if (reviews.length === 0) return 0;
    return (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(2);
}

//  TOP PERFORMERS: SORT BY AVERAGE RATING
function getTopPerformers() {
    const employees = EmployeeDb.getAllEmployees();
    return employees
        .map(emp => ({ 
            ...emp, 
            avg: parseFloat(getAverageRating(emp.id)),
            reviewCount: getReviews().filter(r => r.employeeId === emp.id).length
        }))
        .sort((a, b) => b.avg - a.avg);                  // DESC: High → Low
}

//  STAR RATING UI: VISUAL 1-5 STARS
function renderStars(rating) {
    return Array(5).fill('⭐').map((star, i) => 
        i < rating ? '<span class="star filled">★</span>' : '<span class="star">☆</span>'
    ).join('');
}

//  DISPLAY REPORT: TOP PERFORMERS TABLE + STARS
function displayReport(container) {
    const reportDiv = document.createElement('div');
    reportDiv.innerHTML = '<h3>🏆 Top Performers (Xếp hạng)</h3>';
    
    const tops = getTopPerformers();
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Xếp hạng</th>
                <th>ID</th>
                <th>Tên NV</th>
                <th>Điểm TB</th>
                <th>Stars</th>
                <th>Số ĐG</th>
                <th>Phòng ban</th>
            </tr>
        </thead>
        <tbody>
            ${tops.length > 0 ? 
                tops.map((t, index) => {
                    const dept = EmployeeDb.getAllEmployees()
                        .find(e => e.id === t.id).departmentId;
                    const deptName = /* lookup dept name */ t.departmentId || 'N/A';
                    return `
                        <tr ${index < 3 ? 'class="top-3"' : ''}>
                            <td><strong>${index + 1}</strong></td>
                            <td>${t.id}</td>
                            <td>${t.name}</td>
                            <td><strong>${t.avg}</strong></td>
                            <td>${renderStars(Math.round(t.avg))}</td>
                            <td>${t.reviewCount}</td>
                            <td>${deptName}</td>
                        </tr>
                    `;
                }).join('') : 
                '<tr><td colspan="7" style="text-align:center;color:#999;">Chưa có đánh giá nào</td></tr>'
            }
        </tbody>
    `;
    
    reportDiv.appendChild(table);
    container.appendChild(reportDiv);
    console.log(`✅ Displayed Top ${tops.length} performers`);
}

//  INIT: TABLE FIRST + FORM SECOND + REALTIME STARS
export function init(container) {
    console.log('📊 Performance module initializing...');
    
    //  CLEAR: Container sạch
    container.innerHTML = '<h2>📊 Đánh giá Hiệu suất</h2>';
    
    //  1. TABLE TRƯỚC
    displayReport(container);
    
    //  2. FORM SAU
    const form = document.createElement('form');
    form.innerHTML = `
        <h3>➕ Thêm Đánh giá Mới</h3>
        <div class="form-row">
            <input type="number" id="empId" placeholder="ID Nhân viên" required>
            <input type="number" id="rating" placeholder="Điểm (1-5)" min="1" max="5" required>
        </div>
        <input type="text" id="feedback" placeholder="Phản hồi chi tiết..." required>
        <div class="stars-preview" id="starsPreview"></div>
        <button type="submit">⭐ Thêm Đánh giá</button>
    `;
    container.appendChild(form);
    
    //  REALTIME STARS PREVIEW
    const ratingInput = form.querySelector('#rating');
    const starsPreview = form.querySelector('#starsPreview');
    ratingInput.addEventListener('input', () => {
        const rating = parseInt(ratingInput.value) || 0;
        starsPreview.innerHTML = renderStars(rating);
    });
    
    //  SUBMIT
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            const id = parseInt(document.getElementById('empId').value);
            const rating = parseInt(document.getElementById('rating').value);
            const feedback = document.getElementById('feedback').value;
            
            addReview(id, rating, feedback);
            alert(`✅ Thêm thành công! Điểm: ${rating}/5 ⭐`);
            form.reset();
            starsPreview.innerHTML = '';                 // CLEAR PREVIEW
            init(container);                             //  REFRESH TABLE
        } catch (e) {
            alert('❌ ' + e.message);
        }
    });
    
    console.log('✅ Performance module loaded');
}