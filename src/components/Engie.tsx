import React from 'react';
import { EngieBot } from './engie/EngieBot';
import { EngieProps } from './engie/types';

/**
 * Legacy Engie component - now uses the refactored OOP architecture
 * This maintains backward compatibility while using the new clean architecture
 */
const Engie: React.FC<EngieProps> = (props) => {
  return <EngieBot {...props} />;
};

export default Engie;