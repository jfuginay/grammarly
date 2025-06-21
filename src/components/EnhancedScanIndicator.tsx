import React, { useState, useEffect, useRef } from 'react';
import styles from './EnhancedScanIndicator.module.css';

interface EnhancedScanIndicatorProps {
  scanInterval?: number; // In seconds
  isTyping?: boolean;
  isAnalyzing?: boolean;
  isProcessing?: boolean;
  suggestionCount?: number;
  onScanNow?: () => void;
  onToggleAutoScan?: (enabled: boolean) => void;
  onIntervalChange?: (seconds: number) => void;
}

const EnhancedScanIndicator: React.FC<EnhancedScanIndicatorProps> = ({
  scanInterval = 3,
  isTyping = false,
  isAnalyzing = false,
  isProcessing = false,
  suggestionCount = 0,
  onScanNow,
  onToggleAutoScan,
  onIntervalChange
}) => {
  // State for the component
  const [expanded, setExpanded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(scanInterval);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<'idle' | 'countdown' | 'scanning' | 'processing' | 'results'>('idle');
  const [customInterval, setCustomInterval] = useState(scanInterval);
  
  // Refs for tracking timers
  const timerRef = useRef<number | null>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  
  // Calculate progress for the ring
  const progress = (timeRemaining / scanInterval) * 100;
  
  // Handle status changes based on props
  useEffect(() => {
    if (isProcessing) {
      setCurrentStatus('processing');
    } else if (isAnalyzing) {
      setCurrentStatus('scanning');
    } else if (suggestionCount > 0) {
      setCurrentStatus('results');
      // Auto-collapse after showing results briefly
      const resultTimer = setTimeout(() => {
        setCurrentStatus('idle');
      }, 3000);
      return () => clearTimeout(resultTimer);
    } else if (isTyping) {
      setTimeRemaining(scanInterval);
      setCurrentStatus('idle');
    } else if (timeRemaining > 0 && autoScanEnabled) {
      setCurrentStatus('countdown');
    } else {
      setCurrentStatus('idle');
    }
  }, [isTyping, isAnalyzing, isProcessing, suggestionCount, timeRemaining, scanInterval, autoScanEnabled]);
  
  // Handle countdown timer
  useEffect(() => {
    if (currentStatus !== 'countdown' || !autoScanEnabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    // Start countdown
    if (!timerRef.current) {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 0.1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentStatus, autoScanEnabled]);
  
  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (indicatorRef.current && !indicatorRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle auto-scan toggle
  const handleAutoScanToggle = () => {
    const newState = !autoScanEnabled;
    setAutoScanEnabled(newState);
    if (onToggleAutoScan) {
      onToggleAutoScan(newState);
    }
    
    // Reset timer if enabling
    if (newState) {
      setTimeRemaining(scanInterval);
    }
  };
  
  // Handle scan now button
  const handleScanNow = () => {
    if (onScanNow) {
      onScanNow();
    }
  };
  
  // Handle interval change
  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setCustomInterval(value);
  };
  
  const handleIntervalChangeComplete = () => {
    if (onIntervalChange) {
      onIntervalChange(customInterval);
    }
    // Reset timer with new interval
    setTimeRemaining(customInterval);
  };
  
  // Get color based on current status
  const getStatusColor = () => {
    switch (currentStatus) {
      case 'idle':
        return '#64748b'; // Gray
      case 'countdown':
        if (progress > 66) return '#10b981'; // Green
        if (progress > 33) return '#eab308'; // Yellow
        return '#f59e0b'; // Orange
      case 'scanning':
        return '#3b82f6'; // Blue
      case 'processing':
        return '#8b5cf6'; // Purple
      case 'results':
        return '#10b981'; // Green
      default:
        return '#64748b'; // Gray
    }
  };
  
  // Get appropriate status message
  const getStatusMessage = () => {
    switch (currentStatus) {
      case 'idle':
        return 'Ready to scan';
      case 'countdown':
        return `Next scan in ${timeRemaining.toFixed(1)}s...`;
      case 'scanning':
        return 'Scanning text...';
      case 'processing':
        return 'Processing with AI...';
      case 'results':
        return `Found ${suggestionCount} suggestion${suggestionCount !== 1 ? 's' : ''}`;
      default:
        return 'Ready';
    }
  };
  
  // Get the appropriate icon
  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'idle':
        return '⏱️';
      case 'countdown':
        return Math.ceil(timeRemaining).toString();
      case 'scanning':
        return <div className={styles.spinner} />;
      case 'processing':
        return <div className={styles.aiIcon} />;
      case 'results':
        return suggestionCount.toString();
      default:
        return '⏱️';
    }
  };
  
  return (
    <div 
      ref={indicatorRef}
      className={`${styles.container} ${expanded ? styles.expanded : ''}`}
      onClick={() => setExpanded(prev => !prev)}
    >
      {/* Compact Timer */}
      <div className={styles.timerCompact}>
        <svg className={styles.ring} viewBox="0 0 100 100">
          <circle className={styles.ringBg} cx="50" cy="50" r="45" />
          {currentStatus === 'countdown' && (
            <circle 
              className={styles.ringProgress} 
              cx="50" 
              cy="50" 
              r="45"
              strokeDasharray="283" 
              strokeDashoffset={`${283 - (283 * progress) / 100}`}
              style={{ stroke: getStatusColor() }}
            />
          )}
        </svg>
        <div 
          className={`${styles.statusIcon} ${styles[currentStatus]}`}
          style={{ color: getStatusColor() }}
        >
          {getStatusIcon()}
        </div>
        
        {/* Badge for suggestion count */}
        {!expanded && suggestionCount > 0 && currentStatus !== 'results' && (
          <div className={styles.suggestionBadge}>
            {suggestionCount}
          </div>
        )}
      </div>
      
      {/* Expanded Panel */}
      {expanded && (
        <div className={styles.expandedPanel} onClick={e => e.stopPropagation()}>
          <div className={styles.statusHeader}>
            <div 
              className={styles.statusIndicator}
              style={{ backgroundColor: getStatusColor() }}
            />
            <span className={styles.statusMessage}>{getStatusMessage()}</span>
          </div>
          
          {/* Controls */}
          <div className={styles.controls}>
            <button 
              className={styles.scanNowButton}
              onClick={handleScanNow}
              disabled={isAnalyzing || isProcessing}
            >
              <span className={styles.buttonIcon}>⚡</span>
              Scan Now
            </button>
            
            <div className={styles.autoScanToggle}>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={autoScanEnabled}
                  onChange={handleAutoScanToggle}
                />
                <span className={styles.slider}></span>
              </label>
              <span className={styles.toggleLabel}>Auto-Scan</span>
            </div>
          </div>
          
          {/* Settings */}
          <div className={styles.settings}>
            <h4 className={styles.settingsHeader}>Scan Interval</h4>
            <div className={styles.intervalControl}>
              <input
                type="range"
                min="1"
                max="10"
                value={customInterval}
                onChange={handleIntervalChange}
                onMouseUp={handleIntervalChangeComplete}
                onTouchEnd={handleIntervalChangeComplete}
                className={styles.intervalSlider}
              />
              <span className={styles.intervalValue}>{customInterval}s</span>
            </div>
          </div>
          
          {/* Recent Activity */}
          {suggestionCount > 0 && (
            <div className={styles.recentActivity}>
              <h4 className={styles.activityHeader}>Recent Scan</h4>
              <div className={styles.suggestionSummary}>
                <div className={styles.suggestionCategory}>
                  <span className={styles.categoryDot} style={{ backgroundColor: '#ef4444' }}></span>
                  <span className={styles.categoryName}>Grammar</span>
                  <span className={styles.categoryCount}>{Math.min(2, suggestionCount)}</span>
                </div>
                {suggestionCount > 2 && (
                  <div className={styles.suggestionCategory}>
                    <span className={styles.categoryDot} style={{ backgroundColor: '#f59e0b' }}></span>
                    <span className={styles.categoryName}>Style</span>
                    <span className={styles.categoryCount}>{suggestionCount - 2}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedScanIndicator;
