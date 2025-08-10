import React, { useState, useRef, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FoodScannerCamera = ({ onCapture, onUpload, isScanning = false }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanMode, setScanMode] = useState('food'); // 'food' or 'qr'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices?.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef?.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef?.current && videoRef?.current?.srcObject) {
      const tracks = videoRef?.current?.srcObject?.getTracks();
      tracks?.forEach(track => track?.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  }, []);

  const captureImage = useCallback(() => {
    if (videoRef?.current && canvasRef?.current) {
      const canvas = canvasRef?.current;
      const video = videoRef?.current;
      const context = canvas?.getContext('2d');
      
      canvas.width = video?.videoWidth;
      canvas.height = video?.videoHeight;
      context?.drawImage(video, 0, 0);
      
      canvas?.toBlob((blob) => {
        if (blob && onCapture) {
          const file = new File([blob], `food-scan-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });
          onCapture(file, scanMode);
        }
      }, 'image/jpeg', 0.8);
    }
  }, [onCapture, scanMode]);

  const handleFileUpload = (event) => {
    const file = event?.target?.files?.[0];
    if (file && onUpload) {
      onUpload(file, scanMode);
    }
    event.target.value = '';
  };

  const toggleScanMode = () => {
    setScanMode(scanMode === 'food' ? 'qr' : 'food');
  };

  return (
    <div className="space-y-4">
      {/* Scan Mode Toggle */}
      <div className="flex items-center justify-center space-x-2">
        <Button
          variant={scanMode === 'food' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setScanMode('food')}
          iconName="Camera"
          iconPosition="left"
        >
          Food Scan
        </Button>
        <Button
          variant={scanMode === 'qr' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setScanMode('qr')}
          iconName="QrCode"
          iconPosition="left"
        >
          QR Code
        </Button>
      </div>
      {/* Camera Interface */}
      <div className="relative bg-muted rounded-xl overflow-hidden aspect-square max-w-md mx-auto">
        {isCameraActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Viewfinder Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`border-2 rounded-xl ${
                scanMode === 'food' ?'w-64 h-64 border-primary' :'w-48 h-48 border-success'
              } bg-transparent`}>
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
              </div>
            </div>

            {/* Scanning Animation */}
            {isScanning && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-background/90 rounded-lg px-4 py-2 flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">
                    {scanMode === 'food' ? 'Analyzing food...' : 'Scanning QR code...'}
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <Icon name="Camera" size={48} className="mb-4" />
            <p className="text-sm text-center px-4">
              {scanMode === 'food' ?'Point your camera at food to analyze nutrition' :'Point your camera at a QR code to scan product info'
              }
            </p>
          </div>
        )}
      </div>
      {/* Camera Controls */}
      <div className="flex items-center justify-center space-x-4">
        {!isCameraActive ? (
          <Button
            onClick={startCamera}
            iconName="Camera"
            iconPosition="left"
            className="px-6"
          >
            Start Camera
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={stopCamera}
              iconName="CameraOff"
              size="icon"
            />
            
            <Button
              onClick={captureImage}
              disabled={isScanning}
              size="lg"
              className="w-16 h-16 rounded-full"
            >
              <Icon name="Circle" size={32} />
            </Button>
            
            <Button
              variant="outline"
              onClick={toggleScanMode}
              iconName="RotateCcw"
              size="icon"
            />
          </>
        )}
      </div>
      {/* Upload Alternative */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Or upload from gallery</p>
        <Button
          variant="outline"
          onClick={() => fileInputRef?.current?.click()}
          iconName="Upload"
          iconPosition="left"
        >
          Choose Image
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default FoodScannerCamera;