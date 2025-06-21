import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ScanCountdownTimer.module.css';

interface ScanCountdownTimerProps {
  interval?: number; // In milliseconds, default 3000
  isTyping?: boolean; // Whether user is actively typing
  isAnalyzing?: boolean; // Whether analysis is in progress
  hasResults?: boolean; // Whether suggestions are ready
  onTimerComplete?: () => void; // Callback when timer completes
  visible?: boolean; // Whether the timer is visible
}

const ScanCountdownTimer: React.FC<ScanCountdownTimerProps> = ({
  interval = 3000,
  isTyping = false,
  isAnalyzing = false,
  hasResults = false,
  onTimerComplete,
  visible = true
}) => {
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(interval);
  const [timerState, setTimerState] = useState<'ready' | 'countdown' | 'analyzing' | 'success'>('ready');
  const [isPulsing, setIsPulsing] = useState(false);
  const lastUpdateTime = useRef(Date.now());
  const timerRef = useRef<number | null>(null);

  // Calculate visual elements
  const secondsRemaining = Math.ceil(timeRemaining / 1000);
  const progress = (timeRemaining / interval) * 100;
  
  // Color transitions based on progress
  const getColor = useCallback(() => {
    if (timerState === 'analyzing') return '#3b82f6'; // Blue
    if (timerState === 'success') return '#10b981'; // Green
    
    // Transition from green to yellow during countdown
    if (progress > 66) return '#10b981'; // Green
    if (progress > 33) return '#eab308'; // Yellow
    return '#f59e0b'; // Orange
  }, [progress, timerState]);

  // Handle timer logic
  useEffect(() => {
    if (!visible) return;
    
    // Reset timer when typing
    if (isTyping) {
      setTimeRemaining(interval);
      setTimerState('ready');
      lastUpdateTime.current = Date.now();
      
      // Clear existing timer
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Handle analyzing state
    if (isAnalyzing) {
      setTimerState('analyzing');
      setTimeRemaining(0);
      
      // Clear existing timer
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Handle results ready state
    if (hasResults) {
      setTimerState('success');
      setIsPulsing(true);
      
      // Clear pulse after a delay
      const pulseTimer = setTimeout(() => {
        setIsPulsing(false);
      }, 1000);
      
      return () => clearTimeout(pulseTimer);
    }

    // Normal countdown logic
    if (timeRemaining > 0) {
      setTimerState('countdown');
      
      const now = Date.now();
      const elapsed = now - lastUpdateTime.current;
      lastUpdateTime.current = now;
      
      // Update timer
      const nextTimeRemaining = Math.max(0, timeRemaining - elapsed);
      setTimeRemaining(nextTimeRemaining);
      
      // Set up next tick
      timerRef.current = window.setTimeout(() => {
        if (nextTimeRemaining <= 0) {
          setTimerState('analyzing');
          if (onTimerComplete) onTimerComplete();
        }
      }, Math.min(nextTimeRemaining, 100)); // Update at most every 100ms for smooth animation
      
      return () => {
        if (timerRef.current) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [timeRemaining, interval, isTyping, isAnalyzing, hasResults, onTimerComplete, visible]);

  // Don't render if not visible
  if (!visible) return null;

  return (
    <div 
      className={`${styles.timer} ${styles[timerState]} ${isPulsing ? styles.pulse : ''}`}
      role="timer"
      aria-label={`Text scan ${
        timerState === 'ready' ? 'ready' : 
        timerState === 'countdown' ? `in ${secondsRemaining} seconds` : 
        timerState === 'analyzing' ? 'in progress' : 
        'complete'}`}
    >
      <div className={styles.ringContainer}>
        <svg className={styles.ring} viewBox="0 0 100 100">
          <circle className={styles.ringBg} cx="50" cy="50" r="45" />
          <circle 
            className={styles.ringProgress} 
            cx="50" 
            cy="50" 
            r="45"
            strokeDasharray="283" 
            strokeDashoffset={`${283 - (283 * progress) / 100}`}
            style={{ stroke: getColor() }}
          />
        </svg>
        <div className={styles.display} aria-hidden="true">
          {timerState === 'analyzing' ? (
            <div className={styles.spinner}></div>
          ) : timerState === 'success' ? (
            <span className={styles.successIcon}>✓</span>
          ) : (
            secondsRemaining
          )}
        </div>
        <div className={styles.label}>
          {timerState === 'ready' && 'Ready'}
          {timerState === 'countdown' && `${secondsRemaining}s`}
          {timerState === 'analyzing' && 'Analyzing'}
          {timerState === 'success' && 'Done'}
        </div>
      </div>
    </div>
  );
};

export default ScanCountdownTimer;
