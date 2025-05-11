"use client"

import {useEffect, useState} from "react"
import {Button} from "@/components/ui/button"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {AlertCircle, Code, Copy, Download, RefreshCw} from "lucide-react"
import type {FormElement, Template} from "@/lib/types"

interface JsonStructureViewProps {
  template: Template | null
  elements: FormElement[]
  variables: string[]
}

export function JsonStructureView({ template, elements, variables }: JsonStructureViewProps) {
  const [jsonString, setJsonString] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!template) return
    
    try {
      generateJsonStructure()
    } catch (err) {
      setError("Failed to generate JSON structure")
    }
  }, [template, elements, variables])

  const generateJsonStructure = () => {
    if (!template) return
    
    // Create a complete structure that represents the form
    const formStructure = {
      templateId: template.id,
      templateName: template.name,
      formElements: elements.map(element => ({
        id: element.id,
        type: element.type,
        properties: {
          label: element.properties.label,
          variableName: element.properties.variableName,
          options: element.properties.options
        }
      })),
      variables: variables.map(varName => {
        // Check if this variable is used in any form element
        const associatedElement = elements.find(
          el => el.properties.variableName === varName
        )
        
        return {
          name: varName,
          isUsedInForm: !!associatedElement,
          elementType: associatedElement?.type || null,
          elementId: associatedElement?.id || null
        }
      })
    }
    
    // Format the JSON string with indentation for readability
    setJsonString(JSON.stringify(formStructure, null, 2))
  }

  const handleCopyJson = () => {
    if (!jsonString) return
    
    navigator.clipboard.writeText(jsonString)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        setError("Failed to copy to clipboard")
      })
  }

  const handleDownloadJson = () => {
    if (!jsonString || !template) return
    
    try {
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement("a")
      a.href = url
      a.download = `${template.name.replace(/\.(docx|doc)$/, "")}-form-structure.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError("Failed to download JSON file")
    }
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No template uploaded</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Code className="h-5 w-5 text-primary" />
          Form Structure JSON
        </h2>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={generateJsonStructure}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button 
            size="sm" 
            variant={copied ? "success" : "default"}
            onClick={handleCopyJson}
            className="flex items-center gap-1"
          >
            <Copy className="h-4 w-4" />
            <span>{copied ? "Copied!" : "Copy"}</span>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleDownloadJson}
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
      
      <div className="bg-gray-50 dark:bg-gray-900 border rounded-md">
        <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700">
          <span className="text-sm font-medium">JSON Structure</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {elements.length} form elements, {variables.length} variables
          </span>
        </div>
        <pre className="p-4 overflow-auto max-h-[500px] font-mono text-sm text-gray-800 dark:text-gray-300 whitespace-pre">
          {jsonString || "No JSON structure available"}
        </pre>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Using this JSON structure</h3>
        <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
          This JSON structure can be used to:
        </p>
        <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>Generate dynamic forms in your application</li>
          <li>Map form fields to document variables</li>
          <li>Create validation rules for your form data</li>
          <li>Build form submission logic in your backend</li>
        </ul>
      </div>
    </div>
  )
}
