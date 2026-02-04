// Global variables
let episodeData = null;

// DOM Elements
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const serialInfo = document.getElementById('serialInfo');
const episodesSection = document.getElementById('episodesSection');
const episodesGrid = document.getElementById('episodesGrid');
const videoModal = document.getElementById('videoModal');
const videoClose = document.querySelector('.video-close');
const modal = document.getElementById('detailModal');
const closeModal = document.querySelector('.close');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadEpisodes();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    if (videoClose) {
        videoClose.addEventListener('click', () => {
            closeVideoModal();
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
        if (e.target === videoModal) {
            closeVideoModal();
        }
    });
}

// Load Episodes from API
async function loadEpisodes() {
    try {
        loadingSpinner.style.display = 'block';
        errorMessage.style.display = 'none';
        serialInfo.style.display = 'none';
        episodesSection.style.display = 'none';
        
        const response = await fetch(`/api/allepisode?shortPlayId=${shortPlayId}`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.message || 'Failed to load data');
        }
        
        episodeData = data;
        
        // Render serial info
        renderSerialInfo(data);
        
        // Render episodes
        renderEpisodes(data.shortPlayEpisodeInfos || []);
        
        serialInfo.style.display = 'block';
        episodesSection.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading episodes:', error);
        errorMessage.style.display = 'block';
        errorMessage.querySelector('p').textContent = `❌ ${error.message}`;
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Render Serial Info
function renderSerialInfo(data) {
    // Cover
    document.getElementById('serialCover').src = data.shortPlayCover || '';
    
    // Title
    document.getElementById('serialTitle').textContent = data.shortPlayName || 'Unknown';
    
    // Labels
    const labelsContainer = document.getElementById('serialLabels');
    if (data.shortPlayLabels && data.shortPlayLabels.length > 0) {
        labelsContainer.innerHTML = data.shortPlayLabels.map(label => 
            `<span class="label-tag">${label}</span>`
        ).join('');
    }
    
    // Introduction
    document.getElementById('serialIntro').textContent = data.shotIntroduce || 'Tidak ada deskripsi.';
    
    // Meta
    document.getElementById('totalEpisode').textContent = data.totalEpisode || 0;
    document.getElementById('isFinish').textContent = data.isFinish === 1 ? 'Selesai' : 'Berlangsung';
    document.getElementById('goldCoinPrice').textContent = data.goldCoinPrice || 0;
    document.getElementById('payPoint').textContent = data.payPoint || 0;
    
    // Stats
    document.getElementById('defaultLikeNums').textContent = formatNumber(data.defaultLikeNums || 0);
    document.getElementById('defaultChaseNums').textContent = formatNumber(data.defaultChaseNums || 0);
}

// Render Episodes
function renderEpisodes(episodes) {
    episodesGrid.innerHTML = '';
    
    if (episodes.length === 0) {
        episodesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">Tidak ada episode yang tersedia.</p>';
        return;
    }
    
    episodes.forEach(episode => {
        const card = createEpisodeCard(episode);
        episodesGrid.appendChild(card);
    });
}

// Create Episode Card
function createEpisodeCard(episode) {
    const card = document.createElement('div');
    card.className = 'episode-card';
    
    // Check if locked
    const isLocked = episode.isLock || false;
    const isVip = episode.isVip || false;
    const isAd = episode.isAd || false;
    
    card.innerHTML = `
        <div class="episode-image-container">
            <img src="${episode.episodeCover}" alt="Episode ${episode.episodeNo}" class="episode-image" loading="lazy" onerror="this.src='https://via.placeholder.com/360x640?text=Episode+${episode.episodeNo}'">
            ${isLocked ? '<div class="episode-lock">🔒</div>' : ''}
            ${isVip ? '<div class="episode-vip">VIP</div>' : ''}
            ${isAd ? '<div class="episode-ad">AD</div>' : ''}
            <div class="episode-number">EP ${episode.episodeNo}</div>
        </div>
        <div class="episode-info">
            <h4 class="episode-title">Episode ${episode.episodeNo}</h4>
            <div class="episode-stats">
                <span class="episode-stat">👍 ${episode.likeNums || '0'}</span>
                <span class="episode-stat">👁️ ${episode.chaseNums || '0'}</span>
            </div>
            ${episode.playClarity ? `<div class="episode-quality">${episode.playClarity}</div>` : ''}
        </div>
    `;
    
    // Add click event
    if (!isLocked) {
        card.style.cursor = 'pointer';
        card.onclick = () => playEpisode(episode);
    } else {
        card.style.opacity = '0.7';
        card.onclick = () => {
            alert('Episode ini terkunci. Silakan buka kunci untuk menonton.');
        };
    }
    
    return card;
}

// Play Episode
function playEpisode(episode) {
    const videoElement = document.getElementById('videoElement');
    const videoTitle = document.getElementById('videoTitle');
    const videoLikes = document.getElementById('videoLikes');
    const videoChases = document.getElementById('videoChases');
    
    // Set video source
    videoElement.src = episode.playVoucher || '';
    
    // Set info
    videoTitle.textContent = `Episode ${episode.episodeNo}`;
    videoLikes.textContent = `${episode.likeNums || '0'} Likes`;
    videoChases.textContent = `${episode.chaseNums || '0'} Views`;
    
    // Show modal
    videoModal.style.display = 'block';
    
    // Play video
    videoElement.play();
}

// Close Video Modal
function closeVideoModal() {
    const videoElement = document.getElementById('videoElement');
    videoElement.pause();
    videoElement.src = '';
    videoModal.style.display = 'none';
}

// Format number with K, M suffix
function formatNumber(num) {
    if (typeof num === 'string') {
        return num;
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}
