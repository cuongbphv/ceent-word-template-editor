import * as mammoth from 'mammoth';
import { formatVariablePlaceholders, handleKeyVariables } from './variable-formatter';

export interface DocumentProcessingResult {
  html: string;
  messages: string[];
  error?: string;
  variables?: string[];
}

/**
 * Process a Word document file and convert it to HTML
 */
export async function processWordDocument(file: File): Promise<DocumentProcessingResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Configure mammoth with options
    const options = {
      convertImage: mammoth.images.dataUri,
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Title'] => h1.title:fresh",
        "p[style-name='Subtitle'] => h2.subtitle:fresh",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
        "p[style-name='List Paragraph'] => ul > li:fresh",
        "table => table.document-table",
        "tr => tr",
        "td => td",
        "td[colspan] => td",
        "td[rowspan] => td",
        "b => strong",
        "i => em",
        "u => u", // Correctly map underlined text
        "strike => s",
        "hyperlink => a",
        "r[style-name='Hyperlink'] => a.word-hyperlink",
        "p[style-name='Normal'] => p:fresh",
        // Map common Word paragraph alignments
        "p[style-name='Centered'] => p.center-text:fresh",
        "p[style-name='Justified'] => p.justify-text:fresh",
        // Map image styles to maintain center alignment
        "image => img.word-image"
      ],
      ignoreEmptyParagraphs: false, // Keep all paragraphs to preserve spacing
      preserveNumbering: true,
      idPrefix: "word-content-", // Add prefix to ensure unique IDs
      includeEmbeddedStyleMap: true, // Include any embedded styles
      includeDefaultStyleMap: true // Include default styles
    };
    
    // Convert the document
    const result = await mammoth.convertToHtml({ arrayBuffer }, options);
    
    // Apply post-processing to improve table formatting and variable handling
    let processedHtml = enhanceTableFormatting(result.value);
    processedHtml = formatVariablePlaceholders(processedHtml);
    processedHtml = handleKeyVariables(processedHtml);
    
    // Extract variables from the HTML
    const variables = extractVariables(processedHtml);
    
    return {
      html: processedHtml,
      messages: result.messages.map(msg => msg.message),
      variables
    };
  } catch (error) {
    console.error('Error processing Word document:', error);
    return {
      html: '',
      messages: [],
      error: error instanceof Error ? error.message : 'Unknown error processing document'
    };
  }
}

/**
 * Enhance table formatting in HTML converted from Word documents
 */
function enhanceTableFormatting(html: string): string {
  // We'll use regex-based enhancements since DOMParser is not available in Node.js environment
  let enhancedHtml = html;
  
  // Add the document-table class to all tables if not already present
  enhancedHtml = enhancedHtml.replace(/<table(?![^>]*\bclass=["'][^"']*document-table)/g, 
    '<table class="document-table"');
  
  // Add classes to tables that already have other classes
  enhancedHtml = enhancedHtml.replace(/<table([^>]*)\bclass=["']([^"']*)["']/g, 
    (match, before, classes) => {
      if (!classes.includes('document-table')) {
        return `<table${before}class="${classes} document-table"`;
      }
      return match;
    });
  
  // Add styling to all table cells
  enhancedHtml = enhancedHtml.replace(/<(td|th)([^>]*)>/g, 
    '<$1$2 class="document-table-cell" style="border: 1px solid #e2e8f0; padding: 0.5rem;">');
  
  // Add class to all table rows
  enhancedHtml = enhancedHtml.replace(/<tr([^>]*)>/g, 
    '<tr$1 class="document-table-row">');
  
  // Wrap tables in a div for overflow handling
  enhancedHtml = enhancedHtml.replace(/<table([^>]*)>/g, 
    '<div class="table-wrapper" style="overflow-x: auto;"><table$1>');
  enhancedHtml = enhancedHtml.replace(/<\/table>/g, '</table></div>');
  
  // Add basic table styling
  enhancedHtml = enhancedHtml.replace(/<table([^>]*)class=["']([^"']*)document-table([^"']*)["']/g, 
    '<table$1class="$2document-table$3" style="width: 100%; border-collapse: collapse; margin: 1rem 0;"');
  
  // Replace empty cells with non-breaking spaces
  enhancedHtml = enhancedHtml.replace(/<(td|th)([^>]*)>\s*<\/(td|th)>/g, 
    '<$1$2>&nbsp;</$3>');
    
  // Fix unwanted line breaks in table cells
  enhancedHtml = enhancedHtml.replace(/<\/p>\s*<p>/g, ' ');
  
  // Fix for images to ensure centering
  enhancedHtml = enhancedHtml.replace(/<img([^>]*)>/g, 
    '<img$1 class="word-image" style="display: block; margin-left: auto; margin-right: auto;">');
  
  // Fix for underlining text
  enhancedHtml = enhancedHtml.replace(/<span style="text-decoration: ?underline;?([^"]*)">([^<]*)<\/span>/g, 
    '<u style="$1">$2</u>');
  
  // Ensure hyperlinks are properly styled
  enhancedHtml = enhancedHtml.replace(/<a([^>]*)>/g, 
    '<a$1 class="word-hyperlink" style="color: #0563c1; text-decoration: underline;">');
  
  // Fix for variable placeholders
  enhancedHtml = enhancedHtml.replace(/{{([^{}]+)}}/g, 
    '<span class="variable-placeholder">{{$1}}</span>');
    
  // Add proper CSS classes for text alignment
  enhancedHtml = enhancedHtml.replace(/<p([^>]*)style="([^"]*text-align:\s*center[^"]*)"([^>]*)>/g, 
    '<p$1style="$2"$3 class="center-text">');
  
  enhancedHtml = enhancedHtml.replace(/<p([^>]*)style="([^"]*text-align:\s*justify[^"]*)"([^>]*)>/g, 
    '<p$1style="$2"$3 class="justify-text">');
  
  // Fix headings to ensure they're centered
  enhancedHtml = enhancedHtml.replace(/<h([1-6])([^>]*)>/g, 
    '<h$1$2 class="center-text">');
  
  return enhancedHtml;
  
  // Use regex for fixes that can't be easily done with DOM manipulation
  // Fix unwanted line breaks in table cells
  enhancedHtml = enhancedHtml.replace(/<\/p>\s*<p>/g, ' ');
  
  // Ensure tables are responsive
  enhancedHtml = enhancedHtml.replace(/<table class="document-table"/g, 
    '<table class="document-table" style="width: 100%; border-collapse: collapse;"');
  
  return enhancedHtml;
}

/**
 * Extract variables from document content (looking for {{variable}} patterns)
 */
export function extractVariables(html: string): string[] {
  const regex = /{{([^{}]+)}}/g;
  const matches = html.match(regex) || [];
  
  // Extract variable names and remove duplicates
  const variables = matches
    .map(match => match.replace('{{', '').replace('}}', '').trim())
    .filter((value, index, self) => self.indexOf(value) === index);
  
  return variables;
}

/**
 * Replace variables in document content with values
 */
export function replaceVariables(html: string, values: Record<string, string>): string {
  let result = html;
  
  // First, we'll handle variables that are already wrapped in spans
  Object.entries(values).forEach(([key, value]) => {
    const spanRegex = new RegExp(`<span[^>]*class="variable-placeholder"[^>]*>{{\\s*${key}\\s*}}</span>`, 'g');
    result = result.replace(spanRegex, value);
  });
  
  // Then handle variables that haven't been wrapped yet
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
}

/**
 * Generate a JSON structure for form elements from variables
 */
export function generateFormStructure(variables: string[], templateId: string) {
  return {
    templateId,
    formElements: variables.map((variable, index) => ({
      id: `element-${index}`,
      type: "input",
      properties: {
        label: variable,
        variableName: variable,
      }
    })),
    variables: variables.map(variable => ({
      name: variable,
      type: "string",
      required: false,
      description: ""
    }))
  };
}

/**
 * Convert HTML back to Word document format (DOCX)
 * Note: This is a placeholder. In a real app, you would need a library like 
 * docx-templates or html-docx-js to convert HTML back to DOCX.
 */
export async function htmlToDocx(html: string): Promise<ArrayBuffer> {
  // This is a placeholder implementation
  // In a real application, you would use a library like docx-templates
  // or integrate with a server-side conversion service
  throw new Error('HTML to DOCX conversion not implemented');
}

/**
 * Inject form field placeholder styles into HTML
 */
export function injectFormStyles(html: string): string {
  const styleTag = `
    <style>
      .form-field-placeholder {
        display: inline-block;
        background-color: #f0f8ff;
        border: 1px dashed #4299e1;
        padding: 0 6px;
        margin: 0 2px;
        border-radius: 4px;
        font-family: monospace;
      }
    </style>
  `;
  
  // Add the style tag before the closing head tag, or at the beginning if no head tag exists
  if (html.includes('</head>')) {
    return html.replace('</head>', `${styleTag}</head>`);
  } else {
    return `${styleTag}${html}`;
  }
}
