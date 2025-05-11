"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TemplatePreview } from "@/components/template-preview"
import { EnhancedFormEditor } from "@/components/enhanced-form-editor"
import { VariableDefinition } from "@/components/variable-definition"
import { ApiSettings } from "@/components/api-settings"
import { TemplateUploader } from "@/components/template-uploader"
import { WordEditor } from "@/components/word-editor"
import { JsonStructureView } from "@/components/json-structure-view"
import { DocumentEditor } from "@/components/document-editor"
import { extractVariables } from "@/lib/document-processor"
import type { FormElement, Template } from "@/lib/types"
import {Button} from "@/components/ui/button";
import {FormElementsPanel} from "@/components/form-elements-panel";

export function TemplateEditor() {
  const [template, setTemplate] = useState<Template | null>(null)
  const [elements, setElements] = useState<FormElement[]>([])
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [apiEndpoint, setApiEndpoint] = useState("")
  const [previewData, setPreviewData] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState("document")
  const [selectedElement, setSelectedElement] = useState<FormElement | null>(null)
  const [elementProperties, setElementProperties] = useState<{
    label: string
    variableName: string
    options?: string[]
  }>({
    label: "",
    variableName: "",
    options: [],
  })
  const [documentVariables, setDocumentVariables] = useState<string[]>([])
  const [editorMode, setEditorMode] = useState<'basic' | 'advanced'>('basic')

  const handleTemplateUpload = (newTemplate: Template) => {
    setTemplate(newTemplate)
    
    // If the template has HTML content, extract variables
    if (newTemplate.htmlContent) {
      const extractedVars = extractVariables(newTemplate.htmlContent)
      setDocumentVariables(extractedVars)
      
      // Create form elements for each variable
      const newElements = extractedVars.map((varName, index) => {
        return {
          id: `element-${Date.now()}-${index}`,
          type: "input",
          position: { x: 50, y: 50 + index * 60 },
          size: { width: 200, height: 40 },
          properties: {
            label: varName,
            variableName: varName,
          },
        } as FormElement
      })
      
      setElements(prevElements => [...prevElements, ...newElements])
    }
  }

  const handleAddElement = (elementType: string) => {
    const newElement: FormElement = {
      id: `element-${Date.now()}`,
      type: elementType as "input" | "textarea" | "dropdown",
      position: { x: 50, y: 50 },
      size: { width: 200, height: elementType === "textarea" ? 100 : 40 },
      properties: {
        label: `New ${elementType}`,
        variableName: "",
        options: elementType === "dropdown" ? ["Option 1", "Option 2", "Option 3"] : undefined,
      },
    }
    setElements([...elements, newElement])
  }

  const handleElementDrag = (id: string, deltaX: number, deltaY: number) => {
    setElements(
      elements.map((el) => {
        if (el.id === id) {
          return {
            ...el,
            position: {
              x: el.position.x + deltaX,
              y: el.position.y + deltaY,
            },
          }
        }
        return el
      }),
    )
  }

  const updateElement = (id: string, updates: Partial<FormElement>) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, ...updates } : el)))
  }

  const removeElement = (id: string) => {
    setElements(elements.filter((el) => el.id !== id))
  }

  const loadDataFromApi = async () => {
    if (!apiEndpoint) {
      // Switch to the preview tab even without an API endpoint
      setActiveTab("preview")
      return
    }

    try {
      const response = await fetch(apiEndpoint)
      const data = await response.json()
      setPreviewData(data)
      setActiveTab("preview")
    } catch (error) {
      console.error("Failed to fetch data:", error)
      alert("Failed to load data from API. Please check the endpoint and try again.")
    }
  }

  const handleElementSelect = (element: FormElement) => {
    setSelectedElement(element)
    setElementProperties({
      label: element.properties.label,
      variableName: element.properties.variableName,
      options: element.properties.options,
    })
  }

  const handleVariablesExtracted = (variables: string[]) => {
    setDocumentVariables(variables)
  }

  const handleSaveTemplate = (updatedTemplate: Template) => {
    setTemplate(updatedTemplate)
  }
  
  const handleAddFormElement = (variableName: string, elementType: string) => {
    // Find if there's already an element with this variable name
    const existingElement = elements.find(el => 
      el.properties.variableName === variableName
    )
    
    if (existingElement) {
      // If it exists, we'll update its type
      updateElement(existingElement.id, {
        type: elementType as "input" | "textarea" | "dropdown",
        size: { 
          width: 200, 
          height: elementType === "textarea" ? 100 : 40 
        }
      })
    } else {
      // Otherwise create a new element
      const newElement: FormElement = {
        id: `element-${Date.now()}`,
        type: elementType as "input" | "textarea" | "dropdown",
        position: { x: 50, y: 50 + elements.length * 60 },
        size: { 
          width: 200, 
          height: elementType === "textarea" ? 100 : 40 
        },
        properties: {
          label: variableName,
          variableName: variableName,
          options: elementType === "dropdown" ? ["Option 1", "Option 2", "Option 3"] : undefined,
        },
      }
      setElements([...elements, newElement])
    }
    
    // Switch to the form editor tab to see the result
    setActiveTab("editor")
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="document">Document</TabsTrigger>
            <TabsTrigger value="editor">Form Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
          
          <TabsContent value="document">
            <Card className="min-h-[600px]">
              <CardContent className="p-6">
                {!template ? (
                  <TemplateUploader onUpload={handleTemplateUpload} />
                ) : (
                  <WordEditor 
                    template={template}
                    elements={elements}
                    onVariablesExtracted={handleVariablesExtracted}
                    onSave={handleSaveTemplate}
                    onAddFormElement={handleAddFormElement}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="editor">
            <Card className="min-h-[600px]">
              <CardContent className="p-6">
                {!template ? (
                  <div className="flex flex-col items-center justify-center h-96">
                    <p className="text-gray-500 mb-4">Upload a template first to edit the form</p>
                    <TemplateUploader onUpload={handleTemplateUpload} />
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex justify-between items-center">
                      <h3 className="text-lg font-medium">Form Editor</h3>
                      <Button
                        variant="outline"
                        onClick={() => setEditorMode(editorMode === 'basic' ? 'advanced' : 'basic')}
                      >
                        Switch to {editorMode === 'basic' ? 'Advanced' : 'Basic'} Editor
                      </Button>
                    </div>
                    
                    {editorMode === 'advanced' ? (
                      <EnhancedFormEditor
                        template={template}
                        elements={elements}
                        updateElements={setElements}
                        variables={documentVariables}
                        updateVariables={setDocumentVariables}
                        onSave={handleSaveTemplate}
                      />
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 relative">
                          {/* Document editor */}
                          <DocumentEditor 
                            content={template.htmlContent || ""}
                            onSave={(content) => {
                              if (template) {
                                handleSaveTemplate({
                                  ...template,
                                  htmlContent: content
                                });
                              }
                            }}
                            filename={template.name}
                          />
                          
                          {/* Overlay for form elements */}
                          <div className="absolute top-[70px] left-0 right-0 bottom-0 form-elements-container">
                            <div className="relative h-full">
                              {elements.map((element) => (
                                <DraggableElement
                                  key={element.id}
                                  element={element}
                                  onDrag={(deltaX, deltaY) => handleElementDrag(element.id, deltaX, deltaY)}
                                  onRemove={() => removeElement(element.id)}
                                  onClick={() => handleElementSelect(element)}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-4">
                            <h3 className="font-medium mb-2">Form Elements</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                              Drag and position these elements on your document
                            </p>
                            
                            <div className="space-y-2">
                              {elements.map((element) => (
                                <div
                                  key={element.id}
                                  className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm cursor-move"
                                  onClick={() => handleElementSelect(element)}
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium">{element.properties.label}</span>
                                    <button
                                      className="text-red-500 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeElement(element.id);
                                      }}
                                    >
                                      ×
                                    </button>
                                  </div>

                                  {element.type === "input" && (
                                    <input
                                      type="text"
                                      className="w-full h-8 px-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                                      placeholder={`{{${element.properties.variableName || "variable"}}}`}
                                      readOnly
                                    />
                                  )}

                                  {element.type === "textarea" && (
                                    <textarea
                                      className="w-full h-[60px] px-2 py-1 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                                      placeholder={`{{${element.properties.variableName || "variable"}}}`}
                                      readOnly
                                    />
                                  )}

                                  {element.type === "dropdown" && (
                                    <select className="w-full h-8 px-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                                      <option disabled selected>
                                        {`{{${element.properties.variableName || "variable"}}}`}
                                      </option>
                                      {element.properties.options?.map((option, i) => (
                                        <option key={i}>{option}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              ))}
                              
                              {elements.length === 0 && (
                                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                                  No form elements yet. Create them from the Document tab or add new ones below.
                                </p>
                              )}
                            </div>
                            
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button size="sm" onClick={() => handleAddElement("input")}>Add Input</Button>
                              <Button size="sm" onClick={() => handleAddElement("textarea")}>Add Textarea</Button>
                              <Button size="sm" onClick={() => handleAddElement("dropdown")}>Add Dropdown</Button>
                            </div>
                          </div>
                          
                          {selectedElement && (
                            <div className="bg-gray-50 dark:bg-gray-900 border rounded-md p-4">
                              <h3 className="font-medium mb-3">Element Properties</h3>
                              <VariableDefinition
                                elements={elements}
                                updateElement={updateElement}
                                variables={variables}
                                setVariables={setVariables}
                                selectedElement={selectedElement}
                                elementProperties={elementProperties}
                                setElementProperties={setElementProperties}
                                onCancelEdit={() => setSelectedElement(null)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card className="min-h-[600px]">
              <CardContent className="p-6">
                <TemplatePreview template={template} elements={elements} data={previewData} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="json">
            <Card className="min-h-[600px]">
              <CardContent className="p-6">
                <JsonStructureView 
                  template={template} 
                  elements={elements} 
                  variables={documentVariables} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-6">
        <FormElementsPanel onAddElement={handleAddElement} />

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Element Properties</h3>
            {elements.length > 0 && selectedElement && (
              <VariableDefinition
                elements={elements}
                updateElement={updateElement}
                variables={variables}
                setVariables={setVariables}
                selectedElement={selectedElement}
                elementProperties={elementProperties}
                setElementProperties={setElementProperties}
                onCancelEdit={() => setSelectedElement(null)}
              />
            )}
          </CardContent>
        </Card>
        
        {documentVariables.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Document Variables</h3>
              <div className="text-sm space-y-1">
                {documentVariables.map(variable => (
                  <div key={variable} className="flex items-center gap-2">
                    <span className="font-mono px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                      {variable}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">API Settings</h3>
            <ApiSettings apiEndpoint={apiEndpoint} setApiEndpoint={setApiEndpoint} onLoadData={loadDataFromApi} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface DraggableElementProps {
  element: FormElement
  onDrag: (deltaX: number, deltaY: number) => void
  onRemove: () => void
  onClick: () => void
}

function DraggableElement({ element, onDrag, onRemove, onClick }: DraggableElementProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const elementRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left mouse button
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    e.stopPropagation()

    // Add global event listeners
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    onDrag(deltaX, deltaY)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)

    // Remove global event listeners
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }

  return (
    <div
      ref={elementRef}
      className={`absolute p-2 form-element ${isDragging ? "dragging" : ""} ${element.id === 'selected' ? 'selected' : ''}`}
      style={{
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
      }}
      onMouseDown={handleMouseDown}
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium">{element.properties.label}</span>
        <button
          className="text-red-500 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          ×
        </button>
      </div>

      {element.type === "input" && (
        <input
          type="text"
          className="w-full h-8 px-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded text-sm"
          placeholder={`{{${element.properties.variableName || "variable"}}}`}
          readOnly
        />
      )}

      {element.type === "textarea" && (
        <textarea
          className="w-full h-[calc(100%-24px)] px-2 py-1 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded text-sm"
          placeholder={`{{${element.properties.variableName || "variable"}}}`}
          readOnly
        />
      )}

      {element.type === "dropdown" && (
        <select className="w-full h-8 px-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded text-sm">
          <option disabled selected>
            {`{{${element.properties.variableName || "variable"}}}`}
          </option>
          {element.properties.options?.map((option, i) => (
            <option key={i}>{option}</option>
          ))}
        </select>
      )}
    </div>
  )
}
