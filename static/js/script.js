// Global variables
let allContent = [];
let currentContent = [];
let searchTimeout;
let isSearchMode = false;

// DOM Elements
const contentGrid = document.getElementById('contentGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const modal = document.getElementById('detailModal');
const closeModal = document.querySelector('.close');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadContent();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Search with debounce
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        
        if (query.length >= 2) {
            searchTimeout = setTimeout(() => {
                searchContent(query);
            }, 500); // Delay 500ms untuk menghindari terlalu banyak request
        } else if (query.length === 0) {
            // Jika search kosong, kembali ke konten awal
            isSearchMode = false;
            loadContent();
        }
    });
    
    // Sort
    sortSelect.addEventListener('change', function() {
        handleSort(this.value);
    });
    
    // Modal close
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Load Content from API
async function loadContent() {
    try {
        loadingSpinner.style.display = 'block';
        errorMessage.style.display = 'none';
        contentGrid.innerHTML = '';
        
        const response = await fetch('/api/foryou');
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.message || 'Failed to load data');
        }
        
        allContent = data.contentInfos || [];
        currentContent = [...allContent];
        
        // Update content name
        const contentNameEl = document.getElementById('contentName');
        if (contentNameEl) {
            contentNameEl.textContent = data.contentName || 'Semua Serial';
        }
        
        // Update stats
        updateStats(data);
        
        // Render content
        renderContent(currentContent);
        
    } catch (error) {
        console.error('Error loading content:', error);
        errorMessage.style.display = 'block';
        errorMessage.querySelector('p').textContent = `❌ ${error.message}`;
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Search content using API
async function searchContent(query) {
    try {
        loadingSpinner.style.display = 'block';
        errorMessage.style.display = 'none';
        contentGrid.innerHTML = '';
        isSearchMode = true;
        
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.message || 'Failed to search');
        }
        
        if (data.searchCodeSearchResult && data.searchCodeSearchResult.length > 0) {
            // Format data dari search result agar sesuai dengan format contentInfos
            currentContent = data.searchCodeSearchResult.map(item => ({
                shortPlayId: item.shortPlayId,
                shortPlayLibraryId: item.shortPlayLibraryId,
                shortPlayName: item.shortPlayName.replace(/<em>/g, '').replace(/<\/em>/g, ''),
                shortPlayCover: item.shortPlayCover,
                shotIntroduce: item.shotIntroduce,
                labelArray: item.labelNameList || [],
                heatScoreShow: item.formatHeatScore,
                scriptName: item.starMessage,
                isChase: false,
                heatScore: item.heatScore
            }));
            
            // Update section title
            const contentNameEl = document.getElementById('contentName');
            if (contentNameEl) {
                contentNameEl.textContent = `Hasil pencarian untuk "${query}" (${data.total || currentContent.length} ditemukan)`;
            }
            
            // Update stats for search results
            updateSearchStats(currentContent, data.total || currentContent.length);
            
            // Render content
            renderContent(currentContent);
        } else {
            // No results found
            currentContent = [];
            const contentNameEl = document.getElementById('contentName');
            if (contentNameEl) {
                contentNameEl.textContent = `Tidak ada hasil untuk "${query}"`;
            }
            renderContent(currentContent);
        }
        
    } catch (error) {
        console.error('Error searching content:', error);
        errorMessage.style.display = 'block';
        errorMessage.querySelector('p').textContent = `❌ ${error.message}`;
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Update stats for search results
function updateSearchStats(results, total) {
    const totalShows = document.getElementById('totalShows');
    const totalViews = document.getElementById('totalViews');
    const newShows = document.getElementById('newShows');
    
    if (totalShows) {
        totalShows.textContent = total;
    }
    
    // Calculate total views from search results
    let totalViewsCount = 0;
    results.forEach(content => {
        const views = parseViewCount(content.heatScoreShow);
        totalViewsCount += views;
    });
    
    if (totalViews) {
        totalViews.textContent = formatNumber(totalViewsCount);
    }
    
    if (newShows) {
        newShows.textContent = results.length;
    }
}

// Update Statistics
function updateStats(data) {
    const totalShows = document.getElementById('totalShows');
    const totalViews = document.getElementById('totalViews');
    const newShows = document.getElementById('newShows');
    
    if (totalShows) {
        animateValue(totalShows, 0, data.contentInfos.length, 1000);
    }
    
    // Calculate total views
    let totalViewsCount = 0;
    data.contentInfos.forEach(content => {
        const views = parseViewCount(content.heatScoreShow);
        totalViewsCount += views;
    });
    
    if (totalViews) {
        totalViews.textContent = formatNumber(totalViewsCount);
    }
    
    // Count new shows
    const newShowsCount = data.contentInfos.filter(c => c.scriptName === 'Baru').length;
    if (newShows) {
        animateValue(newShows, 0, newShowsCount, 1000);
    }
}

// Parse view count from string like "75.1K" to number
function parseViewCount(viewString) {
    if (!viewString) return 0;
    
    const multipliers = {
        'K': 1000,
        'M': 1000000,
        'B': 1000000000
    };
    
    const match = viewString.match(/([\d.]+)([KMB]?)/);
    if (match) {
        const number = parseFloat(match[1]);
        const multiplier = multipliers[match[2]] || 1;
        return Math.round(number * multiplier);
    }
    
    return 0;
}

// Format number with K, M suffix
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Animate number counting
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Render Content Cards
function renderContent(content) {
    contentGrid.innerHTML = '';
    
    if (content.length === 0) {
        contentGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">📭 Tidak ada serial yang ditemukan.</p>';
        return;
    }
    
    content.forEach(item => {
        const card = createContentCard(item);
        contentGrid.appendChild(card);
    });
}

// Create Content Card Element
function createContentCard(item) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.onclick = () => showDetail(item);
    
    // Parse labels
    const labels = item.labelArray || [];
    const labelsHTML = labels.slice(0, 3).map(label => 
        `<span class="label-tag">${label}</span>`
    ).join('');
    
    // Create card HTML with horizontal layout
    card.innerHTML = `
        <div class="card-image-wrapper">
            ${item.scriptName ? `<div class="card-badge">${item.scriptName}</div>` : ''}
            <img src="${item.shortPlayCover}" alt="${item.shortPlayName}" class="card-image" loading="lazy" onerror="this.src='https://via.placeholder.com/160x220?text=No+Image'">
            <div class="card-play-overlay">
                <div class="play-icon">▶️</div>
            </div>
        </div>
        <div class="card-content">
            <div>
                <h3 class="card-title">${item.shortPlayName}</h3>
                <div class="card-labels">
                    ${labelsHTML}
                </div>
            </div>
            <div class="card-stats">
                <span class="views">${item.heatScoreShow || '0'}</span>
                <span class="card-rating">⭐ 4.5</span>
            </div>
        </div>
    `;
    
    return card;
}

// Show Detail Modal
function showDetail(item) {
    const modalBody = document.getElementById('modalBody');
    
    // Parse labels
    const labels = item.labelArray || [];
    const labelsHTML = labels.map(label => 
        `<span class="label-tag">${label}</span>`
    ).join('');
    
    modalBody.innerHTML = `
        <img src="${item.shortPlayCover}" alt="${item.shortPlayName}" class="modal-image" onerror="this.src='https://via.placeholder.com/800x400?text=No+Image'">
        <h2 class="modal-title">${item.shortPlayName}</h2>
        <div class="card-labels" style="margin-bottom: 20px;">
            ${labelsHTML}
        </div>
        ${item.shotIntroduce ? `<p style="color: var(--text-secondary); line-height: 1.8; margin-bottom: 25px;">${item.shotIntroduce}</p>` : ''}
        <div class="modal-info">
            <div class="info-row">
                <span class="info-label">ID Serial:</span>
                <span class="info-value">${item.shortPlayId}</span>
            </div>
            <div class="info-row">
                <span class="info-label">ID Perpustakaan:</span>
                <span class="info-value">${item.shortPlayLibraryId}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value">${item.scriptName || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Popularitas:</span>
                <span class="info-value">${item.heatScoreShow || 'N/A'} penonton</span>
            </div>
            <div class="info-row">
                <span class="info-label">Sedang Populer:</span>
                <span class="info-value">${item.isChase ? 'Ya' : 'Tidak'}</span>
            </div>
        </div>
        <div style="margin-top: 25px; text-align: center;">
            <a href="/episodes/${item.shortPlayId}" class="btn-episodes">
                🎬 Lihat Semua Episode
            </a>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Handle Sort
function handleSort(sortValue) {
    switch(sortValue) {
        case 'popularity':
            currentContent.sort((a, b) => {
                const viewsA = parseViewCount(a.heatScoreShow);
                const viewsB = parseViewCount(b.heatScoreShow);
                return viewsB - viewsA;
            });
            break;
        case 'newest':
            if (isSearchMode) {
                // Untuk search mode, reverse order
                currentContent.reverse();
            } else {
                currentContent.sort((a, b) => {
                    const scoreA = a.scriptName === 'Baru' ? 1 : 0;
                    const scoreB = b.scriptName === 'Baru' ? 1 : 0;
                    return scoreB - scoreA;
                });
            }
            break;
        case 'name':
            currentContent.sort((a, b) => 
                a.shortPlayName.localeCompare(b.shortPlayName)
            );
            break;
    }
    
    renderContent(currentContent);
}

// Refresh button handler (optional enhancement)
function refreshContent() {
    isSearchMode = false;
    searchInput.value = '';
    loadContent();
}
