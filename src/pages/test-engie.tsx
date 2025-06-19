import React from 'react';
import Engie from '@/components/Engie';
import SimpleEngieTest from '@/components/SimpleEngieTest';

const TestEngiePage = () => {
  const mockSuggestions = [
    {
      id: '1',
      original: 'test',
      suggestion: 'Test',
      explanation: 'Capitalize the first letter',
      type: 'Grammar' as const,
      severity: 'Low' as const
    }
  ];

  const mockDocuments = [
    { id: '1', title: 'Test Document' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Engie Visibility Test</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Content</h2>
        <p className="text-gray-600">
          This is a test page to verify that Engie is visible. You should see:
        </p>
        <ul className="list-disc list-inside mt-2 text-gray-600">
          <li>A red "TEST" circle in the bottom-right corner</li>
          <li>The Engie bot (blue circle with "ENGIE" text)</li>
          <li>Both should be draggable</li>
        </ul>
      </div>

      {/* Test components */}
      <SimpleEngieTest />
      
      <Engie
        suggestions={mockSuggestions}
        onApply={(suggestion) => console.log('Apply suggestion:', suggestion)}
        onDismiss={(suggestionId) => console.log('Dismiss suggestion:', suggestionId)}
        onIdeate={() => console.log('Ideate clicked')}
        targetEditorSelector=".test-editor"
        documents={mockDocuments}
      />

      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Test Editor</h2>
        <textarea 
          className="test-editor w-full h-32 p-4 border rounded-lg"
          placeholder="Type here to test Engie suggestions..."
        />
      </div>
    </div>
  );
};

export default TestEngiePage; 