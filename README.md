# Ceent Word Editor Management

A powerful web application for creating, editing, and managing Word document templates with dynamic form fields. This project allows you to upload Word documents, define variable placeholders, create form elements, and preview the filled templates - all within your browser.

## Features

- 📄 Upload and edit Word documents directly in your browser
- 🔄 Create dynamic templates with variable placeholders
- 🖍️ Design interactive forms based on document variables
- 👁️ Preview templates with real or mock data
- 🧩 Export form structures as JSON for integration with other systems
- 🌓 Full dark mode support
- 📱 Responsive design for desktop and mobile devices

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/cuongbphv/ceent-word-template-editor.git
   cd ceent-word-template-editor
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
word-template-manager/
├── app/                    # Next.js app directory
├── components/             # React components
│   ├── ui/                 # UI components (from shadcn/ui)
│   ├── document-editor.tsx # Word document editor
│   ├── template-editor.tsx # Main template editor component
│   ├── word-editor.tsx     # Word content editor
│   └── ...
├── lib/                    # Utility functions
│   ├── document-processor.ts # Word processing utilities
│   ├── types.ts            # TypeScript type definitions
│   └── utils.ts            # General utility functions
├── public/                 # Static assets
├── styles/                 # CSS styles
│   └── word-editor.css     # Word editor specific styles
└── ...
```

## Template Creation Workflow

### 1. Upload a Word Document

1. Navigate to the **Document** tab
2. Upload an existing Word document (.docx/.doc) using the upload area
3. Your document will be converted to HTML and displayed in the editor
4. The system automatically detects any existing variables in the format `{{variableName}}`

### 2. Edit Your Document

In the **Document** tab, you can modify your document using the rich text editor:

1. Use the formatting toolbar to style your text (bold, italic, lists, etc.)
2. Add variables by typing `{{variableName}}` (they will be automatically highlighted)
3. Edit existing variables by modifying the text inside the double curly braces
4. Switch between **Visual Mode** and **Source Mode** to edit the raw HTML if needed
5. Click **Save** to save your changes

### 3. Design Your Form

In the **Form Editor** tab:

1. Create form elements for your variables using the Form Designer
2. Drag and position form elements on the canvas
3. Resize elements as needed
4. Configure properties like labels, variable names, and field types

### 4. Preview Your Template

The **Preview** tab allows you to see how your template will look with data:

1. Configure an API endpoint or use the **Generate Mock Data** button
2. View the document with variables replaced by actual values
3. See form elements as they would appear in the final form

### 5. Export JSON Structure

The **JSON** tab provides a structured representation of your template and form:

1. View the complete JSON structure that defines your template, variables, and form elements
2. Copy or download the JSON for integration with other systems

## Working with Variables

Variables in your document must follow this format: `{{variableName}}`

Examples:
- `{{firstName}}`
- `{{address}}`
- `{{orderDate}}`

The system automatically detects variable types based on their names and generates appropriate mock data.

## Development

### Technologies Used

- **Next.js** - React framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - UI component collection
- **Quill.js** - Rich text editor
- **mammoth.js** - Word document processing

### Adding New Features

1. **New UI Components**: Add new components to the `components/ui` directory following the shadcn/ui pattern
2. **New Document Processing Features**: Extend the functionality in `lib/document-processor.ts`
3. **New Form Element Types**: Update the FormElement type in `lib/types.ts` and add rendering support in relevant components

### Environment Variables

No environment variables are required for basic functionality.

## Testing

Run the test suite:

```bash
npm test
# or
yarn test
# or
pnpm test
```

## Building for Production

Build the application for production:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

Start the production server:

```bash
npm start
# or
yarn start
# or
pnpm start
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Quill.js](https://quilljs.com/) for the rich text editor
- [mammoth.js](https://github.com/mwilliamson/mammoth.js) for Word document processing
- [shadcn/ui](https://ui.shadcn.com/) for the UI components
- [Tailwind CSS](https://tailwindcss.com/) for the styling
- [Next.js](https://nextjs.org/) for the application framework

---

For more information or support, please open an issue in the GitHub repository.
