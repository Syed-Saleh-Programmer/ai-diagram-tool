# Auto-Retry Implementation for Invalid PlantUML Generation

## Overview
Implemented auto-retry functionality to handle cases where the AI generates invalid/wrong PlantUML code. The system now automatically retries up to 4 times with enhanced validation and error handling.

## Changes Made

### 1. Enhanced AI Providers (`src/lib/ai-providers.ts`)
- **Added MAX_RETRIES constant**: Set to 4 attempts maximum
- **Implemented retry logic** for both `generateDiagram()` and `editDiagram()` functions
- **Enhanced prompt engineering**: Prompts now include retry context and error feedback
- **Validation integration**: Each attempt validates PlantUML syntax and rendering capability
- **Exponential backoff**: Waits between retries (1s, 2s, 4s, 8s)
- **Error context**: Passes previous error details to AI for better retry attempts

### 2. Enhanced PlantUML Validation (`src/lib/plantuml.ts`)
- **Comprehensive syntax checking**: 
  - @startuml/@enduml presence and order
  - Balanced brackets, parentheses, and braces
  - Unterminated strings detection
  - Invalid identifier checking
  - Diagram-specific syntax validation
- **Detailed error reporting**: Specific line numbers and error descriptions
- **Diagram type validation**: Ensures diagrams contain expected elements

### 3. Updated API Routes
#### Generate Route (`src/app/api/generate/route.ts`)
- **Enhanced error handling**: Specific messages for retry exhaustion
- **User-friendly error messages**: Clearer guidance when retries fail

#### Edit Route (`src/app/api/edit/route.ts`)
- **Enhanced error handling**: Specific messages for edit retry failures
- **Removed duplicate validation**: Now handled in the retry logic
- **Better error messages**: More helpful feedback for users

### 4. Frontend Improvements
#### useDiagram Hook (`src/hooks/use-diagram.ts`)
- **Enhanced error parsing**: Better handling of retry-related error messages
- **Improved error propagation**: Maintains detailed error information

#### TextOutput Component (`src/components/TextOutput.tsx`)
- **Enhanced error display**: Special UI for retry-related errors
- **User guidance**: Suggestions for resolving retry failures
- **Visual improvements**: Better error iconography and layout

## Retry Flow

### Generation Process:
1. **Attempt 1**: Standard prompt with normal parameters
2. **Attempt 2-4**: Enhanced prompt with previous error context
3. **Each attempt includes**:
   - PlantUML syntax validation
   - Rendering capability test
   - Error context for next attempt
4. **If all attempts fail**: Return detailed error with user guidance

### Validation Steps per Attempt:
1. **Basic validation**: Empty check, start/end tags
2. **Syntax validation**: Brackets, strings, identifiers
3. **Rendering test**: Quick PlantUML service validation
4. **Diagram-specific validation**: Type-appropriate content checking

## Error Messages

### User-Facing Errors:
- **Retry exhaustion**: "Failed to generate valid PlantUML diagram after multiple attempts..."
- **Edit retry exhaustion**: "Failed to generate valid PlantUML after multiple editing attempts..."
- **With guidance**: Includes suggestions for resolution

### Developer Errors:
- **Console logs**: Detailed attempt information and error context
- **Error propagation**: Maintains error chain for debugging

## Benefits

1. **Improved Success Rate**: AI gets multiple chances to generate valid PlantUML
2. **Learning from Mistakes**: Each retry includes context about previous failures
3. **Better User Experience**: Clear error messages with actionable guidance
4. **Robust Validation**: Comprehensive checking prevents invalid diagrams
5. **Smart Retries**: Only retries on validation/rendering errors, not API errors

## Configuration

```typescript
const MAX_RETRIES = 4; // Maximum retry attempts
```

The system uses exponential backoff:
- Attempt 1: Immediate
- Attempt 2: 2 seconds delay
- Attempt 3: 4 seconds delay  
- Attempt 4: 8 seconds delay

## Testing

To test the retry functionality:
1. Generate diagrams with complex descriptions
2. Monitor console logs for retry attempts
3. Check error messages for proper guidance
4. Verify valid PlantUML generation success rate

## Future Enhancements

1. **Retry analytics**: Track retry success rates
2. **Adaptive prompts**: Learn from common failure patterns
3. **Partial recovery**: Attempt to fix specific syntax errors
4. **User retry controls**: Allow manual retry configuration
