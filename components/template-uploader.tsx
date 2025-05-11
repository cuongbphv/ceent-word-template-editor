"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { processWordDocument } from "@/lib/document-processor"
import type { Template } from "@/lib/types"

interface TemplateUploaderProps {
  onUpload: (template: Template) => void
}

export function TemplateUploader({ onUpload }: TemplateUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

  const handleBrowseClick = () => {
    // Trigger file input click programmatically
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFile = async (file: File) => {
    // Reset state
    setError(null)
    setProgress(0)
    
    // Check if it's a Word document
    if (!file.name.endsWith(".docx") && !file.name.endsWith(".doc")) {
      setError("Please upload a Word document (.doc or .docx)")
      return
    }

    try {
      setIsProcessing(true)
      
      // Simulate progress (in a real app, this would be actual progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 10
          return newProgress < 90 ? newProgress : prev
        })
      }, 100)
      
      // Process the Word document
      const result = await processWordDocument(file)
      
      clearInterval(progressInterval)
      setProgress(100)
      
      if (result.error) {
        setError(result.error)
        return
      }
      
      // Create a template object
      const template: Template = {
        id: `template-${Date.now()}`,
        name: file.name,
        file: file,
        content: URL.createObjectURL(file),
        htmlContent: result.html,
        processedAt: new Date().toISOString(),
      }
      
      // Pass the template to the parent component
      onUpload(template)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process document")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-gray-300"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!isProcessing ? (
        <>
          <FileText className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Upload Word Template</h3>
          <p className="text-sm text-gray-500 mb-4 text-center">
            Drag and drop your Word document here, or click to browse
          </p>
          
          {/* Hidden file input */}
          <input 
            ref={fileInputRef}
            id="file-upload" 
            type="file" 
            accept=".doc,.docx" 
            className="hidden" 
            onChange={handleFileInput} 
          />
          
          {/* Regular button that triggers the file input */}
          <Button onClick={handleBrowseClick}>
            Browse Files
          </Button>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </>
      ) : (
        <div className="w-full max-w-md">
          <div className="flex items-center mb-2">
            <Upload className="w-5 h-5 text-primary mr-2" />
            <span className="text-sm font-medium">Processing document...</span>
          </div>
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-xs text-gray-500">
            Converting document to HTML and extracting variables
          </p>
        </div>
      )}
    </div>
  )
}
