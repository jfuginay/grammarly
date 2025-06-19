// src/pages/__tests__/dashboard.test.tsx
// Adjust import path based on where applySuggestionLogic is actually exported from.
// Assuming applySuggestionLogic is exported from 'src/pages/dashboard.tsx' for this example.
import { applySuggestionLogic } from '../dashboard';

// Mock Suggestion and Document types if they are not exported or easily importable
// For simplicity, they are defined locally here.
interface Suggestion {
  id: string; // Required by the function's usage of setSuggestions
  original: string;
  suggestion: string;
  // Add other fields like explanation, type, severity if your tests or the function needs them
  // For applySuggestionLogic, only original, suggestion, startIndex, endIndex, id are strictly needed.
  explanation?: string;
  type?: 'Spelling' | 'Grammar' | 'Style' | 'Punctuation' | 'Clarity';
  severity?: 'High' | 'Medium' | 'Low';
  startIndex?: number;
  endIndex?: number;
}

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

describe('applySuggestionLogic', () => {
  let mockSetText: jest.Mock;
  let mockSetSuggestions: jest.Mock;
  let mockDebouncedUpdateDocument: jest.Mock;
  let mockActiveDocument: Document | null;

  beforeEach(() => {
    mockSetText = jest.fn();
    mockSetSuggestions = jest.fn();
    mockDebouncedUpdateDocument = jest.fn();
    mockActiveDocument = {
      id: 'doc1',
      title: 'Test Document',
      content: '', // Initial content, will be overridden by currentText
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error for specific tests
    jest.spyOn(console, 'log').mockImplementation(() => {}); // Suppress console.log
    jest.spyOn(console, 'warn').mockImplementation(() => {}); // Suppress console.warn
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test Suite for Index-Based Replacement
  describe('with startIndex and endIndex', () => {
    it('should replace the specified segment', () => {
      const currentText = "Hello world, world!";
      const suggestion: Suggestion = { id: 's1', original: "world", suggestion: "planet", startIndex: 6, endIndex: 11 };
      applySuggestionLogic(currentText, suggestion, mockSetText, mockSetSuggestions, mockActiveDocument, mockDebouncedUpdateDocument);
      expect(mockSetText).toHaveBeenCalledWith("Hello planet, world!");
    });

    it('should insert text if startIndex equals endIndex', () => {
      const currentText = "Hello world!";
      const suggestion: Suggestion = { id: 's2', original: "", suggestion: "Brave new ", startIndex: 6, endIndex: 6 };
      applySuggestionLogic(currentText, suggestion, mockSetText, mockSetSuggestions, mockActiveDocument, mockDebouncedUpdateDocument);
      expect(mockSetText).toHaveBeenCalledWith("Hello Brave new world!");
    });

    it('should delete text if suggestion is empty', () => {
      const currentText = "Delete this whole sentence.";
      const suggestion: Suggestion = { id: 's3', original: "Delete this whole sentence.", suggestion: "", startIndex: 0, endIndex: 27 };
      applySuggestionLogic(currentText, suggestion, mockSetText, mockSetSuggestions, mockActiveDocument, mockDebouncedUpdateDocument);
      expect(mockSetText).toHaveBeenCalledWith("");
    });
  });

  // Test Suite for Fallback (No Indices or Invalid Indices)
  describe('without or with invalid startIndex/endIndex (fallback logic)', () => {
    it('should replace only the first occurrence if no indices provided', () => {
      const currentText = "apple banana apple";
      const suggestion: Suggestion = { id: 's4', original: "apple", suggestion: "orange" };
      applySuggestionLogic(currentText, suggestion, mockSetText, mockSetSuggestions, mockActiveDocument, mockDebouncedUpdateDocument);
      expect(mockSetText).toHaveBeenCalledWith("orange banana apple");
    });

    it('should not change text if original is not found (no indices)', () => {
      const currentText = "apple banana apple";
      const suggestion: Suggestion = { id: 's5', original: "cherry", suggestion: "orange" };
      applySuggestionLogic(currentText, suggestion, mockSetText, mockSetSuggestions, mockActiveDocument, mockDebouncedUpdateDocument);
      expect(mockSetText).toHaveBeenCalledWith("apple banana apple");
    });

    it('should fallback to first occurrence replacement if endIndex is out of bounds', () => {
      const currentText = "Hello";
      const suggestion: Suggestion = { id: 's6', original: "H", suggestion: "J", startIndex: 0, endIndex: 10 }; // endIndex too large
      applySuggestionLogic(currentText, suggestion, mockSetText, mockSetSuggestions, mockActiveDocument, mockDebouncedUpdateDocument);
      expect(mockSetText).toHaveBeenCalledWith("Jello"); // Fallback: "H" replaced by "J"
    });

    it('should fallback to first occurrence replacement if startIndex > endIndex', () => {
      const currentText = "Hello";
      const suggestion: Suggestion = { id: 's7', original: "H", suggestion: "J", startIndex: 3, endIndex: 1 }; // startIndex > endIndex
      applySuggestionLogic(currentText, suggestion, mockSetText, mockSetSuggestions, mockActiveDocument, mockDebouncedUpdateDocument);
      expect(mockSetText).toHaveBeenCalledWith("Jello"); // Fallback: "H" replaced by "J"
    });
     it('should fallback to first occurrence replacement if startIndex is negative', () => {
      const currentText = "Hello";
      const suggestion: Suggestion = { id: 's8', original: "H", suggestion: "J", startIndex: -1, endIndex: 1 };
      applySuggestionLogic(currentText, suggestion, mockSetText, mockSetSuggestions, mockActiveDocument, mockDebouncedUpdateDocument);
      expect(mockSetText).toHaveBeenCalledWith("Jello");
    });

  });

  // Test Suite for Edge Cases
  describe('edge cases', () => {
    it('should log an error and not change text if original is empty and no indices are provided', () => {
      const currentText = "Test";
      // Important: The 'id' field is needed because the filter logic `s => s.id !== suggestionToApply.id` will run.
      const suggestion: Suggestion = { id: 's9', original: "", suggestion: "Prepended " };
      applySuggestionLogic(currentText, suggestion, mockSetText, mockSetSuggestions, mockActiveDocument, mockDebouncedUpdateDocument);
      expect(console.error).toHaveBeenCalledWith("Error: suggestionToApply.original is empty and no start/end indices provided. Skipping replacement.");
      expect(mockSetText).not.toHaveBeenCalled(); // or ensure it's called with currentText if that's the behavior
    });

    it('should log an error and not change text if original is empty and indices are invalid (triggering fallback)', () => {
      const currentText = "Test";
      const suggestion: Suggestion = { id: 's10', original: "", suggestion: "Prepended ", startIndex: -1, endIndex: -1 }; // Invalid indices
      applySuggestionLogic(currentText, suggestion, mockSetText, mockSetSuggestions, mockActiveDocument, mockDebouncedUpdateDocument);
      // This scenario should be caught by the invalid index check leading to fallback,
      // and then the fallback's check for original === ""
      expect(console.error).toHaveBeenCalledWith("Error: suggestionToApply.original is empty and indices were invalid. Skipping replacement.");
      expect(mockSetText).not.toHaveBeenCalled();
    });

    it('should delete all text if original matches all text and suggestion is empty (no indices)', () => {
      const currentText = "Test";
      const suggestion: Suggestion = { id: 's11', original: "Test", suggestion: "" };
      applySuggestionLogic(currentText, suggestion, mockSetText, mockSetSuggestions, mockActiveDocument, mockDebouncedUpdateDocument);
      expect(mockSetText).toHaveBeenCalledWith("");
    });

    // Test that setSuggestions and debouncedUpdateDocument are called correctly
    it('should call setSuggestions and debouncedUpdateDocument', () => {
      const currentText = "Hello world";
      const suggestion: Suggestion = { id: 's12', original: "world", suggestion: "Engie", startIndex: 6, endIndex: 11 };
      mockActiveDocument!.content = currentText; // Ensure active document has the current text for debounced update

      applySuggestionLogic(currentText, suggestion, mockSetText, mockSetSuggestions, mockActiveDocument, mockDebouncedUpdateDocument);

      expect(mockSetText).toHaveBeenCalledWith("Hello Engie");
      expect(mockSetSuggestions).toHaveBeenCalled(); // Check it's called, argument check is more complex
      expect(mockDebouncedUpdateDocument).toHaveBeenCalledWith(mockActiveDocument!.id, { content: "Hello Engie" });
    });
  });
});
