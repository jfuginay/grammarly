# Engie - Refactored OOP Architecture

This directory contains the refactored Engie feature using Object-Oriented Programming principles. The original monolithic 1000+ line component has been broken down into smaller, more manageable pieces with clear separation of concerns.

## Architecture Overview

### Core Classes

#### `EngieController` (`core/EngieController.ts`)
- **Purpose**: Main business logic controller that orchestrates all Engie operations
- **Responsibilities**: 
  - Handles all user interactions and events
  - Coordinates between different services
  - Manages the overall flow of the application
  - Provides cleanup methods for proper resource management

#### `EngieStateManager` (`core/EngieStateManager.ts`)
- **Purpose**: Centralized state management with observer pattern
- **Responsibilities**:
  - Maintains all application state
  - Provides subscription mechanism for state changes
  - Offers computed properties and state derivations
  - Handles state updates with proper notifications

### Service Classes

#### `EngieApiService` (`services/EngieApiService.ts`)
- **Purpose**: Handles all API communications
- **Pattern**: Singleton pattern for efficient resource usage
- **Responsibilities**:
  - Fetches suggestions from grammar/spelling APIs
  - Handles tone analysis requests
  - Manages chat API interactions
  - Processes style analysis requests

#### `TextExtractorService` (`services/TextExtractorService.ts`)
- **Purpose**: Handles DOM text extraction logic
- **Pattern**: Singleton pattern
- **Responsibilities**:
  - Extracts text from specific DOM elements
  - Handles full page text extraction
  - Filters out unwanted elements (scripts, styles, Engie UI)

### UI Components

#### `EngieBot` (`EngieBot.tsx`)
- **Purpose**: Main component that renders the draggable bot
- **Responsibilities**:
  - Manages the controller instance
  - Handles React lifecycle and state subscription
  - Renders the bot with animations and status indicators

#### `EngieChatWindow` (`ui/EngieChatWindow.tsx`)
- **Purpose**: Main chat interface component
- **Responsibilities**:
  - Renders the chat window with animations
  - Manages tab navigation
  - Coordinates between different tab components

#### Tab Components
- `SuggestionsTab` - Handles suggestion display and interactions
- `ToneTab` - Shows tone analysis results
- `VoiceTab` - Manages voice profile and document selection

#### Card Components
- `IdeationCard` - Displays AI-generated ideas
- `EncouragementCard` - Shows encouragement messages

#### `EngieNotifications` (`ui/EngieNotifications.tsx`)
- **Purpose**: Handles notification display logic
- **Responsibilities**:
  - Shows notification badges and popouts
  - Manages notification dismissal

### Types (`types.ts`)
Centralized type definitions for all interfaces and types used throughout the system.

## Key Benefits of This Architecture

### 1. **Separation of Concerns**
- Business logic is separated from UI rendering
- API calls are isolated in dedicated service classes
- State management is centralized and predictable

### 2. **Maintainability**
- Each file has a single, clear responsibility
- Easy to locate and modify specific functionality
- Reduced cognitive load when working on individual features

### 3. **Testability**
- Services can be easily mocked for testing
- Controller logic can be tested independently of UI
- State management can be tested in isolation

### 4. **Reusability**
- Services can be reused across different components
- UI components are modular and composable
- State management patterns can be applied elsewhere

### 5. **Scalability**
- Easy to add new features without affecting existing code
- Clear extension points for new functionality
- Proper resource cleanup prevents memory leaks

## Usage

The refactored architecture maintains backward compatibility. The original `Engie.tsx` now acts as a simple wrapper:

```typescript
import { EngieBot } from './engie/EngieBot';
import { EngieProps } from './engie/types';

const Engie: React.FC<EngieProps> = (props) => {
  return <EngieBot {...props} />;
};
```

## File Structure

```
src/components/engie/
├── README.md                    # This documentation
├── index.ts                     # Main exports
├── types.ts                     # Type definitions
├── EngieBot.tsx                 # Main component
├── core/
│   ├── EngieController.ts       # Business logic controller
│   └── EngieStateManager.ts     # State management
├── services/
│   ├── EngieApiService.ts       # API service
│   └── TextExtractorService.ts  # Text extraction service
└── ui/
    ├── EngieChatWindow.tsx      # Main chat interface
    ├── EngieNotifications.tsx   # Notification system
    ├── cards/
    │   ├── IdeationCard.tsx     # Ideation display
    │   └── EncouragementCard.tsx # Encouragement display
    └── tabs/
        ├── SuggestionsTab.tsx   # Suggestions interface
        ├── ToneTab.tsx          # Tone analysis display
        └── VoiceTab.tsx         # Voice profile interface
```

This architecture transforms a monolithic 1000+ line component into a well-organized, maintainable system with clear responsibilities and proper separation of concerns. 