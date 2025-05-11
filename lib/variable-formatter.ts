/**
 * Format variable placeholders for consistent display
 */
export function formatVariablePlaceholders(html: string): string {
  if (!html) return '';
  
  // Regex to find variable placeholders {{variableName}}
  const variableRegex = /{{([^{}]+)}}/g;
  
  // Replace with properly formatted spans
  const formatted = html.replace(variableRegex, (match, variableName) => {
    return `<span class="variable-placeholder" data-variable="${variableName.trim()}">${match}</span>`;
  });
  
  return formatted;
}

/**
 * Create a properly formatted variable span
 */
export function createVariableSpan(variableName: string): string {
  const trimmedName = variableName.trim();
  return `<span class="variable-placeholder" data-variable="${trimmedName}">{{${trimmedName}}}</span>`;
}

/**
 * Handle specifically the key1 variable format which appears differently
 */
export function handleKeyVariables(html: string): string {
  if (!html) return '';
  
  // Handle the {{key1}} format
  const keyVariableRegex = /{{\s*key(\d+)\s*}}/g;
  
  // Replace with properly formatted spans for key variables
  const formatted = html.replace(keyVariableRegex, (match, keyNumber) => {
    const variableName = `key${keyNumber}`;
    return `<span class="variable-placeholder" data-variable="${variableName}">${match}</span>`;
  });
  
  return formatted;
}
