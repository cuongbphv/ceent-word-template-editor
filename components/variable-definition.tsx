"use client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { FormElement } from "@/lib/types"

interface VariableDefinitionProps {
  elements: FormElement[]
  updateElement: (id: string, updates: Partial<FormElement>) => void
  variables: Record<string, string>
  setVariables: (variables: Record<string, string>) => void
  selectedElement: FormElement | null
  elementProperties: {
    label: string
    variableName: string
    options?: string[]
  }
  setElementProperties: (properties: {
    label: string
    variableName: string
    options?: string[]
  }) => void
  onCancelEdit: () => void
}

export function VariableDefinition({
  elements,
  updateElement,
  variables,
  setVariables,
  selectedElement,
  elementProperties,
  setElementProperties,
  onCancelEdit,
}: VariableDefinitionProps) {
  const handlePropertyChange = (property: string, value: string) => {
    setElementProperties({
      ...elementProperties,
      [property]: value,
    })
  }

  const handleOptionsChange = (optionsText: string) => {
    const options = optionsText.split("\n").filter((option) => option.trim() !== "")
    setElementProperties({
      ...elementProperties,
      options,
    })
  }

  const saveElementProperties = () => {
    if (!selectedElement) return

    updateElement(selectedElement.id, {
      properties: elementProperties,
    })

    // Update variables mapping
    if (elementProperties.variableName) {
      setVariables({
        ...variables,
        [elementProperties.variableName]: "",
      })
    }

    onCancelEdit()
  }

  const handleElementSelect = (element: FormElement) => {
    setElementProperties({
      label: element.properties.label,
      variableName: element.properties.variableName,
      options: element.properties.options,
    })
  }

  return (
    <div className="space-y-4">
      {selectedElement ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1">Label</label>
            <Input
              value={elementProperties.label}
              onChange={(e) => handlePropertyChange("label", e.target.value)}
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Variable Name</label>
            <Input
              value={elementProperties.variableName}
              onChange={(e) => handlePropertyChange("variableName", e.target.value)}
              className="text-sm"
              placeholder="e.g. firstName, address, etc."
            />
          </div>

          {selectedElement.type === "dropdown" && (
            <div>
              <label className="text-xs font-medium block mb-1">Options (one per line)</label>
              <textarea
                value={elementProperties.options?.join("\n") || ""}
                onChange={(e) => handleOptionsChange(e.target.value)}
                className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={() => onCancelEdit()}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveElementProperties}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-2">Select an element to edit its properties</p>
          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {elements.map((element) => (
              <div
                key={element.id}
                className="flex justify-between items-center p-2 text-sm border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                onClick={() => handleElementSelect(element)}
              >
                <div>
                  <span className="font-medium">{element.properties.label}</span>
                  {element.properties.variableName && (
                    <span className="text-xs text-gray-500 ml-2">{`{{${element.properties.variableName}}}`}</span>
                  )}
                </div>
                <span className="text-xs text-gray-400 capitalize">{element.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
