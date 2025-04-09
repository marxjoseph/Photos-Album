import uuid
from flask import Flask, jsonify, render_template, request
import sqlite3
import os

app = Flask(__name__)

def init_db():
    conn = sqlite3.connect('photos.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS photos (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            FileName TEXT,
            Year INTEGER,
            Month TEXT,
            Location TEXT,
            Info TEXT
        )
    ''')
    conn.commit()
    conn.close()

def init_uploads():
    if not os.path.exists('static/uploads'):
        os.makedirs('static/uploads')

@app.route('/api/load', methods=['GET'])
def load_photos():
    conn = sqlite3.connect('photos.db')
    conn.row_factory = sqlite3.Row 
    cursor = conn.cursor()
    cursor.execute('''SELECT * FROM photos LIMIT 45''')
    rows = cursor.fetchall()
    photos = []
    for row in rows:
        photo = {
            'ID': row['ID'],
            'FileName': row['FileName'],
            'Year': row['Year'],
            'Month': row['Month'],
            'Location': row['Location'],
            'Info': row['Info']
        }
        photos.append(photo)
    conn.close()
    return jsonify(photos)

@app.route('/api/upload', methods=['POST'])
def upload_photo():
    if 'photo' not in request.files:
        return jsonify({'error': 'No photo provided'}), 400
    
    photo = request.files['photo']
    if photo.filename == '':
        return jsonify({'error': 'No photo selected'}), 400
    
    year = request.form.get('year')
    if year == "":
        return jsonify({'error': 'No year selected'}), 400
    try:
        year = int(year)
    except ValueError:
        return jsonify({'error': 'Year must be a number'}), 400
    
    location = request.form.get('location')
    if location == "":
        return jsonify({'error': 'No location selected'}), 400
    
    month = request.form.get('month')
    text = request.form.get('text')

    photo_id = str(uuid.uuid4())
    file_extension = os.path.splitext(photo.filename)[1]
    new_filename = f"{photo_id}{file_extension}"

    photo.save(os.path.join('static/uploads', new_filename))

    conn = sqlite3.connect('photos.db')
    cursor = conn.cursor()
    cursor.execute('''INSERT INTO photos (filename, year, month, location, info) VALUES (?, ?, ?, ?, ?)''', 
                   (new_filename, year, month, location, text))
    conn.commit()
    conn.close()

    return jsonify({
        'id': photo_id,
        'filename': new_filename,
        'year': year,
        'location': location
    }), 201

@app.route('/api/search', methods=['POST'])
def search_photos():
    year = request.form.get('year')
    try:
        if not (year == ""):
            year = int(year)
    except ValueError:
        return jsonify({'error': 'Year must be a number'}), 400
    
    location = request.form.get('location')
    month = request.form.get('month')
    query = "SELECT * FROM photos WHERE 1=1"
    query_values = []
    if year:
        query += " AND year = ?"
        query_values.append(year)
    if location:
        query += " AND location = ?"
        query_values.append(location)
    if month:
        query += " AND month = ?"
        query_values.append(month)

    conn = sqlite3.connect('photos.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(query, query_values)
    rows = cursor.fetchall()
    photos = []
    for row in rows:
        photo = {
            'ID': row['ID'],
            'FileName': row['FileName'],
            'Year': row['Year'],
            'Month': row['Month'],
            'Location': row['Location'],
            'Info': row['Info']
        }
        photos.append(photo)
    conn.close()
    return jsonify(photos)

@app.route('/api/edit', methods=['PATCH'])
def edit_photo():
    year = request.form.get('year')
    try:
        if not (year == ""):
            year = int(year)
    except ValueError:
        return jsonify({'error': 'Year must be a number'}), 400
    
    location = request.form.get('location')
    month = request.form.get('month')
    text = request.form.get('text')
    id = request.form.get('ID')
    conn = sqlite3.connect('photos.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("UPDATE photos SET year = ?, location = ?, month = ?, Info = ? WHERE ID = ?", (year, location, month, text, id))
    conn.commit()
    conn.close()
    return jsonify({'success': 'Values Changed'}), 200

@app.route('/api/delete/<photo>', methods=['DELETE'])
def delete_photo(photo):
    if not photo:
        return jsonify({'error': 'No photo provided'}), 400
    conn = sqlite3.connect('photos.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM photos WHERE ID = ?", (photo,))
    row = cursor.fetchone()
    if row is None:
        return jsonify({'error': 'Photo not found'}), 404
    cursor.execute("DELETE FROM photos WHERE FileName = ?", (row['FileName'],))
    conn.commit()
    conn.close()
    print(os.path.join('static/uploads', row['FileName']))
    if os.path.exists(os.path.join('static/uploads', row['FileName'])):
        os.remove(os.path.join('static/uploads', row['FileName']))
    else:
        return jsonify({'error': 'File not found'}), 404
    return jsonify({'success': 'Photo deleted'}), 200

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    init_db()
    init_uploads()
    app.run(port=8080, debug=True)
