import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Cookie } from 'lucide-react';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent === null) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ ease: 'easeInOut' }}
          className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 shadow-lg z-50 flex items-center justify-between flex-wrap"
        >
          <p className="flex items-center text-sm mr-4 mb-2 sm:mb-0">
            <Cookie className="h-5 w-5 mr-2" />
            We use cookies to enhance your experience. By clicking "Accept", you agree to our use of cookies.
          </p>
          <div className="flex items-center space-x-2">
            <Button variant="default" size="sm" onClick={handleAccept}>
              Accept
            </Button>
            <Button variant="outline" size="sm" onClick={handleDecline} className="border-gray-500 hover:bg-gray-700">
              Decline
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent; 