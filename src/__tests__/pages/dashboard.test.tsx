// @ts-nocheck
import { applySuggestionLogic } from '../dashboard'; // We'll define this helper function later

describe('applySuggestionLogic', () => {
  const mockSetText = jest.fn();
  const mockSetSuggestions = jest.fn();
  const mockDebouncedUpdateDocument = jest.fn();
  const activeDocument = { id: 'doc1', title: 'Test Document', content: '', createdAt: '', updatedAt: '' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should apply a simple suggestion correctly', () => {
    const text = 'This is a testt.';
    const suggestion = { id: '1', original: 'testt', suggestion: 'test', explanation: '', type: 'Spelling', severity: 'High' };
    const expectedText = 'This is a test.';

    applySuggestionLogic(text, suggestion, mockSetText, mockSetSuggestions, activeDocument, mockDebouncedUpdateDocument);

    expect(mockSetText).toHaveBeenCalledWith(expectedText);
    expect(mockSetSuggestions).toHaveBeenCalledTimes(1);
    expect(mockDebouncedUpdateDocument).toHaveBeenCalledWith(activeDocument.id, { content: expectedText });
  });

  it('should replace only the first occurrence if original text appears multiple times', () => {
    const text = 'The quick brown foxx jumps over the lazy foxx.';
    const suggestion = { id: '1', original: 'foxx', suggestion: 'fox', explanation: '', type: 'Spelling', severity: 'High' };
    const expectedText = 'The quick brown fox jumps over the lazy foxx.';

    applySuggestionLogic(text, suggestion, mockSetText, mockSetSuggestions, activeDocument, mockDebouncedUpdateDocument);

    expect(mockSetText).toHaveBeenCalledWith(expectedText);
  });

  it('should handle suggestions with special characters', () => {
    const text = 'This is a test with speecial chars.';
    const suggestion = { id: '1', original: 'speecial chars', suggestion: 'special characters', explanation: '', type: 'Spelling', severity: 'High' };
    const expectedText = 'This is a test with special characters.';

    applySuggestionLogic(text, suggestion, mockSetText, mockSetSuggestions, activeDocument, mockDebouncedUpdateDocument);

    expect(mockSetText).toHaveBeenCalledWith(expectedText);
  });

  it('should not change text if original is an empty string', () => {
    const text = 'This is a test.';
    const suggestion = { id: '1', original: '', suggestion: 'something', explanation: '', type: 'Spelling', severity: 'High' };

    // We need to spy on console.error for this test case
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    applySuggestionLogic(text, suggestion, mockSetText, mockSetSuggestions, activeDocument, mockDebouncedUpdateDocument);

    expect(mockSetText).not.toHaveBeenCalled();
    expect(mockSetSuggestions).not.toHaveBeenCalled();
    expect(mockDebouncedUpdateDocument).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error: suggestionToApply.original is empty. Skipping replacement.");

    consoleErrorSpy.mockRestore();
  });

  it('should not change text if original is not found', () => {
    const text = 'This is a test.';
    const suggestion = { id: '1', original: 'nonexistent', suggestion: 'replacement', explanation: '', type: 'Spelling', severity: 'High' };
    const expectedText = 'This is a test.'; // Text remains unchanged

    applySuggestionLogic(text, suggestion, mockSetText, mockSetSuggestions, activeDocument, mockDebouncedUpdateDocument);

    expect(mockSetText).toHaveBeenCalledWith(expectedText); // setText will be called, but with the original text
  });
});
