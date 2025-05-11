"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FileInputIcon as Input, TextIcon as TextArea, BoxSelectIcon as FormSelect } from "lucide-react"
import { Button } from "@/components/ui/button"

const formElements = [
  { id: "input", icon: Input, label: "Text Input" },
  { id: "textarea", icon: TextArea, label: "Text Area" },
  { id: "dropdown", icon: FormSelect, label: "Dropdown" },
]

interface FormElementsPanelProps {
  onAddElement?: (elementType: string) => void
}

export function FormElementsPanel({ onAddElement }: FormElementsPanelProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-medium mb-3">Form Elements</h3>
        <div className="space-y-2">
          {formElements.map((element) => (
            <Button
              key={element.id}
              variant="outline"
              className="flex items-center justify-start w-full p-2 bg-gray-50 border border-gray-200 rounded cursor-pointer"
              onClick={() => onAddElement && onAddElement(element.id)}
            >
              <element.icon className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-sm">{element.label}</span>
            </Button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">Click to add elements to the template</p>
      </CardContent>
    </Card>
  )
}
