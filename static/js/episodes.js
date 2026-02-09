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
const episodeSort = document.getElementById('episodeSort');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadEpisodes();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    if (videoClose) {
        videoClose.addEventListener('click', () => {
            closeVideoModal();
        });
    }
    
    if (episodeSort) {
        episodeSort.addEventListener('change', (e) => {
            sortEpisodes(e.target.value);
        });
    }
    
    window.addEventListener('click', (e) => {
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
    
    // Episode count
    const episodeCount = document.getElementById('episodeCount');
    if (episodeCount) {
        episodeCount.textContent = `${data.totalEpisode || 0} episode`;
    }
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

// Sort Episodes
function sortEpisodes(order) {
    if (!episodeData || !episodeData.shortPlayEpisodeInfos) return;
    
    const episodes = [...episodeData.shortPlayEpisodeInfos];
    
    if (order === 'desc') {
        episodes.reverse();
    }
    
    renderEpisodes(episodes);
}

// Create Episode Card - NEW DESIGN (NO LOCK)
function createEpisodeCard(episode) {
    const card = document.createElement('div');
    card.className = 'episode-card';
    
    card.innerHTML = `
        <div class="episode-thumbnail-wrapper">
            <img src="${episode.episodeCover || 'https://via.placeholder.com/640x360?text=Episode+' + episode.episodeNo}" 
                 alt="Episode ${episode.episodeNo}" 
                 class="episode-thumbnail" 
                 loading="lazy">
            
            <div class="episode-number-badge">EP ${episode.episodeNo}</div>
            
            <div class="episode-play-overlay">
                <div class="episode-play-icon">▶</div>
            </div>
        </div>
        
        <div class="episode-info-content">
            <h3 class="episode-title">${episode.episodeName || 'Episode ' + episode.episodeNo}</h3>
            
            <div class="episode-meta">
                <span class="episode-meta-item">👍 ${formatNumber(episode.likeNums || 0)}</span>
                <span class="episode-meta-item">👁️ ${formatNumber(episode.chaseNums || 0)}</span>
                ${episode.playClarity ? `<span class="episode-quality-badge">${episode.playClarity}</span>` : ''}
            </div>
        </div>
    `;
    
    // All episodes are playable
    card.style.cursor = 'pointer';
    card.onclick = () => playEpisode(episode);
    
    return card;
}

// Play Episode
function playEpisode(episode) {
    const videoElement = document.getElementById('videoElement');
    const videoTitle = document.getElementById('videoTitle');
    const videoLikes = document.getElementById('videoLikes');
    const videoChases = document.getElementById('videoChases');
    const videoViews = document.getElementById('videoViews');
    
    // Set video source
    if (episode.playVoucher) {
        videoElement.querySelector('source').src = episode.playVoucher;
        videoElement.load();
    }
    
    // Set info
    videoTitle.textContent = episode.episodeName || `Episode ${episode.episodeNo}`;
    
    if (videoLikes) {
        videoLikes.innerHTML = `<span class="meta-icon">👍</span> ${formatNumber(episode.likeNums || 0)}`;
    }
    
    if (videoChases) {
        videoChases.innerHTML = `<span class="meta-icon">📌</span> ${formatNumber(episode.chaseNums || 0)}`;
    }
    
    if (videoViews) {
        videoViews.textContent = formatNumber(episode.chaseNums || 0);
    }
    
    // Show modal
    videoModal.style.display = 'block';
    
    // Play video
    videoElement.play().catch(err => {
        console.error('Error playing video:', err);
    });
}

// Close Video Modal
function closeVideoModal() {
    const videoElement = document.getElementById('videoElement');
    videoElement.pause();
    videoElement.currentTime = 0;
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
