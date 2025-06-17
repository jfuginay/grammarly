import React from 'react';
import { Sparkles } from 'lucide-react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <Sparkles className="w-6 h-6 text-primary" />
      <span className="text-xl font-bold text-primary">Grammarly-est</span>
    </div>
  );
};

export default Logo;
