import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VideoUpload = ({ onVideoAnalysis, isAnalyzing = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const handleDrag = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (e?.type === "dragenter" || e?.type === "dragover") {
      setDragActive(true);
    } else if (e?.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setDragActive(false);
    
    if (e?.dataTransfer?.files && e?.dataTransfer?.files?.[0]) {
      handleFile(e?.dataTransfer?.files?.[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e?.target?.files && e?.target?.files?.[0]) {
      handleFile(e?.target?.files?.[0]);
    }
  };

  const handleFile = (file) => {
    if (!file?.type?.startsWith('video/')) {
      alert('Please upload a video file');
      return;
    }

    if (file?.size > 100 * 1024 * 1024) { // 100MB limit
      alert('File size too large. Please upload a video under 100MB');
      return;
    }

    const videoUrl = URL.createObjectURL(file);
    setUploadedVideo({
      file,
      url: videoUrl,
      name: file?.name,
      size: file?.size
    });

    // Simulate analysis after upload
    setTimeout(() => {
      analyzeVideo(file);
    }, 1000);
  };

  const analyzeVideo = (file) => {
    // Mock analysis results
    const mockResults = {
      exerciseDetected: "Push-ups",
      totalReps: 12,
      formScore: 85,
      feedback: [
        { timestamp: "0:05", message: "Good starting position", type: "success" },
        { timestamp: "0:12", message: "Keep elbows closer to body", type: "warning" },
        { timestamp: "0:18", message: "Excellent form!", type: "success" },
        { timestamp: "0:25", message: "Maintain straight back", type: "warning" },
        { timestamp: "0:32", message: "Perfect push-up technique", type: "success" }
      ],
      improvements: [
        "Keep elbows at 45-degree angle",
        "Maintain plank position throughout",
        "Control the descent speed"
      ],
      strengths: [
        "Consistent rep timing",
        "Good range of motion",
        "Proper hand placement"
      ]
    };

    setAnalysisResults(mockResults);
    if (onVideoAnalysis) {
      onVideoAnalysis(mockResults);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(2)) + ' ' + sizes?.[i];
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  const resetUpload = () => {
    setUploadedVideo(null);
    setAnalysisResults(null);
    if (fileInputRef?.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-card-foreground">Video Analysis</h2>
        {uploadedVideo && (
          <Button variant="ghost" size="sm" onClick={resetUpload}>
            <Icon name="X" size={16} className="mr-2" />
            Clear
          </Button>
        )}
      </div>
      {!uploadedVideo ? (
        /* Upload Area */
        (<div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50 hover:bg-muted/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Icon name="Upload" size={32} className="text-primary" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">
                Upload Exercise Video
              </h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your workout video here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports MP4, MOV, AVI • Max size: 100MB
              </p>
            </div>
            
            <Button variant="outline" onClick={() => fileInputRef?.current?.click()}>
              <Icon name="FolderOpen" size={18} className="mr-2" />
              Choose File
            </Button>
          </div>
        </div>)
      ) : (
        /* Video Preview and Analysis */
        (<div className="space-y-6">
          {/* Video Preview */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-card-foreground">Video Preview</h3>
            <div className="bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={uploadedVideo?.url}
                controls
                className="w-full h-64 object-contain"
              />
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center space-x-2">
                <Icon name="File" size={16} />
                <span>{uploadedVideo?.name}</span>
              </span>
              <span>{formatFileSize(uploadedVideo?.size)}</span>
            </div>
          </div>
          {/* Analysis Loading */}
          {isAnalyzing && (
            <div className="bg-muted rounded-lg p-6 text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Analyzing Video</h3>
              <p className="text-muted-foreground">AI is analyzing your exercise form...</p>
            </div>
          )}
          {/* Analysis Results */}
          {analysisResults && !isAnalyzing && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-card-foreground">Analysis Results</h3>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getScoreColor(analysisResults?.formScore)}`}>
                      {analysisResults?.formScore}%
                    </p>
                    <p className="text-sm text-muted-foreground">Form Score</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold text-primary">{analysisResults?.exerciseDetected}</p>
                    <p className="text-sm text-muted-foreground">Exercise Detected</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-success">{analysisResults?.totalReps}</p>
                    <p className="text-sm text-muted-foreground">Reps Counted</p>
                  </div>
                </div>
              </div>

              {/* Feedback Timeline */}
              <div className="space-y-3">
                <h4 className="text-md font-semibold text-card-foreground">Feedback Timeline</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {analysisResults?.feedback?.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        item?.type === 'success' ? 'bg-success' :
                        item?.type === 'warning' ? 'bg-warning' : 'bg-primary'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-card-foreground">{item?.message}</span>
                          <span className="text-xs text-muted-foreground">{item?.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvements and Strengths */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-md font-semibold text-card-foreground flex items-center">
                    <Icon name="AlertCircle" size={16} className="mr-2 text-warning" />
                    Areas to Improve
                  </h4>
                  <ul className="space-y-2">
                    {analysisResults?.improvements?.map((item, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start">
                        <Icon name="ArrowRight" size={14} className="mr-2 mt-0.5 text-warning" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-md font-semibold text-card-foreground flex items-center">
                    <Icon name="CheckCircle" size={16} className="mr-2 text-success" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {analysisResults?.strengths?.map((item, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start">
                        <Icon name="Check" size={14} className="mr-2 mt-0.5 text-success" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button variant="default" className="flex-1">
                  <Icon name="Download" size={16} className="mr-2" />
                  Save Report
                </Button>
                <Button variant="outline" className="flex-1">
                  <Icon name="Share" size={16} className="mr-2" />
                  Share Results
                </Button>
              </div>
            </div>
          )}
        </div>)
      )}
    </div>
  );
};

export default VideoUpload;