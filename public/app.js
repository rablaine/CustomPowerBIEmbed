// Configuration
const API_BASE_URL = window.location.origin;

// State
let currentChart = null;
let currentData = null;

// DOM Elements
const userQuery = document.getElementById('userQuery');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');
const statusMessage = document.getElementById('statusMessage');
const resultsSection = document.getElementById('resultsSection');
const chartTitle = document.getElementById('chartTitle');
const dataChart = document.getElementById('dataChart');
const chartTypeSelector = document.getElementById('chartType');
const downloadBtn = document.getElementById('downloadBtn');
const queryDetails = document.getElementById('queryDetails');
const dataPreview = document.getElementById('dataPreview');

// Event Listeners
submitBtn.addEventListener('click', handleSubmit);
userQuery.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        handleSubmit();
    }
});

// Suggestion chips
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        userQuery.value = chip.textContent;
        handleSubmit();
    });
});

chartTypeSelector.addEventListener('change', () => {
    if (currentData) {
        renderChart(currentData, chartTypeSelector.value);
    }
});

downloadBtn.addEventListener('click', downloadData);

// Main submit handler
async function handleSubmit() {
    const query = userQuery.value.trim();
    
    if (!query) {
        showStatus('Please enter a query', 'error');
        return;
    }

    setLoading(true);
    hideStatus();
    hideResults();

    try {
        showStatus('Processing your request with AI...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/api/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to process query');
        }

        const result = await response.json();
        currentData = result;
        
        showStatus('Visualization generated successfully!', 'success');
        displayResults(result);
        
    } catch (error) {
        console.error('Error:', error);
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        setLoading(false);
    }
}

// Display results
function displayResults(data) {
    // Set title with data source indicator
    const dataSourceBadge = data.isMockData 
        ? '<span style="background: #ff9800; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; margin-left: 10px; font-weight: normal;">⚠ Mock Data</span>'
        : '<span style="background: #107c10; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; margin-left: 10px; font-weight: normal;">✓ Live Fabric</span>';
    
    chartTitle.innerHTML = `${data.title || 'Data Visualization'} ${dataSourceBadge}`;
    
    // Show query details with data source
    queryDetails.innerHTML = `
        <div><strong>Data Source:</strong> <span style="color: ${data.isMockData ? '#ff9800' : '#107c10'}; font-weight: 600;">${data.dataSource || 'Unknown'}</span></div>
        <div><strong>Original Query:</strong> ${data.originalQuery}</div>
        <div><strong>Generated DAX:</strong> <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">${data.daxQuery || data.sqlQuery || 'N/A'}</pre></div>
        <div><strong>Interpretation:</strong> ${data.interpretation || 'Data retrieved successfully'}</div>
    `;
    
    // Show AI debug information
    const aiDebug = document.getElementById('aiDebug');
    if (data.debug && (data.debug.parseQuery || data.debug.interpretation)) {
        let debugHtml = '';
        
        if (data.debug.parseQuery) {
            debugHtml += '<h4>Query Parse Request</h4>';
            debugHtml += `<div style="margin-bottom: 10px;"><strong>System:</strong> ${data.debug.parseQuery.systemMessage}</div>`;
            debugHtml += `<div><strong>Prompt:</strong></div><pre>${escapeHtml(data.debug.parseQuery.userPrompt)}</pre>`;
            debugHtml += '<h4>Query Parse Response</h4>';
            debugHtml += `<pre>${JSON.stringify(data.debug.parseQuery.fullResponse, null, 2)}</pre>`;
        }
        
        if (data.debug.interpretation) {
            debugHtml += '<h4>Interpretation Request</h4>';
            debugHtml += `<div style="margin-bottom: 10px;"><strong>System:</strong> ${data.debug.interpretation.systemMessage}</div>`;
            debugHtml += `<div><strong>Prompt:</strong></div><pre>${escapeHtml(data.debug.interpretation.userPrompt)}</pre>`;
            debugHtml += '<h4>Interpretation Response</h4>';
            debugHtml += `<pre>${JSON.stringify(data.debug.interpretation.fullResponse, null, 2)}</pre>`;
        }
        
        aiDebug.innerHTML = debugHtml;
    }
    
    // Render chart
    const chartType = data.suggestedChartType || 'bar';
    chartTypeSelector.value = chartType;
    renderChart(data, chartType);
    
    // Update chart container styling based on data source
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.classList.remove('mock-data', 'live-data');
    chartContainer.classList.add(data.isMockData ? 'mock-data' : 'live-data');
    
    // Show data preview table
    renderDataTable(data.data);
    
    // Show results section
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Render chart using Chart.js
function renderChart(data, type) {
    if (currentChart) {
        currentChart.destroy();
    }

    const ctx = dataChart.getContext('2d');
    const chartData = prepareChartData(data.data, type);
    
    currentChart = new Chart(ctx, {
        type: type,
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: type === 'pie' || type === 'doughnut',
                    position: 'bottom'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: type !== 'pie' && type !== 'doughnut' && type !== 'radar' ? {
                y: {
                    beginAtZero: true
                }
            } : {}
        }
    });
}

// Prepare data for Chart.js
function prepareChartData(rawData, type) {
    if (!rawData || rawData.length === 0) {
        return { labels: [], datasets: [] };
    }

    const keys = Object.keys(rawData[0]);
    const labelKey = keys[0]; // First column as labels
    const dataKeys = keys.slice(1); // Rest as data series

    const labels = rawData.map(row => row[labelKey]);
    
    // Generate colors
    const colors = generateColors(type === 'pie' || type === 'doughnut' ? labels.length : dataKeys.length);
    
    if (type === 'pie' || type === 'doughnut') {
        // For pie/doughnut, use first data column
        return {
            labels: labels,
            datasets: [{
                label: dataKeys[0] || 'Value',
                data: rawData.map(row => row[dataKeys[0]]),
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.7', '1')),
                borderWidth: 1
            }]
        };
    } else {
        // For other charts, multiple datasets
        const datasets = dataKeys.map((key, index) => ({
            label: key,
            data: rawData.map(row => row[key]),
            backgroundColor: colors[index % colors.length],
            borderColor: colors[index % colors.length].replace('0.7', '1'),
            borderWidth: 2,
            fill: type === 'line' ? false : true
        }));

        return { labels, datasets };
    }
}

// Generate color palette
function generateColors(count) {
    const baseColors = [
        'rgba(0, 120, 212, 0.7)',   // Blue
        'rgba(16, 124, 16, 0.7)',   // Green
        'rgba(209, 52, 56, 0.7)',   // Red
        'rgba(255, 185, 0, 0.7)',   // Yellow
        'rgba(118, 118, 118, 0.7)', // Gray
        'rgba(0, 183, 195, 0.7)',   // Cyan
        'rgba(136, 23, 152, 0.7)',  // Purple
        'rgba(255, 140, 0, 0.7)',   // Orange
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
}

// Render data table
function renderDataTable(data) {
    if (!data || data.length === 0) {
        dataPreview.innerHTML = '<p>No data available</p>';
        return;
    }

    const keys = Object.keys(data[0]);
    
    let tableHTML = '<table><thead><tr>';
    keys.forEach(key => {
        tableHTML += `<th>${key}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    
    data.forEach(row => {
        tableHTML += '<tr>';
        keys.forEach(key => {
            const value = row[key];
            const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
            tableHTML += `<td>${displayValue}</td>`;
        });
        tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    dataPreview.innerHTML = tableHTML;
}

// Download data as CSV
function downloadData() {
    if (!currentData || !currentData.data) return;
    
    const data = currentData.data;
    const keys = Object.keys(data[0]);
    
    // Create CSV content
    let csv = keys.join(',') + '\n';
    data.forEach(row => {
        const values = keys.map(key => {
            const value = row[key];
            // Escape quotes and wrap in quotes if contains comma
            const stringValue = String(value);
            return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
        });
        csv += values.join(',') + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Escape HTML for display
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// UI Helper Functions
function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    if (isLoading) {
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
    } else {
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
    }
}

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.classList.remove('hidden');
}

function hideStatus() {
    statusMessage.classList.add('hidden');
}

function hideResults() {
    resultsSection.classList.add('hidden');
}
