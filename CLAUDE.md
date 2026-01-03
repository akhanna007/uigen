# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

UIGen is an AI-powered React component generator with live preview. It uses Claude AI (via Anthropic API) to generate React components based on user prompts, with a virtual file system that never writes to disk and real-time preview capabilities.

## Setup & Development Commands

### Initial Setup
```bash
npm run setup
```
Runs all necessary setup: installs dependencies, generates Prisma client, and runs database migrations.

### Development
```bash
npm run dev
```
Starts Next.js development server with Turbopack on port 3000.

```bash
npm run dev:daemon
```
Starts dev server in background, logs to `logs.txt`.

### Building & Deployment
```bash
npm run build
npm run start
```

### Testing
```bash
npm test
```
Runs Vitest tests in watch mode.

### Linting
```bash
npm run lint
```

### Database
```bash
npm run db:reset
```
Resets the database (SQLite) - use with caution.

## Architecture

### Core Flow: AI-Powered Component Generation

1. **User Input**: User describes a component in `ChatInterface` (src/components/chat/)
2. **API Route**: POST to `/api/chat/route.ts` with messages and current file system state
3. **AI Processing**:
   - Uses Anthropic's Claude Haiku 4.5 (or mock provider if no API key)
   - System prompt from `src/lib/prompts/generation.tsx` instructs AI to create React components
   - AI has access to two tools:
     - `str_replace_editor`: View, create, edit files (src/lib/tools/str-replace.ts)
     - `file_manager`: Rename/delete files (src/lib/tools/file-manager.ts)
4. **Virtual File System**: All operations happen in-memory via `VirtualFileSystem` class (src/lib/file-system.ts)
5. **Live Preview**:
   - `PreviewFrame` component watches file system changes
   - `jsx-transformer.ts` transforms JSX/TSX to ES modules using Babel
   - Creates import maps with blob URLs for modules
   - Renders in sandboxed iframe with Tailwind CSS

### Virtual File System (VFS)

The entire component generation happens in a **virtual file system** (src/lib/file-system.ts) that never writes to disk:
- File tree stored in memory as `Map<string, FileNode>`
- Supports create, read, update, delete, rename operations
- Serializes to JSON for database persistence
- Root is always `/`, paths are normalized
- Supports path aliases: `@/` maps to root `/`

### State Management

Two React contexts manage global state:
- **FileSystemContext** (src/lib/contexts/file-system-context.tsx): Manages VFS state, provides file operations
- **ChatContext** (src/lib/contexts/chat-context.tsx): Manages chat messages and streaming responses

### Preview System

The preview rendering is sophisticated:
1. Files transformed from JSX/TSX to ES modules via Babel (src/lib/transform/jsx-transformer.ts)
2. Each transformed file becomes a blob URL
3. Import map created mapping file paths to blob URLs
4. External deps (React, etc.) mapped to esm.sh CDN
5. CSS files collected and injected as `<style>` tags
6. Tailwind CSS loaded from CDN
7. Entry point (App.jsx) loaded in sandboxed iframe with error boundary

### Database Schema

The database schema is defined in `prisma/schema.prisma`. Reference this file anytime you need to understand the structure of data stored in the database.

Prisma with SQLite:
- **User**: Email/password auth (bcrypt hashed)
- **Project**: Belongs to user (optional - anonymous projects allowed), stores messages and VFS data as JSON strings

Generated Prisma client outputs to `src/generated/prisma` (non-standard location).

### Authentication

JWT-based auth (src/lib/auth.ts):
- Uses `jose` library for JWT
- Tokens stored in HTTP-only cookies
- Anonymous mode supported - projects can exist without user

### AI Provider System

src/lib/provider.ts:
- If `ANTHROPIC_API_KEY` is set: Uses Claude Haiku 4.5 via `@ai-sdk/anthropic`
- If not set: Uses `MockLanguageModel` that returns hardcoded components
- Mock provider useful for development without API costs

### File Structure

```
src/
├── actions/          - Server actions for projects (create, get)
├── app/             - Next.js app router pages
│   ├── api/chat/    - AI chat API route
│   └── [projectId]/ - Dynamic project page
├── components/
│   ├── auth/        - Sign in/up forms, auth dialog
│   ├── chat/        - Chat interface, messages, markdown
│   ├── editor/      - Code editor (Monaco), file tree
│   ├── preview/     - Preview iframe component
│   └── ui/          - shadcn/ui components
├── lib/
│   ├── contexts/    - React contexts (FileSystem, Chat)
│   ├── prompts/     - AI system prompts
│   ├── tools/       - AI tool definitions (str_replace, file_manager)
│   ├── transform/   - JSX transformation & import map creation
│   ├── file-system.ts  - Virtual file system implementation
│   ├── auth.ts      - JWT authentication
│   ├── provider.ts  - AI provider (Anthropic or mock)
│   └── prisma.ts    - Prisma client singleton
└── generated/prisma/ - Generated Prisma client
```

## Key Patterns

### Path Aliasing
All local imports use `@/` alias mapping to `src/`:
```typescript
import { VirtualFileSystem } from '@/lib/file-system'
```

### AI Tool System
AI tools follow Vercel AI SDK pattern:
- Defined with Zod schemas for parameters
- Execute function receives validated params
- Return string results to AI

### Component Generation Prompt
AI is instructed to:
- Always create `/App.jsx` as entry point with default export
- Use Tailwind CSS for styling (no inline styles)
- Use `@/` import alias for local files
- Keep responses brief
- Never create HTML files (iframe provides that)

### Testing
- Vitest with React Testing Library
- Tests in `__tests__` folders alongside components
- jsdom environment for DOM testing

### Code Style
- Use comments sparingly. Only comment complex code.

## Common Patterns for Modifications

### Adding a New AI Tool
1. Create tool in `src/lib/tools/your-tool.ts`
2. Define Zod schema for parameters
3. Implement execute function that operates on VFS
4. Register in `src/app/api/chat/route.ts` tools object

### Adding File System Operations
Extend `VirtualFileSystem` class in `src/lib/file-system.ts` with new methods following the existing pattern (normalize paths, check existence, update parent maps).

### Modifying Preview Behavior
Edit `src/lib/transform/jsx-transformer.ts`:
- `transformJSX`: Handles Babel transformation
- `createImportMap`: Maps file paths to blob URLs
- `createPreviewHTML`: Generates iframe HTML

### Changing AI Behavior
Edit `src/lib/prompts/generation.tsx` to modify the system prompt that instructs Claude on how to generate components.
