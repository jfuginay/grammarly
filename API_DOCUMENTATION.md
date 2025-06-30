# API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication APIs](#authentication-apis)
3. [Text Processing APIs](#text-processing-apis)
4. [Document Management APIs](#document-management-apis)
5. [React Components](#react-components)
6. [Custom Hooks](#custom-hooks)
7. [Utility Functions](#utility-functions)
8. [Database Schema](#database-schema)
9. [Types and Interfaces](#types-and-interfaces)

## Overview

This Next.js application provides AI-powered writing assistance with text analysis, spell checking, grammar correction, and tone analysis. The system includes user authentication, document management, and real-time text processing capabilities.

### Tech Stack
- **Framework**: Next.js 14 with Pages Router
- **Database**: PostgreSQL with Prisma ORM
- **AI Services**: OpenAI GPT-4 Turbo and GPT-4o-mini
- **Authentication**: JWT with HTTP-only cookies
- **UI**: React with Radix UI components and Tailwind CSS
- **Deployment**: Vercel

---

## Authentication APIs

### POST `/api/auth/login`

Authenticates a user and sets an HTTP-only cookie with JWT token.

**Request Body:**
```typescript
{
  email: string;      // User's email address
  password: string;   // User's password
}
```

**Response:**
```typescript
{
  message: string;
  user: {
    id: string;
    email: string;
  }
}
```

**Example:**
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword123'
  })
});

const data = await response.json();
if (response.ok) {
  console.log('Login successful:', data.user);
}
```

**Error Responses:**
- `400`: Missing email or password
- `401`: Invalid credentials
- `500`: Internal server error

---

### POST `/api/auth/signup`

Creates a new user account.

**Request Body:**
```typescript
{
  email: string;      // User's email address
  password: string;   // User's password (min 6 characters)
}
```

**Response:**
```typescript
{
  message: string;
  user: {
    id: string;
    email: string;
  }
}
```

**Example:**
```javascript
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newuser@example.com',
    password: 'securepassword123'
  })
});
```

---

### POST `/api/auth/logout`

Logs out the current user by clearing the authentication cookie.

**Example:**
```javascript
const response = await fetch('/api/auth/logout', {
  method: 'POST'
});
```

---

### GET `/api/auth/me`

Returns the current authenticated user's information.

**Response:**
```typescript
{
  user: {
    id: string;
    email: string;
  }
}
```

**Example:**
```javascript
const response = await fetch('/api/auth/me');
const data = await response.json();
if (response.ok) {
  console.log('Current user:', data.user);
}
```

---

## Text Processing APIs

### POST `/api/correct-text`

Analyzes text for grammar, spelling, style, and tone issues using AI.

**Request Body:**
```typescript
{
  text: string;  // Text to analyze (minimum 5 characters)
}
```

**Response:**
```typescript
{
  suggestions: Suggestion[];
  toneAnalysis?: ToneAnalysis;
  textAnalysis?: TextAnalysis;
}
```

**Types:**
```typescript
interface Suggestion {
  id: string;
  original: string;      // Original text that needs correction
  suggestion: string;    // Suggested improvement
  explanation: string;   // Friendly explanation of the change
  type: 'Spelling' | 'Grammar' | 'Style' | 'Punctuation' | 'Clarity';
  severity: 'High' | 'Medium' | 'Low';
  startIndex?: number;   // Character position in original text
  endIndex?: number;     // End character position
}

interface ToneAnalysis {
  overallTone: string;
  overallScore: number;
  highlightedSentences: ToneAnalysisHighlight[];
}

interface TextAnalysis {
  fragments: TextFragment[];  // Parsed text fragments with metadata
}
```

**Example:**
```javascript
const response = await fetch('/api/correct-text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "This is a sample text with some grammer errors."
  })
});

const analysis = await response.json();
console.log('Suggestions:', analysis.suggestions);
console.log('Tone:', analysis.toneAnalysis?.overallTone);
```

---

### POST `/api/spell-check`

Performs focused spelling analysis using GPT-4o-mini for cost-effective spell checking.

**Request Body:**
```typescript
{
  text: string;  // Text to spell-check (minimum 3 characters)
}
```

**Response:**
```typescript
{
  suggestions: SpellingSuggestion[];
  scanTime: number;      // Time taken for analysis in milliseconds
  nextScanIn: number;    // Seconds until next recommended scan
}

interface SpellingSuggestion {
  id: string;
  original: string;      // Misspelled word
  suggestion: string;    // Correct spelling
  explanation: string;   // Brief explanation
  type: 'Spelling';
  severity: 'High' | 'Medium' | 'Low';
  startIndex?: number;
  endIndex?: number;
}
```

**Example:**
```javascript
const response = await fetch('/api/spell-check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Definately recieve the seperate documents."
  })
});

const spellCheck = await response.json();
console.log('Spelling errors found:', spellCheck.suggestions.length);
```

---

### POST `/api/check-tone`

Analyzes the tone and emotional sentiment of text.

**Request Body:**
```typescript
{
  text: string;
}
```

**Response:**
```typescript
{
  overallTone: string;        // Overall tone assessment
  overallScore: number;       // Confidence score (0-1)
  highlightedSentences: ToneAnalysisHighlight[];
}

interface ToneAnalysisHighlight {
  sentence: string;
  tone: string;
  score: number;
  startIndex?: number;
  endIndex?: number;
}
```

**Example:**
```javascript
const response = await fetch('/api/check-tone', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "I'm absolutely thrilled about this amazing opportunity!"
  })
});

const toneAnalysis = await response.json();
console.log('Overall tone:', toneAnalysis.overallTone);
```

---

### POST `/api/engie-chat`

Interactive chat with Engie AI for writing assistance and ideation.

**Request Body:**
```typescript
{
  message: string;           // User's message
  context?: string;         // Optional context for better responses
  chatHistory?: ChatMessage[];  // Previous conversation history
}
```

**Response:**
```typescript
{
  response: string;         // Engie's response
  suggestions?: string[];   // Optional writing suggestions
}
```

**Example:**
```javascript
const response = await fetch('/api/engie-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Help me write a professional email to my client",
    context: "Following up on project delivery"
  })
});

const chat = await response.json();
console.log('Engie says:', chat.response);
```

---

## Document Management APIs

### GET `/api/documents`

Retrieves all documents for the authenticated user.

**Response:**
```typescript
{
  documents: Document[];
}

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;    // ISO date string
  updatedAt: string;    // ISO date string
  isStyleSample: boolean;
}
```

**Example:**
```javascript
const response = await fetch('/api/documents');
const data = await response.json();
console.log('User documents:', data.documents);
```

---

### POST `/api/documents`

Creates a new document.

**Request Body:**
```typescript
{
  title: string;
  content: string;
  isStyleSample?: boolean;  // Default: false
}
```

**Response:**
```typescript
{
  document: Document;
}
```

**Example:**
```javascript
const response = await fetch('/api/documents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "My New Document",
    content: "Document content here...",
    isStyleSample: false
  })
});
```

---

### GET `/api/documents/[id]`

Retrieves a specific document by ID.

**Response:**
```typescript
{
  document: Document;
}
```

**Example:**
```javascript
const response = await fetch('/api/documents/doc123');
const data = await response.json();
console.log('Document:', data.document);
```

---

### PUT `/api/documents/[id]`

Updates an existing document.

**Request Body:**
```typescript
{
  title?: string;
  content?: string;
  isStyleSample?: boolean;
}
```

**Example:**
```javascript
const response = await fetch('/api/documents/doc123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "Updated Title",
    content: "Updated content..."
  })
});
```

---

### DELETE `/api/documents/[id]`

Deletes a document.

**Example:**
```javascript
const response = await fetch('/api/documents/doc123', {
  method: 'DELETE'
});
```

---

## React Components

### EnhancedEditor

The main text editor component with AI-powered analysis and suggestions.

**Props:**
```typescript
interface EnhancedEditorProps {
  value: string;                    // Current text content
  onChange: (text: string) => void; // Text change handler
  suggestions: Suggestion[];        // Writing suggestions to display
  className?: string;               // Additional CSS classes
  placeholder?: string;             // Placeholder text
  toneHighlights?: ToneHighlight[]; // Tone analysis highlights
  autoAnalyze?: boolean;           // Auto-analyze text (default: true)
  readOnly?: boolean;              // Read-only mode (default: false)
  showFragments?: boolean;         // Show text fragments (default: false)
  isAnalysisBox?: boolean;         // Analysis display mode
  reflectTextFrom?: string;        // Text to reflect in analysis
  onSuggestionsFetched?: (suggestions: Suggestion[]) => void;
  onToneHighlightsFetched?: (highlights: ToneHighlight[]) => void;
  onSpellCheckSuggestions?: (suggestions: Suggestion[]) => void;
}
```

**Ref Methods:**
```typescript
interface EnhancedEditorRef {
  focus: () => void;
  applySuggestion: (suggestion: Suggestion) => void;
  getElement: () => HTMLTextAreaElement | null;
  analyzeText: () => Promise<void>;
  toggleFragmentsVisibility: () => void;
  clearAnalysis: () => void;
  undo: () => void;
  redo: () => void;
  toggleCountdownTimer: () => void;
  performSpellCheck: () => Promise<void>;
  getSpellingSuggestions: () => Suggestion[];
}
```

**Example:**
```tsx
import { EnhancedEditor } from '@/components/EnhancedEditor';
import { useRef, useState } from 'react';

function MyEditor() {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const editorRef = useRef<EnhancedEditorRef>(null);

  const handleSuggestionsFetched = (newSuggestions: Suggestion[]) => {
    setSuggestions(newSuggestions);
  };

  const handleApplySuggestion = (suggestion: Suggestion) => {
    editorRef.current?.applySuggestion(suggestion);
  };

  return (
    <EnhancedEditor
      ref={editorRef}
      value={text}
      onChange={setText}
      suggestions={suggestions}
      placeholder="Start writing..."
      autoAnalyze={true}
      onSuggestionsFetched={handleSuggestionsFetched}
    />
  );
}
```

---

### Button

Customizable button component with multiple variants and sizes.

**Props:**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;  // Render as child component
}
```

**Example:**
```tsx
import { Button } from '@/components/ui/button';

function MyComponent() {
  return (
    <div>
      <Button variant="default" size="lg">
        Primary Action
      </Button>
      <Button variant="outline" size="sm">
        Secondary Action
      </Button>
      <Button variant="ghost" size="icon">
        <IconComponent />
      </Button>
    </div>
  );
}
```

---

### ProtectedRoute

Wrapper component that ensures user authentication before rendering children.

**Props:**
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

**Example:**
```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

function Dashboard() {
  return (
    <ProtectedRoute>
      <div>
        <h1>Protected Dashboard Content</h1>
        {/* Only visible to authenticated users */}
      </div>
    </ProtectedRoute>
  );
}
```

---

### ThemeToggle

Toggle component for switching between light and dark themes.

**Example:**
```tsx
import { ThemeToggle } from '@/components/ThemeToggle';

function Header() {
  return (
    <header>
      <nav>
        {/* Other nav items */}
        <ThemeToggle />
      </nav>
    </header>
  );
}
```

---

### AnimatedEngieBot

Animated mascot component that provides visual feedback during text analysis.

**Props:**
```typescript
interface AnimatedEngieBotProps {
  isVisible: boolean;
  position: { top: number; left: number };
  direction: 'left' | 'right';
  animationState: 'idle' | 'walking';
  emotion: 'happy' | 'excited' | 'concerned' | 'thoughtful' | 'neutral';
  wordBeingChanged?: string | null;
}
```

**Example:**
```tsx
import { AnimatedEngieBot } from '@/components/AnimatedEngieBot';

function EditorWithBot() {
  const [botVisible, setBotVisible] = useState(false);
  const [botPosition, setBotPosition] = useState({ top: 100, left: 100 });

  return (
    <div>
      <AnimatedEngieBot
        isVisible={botVisible}
        position={botPosition}
        direction="right"
        animationState="walking"
        emotion="happy"
      />
    </div>
  );
}
```

---

### ExportButton

Component for exporting documents in various formats.

**Props:**
```typescript
interface ExportButtonProps {
  content: string;      // Content to export
  filename?: string;    // Export filename
  format?: 'txt' | 'docx' | 'pdf';  // Export format
}
```

**Example:**
```tsx
import { ExportButton } from '@/components/ExportButton';

function DocumentViewer({ document }) {
  return (
    <div>
      <ExportButton
        content={document.content}
        filename={document.title}
        format="docx"
      />
    </div>
  );
}
```

---

## Custom Hooks

### useAutoResizeTextarea

Automatically resizes textarea elements based on content.

**Parameters:**
```typescript
function useAutoResizeTextarea(
  textareaRef: RefObject<HTMLTextAreaElement>,
  value: string,
  minHeight?: number,  // Default: 150px
  maxHeight?: number   // Default: none
): void
```

**Example:**
```tsx
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import { useRef } from 'react';

function AutoResizingTextarea() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');

  useAutoResizeTextarea(textareaRef, value, 100, 400);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="This textarea will auto-resize..."
    />
  );
}
```

---

### useMediaQuery

Hook for responsive design based on CSS media queries.

**Parameters:**
```typescript
function useMediaQuery(query: string): boolean
```

**Example:**
```tsx
import { useMediaQuery } from '@/hooks/use-media-query';

function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
}
```

---

### useIsIFrame

Detects if the component is running inside an iframe.

**Returns:**
```typescript
function useIsIFrame(): boolean
```

**Example:**
```tsx
import { useIsIFrame } from '@/hooks/useIsIFrame';

function EmbeddableComponent() {
  const isInIFrame = useIsIFrame();

  return (
    <div>
      {isInIFrame ? (
        <div>Embedded view</div>
      ) : (
        <div>Standalone view</div>
      )}
    </div>
  );
}
```

---

## Utility Functions

### cn (className utility)

Combines and merges CSS classes using clsx and tailwind-merge.

**Function:**
```typescript
function cn(...inputs: ClassValue[]): string
```

**Example:**
```tsx
import { cn } from '@/lib/utils';

function StyledComponent({ className, isActive }) {
  return (
    <div 
      className={cn(
        'base-class p-4 rounded-md',
        isActive && 'bg-blue-500 text-white',
        className
      )}
    >
      Content
    </div>
  );
}
```

---

### Text Analysis Functions

Located in `@/lib/localTextAnalyzer`:

#### performLocalAnalysis

Analyzes text locally without API calls for immediate feedback.

**Function:**
```typescript
function performLocalAnalysis(text: string): {
  fragments: TextFragment[];
  shouldShowFragments: boolean;
}
```

**Example:**
```typescript
import { performLocalAnalysis } from '@/lib/localTextAnalyzer';

const text = "This is a sample text for analysis.";
const { fragments, shouldShowFragments } = performLocalAnalysis(text);

console.log('Text fragments:', fragments);
console.log('Should show fragments:', shouldShowFragments);
```

#### assignPriorities

Assigns priority levels to text fragments based on importance.

**Function:**
```typescript
function assignPriorities(
  fragments: TextFragment[], 
  text: string
): TextFragment[]
```

#### identifyPhrases

Identifies common phrases and grammatical constructs in text.

**Function:**
```typescript
function identifyPhrases(
  fragments: TextFragment[], 
  text: string
): void  // Modifies fragments in place
```

---

### CORS Utilities

#### setCorsHeaders

Sets appropriate CORS headers for API responses.

**Function:**
```typescript
function setCorsHeaders(
  res: NextApiResponse, 
  origin?: string
): void
```

**Example:**
```typescript
import { setCorsHeaders } from '@/lib/cors';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  setCorsHeaders(res, req.headers.origin);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Handle actual request...
}
```

---

## Database Schema

### User Model

```typescript
model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String
  createdAt    DateTime   @default(now())
  documents    Document[]
  styleProfile StyleProfile?
}
```

### Document Model

```typescript
model Document {
  id            String   @id @default(cuid())
  title         String
  content       String   @db.Text
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  author        User     @relation(fields: [authorId], references: [id])
  authorId      String
  isStyleSample Boolean  @default(false)
}
```

### StyleProfile Model

```typescript
model StyleProfile {
  id        String   @id @default(cuid())
  summary   String?  @db.Text
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id])
  userId    String   @unique
}
```

---

## Types and Interfaces

### Core Types

```typescript
// Chat and messaging
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Writing suggestions
interface Suggestion {
  id: string;
  original: string;
  suggestion: string;
  explanation: string;
  type: 'Spelling' | 'Grammar' | 'Style' | 'Punctuation' | 'Clarity';
  severity: 'High' | 'Medium' | 'Low';
  startIndex?: number;
  endIndex?: number;
}

// Tone analysis
interface ToneAnalysis {
  overallTone: string;
  overallScore: number;
  highlightedSentences: ToneAnalysisHighlight[];
}

interface ToneAnalysisHighlight {
  sentence: string;
  tone: string;
  score: number;
  startIndex?: number;
  endIndex?: number;
}

// Text fragments
interface TextFragment {
  text: string;
  startIndex: number;
  endIndex: number;
  type: 'word' | 'phrase' | 'punctuation' | 'space' | 'paragraph';
  partOfSpeech?: string;
  priority?: 1 | 2 | 3;
  confidence?: number;
}

// Engie bot animations
type BotEmotion = 'happy' | 'excited' | 'concerned' | 'thoughtful' | 'neutral';
type BotAnimationState = 'idle' | 'walking';
type BotDirection = 'left' | 'right';
```

### Component Props Types

```typescript
// Engie component props
interface EngieProps {
  suggestions: Suggestion[];
  onApply: (suggestion: Suggestion) => void;
  onDismiss: (suggestionId: string) => void;
  onIdeate: () => void;
  targetEditorSelector?: string;
  onIdea?: (idea: string) => void;
  documents: Array<{ id: string; title: string }>;
}

// Enhanced Editor props (see React Components section for full interface)
interface EnhancedEditorProps {
  value: string;
  onChange: (text: string) => void;
  suggestions: Suggestion[];
  // ... other props
}
```

---

## Error Handling

### API Error Responses

All APIs follow consistent error response patterns:

```typescript
// Standard error response
{
  message: string;  // Human-readable error message
}

// Common HTTP status codes:
// 400 - Bad Request (invalid input)
// 401 - Unauthorized (authentication required)
// 403 - Forbidden (insufficient permissions)
// 404 - Not Found (resource doesn't exist)
// 405 - Method Not Allowed (wrong HTTP method)
// 500 - Internal Server Error
```

### Client-Side Error Handling

```typescript
// Example error handling pattern
async function apiCall() {
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Handle error appropriately
    throw error;
  }
}
```

---

## Environment Variables

Required environment variables for the application:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"

# OpenAI API
OPENAI_API_KEY="sk-your-openai-api-key"

# Deployment (Vercel)
VERCEL_URL="your-app.vercel.app"  # Set automatically by Vercel
```

---

## Rate Limiting and Performance

### API Rate Limits

- Text analysis APIs: Designed for real-time use with debouncing
- Spell check: Optimized with GPT-4o-mini for cost efficiency
- Chat APIs: Suitable for interactive conversations

### Performance Optimizations

- **Debounced Analysis**: Text analysis triggers after 2 seconds of inactivity
- **Local Analysis**: Immediate feedback using client-side analysis
- **Smart Caching**: Avoids redundant API calls for unchanged text
- **Parallel Processing**: Tone and grammar analysis run concurrently

---

## Security Considerations

### Authentication
- JWT tokens stored in HTTP-only cookies
- Secure cookie settings in production
- Password hashing with bcrypt

### API Security
- CORS headers properly configured
- Input validation on all endpoints
- SQL injection protection via Prisma ORM
- Rate limiting (implement as needed)

### Data Privacy
- User documents are private and isolated
- No sensitive data in client-side code
- Secure API key management

---

## Getting Started

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd <project-directory>

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Set up database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

### Basic Usage Example

```tsx
import { useState } from 'react';
import { EnhancedEditor } from '@/components/EnhancedEditor';
import { Button } from '@/components/ui/button';

function WritingApp() {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleSuggestionsFetched = (newSuggestions) => {
    setSuggestions(newSuggestions);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">AI Writing Assistant</h1>
      
      <EnhancedEditor
        value={text}
        onChange={setText}
        suggestions={suggestions}
        placeholder="Start writing your document..."
        onSuggestionsFetched={handleSuggestionsFetched}
        autoAnalyze={true}
      />
      
      <div className="mt-4 flex gap-2">
        <Button onClick={() => console.log('Save document')}>
          Save Document
        </Button>
        <Button variant="outline" onClick={() => setText('')}>
          Clear
        </Button>
      </div>
      
      {suggestions.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold">Suggestions ({suggestions.length})</h3>
          <ul className="mt-2 space-y-1">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id} className="text-sm">
                {suggestion.explanation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

This documentation provides comprehensive coverage of all public APIs, components, and functions in the codebase with practical examples and usage instructions.