# AI Flow Migration Plan: Text Response → Structured Object Generation

## 🎯 **Objective**
Migrate from `generateText()` with manual JSON parsing to `generateObject()` with Zod schema validation for improved reliability, type safety, and maintainability.

---

## 📋 **Current State Analysis**

### **Current Implementation:**
- Uses `generateText()` from Vercel AI SDK
- Manual JSON parsing with `parseGenerateResponse()` function
- Fallback parsing for non-JSON responses
- Complex error handling for malformed responses
- Retry logic for validation failures

### **Current Issues:**
- Manual JSON parsing is error-prone
- Complex fallback logic for malformed responses
- No guaranteed response structure
- Difficult to maintain parsing logic
- Type safety issues

---

## 🚀 **Migration Plan - 4 Phases**

### **Phase 1: Dependencies & Setup** ⚙️
**Goal:** Install required dependencies and prepare the foundation

#### **Tasks:**
1. **Install Zod dependency**
   ```bash
   npm install zod
   ```

2. **Update imports in `ai-providers.ts`**
   - Add `generateObject` import from 'ai'
   - Add Zod imports for schema validation

3. **Create Zod schemas**
   - Define schema for diagram generation response
   - Define schema for diagram editing response
   - Add proper TypeScript types

#### **Files to modify:**
- `package.json` (via npm install)
- `src/lib/ai-providers.ts`

#### **Estimated time:** 30 minutes

---

### **Phase 2: Schema Definition & Type Safety** 📝
**Goal:** Define robust schemas and improve type safety

#### **Tasks:**
1. **Create Zod schemas**
   ```typescript
   const DiagramGenerationSchema = z.object({
     description: z.string().describe('Detailed architecture explanation in markdown'),
     plantuml: z.string().describe('Valid PlantUML code starting with @startuml'),
     diagramType: z.enum(['component', 'deployment', 'class', 'sequence', 'usecase', 'activity', 'state'])
   })

   const DiagramEditSchema = z.object({
     plantuml: z.string().describe('Modified PlantUML code'),
     changes: z.string().describe('Summary of changes made')
   })
   ```

2. **Update TypeScript interfaces**
   - Ensure types match Zod schemas
   - Add proper return types for functions

3. **Create schema validation helpers**
   - Error handling for schema validation
   - Type inference from schemas

#### **Files to modify:**
- `src/lib/ai-providers.ts`
- `src/lib/types.ts` (if needed)

#### **Estimated time:** 45 minutes

---

### **Phase 3: Migration of Generation Function** 🔄
**Goal:** Replace `generateText()` with `generateObject()` for diagram generation

#### **Tasks:**
1. **Update `generateDiagram()` function**
   - Replace `generateText()` with `generateObject()`
   - Use Zod schema for validation
   - Remove manual JSON parsing logic

2. **Simplify prompts**
   - Remove JSON format instructions from prompts
   - Focus on content rather than format
   - Leverage schema descriptions for AI guidance

3. **Update error handling**
   - Handle Zod validation errors
   - Simplify retry logic
   - Better error messages

4. **Remove obsolete functions**
   - Delete `parseGenerateResponse()` function
   - Remove fallback parsing logic

#### **Files to modify:**
- `src/lib/ai-providers.ts`

#### **Code example:**
```typescript
const result = await generateObject({
  model,
  schema: DiagramGenerationSchema,
  prompt: createGeneratePrompt(description, diagramType, attempt, lastError),
  temperature: 0.7,
})

// result.object is now typed and validated!
const { description, plantuml, diagramType } = result.object
```

#### **Estimated time:** 1 hour

---

### **Phase 4: Migration of Edit Function & Cleanup** 🧹
**Goal:** Complete migration and clean up remaining code

#### **Tasks:**
1. **Update `editDiagram()` function**
   - Replace `generateText()` with `generateObject()`
   - Use DiagramEditSchema for validation
   - Remove manual parsing

2. **Update prompt functions**
   - `createGeneratePrompt()` - remove JSON format instructions
   - `createEditPrompt()` - remove JSON format instructions
   - Focus on schema descriptions

3. **Testing & Validation**
   - Test all diagram types
   - Verify error handling
   - Ensure backwards compatibility

4. **Code cleanup**
   - Remove unused functions
   - Update comments and documentation
   - Clean up imports

#### **Files to modify:**
- `src/lib/ai-providers.ts`
- Remove test files if any remain

#### **Estimated time:** 1 hour

---

## 📊 **Expected Benefits**

### **Reliability Improvements:**
- ✅ Guaranteed response structure
- ✅ Automatic validation
- ✅ Built-in retry for invalid schemas
- ✅ No more JSON parsing errors

### **Code Quality:**
- ✅ Cleaner, more maintainable code
- ✅ Better type safety
- ✅ Reduced complexity
- ✅ Better error messages

### **Developer Experience:**
- ✅ IntelliSense support
- ✅ Compile-time type checking
- ✅ Easier debugging
- ✅ Simplified testing

---

## 🎯 **Success Criteria**

### **Phase 1 Complete:**
- [ ] Zod installed and imported
- [ ] Schemas defined
- [ ] No build errors

### **Phase 2 Complete:**
- [ ] All schemas properly typed
- [ ] Type safety improved
- [ ] Schema validation working

### **Phase 3 Complete:**
- [ ] `generateDiagram()` using `generateObject()`
- [ ] Manual parsing removed
- [ ] Generation working correctly

### **Phase 4 Complete:**
- [ ] `editDiagram()` using `generateObject()`
- [ ] All prompts updated
- [ ] Code fully cleaned up
- [ ] All tests passing

---

## 🚨 **Risk Mitigation**

### **Backup Strategy:**
- Keep current implementation in a backup branch
- Implement migration incrementally
- Test each phase thoroughly

### **Rollback Plan:**
- Each phase can be rolled back independently
- Keep git commits small and focused
- Document any issues encountered

---

## ⏱️ **Timeline**
- **Total estimated time:** 3-4 hours
- **Recommended approach:** One phase per session
- **Testing time:** Additional 1 hour for thorough testing

---

## 📝 **Notes**
- This migration will significantly improve code reliability
- The new approach aligns with Vercel AI SDK best practices
- Future maintenance will be much easier
- Response validation becomes automatic

---

*Created: September 2, 2025*
*Status: Ready for implementation*
