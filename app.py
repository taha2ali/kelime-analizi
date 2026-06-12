"""
Flask Backend - Kelime Analiz Sistemi
Bu uygulama TXT dosyalarındaki kelimeleri analiz eder ve Heap yapısı ile sıralar.
"""

from flask import Flask, render_template, request, jsonify
import os
import re
from heap import CustomHeap
from werkzeug.utils import secure_filename

app = Flask(__name__)

app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
ALLOWED_EXTENSIONS = {'txt'}

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def clean_word(word):
    """
    Kelimeyi temizle: noktalama işaretlerini kaldır, küçük harfe çevir.
    Sadece harf içeren kelimeler kabul edilir (Türkçe karakterler dahil).
    """
    cleaned = re.sub(r'[^a-zA-ZğüşıöçĞÜŞİÖÇ]', '', word)
    return cleaned.lower()


def process_text_file(filepath):
    """
    TXT dosyasını oku ve kelimeleri Heap'e ekle.
    Dosyadan okunan her kelime için heap güncellenir.
    """
    heap = CustomHeap()

    encodings = ['utf-8', 'latin-1', 'cp1254', 'iso-8859-9']
    content = None

    for encoding in encodings:
        try:
            with open(filepath, 'r', encoding=encoding) as f:
                content = f.read()
            break
        except UnicodeDecodeError:
            continue

    if content is None:
        return None, "Dosya okunamadı. Encoding hatası."

    words = content.split()

    for word in words:
        cleaned = clean_word(word)
        # Boş veya tek karakterli kelimeleri atla
        if cleaned and len(cleaned) > 1:
            heap.insert(cleaned)
    
    # ÖNEMLİ: Tüm kelimeler eklendikten sonra heap'i yeniden inşa et
    # Bu, heap property'nin tam olarak korunmasını garanti eder
    heap.rebuild_heap()

    return heap, None


def process_text_path(filepath):
    """
    Komut satırından verilen dosya yolu ile çalışma (CLI modu).
    Çıktıyı A'dan Z'ye, aynı harf için en fazla geçenden en az geçene yazdırır.
    """
    heap, error = process_text_file(filepath)
    if error:
        print(f"Hata: {error}")
        return

    sorted_words = heap.get_all_words()

    current_letter = None
    for item in sorted_words:
        if item['first_letter'] != current_letter:
            current_letter = item['first_letter']
            print(f"\n--- {current_letter.upper()} ---")
        print(f"  {item['word']}: {item['count']}")


# ------------------------------------------------------------------ #
#  Flask Routes
# ------------------------------------------------------------------ #

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'Dosya bulunamadı'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'Dosya seçilmedi'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Sadece .txt dosyaları yüklenebilir'}), 400

    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        heap, error = process_text_file(filepath)

        if error:
            return jsonify({'error': error}), 500

        statistics = heap.get_statistics()
        sorted_words = heap.get_all_words()
        heap_structure = heap.get_heap_structure()

        # Harf bazlı gruplandırma
        letter_groups = {}
        for word_data in sorted_words:
            letter = word_data['first_letter']
            if letter not in letter_groups:
                letter_groups[letter] = []
            letter_groups[letter].append(word_data)

        top_10_words = sorted_words[:10]

        letter_stats = {
            letter: {
                'count': len(words),
                'total_occurrences': sum(w['count'] for w in words)
            }
            for letter, words in letter_groups.items()
        }

        os.remove(filepath)

        return jsonify({
            'success': True,
            'statistics': statistics,
            'words': sorted_words,
            'heap_structure': heap_structure,
            'letter_groups': letter_groups,
            'top_10_words': top_10_words,
            'letter_stats': letter_stats
        })

    except Exception as e:
        return jsonify({'error': f'Beklenmeyen hata: {str(e)}'}), 500


@app.route('/search', methods=['POST'])
def search_word():
    data = request.get_json()
    search_term = data.get('search_term', '').lower()
    words = data.get('words', [])

    if not search_term:
        return jsonify({'results': words})

    results = [w for w in words if search_term in w['word']]
    return jsonify({'results': results})


@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})


# ------------------------------------------------------------------ #
#  CLI modu: python app.py dosya.txt
# ------------------------------------------------------------------ #

if __name__ == '__main__':
    import sys

    if len(sys.argv) == 2:
        # Komut satırından dosya yolu verildi
        txt_path = sys.argv[1]
        if not os.path.isfile(txt_path):
            print(f"Hata: '{txt_path}' dosyası bulunamadı.")
            sys.exit(1)
        process_text_path(txt_path)
    else:
        # Web sunucusu modu
        print("=" * 60)
        print("Kelime Analiz Sistemi Baslatiliyor...")
        print("=" * 60)
        print("Kullanim (CLI): python app.py dosya.txt")
        print("Web modu      : http://localhost:5000")
        print("=" * 60)
        app.run(debug=True, host='0.0.0.0', port=5000)
