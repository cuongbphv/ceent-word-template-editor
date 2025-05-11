"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  FileText, 
  Edit3, 
  Code, 
  Eye, 
  Save, 
  Download, 
  RefreshCw,
  AlertCircle,
  Layers
} from "lucide-react"
import { extractVariables, replaceVariables } from "@/lib/document-processor"
import type { Template, DocumentVariable, FormElement } from "@/lib/types"

interface WordEditorProps {
  template: Template | null
  elements?: FormElement[]
  onVariablesExtracted?: (variables: string[]) => void
  onSave?: (updatedTemplate: Template) => void
  onAddFormElement?: (variableName: string, elementType: string) => void
}

export function WordEditor({ 
  template, 
  elements = [],
  onVariablesExtracted, 
  onSave,
  onAddFormElement
}: WordEditorProps) {
  const [activeTab, setActiveTab] = useState("preview")
  const [htmlContent, setHtmlContent] = useState("")
  const [editableHtml, setEditableHtml] = useState("")
  const [variables, setVariables] = useState<DocumentVariable[]>([])
  const [previewHtml, setPreviewHtml] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [formMode, setFormMode] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null)

  // Use a ref to track if this is the first run to avoid unnecessary re-renders
  const isFirstRun = useRef(true);

  // Initialize editor when template changes - with proper dependency management
  useEffect(() => {
    if (!template?.htmlContent) return;
    
    if (isFirstRun.current) {
      isFirstRun.current = false;
      
      // These state updates are now only happening on the first run
      setHtmlContent(template.htmlContent);
      setEditableHtml(template.htmlContent);
      
      // Extract variables from the template
      const extractedVars = extractVariables(template.htmlContent);
      const varObjects = extractedVars.map(name => {
        // Check if this variable is already used in a form element
        const isUsed = elements.some(el => el.properties.variableName === name);
        
        return {
          name,
          value: "",
          description: "",
          isUsed
        };
      });
      
      setVariables(varObjects);
      
      // Prepare preview content
      const values = varObjects.reduce((acc, v) => {
        acc[v.name] = v.value || `{{${v.name}}}`;
        return acc;
      }, {} as Record<string, string>);
      
      const replaced = replaceVariables(template.htmlContent, values);
      setPreviewHtml(replaced);
      
      // Notify parent component about variables
      if (onVariablesExtracted) {
        onVariablesExtracted(extractedVars);
      }
    }
  }, [template?.htmlContent]); // Only depend on the template.htmlContent
  
  // Handle element changes in a separate effect
  useEffect(() => {
    if (!template?.htmlContent || !elements.length) return;
    
    // Update variable usage status based on elements
    setVariables(prev => prev.map(variable => ({
      ...variable,
      isUsed: elements.some(el => el.properties.variableName === variable.name)
    })));
    
  }, [elements, template?.htmlContent]);

  // Add click handlers to variables in the preview - memoized to prevent re-renders
  const addClickHandlersToVariables = useCallback(() => {
    if (!previewRef.current) return

    // Find all text nodes in the preview
    const walker = document.createTreeWalker(
        previewRef.current,
        NodeFilter.SHOW_TEXT,
        null
    )

    const nodesToReplace: Array<{ node: Text; variable: string }> = []

    // First, collect all text nodes that contain variables
    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      const text = node.textContent || ""

      // Check if this text node contains a variable placeholder
      const varMatch = text.match(/{{([^{}]+)}}/)
      if (varMatch) {
        nodesToReplace.push({ node, variable: varMatch[1] })
      }
    }

    // Now replace the nodes with clickable spans
    nodesToReplace.forEach(({ node, variable }) => {
      const text = node.textContent || ""
      const parts = text.split(`{{${variable}}}`)

      if (parts.length > 1) {
        const fragment = document.createDocumentFragment()

        // Add the text before the variable
        if (parts[0]) {
          fragment.appendChild(document.createTextNode(parts[0]))
        }

        // Create a clickable span for the variable
        const span = document.createElement("span")
        span.textContent = `{{${variable}}}`
        span.className = "variable-placeholder cursor-pointer"
        span.dataset.variable = variable

        // Check if this variable is already used in a form element
        const isUsed = elements.some(el => el.properties.variableName === variable)
        if (isUsed) {
          span.className += " bg-green-100 border-green-300"
        }

        // Add click handler
        span.addEventListener("click", () => {
          setSelectedVariable(variable)
        })

        fragment.appendChild(span)

        // Add the text after the variable
        if (parts[1]) {
          fragment.appendChild(document.createTextNode(parts[1]))
        }

        // Replace the original node with our fragment
        if (node.parentNode) {
          node.parentNode.replaceChild(fragment, node)
        }
      }
    })
  }, [elements, setSelectedVariable])

  // Update preview when variables change - memoized to prevent unnecessary re-renders
  const updatePreview = useCallback((html: string, vars: DocumentVariable[]) => {
    try {
      const values = vars.reduce((acc, v) => {
        acc[v.name] = v.value || `{{${v.name}}}`
        return acc
      }, {} as Record<string, string>)

      const replaced = replaceVariables(html, values)
      setPreviewHtml(replaced)

      // If in form mode, we'll add click handlers to variables after the DOM has updated
      if (formMode) {
        setTimeout(() => {
          addClickHandlersToVariables()
        }, 100)
      }
    } catch (err) {
      console.error("Error updating preview:", err)
      setError("Failed to update preview")
    }
  }, [formMode, addClickHandlersToVariables]);
  
  // Update preview when variables change
  useEffect(() => {
    if (htmlContent && variables.length > 0) {
      updatePreview(htmlContent, variables);
    }
  }, [htmlContent, variables, updatePreview]);

  // Handle variable value changes
  const handleVariableChange = (name: string, value: string) => {
    const updatedVars = variables.map(v => 
      v.name === name ? { ...v, value } : v
    )
    setVariables(updatedVars)
    updatePreview(htmlContent, updatedVars)
  }

  // Handle variable description changes
  const handleDescriptionChange = (name: string, description: string) => {
    setVariables(variables.map(v => 
      v.name === name ? { ...v, description } : v
    ))
  }

  // Apply HTML changes from the editor
  const applyHtmlChanges = () => {
    try {
      setHtmlContent(editableHtml)
      
      // Re-extract variables in case they changed
      const extractedVars = extractVariables(editableHtml)
      
      // Merge with existing variables to keep values
      const updatedVars = extractedVars.map(name => {
        const existing = variables.find(v => v.name === name)
        return existing || { name, value: "", description: "", isUsed: false }
      })
      
      setVariables(updatedVars)
      updatePreview(editableHtml, updatedVars)
      setActiveTab("preview")
      
      // Notify parent about the change
      if (onSave && template) {
        onSave({
          ...template,
          htmlContent: editableHtml
        })
      }
    } catch (err) {
      console.error("Error applying HTML changes:", err)
      setError("Failed to apply changes to the template")
    }
  }

  // Save template with filled variables
  const saveTemplate = () => {
    if (!template) return
    
    try {
      // Apply variables to the template
      const values = variables.reduce((acc, v) => {
        acc[v.name] = v.value
        return acc
      }, {} as Record<string, string>)
      
      const filledHtml = replaceVariables(htmlContent, values)
      
      // In a real app, you would convert the HTML back to DOCX here
      // For now, we just update the template object
      if (onSave) {
        onSave({
          ...template,
          htmlContent: filledHtml,
          variables: variables.map(v => v.name)
        })
      }
    } catch (err) {
      console.error("Error saving template:", err)
      setError("Failed to save the template")
    }
  }

  // Download the filled template
  const downloadTemplate = () => {
    if (!template) return
    
    try {
      // For now, we'll just download the HTML as a file
      // In a real app, you would convert to DOCX first
      const values = variables.reduce((acc, v) => {
        acc[v.name] = v.value
        return acc
      }, {} as Record<string, string>)
      
      const filledHtml = replaceVariables(htmlContent, values)
      
      const blob = new Blob([filledHtml], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement("a")
      a.href = url
      a.download = template.name.replace(/\.(docx|doc)$/, ".html")
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error downloading template:", err)
      setError("Failed to download the template")
    }
  }

  // Create a form element for the selected variable
  const createFormElement = (type: 'input' | 'textarea' | 'dropdown') => {
    if (!selectedVariable || !onAddFormElement) return
    
    onAddFormElement(selectedVariable, type)
    
    // Mark this variable as used
    setVariables(variables.map(v => 
      v.name === selectedVariable ? { ...v, isUsed: true } : v
    ))
    
    // Update preview to reflect the change
    updatePreview(htmlContent, variables.map(v => 
      v.name === selectedVariable ? { ...v, isUsed: true } : v
    ))
    
    // Clear the selection
    setSelectedVariable(null)
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Template Selected</h3>
          <p className="text-sm text-gray-500">
            Please upload a Word document to begin editing
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="preview" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </TabsTrigger>
            <TabsTrigger value="variables" className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              <span>Variables</span>
            </TabsTrigger>
            <TabsTrigger value="html" className="flex items-center gap-1">
              <Edit3 className="h-4 w-4" />
              <span>HTML</span>
            </TabsTrigger>
            {/*<TabsTrigger value="form" className="flex items-center gap-1">*/}
            {/*  <Layers className="h-4 w-4" />*/}
            {/*  <span>Form Designer</span>*/}
            {/*</TabsTrigger>*/}
          </TabsList>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={saveTemplate}
              className="flex items-center gap-1"
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={downloadTemplate}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <TabsContent value="preview" className="mt-0">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Document Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="border-t">
              <div 
                ref={previewRef}
                className="prose max-w-none min-h-[500px] document-preview word-document-content word-format"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="mt-0">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="h-4 w-4" />
                Template Variables
              </CardTitle>
            </CardHeader>
            <CardContent className="border-t">
              {variables.length === 0 ? (
                <div className="text-center py-12">
                  <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Variables Found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    This template doesn&apos;t contain any {"{{"}<span>variable</span>{"}}"}  placeholders
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("html")}
                    className="flex items-center gap-1 mx-auto"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit Template</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {variables.map((variable, index) => (
                    <div key={variable.name} className="space-y-3">
                      {index > 0 && <Separator />}
                      <div className="pt-3">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`var-${variable.name}`} className="flex-grow">
                              {variable.name}
                            </Label>
                            {variable.isUsed && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                                Used in form
                              </span>
                            )}
                          </div>
                          <Input
                            id={`var-${variable.name}`}
                            value={variable.value}
                            onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                            placeholder={`Value for ${variable.name}`}
                          />
                        </div>
                        <div className="mt-2">
                          <Label htmlFor={`desc-${variable.name}`} className="text-xs text-gray-500">
                            Description (optional)
                          </Label>
                          <Input
                            id={`desc-${variable.name}`}
                            value={variable.description || ""}
                            onChange={(e) => handleDescriptionChange(variable.name, e.target.value)}
                            placeholder="Add variable description"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => updatePreview(htmlContent, variables)}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Refresh Preview</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="html" className="mt-0">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                HTML Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="border-t">
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">
                  Edit the HTML template directly. Use <code>{"{{"}<span>variable</span>{"}}"}</code> syntax for placeholders.
                </p>
              </div>
              <textarea
                className="w-full h-[500px] font-mono text-sm p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={editableHtml}
                onChange={(e) => setEditableHtml(e.target.value)}
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditableHtml(htmlContent)
                    setActiveTab("preview")
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={applyHtmlChanges}>
                  Apply Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="mt-0">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Form Designer
              </CardTitle>
            </CardHeader>
            <CardContent className="border-t">
              {variables.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Variables Found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add variables to your template first to create form elements
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("html")}
                    className="flex items-center gap-1 mx-auto"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit Template</span>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-4">
                    <h3 className="font-medium mb-2">Click on variables to create form elements</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Click on a variable in the document to select it, then choose a form element type
                    </p>
                    
                    <div 
                      ref={previewRef}
                      className="prose max-w-none min-h-[400px] document-preview word-document-content word-format border rounded-md p-4 bg-white dark:bg-gray-800"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                  </div>
                  
                  <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-4">
                    <h3 className="font-medium mb-2">Form Element Creator</h3>
                    {selectedVariable ? (
                      <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                          <p className="text-sm font-medium">Selected Variable: <span className="text-blue-700 dark:text-blue-400">{selectedVariable}</span></p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Choose an element type to create a form control for this variable</p>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <Button
                            variant="outline"
                            className="p-4 h-auto flex flex-col items-center"
                            onClick={() => createFormElement('input')}
                          >
                            <div className="w-full h-8 border-2 border-gray-300 dark:border-gray-600 rounded-md mb-2"></div>
                            <span className="text-sm">Text Input</span>
                          </Button>
                          
                          <Button
                            variant="outline"
                            className="p-4 h-auto flex flex-col items-center"
                            onClick={() => createFormElement('textarea')}
                          >
                            <div className="w-full h-16 border-2 border-gray-300 dark:border-gray-600 rounded-md mb-2"></div>
                            <span className="text-sm">Text Area</span>
                          </Button>
                          
                          <Button
                            variant="outline"
                            className="p-4 h-auto flex flex-col items-center"
                            onClick={() => createFormElement('dropdown')}
                          >
                            <div className="w-full h-8 border-2 border-gray-300 dark:border-gray-600 rounded-md mb-2 flex items-center justify-end p-2">
                              <div className="w-3 h-3 border-r-2 border-b-2 border-gray-400 dark:border-gray-500 transform rotate-45"></div>
                            </div>
                            <span className="text-sm">Dropdown</span>
                          </Button>
                        </div>
                          
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedVariable(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">
                            Click on a variable in the document to select it
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-4">
                      <h3 className="font-medium mb-2">Variable Summary</h3>
                      <div className="max-h-[200px] overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                              <th className="text-left p-2">Variable</th>
                              <th className="text-left p-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y dark:divide-gray-700">
                            {variables.map(variable => (
                              <tr key={variable.name} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="p-2 font-mono text-xs">{variable.name}</td>
                                <td className="p-2">
                                  {variable.isUsed ? (
                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-xs rounded">
                                      Form element created
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs rounded">
                                      Not used in form
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
