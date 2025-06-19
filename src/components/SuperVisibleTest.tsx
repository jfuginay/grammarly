import React from 'react';

const SuperVisibleTest: React.FC = () => {
  console.log('SuperVisibleTest is rendering!');
  
  return (
    <>
      {/* Fullscreen overlay to make sure we can see something */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          zIndex: 999999,
          pointerEvents: 'none',
          border: '10px solid red'
        }}
      />
      
      {/* Center screen message */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'red',
          color: 'white',
          padding: '20px',
          fontSize: '24px',
          fontWeight: 'bold',
          zIndex: 1000000,
          border: '5px solid yellow',
          borderRadius: '10px',
          boxShadow: '0 0 20px rgba(0,0,0,0.8)'
        }}
        onClick={() => alert('SuperVisibleTest clicked!')}
      >
        SUPER VISIBLE TEST - CLICK ME
      </div>
      
      {/* Corner elements in all 4 corners */}
      <div
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          width: '100px',
          height: '100px',
          backgroundColor: 'blue',
          zIndex: 1000000,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold'
        }}
      >
        TOP LEFT
      </div>
      
      <div
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          width: '100px',
          height: '100px',
          backgroundColor: 'green',
          zIndex: 1000000,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold'
        }}
      >
        TOP RIGHT
      </div>
      
      <div
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          width: '100px',
          height: '100px',
          backgroundColor: 'purple',
          zIndex: 1000000,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold'
        }}
      >
        BOTTOM LEFT
      </div>
      
      <div
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          width: '100px',
          height: '100px',
          backgroundColor: 'orange',
          zIndex: 1000000,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold'
        }}
      >
        BOTTOM RIGHT
      </div>
    </>
  );
};

export default SuperVisibleTest; 