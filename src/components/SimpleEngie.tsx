import React from 'react';

interface SimpleEngieProps {
  suggestions: any[];
  onApply: (suggestion: any) => void;
  onDismiss: (suggestionId: string) => void;
  onIdeate: () => void;
  targetEditorSelector?: string;
  documents: Array<{ id: string; title: string }>;
}

const SimpleEngie: React.FC<SimpleEngieProps> = (props) => {
  console.log('SimpleEngie rendering with', props.suggestions.length, 'suggestions');
  
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '80px',
        height: '80px',
        backgroundColor: 'hsl(15, 65%, 65%)',
        borderRadius: '50%',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '12px',
        cursor: 'pointer',
        border: '3px solid white',
        boxShadow: '0 4px 20px hsla(15, 65%, 65%, 0.3)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 6px 25px hsla(15, 65%, 65%, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 20px hsla(15, 65%, 65%, 0.3)';
      }}
      onClick={() => {
        console.log('SimpleEngie clicked!');
        alert('SimpleEngie clicked!');
      }}
    >
      ENGIE
      <br />
      {props.suggestions.length}
    </div>
  );
};

export default SimpleEngie; 