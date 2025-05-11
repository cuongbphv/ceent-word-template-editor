"use client"

import { TemplateEditor } from "@/components/template-editor"
import { 
  FileText, 
  HelpCircle, 
  User, 
  BookOpen, 
  FileUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeSwitcher } from "@/components/theme-switcher"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b dark:border-gray-800">
        <div className="container mx-auto py-3 px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileUp className="h-6 w-6 text-primary" />
            <h1 className="font-semibold text-xl">Ceent Word Editor Management</h1>
          </div>
          <div className="flex items-center gap-4">
            {/*<Button variant="ghost" size="sm" className="gap-1">*/}
            {/*  <HelpCircle className="h-4 w-4" />*/}
            {/*  <span className="hidden sm:inline">Help</span>*/}
            {/*</Button>*/}
            <ThemeSwitcher />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden md:inline">Cuong Bui</span>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <User className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main navigation */}
      <div className="border-b dark:border-gray-800">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-none bg-transparent p-0">
              <TabsTrigger 
                value="templates" 
                className="inline-flex items-center justify-center rounded-none border-b-2 border-b-transparent bg-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <FileText className="mr-2 h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger 
                value="library" 
                className="inline-flex items-center justify-center rounded-none border-b-2 border-b-transparent bg-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Library
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Page title and actions */}
      <div className="border-b bg-muted/40 dark:bg-gray-800/40">
        <div className="container mx-auto py-4 px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Template Editor</h2>
              <p className="text-sm text-muted-foreground">Create and manage Word document templates with form elements</p>
            </div>
            {/*<div className="flex items-center gap-2">*/}
            {/*  <Button size="sm" variant="outline">Cancel</Button>*/}
            {/*  <Button size="sm">Save Template</Button>*/}
            {/*</div>*/}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-grow bg-muted/20">
        <div className="container mx-auto py-6 px-4">
          {/* Instructions banner */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-lg mb-2">Getting Started with Ceent Word Editor Management</h3>
            <ol className="list-decimal list-inside text-blue-700 dark:text-blue-400 space-y-2 text-sm">
              <li><strong>Upload a Word Document</strong> - Start by uploading a .docx file containing <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{"{{variable}}"}</code> placeholders</li>
              <li><strong>Edit the Document</strong> - Review and edit the document content in the Document tab</li>
              <li><strong>Create Form Elements</strong> - Switch to the Form Designer tab and click on variables to create form controls</li>
              <li><strong>Arrange Form Elements</strong> - In the Form Editor tab, position your form elements by dragging them</li>
              <li><strong>Generate JSON</strong> - Go to the JSON tab to export the form structure for your application</li>
            </ol>
          </div>
          
          <TemplateEditor />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t dark:border-gray-800 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">© 2025 Ceent Word Editor Management. All rights reserved.</p>
            {/*<div className="flex items-center gap-4">*/}
            {/*  <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">Privacy</a>*/}
            {/*  <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">Terms</a>*/}
            {/*  <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">Contact</a>*/}
            {/*</div>*/}
          </div>
        </div>
      </footer>
    </div>
  )
}
