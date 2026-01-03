# UIGen User Guide

Welcome to UIGen! This guide will help you get the most out of your AI-powered React component generator.

## Table of Contents

- [Getting Started](#getting-started)
- [Creating Your First Component](#creating-your-first-component)
- [Understanding the Interface](#understanding-the-interface)
- [Working with the AI](#working-with-the-ai)
- [File System and Code Editor](#file-system-and-code-editor)
- [Best Practices](#best-practices)
- [Tips and Tricks](#tips-and-tricks)
- [Troubleshooting](#troubleshooting)

## Getting Started

### First Time Setup

1. **Launch the application:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 in your browser

2. **Choose your mode:**
   - **Sign Up/Sign In:** Create an account to save your projects permanently
   - **Continue as Guest:** Start immediately without registration (projects are temporary)

### Your First Project

When you first open UIGen, you'll see:
- A chat interface on the left
- An empty preview panel on the right
- A "New Project" button in the header

## Creating Your First Component

### Step 1: Describe What You Want

In the chat interface, describe the component you want to create. Be as specific or general as you like:

**Simple Example:**
```
Create a contact form with name, email, and message fields
```

**Detailed Example:**
```
Create a modern contact form with:
- Name field (required)
- Email field with validation (required)
- Phone number field (optional)
- Message textarea (required, max 500 chars)
- Submit button that shows a success message
- Use a card layout with shadows
- Add smooth animations on field focus
```

### Step 2: Watch the AI Work

You'll see:
1. AI thinking about your request (streaming response)
2. Files being created in the virtual file system
3. Live preview updating in real-time

### Step 3: Iterate and Refine

Continue the conversation to refine your component:

```
Make the submit button blue instead of gray
Add a loading state when submitting
Can you add form validation with error messages?
```

## Understanding the Interface

### Main Layout

The UIGen interface consists of four main areas:

#### 1. Header Bar
- **Project Name:** Click to rename
- **New Project:** Start fresh
- **Account Menu:** Sign in/out, view projects

#### 2. Chat Panel (Left Side)
- Message input at the bottom
- Conversation history above
- AI responses with code snippets

#### 3. Preview/Code Panel (Right Side)
Two tabs to switch between:
- **Preview:** Live rendering of your component
- **Code:** File tree and code editor

#### 4. File System (Code Tab)
- Tree view of all files
- Click files to view/edit
- Right-click for file operations (coming soon)

### Navigation

- **Switch Views:** Click "Preview" or "Code" tabs
- **Expand/Collapse:** Use the resize handle between panels
- **File Navigation:** Click files in the tree to open them

## Working with the AI

### How to Communicate Effectively

#### Be Specific When Needed
```
Good: "Create a product card with image, title, price, and add-to-cart button"
Vague: "Make a card"
```

#### Iterate Gradually
```
1. "Create a simple counter component"
2. "Add increment and decrement buttons"
3. "Add a reset button"
4. "Make it look modern with Tailwind"
```

#### Request Specific Styles
```
"Use a gradient background from blue to purple"
"Make it responsive for mobile devices"
"Add hover effects to all buttons"
```

### What the AI Can Do

The AI can:
- Create new React components (`.jsx`, `.tsx`)
- Create utility functions and helpers
- Add CSS files for custom styles
- Modify existing files
- Rename or delete files
- Import and use components between files
- Use Tailwind CSS for styling
- Add interactivity with React hooks

### What the AI Knows

The AI has access to:
- Your entire virtual file system
- All previous messages in the conversation
- React, React hooks, and common patterns
- Tailwind CSS utilities
- Project guidelines from `CLAUDE.md`

### File System Constraints

Important to know:
- The entry point must be `/App.jsx` with a default export
- Files exist only in memory (virtual file system)
- Use `@/` for local imports: `import Button from '@/components/Button'`
- External libraries are available via CDN (React, etc.)

## File System and Code Editor

### Virtual File System

UIGen uses a virtual file system that exists only in memory:
- **No files are written to disk** during generation
- All files are stored in your browser or database
- Perfect for experimentation and iteration

### Creating Files

The AI creates files automatically, but you can also:
1. Ask the AI: `"Create a new file called utils/helpers.js"`
2. The AI will create the file and populate it

### Editing Files

**Option 1: Ask the AI**
```
"In the Button component, change the padding to 16px"
"Add a new prop called 'variant' to the Card component"
```

**Option 2: Manual Editing**
1. Switch to the "Code" tab
2. Click on a file in the file tree
3. Edit the code directly in the editor
4. Changes are saved automatically
5. Preview updates in real-time

### File Organization

Best practices for organizing your files:
```
/App.jsx                    (entry point - required)
/components/
  /Button.jsx
  /Card.jsx
  /Form.jsx
/utils/
  /helpers.js
  /validation.js
/styles/
  /custom.css
```

## Best Practices

### 1. Start Simple, Then Enhance

```
Step 1: "Create a basic todo list"
Step 2: "Add the ability to mark items as complete"
Step 3: "Add filtering (all, active, completed)"
Step 4: "Make it look beautiful with animations"
```

### 2. Be Clear About Styling Preferences

Specify if you want:
- Specific colors or color schemes
- Particular layout styles (grid, flex, etc.)
- Responsive behavior
- Animations or transitions

### 3. Save Your Work

- **Registered Users:** Projects are saved automatically to the database
- **Guest Users:** Projects are temporary; sign up to save permanently
- **Export:** Use the export feature to download your code (coming soon)

### 4. Use Tailwind CSS

The preview includes Tailwind CSS by default:
```
"Style the button with: bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
```

### 5. Test as You Go

After each change, check the preview:
- Click buttons to test interactions
- Resize the browser to test responsiveness
- Check the console for errors

## Tips and Tricks

### Fast Iteration

For quick changes, be direct:
```
"Make it bigger"
"Change the color to red"
"Center everything"
"Add more spacing"
```

### Complex Components

Break down complex requests:
```
Instead of: "Create a complete e-commerce product page"

Try:
1. "Create a product image gallery"
2. "Add product details and pricing"
3. "Add an add-to-cart form"
4. "Add related products section"
```

### Debugging

If something doesn't work:
```
"There's an error in the console, can you fix it?"
"The button click isn't working"
"The form isn't validating properly"
```

### Learning React

Use UIGen to learn React patterns:
```
"Show me how to use useState for a counter"
"Create an example of useEffect fetching data"
"Demonstrate how to pass props between components"
```

### Reusing Components

Create reusable components:
```
"Create a reusable Button component with props for size and color"
"Make a Card component that accepts children"
```

## Troubleshooting

### Preview Not Updating

**Issue:** Changes aren't reflected in the preview

**Solutions:**
1. Check the browser console for errors
2. Ask the AI: "There's an error, can you help?"
3. Refresh the page
4. Start a new project if issues persist

### Import Errors

**Issue:** "Module not found" errors

**Solutions:**
- Ensure you're using the `@/` alias for local imports
- Example: `import Button from '@/components/Button'`
- Ask the AI to fix: "Fix the import error in App.jsx"

### Styling Not Applied

**Issue:** Styles don't appear as expected

**Solutions:**
1. Verify Tailwind classes are correct
2. Check for CSS conflicts
3. Ask: "The styling isn't working, can you check?"

### AI Not Understanding

**Issue:** AI creates something different than expected

**Solutions:**
1. Be more specific in your description
2. Provide examples: "Like a Netflix card layout"
3. Iterate: "That's close, but make the buttons smaller"
4. Reference existing code: "Update the Card component to match the style of Button"

### Lost Work

**Issue:** Accidentally navigated away

**Solutions:**
- **Registered users:** Your projects are saved automatically
- **Guest users:** Projects may be lost; consider signing up
- Check "My Projects" in the account menu

## Advanced Features

### Multi-File Projects

Create complex applications with multiple files:
```
"Create a todo app with:
- App.jsx as the main component
- components/TodoList.jsx for the list
- components/TodoItem.jsx for individual items
- components/AddTodo.jsx for the input form
- utils/storage.js for localStorage helpers"
```

### State Management

Request specific patterns:
```
"Use useState to manage the todos array"
"Implement a reducer pattern with useReducer"
"Add context for theme switching"
```

### API Integration

Simulate API calls:
```
"Create a component that fetches user data from an API"
"Add a form that posts data to an endpoint"
"Show loading and error states"
```

### Responsive Design

Request mobile-first designs:
```
"Make it responsive with mobile, tablet, and desktop layouts"
"Stack vertically on mobile, grid on desktop"
"Hide the sidebar on mobile"
```

## Getting Help

### In-App Help

Ask the AI directly:
```
"How do I add routing?"
"What's the best way to handle forms in React?"
"Show me how to add animations"
```

### Project Guidelines

The AI follows the project's `CLAUDE.md` guidelines, which include:
- Code style preferences
- Import patterns
- File organization
- Best practices

### Community and Support

- **GitHub Issues:** Report bugs or request features
- **GitHub Discussions:** Ask questions and share projects
- **Documentation:** Check `CLAUDE.md` for technical details

## Next Steps

Now that you understand UIGen:

1. **Experiment:** Try creating different types of components
2. **Learn:** Use it as a React learning tool
3. **Build:** Create real components for your projects
4. **Share:** Export and use your generated code

Happy component generating! 🚀
