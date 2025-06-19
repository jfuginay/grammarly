import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { X } from 'lucide-react';

export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  steps,
  isOpen,
  onClose,
  currentStep,
  onNext,
  onPrev,
  onSkip,
}) => {
  if (!isOpen) return null;

  const step = steps[currentStep];
  const targetElement = document.querySelector(step.target);
  const targetRect = targetElement?.getBoundingClientRect();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        {targetElement && targetRect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
              borderRadius: '8px',
            }}
          />
        )}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm z-50"
        >
          <h3 className="text-lg font-bold mb-2">{step.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{step.content}</p>
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip
            </Button>
            <div className="flex items-center space-x-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={onPrev}>
                  Back
                </Button>
              )}
              <Button onClick={onNext}>
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="h-4 w-4"/>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OnboardingTour; 