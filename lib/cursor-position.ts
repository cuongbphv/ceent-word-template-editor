/**
 * Enhanced cursor position management with direct DOM control
 */

/**
 * Captures the exact cursor position with path information
 */
export interface CursorPosition {
  node: Node | null;
  offset: number;
  path: number[];
}

/**
 * Gets the path to a node inside its parent container
 * This helps find the node again after re-rendering
 */
function getNodePath(node: Node, rootNode: Node): number[] {
  const path: number[] = [];
  let currentNode: Node | null = node;
  
  while (currentNode && currentNode !== rootNode && currentNode.parentNode) {
    // @ts-ignore
    const parent = currentNode.parentNode;
    let index = 0;
    for (let i = 0; i < parent.childNodes.length; i++) {
      if (parent.childNodes[i] === currentNode) {
        index = i;
        break;
      }
    }
    path.unshift(index);
    currentNode = parent;
  }
  
  return path;
}

/**
 * Finds a node using a previously saved path
 */
function findNodeByPath(rootNode: Node, path: number[]): Node | null {
  let current: Node | null = rootNode;
  
  for (let i = 0; i < path.length; i++) {
    const index = path[i];
    if (!current || !current.childNodes || index >= current.childNodes.length) {
      return null;
    }
    current = current.childNodes[index];
  }
  
  return current;
}

/**
 * Gets the current DOM position of the cursor with detailed path information
 */
export function getCursorPosition(rootElement: HTMLElement): CursorPosition | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  
  const range = selection.getRangeAt(0);
  
  // Check if selection is inside our editor
  if (!rootElement.contains(range.commonAncestorContainer)) {
    return null;
  }
  
  return {
    node: range.startContainer,
    offset: range.startOffset,
    path: getNodePath(range.startContainer, rootElement)
  };
}

/**
 * Sets the cursor position using the detailed position information
 */
export function setCursorPosition(rootElement: HTMLElement, position: CursorPosition | null): boolean {
  if (!position) return false;
  
  let node: Node | null;
  
  // If we have a path, try to use it first (more reliable across renders)
  if (position.path.length > 0) {
    node = findNodeByPath(rootElement, position.path);
  } else {
    node = position.node;
  }
  
  // Fallback if node not found
  if (!node) {
    node = position.node;
  }
  
  if (!node || !rootElement.contains(node)) {
    return false;
  }
  
  try {
    const range = document.createRange();
    const selection = window.getSelection();
    
    if (!selection) return false;
    
    // Set the range to the stored position
    range.setStart(node, Math.min(position.offset, node.nodeType === Node.TEXT_NODE ? (node.textContent?.length || 0) : node.childNodes.length));
    range.collapse(true);
    
    // Apply the range to selection
    selection.removeAllRanges();
    selection.addRange(range);
    
    return true;
  } catch (error) {
    console.error('Error setting cursor position:', error);
    return false;
  }
}

/**
 * Temporarily locks the cursor position and prevents it from jumping
 * during React's re-rendering cycle
 */
export function useCursorLock(editorRef: React.RefObject<HTMLElement>) {
  let locked = false;
  let savedPosition: CursorPosition | null = null;
  
  // Lock the cursor position
  const lockCursor = () => {
    if (!editorRef.current || locked) return false;
    
    savedPosition = getCursorPosition(editorRef.current);
    locked = true;
    return savedPosition !== null;
  };
  
  // Restore the locked cursor position
  const restoreCursor = () => {
    if (!editorRef.current || !locked || !savedPosition) return false;
    
    // Use setTimeout to ensure React has finished updating the DOM
    setTimeout(() => {
      if (editorRef.current) {
        setCursorPosition(editorRef.current, savedPosition);
      }
      
      locked = false;
      savedPosition = null;
    }, 0);
    
    return true;
  };
  
  return { lockCursor, restoreCursor };
}

/**
 * Creates a snapshot of the current selection and focused element
 * Returns a function to restore that exact state
 */
export function createSelectionSnapshot(): () => void {
  const selection = window.getSelection();
  const activeElement = document.activeElement;
  
  if (!selection) {
    return () => {};
  }
  
  // Save ranges
  const ranges: Range[] = [];
  for (let i = 0; i < selection.rangeCount; i++) {
    ranges.push(selection.getRangeAt(i).cloneRange());
  }
  
  // Return restore function
  return () => {
    // Restore focus if possible
    if (activeElement instanceof HTMLElement) {
      activeElement.focus();
    }
    
    // Restore selection
    const newSelection = window.getSelection();
    if (!newSelection) return;
    
    newSelection.removeAllRanges();
    ranges.forEach(range => {
      try {
        newSelection.addRange(range);
      } catch (e) {
        console.error('Error restoring selection range', e);
      }
    });
  };
}

/**
 * Special handling for space and enter keys to prevent cursor jumping
 */
export function handleSpecialKeysNative(
  e: React.KeyboardEvent<HTMLDivElement>,
  editorRef: React.RefObject<HTMLDivElement>,
  setHtmlContent: (content: string) => void
): boolean {
  // Handle only space and enter keys
  if (e.key !== ' ' && e.key !== 'Enter') return false;
  
  const editor = editorRef.current;
  if (!editor) return false;
  
  // Create a selection snapshot before modification
  const restoreSelection = createSelectionSnapshot();
  
  // Let the browser handle the key natively
  // This is key - we're NOT preventing default
  
  // Schedule an update to React's state after the native behavior
  setTimeout(() => {
    // Update React's state with the new content
    if (editor) {
      setHtmlContent(editor.innerHTML);
      
      // Restore the selection
      restoreSelection();
    }
  }, 0);
  
  // We're not preventing default, so return false
  return false;
}

/**
 * Main utility function for managing cursor position in contentEditable
 */
export function createCursorManager(
  editorRef: React.RefObject<HTMLDivElement>,
  setContent: (content: string) => void
) {
  // Track if updates are in progress
  let updating = false;
  let pendingPosition: CursorPosition | null = null;
  
  // Save cursor position
  const saveCursor = (): CursorPosition | null => {
    if (!editorRef.current) return null;
    return getCursorPosition(editorRef.current);
  };
  
  // Restore cursor position
  const restoreCursor = (position: CursorPosition | null): void => {
    if (!position || !editorRef.current) return;
    setCursorPosition(editorRef.current, position);
  };
  
  // Handle content changes and preserve cursor
  const handleContentChange = () => {
    if (updating || !editorRef.current) return;
    
    // Save cursor before update
    pendingPosition = saveCursor();
    
    // Set updating flag to prevent recursion
    updating = true;
    
    // Update content
    setContent(editorRef.current.innerHTML);
    
    // Schedule cursor restoration after React updates
    requestAnimationFrame(() => {
      if (pendingPosition && editorRef.current) {
        restoreCursor(pendingPosition);
      }
      updating = false;
      pendingPosition = null;
    });
  };
  
  // Handle key events specially
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      // For these problematic keys, we use a different approach
      // Don't prevent default - let browser handle it first
      
      // Create a selection snapshot
      const restoreSelection = createSelectionSnapshot();
      
      // Update React state after browser has processed the key
      setTimeout(() => {
        if (editorRef.current) {
          // Update content
          setContent(editorRef.current.innerHTML);
          
          // Restore selection
          setTimeout(restoreSelection, 0);
        }
      }, 0);
    }
  };
  
  return {
    handleContentChange,
    handleKeyDown,
    saveCursor,
    restoreCursor,
  };
}
