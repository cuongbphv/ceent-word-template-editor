/* Variable highlighting utility functions */

/**
 * Process HTML content to ensure all variable placeholders are properly highlighted
 */
export function processVariableHighlighting(htmlContent: string): string {
  if (!htmlContent) return '';
  
  // Regular expression to find all {{variableName}} patterns not already inside spans
  const variableRegex = /(?<!<span[^>]*class=["']variable-placeholder["'][^>]*>){{([^{}]+)}}/g;
  
  // Replace with properly styled span elements
  const processedHtml = htmlContent.replace(variableRegex, (match, variableName) => {
    return `<span class="variable-placeholder" data-variable="${variableName.trim()}">${match}</span>`;
  });
  
  return processedHtml;
}

/**
 * Create a variable placeholder with proper HTML formatting for highlighting
 */
export function createVariablePlaceholder(variableName: string): string {
  return `<span class="variable-placeholder" data-variable="${variableName.trim()}">{{${variableName.trim()}}}</span>`;
}

/**
 * Update variable names in content while preserving highlighting
 */
export function updateVariableNames(htmlContent: string, oldName: string, newName: string): string {
  if (!htmlContent) return '';
  
  // Find variables with proper highlighting
  const highlightedRegex = new RegExp(`<span[^>]*data-variable=["']${oldName}["'][^>]*>{{\\s*${oldName}\\s*}}</span>`, 'g');
  const updatedHighlighted = htmlContent.replace(highlightedRegex, 
    `<span class="variable-placeholder" data-variable="${newName}">{{${newName}}}</span>`);
  
  // Also update any variables that might not be properly highlighted yet
  const plainRegex = new RegExp(`{{\\s*${oldName}\\s*}}`, 'g');
  const fullyUpdated = updatedHighlighted.replace(plainRegex, 
    `<span class="variable-placeholder" data-variable="${newName}">{{${newName}}}</span>`);
  
  return fullyUpdated;
}

/**
 * Process content after editing to ensure proper highlighting of all variables
 */
export function processContentAfterEdit(htmlContent: string, variables: string[]): string {
  if (!htmlContent) return '';
  let processedContent = htmlContent;
  
  // Process each variable to ensure it's properly highlighted
  variables.forEach(variable => {
    const variableRegex = new RegExp(`(?<!<span[^>]*class=["']variable-placeholder["'][^>]*>){{\\s*${variable}\\s*}}`, 'g');
    processedContent = processedContent.replace(variableRegex, 
      `<span class="variable-placeholder" data-variable="${variable}">{{${variable}}}</span>`);
  });
  
  return processedContent;
}

/**
 * Clean up content after variable deletion to remove any artifacts
 */
export function cleanupAfterVariableDeletion(htmlContent: string): string {
  if (!htmlContent) return '';
  
  let cleanedContent = htmlContent;
  
  // Clean up any empty paragraphs, leftover ellipses, etc.
  cleanedContent = cleanedContent.replace(/<p>\s*\.\.\.\s*<\/p>/g, '<p>&nbsp;</p>');
  cleanedContent = cleanedContent.replace(/\s*\.\.\.\s*/g, '');
  cleanedContent = cleanedContent.replace(/<p>\s*<\/p>/g, '<p>&nbsp;</p>');
  
  // Clean up any empty spans
  cleanedContent = cleanedContent.replace(/<span[^>]*>\s*<\/span>/g, '');
  
  // Clean up any doubled whitespace
  cleanedContent = cleanedContent.replace(/\s{2,}/g, ' ');
  
  return cleanedContent;
}
