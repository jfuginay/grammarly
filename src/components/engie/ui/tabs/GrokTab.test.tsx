import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GrokTab } from './GrokTab';

// Mock Lucide icons
jest.mock('lucide-react', () => {
  const React = jest.requireActual('react'); // Ensure React is in scope
  return {
    ...jest.requireActual('lucide-react'), // Import and retain default behavior
    TimerIcon: () => React.createElement('svg', { 'data-testid': 'timer-icon' }), // Mock specific icons
  };
});


describe('GrokTab', () => {
  const mockOnToggleGrokMode = jest.fn();
  const mockOnResearchWithGrok = jest.fn();
  const mockOnResearchTopicChange = jest.fn();

  const initialProps = {
    isGrokActive: false,
    grokEndTime: null,
    researchTopic: '',
    onResearchTopicChange: mockOnResearchTopicChange,
    onToggleGrokMode: mockOnToggleGrokMode,
    onResearchWithGrok: mockOnResearchWithGrok,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the toggle switch and label', () => {
    render(<GrokTab {...initialProps} />);
    expect(screen.getByLabelText('Inject Engie with Grok')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /inject engie with grok/i })).toBeInTheDocument();
  });

  test('toggle switch reflects isGrokActive prop and calls onToggleGrokMode on change', () => {
    const { rerender } = render(<GrokTab {...initialProps} isGrokActive={false} />);

    const switchControl = screen.getByRole('switch', { name: /inject engie with grok/i });
    expect(switchControl).not.toBeChecked();

    // Simulate user clicking the switch
    fireEvent.click(switchControl);
    expect(mockOnToggleGrokMode).toHaveBeenCalledTimes(1);

    // Simulate parent component updating the prop
    rerender(<GrokTab {...initialProps} isGrokActive={true} />);
    expect(switchControl).toBeChecked();

    // Simulate user clicking the switch again
    fireEvent.click(switchControl);
    expect(mockOnToggleGrokMode).toHaveBeenCalledTimes(2);

    // Simulate parent component updating the prop
    rerender(<GrokTab {...initialProps} isGrokActive={false} />);
    expect(switchControl).not.toBeChecked();
  });

  test('shows timer and research input when Grok is active', () => {
    const endTime = Date.now() + 5 * 60 * 1000; // 5 minutes from now
    render(<GrokTab {...initialProps} isGrokActive={true} grokEndTime={endTime} />);

    expect(screen.getByTestId('timer-icon')).toBeInTheDocument();
    expect(screen.getByText(/time remaining/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Research Topic with Grok')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /research/i })).toBeInTheDocument();
  });

  test('does not show timer and research input when Grok is inactive', () => {
    render(<GrokTab {...initialProps} isGrokActive={false} />);

    expect(screen.queryByTestId('timer-icon')).not.toBeInTheDocument();
    expect(screen.queryByText(/time remaining/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Research Topic with Grok')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /research/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Activate Grok mode to enable opinionated comments and research capabilities./i)).toBeInTheDocument();
  });

  test('calls onResearchWithGrok when research button is clicked with a topic', () => {
    render(
      <GrokTab
        {...initialProps}
        isGrokActive={true}
        researchTopic="Test Topic"
        onResearchTopicChange={mockOnResearchTopicChange} // Ensure this is also mocked or controlled if input typing is simulated
      />
    );

    const researchInput = screen.getByLabelText('Research Topic with Grok');
    // Simulate typing into the input if the value isn't pre-filled by prop
    // fireEvent.change(researchInput, { target: { value: 'Test Topic' } });
    // In this case, researchTopic prop is set, so direct click is fine.

    const researchButton = screen.getByRole('button', { name: /research/i });
    fireEvent.click(researchButton);
    expect(mockOnResearchWithGrok).toHaveBeenCalledWith('Test Topic');
  });

  test('does not call onResearchWithGrok if topic is empty or whitespace', () => {
    render(
      <GrokTab
        {...initialProps}
        isGrokActive={true}
        researchTopic="   " // Whitespace topic
      />
    );

    const researchButton = screen.getByRole('button', { name: /research/i });
    fireEvent.click(researchButton);
    expect(mockOnResearchWithGrok).not.toHaveBeenCalled();
  });

});
