"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Code, 
  Eye, 
  FileText, 
  Trash2, 
  Plus, 
  MoveHorizontal, 
  PanelLeft, 
  PanelRight,
  Edit, 
  Save,
  RefreshCw
} from "lucide-react"
import { DragIcon } from "@/components/ui/icons"
import { extractVariables, replaceVariables } from "@/lib/document-processor"
import { formatVariablePlaceholders } from "@/lib/variable-formatter"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Template, FormElement, DocumentVariable } from "@/lib/types"

interface EnhancedFormEditorProps {
  template: Template | null
  elements: FormElement[]
  updateElements: (elements: FormElement[]) => void
  variables: string[]
  updateVariables: (variables: string[]) => void
  onSave?: (updatedTemplate: Template) => void
}

export function EnhancedFormEditor({
  template,
  elements,
  updateElements,
  variables,
  updateVariables,
  onSave
}: EnhancedFormEditorProps) {
  const [editMode, setEditMode] = useState<'visual' | 'source'>('visual')
  const [htmlContent, setHtmlContent] = useState("")
  const [sourceHtml, setSourceHtml] = useState("")
  const [draggedVariable, setDraggedVariable] = useState<string | null>(null)
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null)
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [editingVariableName, setEditingVariableName] = useState<{ original: string, new: string } | null>(null)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [variableToEdit, setVariableToEdit] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localElements, setLocalElements] = useState<FormElement[]>([])
  
  const editorRef = useRef<HTMLDivElement>(null)
  const dragTargetRef = useRef<HTMLDivElement>(null)
  
  // Initialize editor content from template
  useEffect(() => {
    if (template?.htmlContent) {
      setHtmlContent(template.htmlContent)
      setSourceHtml(template.htmlContent)
      
      // Initialize variable values
      const initialValues = variables.reduce((acc, v) => {
        acc[v] = ""
        return acc
      }, {} as Record<string, string>)
      setVariableValues(initialValues)
    }
    
    if (elements) {
      setLocalElements(elements)
    }
  }, [template, variables, elements])
  
  // Save HTML content changes
  const saveHtmlChanges = () => {
    if (!template) return
    
    try {
      // If in source mode, update from source editor
      if (editMode === 'source') {
        setHtmlContent(sourceHtml)
        
        // Extract variables from the new HTML
        const newVariables = extractVariables(sourceHtml)
        updateVariables(newVariables)
        
        // Update values for new variables
        const newValues = { ...variableValues }
        newVariables.forEach(v => {
          if (!newValues[v]) {
            newValues[v] = ""
          }
        })
        setVariableValues(newValues)
      }
      
      // Save template with the current content
      if (onSave) {
        onSave({
          ...template,
          htmlContent: editMode === 'source' ? sourceHtml : htmlContent
        })
      }
      
      setError(null)
    } catch (err) {
      console.error("Error saving changes:", err)
      setError("Failed to save changes")
    }
  }
  
  // Handle drag start for a variable
  const handleDragStart = (e: React.DragEvent, variable: string) => {
    e.dataTransfer.setData("text/plain", `{{${variable}}}`)
    setDraggedVariable(variable)
    
    // Add a custom drag image
    const dragImage = document.createElement('div')
    dragImage.className = 'bg-primary/20 border border-primary text-primary px-2 py-1 rounded text-sm'
    dragImage.textContent = `{{${variable}}}`
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 0)
  }
  
  // Handle drag over on editor
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (editorRef.current) {
      editorRef.current.classList.add('border-primary')
    }
  }
  
  // Handle drag leave from editor
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (editorRef.current) {
      editorRef.current.classList.remove('border-primary')
    }
  }
  
  // Handle drop on editor
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedVariable || !editorRef.current) return
    
    if (editorRef.current) {
      editorRef.current.classList.remove('border-primary')
    }
    
    // Calculate the drop position
    const rect = editorRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Insert variable at cursor position
    if (editMode === 'visual') {
      insertVariableAtPosition(draggedVariable, x, y)
    }
    
    setDraggedVariable(null)
  }
  
  // Insert variable in editor at relative position
  const insertVariableAtPosition = (variable: string, x: number, y: number) => {
    if (!editorRef.current) return
    
    const selection = window.getSelection()
    if (!selection) return
    
    // Try to determine which text node was clicked
    const range = document.caretRangeFromPoint ? 
      document.caretRangeFromPoint(x, y) :
      document.createRange() // Fallback
    
    if (range) {
      selection.removeAllRanges()
      selection.addRange(range)
      
      // Insert the variable
      document.execCommand('insertHTML', false, formatVariablePlaceholders(`{{${variable}}}`))
      
      // Update HTML content
      if (editorRef.current) {
        setHtmlContent(editorRef.current.innerHTML)
      }
    }
  }
  
  // Toggle edit mode between visual and source
  const toggleEditMode = () => {
    if (editMode === 'visual') {
      // Switching to source, update source from current visual content
      setSourceHtml(editorRef.current?.innerHTML || htmlContent)
      setEditMode('source')
    } else {
      // Switching to visual, update visual from current source content
      setHtmlContent(sourceHtml)
      setEditMode('visual')
    }
  }
  
  // Create a new variable
  const createNewVariable = () => {
    const baseName = "newVariable"
    let uniqueName = baseName
    let counter = 1
    
    // Ensure unique name
    while (variables.includes(uniqueName)) {
      uniqueName = `${baseName}${counter}`
      counter++
    }
    
    // Add the new variable to the list
    const newVariables = [...variables, uniqueName]
    updateVariables(newVariables)
    
    // Update values with the new variable
    setVariableValues({
      ...variableValues,
      [uniqueName]: ""
    })
    
    // Select the new variable for edit
    setEditingVariableName({ original: uniqueName, new: uniqueName })
  }
  
  // Handle delete variable
  const deleteVariable = (variable: string) => {
    if (!variable) return
    
    // First, check if variable is in use in the HTML content
    const regex = new RegExp(`{{\\s*${variable}\\s*}}`, 'g')
    const inUse = regex.test(htmlContent)
    
    if (inUse) {
      if (!window.confirm(`The variable "${variable}" is used in the document. Are you sure you want to delete it?`)) {
        return
      }
      
      // Remove variable from HTML content
      let updatedHtml = htmlContent.replace(regex, '')
      setHtmlContent(updatedHtml)
      
      if (editMode === 'source') {
        let updatedSource = sourceHtml.replace(regex, '')
        setSourceHtml(updatedSource)
      }
      
      // Save to template with variable removed
      if (template && onSave) {
        onSave({
          ...template,
          htmlContent: updatedHtml
        })
      }
    }
    
    // Remove variable from list
    const newVariables = variables.filter(v => v !== variable)
    updateVariables(newVariables)
    
    // Remove variable from values
    const newValues = { ...variableValues }
    delete newValues[variable]
    setVariableValues(newValues)
    
    // Remove from form elements if present
    const updatedElements = localElements.filter(el => 
      el.properties.variableName !== variable
    )
    
    if (updatedElements.length !== localElements.length) {
      setLocalElements(updatedElements)
      updateElements(updatedElements)
    }
  }
  
  // Save variable name edit
  const saveVariableNameEdit = () => {
    if (!editingVariableName) return
    
    const { original, new: newName } = editingVariableName
    
    // Check if new name is valid
    if (!newName.trim()) {
      setError("Variable name cannot be empty")
      return
    }
    
    // Check if new name is unique
    if (original !== newName && variables.includes(newName)) {
      setError(`Variable name "${newName}" already exists`)
      return
    }
    
    // Update variable in variables list
    const newVariables = variables.map(v => 
      v === original ? newName : v
    )
    updateVariables(newVariables)
    
    // Update variable in HTML content
    const regex = new RegExp(`{{\\s*${original}\\s*}}`, 'g')
    const updatedHtml = htmlContent.replace(regex, `{{${newName}}}`)
    setHtmlContent(updatedHtml)
    
    if (editMode === 'source') {
      const updatedSource = sourceHtml.replace(regex, `{{${newName}}}`)
      setSourceHtml(updatedSource)
    }
    
    // Update variable in values
    const newValues = { ...variableValues }
    if (original in newValues) {
      newValues[newName] = newValues[original]
      delete newValues[original]
    }
    setVariableValues(newValues)
    
    // Update variable in form elements
    const updatedElements = localElements.map(el => {
      if (el.properties.variableName === original) {
        return {
          ...el,
          properties: {
            ...el.properties,
            variableName: newName,
            label: el.properties.label === original ? newName : el.properties.label
          }
        }
      }
      return el
    })
    
    if (JSON.stringify(updatedElements) !== JSON.stringify(localElements)) {
      setLocalElements(updatedElements)
      updateElements(updatedElements)
    }
    
    // Save to template with variable renamed
    if (template && onSave) {
      onSave({
        ...template,
        htmlContent: updatedHtml
      })
    }
    
    setEditingVariableName(null)
    setError(null)
  }
  
  // Cancel variable name edit
  const cancelVariableNameEdit = () => {
    setEditingVariableName(null)
    setError(null)
  }
  
  // Create form element for a variable
  const createFormElement = (variable: string, type: 'input' | 'textarea' | 'dropdown') => {
    // Check if there's already an element with this variable name
    const existingElement = localElements.find(el => 
      el.properties.variableName === variable
    )
    
    if (existingElement) {
      // If it exists, update its type
      const updatedElements = localElements.map(el => {
        if (el.id === existingElement.id) {
          return {
            ...el,
            type,
            size: { 
              width: 200, 
              height: type === "textarea" ? 100 : 40 
            }
          }
        }
        return el
      })
      
      setLocalElements(updatedElements)
      updateElements(updatedElements)
    } else {
      // Create a new element
      const newElement: FormElement = {
        id: `element-${Date.now()}`,
        type,
        position: { x: 50, y: 50 + localElements.length * 60 },
        size: { 
          width: 200, 
          height: type === "textarea" ? 100 : 40 
        },
        properties: {
          label: variable,
          variableName: variable,
          options: type === "dropdown" ? ["Option 1", "Option 2", "Option 3"] : undefined,
        },
      }
      
      const updatedElements = [...localElements, newElement]
      setLocalElements(updatedElements)
      updateElements(updatedElements)
    }
  }
  
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant={editMode === 'visual' ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode('visual')}
          >
            <Eye className="w-4 h-4 mr-1" />
            Visual Mode
          </Button>
          <Button
            variant={editMode === 'source' ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode('source')}
          >
            <Code className="w-4 h-4 mr-1" />
            Source Mode
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarVisible(!sidebarVisible)}
          >
            {sidebarVisible ? (
              <>
                <PanelRight className="w-4 h-4 mr-1" />
                Hide Sidebar
              </>
            ) : (
              <>
                <PanelLeft className="w-4 h-4 mr-1" />
                Show Sidebar
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={saveHtmlChanges}
          >
            <Save className="w-4 h-4 mr-1" />
            Save Changes
          </Button>
        </div>
      </div>
      
      <div className="flex gap-4">
        <div className={`flex-grow ${editMode === 'source' ? 'max-w-full' : ''}`}>
          <Card className="min-h-[500px]">
            <CardContent className="p-4">
              {editMode === 'visual' ? (
                <div
                  ref={editorRef}
                  className="prose max-w-none min-h-[450px] document-preview word-document-content word-format p-4 border rounded"
                  contentEditable
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onInput={(e) => setHtmlContent(e.currentTarget.innerHTML)}
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              ) : (
                <textarea
                  className="w-full h-[450px] font-mono text-sm p-4 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  value={sourceHtml}
                  onChange={(e) => setSourceHtml(e.target.value)}
                  placeholder="Edit HTML source here..."
                />
              )}
            </CardContent>
          </Card>
        </div>
        
        {sidebarVisible && (
          <div className="w-80">
            <Card className="h-[500px] overflow-auto">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-medium">Variables</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={createNewVariable}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      New Variable
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {variables.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <p>No variables found in template</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={createNewVariable}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Create your first variable
                        </Button>
                      </div>
                    ) : (
                      variables.map((variable) => (
                        <div
                          key={variable}
                          className={`p-2 bg-gray-50 dark:bg-gray-900 border rounded ${selectedVariable === variable ? 'border-primary' : 'border-border'}`}
                        >
                          {editingVariableName?.original === variable ? (
                            <div className="space-y-2">
                              <Label htmlFor={`var-edit-${variable}`}>
                                Edit Variable Name
                              </Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  id={`var-edit-${variable}`}
                                  value={editingVariableName.new}
                                  onChange={(e) => setEditingVariableName({
                                    ...editingVariableName,
                                    new: e.target.value
                                  })}
                                  autoFocus
                                />
                              </div>
                              <div className="flex justify-end gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={cancelVariableNameEdit}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={saveVariableNameEdit}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="font-mono cursor-move p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, variable)}
                                  >
                                    <MoveHorizontal className="w-4 h-4 text-gray-500" />
                                  </span>
                                  <span className="font-medium">{variable}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => setEditingVariableName({
                                      original: variable,
                                      new: variable
                                    })}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                    onClick={() => deleteVariable(variable)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <Badge 
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {localElements.find(el => el.properties.variableName === variable)?.type || 'No form element'}
                                </Badge>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs"
                                    onClick={() => createFormElement(variable, 'input')}
                                  >
                                    Input
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs"
                                    onClick={() => createFormElement(variable, 'textarea')}
                                  >
                                    Textarea
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs"
                                    onClick={() => createFormElement(variable, 'dropdown')}
                                  >
                                    Dropdown
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
