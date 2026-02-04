// DOM Elements
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const theatersContainer = document.getElementById('theatersContainer');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTheaters();
});

// Load Theaters from API
async function loadTheaters() {
    try {
        loadingSpinner.style.display = 'block';
        errorMessage.style.display = 'none';
        theatersContainer.innerHTML = '';
        
        const response = await fetch('/api/theaters');
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.message || 'Failed to load data');
        }
        
        const theaters = data.theaterInfos || [];
        
        // Update stats
        updateTheaterStats(theaters);
        
        // Render theaters
        renderTheaters(theaters);
        
    } catch (error) {
        console.error('Error loading theaters:', error);
        errorMessage.style.display = 'block';
        errorMessage.querySelector('p').textContent = `❌ ${error.message}`;
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Update Theater Stats
function updateTheaterStats(theaters) {
    const totalTheaters = document.getElementById('totalTheaters');
    const premiumCount = document.getElementById('premiumCount');
    const viralCount = document.getElementById('viralCount');
    
    if (totalTheaters) {
        totalTheaters.textContent = theaters.length;
    }
    
    // Count premium and viral (example logic)
    let premium = 0;
    let viral = 0;
    
    theaters.forEach(theater => {
        const serials = theater.shortPlayList || [];
        serials.forEach(serial => {
            if (serial.scriptName && serial.scriptName.includes('Premium')) {
                premium++;
            }
            if (serial.heatScore && serial.heatScore > 50000) {
                viral++;
            }
        });
    });
    
    if (premiumCount) {
        premiumCount.textContent = premium;
    }
    
    if (viralCount) {
        viralCount.textContent = viral;
    }
}

// Render Theaters
function renderTheaters(theaters) {
    theatersContainer.innerHTML = '';
    
    if (theaters.length === 0) {
        theatersContainer.innerHTML = '<p style="text-align: center; padding: 60px; color: var(--text-secondary);">📭 Tidak ada theaters yang ditemukan.</p>';
        return;
    }
    
    theaters.forEach(theater => {
        const theaterSection = createTheaterSection(theater);
        theatersContainer.appendChild(theaterSection);
    });
}

// Create Theater Section
function createTheaterSection(theater) {
    const section = document.createElement('div');
    section.className = 'theater-section';
    
    const serials = theater.shortPlayList || [];
    const theaterName = theater.theaterName || 'Unknown Theater';
    
    section.innerHTML = `
        <div class="section-header theater-header">
            <div>
                <h2 class="section-title theater-title">${theaterName}</h2>
                <p class="section-subtitle">${serials.length} serial tersedia</p>
            </div>
            <div class="theater-meta">
                <span class="theater-badge">🎭 Theater</span>
                <span class="theater-count">${serials.length} Serial</span>
            </div>
        </div>
        <div class="content-grid" id="theater-${theater.theaterId || Math.random()}"></div>
    `;
    
    // Add serials to grid
    const grid = section.querySelector('.content-grid');
    serials.forEach(serial => {
        const card = createTheaterCard(serial);
        grid.appendChild(card);
    });
    
    return section;
}

// Create Theater Card (2 column layout)
function createTheaterCard(item) {
    const card = document.createElement('div');
    card.className = 'content-card theater-card';
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
                ${item.reserves ? `<span class="reserves" style="color: var(--warning-color); font-size: 0.85rem;">🔖 ${item.reserves}</span>` : ''}
            </div>
        </div>
    `;
    
    return card;
}

// Show Detail Modal
function showDetail(item) {
    const modal = document.getElementById('detailModal');
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
            ${item.reserves ? `
            <div class="info-row">
                <span class="info-label">Reservasi:</span>
                <span class="info-value">${item.reserves}</span>
            </div>
            ` : ''}
        </div>
        <div style="margin-top: 25px; text-align: center;">
            <a href="/episodes/${item.shortPlayId}" class="btn-episodes">
                🎬 Lihat Semua Episode
            </a>
        </div>
    `;
    
    modal.style.display = 'block';
}
