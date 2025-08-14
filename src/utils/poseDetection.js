// Pose detection utilities using MediaPipe
class PoseDetectionUtils {
  constructor() {
    this.pose = null;
    this.isInitialized = false;
    this.pushupState = 'up'; // up, down, transition
    this.pushupCount = 0;
    this.postureStatus = 'unknown'; // correct, incorrect, unknown
    this.lastWarningTime = 0;
    this.videoDimensionsLogged = false;
    // Exercise mode and timing
    this.exerciseMode = 'pushups'; // 'pushups' | 'plank' | 'squats' | 'lunges'
    this.accumulatedCorrectMs = 0;
    this.timerRunning = false;
    this.startCorrectTimestampMs = 0;
    this.onPushupCount = null;
    this.onPostureChange = null;
    this.onFormFeedback = null;
    this.onTimeUpdate = null; // for plank seconds updates
  }

  setExerciseMode(mode) {
    const normalized = String(mode || '').toLowerCase();
    if (normalized === 'plank') this.exerciseMode = 'plank';
    else if (normalized === 'squats' || normalized === 'squat') this.exerciseMode = 'squats';
    else if (normalized === 'lunges' || normalized === 'lunge') this.exerciseMode = 'lunges';
    else if (normalized === 'burpees' || normalized === 'burpee') this.exerciseMode = 'burpees';
    else if (normalized.includes('mountain') || normalized.includes('climber')) this.exerciseMode = 'mountainclimbers';
    else this.exerciseMode = 'pushups';
  }

  // Initialize MediaPipe Pose
  async initialize() {
    try {
      console.log('🚀 Initializing MediaPipe Pose...');
      
      // Wait for MediaPipe to load if not ready
      if (!window.Pose) {
        console.warn('MediaPipe Pose not loaded yet, waiting...');
        // Wait up to 10 seconds for MediaPipe to load
        let attempts = 0;
        while (!window.Pose && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 200));
          attempts++;
          if (attempts % 10 === 0) {
            console.log(`Still waiting for MediaPipe... (${attempts * 200}ms)`);
          }
        }
        
        if (!window.Pose) {
          console.error('MediaPipe Pose failed to load after waiting');
          return false;
        }
      }
      
      console.log('✅ MediaPipe Pose found in window object');

      this.pose = new window.Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      const config = window.MediaPipeConfig?.POSE_CONFIG || {
        modelComplexity: 0,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      };

      this.pose.setOptions(config);
      this.pose.onResults(this.onResults.bind(this));
      
      this.isInitialized = true;
      console.log('MediaPipe Pose initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MediaPipe Pose:', error);
      return false;
    }
  }

  // Process video frame
  async processFrame(videoElement) {
    if (!this.isInitialized || !this.pose) {
      console.log('❌ Pose not initialized or missing');
      return null;
    }

    try {
      // Only log occasionally to avoid spam
      if (Math.random() < 0.05) {
        console.log('📹 Processing frame...');
      }
      
      // Check if video dimensions are reasonable
      if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        if (Math.random() < 0.1) {
          console.log('⏳ Video dimensions not ready yet');
        }
        return;
      }
      
      // Log video dimensions only once per session
      if (!this.videoDimensionsLogged) {
        console.log(`📏 Video dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
        this.videoDimensionsLogged = true;
      }
      
      // Allow larger videos but with a reasonable limit
      const maxWidth = 1920;
      const maxHeight = 1080;
      if (videoElement.videoWidth > maxWidth || videoElement.videoHeight > maxHeight) {
        console.log('⚠️ Video too large (>1920x1080), skipping frame');
        return;
      }
      
      await this.pose.send({ image: videoElement });
    } catch (error) {
      if (error.message?.includes('memory access out of bounds')) {
        console.warn('🔄 Memory error, skipping frame');
        return;
      }
      console.error('Error processing frame:', error);
    }
  }

  // Handle pose detection results
  onResults(results) {
    console.log('🎯 onResults called!', results.poseLandmarks ? `Found ${results.poseLandmarks.length} landmarks` : 'No landmarks');
    
    // Store results for drawing
    this.lastResults = results;
    
    if (!results.poseLandmarks) {
      this.postureStatus = 'unknown';
      if (this.onPostureChange) {
        this.onPostureChange('unknown', null);
      }
      // Stop plank timer if running
      if (this.timerRunning) {
        this.accumulatedCorrectMs += Date.now() - this.startCorrectTimestampMs;
        this.timerRunning = false;
        this.startCorrectTimestampMs = 0;
        if (this.onTimeUpdate) {
          this.onTimeUpdate(Math.floor(this.accumulatedCorrectMs / 1000));
        }
      }
      return;
    }

    const landmarks = results.poseLandmarks;
    
    // For squats, lunges, pushups, burpees: always show correct posture to avoid confusion
    if (this.exerciseMode === 'squats' || this.exerciseMode === 'lunges' || this.exerciseMode === 'pushups' || this.exerciseMode === 'burpees') {
      this.postureStatus = 'correct';
      if (this.onPostureChange) {
        this.onPostureChange('correct', landmarks);
      }
    } else {
      // Check posture for other exercises
      const isPostureCorrect = this.checkBackAlignment(landmarks);
      const newPostureStatus = isPostureCorrect ? 'correct' : 'incorrect';
      
      if (newPostureStatus !== this.postureStatus) {
        this.postureStatus = newPostureStatus;
        if (this.onPostureChange) {
          this.onPostureChange(this.postureStatus, landmarks);
        }
      }

      // Handle posture warnings for plank only (pushups now work like squats/lunges)
      if (!isPostureCorrect) {
        const currentTime = Date.now();
        const cooldown = window.MediaPipeConfig?.PLANK_CONFIG?.WARNING_COOLDOWN || 2000;
        
        if (currentTime - this.lastWarningTime > cooldown) {
          this.playWarningSound();
          this.lastWarningTime = currentTime;
          
          if (this.onFormFeedback) {
            this.onFormFeedback({
              message: "Dangerous posture - straighten your back!",
              type: "warning",
              timestamp: currentTime
            });
          }
        }
        // Stop plank timer while incorrect
        if (this.exerciseMode === 'plank' && this.timerRunning) {
          this.accumulatedCorrectMs += currentTime - this.startCorrectTimestampMs;
          this.timerRunning = false;
          this.startCorrectTimestampMs = 0;
          if (this.onTimeUpdate) {
            this.onTimeUpdate(Math.floor(this.accumulatedCorrectMs / 1000));
          }
        }
        return; // Don't count reps with bad posture for plank only
      }
    }

    // Posture is correct
    if (this.exerciseMode === 'plank') {
      const now = Date.now();
      if (!this.timerRunning) {
        this.startCorrectTimestampMs = now;
        this.timerRunning = true;
      }
      const totalMs = this.accumulatedCorrectMs + (now - (this.startCorrectTimestampMs || now));
      const seconds = Math.floor(totalMs / 1000);
      if (this.onTimeUpdate) this.onTimeUpdate(seconds);
      return;
    }

    // Count reps depending on mode
      if (this.exerciseMode === 'squats') {
        this.updateSquatCounter(landmarks);
      } else if (this.exerciseMode === 'lunges') {
        this.updateLungesCounter(landmarks);
      } else if (this.exerciseMode === 'burpees') {
        this.updateBurpeesCounter(landmarks);
      } else if (this.exerciseMode === 'mountainclimbers') {
        this.updateMountainClimbersCounter(landmarks);
      } else {
        this.updatePushupCounter(landmarks);
      }
  }

  // Calculate angle between three points
  calculateAngle(point1, point2, point3) {
    const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) - 
                   Math.atan2(point1.y - point2.y, point1.x - point2.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    
    return angle;
  }

  // Check back alignment for posture
  checkBackAlignment(landmarks) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      
      const leftShoulder = landmarks[config.LEFT_SHOULDER || 11];
      const rightShoulder = landmarks[config.RIGHT_SHOULDER || 12];
      const leftHip = landmarks[config.LEFT_HIP || 23];
      const rightHip = landmarks[config.RIGHT_HIP || 24];
      const leftKnee = landmarks[config.LEFT_KNEE || 25];
      const rightKnee = landmarks[config.RIGHT_KNEE || 26];
      const leftAnkle = landmarks[config.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[config.RIGHT_ANKLE || 28];

      // Require visibility. For plank allow side-view (one side) visibility; for other exercises require both sides for stability.
      const vis = (p) => p && (p.visibility == null || p.visibility > 0.5);
      if (this.exerciseMode === 'plank') {
        const leftSideOk = vis(leftShoulder) && vis(leftHip);
        const rightSideOk = vis(rightShoulder) && vis(rightHip);
        if (!leftSideOk && !rightSideOk) {
          // Not enough landmarks to evaluate plank reliably
          return false;
        }
      } else {
        if (!vis(leftShoulder) || !vis(rightShoulder) || !vis(leftHip) || !vis(rightHip) || !vis(leftKnee) || !vis(rightKnee)) {
          return false;
        }
      }

      // Calculate center points
      const shoulderCenter = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2
      };
      
      const hipCenter = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2
      };
      
      const kneeCenter = {
        x: (leftKnee.x + rightKnee.x) / 2,
        y: (leftKnee.y + rightKnee.y) / 2
      };
      const ankleCenter = (vis(leftAnkle) && vis(rightAnkle)) ? {
        x: (leftAnkle.x + rightAnkle.x) / 2,
        y: (leftAnkle.y + rightAnkle.y) / 2
      } : null;

      // Vectors for straightness
      const targetPoint = ankleCenter || kneeCenter;
      const v1 = { x: shoulderCenter.x - hipCenter.x, y: shoulderCenter.y - hipCenter.y };
      const v2 = targetPoint ? { x: targetPoint.x - hipCenter.x, y: targetPoint.y - hipCenter.y } : null;

      let isGoodPosture = false;
      if (this.exerciseMode === 'plank') {
        // Plank: support both front-facing and side-view evaluation.
        const cfg = window.MediaPipeConfig?.PLANK_CONFIG || {};

        // Prefer side-view detection when one full side is visible (shoulder, hip, ankle)
        const leftSideVisible = vis(leftShoulder) && vis(leftHip) && vis(leftAnkle);
        const rightSideVisible = vis(rightShoulder) && vis(rightHip) && vis(rightAnkle);

        if (leftSideVisible || rightSideVisible) {
          const shoulder = leftSideVisible ? leftShoulder : rightShoulder;
          const hip = leftSideVisible ? leftHip : rightHip;
          const ankle = leftSideVisible ? leftAnkle : rightAnkle;

          // Angle at hip between shoulder-hip-ankle: near 180° for a straight plank
          const sideAngle = this.calculateAngle(shoulder, hip, ankle);
          const minSideAngle = cfg.MIN_SIDE_ANGLE ?? 155; // degrees

          isGoodPosture = sideAngle >= minSideAngle;

          // optional knee check when both ankles visible
          if (isGoodPosture && ankleCenter) {
            const leftKneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
            const rightKneeAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle);
            const kneeMin = cfg.KNEE_MIN_DEG ?? 150;
            const kneeOk = (leftKneeAngle >= kneeMin) && (rightKneeAngle >= kneeMin);
            isGoodPosture = isGoodPosture && kneeOk;
          }

        } else {
          // Fallback: use center-based straightness + orientation as before (front-facing)
          let cosSim = -1;
          if (v2) {
            const mag1 = Math.hypot(v1.x, v1.y) || 1;
            const mag2 = Math.hypot(v2.x, v2.y) || 1;
            cosSim = (v1.x * v2.x + v1.y * v2.y) / (mag1 * mag2);
          }
          const absCos = Math.abs(Math.max(-1, Math.min(1, cosSim)));
          const straightEnough = v2 ? (absCos >= (cfg.STRAIGHT_ABS_COS_MIN ?? 0.90)) : false;
          const dx = shoulderCenter.x - hipCenter.x;
          const dy = shoulderCenter.y - hipCenter.y;
          const orientDeg = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
          const horizMax = cfg.HORIZ_MAX_DEG ?? 35;
          const nearHorizontal = (orientDeg <= horizMax) || (orientDeg >= (180 - horizMax));
          let kneeOk = true;
          if (ankleCenter) {
            const leftKneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
            const rightKneeAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle);
            const kneeMin = cfg.KNEE_MIN_DEG ?? 150;
            kneeOk = (leftKneeAngle >= kneeMin) && (rightKneeAngle >= kneeMin);
          }
          isGoodPosture = straightEnough && nearHorizontal && kneeOk;
        }

      } else if (this.exerciseMode === 'squats') {
        // Squats: ensure hip angle not collapsed and torso tilt within range
        const scfg = window.MediaPipeConfig?.SQUAT_CONFIG || {};
        const hipAngleLeft = this.calculateAngle(leftShoulder, leftHip, leftKnee);
        const hipAngleRight = this.calculateAngle(rightShoulder, rightHip, rightKnee);
        const hipAngle = (hipAngleLeft + hipAngleRight) / 2;
        const hipAngleMin = scfg.HIP_ANGLE_MIN ?? 150;
        const dx = shoulderCenter.x - hipCenter.x;
        const dy = shoulderCenter.y - hipCenter.y;
        const torsoTiltDeg = Math.abs(Math.atan2(dx, -dy) * 180 / Math.PI);
        const tiltMax = scfg.TORSO_TILT_MAX ?? 45;
        isGoodPosture = (hipAngle >= hipAngleMin) && (torsoTiltDeg <= tiltMax);
      } else {
        // Push-ups: straight line check using abs(cos)
        let cosSim = -1;
        if (v2) {
          const mag1 = Math.hypot(v1.x, v1.y) || 1;
          const mag2 = Math.hypot(v2.x, v2.y) || 1;
          cosSim = (v1.x * v2.x + v1.y * v2.y) / (mag1 * mag2);
        }
        const absCos = Math.abs(Math.max(-1, Math.min(1, cosSim)));
        isGoodPosture = v2 ? (absCos >= 0.90) : false;
      }

      console.log(`🏃 Posture(${this.exerciseMode}): ${isGoodPosture ? 'GOOD' : 'BAD'}`);
      
      return isGoodPosture;
    } catch (error) {
      console.error('Error checking back alignment:', error);
      return false;
    }
  }

  // Update push-up counter
  updatePushupCounter(landmarks) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const pushupConfig = window.MediaPipeConfig?.PUSHUP_CONFIG || {};
      
      const leftShoulder = landmarks[config.LEFT_SHOULDER || 11];
      const leftElbow = landmarks[config.LEFT_ELBOW || 13];
      const leftWrist = landmarks[config.LEFT_WRIST || 15];
      const rightShoulder = landmarks[config.RIGHT_SHOULDER || 12];
      const rightElbow = landmarks[config.RIGHT_ELBOW || 14];
      const rightWrist = landmarks[config.RIGHT_WRIST || 16];

      if (!leftShoulder || !leftElbow || !leftWrist || !rightShoulder || !rightElbow || !rightWrist) {
        return;
      }

      // Calculate elbow angles
      const leftElbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
      const rightElbowAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
      const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

      // Average shoulder position (for height detection)
      const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;

      const downThreshold = pushupConfig.ELBOW_ANGLE_DOWN || 95;
      const upThreshold = pushupConfig.ELBOW_ANGLE_UP || 155;
      const shoulderHeightThreshold = pushupConfig.SHOULDER_HEIGHT_DOWN || 0.02;

      // Push-up position: elbows bent OR shoulders close to ground
      const pushupPosition = (avgElbowAngle <= downThreshold) || (avgShoulderY >= (1 - shoulderHeightThreshold));
      
      // Standing position: elbows straight
      const standingPosition = avgElbowAngle >= upThreshold;

      // Simple counting: count immediately when going down (like squats and lunges)
      if (this.pushupState === 'up') {
        if (pushupPosition) {
          this.pushupState = 'down';
          this.pushupCount += 1; // Count immediately on descent
          if (this.onPushupCount) this.onPushupCount(this.pushupCount);
          if (this.onFormFeedback) {
            this.onFormFeedback({ message: `Push-up ${this.pushupCount}`, type: 'success', timestamp: Date.now() });
          }
        }
      } else if (this.pushupState === 'down') {
        if (standingPosition) {
          this.pushupState = 'up'; // Reset state for next rep
        }
      }
    } catch (error) {
      console.error('Error updating push-up counter:', error);
    }
  }

  // Update squat counter
  updateSquatCounter(landmarks) {
    try {
      const cfg = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const scfg = window.MediaPipeConfig?.SQUAT_CONFIG || {};

      const leftHip = landmarks[cfg.LEFT_HIP || 23];
      const rightHip = landmarks[cfg.RIGHT_HIP || 24];
      const leftKnee = landmarks[cfg.LEFT_KNEE || 25];
      const rightKnee = landmarks[cfg.RIGHT_KNEE || 26];
      const leftAnkle = landmarks[cfg.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[cfg.RIGHT_ANKLE || 28];
      const leftShoulder = landmarks[cfg.LEFT_SHOULDER || 11];
      const rightShoulder = landmarks[cfg.RIGHT_SHOULDER || 12];

      if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle || !leftShoulder || !rightShoulder) return;

      // Average sides for stability
      const hip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
      const knee = { x: (leftKnee.x + rightKnee.x) / 2, y: (leftKnee.y + rightKnee.y) / 2 };
      const ankle = { x: (leftAnkle.x + rightAnkle.x) / 2, y: (leftAnkle.y + rightAnkle.y) / 2 };
      const shoulder = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };

      // Knee angle using hip-knee-ankle
      const kneeAngleLeft = this.calculateAngle(leftHip, leftKnee, leftAnkle);
      const kneeAngleRight = this.calculateAngle(rightHip, rightKnee, rightAnkle);
      const kneeAngle = (kneeAngleLeft + kneeAngleRight) / 2;

      // Hip angle shoulder-hip-knee to detect rounding/collapse
      const hipAngleLeft = this.calculateAngle(leftShoulder, leftHip, leftKnee);
      const hipAngleRight = this.calculateAngle(rightShoulder, rightHip, rightKnee);
      const hipAngle = (hipAngleLeft + hipAngleRight) / 2;

      const downThreshold = scfg.KNEE_ANGLE_DOWN ?? 80;
      const upThreshold = scfg.KNEE_ANGLE_UP ?? 165;
      const hipAngleMin = scfg.HIP_ANGLE_MIN ?? 150;

      // Count based on hip position (lower back points)
      const hipY = hip.y; // Y position of hips (lower = deeper)
      const kneeY = knee.y; // Y position of knees
      
      // Hip goes below knee level = deep squat
      const hipBelowKnee = hipY > kneeY;
      // Hip goes back up above knee level = standing
      const hipAboveKnee = hipY < kneeY;

      // State machine: count when hip goes down below knee level
      if (this.pushupState === 'up') {
        if (hipBelowKnee) {
          this.pushupState = 'down';
          this.pushupCount += 1;
          if (this.onPushupCount) this.onPushupCount(this.pushupCount);
          if (this.onFormFeedback) {
            this.onFormFeedback({ message: `Squat ${this.pushupCount}`, type: 'success', timestamp: Date.now() });
          }
        }
      } else if (this.pushupState === 'down') {
        if (hipAboveKnee) {
          this.pushupState = 'up';
        }
      }
    } catch (error) {
      console.error('Error updating squat counter:', error);
    }
  }

  // Update lunges counter
  updateLungesCounter(landmarks) {
    try {
      const cfg = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      const lcfg = window.MediaPipeConfig?.LUNGES_CONFIG || {};
      const leftHip = landmarks[cfg.LEFT_HIP || 23];
      const rightHip = landmarks[cfg.RIGHT_HIP || 24];
      const leftKnee = landmarks[cfg.LEFT_KNEE || 25];
      const rightKnee = landmarks[cfg.RIGHT_KNEE || 26];
      const leftAnkle = landmarks[cfg.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[cfg.RIGHT_ANKLE || 28];
      if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) return;
      // Average hip position
      const hip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
      // Calculate knee angles
      const leftKneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
      const rightKneeAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle);
      // Determine which leg is front (more bent knee)
      const leftKneeBent = leftKneeAngle < rightKneeAngle;
      const frontKnee = leftKneeBent ? leftKnee : rightKnee;
      const backKnee = leftKneeBent ? rightKnee : leftAnkle;
      const frontKneeAngle = leftKneeBent ? leftKneeAngle : rightKneeAngle;
      const backKneeAngle = leftKneeBent ? rightKneeAngle : leftKneeAngle;
      // Hip position relative to front knee
      const hipBelowFrontKnee = hip.y > frontKnee.y;
      // Lunge position: either knee bent enough OR hips go down (very lenient)
      const lungePosition = ((frontKneeAngle <= 85) || (backKneeAngle <= 90) || hipBelowFrontKnee);
      // Standing position: both knees straight
      const standingPosition = (frontKneeAngle >= 160) && (backKneeAngle >= 150);
      // Simple counting: count immediately when going down (like squats)
      if (this.pushupState === 'up') {
        if (lungePosition) {
          this.pushupState = 'down';
          this.pushupCount += 1; // Count immediately on descent
          if (this.onPushupCount) this.onPushupCount(this.pushupCount);
          if (this.onFormFeedback) {
            this.onFormFeedback({ message: `Lunge ${this.pushupCount}`, type: 'success', timestamp: Date.now() });
          }
        }
      } else if (this.pushupState === 'down') {
        if (standingPosition) {
          this.pushupState = 'up'; // Reset state for next rep
        }
      }
    } catch (error) {
      console.error('Error updating lunges counter:', error);
    }
  }

  // Add Burpees counter
  // Update mountain climbers counter
  updateMountainClimbersCounter(landmarks) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      
      // Get key body points
      const leftHip = landmarks[config.LEFT_HIP || 23];
      const rightHip = landmarks[config.RIGHT_HIP || 24];
      const leftKnee = landmarks[config.LEFT_KNEE || 25];
      const rightKnee = landmarks[config.RIGHT_KNEE || 26];
      const leftAnkle = landmarks[config.LEFT_ANKLE || 27];
      const rightAnkle = landmarks[config.RIGHT_ANKLE || 28];

      if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) return;

      // Calculate vertical distances between knees and hips
      const leftKneeToHipY = Math.abs(leftKnee.y - leftHip.y);
      const rightKneeToHipY = Math.abs(rightKnee.y - rightHip.y);

      // Initialize states if needed
      if (!this._lastLeftKneeY) this._lastLeftKneeY = leftKnee.y;
      if (!this._lastRightKneeY) this._lastRightKneeY = rightKnee.y;
      if (!this._climberState) this._climberState = 'neutral';
      if (!this._lastClimberTime) this._lastClimberTime = Date.now();
      
      const KNEE_THRESHOLD = 0.05; // How far the knee needs to move
      const MIN_REP_TIME = 250; // Minimum time between reps (ms)
      const currentTime = Date.now();

      // Calculate knee movements
      const leftKneeMove = leftKnee.y - this._lastLeftKneeY;
      const rightKneeMove = rightKnee.y - this._lastRightKneeY;

      // Check for significant knee movements in opposite directions
      const isAlternating = (leftKneeMove > KNEE_THRESHOLD && rightKneeMove < -KNEE_THRESHOLD) ||
                           (leftKneeMove < -KNEE_THRESHOLD && rightKneeMove > KNEE_THRESHOLD);

      // State machine for counting alternating leg movements
      if (this._climberState === 'neutral') {
        if (isAlternating && (currentTime - this._lastClimberTime > MIN_REP_TIME)) {
          this._climberState = 'moving';
          this._lastClimberTime = currentTime;
          // Count the rep
          this.pushupCount += 1;
          if (this.onPushupCount) this.onPushupCount(this.pushupCount);
          if (this.onFormFeedback) {
            const leg = leftKneeMove > rightKneeMove ? 'Left' : 'Right';
            this.onFormFeedback({
              message: `${leg} knee drive - Rep ${this.pushupCount}`,
              type: 'success',
              timestamp: currentTime
            });
          }
        }
      } else if (this._climberState === 'moving') {
        if (!isAlternating) {
          this._climberState = 'neutral';
        }
      }

      // Update last positions
      this._lastLeftKneeY = leftKnee.y;
      this._lastRightKneeY = rightKnee.y;

      // Form feedback for incorrect movement
      if (Math.abs(leftHip.y - rightHip.y) > 0.1) { // Hips not level
        if (this.onFormFeedback && Math.random() < 0.1) {
          this.onFormFeedback({
            message: "Keep hips level!",
            type: "warning",
            timestamp: currentTime
          });
        }
      }

    } catch (error) {
      console.error('Error updating mountain climbers counter:', error);
    }
  }

  updateBurpeesCounter(landmarks) {
    try {
      const config = window.MediaPipeConfig?.POSE_LANDMARKS || {};
      // نقاط الرأس واليدين
      const nose = landmarks[config.NOSE || 0];
      const leftWrist = landmarks[config.LEFT_WRIST || 15];
      const rightWrist = landmarks[config.RIGHT_WRIST || 16];
      const leftIndex = landmarks[config.LEFT_INDEX || 19];
      const rightIndex = landmarks[config.RIGHT_INDEX || 20];
      if (!nose || !leftWrist || !rightWrist) return;
      // أعلى نقطة للرأس
      const headY = nose.y;
      // أعلى نقطة لليد أو الأصابع
      const leftHandY = leftIndex ? leftIndex.y : leftWrist.y;
      const rightHandY = rightIndex ? rightIndex.y : rightWrist.y;
      // إذا كانت اليدين أو الأصابع أعلى من الرأس (أقل في قيمة y)
      const handsAboveHead = (leftHandY < headY && rightHandY < headY);
      // منطق العد
      if (!this._burpeeState) this._burpeeState = 'ready';
      if (this._burpeeState === 'ready') {
        if (handsAboveHead) {
          this._burpeeState = 'jumping';
          this.pushupCount += 1;
          if (this.onPushupCount) this.onPushupCount(this.pushupCount);
          if (this.onFormFeedback) {
            this.onFormFeedback({
              message: `Burpee ${this.pushupCount} - Hands above head!`,
              type: 'success',
              timestamp: Date.now()
            });
          }
        }
      } else if (this._burpeeState === 'jumping') {
        if (!handsAboveHead) {
          this._burpeeState = 'ready';
        }
      }
    } catch (error) {
      console.error('Error updating burpees counter:', error);
    }
  }

  // Play warning sound
  playWarningSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing warning sound:', error);
    }
  }

  // Draw pose landmarks on canvas
  drawPoseOverlay(canvasCtx, results, canvasWidth, canvasHeight) {
    // Only log occasionally to avoid spam
    if (Math.random() < 0.05) {
      console.log('🎨 Drawing pose overlay with', results.poseLandmarks?.length || 0, 'landmarks');
    }

    if (!results.poseLandmarks || !canvasCtx) {
      return;
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw landmarks
    const landmarks = results.poseLandmarks;
    let drawnLandmarks = 0;
    
    landmarks.forEach((landmark, index) => {
      if (landmark.visibility && landmark.visibility > 0.5) {
        const x = landmark.x * canvasWidth;
        const y = landmark.y * canvasHeight;
        
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, 6, 0, 2 * Math.PI); // Bigger circles
        canvasCtx.fillStyle = landmark.visibility > 0.7 ? '#10B981' : '#F59E0B';
        canvasCtx.fill();
        canvasCtx.strokeStyle = '#FFFFFF';
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();
        drawnLandmarks++;
      }
    });

    // Only log occasionally
    if (Math.random() < 0.1) {
      console.log('✨ Drew', drawnLandmarks, 'landmarks');
    }

    // Always use basic connections (more reliable)
    this.drawBasicConnections(canvasCtx, landmarks, canvasWidth, canvasHeight);

    canvasCtx.restore();
  }

  // Draw basic pose connections
  drawBasicConnections(canvasCtx, landmarks, canvasWidth, canvasHeight) {
    const connections = [
      [11, 12], // shoulders
      [11, 13], // left shoulder to elbow
      [13, 15], // left elbow to wrist
      [12, 14], // right shoulder to elbow
      [14, 16], // right elbow to wrist
      [11, 23], // left shoulder to hip
      [12, 24], // right shoulder to hip
      [23, 24], // hips
      [23, 25], // left hip to knee
      [25, 27], // left knee to ankle
      [24, 26], // right hip to knee
      [26, 28]  // right knee to ankle
    ];

    let drawnConnections = 0;
    connections.forEach(([startIdx, endIdx]) => {
      const startPoint = landmarks[startIdx];
      const endPoint = landmarks[endIdx];

      if (startPoint && endPoint && 
          startPoint.visibility > 0.5 && endPoint.visibility > 0.5) {
        canvasCtx.beginPath();
        canvasCtx.moveTo(startPoint.x * canvasWidth, startPoint.y * canvasHeight);
        canvasCtx.lineTo(endPoint.x * canvasWidth, endPoint.y * canvasHeight);
        canvasCtx.strokeStyle = '#3B82F6';
        canvasCtx.lineWidth = 3; // Thicker lines
        canvasCtx.stroke();
        drawnConnections++;
      }
    });
    
    // Only log occasionally
    if (Math.random() < 0.02) {
      console.log('✅ Drawing completed!', drawnConnections, 'connections');
    }
  }

  // Reset counter
  resetCounter() {
    this.pushupCount = 0;
    this.pushupState = 'up';
    this.postureStatus = 'unknown';
    // Reset plank timing
    this.accumulatedCorrectMs = 0;
    this.timerRunning = false;
    this.startCorrectTimestampMs = 0;
  }

  // Get current stats
  getStats() {
    return {
      count: this.pushupCount,
      state: this.pushupState,
      posture: this.postureStatus,
      timeSec: Math.floor((this.accumulatedCorrectMs + (this.timerRunning ? (Date.now() - this.startCorrectTimestampMs) : 0)) / 1000)
    };
  }

  // Get latest pose results for drawing
  getLastResults() {
    return this.lastResults;
  }

  // Set callback functions
  setCallbacks({ onPushupCount, onPostureChange, onFormFeedback, onTimeUpdate }) {
    this.onPushupCount = onPushupCount;
    this.onPostureChange = onPostureChange;
    this.onFormFeedback = onFormFeedback;
    this.onTimeUpdate = onTimeUpdate;
  }

  // Cleanup
  cleanup() {
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
    this.isInitialized = false;
  }
}

export default PoseDetectionUtils;
