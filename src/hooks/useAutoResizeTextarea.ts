import { useEffect, RefObject } from 'react';

/**
 * Custom hook that automatically resizes a textarea based on its content
 * @param textareaRef - React ref object pointing to the textarea element
 * @param value - The current value of the textarea (triggers resize on change)
 * @param minHeight - Optional minimum height in pixels (default: 150)
 * @param maxHeight - Optional maximum height in pixels (default: none )
 */
export function useAutoResizeTextarea(
  textareaRef: RefObject<HTMLTextAreaElement>,
  value: string,
  minHeight: number = 150,
  maxHeight?: number
): void {
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Function to adjust height
    const adjustHeight = () => {
      // Store original styles
      const originalOverflow = textarea.style.overflow;
      const originalHeight = textarea.style.height;

      // Reset height to auto to correctly calculate new height
      textarea.style.height = 'auto';
      
      // Calculate new height based on scrollHeight
      let newHeight = Math.max(textarea.scrollHeight, minHeight);
      
      // Limit to maxHeight if specified
      if (maxHeight) {
        newHeight = Math.min(newHeight, maxHeight);
        // Enable scrolling when content exceeds max height
        textarea.style.overflow = newHeight === maxHeight ? 'auto' : 'hidden';
      } else {
        // Hide scrollbar during auto-resize
        textarea.style.overflow = 'hidden';
      }
      
      // Apply the new height
      textarea.style.height = `${newHeight}px`;
      
      // Update parent container height if needed
      const parentElement = textarea.parentElement;
      if (parentElement && parentElement.classList.contains('enhanced-editor')) {
        parentElement.style.height = `${newHeight}px`;
      }
      
      // Restore overflow setting (but maintain height)
      setTimeout(() => {
        textarea.style.overflow = originalOverflow;
      }, 50);
    };
    
    // Initial adjustment
    adjustHeight();
    
    // Handle window resize events
    window.addEventListener('resize', adjustHeight);
    
    // Handle input events directly on the textarea
    textarea.addEventListener('input', adjustHeight);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', adjustHeight);
      textarea.removeEventListener('input', adjustHeight);
    };
  }, [textareaRef, value, minHeight, maxHeight]);
}
