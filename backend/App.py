# app.py (Flask Backend)
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from pymongo import MongoClient
from bson.objectid import ObjectId
import subprocess
import threading
import base64
import eventlet
eventlet.monkey_patch()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# MongoDB setup
client = MongoClient('mongodb://localhost:27017/')
db = client['livestream_app']
overlays_collection = db['overlays']

# Store active streams
active_streams = {}

# RTSP to WebSocket streaming
def stream_rtsp_to_websocket(rtsp_url, sid):
    try:
        # FFmpeg command to convert RTSP to MJPEG and output to stdout
        cmd = [
            'ffmpeg',
            '-i', rtsp_url,
            '-f', 'mjpeg',
            '-qscale', '2',
            '-r', '10',
            '-'
        ]
        
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, bufsize=0)
        active_streams[sid] = process
        
        while True:
            if sid not in active_streams:
                break
                
            # Read the output from ffmpeg
            data = process.stdout.read(1024 * 1024)  # Read up to 1MB
            if not data:
                break
                
            # Convert to base64 for WebSocket transmission
            encoded = base64.b64encode(data).decode('utf-8')
            socketio.emit('video_frame', {'data': encoded}, room=sid)
            
    except Exception as e:
        print(f"Streaming error: {e}")
        socketio.emit('stream_error', {'message': str(e)}, room=sid)
    finally:
        if sid in active_streams:
            del active_streams[sid]
        if process:
            process.terminate()

# API Routes
@app.route('/api/overlays', methods=['GET'])
def get_overlays():
    try:
        overlays = list(overlays_collection.find({}))
        for overlay in overlays:
            overlay['_id'] = str(overlay['_id'])
        return jsonify(overlays)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/overlays', methods=['POST'])
def create_overlay():
    try:
        data = request.get_json()
        result = overlays_collection.insert_one(data)
        return jsonify({'_id': str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/overlays/<overlay_id>', methods=['PUT'])
def update_overlay(overlay_id):
    try:
        data = request.get_json()
        result = overlays_collection.update_one(
            {'_id': ObjectId(overlay_id)},
            {'$set': data}
        )
        if result.modified_count:
            return jsonify({'message': 'Overlay updated successfully'})
        return jsonify({'error': 'Overlay not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/overlays/<overlay_id>', methods=['DELETE'])
def delete_overlay(overlay_id):
    try:
        result = overlays_collection.delete_one({'_id': ObjectId(overlay_id)})
        if result.deleted_count:
            return jsonify({'message': 'Overlay deleted successfully'})
        return jsonify({'error': 'Overlay not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# SocketIO events
@socketio.on('connect')
def handle_connect():
    print('Client connected:', request.sid)

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected:', request.sid)
    if request.sid in active_streams:
        active_streams[request.sid].terminate()
        del active_streams[request.sid]

@socketio.on('start_stream')
def handle_start_stream(data):
    rtsp_url = data.get('rtsp_url')
    if not rtsp_url:
        emit('stream_error', {'message': 'RTSP URL is required'})
        return
    
    # Start streaming in a separate thread
    thread = threading.Thread(
        target=stream_rtsp_to_websocket,
        args=(rtsp_url, request.sid)
    )
    thread.daemon = True
    thread.start()

@socketio.on('stop_stream')
def handle_stop_stream():
    if request.sid in active_streams:
        active_streams[request.sid].terminate()
        del active_streams[request.sid]
        emit('stream_stopped', {'message': 'Stream stopped'})

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)