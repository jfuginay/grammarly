import React from 'react';

const SimpleEngieTest: React.FC = () => {
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '64px',
        height: '64px',
        backgroundColor: 'red',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '12px',
        zIndex: 10000,
        border: '3px solid white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}
    >
      TEST
    </div>
  );
};

export default SimpleEngieTest; 