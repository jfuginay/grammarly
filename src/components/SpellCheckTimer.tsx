import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './SpellCheckTimer.module.css';

interface SpellCheckTimerProps {
  interval?: number; // In seconds, default 3
  isTyping?: boolean; // Whether user is actively typing
  isScanning?: boolean; // Whether spell check is in progress
  spellingSuggestionCount?: number; // Number of spelling suggestions found
  onSpellCheck?: () => void; // Callback when timer completes
  onToggleAutoScan?: (enabled: boolean) => void; // Toggle auto-scanning
  visible?: boolean; // Whether the timer is visible
  lastScanTime?: number; // Time taken for last scan in ms
}

const SpellCheckTimer: React.FC<SpellCheckTimerProps> = ({
  interval = 3,
  isTyping = false,
  isScanning = false,
  spellingSuggestionCount = 0,
  onSpellCheck,
  onToggleAutoScan,
  visible = true,
  lastScanTime = 0
}) => {
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(interval);
  const [timerState, setTimerState] = useState<'ready' | 'countdown' | 'scanning' | 'results' | 'paused'>('ready');
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  
  // Refs
  const timerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visual elements
  const secondsRemaining = Math.ceil(timeRemaining);
  const progress = (timeRemaining / interval) * 100;
  
  // Color transitions based on progress and state
  const getColor = useCallback(() => {
    if (timerState === 'scanning') return '#3b82f6'; // Blue
    if (timerState === 'results') return spellingSuggestionCount > 0 ? '#ef4444' : '#10b981'; // Red for errors, Green for clean
    if (timerState === 'paused') return '#64748b'; // Gray
    
    // Countdown color transition
    if (progress > 66) return '#10b981'; // Green
    if (progress > 33) return '#eab308'; // Yellow
    return '#f59e0b'; // Orange
  }, [progress, timerState, spellingSuggestionCount]);

  // Watch for suggestion count changes to immediately update display
  useEffect(() => {
    if (spellingSuggestionCount === 0 && timerState === 'results') {
      setTimerState('ready');
      setTimeRemaining(interval);
      setIsPulsing(false);
    }
  }, [spellingSuggestionCount, timerState, interval]);

  // Handle timer logic
  useEffect(() => {
    if (!visible || !autoScanEnabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (!autoScanEnabled) {
        setTimerState('paused');
      }
      return;
    }
    
    // Reset timer when typing
    if (isTyping) {
      setTimeRemaining(interval);
      setTimerState('ready');
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Handle scanning state
    if (isScanning) {
      setTimerState('scanning');
      setTimeRemaining(0);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Handle results state - immediately reflect suggestion count changes
    if (spellingSuggestionCount > 0) {
      setTimerState('results');
      setIsPulsing(true);
      
      // Clear pulse and reset after showing results
      const pulseTimer = setTimeout(() => {
        setIsPulsing(false);
        setTimeRemaining(interval);
        setTimerState('ready');
      }, 2000);
      
      return () => clearTimeout(pulseTimer);
    }
    
    // Handle transition from results to ready when suggestions are cleared
    if (spellingSuggestionCount === 0 && timerState === 'results') {
      setTimerState('ready');
      setTimeRemaining(interval);
      setIsPulsing(false);
    }

    // Normal countdown logic
    if (timeRemaining > 0) {
      setTimerState('countdown');
      
      if (!timerRef.current) {
        timerRef.current = window.setInterval(() => {
          setTimeRemaining(prev => {
            const newTime = prev - 0.1;
            if (newTime <= 0) {
              clearInterval(timerRef.current!);
              timerRef.current = null;
              if (onSpellCheck) onSpellCheck();
              return 0;
            }
            return newTime;
          });
        }, 100);
      }
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [timeRemaining, interval, isTyping, isScanning, spellingSuggestionCount, onSpellCheck, visible, autoScanEnabled, timerState]);

  // Handle auto-scan toggle
  const handleAutoScanToggle = () => {
    const newState = !autoScanEnabled;
    setAutoScanEnabled(newState);
    if (onToggleAutoScan) {
      onToggleAutoScan(newState);
    }
    
    if (newState) {
      setTimeRemaining(interval);
      setTimerState('ready');
    } else {
      setTimerState('paused');
    }
  };

  // Handle manual scan
  const handleManualScan = () => {
    if (onSpellCheck && !isScanning) {
      onSpellCheck();
    }
  };

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get status message
  const getStatusMessage = () => {
    switch (timerState) {
      case 'ready':
        return 'Ready to scan for spelling';
      case 'countdown':
        return `Spell check in ${secondsRemaining}s`;
      case 'scanning':
        return 'Scanning for spelling errors...';
      case 'results':
        return spellingSuggestionCount > 0 
          ? `Found ${spellingSuggestionCount} spelling error${spellingSuggestionCount !== 1 ? 's' : ''}` 
          : 'No spelling errors found';
      case 'paused':
        return 'Auto-scan paused';
      default:
        return 'Ready';
    }
  };

  // Get appropriate icon
  const getStatusIcon = () => {
    switch (timerState) {
      case 'ready':
        return '📝';
      case 'countdown':
        return secondsRemaining.toString();
      case 'scanning':
        return <div className={styles.spinner} />;
      case 'results':
        return spellingSuggestionCount > 0 ? '⚠️' : '✅';
      case 'paused':
        return '⏸️';
      default:
        return '📝';
    }
  };

  // Don't render if not visible
  if (!visible) return null;

  return (
    <div 
      ref={containerRef}
      className={`${styles.container} ${expanded ? styles.expanded : ''} ${isPulsing ? styles.pulse : ''}`}
      onClick={() => !expanded && setExpanded(true)}
    >
      {/* Compact Timer */}
      <div className={`${styles.timerCompact} ${styles[timerState]}`}>
        <svg className={styles.ring} viewBox="0 0 100 100">
          <circle className={styles.ringBg} cx="50" cy="50" r="45" />
          {timerState === 'countdown' && (
            <circle 
              className={styles.ringProgress} 
              cx="50" 
              cy="50" 
              r="45"
              strokeDasharray="283" 
              strokeDashoffset={`${283 - (283 * progress) / 100}`}
              style={{ stroke: getColor() }}
            />
          )}
        </svg>
        <div 
          className={styles.statusIcon}
          style={{ color: getColor() }}
        >
          {getStatusIcon()}
        </div>
        
        {/* Badge for spelling error count */}
        {!expanded && spellingSuggestionCount > 0 && (
          <div className={styles.errorBadge}>
            {spellingSuggestionCount}
          </div>
        )}
      </div>
      
      {/* Expanded Panel */}
      {expanded && (
        <div className={styles.expandedPanel} onClick={e => e.stopPropagation()}>
          <div className={styles.header}>
            <div className={styles.statusHeader}>
              <div 
                className={styles.statusIndicator}
                style={{ backgroundColor: getColor() }}
              />
              <span className={styles.statusMessage}>{getStatusMessage()}</span>
            </div>
            <button 
              className={styles.closeButton}
              onClick={() => setExpanded(false)}
              aria-label="Close panel"
            >
              ×
            </button>
          </div>
          
          {/* Controls */}
          <div className={styles.controls}>
            <button 
              className={styles.scanButton}
              onClick={handleManualScan}
              disabled={isScanning}
            >
              <span className={styles.buttonIcon}>🔍</span>
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
          
          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Scan Interval:</span>
              <span className={styles.statValue}>{interval}s</span>
            </div>
            {lastScanTime > 0 && (
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Last Scan:</span>
                <span className={styles.statValue}>{lastScanTime}ms</span>
              </div>
            )}
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Model:</span>
              <span className={styles.statValue}>GPT-4o-mini</span>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className={styles.activity}>
            <h4 className={styles.activityHeader}>Current Status</h4>
            {spellingSuggestionCount > 0 ? (
              <div className={styles.issueCount}>
                <span className={styles.issueDot} style={{ backgroundColor: '#ef4444' }}></span>
                <span className={styles.issueText}>
                  {spellingSuggestionCount} spelling error{spellingSuggestionCount !== 1 ? 's' : ''} found
                </span>
              </div>
            ) : (
              <div className={styles.issueCount}>
                <span className={styles.issueDot} style={{ backgroundColor: '#10b981' }}></span>
                <span className={styles.issueText}>
                  No spelling errors detected
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpellCheckTimer; 