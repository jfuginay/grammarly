import React from 'react';

const SimpleEngieTest: React.FC = () => {
  console.log('SimpleEngieTest is rendering!');
  
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '80px',
        height: '80px',
        backgroundColor: 'red',
        borderRadius: '50%',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '14px',
        cursor: 'pointer',
        border: '3px solid yellow',
        boxShadow: '0 4px 20px rgba(255, 0, 0, 0.5)'
      }}
      onClick={() => alert('Simple Engie Test Clicked!')}
    >
      TEST
    </div>
  );
};

export default SimpleEngieTest; 