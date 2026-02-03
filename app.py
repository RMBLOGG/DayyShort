from flask import Flask, render_template_string, request, jsonify, redirect, url_for
import requests
import os
from werkzeug.utils import secure_filename
import base64

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Telegram Bot Configuration
BOT_TOKEN = '8583227383:AAEGe3Xy2vy2nqNSIQDc5P5fIEAmx8hUTAg'
TELEGRAM_API_URL = f'https://api.telegram.org/bot{BOT_TOKEN}'

# Create upload folder if not exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# HTML Template
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dayy Anim - Telegram Post Manager</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #0f172a;
            min-height: 100vh;
            padding: 0;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #1e293b;
            min-height: 100vh;
        }
        
        .header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            padding: 40px 30px;
            text-align: center;
            border-bottom: 3px solid #4f46e5;
        }
        
        .header h1 {
            color: white;
            margin-bottom: 8px;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        
        .header p {
            color: rgba(255,255,255,0.9);
            font-size: 14px;
            font-weight: 400;
        }
        
        .form-container {
            background: transparent;
            padding: 30px;
        }
        
        .form-group {
            margin-bottom: 24px;
        }
        
        label {
            display: block;
            margin-bottom: 10px;
            color: #e2e8f0;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        input[type="text"],
        input[type="number"],
        textarea,
        select {
            width: 100%;
            padding: 14px 16px;
            background: #0f172a;
            border: 2px solid #334155;
            border-radius: 10px;
            font-size: 15px;
            color: #e2e8f0;
            transition: all 0.3s;
            font-family: inherit;
        }
        
        input[type="text"]:focus,
        input[type="number"]:focus,
        textarea:focus,
        select:focus {
            outline: none;
            border-color: #6366f1;
            background: #1e293b;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        textarea {
            resize: vertical;
            min-height: 140px;
            line-height: 1.6;
        }
        
        input[type="file"] {
            width: 100%;
            padding: 16px;
            background: #0f172a;
            border: 2px dashed #334155;
            border-radius: 10px;
            color: #94a3b8;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        input[type="file"]:hover {
            border-color: #6366f1;
            background: #1e293b;
        }
        
        select option {
            background: #0f172a;
            color: #e2e8f0;
        }
        
        .button-group {
            margin-top: 16px;
        }
        
        .btn {
            display: block;
            width: 100%;
            padding: 12px 18px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s;
            margin-bottom: 10px;
        }
        
        .btn-add {
            background: #10b981;
            color: white;
        }
        
        .btn-add:hover {
            background: #059669;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        
        .btn-remove {
            background: #ef4444;
            color: white;
            width: auto;
            display: inline-block;
            margin-bottom: 0;
        }
        
        .btn-remove:hover {
            background: #dc2626;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }
        
        .btn-submit {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 30px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .btn-submit:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 24px rgba(99, 102, 241, 0.5);
        }
        
        .btn-submit:disabled {
            background: #475569;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .inline-button-item {
            background: #0f172a;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 16px;
            border: 2px solid #334155;
        }
        
        .inline-button-item:last-child {
            margin-bottom: 0;
        }
        
        .alert {
            padding: 16px 20px;
            border-radius: 10px;
            margin-bottom: 24px;
            display: none;
            font-weight: 500;
        }
        
        .alert-success {
            background: rgba(16, 185, 129, 0.15);
            color: #10b981;
            border: 2px solid #10b981;
        }
        
        .alert-error {
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
            border: 2px solid #ef4444;
        }
        
        .preview-image {
            max-width: 100%;
            max-height: 300px;
            margin-top: 16px;
            border-radius: 10px;
            display: none;
            border: 2px solid #334155;
        }
        
        .info-box {
            background: rgba(99, 102, 241, 0.1);
            padding: 16px;
            border-radius: 10px;
            border-left: 4px solid #6366f1;
            margin-bottom: 24px;
            font-size: 13px;
            color: #a5b4fc;
            line-height: 1.6;
        }
        
        .info-box strong {
            color: #c7d2fe;
        }
        
        .loading {
            display: none;
            text-align: center;
            padding: 30px;
        }
        
        .spinner {
            border: 3px solid #334155;
            border-top: 3px solid #6366f1;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 0.8s linear infinite;
            margin: 0 auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading p {
            margin-top: 16px;
            color: #94a3b8;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎌 Dayy Anim Post Manager</h1>
            <p>Dashboard untuk posting ke Telegram Channel</p>
        </div>
        
        <div class="form-container">
            <div class="alert alert-success" id="successAlert"></div>
            <div class="alert alert-error" id="errorAlert"></div>
            
            <div class="info-box">
                ℹ️ <strong>Cara Pakai:</strong><br>
                1. Tambahkan bot @DayyAnimeBot sebagai admin di channel<br>
                2. Kirim 1 pesan di channel (apa saja)<br>
                3. Refresh halaman ini, channel akan muncul otomatis di dropdown!<br>
                4. Atau pilih "Input Manual" untuk masukkan Chat ID sendiri
            </div>
            
            <form id="postForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="chat_id">📱 Pilih Channel / Grup *</label>
                    <select id="chat_id" name="chat_id" required>
                        <option value="">-- Pilih Channel --</option>
                        {% for chat in chats %}
                        <option value="{{ chat.id }}">
                            {{ chat.title }} 
                            {% if chat.username %}(@{{ chat.username }}){% endif %}
                            [{{ chat.id }}]
                        </option>
                        {% endfor %}
                        <option value="manual">✏️ Input Manual</option>
                    </select>
                    <input type="text" id="manual_chat_id" name="manual_chat_id" 
                           placeholder="Contoh: -1001234567890 atau @DayyAnim" 
                           style="margin-top: 10px; display: none;">
                </div>
                
                <div class="form-group">
                    <label for="post_type">📝 Tipe Post *</label>
                    <select id="post_type" name="post_type" required>
                        <option value="text">Teks Saja</option>
                        <option value="photo">Foto + Caption</option>
                    </select>
                </div>
                
                <div class="form-group" id="imageGroup" style="display:none;">
                    <label for="image">🖼️ Upload Gambar</label>
                    <input type="file" id="image" name="image" accept="image/*">
                    <img id="imagePreview" class="preview-image" alt="Preview">
                </div>
                
                <div class="form-group">
                    <label for="message">💬 Pesan / Caption *</label>
                    <textarea id="message" name="message" placeholder="Tulis pesan kamu di sini...
Gunakan format Telegram:
**bold** untuk bold
_italic_ untuk italic
`code` untuk monospace" required></textarea>
                </div>
                
                <div class="form-group">
                    <label>🔘 Inline Buttons (Opsional)</label>
                    <div id="inlineButtonsContainer">
                        <!-- Buttons will be added here -->
                    </div>
                    <div class="button-group">
                        <button type="button" class="btn btn-add" onclick="addInlineButton()">+ Tambah Button</button>
                    </div>
                </div>
                
                <div class="loading" id="loading">
                    <div class="spinner"></div>
                    <p style="margin-top: 10px; color: #667eea;">Mengirim pesan...</p>
                </div>
                
                <button type="submit" class="btn-submit" id="submitBtn">
                    🚀 Kirim ke Telegram
                </button>
            </form>
        </div>
    </div>
    
    <script>
        let buttonCount = 0;
        
        // Toggle manual chat ID input
        document.getElementById('chat_id').addEventListener('change', function() {
            const manualInput = document.getElementById('manual_chat_id');
            if (this.value === 'manual') {
                manualInput.style.display = 'block';
                manualInput.required = true;
            } else {
                manualInput.style.display = 'none';
                manualInput.required = false;
                manualInput.value = '';
            }
        });
        
        // Toggle image field based on post type
        document.getElementById('post_type').addEventListener('change', function() {
            const imageGroup = document.getElementById('imageGroup');
            if (this.value === 'photo') {
                imageGroup.style.display = 'block';
            } else {
                imageGroup.style.display = 'none';
            }
        });
        
        // Image preview
        document.getElementById('image').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('imagePreview');
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                }
                reader.readAsDataURL(file);
            }
        });
        
        // Add inline button
        function addInlineButton() {
            buttonCount++;
            const container = document.getElementById('inlineButtonsContainer');
            const buttonHTML = `
                <div class="inline-button-item" id="button-${buttonCount}">
                    <div class="form-group" style="margin-bottom: 10px;">
                        <input type="text" name="button_text[]" placeholder="Teks Button (contoh: ✅ Peraturan)" style="margin-bottom: 10px;">
                        <input type="text" name="button_url[]" placeholder="URL (contoh: https://t.me/yourlink)">
                    </div>
                    <button type="button" class="btn btn-remove" onclick="removeButton(${buttonCount})">🗑️ Hapus</button>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', buttonHTML);
        }
        
        // Remove button
        function removeButton(id) {
            const button = document.getElementById(`button-${id}`);
            if (button) {
                button.remove();
            }
        }
        
        // Form submission
        document.getElementById('postForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const loading = document.getElementById('loading');
            const successAlert = document.getElementById('successAlert');
            const errorAlert = document.getElementById('errorAlert');
            
            // Hide alerts
            successAlert.style.display = 'none';
            errorAlert.style.display = 'none';
            
            // Show loading
            submitBtn.disabled = true;
            loading.style.display = 'block';
            
            const formData = new FormData(this);
            
            try {
                const response = await fetch('/send_message', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    successAlert.textContent = '✅ Pesan berhasil dikirim ke Telegram!';
                    successAlert.style.display = 'block';
                    
                    // Reset form
                    this.reset();
                    document.getElementById('imagePreview').style.display = 'none';
                    document.getElementById('inlineButtonsContainer').innerHTML = '';
                    buttonCount = 0;
                    
                    // Scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    errorAlert.textContent = '❌ Error: ' + result.error;
                    errorAlert.style.display = 'block';
                }
            } catch (error) {
                errorAlert.textContent = '❌ Error: ' + error.message;
                errorAlert.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                loading.style.display = 'none';
            }
        });
    </script>
</body>
</html>
'''

@app.route('/')
def index():
    # Get available chats
    chats = get_bot_chats()
    return render_template_string(HTML_TEMPLATE, chats=chats)

def get_bot_chats():
    """Get list of chats where bot is admin"""
    try:
        chats = []
        seen_chat_ids = set()
        
        # Method 1: Try to get chat info directly from known username
        known_channels = ['@DayyAnime']  # Add your channel username here
        for username in known_channels:
            try:
                response = requests.get(f'{TELEGRAM_API_URL}/getChat', params={'chat_id': username})
                result = response.json()
                if result.get('ok'):
                    chat = result['result']
                    chat_id = chat['id']
                    if chat_id not in seen_chat_ids:
                        seen_chat_ids.add(chat_id)
                        chats.append({
                            'id': chat_id,
                            'title': chat.get('title', 'Unknown'),
                            'username': chat.get('username', '')
                        })
            except:
                pass
        
        # Method 2: Get bot updates to find chats
        response = requests.get(f'{TELEGRAM_API_URL}/getUpdates')
        result = response.json()
        
        if result.get('ok'):
            for update in result.get('result', []):
                # Check for channel posts
                if 'channel_post' in update:
                    chat = update['channel_post']['chat']
                    chat_id = chat['id']
                    if chat_id not in seen_chat_ids:
                        seen_chat_ids.add(chat_id)
                        chats.append({
                            'id': chat_id,
                            'title': chat.get('title', 'Unknown'),
                            'username': chat.get('username', '')
                        })
                # Check for group messages
                elif 'message' in update:
                    chat = update['message']['chat']
                    if chat['type'] in ['group', 'supergroup', 'channel']:
                        chat_id = chat['id']
                        if chat_id not in seen_chat_ids:
                            seen_chat_ids.add(chat_id)
                            chats.append({
                                'id': chat_id,
                                'title': chat.get('title', 'Unknown'),
                                'username': chat.get('username', '')
                            })
        
        return chats
    except Exception as e:
        print(f"Error getting chats: {e}")
        return []

@app.route('/send_message', methods=['POST'])
def send_message():
    try:
        # Get chat ID from dropdown or manual input
        chat_id = request.form.get('chat_id')
        if chat_id == 'manual':
            chat_id = request.form.get('manual_chat_id')
        
        message = request.form.get('message')
        post_type = request.form.get('post_type')
        
        # Get inline buttons
        button_texts = request.form.getlist('button_text[]')
        button_urls = request.form.getlist('button_url[]')
        
        # Build inline keyboard
        inline_keyboard = []
        if button_texts and button_urls:
            # Create VERTICAL layout - each button in its own row
            for text, url in zip(button_texts, button_urls):
                if text.strip() and url.strip():
                    inline_keyboard.append([{
                        'text': text.strip(),
                        'url': url.strip()
                    }])
        
        reply_markup = None
        if inline_keyboard:
            reply_markup = {
                'inline_keyboard': inline_keyboard
            }
        
        # Send based on type
        if post_type == 'photo' and 'image' in request.files:
            image_file = request.files['image']
            if image_file.filename:
                # Send photo with caption
                files = {
                    'photo': (image_file.filename, image_file.stream, image_file.content_type)
                }
                data = {
                    'chat_id': chat_id,
                    'caption': message,
                    'parse_mode': 'Markdown'
                }
                if reply_markup:
                    data['reply_markup'] = str(reply_markup).replace("'", '"')
                
                response = requests.post(
                    f'{TELEGRAM_API_URL}/sendPhoto',
                    files=files,
                    data=data
                )
            else:
                # No image selected, send as text
                data = {
                    'chat_id': chat_id,
                    'text': message,
                    'parse_mode': 'Markdown'
                }
                if reply_markup:
                    data['reply_markup'] = str(reply_markup).replace("'", '"')
                
                response = requests.post(
                    f'{TELEGRAM_API_URL}/sendMessage',
                    json=data
                )
        else:
            # Send text message
            data = {
                'chat_id': chat_id,
                'text': message,
                'parse_mode': 'Markdown'
            }
            if reply_markup:
                data['reply_markup'] = str(reply_markup).replace("'", '"')
            
            response = requests.post(
                f'{TELEGRAM_API_URL}/sendMessage',
                json=data
            )
        
        result = response.json()
        
        if result.get('ok'):
            return jsonify({'success': True, 'message': 'Pesan berhasil dikirim!'})
        else:
            error_msg = result.get('description', 'Unknown error')
            return jsonify({'success': False, 'error': error_msg})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    print("=" * 60)
    print("🎌 DAYY ANIM - TELEGRAM POST MANAGER")
    print("=" * 60)
    print("✅ Server berjalan di: http://127.0.0.1:5000")
    print("🔑 Bot Token:", BOT_TOKEN[:20] + "...")
    print("\n⚠️  PENTING:")
    print("1. Pastikan bot sudah ditambahkan sebagai admin di channel")
    print("2. Gunakan Chat ID format: -100xxxxxxxxxx atau @username")
    print("3. Token ini sudah bocor, segera revoke setelah testing!")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)

# For Vercel serverless deployment
# Vercel will use the 'app' object directly
