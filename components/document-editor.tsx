"use client"

import React, {useEffect, useRef, useState} from 'react'
import {Button} from "@/components/ui/button"
import {Download, Save} from "lucide-react"

interface DocumentEditorProps {
  content: string;
  onSave: (content: string) => void;
  filename: string;
}

export function DocumentEditor({ content, onSave, filename }: DocumentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editingMode, setEditingMode] = useState<'wysiwyg' | 'source'>('wysiwyg');
  const [sourceContent, setSourceContent] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initialize editor when component mounts
    const loadEditor = async () => {
      try {
        // Load CSS for editor
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = 'https://cdn.jsdelivr.net/npm/quill@2.0.0-rc.2/dist/quill.snow.css';
        document.head.appendChild(linkElement);

        // Import Quill dynamically (client-side only)
        const Quill = (await import('quill')).default;
        
        if (editorRef.current && !editorRef.current.querySelector('.ql-container')) {
          const editor = new Quill(editorRef.current, {
            modules: {
              toolbar: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
              ]
            },
            placeholder: 'Edit your document...',
            theme: 'snow',  // or 'bubble'
          });
          
          // Set initial content
          if (content) {
            try {
              // Try to parse as delta first
              const delta = JSON.parse(content);
              editor.setContents(delta);
            } catch (e) {
              // If parsing fails, set as HTML
              editor.clipboard.dangerouslyPasteHTML(content);
            }
          }
          
          // Set source content for source mode
          setSourceContent(editorRef.current.querySelector('.ql-editor')?.innerHTML || '');
          
          // Save content when editor changes
          editor.on('text-change', () => {
            const html = editorRef.current?.querySelector('.ql-editor')?.innerHTML || '';
            setSourceContent(html);
            
            // Detect variables in the content and highlight them
            highlightVariables(editor);
          });
          
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('Error loading document editor:', error);
      }
    };
    
    loadEditor();
    
    // Cleanup
    return () => {
      // Nothing to clean up for now
    };
  }, [content]);
  
  // Function to highlight variables in the content
  const highlightVariables = (editor: any) => {
    const text = editor.getText();
    const regex = /{{([^{}]+)}}/g;
    let match;
    
    // Reset formatting
    const format = editor.getFormat();
    if (format.variable) {
      const range = editor.getSelection();
      if (range) {
        editor.removeFormat(0, editor.getLength());
      }
    }
    
    // Find and highlight all variables
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      
      // Add custom class to variable
      editor.formatText(start, end, {
        'color': '#3182ce',
        'background': '#ebf8ff',
        'font': 'monospace',
        'border': '1px dashed #4299e1',
        'border-radius': '4px',
        'padding': '0 4px',
        'variable': true
      });
    }
  };
  
  const toggleEditingMode = () => {
    if (editingMode === 'wysiwyg') {
      setEditingMode('source');
    } else {
      setEditingMode('wysiwyg');
      if (editorRef.current) {
        const quill = (window as any).Quill.find(editorRef.current.querySelector('.ql-editor'));
        if (quill) {
          quill.clipboard.dangerouslyPasteHTML(sourceContent);
        }
      }
    }
  };
  
  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSourceContent(e.target.value);
  };
  
  const handleSave = () => {
    onSave(sourceContent);
  };
  
  const handleDownload = () => {
    // Create a Blob from the HTML content
    const blob = new Blob([sourceContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/\.(docx|doc)$/, '.html');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Document Editor</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filename}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleEditingMode}
          >
            {editingMode === 'wysiwyg' ? 'Source Mode' : 'Visual Mode'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="flex items-center gap-1"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </Button>
        </div>
      </div>
      
      {editingMode === 'wysiwyg' ? (
        <div 
          ref={editorRef} 
          className="flex-grow border rounded-md min-h-[600px] document-editor-container"
        />
      ) : (
        <textarea
          value={sourceContent}
          onChange={handleSourceChange}
          className="flex-grow border rounded-md min-h-[600px] p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900"
        />
      )}
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded-md">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading document editor...</p>
          </div>
        </div>
      )}
    </div>
  );
}
