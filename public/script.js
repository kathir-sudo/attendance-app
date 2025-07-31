// public/script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURATION & GLOBAL SETUP ---
    const API_URL = 'http://localhost:3000/api';

    // Page Detection: Determines which page is currently active.
    const isManageStudentsPage = document.getElementById('addStudentForm');
    const isIndexPage = document.getElementById('attendanceForm');
    const isHistoryPage = document.getElementById('historyList');
    const isEditPage = document.getElementById('editAttendanceForm');

    // Helper Function: To display success or error messages to the user.
    function showMessage(elementId, message, isSuccess) {
        const msgElement = document.getElementById(elementId);
        if (!msgElement) return;
        msgElement.textContent = message;
        msgElement.className = 'message';
        msgElement.classList.add(isSuccess ? 'success' : 'error');
        // Auto-hide the message after 5 seconds
        setTimeout(() => { if (msgElement) msgElement.style.display = 'none'; }, 5000);
    }

    // --- 2. MANAGE STUDENTS PAGE LOGIC (add-student.html) ---
    if (isManageStudentsPage) {
        // Element References
        const form = document.getElementById('addStudentForm');
        const listDiv = document.getElementById('existingStudentsList');
        const countSpan = document.getElementById('studentCount');
        const searchInput = document.getElementById('studentSearch');
        const bulkAddModal = document.getElementById('bulkAddModal');
        const editStudentModal = document.getElementById('editStudentModal');
        let allStudents = []; // Local cache of students for searching

        // Fetches all students from the API
        async function fetchStudents() {
            try {
                const response = await fetch(`${API_URL}/students`);
                if (!response.ok) throw new Error('Failed to fetch students.');
                allStudents = await response.json();
                renderStudents(allStudents); // Render them to the page
            } catch (err) {
                listDiv.innerHTML = `<p class="message error">${err.message}</p>`;
            }
        }

        // Renders a list of students to the DOM
// In public/script.js, inside if (isManageStudentsPage)

function renderStudents(students) {
    listDiv.innerHTML = `
        <div class="data-list-item data-list-header">
            <div class="student-info">Student</div>
            <span>Actions</span>
        </div>`;

    if (students.length === 0) {
        listDiv.innerHTML += '<p style="text-align:center; padding: 1rem;">No students found.</p>';
    }
    
    // UPDATED: Buttons now use symbols (✎ for pencil,  for trash)
    students.forEach((student) => {
        const item = document.createElement('div');
        item.className = 'data-list-item';
        item.innerHTML = `
            <div class="student-info">
                <strong>${student.rollNumber}</strong>
                <span>${student.name}</span>
            </div>
            <div class="button-group">
                <button class="btn-edit" data-id="${student._id}" title="Edit Student">✎</button>
                <button class="btn-delete" data-id="${student._id}" title="Delete Student"></button>
            </div>`;
        listDiv.appendChild(item);
    });
    
    countSpan.textContent = `Total: ${students.length}`;
}

        // Event Listener: Add a single student
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rollNumber = document.getElementById('rollNumber').value;
            const name = document.getElementById('studentName').value;
            try {
                const res = await fetch(`${API_URL}/students`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rollNumber, name })
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message);
                showMessage('message', `Student added successfully!`, true);
                form.reset();
                fetchStudents();
            } catch (err) {
                showMessage('message', err.message, false);
            }
        });
        
        // Event Listener: Search functionality
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredStudents = allStudents.filter(student =>
                student.name.toLowerCase().includes(searchTerm) ||
                student.rollNumber.toLowerCase().includes(searchTerm)
            );
            renderStudents(filteredStudents);
        });

        // Event Listener (Delegated): Handles Edit and Delete clicks
        listDiv.addEventListener('click', async (e) => {
            const studentId = e.target.dataset.id;
            if (e.target.classList.contains('btn-delete')) {
                if (confirm('Are you sure you want to delete this student?')) {
                    await fetch(`${API_URL}/students/${studentId}`, { method: 'DELETE' });
                    fetchStudents();
                }
            } else if (e.target.classList.contains('btn-edit')) {
                const student = allStudents.find(s => s._id === studentId);
                document.getElementById('editStudentId').value = student._id;
                document.getElementById('editRollNumber').value = student.rollNumber;
                document.getElementById('editStudentName').value = student.name;
                editStudentModal.style.display = 'flex';
            }
        });

        // Modal Control Logic
        document.getElementById('showBulkAddModal').addEventListener('click', () => bulkAddModal.style.display = 'flex');
        document.getElementById('closeBulkAddModal').addEventListener('click', () => bulkAddModal.style.display = 'none');
        document.getElementById('closeEditModal').addEventListener('click', () => editStudentModal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === bulkAddModal) bulkAddModal.style.display = 'none';
            if (e.target === editStudentModal) editStudentModal.style.display = 'none';
        });

        // Event Listener: Bulk Add form submission
        document.getElementById('bulkAddForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const jsonInput = document.getElementById('jsonInput').value;
            let students;
            try {
                students = JSON.parse(jsonInput);
                if (!Array.isArray(students)) throw new Error('Input must be a JSON array.');
            } catch (err) {
                showMessage('bulkAddMessage', 'Invalid JSON format. Please check syntax.', false);
                return;
            }
            try {
                const response = await fetch(`${API_URL}/students/bulk`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ students })
                });
                const result = await response.json();
                if (response.status === 207) { // Partial success
                    showMessage('bulkAddMessage', `${result.message}\nErrors:\n${result.errors}`, false);
                } else if (!response.ok) {
                    throw new Error(result.message);
                } else {
                    showMessage('bulkAddMessage', result.message, true);
                }
                setTimeout(() => {
                    bulkAddModal.style.display = 'none';
                    document.getElementById('jsonInput').value = '';
                    fetchStudents();
                }, 4000);
            } catch (err) {
                showMessage('bulkAddMessage', err.message, false);
            }
        });

        // Event Listener: Edit Student form submission
        document.getElementById('editStudentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editStudentId').value;
            const rollNumber = document.getElementById('editRollNumber').value;
            const name = document.getElementById('editStudentName').value;
            try {
                const res = await fetch(`${API_URL}/students/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rollNumber, name })
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message);
                showMessage('editMessage', 'Student updated!', true);
                setTimeout(() => {
                    editStudentModal.style.display = 'none';
                    fetchStudents();
                }, 1500);
            } catch (err) {
                showMessage('editMessage', err.message, false);
            }
        });
        
        fetchStudents(); // Initial Load
    }
    
    // --- 3. SHARED LOGIC for Attendance Pages (Toggle Button) ---
    if (isIndexPage || isEditPage) {
        const studentListDiv = document.getElementById('studentList');
        // Event Listener (Delegated): Handles the Present/Absent toggle click
        studentListDiv.addEventListener('click', (e) => {
            if (e.target.classList.contains('status-toggle')) {
                const button = e.target;
                const isPresent = button.dataset.status === 'Present';
                // Flip the state
                button.dataset.status = isPresent ? 'Absent' : 'Present';
                button.textContent = isPresent ? 'Absent' : 'Present';
                button.classList.toggle('status-present');
                button.classList.toggle('status-absent');
            }
        });
    }

    // --- 4. TAKE ATTENDANCE PAGE LOGIC (index.html) ---
    if (isIndexPage) {
        const studentListDiv = document.getElementById('studentList');
        const form = document.getElementById('attendanceForm');
        const groupNameInput = document.getElementById('groupName');
        const countSpan = document.getElementById('takeAttendanceCount');

        // Set default date format to DD-MM-YYYY
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        groupNameInput.value = `${dd}-${mm}-${yyyy}`;

        // In public/script.js, inside if (isIndexPage)
// In public/script.js, inside if (isIndexPage)

async function fetchStudentsForAttendance() {
    try {
        const response = await fetch(`${API_URL}/students`);
        const students = await response.json();
        studentListDiv.innerHTML = '';
        if (students.length === 0) {
            studentListDiv.innerHTML = '<p>No students found. Please add students first.</p>';
        }
        students.forEach((student) => {
            const item = document.createElement('div');
            item.className = 'data-list-item student-attendance-item';
            item.dataset.studentId = student._id;
            item.dataset.rollNumber = student.rollNumber;
            item.dataset.studentName = student.name;
            
            // --- The order of these two divs has been swapped back ---
            item.innerHTML = `
                <div class="info">
                   <strong>${student.rollNumber}</strong> - ${student.name}
                </div>
                <div class="status-buttons">
                    <button type="button" class="status-toggle status-absent" data-status="Absent">Absent</button>
                </div>
            `;
            studentListDiv.appendChild(item);
        });
        countSpan.textContent = `Total: ${students.length}`;
    } catch (err) {
        studentListDiv.innerHTML = `<p class="message error">Failed to load students.</p>`;
    }
}

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const records = Array.from(document.querySelectorAll('.student-attendance-item')).map(item => ({
                studentId: item.dataset.studentId,
                rollNumber: item.dataset.rollNumber,
                studentName: item.dataset.studentName,
                status: item.querySelector('.status-toggle').dataset.status
            }));
            try {
                await fetch(`${API_URL}/attendance`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ groupName: groupNameInput.value, records })
                });
                showMessage('attendanceMessage', 'Attendance saved! Redirecting...', true);
                setTimeout(() => window.location.href = 'history.html', 1500);
            } catch (err) {
                showMessage('attendanceMessage', 'Failed to save attendance.', false);
            }
        });

        fetchStudentsForAttendance();
    }
    
    // --- 5. EDIT ATTENDANCE PAGE LOGIC (edit-attendance.html) ---
    if (isEditPage) {
        const form = document.getElementById('editAttendanceForm');
        const studentListDiv = document.getElementById('studentList');
        const groupNameInput = document.getElementById('groupName');
        const recordId = new URLSearchParams(window.location.search).get('id');

        if (!recordId) {
            studentListDiv.innerHTML = `<p class="message error">No record ID provided. <a href="history.html">Go back</a>.</p>`;
            return;
        }

        // In public/script.js, inside if (isEditPage)

// In public/script.js, inside if (isEditPage)

async function loadRecordForEdit() {
    try {
        const response = await fetch(`${API_URL}/attendance/${recordId}`);
        const record = await response.json();
        groupNameInput.value = record.groupName;
        studentListDiv.innerHTML = '';
        record.records.forEach((rec) => {
            const item = document.createElement('div');
            item.className = 'data-list-item student-attendance-item';
            item.dataset.studentId = rec.studentId;
            item.dataset.rollNumber = rec.rollNumber;
            item.dataset.studentName = rec.studentName;
            
            const isPresent = rec.status === 'Present';
            const statusClass = isPresent ? 'status-present' : 'status-absent';
            const statusText = isPresent ? 'Present' : 'Absent';
            
            // --- The order of these two divs has been swapped back ---
            item.innerHTML = `
                <div class="info">
                   <strong>${rec.rollNumber}</strong> - ${rec.studentName}
                </div>
                <div class="status-buttons">
                   <button type="button" class="status-toggle ${statusClass}" data-status="${statusText}">${statusText}</button>
                </div>
            `;
            studentListDiv.appendChild(item);
        });
    } catch (err) {
         studentListDiv.innerHTML = `<p class="message error">Failed to load record.</p>`;
    }
}   
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const records = Array.from(document.querySelectorAll('.student-attendance-item')).map(item => ({
                studentId: item.dataset.studentId,
                rollNumber: item.dataset.rollNumber,
                studentName: item.dataset.studentName,
                status: item.querySelector('.status-toggle').dataset.status
            }));
            try {
                await fetch(`${API_URL}/attendance/${recordId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ groupName: groupNameInput.value, records })
                });
                showMessage('editMessage', 'Update successful! Redirecting...', true);
                setTimeout(() => window.location.href = 'history.html', 1500);
            } catch (err) {
                showMessage('editMessage', 'Update failed.', false);
            }
        });

        loadRecordForEdit();
    }
    
    // --- 6. HISTORY PAGE LOGIC (history.html) ---
    if (isHistoryPage) {
        const historyListDiv = document.getElementById('historyList');
        const detailDiv = document.getElementById('recordDetail');
        const countSpan = document.getElementById('historyCount');

        // Event Listener: Handles toggling Present/Absent lists
        detailDiv.addEventListener('click', (e) => {
            if (e.target.classList.contains('toggle-vis')) {
                const button = e.target;
                const listContainer = (button.id === 'togglePresentList')
                    ? document.getElementById('presentListContainer')
                    : document.getElementById('absentListContainer');
                const isNowCollapsed = listContainer.classList.toggle('list-collapsed');
                button.textContent = isNowCollapsed ? '[+]' : '[-]';
                button.setAttribute('aria-expanded', !isNowCollapsed);
            }
        });
    
        // Event Listener: Handles toggling the main history list
        document.getElementById('toggleHistoryList').addEventListener('click', (e) => {
            const button = e.target;
            const listContainer = document.getElementById('historyListContainer');
            const isNowCollapsed = listContainer.classList.toggle('list-collapsed');
            button.textContent = isNowCollapsed ? '[+]' : '[-]';
            button.setAttribute('aria-expanded', !isNowCollapsed);
        });
    
// In public/script.js, inside if (isHistoryPage)

async function fetchAndDisplayRecordDetails(recordId) {
    try {
        const response = await fetch(`${API_URL}/attendance/${recordId}`);
        if (!response.ok) throw new Error('Could not fetch record details');
        const record = await response.json();

        document.getElementById('detailGroupName').textContent = record.groupName;
        const presentStudents = record.records.filter(r => r.status === 'Present');
        const absentStudents = record.records.filter(r => r.status === 'Absent');

        document.getElementById('presentCount').textContent = presentStudents.length;
        document.getElementById('absentCount').textContent = absentStudents.length;

        // UPDATED: Generate list items with the new single-line layout
        document.getElementById('presentList').innerHTML = presentStudents.map((r, i) => `
            <li>
                <span class="s-no">${i + 1}.</span>
                <div class="student-info">
                    <strong>${r.rollNumber}</strong>
                    <span>${r.studentName}</span>
                </div>
            </li>
        `).join('');

        document.getElementById('absentList').innerHTML = absentStudents.map((r, i) => `
            <li>
                <span class="s-no">${i + 1}.</span>
                <div class="student-info">
                    <strong>${r.rollNumber}</strong>
                    <span>${r.studentName}</span>
                </div>
            </li>
        `).join('');
        
        detailDiv.style.display = 'block';
        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.toggle('active', item.dataset.recordId === recordId);
        });
        
        // Reset toggle states (this logic is unchanged)
        document.getElementById('presentListContainer').classList.remove('list-collapsed');
        document.getElementById('togglePresentList').textContent = '[-]';
        document.getElementById('togglePresentList').setAttribute('aria-expanded', 'true');
        document.getElementById('absentListContainer').classList.add('list-collapsed');
        document.getElementById('toggleAbsentList').textContent = '[+]';
        document.getElementById('toggleAbsentList').setAttribute('aria-expanded', 'false');

    } catch (error) {
        alert(error.message);
    }
}
// In public/script.js, inside if (isHistoryPage)

async function fetchHistory() {
    try {
        const response = await fetch(`${API_URL}/attendance`);
        const records = await response.json();
        historyListDiv.innerHTML = '';
        if (records.length === 0) {
            historyListDiv.innerHTML = '<p style="text-align:center; padding: 1rem;">No history found.</p>';
        }
        // UPDATED: Buttons now use symbols
        records.forEach((record, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.dataset.recordId = record._id;
            item.innerHTML = `
                <div>
                    <strong>${index + 1}. ${record.groupName}</strong>
                    <br><small>${new Date(record.date).toLocaleString()}</small>
                </div>
                <div class="button-group">
                    <button class="btn-edit" data-id="${record._id}" title="Edit Record">✎</button>
                    <button class="btn-delete" data-id="${record._id}" title="Delete Record"></button>
                </div>
            `;
            historyListDiv.appendChild(item);
        });
        countSpan.textContent = `Total: ${records.length}`;
    } catch (err) {
        historyListDiv.innerHTML = `<p class="message error">Failed to load history.</p>`;
    }
}
    
        // Event Listener (Delegated): Handles clicks on history items, edit, and delete
        historyListDiv.addEventListener('click', async (e) => {
            const targetElement = e.target;
            const historyItem = targetElement.closest('.history-item');
            if (!historyItem) return;
            
            const recordId = historyItem.dataset.recordId;
    
            if (targetElement.classList.contains('btn-delete')) {
                if (confirm('Are you sure you want to delete this record?')) {
                    await fetch(`${API_URL}/attendance/${recordId}`, { method: 'DELETE' });
                    fetchHistory();
                    detailDiv.style.display = 'none';
                }
            } else if (targetElement.classList.contains('btn-edit')) {
                window.location.href = `edit-attendance.html?id=${recordId}`;
            } else {
                fetchAndDisplayRecordDetails(recordId);
            }
        });
        
        fetchHistory(); // Initial Load
    }
});