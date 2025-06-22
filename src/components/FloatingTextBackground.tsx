import React, { useEffect, useState, useMemo } from 'react';
import '../styles/floating-text-animation.css';

interface FloatingTextBackgroundProps {
  isActive?: boolean;
  className?: string;
}

const FloatingTextBackground: React.FC<FloatingTextBackgroundProps> = ({ 
  isActive = true, 
  className = '' 
}) => {
  const [isClient, setIsClient] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Writing-related keywords mixing technical and creative terms
  const keywords = useMemo(() => [
    // Technical terms
    'debug', 'refactor', 'commit', 'merge', 'deploy', 'iterate', 'optimize', 'ship',
    'algorithm', 'syntax', 'logic', 'compile', 'execute', 'function', 'variable', 'array',
    
    // Creative terms  
    'craft', 'polish', 'narrative', 'flow', 'voice', 'tone', 'style', 'clarity',
    'compose', 'articulate', 'express', 'communicate', 'inspire', 'engage', 'resonate', 'impact',
    
    // Mixed technical-creative
    'architect', 'design', 'structure', 'framework', 'pattern', 'elegant', 'efficient', 'scalable',
    'intuitive', 'seamless', 'responsive', 'adaptive', 'innovative', 'creative', 'solution', 'breakthrough'
  ], []);

  // Assign keywords to layers for proper depth effect
  const layeredKeywords = useMemo(() => {
    const shuffled = [...keywords].sort(() => Math.random() - 0.5);
    return {
      layer1: shuffled.slice(0, 4),   // Largest, slowest
      layer2: shuffled.slice(4, 8),   // Medium
      layer3: shuffled.slice(8, 12),  // Fast
      layer4: shuffled.slice(12, 16)  // Fastest, smallest
    };
  }, [keywords]);

  // Check for client-side rendering and motion preferences
  useEffect(() => {
    setIsClient(true);
    
    // Check for reduced motion preference
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Don't render on server or if motion is reduced
  if (!isClient || prefersReducedMotion || !isActive) {
    return null;
  }

  return (
    <div className={`floating-text-container ${className}`}>
      {/* Layer 1 - Largest, slowest background words */}
      <div className="floating-text-layer">
        {layeredKeywords.layer1.map((word, index) => (
          <div
            key={`layer1-${word}-${index}`}
            className="floating-word layer-1"
            style={{
              animationDelay: `${index * 11}s`,
              top: `${15 + (index * 20)}vh`,
            }}
          >
            {word}
          </div>
        ))}
      </div>

      {/* Layer 2 - Medium size and speed */}
      <div className="floating-text-layer">
        {layeredKeywords.layer2.map((word, index) => (
          <div
            key={`layer2-${word}-${index}`}
            className="floating-word layer-2"
            style={{
              animationDelay: `${5 + (index * 7)}s`,
              top: `${10 + (index * 18)}vh`,
            }}
          >
            {word}
          </div>
        ))}
      </div>

      {/* Layer 3 - Smaller, faster words */}
      <div className="floating-text-layer">
        {layeredKeywords.layer3.map((word, index) => (
          <div
            key={`layer3-${word}-${index}`}
            className="floating-word layer-3"
            style={{
              animationDelay: `${2 + (index * 5)}s`,
              top: `${12 + (index * 16)}vh`,
            }}
          >
            {word}
          </div>
        ))}
      </div>

      {/* Layer 4 - Smallest, fastest foreground words */}
      <div className="floating-text-layer">
        {layeredKeywords.layer4.map((word, index) => (
          <div
            key={`layer4-${word}-${index}`}
            className="floating-word layer-4"
            style={{
              animationDelay: `${index * 3}s`,
              top: `${8 + (index * 14)}vh`,
            }}
          >
            {word}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FloatingTextBackground; 