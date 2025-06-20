import React, { useState, useEffect } from 'react';
import styles from './AnimatedEngieBot.module.css';

const IDLE_ANIMATIONS = ['idle', 'juggling', 'blowing_bubbles', 'sitting'];

interface AnimatedEngieBotProps {
  animationState: 'idle' | 'walking';
  speed: 'normal' | 'fast';
  direction: 'left' | 'right';
  emotion?: 'happy' | 'excited' | 'concerned' | 'thoughtful' | 'neutral'; // New emotion prop
}

const AnimatedEngieBot: React.FC<AnimatedEngieBotProps> = ({ 
  animationState, 
  speed, 
  direction, 
  emotion = 'neutral' // Default to neutral emotion
}) => {
  const [currentIdleAnimation, setCurrentIdleAnimation] = useState('idle');

  useEffect(() => {
    if (animationState === 'idle') {
      const newIdleAnimation = IDLE_ANIMATIONS[Math.floor(Math.random() * IDLE_ANIMATIONS.length)];
      setCurrentIdleAnimation(newIdleAnimation);
    }
  }, [animationState]);

  const finalAnimationState = animationState === 'walking' ? 'walking' : currentIdleAnimation;

  const botClasses = [
    styles['engie-bot'],
    styles[finalAnimationState],
    styles[`emotion-${emotion}`], // Add emotion-specific class
    animationState === 'walking' && speed === 'fast' ? styles['fast'] : '',
    direction === 'left' ? styles['flipped'] : ''
  ].join(' ');

  // Render emotion-specific face elements
  const renderEmotionFace = () => {
    switch(emotion) {
      case 'happy':
        return (
          <>
            <div className={`${styles['engie-eye']} ${styles['left']} ${styles['happy-eye']}`}></div>
            <div className={`${styles['engie-eye']} ${styles['right']} ${styles['happy-eye']}`}></div>
            <div className={styles['happy-mouth']}></div>
          </>
        );
      case 'excited':
        return (
          <>
            <div className={`${styles['engie-eye']} ${styles['left']} ${styles['excited-eye']}`}></div>
            <div className={`${styles['engie-eye']} ${styles['right']} ${styles['excited-eye']}`}></div>
            <div className={styles['excited-mouth']}></div>
          </>
        );
      case 'concerned':
        return (
          <>
            <div className={`${styles['engie-eye']} ${styles['left']} ${styles['concerned-eye']}`}></div>
            <div className={`${styles['engie-eye']} ${styles['right']} ${styles['concerned-eye']}`}></div>
            <div className={styles['concerned-mouth']}></div>
          </>
        );
      case 'thoughtful':
        return (
          <>
            <div className={`${styles['engie-eye']} ${styles['left']} ${styles['thoughtful-eye']}`}></div>
            <div className={`${styles['engie-eye']} ${styles['right']} ${styles['thoughtful-eye']}`}></div>
            <div className={styles['thoughtful-mouth']}></div>
          </>
        );
      default:
        return (
          <>
            <div className={`${styles['engie-eye']} ${styles['left']}`}></div>
            <div className={`${styles['engie-eye']} ${styles['right']}`}></div>
          </>
        );
    }
  };

  const renderJugglingBalls = () => (
    <div className={styles['juggling-balls']}>
      <div className={`${styles['ball']} ${styles['ball1']}`}></div>
      <div className={`${styles['ball']} ${styles['ball2']}`}></div>
      <div className={`${styles['ball']} ${styles['ball3']}`}></div>
    </div>
  );

  const renderBubbles = () => (
    <div className={styles['bubbles']}>
      <div className={`${styles['bubble']} ${styles['bubble1']}`}></div>
      <div className={`${styles['bubble']} ${styles['bubble2']}`}></div>
      <div className={`${styles['bubble']} ${styles['bubble3']}`}></div>
    </div>
  );

  return (
    <div className={botClasses}>
      <div className={styles['engie-body']}>
        {finalAnimationState === 'juggling' && renderJugglingBalls()}
        {finalAnimationState === 'blowing_bubbles' && renderBubbles()}
        
        {/* Render emotion-specific face */}
        {renderEmotionFace()}
        
        <div className={`${styles['engie-leg']} ${styles['left']}`}></div>
        <div className={`${styles['engie-leg']} ${styles['right']}`}></div>
      </div>
    </div>
  );
};

export default AnimatedEngieBot;