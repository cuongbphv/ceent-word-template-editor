"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Wand2, ArrowRight } from "lucide-react"

interface ApiSettingsProps {
  apiEndpoint: string
  setApiEndpoint: (endpoint: string) => void
  onLoadData: () => void
}

export function ApiSettings({ apiEndpoint, setApiEndpoint, onLoadData }: ApiSettingsProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium block mb-1">API Endpoint</label>
        <Input
          value={apiEndpoint}
          onChange={(e) => setApiEndpoint(e.target.value)}
          placeholder="https://api.example.com/data"
          className="text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button 
          onClick={onLoadData} 
          disabled={!apiEndpoint} 
          className="flex items-center justify-center gap-1"
        >
          <ArrowRight className="h-4 w-4" />
          <span>Load Data</span>
        </Button>
        <Button 
          onClick={onLoadData} 
          variant="outline" 
          className="flex items-center justify-center gap-1"
        >
          <Wand2 className="h-4 w-4" />
          <span>Preview with Mock</span>
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
        <span className="text-xs text-gray-500 dark:text-gray-400">OR</span>
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
      </div>
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded p-3">
        <p className="text-xs text-blue-700 dark:text-blue-400">
          Use the "Preview with Mock" button to generate random data for your template variables without an API.
        </p>
      </div>
    </div>
  )
}
