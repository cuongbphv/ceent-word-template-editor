export interface Template {
  id: string
  name: string
  file: File
  content: string
  htmlContent?: string
  processedAt?: string
  variables?: string[]
}

export interface FormElement {
  id: string
  type: "input" | "textarea" | "dropdown"
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  properties: {
    label: string
    variableName: string
    options?: string[]
  }
}

export interface DocumentVariable {
  name: string
  value: string
  description?: string
  isUsed?: boolean
}
