"use client"

import {useState} from "react"
import {Button} from "@/components/ui/button"
import {Wand2} from "lucide-react"
import type {FormElement, Template} from "@/lib/types"
import {replaceVariables} from "@/lib/document-processor"

interface TemplatePreviewProps {
  template: Template | null
  elements: FormElement[]
  data: Record<string, any>
}

export function TemplatePreview({ template, elements, data }: TemplatePreviewProps) {
  const [mockData, setMockData] = useState<Record<string, any>>({})
  const [usingMockData, setUsingMockData] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string>("")

  // Function to generate mock data
  const generateMockData = () => {
    if (!template || !elements.length) return
    
    const newMockData: Record<string, any> = {}
    
    // Generate mock data for each form element
    elements.forEach(element => {
      if (!element.properties.variableName) return
      
      const varName = element.properties.variableName
      
      switch (element.type) {
        case "input":
          // Generate different types of data based on variable name
          if (varName.toLowerCase().includes("name")) {
            newMockData[varName] = generateMockName()
          } else if (varName.toLowerCase().includes("email")) {
            newMockData[varName] = generateMockEmail()
          } else if (varName.toLowerCase().includes("phone")) {
            newMockData[varName] = generateMockPhone()
          } else if (varName.toLowerCase().includes("date")) {
            newMockData[varName] = generateMockDate()
          } else if (varName.toLowerCase().includes("address")) {
            newMockData[varName] = generateMockAddress()
          } else if (varName.toLowerCase().includes("company")) {
            newMockData[varName] = generateMockCompany()
          } else if (varName.toLowerCase().includes("price") || 
                     varName.toLowerCase().includes("amount") || 
                     varName.toLowerCase().includes("cost")) {
            newMockData[varName] = generateMockPrice()
          } else {
            newMockData[varName] = `Sample ${varName}`
          }
          break
        
        case "textarea":
          newMockData[varName] = generateMockParagraph()
          break
        
        case "dropdown":
          // For dropdown, select a random option from the available options
          if (element.properties.options && element.properties.options.length > 0) {
            const randomIndex = Math.floor(Math.random() * element.properties.options.length)
            newMockData[varName] = element.properties.options[randomIndex]
          } else {
            newMockData[varName] = `Option for ${varName}`
          }
          break
      }
    })
    
    setMockData(newMockData)
    setUsingMockData(true)
    
    // If there's HTML content, update the preview
    if (template.htmlContent) {
      const replacedHtml = replaceVariables(template.htmlContent, newMockData)
      setPreviewHtml(replacedHtml)
    }
  }
  
  // Generate a random name
  const generateMockName = () => {
    const firstNames = ['John', 'Emma', 'Michael', 'Sophia', 'William', 'Olivia', 'James', 'Ava', 'David', 'Isabella']
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson']
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
  }
  
  // Generate a random email
  const generateMockEmail = () => {
    const names = ['john', 'emma', 'michael', 'sophia', 'william', 'olivia', 'james', 'ava', 'david', 'isabella']
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'example.com', 'company.com']
    return `${names[Math.floor(Math.random() * names.length)]}${Math.floor(Math.random() * 1000)}@${domains[Math.floor(Math.random() * domains.length)]}`
  }
  
  // Generate a random phone number
  const generateMockPhone = () => {
    return `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
  }
  
  // Generate a random date
  const generateMockDate = () => {
    const month = Math.floor(Math.random() * 12) + 1
    const day = Math.floor(Math.random() * 28) + 1
    const year = 2025
    return `${month}/${day}/${year}`
  }
  
  // Generate a random address
  const generateMockAddress = () => {
    const streets = ['Main St', 'Oak Ave', 'Maple Rd', 'Washington Blvd', 'Park Ln', 'Broadway']
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia']
    const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA']
    return `${Math.floor(Math.random() * 9000) + 1000} ${streets[Math.floor(Math.random() * streets.length)]}, ${cities[Math.floor(Math.random() * cities.length)]}, ${states[Math.floor(Math.random() * states.length)]} ${Math.floor(Math.random() * 90000) + 10000}`
  }
  
  // Generate a random company name
  const generateMockCompany = () => {
    const prefixes = ['Tech', 'Global', 'Advanced', 'Next', 'Smart', 'Premier', 'Elite', 'Future', 'Dynamic', 'Innovative']
    const suffixes = ['Solutions', 'Systems', 'Industries', 'Technologies', 'Dynamics', 'Innovations', 'Enterprises', 'Group', 'Corporation', 'Inc']
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`
  }
  
  // Generate a random paragraph
  const generateMockParagraph = () => {
    const paragraphs = [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies aliquam, augue nunc ultrices nisi, eget ultricies nisl nunc eget nunc.",
      "This is a sample paragraph for demonstration purposes. It provides an example of how text might appear in a form field when populated with sample data.",
      "The quick brown fox jumps over the lazy dog. This pangram contains all the letters of the English alphabet, making it a useful test for keyboard layouts and font displays.",
      "In today's digital age, companies are embracing new technologies to streamline operations and enhance customer experiences. Innovation drives competitive advantage in the marketplace.",
      "Best practices for document management include proper categorization, version control, and regular backups. Implementing these strategies can improve workflow efficiency."
    ]
    return paragraphs[Math.floor(Math.random() * paragraphs.length)]
  }
  
  // Generate a random price
  const generateMockPrice = () => {
    return `$${(Math.random() * 1000).toFixed(2)}`
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">No template uploaded</p>
      </div>
    )
  }

  const activeData = usingMockData ? mockData : data

  if (Object.keys(activeData).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-gray-500 dark:text-gray-400">No data available for preview</p>
        <Button
          onClick={generateMockData}
          className="flex items-center gap-2"
        >
          <Wand2 className="h-4 w-4" />
          Generate Mock Data
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Template Preview</h3>
        <div className="flex items-center gap-2">
          {usingMockData ? (
            <span className="text-xs text-green-600 dark:text-green-400">Using generated mock data</span>
          ) : (
            <span className="text-xs text-blue-600 dark:text-blue-400">Using API data</span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={generateMockData}
            className="flex items-center gap-1"
          >
            <Wand2 className="h-4 w-4" />
            <span>Refresh Mock Data</span>
          </Button>
        </div>
      </div>

      {previewHtml ? (
        <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg min-h-[500px] overflow-hidden">
          <div className="absolute top-2 right-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm">
            Preview: {template.name}
          </div>
          <div
            className="prose dark:prose-invert max-w-none p-6 document-preview word-document-content word-format"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      ) : (
        <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[500px] p-4">
          <div className="absolute top-2 right-2 text-sm text-gray-500 dark:text-gray-400">Preview: {template.name}</div>

          {elements.map((element) => {
            const value = element.properties.variableName ? activeData[element.properties.variableName] || "" : ""

            return (
              <div
                key={element.id}
                className="absolute p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-sm"
                style={{
                  left: element.position.x,
                  top: element.position.y,
                  width: element.size.width,
                  height: element.size.height,
                }}
              >
                <div className="text-xs font-medium mb-1">{element.properties.label}</div>

                {element.type === "input" && (
                  <input
                    type="text"
                    className="w-full h-8 px-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                    value={value}
                    readOnly
                  />
                )}

                {element.type === "textarea" && (
                  <textarea
                    className="w-full h-[calc(100%-24px)] px-2 py-1 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                    value={value}
                    readOnly
                  />
                )}

                {element.type === "dropdown" && (
                  <select className="w-full h-8 px-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded text-sm" value={value} disabled>
                    {element.properties.options?.map((option, i) => (
                      <option key={i} selected={option === value}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
