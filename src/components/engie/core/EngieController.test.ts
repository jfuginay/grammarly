import { EngieController } from './EngieController';
import { EngieStateManager } from './EngieStateManager';
import { EngieProps } from '../types';

// Mock EngieStateManager
jest.mock('./EngieStateManager', () => {
  const mockState = {
    isGrokActive: false,
    grokEndTime: null,
    // Add other state properties if needed by the controller during these tests
  };
  return {
    EngieStateManager: jest.fn().mockImplementation(() => ({
      getState: jest.fn(() => mockState),
      setIsGrokActive: jest.fn((isActive) => {
        mockState.isGrokActive = isActive;
      }),
      setGrokEndTime: jest.fn((time) => {
        mockState.grokEndTime = time;
      }),
      addGrokChatMessage: jest.fn(),
      setBotEmotion: jest.fn(),
      subscribe: jest.fn(), // Added mock for subscribe
      getActiveSuggestions: jest.fn(() => []), // Added mock for getActiveSuggestions
      setIdeating: jest.fn(), // Added mock for setIdeating
      // Mock other EngieStateManager methods if they are called and relevant
    })),
  };
});

// Mock EngieProps if necessary, providing default values
const mockEngieProps: EngieProps = {
  targetEditorSelector: '',
  suggestions: [],
  onApply: jest.fn(),
  onDismiss: jest.fn(),
  // Add other props if needed
};

describe('EngieController', () => {
  let controller: EngieController;
  let mockStateManager: EngieStateManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Store original process.env
    originalEnv = { ...process.env };

    // Reset mocks and state before each test
    jest.clearAllMocks();
    const MockEngieStateManager = EngieStateManager as jest.MockedClass<typeof EngieStateManager>;
    mockStateManager = new MockEngieStateManager();

    // Reset the mockState for EngieStateManager
    (mockStateManager.getState as jest.Mock).mockReturnValue({
      isGrokActive: false,
      grokEndTime: null,
    });
    (mockStateManager.setIsGrokActive as jest.Mock).mockImplementation((isActive) => {
      (mockStateManager.getState() as any).isGrokActive = isActive;
    });
    (mockStateManager.setGrokEndTime as jest.Mock).mockImplementation((time) => {
      (mockStateManager.getState() as any).grokEndTime = time;
    });

    controller = new EngieController(mockEngieProps);
    // Directly assign the mocked state manager to the controller instance for clarity in tests
    (controller as any).stateManager = mockStateManager;

    // process.env will be set directly in tests
  });

  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv;
    jest.restoreAllMocks();
    // Clear any timers set by the controller
    if ((controller as any).grokDeactivationTimer) {
      clearTimeout((controller as any).grokDeactivationTimer);
    }
    if ((controller as any).inactivityTimerRef) { // Clear inactivity timer
      clearTimeout((controller as any).inactivityTimerRef);
    }
  });

  describe('toggleGrokMode', () => {
    it('should activate Grok mode if it is currently inactive and API key is present', async () => {
      process.env.GROQ_API_KEY = 'test-api-key';
      (mockStateManager.getState as jest.Mock).mockReturnValue({ isGrokActive: false, grokEndTime: null });

      await controller.toggleGrokMode();

      expect(mockStateManager.setIsGrokActive).toHaveBeenCalledWith(true);
      expect(mockStateManager.setGrokEndTime).toHaveBeenCalledWith(expect.any(Number));
      expect(mockStateManager.getState().isGrokActive).toBe(true);
      expect(mockStateManager.getState().grokEndTime).toBeGreaterThan(Date.now() - 1000); // Check it's a recent timestamp
      expect(mockStateManager.addGrokChatMessage).toHaveBeenCalledWith({
        role: 'assistant',
        content: "Grok mode activated! I'm ready for some opinionated comments and research.",
      });
      expect((controller as any).grokDeactivationTimer).toBeDefined();
    });

    it('should deactivate Grok mode if it is currently active', async () => {
      process.env.GROQ_API_KEY = 'test-api-key';
      // Initial state: Grok active
      (mockStateManager.getState as jest.Mock).mockReturnValue({ isGrokActive: true, grokEndTime: Date.now() + 600000 });
      (mockStateManager.setIsGrokActive as jest.Mock).mockImplementation((isActive) => { // ensure this mock updates the state for the second call
          (mockStateManager.getState() as any).isGrokActive = isActive;
      });
       (mockStateManager.setGrokEndTime as jest.Mock).mockImplementation((time) => {
        (mockStateManager.getState() as any).grokEndTime = time;
      });


      await controller.toggleGrokMode(); // This will call deactivateGrokMode

      expect(mockStateManager.setIsGrokActive).toHaveBeenCalledWith(false);
      expect(mockStateManager.setGrokEndTime).toHaveBeenCalledWith(null);
      expect(mockStateManager.getState().isGrokActive).toBe(false);
      expect(mockStateManager.getState().grokEndTime).toBeNull();
      expect(mockStateManager.addGrokChatMessage).toHaveBeenCalledWith({
        role: 'assistant',
        content: 'Grok mode deactivated.',
      });
    });

    it('should not activate Grok mode if API key is missing', async () => {
      delete process.env.GROQ_API_KEY; // Ensure API key is not set
       (mockStateManager.getState as jest.Mock).mockReturnValue({ isGrokActive: false, grokEndTime: null });

      await controller.toggleGrokMode();

      expect(mockStateManager.setIsGrokActive).not.toHaveBeenCalled();
      expect(mockStateManager.setGrokEndTime).not.toHaveBeenCalled();
      expect(mockStateManager.getState().isGrokActive).toBe(false);
      expect(mockStateManager.addGrokChatMessage).toHaveBeenCalledWith({
        role: 'assistant',
        content: "I can't activate Grok mode. The API key is missing.",
      });
    });

    it('deactivateGrokMode should clear the deactivation timer', async () => {
      process.env.GROQ_API_KEY = 'test-api-key';
      // Activate Grok first to set the timer
      (mockStateManager.getState as jest.Mock).mockReturnValue({ isGrokActive: false, grokEndTime: null });
      await controller.toggleGrokMode();

      const timerId = (controller as any).grokDeactivationTimer;
      expect(timerId).toBeDefined();

      // Now deactivate
      controller.deactivateGrokMode(); // Directly call for this test

      expect(mockStateManager.setIsGrokActive).toHaveBeenCalledWith(false);
      expect(mockStateManager.setGrokEndTime).toHaveBeenCalledWith(null);
      if (timerId) { // Check if timerId was actually set
         // Attempt to clear a potentially already cleared timer might not throw,
         // but we can check if the current timerId on controller is null
         expect((controller as any).grokDeactivationTimer).toBeNull();
      }
    });

    it('should clear existing deactivation timer when activating Grok mode', async () => {
      process.env.GROQ_API_KEY = 'test-api-key';
      // Simulate a timer already exists (e.g., from a previous activation)
      const mockClearTimeout = jest.fn();
      const originalClearTimeout = global.clearTimeout;
      global.clearTimeout = mockClearTimeout;
      (controller as any).grokDeactivationTimer = setTimeout(() => {}, 10000);


      (mockStateManager.getState as jest.Mock).mockReturnValue({ isGrokActive: false, grokEndTime: null });
      await controller.toggleGrokMode();

      expect(mockClearTimeout).toHaveBeenCalled();

      global.clearTimeout = originalClearTimeout; // Restore original clearTimeout
      if ((controller as any).grokDeactivationTimer) {
        clearTimeout((controller as any).grokDeactivationTimer); // Clean up the new timer
      }
    });

  });
});
