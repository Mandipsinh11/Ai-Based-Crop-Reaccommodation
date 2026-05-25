document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('pricing-form');
    const resetBtn = document.getElementById('pricing-reset-btn');
    const saveBtn = document.getElementById('pricing-save-btn');
    const downloadBtn = document.getElementById('pricing-download-btn');
    const historyTableBody = document.querySelector('#pricing-history-table tbody');
    
    // Inputs
    const cropInput = document.getElementById('pricing-crop');
    const areaInput = document.getElementById('pricing-area');
    const yieldInput = document.getElementById('pricing-yield');
    const priceInput = document.getElementById('pricing-price');
    const costSeed = document.getElementById('cost-seed');
    const costFertilizer = document.getElementById('cost-fertilizer');
    const costLabor = document.getElementById('cost-labor');
    const costIrrigation = document.getElementById('cost-irrigation');
    const costTransport = document.getElementById('cost-transport');
    const costOther = document.getElementById('cost-other');

    // Results
    const resRevenue = document.getElementById('res-revenue');
    const resCost = document.getElementById('res-cost');
    const resProfit = document.getElementById('res-profit');
    const resRoi = document.getElementById('res-roi');
    const resCrop = document.getElementById('res-crop');
    const resYield = document.getElementById('res-yield');
    const resMargin = document.getElementById('res-margin');
    const resBreakeven = document.getElementById('res-breakeven');
    
    // Chart Elements
    const barRevenue = document.getElementById('bar-revenue');
    const valRevenue = document.getElementById('val-revenue');
    const barCost = document.getElementById('bar-cost');
    const valCost = document.getElementById('val-cost');
    const profitStatusBadge = document.getElementById('profit-status-badge');

    // Local Storage Key
    const STORAGE_KEY = 'pricing_profit_history';

    // Format Currency
    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    
    // Load History on Init
    loadHistory();

    // Listen for custom event from prediction logic
    document.addEventListener('cropPredicted', (e) => {
        if(e.detail && e.detail.crop) {
            if(cropInput) {
                cropInput.value = e.detail.crop;
                // Flash effect to draw attention
                cropInput.style.transition = 'background-color 0.3s ease';
                cropInput.style.backgroundColor = '#D1FAE5';
                setTimeout(() => {
                    cropInput.style.backgroundColor = '';
                }, 1000);
            }
        }
    });

    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            calculateProfit();
        });
    }

    if(resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            resetResults();
        });
    }

    if(saveBtn) {
        saveBtn.addEventListener('click', () => {
            if(resProfit.innerText === '₹0' && valRevenue.innerText === '₹0') {
                alert("Please calculate the profit before saving.");
                return;
            }
            saveCurrentAnalysis();
        });
    }

    if(downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            window.print();
        });
    }

    let lastCalculatedData = null;

    function calculateProfit() {
        const crop = cropInput.value || 'Unknown Crop';
        const area = parseFloat(areaInput.value) || 0;
        const yieldPerAcre = parseFloat(yieldInput.value) || 0;
        const pricePerKg = parseFloat(priceInput.value) || 0;

        const seed = parseFloat(costSeed.value) || 0;
        const fert = parseFloat(costFertilizer.value) || 0;
        const labor = parseFloat(costLabor.value) || 0;
        const irrig = parseFloat(costIrrigation.value) || 0;
        const trans = parseFloat(costTransport.value) || 0;
        const other = parseFloat(costOther.value) || 0;

        // Calculations
        const totalYield = area * yieldPerAcre;
        const totalRevenue = totalYield * pricePerKg;
        const totalCost = seed + fert + labor + irrig + trans + other;
        const netProfit = totalRevenue - totalCost;
        
        let profitMargin = 0;
        if(totalRevenue > 0) {
            profitMargin = (netProfit / totalRevenue) * 100;
        }

        let breakEven = 0;
        if(totalYield > 0) {
            breakEven = totalCost / totalYield;
        }

        let roi = 0;
        if(totalCost > 0) {
            roi = (netProfit / totalCost) * 100;
        }

        lastCalculatedData = {
            date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            crop,
            area,
            totalYield,
            totalRevenue,
            totalCost,
            netProfit,
            roi,
            profitMargin
        };

        updateUI(lastCalculatedData, breakEven);
    }

    function updateUI(data, breakEven) {
        // Update KPIs
        resRevenue.innerText = formatCurrency(data.totalRevenue);
        resCost.innerText = formatCurrency(data.totalCost);
        resProfit.innerText = formatCurrency(data.netProfit);
        resRoi.innerText = data.roi.toFixed(1) + '%';

        // Update Details
        resCrop.innerText = data.crop;
        resYield.innerText = `${data.totalYield.toLocaleString('en-IN')} kg`;
        resMargin.innerText = data.profitMargin.toFixed(1) + '%';
        resBreakeven.innerText = formatCurrency(breakEven) + ' / kg';

        // Update Colors & Status
        let statusText = "Loss";
        let statusColor = "var(--danger)";
        let statusBg = "#FEF2F2";
        
        resProfit.className = 'mt-8';
        resRoi.className = 'mt-8';
        resProfit.style.color = '';

        if(data.netProfit > 0) {
            if(data.profitMargin > 40) {
                statusText = "Highly Profitable";
                statusColor = "var(--success)";
                statusBg = "var(--success-light)";
            } else if(data.profitMargin > 15) {
                statusText = "Moderately Profitable";
                statusColor = "#10B981";
                statusBg = "#D1FAE5";
            } else {
                statusText = "Low Profit";
                statusColor = "var(--warning)";
                statusBg = "var(--warning-light)";
            }
            resProfit.classList.add('text-success');
            resRoi.classList.add('text-info');
        } else {
            resProfit.classList.add('text-danger');
            resRoi.classList.add('text-danger');
            resProfit.style.color = 'var(--danger)'; // fallback
        }

        profitStatusBadge.innerText = statusText;
        profitStatusBadge.style.backgroundColor = statusBg;
        profitStatusBadge.style.color = statusColor;

        // Update Chart
        const maxVal = Math.max(data.totalRevenue, data.totalCost);
        if(maxVal > 0) {
            const revPct = (data.totalRevenue / maxVal) * 100;
            const costPct = (data.totalCost / maxVal) * 100;
            
            barRevenue.style.width = `${revPct}%`;
            barCost.style.width = `${costPct}%`;
        } else {
            barRevenue.style.width = `0%`;
            barCost.style.width = `0%`;
        }
        
        valRevenue.innerText = formatCurrency(data.totalRevenue);
        valCost.innerText = formatCurrency(data.totalCost);
    }

    function resetResults() {
        resRevenue.innerText = '₹0';
        resCost.innerText = '₹0';
        resProfit.innerText = '₹0';
        resRoi.innerText = '0%';
        resCrop.innerText = '-';
        resYield.innerText = '0 kg';
        resMargin.innerText = '0%';
        resBreakeven.innerText = '₹0 / kg';
        
        barRevenue.style.width = '0%';
        barCost.style.width = '0%';
        valRevenue.innerText = '₹0';
        valCost.innerText = '₹0';

        profitStatusBadge.innerText = 'Awaiting Calculation';
        profitStatusBadge.style.backgroundColor = 'var(--bg-color)';
        profitStatusBadge.style.color = 'var(--text-muted)';
        
        resProfit.className = 'text-success mt-8';
        resRoi.className = 'text-info mt-8';
        resProfit.style.color = '';
        
        lastCalculatedData = null;
    }

    function saveCurrentAnalysis() {
        if(!lastCalculatedData) return;

        let history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        // Add ID for deletion
        const record = { ...lastCalculatedData, id: Date.now() };
        history.unshift(record); // Add to beginning
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        
        loadHistory();
        alert("Analysis saved successfully!");
    }

    function loadHistory() {
        let history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        
        if(!historyTableBody) return;

        if(history.length === 0) {
            historyTableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted" style="padding: 24px;">No saved analyses yet.</td></tr>`;
            return;
        }

        historyTableBody.innerHTML = '';
        
        history.forEach(item => {
            const tr = document.createElement('tr');
            
            let statusHtml = '';
            if(item.netProfit > 0) {
                statusHtml = `<span class="status-badge success" style="background:#D1FAE5; color:#10B981;">Profit</span>`;
            } else {
                statusHtml = `<span class="status-badge" style="background:#FEF2F2; color:#EF4444;">Loss</span>`;
            }

            tr.innerHTML = `
                <td>${item.date}</td>
                <td><strong>${item.crop}</strong></td>
                <td>${item.area}</td>
                <td>${formatCurrency(item.totalRevenue)}</td>
                <td>${formatCurrency(item.totalCost)}</td>
                <td style="color: ${item.netProfit > 0 ? 'var(--success)' : 'var(--danger)'}"><strong>${formatCurrency(item.netProfit)}</strong></td>
                <td>${item.roi.toFixed(1)}%</td>
                <td>${statusHtml}</td>
                <td>
                    <button class="btn btn-outline btn-sm delete-btn" data-id="${item.id}" style="border:none; padding:4px;"><i class="ph ph-trash text-danger" style="font-size:18px;"></i></button>
                </td>
            `;
            historyTableBody.appendChild(tr);
        });

        // Add delete listeners
        const deleteBtns = historyTableBody.querySelectorAll('.delete-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                deleteRecord(id);
            });
        });
    }

    function deleteRecord(id) {
        if(confirm('Are you sure you want to delete this record?')) {
            let history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
            history = history.filter(item => item.id.toString() !== id.toString());
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
            loadHistory();
        }
    }
});
