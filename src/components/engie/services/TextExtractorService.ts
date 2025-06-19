export class TextExtractorService {
  private static instance: TextExtractorService;

  static getInstance(): TextExtractorService {
    if (!TextExtractorService.instance) {
      TextExtractorService.instance = new TextExtractorService();
    }
    return TextExtractorService.instance;
  }

  /**
   * Extracts text from a specific target element using a CSS selector
   */
  extractTextFromTarget(selector: string): string | null {
    // Only run on client-side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return null;
    }

    const selectedEditor = document.querySelector(selector);
    if (!selectedEditor) {
      console.warn(`Engie: Target editor selector "${selector}" not found.`);
      return null;
    }

    if (selectedEditor instanceof HTMLTextAreaElement || selectedEditor instanceof HTMLInputElement) {
      return selectedEditor.value;
    }

    let text = "";
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.nodeValue) {
          text += node.nodeValue.trim() + " ";
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (this.shouldSkipElement(element)) {
          return;
        }
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i]);
        }
      }
    };
    walk(selectedEditor);
    return text.trim();
  }

  /**
   * Extracts text from the full document body, excluding Engie's own UI
   */
  extractFullPageText(): string {
    // Only run on client-side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return "";
    }

    let text = "";
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.nodeValue) {
          text += node.nodeValue.trim() + " ";
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (this.shouldSkipElement(element)) {
          return;
        }
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i]);
        }
      }
    };
    walk(document.body);
    return text.trim();
  }

  /**
   * Determines if an element should be skipped during text extraction
   */
  private shouldSkipElement(element: HTMLElement): boolean {
    return (
      element.id === "engie-container" ||
      element.closest("#engie-container") !== null ||
      element.tagName === "SCRIPT" ||
      element.tagName === "STYLE"
    );
  }
} 