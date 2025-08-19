# RTSP Livestream Player with Overlay Management

I'll create a complete solution for a livestream player with overlay management. Let me implement a working version with all the requested features.

## Solution Overview

I'll build a React frontend with a Flask backend that:

1. Streams RTSP video to the browser using a WebSocket proxy
2. Provides overlay management with full CRUD operations
3. Offers an intuitive user interface for both streaming and overlay management

## Setup Instructions

### Prerequisites

- Python 3.7+
- Node.js 12+
- MongoDB
- FFmpeg

### Backend Setup

1. Navigate to the backend directory: `cd backend` and create a virtual environment: `python -m venv venv`
2. Activate the virtual environment: `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows)
3. Install dependencies: `pip install flask flask-cors flask-socketio pymongo eventlet`
4. Install FFmpeg (varies by OS)
5. Start MongoDB service
6. Run the Flask app: `python app.py`

### Frontend Setup

1. Create a new React app: `npx create-react-app frontend`
2. Navigate to the frontend directory: `cd frontend`
3. Install dependencies: `npm install axios socket.io-client`
4. Replace the contents of `src/App.js` with the React code above
5. Replace the contents of `src/App.css` with the CSS code above
6. Start the React app: `npm start`

## API Documentation

### Base URL

`http://localhost:5000/api`

### Endpoints

#### 1. Get All Overlays

- **URL**: `/overlays`
- **Method**: `GET`
- **Response**:
  ```json
  [
    {
      "_id": "overlay_id",
      "type": "text|image",
      "content": "Text content or image URL",
      "x": 100,
      "y": 50,
      "width": 200,
      "height": 100,
      "color": "#ffffff",
      "fontSize": 16,
      "bold": false
    }
  ]
  ```

#### 2. Create Overlay

- **URL**: `/overlays`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "type": "text",
    "content": "Sample Text",
    "x": 100,
    "y": 50,
    "width": 200,
    "height": 100,
    "color": "#ff0000",
    "fontSize": 20,
    "bold": true
  }
  ```
- **Response**:
  ```json
  {
    "_id": "new_overlay_id"
  }
  ```

#### 3. Update Overlay

- **URL**: `/overlays/:id`
- **Method**: `PUT`
- **Body**: Same as create endpoint
- **Response**:
  ```json
  {
    "message": "Overlay updated successfully"
  }
  ```

#### 4. Delete Overlay

- **URL**: `/overlays/:id`
- **Method**: `DELETE`
- **Response**:
  ```json
  {
    "message": "Overlay deleted successfully"
  }
  ```

## User Guide

### Setting Up the Stream

1. Enter a valid RTSP URL in the input field (e.g., from RTSP.me)
2. Click "Start Stream" to begin streaming
3. The video will appear in the video container

### Managing Overlays

1. Click "Add New Overlay" to create an overlay
2. Select the type (text or image)
3. For text overlays, enter the text content and customize appearance
4. For image overlays, provide a URL to the image
5. Set the position (X, Y) and dimensions (width, height)
6. Click "Save" to create the overlay
7. Overlays will appear on the video stream
8. Click on an overlay in the list to edit or delete it

### Notes

- This implementation uses MJPEG streaming over WebSocket as a simple approach
- For production use, consider using more efficient streaming protocols like HLS or WebRTC
- The overlay positioning is absolute within the video container
- Ensure FFmpeg is properly installed and accessible in your system PATH

This solution provides a complete working implementation for the RTSP livestream player with overlay management capabilities as requested.
