import React, { useState, useEffect } from 'react';
import styles from './AnimatedEngieBot.module.css';

const IDLE_ANIMATIONS = ['idle', 'juggling', 'blowing_bubbles', 'sitting'];

interface AnimatedEngieBotProps {
  animationState: 'idle' | 'walking';
  speed: 'normal' | 'fast';
  direction: 'left' | 'right';
}

const AnimatedEngieBot: React.FC<AnimatedEngieBotProps> = ({ animationState, speed, direction }) => {
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
    animationState === 'walking' && speed === 'fast' ? styles['fast'] : '',
    direction === 'left' ? styles['flipped'] : ''
  ].join(' ');

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
        <div className={`${styles['engie-eye']} ${styles['left']}`}></div>
        <div className={`${styles['engie-eye']} ${styles['right']}`}></div>
        <div className={`${styles['engie-leg']} ${styles['left']}`}></div>
        <div className={`${styles['engie-leg']} ${styles['right']}`}></div>
      </div>
    </div>
  );
};

export default AnimatedEngieBot; 