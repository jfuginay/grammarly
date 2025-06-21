# Enhanced Scanning Status Indicator

## Overview
This design enhances the current countdown timer with additional features including status messages, scan controls, and customization options while maintaining a non-intrusive presence in the editor.

## Core Components

### 1. Timer Component (Compact View)
- **Circular Progress Ring**: Shows scan countdown progress at a glance
- **State Transitions**: 
  - Countdown: Green → Yellow → Orange gradient as time progresses
  - Scanning: Blue pulsing animation
  - Processing: Purple wave animation with subtle AI pattern
  - Results: Green success state with suggestion count
- **Micro-Interactions**: Subtle animations for state changes, hover effects, and focus states
- **Position**: Bottom-right corner, floating above the text

### 2. Status Panel (Expanded View)
- **Detailed Status Messages**:
  - "Next scan in 2.5s..." with live countdown
  - "Scanning your text..." with loading animation
  - "Processing with AI..." with subtle neural network animation
  - "Found 3 suggestions" with categorized counts
- **Suggestion Preview**: Miniature preview of the first suggestion
- **Recent Activity**: Small log of recent scans and findings
- **Expansion Trigger**: Hover or click on the compact timer to expand

### 3. User Controls
- **Quick Actions**:
  - "Scan Now" button with lightning icon
  - Pause/Resume toggle with intuitive play/pause icons
  - Settings access with subtle gear icon
- **Settings Panel**:
  - Scan interval slider (1-10 seconds)
  - Toggle for automatic scanning
  - Toggle for different analysis types
  - Scan sensitivity controls

## Interaction Design

### Compact → Expanded Transition
1. User hovers over or clicks the compact timer
2. Timer smoothly expands with a subtle animation
3. Additional controls and information fade in
4. Background slightly dims to focus attention on panel

### Status Updates
1. Status changes are communicated through:
   - Color transitions
   - Icon changes
   - Micro-animations
   - Text updates
2. Each state has a distinct visual identity while maintaining cohesion

### User Control Flow
1. Timer shows countdown by default
2. User can click "Scan Now" to trigger immediate analysis
3. Toggle switch to pause/resume automatic scanning
4. Settings gear expands to reveal more customization options

## Visual Design

### Color Palette
- **Primary States**:
  - Waiting: #10b981 (Green)
  - Countdown: #eab308 (Yellow) → #f59e0b (Orange)
  - Scanning: #3b82f6 (Blue)
  - Processing: #8b5cf6 (Purple)
  - Success: #10b981 (Green)
  - Error: #ef4444 (Red)
- **UI Elements**:
  - Background: rgba(255, 255, 255, 0.95) with subtle shadow
  - Text: #1f2937 (Dark Gray)
  - Secondary Text: #64748b (Medium Gray)
  - Accents: #3b82f6 (Blue)

### Typography
- **Primary Font**: System UI font stack for optimal performance
- **Weights**: 600 for numbers, 500 for status, 400 for descriptions
- **Sizes**:
  - Compact Timer: 18px for numbers
  - Status Text: 14px
  - Controls: 12px
  - Settings: 12px

### Layout
- **Compact Size**: 48px × 48px circular element
- **Expanded Size**: 280px × auto (height adjusts to content)
- **Spacing**: 16px margins and 8px padding for comfortable reading
- **Positioning**: 16px from bottom and right edges in editor

## Accessibility Considerations

- **Screen Readers**:
  - Comprehensive ARIA roles and labels
  - Announcements for state changes
  - Keyboard focus management
- **Motion Sensitivity**:
  - respects `prefers-reduced-motion` setting
  - All animations optional and subtle
- **Color Blindness**:
  - Uses both color and shape to communicate status
  - Meets WCAG AA contrast requirements
- **Keyboard Navigation**:
  - Full functionality without mouse interaction
  - Clear focus indicators

## Technical Implementation

### Component Structure
- React component composition with:
  - `ScanStatusIndicator` (parent)
  - `TimerRing` (visual countdown)
  - `StatusPanel` (expanded information)
  - `ControlsBar` (user actions)
  - `SettingsPanel` (customization)

### Styling
- CSS Modules for component-specific styling
- CSS variables for theming
- CSS transitions and keyframe animations
- Media queries for responsive adaptation

### State Management
- React hooks for local state
- Context API for global scanning preferences
- Custom hooks for timer logic and animation coordination

## Mobile Considerations
- Larger touch targets (min 44×44px)
- Simplified expanded view
- Position adjusts to avoid virtual keyboard
- Collapses automatically after interaction on small screens

## Implementation Phases

### Phase 1: Enhanced Timer
- Upgrade existing timer with improved visuals
- Add suggestion count indicator
- Implement hover expansion

### Phase 2: Status Messages
- Add detailed status text panel
- Implement state-specific animations
- Connect to analysis engine for real-time updates

### Phase 3: User Controls
- Add Scan Now button
- Implement pause/resume functionality
- Create basic settings controls

### Phase 4: Advanced Features
- Add suggestion preview
- Implement scan history log
- Add advanced customization options
