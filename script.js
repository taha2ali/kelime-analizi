// ===== Global Variables =====
let currentData = null;
let charts = {
    topWords: null,
    letterDistribution: null,
    letterStats: null
};

// Pagination variables
let currentPage = 1;
let itemsPerPage = 100;
let filteredWords = [];
let totalPages = 1;

// Zoom variables
let currentZoom = null;
let currentSvg = null;

// ===== Input Method Switching =====
function switchInputMethod(method) {
    const fileMethod = document.getElementById('fileMethod');
    const textMethod = document.getElementById('textMethod');
    const fileBtn = document.getElementById('fileMethodBtn');
    const textBtn = document.getElementById('textMethodBtn');
    
    if (method === 'file') {
        fileMethod.style.display = 'block';
        textMethod.style.display = 'none';
        fileBtn.classList.add('active');
        textBtn.classList.remove('active');
    } else {
        fileMethod.style.display = 'none';
        textMethod.style.display = 'block';
        fileBtn.classList.remove('active');
        textBtn.classList.add('active');
    }
}

// ===== Clear Text Input =====
function clearTextInput() {
    document.getElementById('textInput').value = '';
}

// ===== Analyze Text =====
function analyzeText() {
    const textInput = document.getElementById('textInput');
    const text = textInput.value.trim();
    
    // Validate
    if (!text) {
        showToast('Lütfen metin girin!', 'error');
        return;
    }
    
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 10) {
        showToast('En az 10 kelime girmelisiniz!', 'error');
        return;
    }
    
    // Show loading
    showLoading(true);
    
    // Create a blob and send as file
    const blob = new Blob([text], { type: 'text/plain' });
    const file = new File([blob], 'text_input.txt', { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }
        
        // Store data
        currentData = data;
        
        // Update UI
        updateStatistics(data.statistics);
        updateWordsTable(data.words);
        updateHeapVisualization(data.heap_structure);
        updateCharts();
        
        showToast('Metin başarıyla analiz edildi!', 'success');
        
        // Switch to statistics section
        document.querySelector('[data-section="statistics"]').click();
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Bir hata oluştu!', 'error');
    })
    .finally(() => {
        showLoading(false);
    });
}

// ===== Theme Toggle =====
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Update charts if they exist
    if (currentData) {
        updateCharts();
    }
});

function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// ===== Sidebar Navigation =====
const menuItems = document.querySelectorAll('.menu-item');
const contentSections = document.querySelectorAll('.content-section');

menuItems.forEach(item => {
    item.addEventListener('click', () => {
        const sectionId = item.getAttribute('data-section');
        
        // Update active menu item
        menuItems.forEach(mi => mi.classList.remove('active'));
        item.classList.add('active');
        
        // Show corresponding section
        contentSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === `${sectionId}-section`) {
                section.classList.add('active');
            }
        });
        
        // Re-draw heap visualization when heap section is shown
        if (sectionId === 'heap' && currentData && currentData.heap_structure) {
            setTimeout(() => {
                updateHeapVisualization(currentData.heap_structure);
            }, 100);
        }
    });
});

// ===== File Upload =====
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// Drag and Drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// File Input Change
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// Handle File Upload
function handleFile(file) {
    // Validate file type
    if (!file.name.endsWith('.txt')) {
        showToast('Sadece .txt dosyaları yüklenebilir!', 'error');
        return;
    }
    
    // Validate file size (16MB)
    if (file.size > 16 * 1024 * 1024) {
        showToast('Dosya boyutu 16MB\'dan küçük olmalıdır!', 'error');
        return;
    }
    
    // Show loading
    showLoading(true);
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload file
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }
        
        // Store data
        currentData = data;
        
        // Update UI
        updateStatistics(data.statistics);
        updateWordsTable(data.words);
        updateHeapVisualization(data.heap_structure);
        updateCharts();
        
        showToast('Dosya başarıyla analiz edildi!', 'success');
        
        // Switch to statistics section
        document.querySelector('[data-section="statistics"]').click();
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Bir hata oluştu!', 'error');
    })
    .finally(() => {
        showLoading(false);
    });
}

// ===== Update Statistics =====
function updateStatistics(stats) {
    document.getElementById('totalWords').textContent = stats.total_words.toLocaleString();
    document.getElementById('uniqueWords').textContent = stats.unique_words.toLocaleString();
    
    if (stats.most_common) {
        document.getElementById('mostCommonWord').textContent = stats.most_common.word;
        document.getElementById('mostCommonCount').textContent = `${stats.most_common.count} kez`;
    }
    
    document.getElementById('heapSize').textContent = stats.unique_words.toLocaleString();
}

// ===== Update Words Table =====
function updateWordsTable(words) {
    filteredWords = words;
    currentPage = 1;
    renderWordsTable();
}

function renderWordsTable() {
    const tbody = document.getElementById('wordsTableBody');
    tbody.innerHTML = '';
    
    if (filteredWords.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data">
                    <i class="fas fa-inbox"></i>
                    <p>Kelime bulunamadı.</p>
                </td>
            </tr>
        `;
        document.getElementById('paginationContainer').style.display = 'none';
        return;
    }
    
    const totalWords = currentData ? currentData.words.reduce((sum, w) => sum + w.count, 0) : 0;
    
    // Calculate pagination
    const itemsPerPageValue = itemsPerPage === 'all' ? filteredWords.length : parseInt(itemsPerPage);
    totalPages = Math.ceil(filteredWords.length / itemsPerPageValue);
    
    // Ensure current page is valid
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }
    
    // Get items for current page
    const startIndex = (currentPage - 1) * itemsPerPageValue;
    const endIndex = Math.min(startIndex + itemsPerPageValue, filteredWords.length);
    const pageWords = filteredWords.slice(startIndex, endIndex);
    
    // Render table rows
    pageWords.forEach((word, index) => {
        const actualIndex = startIndex + index;
        const percentage = ((word.count / totalWords) * 100).toFixed(2);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${actualIndex + 1}</td>
            <td><strong>${word.word}</strong></td>
            <td><span style="text-transform: uppercase;">${word.first_letter}</span></td>
            <td>${word.count}</td>
            <td>${percentage}%</td>
        `;
        tbody.appendChild(row);
    });
    
    // Update pagination UI
    updatePaginationUI(startIndex, endIndex);
}

function updatePaginationUI(startIndex, endIndex) {
    const paginationContainer = document.getElementById('paginationContainer');
    const paginationInfo = document.getElementById('paginationInfo');
    const pageNumbers = document.getElementById('pageNumbers');
    const firstPageBtn = document.getElementById('firstPageBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const lastPageBtn = document.getElementById('lastPageBtn');
    
    // Show pagination
    paginationContainer.style.display = 'flex';
    
    // Update info text
    paginationInfo.textContent = `Gösterilen: ${startIndex + 1} - ${endIndex} / ${filteredWords.length}`;
    
    // Update buttons state
    firstPageBtn.disabled = currentPage === 1;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    lastPageBtn.disabled = currentPage === totalPages;
    
    // Generate page numbers
    pageNumbers.innerHTML = '';
    
    // Show max 7 page numbers
    let startPage = Math.max(1, currentPage - 3);
    let endPage = Math.min(totalPages, currentPage + 3);
    
    // Adjust if near start or end
    if (currentPage <= 4) {
        endPage = Math.min(7, totalPages);
    }
    if (currentPage >= totalPages - 3) {
        startPage = Math.max(1, totalPages - 6);
    }
    
    // First page
    if (startPage > 1) {
        addPageNumber(1);
        if (startPage > 2) {
            addPageEllipsis();
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        addPageNumber(i);
    }
    
    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            addPageEllipsis();
        }
        addPageNumber(totalPages);
    }
}

function addPageNumber(pageNum) {
    const pageNumbers = document.getElementById('pageNumbers');
    const pageBtn = document.createElement('button');
    pageBtn.className = 'page-number';
    pageBtn.textContent = pageNum;
    if (pageNum === currentPage) {
        pageBtn.classList.add('active');
    }
    pageBtn.onclick = () => goToPage(pageNum);
    pageNumbers.appendChild(pageBtn);
}

function addPageEllipsis() {
    const pageNumbers = document.getElementById('pageNumbers');
    const ellipsis = document.createElement('span');
    ellipsis.className = 'page-number';
    ellipsis.textContent = '...';
    ellipsis.style.cursor = 'default';
    ellipsis.style.border = 'none';
    ellipsis.style.background = 'transparent';
    pageNumbers.appendChild(ellipsis);
}

function goToPage(page) {
    currentPage = page;
    renderWordsTable();
    // Scroll to top of table
    document.getElementById('wordsTableBody').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function goToFirstPage() {
    goToPage(1);
}

function goToPrevPage() {
    if (currentPage > 1) {
        goToPage(currentPage - 1);
    }
}

function goToNextPage() {
    if (currentPage < totalPages) {
        goToPage(currentPage + 1);
    }
}

function goToLastPage() {
    goToPage(totalPages);
}

function changeItemsPerPage() {
    const select = document.getElementById('itemsPerPage');
    itemsPerPage = select.value;
    currentPage = 1;
    renderWordsTable();
}

// ===== Search Functionality =====
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    if (!currentData) return;
    
    const filtered = currentData.words.filter(w => 
        w.word.includes(searchTerm)
    );
    
    updateWordsTable(filtered);
});

// ===== Heap Visualization with D3.js =====
function updateHeapVisualization(heapStructure) {
    const container = document.getElementById('heapVisualization');
    
    if (!container) {
        return;
    }
    
    container.innerHTML = '';
    
    if (!heapStructure || heapStructure.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-project-diagram"></i>
                <p>Heap yapısı boş.</p>
            </div>
        `;
        return;
    }
    
    // CRITICAL FIX: Sort heap structure for visualization
    // This shows words in correct alphabetical order with count priority
    const sortedStructure = [...heapStructure].sort((a, b) => {
        // Primary: letter (A-Z)
        if (a.first_letter !== b.first_letter) {
            return a.first_letter.localeCompare(b.first_letter);
        }
        // Secondary: count (high to low)
        if (a.count !== b.count) {
            return b.count - a.count;
        }
        // Tertiary: word alphabetically
        return a.word.localeCompare(b.word);
    });
    
    // Show first 31 nodes from sorted list
    const limitedStructure = sortedStructure.slice(0, 31);
    
    // Get container width - if 0, use default
    let width = container.clientWidth;
    if (width === 0 || width < 400) {
        width = 1000;
    }
    const height = 800;
    
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Add zoom behavior
    const g = svg.append('g');
    
    const zoom = d3.zoom()
        .scaleExtent([0.3, 3]) // Min and max zoom levels
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    
    svg.call(zoom);
    
    // Store zoom and svg for controls
    currentZoom = zoom;
    currentSvg = svg;
    
    // Create tree layout
    const treeLayout = d3.tree()
        .size([width - 150, height - 150])
        .separation((a, b) => (a.parent == b.parent ? 1.8 : 2.2));
    
    // Convert heap array to tree structure
    const root = arrayToTree(limitedStructure);
    
    if (!root) {
        return;
    }
    
    // Generate tree
    const treeData = treeLayout(d3.hierarchy(root));
    
    // Get theme colors
    const isDark = html.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f1f5f9' : '#1a202c';
    const linkColor = isDark ? '#64748b' : '#cbd5e1';
    
    // Draw links
    g.selectAll('.link')
        .data(treeData.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkVertical()
            .x(d => d.x + 75)
            .y(d => d.y + 75))
        .attr('fill', 'none')
        .attr('stroke', linkColor)
        .attr('stroke-width', 2);
    
    // Draw nodes
    const nodes = g.selectAll('.node')
        .data(treeData.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x + 75}, ${d.y + 75})`);
    
    // Color nodes by first letter for visual distinction
    nodes.append('circle')
        .attr('r', 28)
        .attr('fill', d => {
            // Different colors for different starting letters
            const letter = d.data.word[0].toLowerCase();
            const hue = ((letter.charCodeAt(0) - 97) * 15) % 360;
            return `hsl(${hue}, 70%, 50%)`;
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 3);
    
    // Word label (top)
    nodes.append('text')
        .attr('dy', -35)
        .attr('text-anchor', 'middle')
        .attr('fill', textColor)
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .text(d => d.data.word)
        .each(function(d) {
            const text = d3.select(this);
            const words = d.data.word;
            if (words.length > 8) {
                text.text(words.substring(0, 7) + '...');
            }
        });
    
    // Count label (center)
    nodes.append('text')
        .attr('dy', 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(d => d.data.count);
    
    // First letter label (bottom) - KEY 1
    nodes.append('text')
        .attr('dy', 40)
        .attr('text-anchor', 'middle')
        .attr('fill', textColor)
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .style('text-transform', 'uppercase')
        .text(d => `[${d.data.word[0]}]`);
}

function arrayToTree(heapArray) {
    if (heapArray.length === 0) return null;
    
    function buildNode(index) {
        if (index >= heapArray.length) return null;
        
        const node = {
            word: heapArray[index].word,
            count: heapArray[index].count,
            children: []
        };
        
        const leftIndex = 2 * index + 1;
        const rightIndex = 2 * index + 2;
        
        const leftChild = buildNode(leftIndex);
        const rightChild = buildNode(rightIndex);
        
        if (leftChild) node.children.push(leftChild);
        if (rightChild) node.children.push(rightChild);
        
        return node;
    }
    
    return buildNode(0);
}

// ===== Charts =====
function updateCharts() {
    if (!currentData) return;
    
    const isDark = html.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#cbd5e1' : '#4a5568';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    
    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;
    
    // Top 10 Words Chart
    updateTopWordsChart(isDark);
    
    // Letter Distribution Chart
    updateLetterDistributionChart(isDark);
    
    // Letter Stats Chart
    updateLetterStatsChart(isDark);
}

function updateTopWordsChart(isDark) {
    const ctx = document.getElementById('topWordsChart');
    
    if (charts.topWords) {
        charts.topWords.destroy();
    }
    
    const top10 = currentData.top_10_words;
    
    charts.topWords = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top10.map(w => w.word),
            datasets: [{
                label: 'Tekrar Sayısı',
                data: top10.map(w => w.count),
                backgroundColor: 'rgba(37, 99, 235, 0.8)',
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: isDark ? '#334155' : '#e2e8f0'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updateLetterDistributionChart(isDark) {
    const ctx = document.getElementById('letterDistributionChart');
    
    if (charts.letterDistribution) {
        charts.letterDistribution.destroy();
    }
    
    const letterStats = currentData.letter_stats;
    const letters = Object.keys(letterStats).sort();
    const counts = letters.map(l => letterStats[l].count);
    
    // Generate colors
    const colors = letters.map((_, i) => {
        const hue = (i * 360 / letters.length);
        return `hsla(${hue}, 70%, 60%, 0.8)`;
    });
    
    charts.letterDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: letters.map(l => l.toUpperCase()),
            datasets: [{
                data: counts,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: isDark ? '#1e293b' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function updateLetterStatsChart(isDark) {
    const ctx = document.getElementById('letterStatsChart');
    
    if (charts.letterStats) {
        charts.letterStats.destroy();
    }
    
    const letterStats = currentData.letter_stats;
    const letters = Object.keys(letterStats).sort();
    const uniqueCounts = letters.map(l => letterStats[l].count);
    const totalOccurrences = letters.map(l => letterStats[l].total_occurrences);
    
    charts.letterStats = new Chart(ctx, {
        type: 'line',
        data: {
            labels: letters.map(l => l.toUpperCase()),
            datasets: [
                {
                    label: 'Benzersiz Kelime Sayısı',
                    data: uniqueCounts,
                    borderColor: 'rgba(37, 99, 235, 1)',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Toplam Tekrar Sayısı',
                    data: totalOccurrences,
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: isDark ? '#334155' : '#e2e8f0'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ===== Loading Overlay =====
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

// ===== Toast Notification =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('i');
    const messageEl = document.getElementById('toastMessage');
    
    messageEl.textContent = message;
    
    if (type === 'success') {
        icon.className = 'fas fa-check-circle';
        icon.style.color = '#48bb78';
    } else {
        icon.className = 'fas fa-exclamation-circle';
        icon.style.color = '#f56565';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== Window Resize Handler =====
window.addEventListener('resize', () => {
    if (currentData && currentData.heap_structure) {
        // Check if heap section is active
        const heapSection = document.getElementById('heap-section');
        if (heapSection && heapSection.classList.contains('active')) {
            updateHeapVisualization(currentData.heap_structure);
        }
    }
});

// ===== Zoom Controls =====
function zoomIn() {
    if (currentSvg && currentZoom) {
        currentSvg.transition().duration(300).call(currentZoom.scaleBy, 1.3);
    }
}

function zoomOut() {
    if (currentSvg && currentZoom) {
        currentSvg.transition().duration(300).call(currentZoom.scaleBy, 0.7);
    }
}

function resetZoom() {
    if (currentSvg && currentZoom) {
        currentSvg.transition().duration(500).call(
            currentZoom.transform,
            d3.zoomIdentity
        );
    }
}

// ===== Initialize =====
console.log('%c🚀 Kelime Analiz Sistemi Hazır!', 'color: #667eea; font-size: 20px; font-weight: bold;');
console.log('%c📊 Heap Data Structure ile Kelime Frekans Analizi', 'color: #4a5568; font-size: 14px;');
