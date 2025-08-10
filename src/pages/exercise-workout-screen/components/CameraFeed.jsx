import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CameraFeed = ({
  isActive = false,
  onToggleCamera,
  showPoseOverlay = true,
  onFormFeedback, setShowPoseOverlay
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [posePoints, setPosePoints] = useState([]);
  const [formFeedback, setFormFeedback] = useState(null);

  // Mock pose estimation points for demonstration
  const mockPosePoints = [
  { x: 320, y: 180, confidence: 0.9, label: 'nose' },
  { x: 300, y: 200, confidence: 0.8, label: 'left_shoulder' },
  { x: 340, y: 200, confidence: 0.8, label: 'right_shoulder' },
  { x: 280, y: 250, confidence: 0.7, label: 'left_elbow' },
  { x: 360, y: 250, confidence: 0.7, label: 'right_elbow' },
  { x: 260, y: 300, confidence: 0.6, label: 'left_wrist' },
  { x: 380, y: 300, confidence: 0.6, label: 'right_wrist' },
  { x: 290, y: 350, confidence: 0.8, label: 'left_hip' },
  { x: 350, y: 350, confidence: 0.8, label: 'right_hip' },
  { x: 280, y: 450, confidence: 0.7, label: 'left_knee' },
  { x: 360, y: 450, confidence: 0.7, label: 'right_knee' },
  { x: 270, y: 550, confidence: 0.6, label: 'left_ankle' },
  { x: 370, y: 550, confidence: 0.6, label: 'right_ankle' }];


  const mockFeedbackMessages = [
  { message: "Great form! Keep it up!", type: "success" },
  { message: "Lower your squat position", type: "warning" },
  { message: "Keep your back straight", type: "warning" },
  { message: "Perfect push-up form!", type: "success" },
  { message: "Slow down the movement", type: "info" }];


  useEffect(() => {
    if (isActive) {
      startCamera();
      // Simulate pose detection updates
      const poseInterval = setInterval(() => {
        if (showPoseOverlay) {
          setPosePoints(mockPosePoints?.map((point) => ({
            ...point,
            x: point?.x + (Math.random() - 0.5) * 10,
            y: point?.y + (Math.random() - 0.5) * 10
          })));
        }
      }, 100);

      // Simulate form feedback
      const feedbackInterval = setInterval(() => {
        const randomFeedback = mockFeedbackMessages?.[Math.floor(Math.random() * mockFeedbackMessages?.length)];
        setFormFeedback(randomFeedback);
        if (onFormFeedback) onFormFeedback(randomFeedback);

        setTimeout(() => setFormFeedback(null), 3000);
      }, 8000);

      return () => {
        clearInterval(poseInterval);
        clearInterval(feedbackInterval);
      };
    } else {
      stopCamera();
    }
  }, [isActive, showPoseOverlay]);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices?.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef?.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.');
      console.error('Camera error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream?.getTracks()?.forEach((track) => track?.stop());
      setStream(null);
    }
    setPosePoints([]);
    setFormFeedback(null);
  };

  const drawPoseOverlay = () => {
    if (!canvasRef?.current || !videoRef?.current || !showPoseOverlay) return;

    const canvas = canvasRef?.current;
    const video = videoRef?.current;
    const ctx = canvas?.getContext('2d');

    canvas.width = video?.videoWidth || 640;
    canvas.height = video?.videoHeight || 480;

    ctx?.clearRect(0, 0, canvas?.width, canvas?.height);

    // Draw pose points
    posePoints?.forEach((point) => {
      if (point?.confidence > 0.5) {
        ctx?.beginPath();
        ctx?.arc(point?.x, point?.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = point?.confidence > 0.7 ? '#10B981' : '#F59E0B';
        ctx?.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx?.stroke();
      }
    });

    // Draw skeleton connections
    const connections = [
    ['left_shoulder', 'right_shoulder'],
    ['left_shoulder', 'left_elbow'],
    ['left_elbow', 'left_wrist'],
    ['right_shoulder', 'right_elbow'],
    ['right_elbow', 'right_wrist'],
    ['left_shoulder', 'left_hip'],
    ['right_shoulder', 'right_hip'],
    ['left_hip', 'right_hip'],
    ['left_hip', 'left_knee'],
    ['left_knee', 'left_ankle'],
    ['right_hip', 'right_knee'],
    ['right_knee', 'right_ankle']];


    connections?.forEach(([start, end]) => {
      const startPoint = posePoints?.find((p) => p?.label === start);
      const endPoint = posePoints?.find((p) => p?.label === end);

      if (startPoint && endPoint && startPoint?.confidence > 0.5 && endPoint?.confidence > 0.5) {
        ctx?.beginPath();
        ctx?.moveTo(startPoint?.x, startPoint?.y);
        ctx?.lineTo(endPoint?.x, endPoint?.y);
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx?.stroke();
      }
    });
  };

  useEffect(() => {
    if (isActive && showPoseOverlay) {
      const interval = setInterval(drawPoseOverlay, 100);
      return () => clearInterval(interval);
    }
  }, [isActive, showPoseOverlay, posePoints]);

  if (error) {
    return (
      <div className="relative w-full h-full bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <Icon name="CameraOff" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Camera Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location?.reload()} variant="outline">
            Retry Camera Access
          </Button>
        </div>
      </div>);

  }

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* Loading State */}
      {isLoading &&
      <div className="absolute inset-0 bg-muted rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Starting camera...</p>
          </div>
        </div>
      }
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        onLoadedMetadata={drawPoseOverlay} />

      {/* Pose Overlay Canvas */}
      {showPoseOverlay &&
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none" />

      }
      {/* Camera Controls Overlay */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setShowPoseOverlay(!showPoseOverlay)}
          className="bg-black/50 hover:bg-black/70 text-white border-white/20">

          <Icon name={showPoseOverlay ? "Eye" : "EyeOff"} size={18} />
        </Button>
        
        <Button
          variant="secondary"
          size="icon"
          onClick={onToggleCamera}
          className="bg-black/50 hover:bg-black/70 text-white border-white/20">

          <Icon name={isActive ? "CameraOff" : "Camera"} size={18} />
        </Button>
      </div>
      {/* Form Feedback Overlay */}
      {formFeedback &&
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-lg text-white font-medium text-center max-w-xs animate-spring ${
      formFeedback?.type === 'success' ? 'bg-success' :
      formFeedback?.type === 'warning' ? 'bg-warning' : 'bg-primary'}`
      }>
          {formFeedback?.message}
        </div>
      }
      {/* Camera Status Indicator */}
      <div className="absolute bottom-4 left-4">
        <div className="flex items-center space-x-2 bg-black/50 rounded-full px-3 py-1">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`}></div>
          <span className="text-white text-sm font-medium">
            {isActive ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
      {/* Placeholder when camera is off */}
      {!isActive && !isLoading &&
      <div className="absolute inset-0 bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center p-6">
            <Icon name="Camera" size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Camera Ready</h3>
            <p className="text-muted-foreground mb-4">Start your workout to begin pose tracking</p>
            <Button onClick={onToggleCamera} variant="default">
              <Icon name="Play" size={18} className="mr-2" />
              Start Camera
            </Button>
          </div>
        </div>
      }
    </div>);

};

export default CameraFeed;