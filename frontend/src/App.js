// App.js (React Frontend)
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import "./App.css";

function App() {
  const [rtspUrl, setRtspUrl] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [overlays, setOverlays] = useState([]);
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [showOverlayForm, setShowOverlayForm] = useState(false);
  const [editingOverlay, setEditingOverlay] = useState(null);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchOverlays();

    // Initialize Socket.io connection
    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("video_frame", (data) => {
      if (videoRef.current) {
        videoRef.current.src = "data:image/jpeg;base64," + data.data;
      }
    });

    socketRef.current.on("stream_error", (data) => {
      setError(data.message);
      setStreaming(false);
    });

    socketRef.current.on("stream_stopped", () => {
      setStreaming(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchOverlays = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/overlays");
      setOverlays(response.data);
    } catch (error) {
      console.error("Error fetching overlays:", error);
      setError("Failed to fetch overlays");
    }
  };

  const startStream = () => {
    if (!rtspUrl) {
      setError("Please enter a valid RTSP URL");
      return;
    }

    setError("");
    setStreaming(true);
    socketRef.current.emit("start_stream", { rtsp_url: rtspUrl });
  };

  const stopStream = () => {
    socketRef.current.emit("stop_stream");
    setStreaming(false);
  };

  const handleCreateOverlay = async (overlayData) => {
    try {
      await axios.post("http://localhost:5000/api/overlays", overlayData);
      fetchOverlays();
      setShowOverlayForm(false);
      setError("");
    } catch (error) {
      console.error("Error creating overlay:", error);
      setError("Failed to create overlay");
    }
  };

  const handleUpdateOverlay = async (overlayId, overlayData) => {
    try {
      await axios.put(
        `http://localhost:5000/api/overlays/${overlayId}`,
        overlayData
      );
      fetchOverlays();
      setEditingOverlay(null);
      setError("");
    } catch (error) {
      console.error("Error updating overlay:", error);
      setError("Failed to update overlay");
    }
  };

  const handleDeleteOverlay = async (overlayId) => {
    try {
      await axios.delete(`http://localhost:5000/api/overlays/${overlayId}`);
      fetchOverlays();
      setError("");
    } catch (error) {
      console.error("Error deleting overlay:", error);
      setError("Failed to delete overlay");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>RTSP Livestream Player</h1>
      </header>

      <div className="container">
        {error && <div className="error-message">{error}</div>}

        <div className="stream-controls">
          <input
            type="text"
            placeholder="Enter RTSP URL (e.g., rtsp://example.com/stream)"
            value={rtspUrl}
            onChange={(e) => setRtspUrl(e.target.value)}
            disabled={streaming}
          />
          {!streaming ? (
            <button onClick={startStream}>Start Stream</button>
          ) : (
            <button onClick={stopStream}>Stop Stream</button>
          )}
        </div>

        <div className="video-container">
          <img ref={videoRef} alt="Live Stream" className="video-frame" />

          {overlays.map((overlay) => (
            <div
              key={overlay._id}
              className="overlay"
              style={{
                position: "absolute",
                left: `${overlay.x}px`,
                top: `${overlay.y}px`,
                width: `${overlay.width}px`,
                height: `${overlay.height}px`,
                border:
                  selectedOverlay === overlay._id ? "2px solid red" : "none",
              }}
              onClick={() => setSelectedOverlay(overlay._id)}
            >
              {overlay.type === "text" ? (
                <span
                  style={{
                    color: overlay.color || "#fff",
                    fontSize: `${overlay.fontSize || 16}px`,
                    fontWeight: overlay.bold ? "bold" : "normal",
                  }}
                >
                  {overlay.content}
                </span>
              ) : (
                <img
                  src={overlay.content}
                  alt="Overlay"
                  style={{ width: "100%", height: "100%" }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="overlay-management">
          <h2>Overlay Management</h2>
          <button onClick={() => setShowOverlayForm(true)}>
            Add New Overlay
          </button>

          {showOverlayForm && (
            <OverlayForm
              onSubmit={handleCreateOverlay}
              onCancel={() => setShowOverlayForm(false)}
            />
          )}

          {editingOverlay && (
            <OverlayForm
              overlay={editingOverlay}
              onSubmit={(data) => handleUpdateOverlay(editingOverlay._id, data)}
              onCancel={() => setEditingOverlay(null)}
            />
          )}

          <div className="overlay-list">
            <h3>Saved Overlays</h3>
            {overlays.map((overlay) => (
              <div key={overlay._id} className="overlay-item">
                <span>
                  {overlay.type}: {overlay.content}
                </span>
                <div>
                  <button onClick={() => setEditingOverlay(overlay)}>
                    Edit
                  </button>
                  <button onClick={() => handleDeleteOverlay(overlay._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverlayForm({ overlay, onSubmit, onCancel }) {
  const [type, setType] = useState(overlay?.type || "text");
  const [content, setContent] = useState(overlay?.content || "");
  const [x, setX] = useState(overlay?.x || 0);
  const [y, setY] = useState(overlay?.y || 0);
  const [width, setWidth] = useState(overlay?.width || 100);
  const [height, setHeight] = useState(overlay?.height || 50);
  const [color, setColor] = useState(overlay?.color || "#ffffff");
  const [fontSize, setFontSize] = useState(overlay?.fontSize || 16);
  const [bold, setBold] = useState(overlay?.bold || false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const overlayData = { type, content, x, y, width, height };

    if (type === "text") {
      overlayData.color = color;
      overlayData.fontSize = fontSize;
      overlayData.bold = bold;
    }

    onSubmit(overlayData);
  };

  return (
    <form className="overlay-form" onSubmit={handleSubmit}>
      <h3>{overlay ? "Edit" : "Add"} Overlay</h3>

      <div className="form-group">
        <label>Type:</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="text">Text</option>
          <option value="image">Image</option>
        </select>
      </div>

      <div className="form-group">
        <label>Content:</label>
        {type === "text" ? (
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        ) : (
          <input
            type="url"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Image URL"
            required
          />
        )}
      </div>

      {type === "text" && (
        <>
          <div className="form-group">
            <label>Text Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Font Size:</label>
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              min="8"
              max="72"
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={bold}
                onChange={(e) => setBold(e.target.checked)}
              />
              Bold
            </label>
          </div>
        </>
      )}

      <div className="form-group">
        <label>Position X:</label>
        <input
          type="number"
          value={x}
          onChange={(e) => setX(parseInt(e.target.value))}
          required
        />
      </div>

      <div className="form-group">
        <label>Position Y:</label>
        <input
          type="number"
          value={y}
          onChange={(e) => setY(parseInt(e.target.value))}
          required
        />
      </div>

      <div className="form-group">
        <label>Width:</label>
        <input
          type="number"
          value={width}
          onChange={(e) => setWidth(parseInt(e.target.value))}
          required
        />
      </div>

      <div className="form-group">
        <label>Height:</label>
        <input
          type="number"
          value={height}
          onChange={(e) => setHeight(parseInt(e.target.value))}
          required
        />
      </div>

      <div className="form-actions">
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default App;
