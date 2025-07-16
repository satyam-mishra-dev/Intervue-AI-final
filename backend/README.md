# Eye Tracking Backend

This directory contains the Python backend for eye tracking functionality in the Prepwise interview platform.

## Features

- Real-time eye tracking using OpenCV
- WebSocket communication with frontend
- Cheating detection (looking away from screen)
- Live video feed streaming
- Automatic logging of cheating attempts

## Setup

### Prerequisites

- Python 3.8 or higher
- Webcam access
- pip (Python package installer)

### Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Run the setup script:**
   ```bash
   python setup.py
   ```
   
   This will:
   - Check Python version
   - Install required dependencies
   - Test imports
   - Verify webcam access

3. **Manual installation (if setup script fails):**
   ```bash
   pip install -r requirements.txt
   ```

### Running the Backend

#### Option 1: Automatic (Recommended)
The backend will start automatically when you begin an interview in the frontend.

#### Option 2: Manual
```bash
python eye_gaze.py
```

The backend will start on `http://localhost:5000`

## API Endpoints

- `GET /api/health` - Check if the backend is running
- `POST /api/stop-python` - Stop the eye tracking service

## WebSocket Events

- `video_frame` - Streams base64 encoded video frames
- `alert` - Sends cheating detection alerts

## Troubleshooting

### Common Issues

1. **"Could not open webcam"**
   - Ensure your webcam is not being used by another application
   - Check webcam permissions in your OS
   - Try running `python setup.py` to verify webcam access

2. **"Failed to load cascade classifiers"**
   - This is usually a temporary issue
   - Restart the backend
   - Ensure OpenCV is properly installed

3. **Connection refused errors**
   - Make sure no other application is using port 5000
   - Check if the backend is already running
   - Restart the backend

4. **Import errors**
   - Run `pip install -r requirements.txt`
   - Ensure you're using Python 3.8+
   - Check if you're in the correct virtual environment

### Windows Specific

- Use `python` instead of `python3`
- Ensure Python is in your PATH
- Run PowerShell as Administrator if you encounter permission issues

### macOS Specific

- You may need to grant camera permissions to Terminal/VS Code
- Use `python3` command
- Install Xcode command line tools if needed

### Linux Specific

- Install system dependencies: `sudo apt-get install python3-opencv`
- Ensure webcam permissions: `sudo usermod -a -G video $USER`

## Configuration

The eye tracking sensitivity can be adjusted in `eye_gaze.py`:

- `frame_counter > 15` - Number of frames before triggering alert
- `scaleFactor=1.1` - Face detection sensitivity
- `minNeighbors=5` - Face detection accuracy

## Logs

Cheating attempts are logged to `cheating_log.txt` in the project root.

## Security Notes

- The backend runs on localhost only
- No sensitive data is transmitted
- Video frames are base64 encoded and sent over WebSocket
- All processing happens locally

## Performance

- Video resolution: 250x125 pixels (optimized for performance)
- Frame rate: ~10 FPS
- Memory usage: ~50-100MB
- CPU usage: Moderate (depends on hardware)

## Development

To modify the eye tracking algorithm:

1. Edit the `process_eye_region` method in `eye_gaze.py`
2. Adjust detection parameters
3. Test with different lighting conditions
4. Monitor the cheating log for false positives

## Support

If you encounter issues:

1. Check the console output for error messages
2. Verify your Python environment
3. Test webcam access independently
4. Check the troubleshooting section above 