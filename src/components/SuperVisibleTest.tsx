import React from 'react';

const SuperVisibleTest: React.FC = () => {
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '100px',
        width: '100px',
        height: '100px',
        backgroundColor: 'lime',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'black',
        fontSize: '16px',
        fontWeight: 'bold',
        zIndex: 100000,
        border: '5px solid black',
        boxShadow: '0 0 20px rgba(0,255,0,0.8)'
      }}
      onClick={() => alert('SuperVisibleTest clicked!')}
    >
      SUPER<br/>VISIBLE
    </div>
  );
};

export default SuperVisibleTest; 