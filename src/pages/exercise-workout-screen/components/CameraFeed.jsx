import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CameraFeed = ({
  isActive = false,
  onToggleCamera,
  showPoseOverlay = true,
  onFormFeedback, 
  setShowPoseOverlay,
  onPushupCount,
  onPostureChange,
  selectedExercise,
  onPlankTimeUpdate
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseDetectionRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [poseResults, setPoseResults] = useState(null);
  const [formFeedback, setFormFeedback] = useState(null);
  const [pushupCount, setPushupCount] = useState(0);
  const [postureStatus, setPostureStatus] = useState('unknown');
  const [isPoseDetectionReady, setIsPoseDetectionReady] = useState(false);

  // Normalize exercise name
  const isPushUpsSelected = (() => {
    const name = (selectedExercise?.name || '').toLowerCase().replace(/[^a-z]/g, '');
    return name.includes('push');
  })();
  const isPlankSelected = (() => {
    const name = (selectedExercise?.name || '').toLowerCase().replace(/[^a-z]/g, '');
    return name.includes('plank');
  })();
  const isSquatSelected = (() => {
    const name = (selectedExercise?.name || '').toLowerCase().replace(/[^a-z]/g, '');
    return name.includes('squat');
  })();
  const isLungesSelected = (() => {
    const name = (selectedExercise?.name || '').toLowerCase().replace(/[^a-z]/g, '');
    return name.includes('lunge');
  })();
  const isMountainClimbersSelected = (() => {
    const name = (selectedExercise?.name || '').toLowerCase().replace(/[^a-z]/g, '');
    return name.includes('mountain') || name.includes('climber');
  })();
  // Add Burpees detection
  const isBurpeesSelected = (() => {
    const name = (selectedExercise?.name || '').toLowerCase().replace(/[^a-z]/g, '');
    return name.includes('burpee');
  })();

  // Initialize MediaPipe pose detection
  const initializePoseDetection = async () => {
    try {
      // Only initialize for supported exercises
      if (!isPushUpsSelected && !isPlankSelected && !isSquatSelected && !isLungesSelected && !isBurpeesSelected) {
        return;
      }

      if (!poseDetectionRef.current) {
        // Dynamic import to avoid loading MediaPipe for other exercises
        const { default: PoseDetectionUtils } = await import('../../../utils/poseDetection');
        poseDetectionRef.current = new PoseDetectionUtils();
        poseDetectionRef.current.setExerciseMode(
          isPlankSelected ? 'plank' :
          isSquatSelected ? 'squats' :
          isLungesSelected ? 'lunges' :
          isBurpeesSelected ? 'burpees' :
          'pushups'
        );
        // Set up callbacks
        poseDetectionRef.current.setCallbacks({
          onPushupCount: (count) => {
            setPushupCount(count);
            if (onPushupCount) {
              onPushupCount(count);
            }
          },
          onPostureChange: (status, landmarks) => {
            setPostureStatus(status);
            if (onPostureChange) {
              onPostureChange(status, landmarks);
            }
          },
          onFormFeedback: (feedback) => {
            setFormFeedback(feedback);
            if (onFormFeedback) {
              onFormFeedback(feedback);
            }
            // Auto-hide feedback after 3 seconds
            setTimeout(() => setFormFeedback(null), 3000);
          },
          onTimeUpdate: (sec) => {
            if (onPlankTimeUpdate) onPlankTimeUpdate(sec);
            setPoseResults(poseDetectionRef.current?.getLastResults() || null);
          }
        });
        const initialized = await poseDetectionRef.current.initialize();
        if (!initialized) {
          console.warn('Pose detection not available, falling back to basic mode');
        } else {
          setIsPoseDetectionReady(true);
        }
      }
    } catch (error) {
      console.error('Error initializing pose detection:', error);
    }
  };


  useEffect(() => {
    console.log('🎬 isActive changed:', isActive);
    if (isActive) {
      startCamera();
      initializePoseDetection();
    } else {
      stopCamera();
    }
  }, [isActive]);

  // Process video frames for pose detection
  useEffect(() => {
    console.log('🔄 Processing effect triggered:', {
      isActive,
      hasPoseDetection: !!poseDetectionRef.current,
      hasVideo: !!videoRef.current,
      exercise: selectedExercise?.name,
      videoReadyState: videoRef.current?.readyState,
      poseDetectionInitialized: poseDetectionRef.current?.isInitialized
    });

    console.log('🔍 Checking processing conditions:', {
      isActive,
      hasPoseDetection: !!poseDetectionRef.current,
      hasVideo: !!videoRef.current,
      exercise: selectedExercise?.name,
      isPushUps: isPushUpsSelected,
      isPlank: isPlankSelected,
      isPoseDetectionReady
    });

    if (isActive && poseDetectionRef.current && videoRef.current && (isPushUpsSelected || isPlankSelected || isSquatSelected || isLungesSelected || isBurpeesSelected)) {
      console.log('✅ Starting frame processing interval');
      
      const processFrame = () => {
        if (poseDetectionRef.current && videoRef.current && videoRef.current.readyState >= 2) {
          console.log('🎬 Processing frame - video ready state:', videoRef.current.readyState);
          poseDetectionRef.current.processFrame(videoRef.current);
          // Update pose results for drawing
          const results = poseDetectionRef.current.getLastResults();
          if (results) {
            setPoseResults(results);
            // Only log occasionally to avoid spam
            if (results.poseLandmarks && Math.random() < 0.1) {
              console.log('🎯 Pose detected! Landmarks count:', results.poseLandmarks.length);
            }
          }
        } else {
          console.log('⏳ Video not ready yet, state:', videoRef.current?.readyState);
        }
      };

      const interval = setInterval(processFrame, 200); // Process at 5 FPS
      console.log('⏰ Interval started with ID:', interval);
      return () => {
        console.log('🛑 Cleaning up interval');
        clearInterval(interval);
      };
    }
  }, [isActive, selectedExercise, isPoseDetectionReady]);

  const startCamera = async () => {
    console.log('📹 Starting camera...');
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

      console.log('✅ Camera stream obtained');
      setStream(mediaStream);
      if (videoRef?.current) {
        videoRef.current.srcObject = mediaStream;
        console.log('✅ Video stream set to video element');
      }
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.');
      console.error('❌ Camera error:', err);
    } finally {
      setIsLoading(false);
      console.log('📹 Camera loading finished');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream?.getTracks()?.forEach((track) => track?.stop());
      setStream(null);
    }
    setPoseResults(null);
    setFormFeedback(null);
    
    // Clean up pose detection
    if (poseDetectionRef.current) {
      poseDetectionRef.current.cleanup();
      poseDetectionRef.current = null;
    }
    
    // Reset pose detection state
    setIsPoseDetectionReady(false);
  };

  const drawPoseOverlay = () => {
    console.log('🎨 drawPoseOverlay called:', {
      hasCanvas: !!canvasRef?.current,
      hasVideo: !!videoRef?.current,
      showPoseOverlay,
      hasPoseResults: !!poseResults,
      poseResultsLandmarks: poseResults?.poseLandmarks?.length
    });

    if (!canvasRef?.current || !videoRef?.current || !showPoseOverlay || !poseResults) {
      console.log('❌ Drawing skipped - missing requirements');
      return;
    }

    const canvas = canvasRef?.current;
    const video = videoRef?.current;
    const ctx = canvas?.getContext('2d');

    canvas.width = video?.videoWidth || 640;
    canvas.height = video?.videoHeight || 480;

    console.log('🎨 Canvas dimensions:', canvas.width, 'x', canvas.height);

    // Use MediaPipe's built-in drawing function if available
    if (poseDetectionRef.current && poseResults) {
      console.log('🎨 Calling poseDetection.drawPoseOverlay...');
      poseDetectionRef.current.drawPoseOverlay(ctx, poseResults, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    if (isActive && showPoseOverlay) {
      const interval = setInterval(drawPoseOverlay, 100);
      return () => clearInterval(interval);
    }
  }, [isActive, showPoseOverlay, poseResults]);

  // Reset counter when exercise changes
  useEffect(() => {
    if (poseDetectionRef.current && (isPushUpsSelected || isPlankSelected || isSquatSelected || isLungesSelected || isBurpeesSelected)) {
      poseDetectionRef.current.setExerciseMode(
        isPlankSelected ? 'plank' :
        isSquatSelected ? 'squats' :
        isLungesSelected ? 'lunges' :
        isBurpeesSelected ? 'burpees' :
        'pushups'
      );
      poseDetectionRef.current.resetCounter();
      setPushupCount(0);
      setPostureStatus('unknown');
    }
  }, [selectedExercise]);

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
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ 
          zIndex: 10
        }} />

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
      {/* Stats Overlay - Push-Ups: reps, Plank: time */}
      {(isPushUpsSelected || isPlankSelected || isSquatSelected || isLungesSelected || isMountainClimbersSelected) && isActive && (
        <div className="absolute top-4 left-4 bg-black/70 rounded-lg p-3 text-white">
          <div className="text-center mb-2">
            <div className="text-2xl font-bold text-green-400">{isPlankSelected ? (poseDetectionRef.current?.getStats()?.timeSec || 0) : pushupCount}</div>
            <div className="text-xs text-gray-300">
              {isPlankSelected ? 'Plank (sec)' : 
               isSquatSelected ? 'Squats' :
               isLungesSelected ? 'Lunges' :
               isMountainClimbersSelected ? 'Mountain Climbers' : 'Push-ups'}
            </div>
          </div>
          <div className={`text-xs px-2 py-1 rounded text-center ${
            postureStatus === 'correct' ? 'bg-green-500/20 text-green-300' :
            postureStatus === 'incorrect' ? 'bg-red-500/20 text-red-300' :
            'bg-gray-500/20 text-gray-300'
          }`}>
            {postureStatus === 'correct' ? '✓ Good Posture' :
             postureStatus === 'incorrect' ? '⚠ Fix Posture' :
             'Detecting...'}
          </div>
        </div>
      )}
      {/* Stats Overlay - Burpees */}
      {(isBurpeesSelected && isActive) && (
        <div className="absolute top-4 left-4 bg-black/70 rounded-lg p-3 text-white">
          <div className="text-center mb-2">
            <div className="text-2xl font-bold text-green-400">{pushupCount}</div>
            <div className="text-xs text-gray-300">Burpees</div>
          </div>
          <div className={`text-xs px-2 py-1 rounded text-center ${
            postureStatus === 'correct' ? 'bg-green-500/20 text-green-300' :
            postureStatus === 'incorrect' ? 'bg-red-500/20 text-red-300' :
            'bg-gray-500/20 text-gray-300'
          }`}>
            {postureStatus === 'correct' ? '✓ Good Posture' :
             postureStatus === 'incorrect' ? '⚠ Fix Posture' :
             'Detecting...'}
          </div>
        </div>
      )}

      {/* Form Feedback Overlay */}
      {formFeedback &&
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-lg text-white font-medium text-center max-w-xs animate-spring ${
      formFeedback?.type === 'success' ? 'bg-success' :
      formFeedback?.type === 'warning' ? 'bg-warning' : 'bg-primary'}`
      }>
          {formFeedback?.message}
        </div>
      }

      {/* Posture Warning Overlay - Only for incorrect posture */}
      {postureStatus === 'incorrect' && isPlankSelected && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-red-600/90 text-white px-6 py-3 rounded-lg text-center animate-pulse">
          <div className="font-bold text-lg">⚠️ DANGEROUS POSTURE!</div>
          <div className="text-sm">Straighten your back / reach proper depth</div>
        </div>
      )}
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