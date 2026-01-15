// --- 1. ປະກາດຕົວແປຫຼັກ ---
let myChart = null;
let records = JSON.parse(localStorage.getItem('myFinanceData')) || [];
let currentPage = 1;
const rowsPerPage = 5;
let editId = null;
let searchTerm = "";
let selectedMonth = "all";

// --- 2. ຟັງຊັນກາຟ (Chart) ---
function updateChart(income, expense, profit) {
    const canvas = document.getElementById('myChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (myChart) { myChart.destroy(); }

    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['ລາຍຮັບລວມ', 'ລາຍຈ່າຍລວມ', 'ກຳໄລລວມ'],
            datasets: [{
                data: [income, expense, profit > 0 ? profit : 0],
                backgroundColor: ['#4caf50', '#f44336', '#2196f3'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // ຊ່ວຍໃຫ້ກາຟບໍ່ໃຫຍ່ເກີນໄປ
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { family: 'Noto Sans Lao' } }
                }
            }
        }
    });
}

// --- 3. ຟັງຊັນຈັດການຂໍ້ມູນ (Add / Edit) ---
function addData() {
    const name = document.getElementById('item-name').value;
    const qty = parseInt(document.getElementById('item-qty').value) || 1;
    const costPerUnit = parseFloat(document.getElementById('cost-price').value);
    const sellPerUnit = parseFloat(document.getElementById('sell-price').value);

    if (!name || isNaN(costPerUnit) || isNaN(sellPerUnit)) {
        alert("ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບຖ້ວນ");
        return;
    }

    const totalCost = costPerUnit * qty;
    const totalSell = sellPerUnit * qty;
    const totalProfit = totalSell - totalCost;

    if (editId) {
        const index = records.findIndex(r => r.id === editId);
        records[index] = { ...records[index], name, qty, cost: totalCost, sell: totalSell, profit: totalProfit };
        editId = null;
        document.getElementById('edit-notice').style.display = 'none';
        document.querySelector('.btn-add').innerText = 'ບັນທຶກ';
    } else {
        records.push({
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            name, qty, cost: totalCost, sell: totalSell, profit: totalProfit
        });
    }

    saveAndRender();
    clearInputs();
}

function editData(id) {
    const item = records.find(r => r.id === id);
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-qty').value = item.qty || 1;
    document.getElementById('cost-price').value = item.cost / (item.qty || 1);
    document.getElementById('sell-price').value = item.sell / (item.qty || 1);

    editId = id;
    const notice = document.getElementById('edit-notice');
    if (notice) {
        notice.innerHTML = `⚠️ <strong>ກຳລັງແກ້ໄຂ: ${item.name}</strong>`;
        notice.style.display = 'block';
    }
    document.querySelector('.btn-add').innerText = 'ຢືນຢັນການແກ້ໄຂ';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteData(id) {
    if (confirm('ທ່ານຕ້ອງການລຶບລາຍການນີ້ແທ້ບໍ່?')) {
        records = records.filter(r => r.id !== id);
        saveAndRender();
    }
}

// --- 4. Search & Filter ---
function searchData() {
    searchTerm = document.getElementById('search-input').value.toLowerCase();
    currentPage = 1;
    renderTable();
}

function clearSearch() {
    document.getElementById('search-input').value = "";
    searchTerm = "";
    renderTable();
}

function filterByMonth() {
    selectedMonth = document.getElementById('month-filter').value;
    currentPage = 1;
    saveAndRender();
}

// --- 5. Render & Summary ---
function saveAndRender() {
    localStorage.setItem('myFinanceData', JSON.stringify(records));
    renderTable();
    calculateSummary();
}

function renderTable() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    let filtered = records.filter(r => {
        const recordMonth = parseInt(r.date.split('/')[1]);
        const matchesSearch = r.name.toLowerCase().includes(searchTerm);
        const matchesMonth = (selectedMonth === "all") || (recordMonth === parseInt(selectedMonth));
        return matchesSearch && matchesMonth;
    });

    let start = (currentPage - 1) * rowsPerPage;
    let paginatedItems = filtered.slice().reverse().slice(start, start + rowsPerPage);

    paginatedItems.forEach(r => {
        tbody.innerHTML += `
            <tr>
                <td>${r.date}</td>
                <td>${r.name}</td>
                <td>${r.qty || 1}</td>
                <td>${r.cost.toLocaleString()} ₭</td>
                <td>${r.sell.toLocaleString()} ₭</td>
                <td style="color: ${r.profit >= 0 ? 'green' : 'red'}">${r.profit.toLocaleString()} ₭</td>
                <td>
                    <button onclick="editData(${r.id})" class="btn-edit">ແກ້ໄຂ</button>
                    <button onclick="deleteData(${r.id})" class="btn-delete">ລຶບ</button>
                </td>
            </tr>
        `;
    });
    renderPagination(filtered.length);
}

function renderPagination(totalItems) {
    const pagination = document.getElementById('pagination');
    const pageCount = Math.ceil(totalItems / rowsPerPage);
    pagination.innerHTML = '';
    for (let i = 1; i <= pageCount; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        if (i === currentPage) btn.classList.add('active');
        btn.onclick = () => { currentPage = i; renderTable(); };
        pagination.appendChild(btn);
    }
}

function calculateSummary() {
    let filtered = records.filter(r => {
        const recordMonth = parseInt(r.date.split('/')[1]);
        return (selectedMonth === "all") || (recordMonth === parseInt(selectedMonth));
    });

    let income = filtered.reduce((sum, r) => sum + r.sell, 0);
    let cost = filtered.reduce((sum, r) => sum + r.cost, 0);
    let profit = income - cost;

    // ເພີ່ມ + " ₭" ໃສ່ທາງທ້າຍຂອງແຕ່ລະບັນທັດ
    document.getElementById('total-income').innerText = income.toLocaleString() + " ₭";
    document.getElementById('total-expense').innerText = cost.toLocaleString() + " ₭";
    document.getElementById('total-profit').innerText = profit.toLocaleString() + " ₭";

    updateChart(income, cost, profit);
}

function clearInputs() {
    document.getElementById('item-name').value = '';
    document.getElementById('item-qty').value = '1';
    document.getElementById('cost-price').value = '';
    document.getElementById('sell-price').value = '';
}






// ເລີ່ມຕົ້ນເຮັດວຽກ
saveAndRender();