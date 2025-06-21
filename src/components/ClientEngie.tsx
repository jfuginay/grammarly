/**
 * This component is a client-side wrapper for Engie to ensure it only loads on the client
 * where toneHighlights and other client-side state is available.
 */
'use client';

import dynamic from 'next/dynamic';
import { Suggestion } from './engie/types';

// Dynamically import Engie with no SSR to prevent hydration issues
const Engie = dynamic(() => import('./Engie'), { ssr: false });

interface ClientEngieProps {
  suggestions: Suggestion[];
  onApply: (suggestion: Suggestion) => void;
  onDismiss: (suggestionId: string) => void;
  onIdeate: () => void;
  targetEditorSelector?: string;
  documents: Array<{ id: string; title: string }>;
  grokMode?: boolean;
  grokPowerRemaining?: number;
}

const ClientEngie: React.FC<ClientEngieProps> = (props) => {
  // Only render on client to avoid hydration errors with toneHighlights
  if (typeof window === 'undefined') return null;
  
  return <Engie {...props} />;
};

export default ClientEngie;
