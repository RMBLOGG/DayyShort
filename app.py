from flask import Flask, render_template, jsonify, request
import requests
import logging

app = Flask(__name__)

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Base API URL
API_BASE_URL = "https://api.sansekai.my.id/api"

@app.route('/')
def index():
    """Halaman utama yang menampilkan daftar serial"""
    return render_template('index.html')

@app.route('/api/foryou')
def get_foryou():
    """Endpoint untuk mengambil data dari API sansekai"""
    try:
        response = requests.get(f"{API_BASE_URL}/netshort/foryou")
        response.raise_for_status()
        data = response.json()
        return jsonify(data)
    except requests.exceptions.RequestException as e:
        logger.error(f"Error in /api/foryou: {str(e)}")
        return jsonify({
            "error": "Gagal mengambil data dari API",
            "message": str(e)
        }), 500

@app.route('/api/details/<short_play_id>')
def get_details(short_play_id):
    """Endpoint untuk mendapatkan detail serial (contoh endpoint)"""
    try:
        response = requests.get(f"{API_BASE_URL}/netshort/foryou")
        response.raise_for_status()
        data = response.json()
        
        # Cari serial berdasarkan ID
        for content in data.get('contentInfos', []):
            if content.get('shortPlayId') == short_play_id:
                return jsonify(content)
        
        return jsonify({"error": "Serial tidak ditemukan"}), 404
    except requests.exceptions.RequestException as e:
        logger.error(f"Error in /api/details: {str(e)}")
        return jsonify({
            "error": "Gagal mengambil data dari API",
            "message": str(e)
        }), 500

@app.route('/theaters')
def theaters():
    """Halaman theaters"""
    return render_template('theaters.html')

@app.route('/favorit')
def favorit():
    """Halaman favorit"""
    return render_template('favorit.html')

@app.route('/api/theaters')
def get_theaters():
    """Endpoint untuk mengambil data theaters dari API sansekai"""
    try:
        response = requests.get(f"{API_BASE_URL}/netshort/theaters")
        response.raise_for_status()
        data = response.json()
        return jsonify(data)
    except requests.exceptions.RequestException as e:
        logger.error(f"Error in /api/theaters: {str(e)}")
        return jsonify({
            "error": "Gagal mengambil data dari API",
            "message": str(e)
        }), 500

@app.route('/episodes/<short_play_id>')
def episodes(short_play_id):
    """Halaman episodes untuk serial tertentu"""
    return render_template('episodes.html', short_play_id=short_play_id)

@app.route('/api/allepisode')
def get_all_episodes():
    """Endpoint untuk mengambil semua episode dari serial tertentu"""
    short_play_id = request.args.get('shortPlayId')
    
    if not short_play_id:
        return jsonify({
            "error": "Parameter shortPlayId diperlukan"
        }), 400
    
    try:
        response = requests.get(
            f"{API_BASE_URL}/netshort/allepisode",
            params={"shortPlayId": short_play_id}
        )
        response.raise_for_status()
        data = response.json()
        return jsonify(data)
    except requests.exceptions.RequestException as e:
        logger.error(f"Error in /api/allepisode: {str(e)}")
        return jsonify({
            "error": "Gagal mengambil data dari API",
            "message": str(e)
        }), 500

@app.route('/api/search')
def search_serials():
    """Endpoint untuk mencari serial berdasarkan kata kunci"""
    query = request.args.get('q', '')
    
    if not query:
        return jsonify({
            "error": "Parameter 'q' (query) diperlukan"
        }), 400
    
    try:
        # Log request details
        url = f"{API_BASE_URL}/netshort/search"
        params = {"searchCode": query}
        logger.info(f"Searching with URL: {url}, params: {params}")
        
        # API menggunakan parameter 'searchCode' bukan 'q'
        response = requests.get(
            url,
            params=params,
            headers={
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            timeout=15
        )
        
        # Log response details
        logger.info(f"Response status: {response.status_code}")
        logger.debug(f"Response headers: {response.headers}")
        
        response.raise_for_status()
        data = response.json()
        
        logger.info(f"Search successful, found {len(data.get('searchCodeSearchResult', []))} results")
        return jsonify(data)
        
    except requests.exceptions.Timeout:
        logger.error("Search request timeout")
        return jsonify({
            "error": "Request timeout",
            "message": "API tidak merespons dalam waktu yang ditentukan"
        }), 504
    except requests.exceptions.HTTPError as e:
        logger.error(f"HTTP Error in search: {str(e)}, Response: {e.response.text if e.response else 'No response'}")
        return jsonify({
            "error": "HTTP Error",
            "message": str(e),
            "status_code": e.response.status_code if e.response else None,
            "details": e.response.text if e.response else None
        }), 500
    except requests.exceptions.RequestException as e:
        logger.error(f"Request Exception in search: {str(e)}")
        return jsonify({
            "error": "Gagal mengambil data dari API",
            "message": str(e),
            "type": type(e).__name__
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error in search: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Unexpected error",
            "message": str(e),
            "type": type(e).__name__
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
